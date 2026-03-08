"""
fraud_detector — POST /fraud/check
Multi-layered fraud detection with risk tiers for citizen welfare applications.

Detection layers:
  1. Cross-scheme income consistency
  2. Document age verification
  3. Duplicate detection (Aadhaar/name)
  4. Risk tiers: Low (auto-approve), Medium (flag for review), High (block + alert)

Uses Bedrock (Nova Pro) for AI Explainability Reports.
Includes retry/backoff, structured logging, CORS headers.
"""
import json
import os
import re
import time
import hashlib
import boto3
from datetime import datetime, timezone
from decimal import Decimal
from boto3.dynamodb.conditions import Key, Attr

REGION = 'us-east-1'
BEDROCK_MODEL_ID = os.environ.get('BEDROCK_MODEL_ID', 'amazon.nova-pro-v1:0')
BEDROCK_GUARDRAIL_ID = os.environ.get('BEDROCK_GUARDRAIL_ID', '')
BEDROCK_GUARDRAIL_VERSION = os.environ.get('BEDROCK_GUARDRAIL_VERSION', '1')
FRAUD_ALERT_TOPIC = os.environ.get('FRAUD_ALERT_TOPIC', '')
INCOME_VARIANCE_THRESHOLD = int(os.environ.get('INCOME_VARIANCE_THRESHOLD', '20'))
AGE_TOLERANCE_YEARS = int(os.environ.get('AGE_TOLERANCE_YEARS', '2'))

dynamodb = boto3.resource('dynamodb', region_name=REGION)
applications_table = dynamodb.Table(os.environ.get('APPLICATIONS_TABLE', 'SarathiApplications'))
citizens_table = dynamodb.Table(os.environ.get('CITIZENS_TABLE', 'SarathiCitizens'))
bedrock = boto3.client('bedrock-runtime', region_name=REGION)
sns = boto3.client('sns', region_name=REGION)

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


def _invoke_bedrock(prompt, caller='fraud_detector', max_tokens=600, temperature=0.2):
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
# Detection layers
# ---------------------------------------------------------------------------

def _check_income_consistency(citizen_id, declared_income):
    """Layer 1: Check if citizen claims different incomes across schemes."""
    findings = []
    try:
        resp = applications_table.query(
            IndexName='citizenId-index',
            KeyConditionExpression=Key('citizenId').eq(citizen_id),
        )
        apps = resp.get('Items', [])
        while 'LastEvaluatedKey' in resp:
            resp = applications_table.query(
                IndexName='citizenId-index',
                KeyConditionExpression=Key('citizenId').eq(citizen_id),
                ExclusiveStartKey=resp['LastEvaluatedKey'],
            )
            apps.extend(resp.get('Items', []))

        incomes = []
        for app in apps:
            inc = app.get('declaredIncome') or app.get('monthlyIncome')
            if inc is not None:
                incomes.append({
                    'applicationId': app.get('applicationId', ''),
                    'schemeId': app.get('schemeId', ''),
                    'declaredIncome': int(inc),
                })

        if declared_income and incomes:
            for rec in incomes:
                prev = rec['declaredIncome']
                if prev == 0:
                    continue
                variance_pct = abs(declared_income - prev) / max(prev, 1) * 100
                if variance_pct > INCOME_VARIANCE_THRESHOLD:
                    findings.append({
                        'type': 'income_inconsistency',
                        'severity': 'high' if variance_pct > 50 else 'medium',
                        'detail': (
                            f"Declared income {declared_income} differs by {variance_pct:.0f}% "
                            f"from {prev} in application {rec['applicationId']} "
                            f"(scheme {rec['schemeId']})"
                        ),
                        'variancePercent': round(variance_pct, 1),
                        'previousIncome': prev,
                        'currentIncome': declared_income,
                    })
    except Exception as e:
        print(f"[WARN] Income consistency check failed: {e}")

    return findings


def _check_document_age(stated_age, document_dob):
    """Layer 2: Check if stated age matches document-extracted DOB."""
    findings = []
    if not stated_age or not document_dob:
        return findings

    try:
        if isinstance(document_dob, str):
            # Try common date formats
            for fmt in ('%Y-%m-%d', '%d-%m-%Y', '%d/%m/%Y', '%Y/%m/%d'):
                try:
                    dob_date = datetime.strptime(document_dob, fmt)
                    break
                except ValueError:
                    continue
            else:
                return findings
        else:
            return findings

        today = datetime.now(timezone.utc).replace(tzinfo=None)
        doc_age = (today - dob_date).days // 365
        age_diff = abs(int(stated_age) - doc_age)

        if age_diff > AGE_TOLERANCE_YEARS:
            severity = 'high' if age_diff > 5 else 'medium'
            findings.append({
                'type': 'age_mismatch',
                'severity': severity,
                'detail': (
                    f"Stated age {stated_age} differs by {age_diff} years "
                    f"from document DOB {document_dob} (calculated age {doc_age})"
                ),
                'statedAge': int(stated_age),
                'documentAge': doc_age,
                'ageDifference': age_diff,
            })
    except Exception as e:
        print(f"[WARN] Document age check failed: {e}")

    return findings


def _check_duplicates(citizen_id, aadhaar, name):
    """Layer 3: Detect duplicate Aadhaar or name in other applications."""
    findings = []

    try:
        # Check by Aadhaar
        if aadhaar:
            aadhaar_hash = hashlib.sha256(str(aadhaar).encode()).hexdigest()
            resp = citizens_table.scan(
                FilterExpression=Attr('aadhaarHash').eq(aadhaar_hash) & Attr('citizenId').ne(citizen_id),
                ProjectionExpression='citizenId,#n,panchayatId',
                ExpressionAttributeNames={'#n': 'name'},
                Limit=50,
            )
            dupes = resp.get('Items', [])
            if dupes:
                findings.append({
                    'type': 'duplicate_aadhaar',
                    'severity': 'high',
                    'detail': (
                        f"Aadhaar linked to {len(dupes)} other citizen record(s): "
                        f"{', '.join(d.get('citizenId', '?') for d in dupes[:5])}"
                    ),
                    'duplicateCount': len(dupes),
                    'duplicateCitizenIds': [d.get('citizenId', '') for d in dupes[:5]],
                })

        # Check by exact name match (potential duplicates)
        if name:
            normalized_name = name.strip().lower()
            resp = citizens_table.scan(
                FilterExpression=Attr('nameLower').eq(normalized_name) & Attr('citizenId').ne(citizen_id),
                ProjectionExpression='citizenId,#n,panchayatId',
                ExpressionAttributeNames={'#n': 'name'},
                Limit=50,
            )
            name_dupes = resp.get('Items', [])
            if name_dupes:
                findings.append({
                    'type': 'duplicate_name',
                    'severity': 'medium',
                    'detail': (
                        f"Exact name match found in {len(name_dupes)} other record(s): "
                        f"{', '.join(d.get('citizenId', '?') for d in name_dupes[:5])}"
                    ),
                    'duplicateCount': len(name_dupes),
                    'duplicateCitizenIds': [d.get('citizenId', '') for d in name_dupes[:5]],
                })
    except Exception as e:
        print(f"[WARN] Duplicate check failed: {e}")

    return findings


def _determine_risk_tier(findings):
    """Assign risk tier based on aggregate findings."""
    if not findings:
        return 'low'

    severities = [f.get('severity', 'low') for f in findings]
    high_count = severities.count('high')
    medium_count = severities.count('medium')

    if high_count >= 2 or (high_count >= 1 and medium_count >= 2):
        return 'high'
    elif high_count >= 1 or medium_count >= 2:
        return 'medium'
    else:
        return 'low'


def _risk_tier_action(risk_tier):
    """Return recommended action for risk tier."""
    actions = {
        'low': {
            'action': 'auto_approve',
            'description': 'No significant fraud indicators. Application may proceed automatically.',
        },
        'medium': {
            'action': 'flag_for_review',
            'description': 'Some fraud indicators detected. Manual review recommended before approval.',
        },
        'high': {
            'action': 'block_and_alert',
            'description': 'Significant fraud indicators detected. Application blocked pending investigation.',
        },
    }
    return actions.get(risk_tier, actions['medium'])


def _generate_explainability_report(citizen_id, findings, risk_tier):
    """Use Bedrock to generate a human-readable explainability report."""
    findings_text = "\n".join(
        f"- [{f['severity'].upper()}] {f['type']}: {f['detail']}"
        for f in findings
    )

    prompt = (
        f"You are a fraud detection analyst for an Indian welfare scheme platform.\n\n"
        f"Citizen ID: {citizen_id}\n"
        f"Risk Tier: {risk_tier.upper()}\n"
        f"Findings:\n{findings_text if findings_text else '- No issues detected'}\n\n"
        f"Generate a concise fraud check explainability report with:\n"
        f"1. SUMMARY: 2-3 sentence overview of the risk assessment\n"
        f"2. FINDING_ANALYSIS: For each finding, explain why it matters and potential legitimate explanations\n"
        f"3. RECOMMENDATION: Clear action recommendation for the reviewing officer\n"
        f"4. CONFIDENCE: Your confidence level (high/medium/low) in the overall assessment\n\n"
        f"Be fair and balanced. Consider that legitimate reasons may exist for discrepancies "
        f"(e.g., income changes over time, data entry errors). Keep it under 300 words."
    )

    try:
        return _invoke_bedrock(prompt, caller='fraud_explainability')
    except Exception as e:
        print(f"[WARN] Explainability report generation failed: {e}")
        return (
            f"Automated report unavailable. Risk tier: {risk_tier.upper()}. "
            f"Findings count: {len(findings)}. Manual review recommended."
        )


def _send_fraud_alert(citizen_id, risk_tier, findings):
    """Send SNS alert for high-risk applications."""
    if not FRAUD_ALERT_TOPIC or risk_tier != 'high':
        return

    try:
        message = {
            'citizenId': citizen_id,
            'riskTier': risk_tier,
            'findingsCount': len(findings),
            'findingTypes': list(set(f['type'] for f in findings)),
            'timestamp': datetime.now(timezone.utc).isoformat(),
        }
        sns.publish(
            TopicArn=FRAUD_ALERT_TOPIC,
            Subject=f"[Sarathi FRAUD ALERT] High-risk application - {citizen_id}",
            Message=json.dumps(message, indent=2),
        )
        print(json.dumps({'fraud_alert_sent': True, 'citizenId': citizen_id}))
    except Exception as e:
        print(f"[WARN] Failed to send fraud alert: {e}")


# ---------------------------------------------------------------------------
# Lambda handler
# ---------------------------------------------------------------------------

def lambda_handler(event, context):
    method = event.get('httpMethod', '')

    if method == 'OPTIONS':
        return _response(200, {})

    if method != 'POST':
        return _response(405, {'error': f'Method not allowed: {method}'})

    try:
        body = json.loads(event.get('body', '{}')) if isinstance(event.get('body'), str) else event

        citizen_id = str(body.get('citizenId', '')).strip()
        if not citizen_id:
            return _response(400, {'error': 'citizenId is required'})

        declared_income = body.get('declaredIncome') or body.get('monthlyIncome')
        if declared_income is not None:
            declared_income = int(declared_income)
        stated_age = body.get('age') or body.get('statedAge')
        document_dob = body.get('documentDob') or body.get('documentDateOfBirth')
        aadhaar = body.get('aadhaar') or body.get('aadhaarNumber')
        name = body.get('name') or body.get('citizenName')
        scheme_id = body.get('schemeId', '')

        print(json.dumps({
            'fraud_check_started': True,
            'citizenId': citizen_id,
            'schemeId': scheme_id,
            'timestamp': datetime.now(timezone.utc).isoformat(),
        }))

        # Run all detection layers
        all_findings = []

        # Layer 1: Cross-scheme income consistency
        income_findings = _check_income_consistency(citizen_id, declared_income)
        all_findings.extend(income_findings)

        # Layer 2: Document age verification
        age_findings = _check_document_age(stated_age, document_dob)
        all_findings.extend(age_findings)

        # Layer 3: Duplicate detection
        dup_findings = _check_duplicates(citizen_id, aadhaar, name)
        all_findings.extend(dup_findings)

        # Determine risk tier
        risk_tier = _determine_risk_tier(all_findings)
        tier_action = _risk_tier_action(risk_tier)

        # Generate Bedrock explainability report
        explainability_report = _generate_explainability_report(
            citizen_id, all_findings, risk_tier
        )

        # Send SNS alert for high-risk
        _send_fraud_alert(citizen_id, risk_tier, all_findings)

        # Structured log of completed check
        print(json.dumps({
            'fraud_check_completed': True,
            'citizenId': citizen_id,
            'schemeId': scheme_id,
            'riskTier': risk_tier,
            'findingsCount': len(all_findings),
            'findingTypes': list(set(f['type'] for f in all_findings)),
            'timestamp': datetime.now(timezone.utc).isoformat(),
        }))

        return _response(200, {
            'citizenId': citizen_id,
            'schemeId': scheme_id,
            'riskTier': risk_tier,
            'action': tier_action['action'],
            'actionDescription': tier_action['description'],
            'findings': all_findings,
            'findingsCount': len(all_findings),
            'explainabilityReport': explainability_report,
            'checkedAt': datetime.now(timezone.utc).isoformat(),
            'layers': {
                'incomeConsistency': {
                    'checked': True,
                    'findingsCount': len(income_findings),
                },
                'documentAgeVerification': {
                    'checked': bool(stated_age and document_dob),
                    'findingsCount': len(age_findings),
                },
                'duplicateDetection': {
                    'checked': bool(aadhaar or name),
                    'findingsCount': len(dup_findings),
                },
            },
        })

    except Exception as e:
        print(f"[ERR] fraud_detector: {e}")
        return _response(500, {'error': 'Internal server error', 'message': str(e)})
