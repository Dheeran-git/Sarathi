"""
benefit_portability — Cross-state benefit mapping for migrant workers.

Routes:
  POST /portability/check   — find equivalent schemes in destination state
  POST /portability/suggest — proactive migration suggestions for a citizen

Uses DynamoDB SarathiSchemes table for scheme lookup.
Uses Bedrock (Nova Pro) for natural language explanations.
Includes retry/backoff, structured logging, CORS headers.
"""
import json
import os
import re
import time
import boto3
from datetime import datetime, timezone
from decimal import Decimal
from boto3.dynamodb.conditions import Attr

REGION = 'us-east-1'
BEDROCK_MODEL_ID = os.environ.get('BEDROCK_MODEL_ID', 'amazon.nova-pro-v1:0')
BEDROCK_GUARDRAIL_ID = os.environ.get('BEDROCK_GUARDRAIL_ID', '')
BEDROCK_GUARDRAIL_VERSION = os.environ.get('BEDROCK_GUARDRAIL_VERSION', '1')
SCHEMES_TABLE = os.environ.get('SCHEMES_TABLE', 'SarathiSchemes')

dynamodb = boto3.resource('dynamodb', region_name=REGION)
schemes_table = dynamodb.Table(SCHEMES_TABLE)
bedrock = boto3.client('bedrock-runtime', region_name=REGION)

# Prompt injection patterns
_INJECTION_PATTERNS = [
    r'ignore\s+(all\s+)?previous\s+instructions',
    r'you\s+are\s+now\s+a',
    r'system\s*:\s*',
    r'OVERRIDE\s+SYSTEM',
    r'forget\s+(all\s+)?instructions',
]
_INJECTION_RE = re.compile('|'.join(_INJECTION_PATTERNS), re.IGNORECASE)


class DecimalEncoder(json.JSONEncoder):
    def default(self, o):
        if isinstance(o, Decimal):
            return int(o) if o % 1 == 0 else float(o)
        return super().default(o)


def cors_headers():
    return {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Amz-Date,X-Api-Key',
        'Access-Control-Allow-Methods': 'GET,POST,PATCH,OPTIONS',
        'Content-Type': 'application/json',
    }


def _response(status, body):
    return {
        'statusCode': status,
        'headers': cors_headers(),
        'body': json.dumps(body, cls=DecimalEncoder),
    }


def _sanitize(text):
    if not text:
        return text
    return _INJECTION_RE.sub('[FILTERED]', text)


def _invoke_bedrock(prompt, caller='portability', max_tokens=700, temperature=0.3):
    """Invoke Bedrock with retry/backoff, structured logging, and sanitization."""
    prompt = _sanitize(prompt)
    payload = {
        "messages": [{"role": "user", "content": [{"text": prompt}]}],
        "inferenceConfig": {"maxTokens": max_tokens, "temperature": temperature},
    }
    kwargs = dict(
        modelId=BEDROCK_MODEL_ID,
        body=json.dumps(payload),
        contentType='application/json',
        accept='application/json',
    )
    if BEDROCK_GUARDRAIL_ID:
        kwargs['guardrailIdentifier'] = BEDROCK_GUARDRAIL_ID
        kwargs['guardrailVersion'] = BEDROCK_GUARDRAIL_VERSION

    last_err = None
    for attempt in range(3):
        try:
            start_ts = time.time()
            resp = bedrock.invoke_model(**kwargs)
            latency_ms = int((time.time() - start_ts) * 1000)
            result = json.loads(resp['body'].read())
            content = result.get('output', {}).get('message', {}).get('content', [])
            text = content[0].get('text', '') if content else ''
            usage = result.get('usage', {})
            print(json.dumps({
                'ai_invocation': True,
                'caller': caller,
                'model': BEDROCK_MODEL_ID,
                'inputTokens': usage.get('inputTokens', 0),
                'outputTokens': usage.get('outputTokens', 0),
                'latencyMs': latency_ms,
                'attempt': attempt + 1,
            }))
            return text
        except Exception as e:
            last_err = e
            if attempt < 2:
                time.sleep(2 ** attempt)
                print(f"[WARN] Bedrock retry {attempt + 1}/3 ({caller}): {e}")
    raise last_err


# ---------------------------------------------------------------------------
# Scheme lookup helpers
# ---------------------------------------------------------------------------

def _fetch_all_schemes():
    """Scan SarathiSchemes table and return all published schemes."""
    all_schemes = []
    try:
        resp = schemes_table.scan(
            FilterExpression=Attr('status').eq('Published'),
        )
        all_schemes.extend(resp.get('Items', []))
        while 'LastEvaluatedKey' in resp:
            resp = schemes_table.scan(
                FilterExpression=Attr('status').eq('Published'),
                ExclusiveStartKey=resp['LastEvaluatedKey'],
            )
            all_schemes.extend(resp.get('Items', []))
    except Exception as e:
        print(f"[WARN] Failed to fetch schemes: {e}")
    return all_schemes


def _schemes_for_state(all_schemes, state):
    """Filter schemes available in a given state (or Central/All)."""
    state_lower = state.strip().lower()
    matched = []
    for scheme in all_schemes:
        scheme_type = str(scheme.get('type', '')).lower()
        scheme_states = scheme.get('state', [])

        # Normalize state list
        if isinstance(scheme_states, str):
            scheme_states = [scheme_states]
        states_lower = [s.strip().lower() for s in scheme_states]

        # Central schemes apply everywhere
        if scheme_type == 'central' or 'all' in states_lower or state_lower in states_lower:
            matched.append(scheme)
    return matched


def _scheme_summary(scheme):
    """Compact scheme dict for API response."""
    return {
        'id': scheme.get('schemeId', scheme.get('id', '')),
        'name': scheme.get('nameEnglish', scheme.get('name', '')),
        'nameHindi': scheme.get('nameHindi', ''),
        'category': scheme.get('category', ''),
        'annualBenefit': int(scheme.get('annualBenefit', 0) or 0),
        'benefitType': scheme.get('benefitType', ''),
        'ministry': scheme.get('ministry', ''),
        'type': scheme.get('type', 'Central'),
        'state': scheme.get('state', ['All']),
        'applyUrl': scheme.get('applyUrl', ''),
    }


def _find_equivalent_schemes(current_schemes, destination_schemes):
    """
    Match schemes between current state and destination state.
    Returns: auto_transfer (Central), need_reapply (state-specific equivalents),
             no_equivalent (unique to source state).
    """
    auto_transfer = []
    need_reapply = []
    no_equivalent = []

    dest_ids = set(s.get('schemeId', s.get('id', '')) for s in destination_schemes)
    dest_categories = {}
    for s in destination_schemes:
        cat = s.get('category', 'Other')
        dest_categories.setdefault(cat, []).append(s)

    for scheme in current_schemes:
        scheme_id = scheme.get('schemeId', scheme.get('id', ''))
        scheme_type = str(scheme.get('type', '')).lower()

        # Central schemes transfer automatically
        if scheme_type == 'central':
            auto_transfer.append({
                'source': _scheme_summary(scheme),
                'destination': _scheme_summary(scheme),
                'transferType': 'automatic',
                'note': 'Central scheme — benefits continue in all states.',
            })
            continue

        # State scheme — look for equivalent in destination by category
        if scheme_id in dest_ids:
            # Same scheme available in destination
            auto_transfer.append({
                'source': _scheme_summary(scheme),
                'destination': _scheme_summary(scheme),
                'transferType': 'automatic',
                'note': 'Scheme available in both states.',
            })
            continue

        cat = scheme.get('category', 'Other')
        equivalents = dest_categories.get(cat, [])
        if equivalents:
            # Category match — suggest re-application
            best_match = max(equivalents, key=lambda x: int(x.get('annualBenefit', 0) or 0))
            need_reapply.append({
                'source': _scheme_summary(scheme),
                'suggestedEquivalent': _scheme_summary(best_match),
                'transferType': 'reapply',
                'note': f'Similar scheme found in destination state under {cat} category.',
            })
        else:
            no_equivalent.append({
                'source': _scheme_summary(scheme),
                'transferType': 'none',
                'note': f'No equivalent found in destination state for this {cat} scheme.',
            })

    return auto_transfer, need_reapply, no_equivalent


# ---------------------------------------------------------------------------
# Bedrock explanation
# ---------------------------------------------------------------------------

def _generate_portability_explanation(
    current_state, destination_state, auto_transfer, need_reapply, no_equivalent
):
    """Generate a human-readable Bedrock explanation of benefit portability."""
    auto_names = [a['source']['name'] for a in auto_transfer]
    reapply_names = [r['source']['name'] + ' -> ' + r['suggestedEquivalent']['name']
                     for r in need_reapply]
    no_eq_names = [n['source']['name'] for n in no_equivalent]

    prompt = (
        f"You are a welfare migration advisor for Indian migrant workers.\n\n"
        f"A citizen is moving from {current_state} to {destination_state}.\n\n"
        f"Benefits that transfer automatically ({len(auto_transfer)}):\n"
        f"{chr(10).join('- ' + n for n in auto_names) if auto_names else '- None'}\n\n"
        f"Benefits that need re-application ({len(need_reapply)}):\n"
        f"{chr(10).join('- ' + n for n in reapply_names) if reapply_names else '- None'}\n\n"
        f"Benefits with no equivalent ({len(no_equivalent)}):\n"
        f"{chr(10).join('- ' + n for n in no_eq_names) if no_eq_names else '- None'}\n\n"
        f"Generate a clear, simple explanation for a rural worker covering:\n"
        f"1. Which benefits will continue automatically when they move\n"
        f"2. Which benefits they need to re-apply for in {destination_state}, with brief steps\n"
        f"3. Which benefits they will lose, and any alternatives\n"
        f"4. One important tip for migrant workers about welfare portability\n\n"
        f"Use simple language. Keep under 300 words. Use Hindi terms in parentheses where helpful."
    )

    try:
        return _invoke_bedrock(prompt, caller='portability_explanation')
    except Exception as e:
        print(f"[WARN] Portability explanation failed: {e}")
        return (
            f"Moving from {current_state} to {destination_state}: "
            f"{len(auto_transfer)} benefits transfer automatically, "
            f"{len(need_reapply)} need re-application, "
            f"{len(no_equivalent)} have no equivalent. "
            f"Visit your nearest CSC center for help with re-enrollment."
        )


def _generate_migration_suggestions(citizen_profile, current_schemes, destination_state):
    """Proactive suggestions for a migrating citizen."""
    profile_parts = []
    if citizen_profile.get('name'):
        profile_parts.append(f"Name: {citizen_profile['name']}")
    if citizen_profile.get('age'):
        profile_parts.append(f"Age: {citizen_profile['age']}")
    if citizen_profile.get('occupation') or citizen_profile.get('persona'):
        profile_parts.append(f"Occupation: {citizen_profile.get('occupation') or citizen_profile.get('persona')}")
    if citizen_profile.get('income') or citizen_profile.get('monthlyIncome'):
        profile_parts.append(f"Monthly income: {citizen_profile.get('income') or citizen_profile.get('monthlyIncome')}")

    scheme_names = [s.get('nameEnglish', s.get('name', '')) for s in current_schemes[:10]]

    prompt = (
        f"You are a welfare advisor for Indian migrant workers.\n\n"
        f"Citizen profile:\n{chr(10).join(profile_parts) if profile_parts else 'Not provided'}\n\n"
        f"Current schemes enrolled ({len(scheme_names)}):\n"
        f"{chr(10).join('- ' + n for n in scheme_names) if scheme_names else '- None'}\n\n"
        f"Destination state: {destination_state}\n\n"
        f"Provide proactive migration suggestions:\n"
        f"1. BEFORE_MOVING: 3-4 things to do before leaving (documents to collect, offices to visit)\n"
        f"2. AFTER_ARRIVAL: 3-4 immediate steps in the new state\n"
        f"3. NEW_OPPORTUNITIES: 2-3 welfare schemes in {destination_state} they may qualify for\n"
        f"4. IMPORTANT_CONTACTS: Key helpline numbers and offices\n\n"
        f"Be specific to Indian welfare system. Use simple language. Keep under 350 words."
    )

    try:
        return _invoke_bedrock(prompt, caller='migration_suggestions', max_tokens=800)
    except Exception as e:
        print(f"[WARN] Migration suggestions failed: {e}")
        return (
            f"Before moving to {destination_state}: collect Aadhaar, ration card, BPL certificate. "
            f"After arrival: visit nearest CSC/e-Seva center for scheme re-enrollment. "
            f"Call 1800-111-555 (UMANG helpline) for assistance."
        )


# ---------------------------------------------------------------------------
# Lambda handler
# ---------------------------------------------------------------------------

def lambda_handler(event, context):
    method = event.get('httpMethod', '')
    path = event.get('path', '') or event.get('resource', '')

    if method == 'OPTIONS':
        return _response(200, {})

    if method != 'POST':
        return _response(405, {'error': f'Method not allowed: {method}'})

    try:
        body = json.loads(event.get('body', '{}')) if isinstance(event.get('body'), str) else event

        # POST /portability/check
        if 'check' in path:
            citizen_id = str(body.get('citizenId', '')).strip()
            current_state = str(body.get('currentState', '')).strip()
            destination_state = str(body.get('destinationState', '')).strip()
            current_scheme_ids = body.get('currentSchemeIds', [])

            if not current_state or not destination_state:
                return _response(400, {
                    'error': 'currentState and destinationState are required'
                })

            print(json.dumps({
                'portability_check_started': True,
                'citizenId': citizen_id,
                'currentState': current_state,
                'destinationState': destination_state,
                'timestamp': datetime.now(timezone.utc).isoformat(),
            }))

            # Fetch all published schemes
            all_schemes = _fetch_all_schemes()

            # Get schemes for both states
            source_schemes = _schemes_for_state(all_schemes, current_state)
            dest_schemes = _schemes_for_state(all_schemes, destination_state)

            # If citizen provided specific scheme IDs, filter source to those
            if current_scheme_ids:
                id_set = set(current_scheme_ids)
                source_schemes = [
                    s for s in source_schemes
                    if s.get('schemeId', s.get('id', '')) in id_set
                ]

            # Find equivalents
            auto_transfer, need_reapply, no_equivalent = _find_equivalent_schemes(
                source_schemes, dest_schemes
            )

            # Generate Bedrock explanation
            explanation = _generate_portability_explanation(
                current_state, destination_state,
                auto_transfer, need_reapply, no_equivalent
            )

            # Calculate benefit summary
            auto_value = sum(a['source'].get('annualBenefit', 0) for a in auto_transfer)
            at_risk_value = (
                sum(r['source'].get('annualBenefit', 0) for r in need_reapply) +
                sum(n['source'].get('annualBenefit', 0) for n in no_equivalent)
            )

            print(json.dumps({
                'portability_check_completed': True,
                'citizenId': citizen_id,
                'autoTransferCount': len(auto_transfer),
                'needReapplyCount': len(need_reapply),
                'noEquivalentCount': len(no_equivalent),
                'timestamp': datetime.now(timezone.utc).isoformat(),
            }))

            return _response(200, {
                'citizenId': citizen_id,
                'currentState': current_state,
                'destinationState': destination_state,
                'autoTransfer': auto_transfer,
                'needReapply': need_reapply,
                'noEquivalent': no_equivalent,
                'summary': {
                    'autoTransferCount': len(auto_transfer),
                    'needReapplyCount': len(need_reapply),
                    'noEquivalentCount': len(no_equivalent),
                    'totalSchemesChecked': len(source_schemes),
                    'benefitRetainedValue': auto_value,
                    'benefitAtRiskValue': at_risk_value,
                },
                'explanation': explanation,
                'checkedAt': datetime.now(timezone.utc).isoformat(),
            })

        # POST /portability/suggest
        if 'suggest' in path:
            citizen_id = str(body.get('citizenId', '')).strip()
            destination_state = str(body.get('destinationState', '')).strip()
            citizen_profile = body.get('citizenProfile', {})
            current_schemes = body.get('currentSchemes', [])

            if not destination_state:
                return _response(400, {'error': 'destinationState is required'})

            print(json.dumps({
                'portability_suggest_started': True,
                'citizenId': citizen_id,
                'destinationState': destination_state,
                'timestamp': datetime.now(timezone.utc).isoformat(),
            }))

            suggestions = _generate_migration_suggestions(
                citizen_profile, current_schemes, destination_state
            )

            # Also find new schemes they could access in destination
            all_schemes = _fetch_all_schemes()
            dest_schemes = _schemes_for_state(all_schemes, destination_state)
            new_opportunities = [
                _scheme_summary(s) for s in dest_schemes
                if s.get('type', '').lower() == 'state'
            ][:10]

            return _response(200, {
                'citizenId': citizen_id,
                'destinationState': destination_state,
                'suggestions': suggestions,
                'newOpportunities': new_opportunities,
                'newOpportunitiesCount': len(new_opportunities),
                'generatedAt': datetime.now(timezone.utc).isoformat(),
            })

        return _response(404, {'error': f'Route not found: {method} {path}'})

    except Exception as e:
        print(f"[ERR] benefit_portability: {e}")
        return _response(500, {'error': 'Internal server error', 'message': str(e)})
