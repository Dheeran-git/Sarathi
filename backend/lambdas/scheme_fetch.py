"""
scheme_fetch — GET /scheme/{schemeId}, GET /scheme/all, POST /scheme/search-ai, POST /scheme/compare
AI-powered scheme search and comparison using Bedrock.
"""
import json
import os
import re
import time
import boto3
from decimal import Decimal

REGION = 'us-east-1'
ORCHESTRATOR_AGENT_ID = os.environ.get('ORCHESTRATOR_AGENT_ID', 'JWIEP70LX8')
ORCHESTRATOR_AGENT_ALIAS_ID = os.environ.get('ORCHESTRATOR_AGENT_ALIAS_ID', 'R5S1HHR88R')
BEDROCK_MODEL_ID = os.environ.get('BEDROCK_MODEL_ID', 'amazon.nova-pro-v1:0')

dynamodb = boto3.resource('dynamodb', region_name=REGION)
table = dynamodb.Table('SarathiSchemes')
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


def _sanitize(text):
    if not text:
        return text
    return _INJECTION_RE.sub('[FILTERED]', text)


def _invoke_bedrock(prompt, max_tokens=600):
    """Invoke Bedrock with retry."""
    payload = {
        "messages": [{"role": "user", "content": [{"text": prompt}]}],
        "inferenceConfig": {"maxTokens": max_tokens, "temperature": 0.3},
    }
    last_err = None
    for attempt in range(3):
        try:
            start_ts = time.time()
            resp = bedrock.invoke_model(
                modelId=BEDROCK_MODEL_ID,
                body=json.dumps(payload),
                contentType='application/json',
                accept='application/json',
            )
            latency_ms = int((time.time() - start_ts) * 1000)
            result = json.loads(resp['body'].read())
            content = result.get('output', {}).get('message', {}).get('content', [])
            text = content[0].get('text', '') if content else ''
            usage = result.get('usage', {})
            print(json.dumps({
                'ai_invocation': True, 'caller': 'scheme_search',
                'model': BEDROCK_MODEL_ID,
                'inputTokens': usage.get('inputTokens', 0),
                'outputTokens': usage.get('outputTokens', 0),
                'latencyMs': latency_ms,
            }))
            return text
        except Exception as e:
            last_err = e
            if attempt < 2:
                time.sleep(2 ** attempt)
    raise last_err


def _fetch_all_schemes():
    """Fetch all published schemes."""
    response = table.scan()
    items = response.get('Items', [])
    while 'LastEvaluatedKey' in response:
        response = table.scan(ExclusiveStartKey=response['LastEvaluatedKey'])
        items.extend(response.get('Items', []))
    # Include items with status='Published' OR no status field (legacy seed data).
    # Only exclude items with an explicit non-published status (e.g., 'Draft').
    return [item for item in items if item.get('status', 'Published') != 'Draft']


def handle_ai_search(event):
    """POST /scheme/search-ai — natural language scheme search."""
    body = json.loads(event.get('body', '{}')) if isinstance(event.get('body'), str) else event
    query = _sanitize(body.get('query', '').strip())
    citizen_profile = body.get('citizenProfile', {})

    if not query:
        return {'statusCode': 400, 'headers': cors_headers(), 'body': json.dumps({'error': 'query is required'})}

    # Get all schemes
    all_schemes = _fetch_all_schemes()

    # Heuristic pre-filter: find schemes that mention query keywords
    keywords = set(re.findall(r'\w+', query.lower()))
    if citizen_profile:
        for val in citizen_profile.values():
            if isinstance(val, str):
                keywords.update(re.findall(r'\w+', val.lower()))

    # Score schemes by keyword match
    scored_candidates = []
    for s in all_schemes:
        text = (
            f"{s.get('nameEnglish','')} {s.get('briefDescription','')} "
            f"{s.get('categories','')} {s.get('state','')} {s.get('ministry','')}"
        ).lower()
        score = sum(1 for kw in keywords if kw in text)
        scored_candidates.append((score, s))

    # Sort by score and take top 80
    scored_candidates.sort(key=lambda x: x[0], reverse=True)
    top_candidates = [x[1] for x in scored_candidates[:80]]

    # Build a compact scheme catalog for the prompt
    catalog = []
    for s in top_candidates:
        catalog.append(f"ID:{s.get('schemeId','')} | {s.get('nameEnglish','')} | {str(s.get('briefDescription',''))[:60]} | Benefit:₹{s.get('annualBenefit',0)}/yr")

    profile_context = ''
    if citizen_profile:
        parts = []
        if citizen_profile.get('age'): parts.append(f"age {citizen_profile['age']}")
        if citizen_profile.get('income'): parts.append(f"income ₹{citizen_profile['income']}/month")
        if citizen_profile.get('category'): parts.append(f"category {citizen_profile['category']}")
        if citizen_profile.get('occupation'): parts.append(f"occupation {citizen_profile['occupation']}")
        if citizen_profile.get('gender'): parts.append(f"gender {citizen_profile['gender']}")
        if parts: profile_context = f"\nCitizen profile: {', '.join(parts)}"

    prompt = (
        f"You are a welfare scheme search assistant. A citizen asks: \"{query}\"{profile_context}\n\n"
        f"Available schemes:\n" + '\n'.join(catalog[:80]) + "\n\n"
        f"Select the top 5 most relevant scheme IDs. Return ONLY a list of matches in this format:\n"
        f"MATCH: [schemeId] | [reason in 10 words]\n\n"
        f"If no schemes are relevant, return: NO_MATCH"
    )

    try:
        ai_response = _invoke_bedrock(prompt, max_tokens=400)

        # Parse matched IDs robustness
        matched_ids = []
        reasons = {}
        for line in ai_response.split('\n'):
            line = line.strip()
            if 'MATCH:' in line:
                try:
                    # Handle "MATCH: [ID] | [Reason]" or "MATCH: [ID]"
                    content = line.split('MATCH:')[-1].strip()
                    if '|' in content:
                        parts = content.split('|', 1)
                        sid = parts[0].strip()
                        reason = parts[1].strip()
                    else:
                        sid = content
                        reason = 'Highly relevant match'
                    
                    if sid:
                        matched_ids.append(sid)
                        reasons[sid] = reason
                except Exception as parse_err:
                    print(f"[WARN] Failed to parse AI search line '{line}': {parse_err}")

        # Return full scheme data for matched IDs
        scheme_map = {s.get('schemeId', ''): s for s in all_schemes}
        results = []
        for sid in matched_ids:
            scheme = scheme_map.get(sid)
            if scheme:
                results.append({
                    'schemeId': scheme.get('schemeId', ''),
                    'nameEnglish': scheme.get('nameEnglish', ''),
                    'shortTitle': scheme.get('shortTitle', ''),
                    'briefDescription': str(scheme.get('briefDescription', ''))[:200],
                    'annualBenefit': scheme.get('annualBenefit', 0),
                    'categories': scheme.get('categories', []),
                    'aiReason': reasons.get(sid, ''),
                    'level': scheme.get('level', ''),
                    'ministry': scheme.get('ministry', ''),
                    'applyUrl': scheme.get('applyUrl', ''),
                })

        return {
            'statusCode': 200,
            'headers': cors_headers(),
            'body': json.dumps({
                'query': query,
                'results': results,
                'totalMatches': len(results),
                'aiPowered': True,
            }, cls=DecimalEncoder),
        }
    except Exception as e:
        return {'statusCode': 500, 'headers': cors_headers(), 'body': json.dumps({'error': str(e)})}


def handle_compare(event):
    """POST /scheme/compare — AI comparison of 2-3 schemes."""
    body = json.loads(event.get('body', '{}')) if isinstance(event.get('body'), str) else event
    scheme_ids = body.get('schemeIds', [])
    citizen_profile = body.get('citizenProfile', {})

    if not scheme_ids or len(scheme_ids) < 2:
        return {'statusCode': 400, 'headers': cors_headers(), 'body': json.dumps({'error': 'At least 2 schemeIds required'})}

    # Fetch scheme details
    schemes = []
    for sid in scheme_ids[:3]:
        try:
            result = table.get_item(Key={'schemeId': sid})
            item = result.get('Item')
            if item:
                schemes.append(item)
        except Exception:
            pass

    if len(schemes) < 2:
        return {'statusCode': 404, 'headers': cors_headers(), 'body': json.dumps({'error': 'Could not find enough schemes'})}

    # Build comparison prompt
    scheme_details = ''
    for s in schemes:
        scheme_details += (
            f"\nScheme: {s.get('nameEnglish', '')}\n"
            f"  Benefit: ₹{s.get('annualBenefit', 0)}/year\n"
            f"  Category: {s.get('categories', '')}\n"
            f"  Eligibility: Age {s.get('minAge', 0)}-{s.get('maxAge', 99)}, "
            f"Income ≤₹{s.get('maxMonthlyIncome', 'unlimited')}/month\n"
            f"  Description: {str(s.get('briefDescription', ''))[:150]}\n"
        )

    profile_context = ''
    if citizen_profile.get('age') or citizen_profile.get('income'):
        profile_context = f"\nCitizen: age {citizen_profile.get('age', 'unknown')}, income ₹{citizen_profile.get('income', 'unknown')}/month, {citizen_profile.get('category', 'General')}"

    prompt = (
        f"Compare these Indian government welfare schemes for a citizen{profile_context}:\n"
        f"{scheme_details}\n"
        f"Provide a clear comparison covering:\n"
        f"1. BENEFIT_COMPARISON: Which gives more money and how\n"
        f"2. ELIGIBILITY_EASE: Which is easier to qualify for\n"
        f"3. APPLICATION_COMPLEXITY: Which has simpler application process\n"
        f"4. RECOMMENDATION: Which scheme(s) to apply for first and why\n\n"
        f"Use simple language. Under 200 words."
    )

    try:
        comparison = _invoke_bedrock(prompt, max_tokens=500)
        return {
            'statusCode': 200,
            'headers': cors_headers(),
            'body': json.dumps({
                'comparison': comparison,
                'schemes': [{'schemeId': s.get('schemeId'), 'nameEnglish': s.get('nameEnglish'), 'annualBenefit': s.get('annualBenefit', 0)} for s in schemes],
            }, cls=DecimalEncoder),
        }
    except Exception as e:
        return {'statusCode': 500, 'headers': cors_headers(), 'body': json.dumps({'error': str(e)})}


def lambda_handler(event, context):
    try:
        method = event.get('httpMethod', 'GET')
        path = event.get('path', '') or event.get('resource', '')

        # POST /scheme/search-ai
        if method == 'POST' and 'search-ai' in path:
            return handle_ai_search(event)

        # POST /scheme/compare
        if method == 'POST' and 'compare' in path:
            return handle_compare(event)

        scheme_id = ''
        if event.get('pathParameters'):
            scheme_id = event['pathParameters'].get('schemeId', '')
            
        # Fallback for proxy integrations (e.g., path = '/scheme/all')
        if not scheme_id and 'scheme/all' in path:
            scheme_id = 'all'
            
        if not scheme_id:
            scheme_id = event.get('schemeId', '')

        if not scheme_id:
            return {
                'statusCode': 400,
                'headers': cors_headers(),
                'body': json.dumps({'error': 'schemeId is required'})
            }

        if scheme_id.lower() == 'all':
            items = _fetch_all_schemes()

            # Return lightweight data for listing
            listing = []
            for item in items:
                listing.append({
                    'schemeId': item.get('schemeId', ''),
                    'nameEnglish': item.get('nameEnglish', ''),
                    'shortTitle': item.get('shortTitle', ''),
                    'level': item.get('level', ''),
                    'type': item.get('type', ''),
                    'state': item.get('state', []),
                    'ministry': item.get('ministry', ''),
                    'categories': item.get('categories', []),
                    'tags': item.get('tags', []),
                    'briefDescription': str(item.get('briefDescription', ''))[:200],
                    'applyUrl': item.get('applyUrl', ''),
                    'annualBenefit': item.get('annualBenefit', 0),
                })

            return {
                'statusCode': 200,
                'headers': cors_headers(),
                'body': json.dumps(listing, cls=DecimalEncoder)
            }

        response = table.get_item(Key={'schemeId': scheme_id})
        item = response.get('Item')

        if not item:
            return {
                'statusCode': 404,
                'headers': cors_headers(),
                'body': json.dumps({'error': 'Scheme not found'})
            }

        return {
            'statusCode': 200,
            'headers': cors_headers(),
            'body': json.dumps(item, cls=DecimalEncoder)
        }
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': cors_headers(),
            'body': json.dumps({'error': 'Internal server error', 'message': str(e)})
        }
