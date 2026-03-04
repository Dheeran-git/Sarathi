import json
import os
from decimal import Decimal

# Load schemes.json bundled with the Lambda (flat format, same as scheme_data.json)
_SCHEMES_PATH = os.path.join(os.path.dirname(__file__), 'schemes.json')
try:
    with open(_SCHEMES_PATH, 'r', encoding='utf-8') as _f:
        LOCAL_SCHEMES = json.load(_f)
except FileNotFoundError:
    LOCAL_SCHEMES = []


class DecimalEncoder(json.JSONEncoder):
    def default(self, o):
        if isinstance(o, Decimal):
            return int(o) if o % 1 == 0 else float(o)
        return super().default(o)


def _to_bool(value):
    if isinstance(value, bool):
        return value
    if isinstance(value, str):
        return value.lower() in ('true', '1', 'yes')
    return bool(value)


def is_eligible(profile, scheme):
    """Check if a citizen profile matches a scheme.

    Supports the flat scheme format stored in DynamoDB / schemes.json:
      minAge / maxAge          — age range
      maxMonthlyIncome         — monthly income ceiling
      gender                   — "any" | "male" | "female"
      occupation               — "any" | specific occupation string
      categories               — comma-separated caste categories (e.g. "SC,ST,OBC,General")
      isWidow                  — "any" | "true"
      state                    — list or "All" for pan-India schemes
    """
    age = int(profile.get('age', 0))
    monthly_income = int(profile.get('income', 0) or profile.get('monthlyIncome', 0) or 0)

    # ── Age check ────────────────────────────────────────────────────────────
    min_age = int(scheme.get('minAge', 0))
    max_age = int(scheme.get('maxAge', 99))
    if age < min_age or age > max_age:
        return False

    # ── Income check (monthly income vs scheme's monthly ceiling) ────────────
    max_monthly = int(scheme.get('maxMonthlyIncome', 999999))
    if monthly_income > max_monthly:
        return False

    # ── Gender check ─────────────────────────────────────────────────────────
    scheme_gender = (scheme.get('gender') or 'any').lower().strip()
    if scheme_gender != 'any':
        profile_gender = (profile.get('gender') or 'any').lower().strip()
        if profile_gender != 'any' and profile_gender != scheme_gender:
            return False

    # ── Occupation check ──────────────────────────────────────────────────────
    scheme_occ = (scheme.get('occupation') or 'any').lower().strip()
    if scheme_occ != 'any':
        profile_occ = (profile.get('occupation') or '').lower().strip()
        profile_persona = (profile.get('persona') or '').lower().strip()
        if profile_occ != scheme_occ and profile_persona != scheme_occ:
            return False

    # ── Caste category check ─────────────────────────────────────────────────
    raw_cats = scheme.get('categories', 'SC,ST,OBC,General') or 'SC,ST,OBC,General'
    scheme_cats = [c.strip() for c in raw_cats.split(',')]
    profile_cat = (profile.get('category') or 'General').strip()
    if profile_cat not in scheme_cats:
        return False

    # ── Widow check ──────────────────────────────────────────────────────────
    scheme_widow = (scheme.get('isWidow') or 'any').lower().strip()
    if scheme_widow == 'true':
        if not _to_bool(profile.get('isWidow', False)):
            return False

    # ── State / geography check ───────────────────────────────────────────────
    scheme_states = scheme.get('state', ['All'])
    if isinstance(scheme_states, str):
        scheme_states = [s.strip() for s in scheme_states.split(',')]
    profile_state = (profile.get('state') or '').strip()
    if profile_state and 'All' not in scheme_states:
        if profile_state not in scheme_states:
            return False

    return True


def lambda_handler(event, context):
    try:
        body = json.loads(event.get('body', '{}')) if isinstance(event.get('body'), str) else event

        # Use bundled schemes.json; fall back to DynamoDB scan if file is missing
        all_schemes = LOCAL_SCHEMES
        if not all_schemes:
            import boto3
            dynamodb = boto3.resource('dynamodb', region_name='us-east-1')
            table = dynamodb.Table('SarathiSchemes')
            response = table.scan()
            all_schemes = response['Items']
            while 'LastEvaluatedKey' in response:
                response = table.scan(ExclusiveStartKey=response['LastEvaluatedKey'])
                all_schemes.extend(response['Items'])

        matched = []
        for scheme in all_schemes:
            if is_eligible(body, scheme):
                matched.append({
                    'id': scheme.get('schemeId', scheme.get('id', '')),
                    'name': scheme.get('nameEnglish', scheme.get('name', '')),
                    'nameHindi': scheme.get('nameHindi', ''),
                    'category': scheme.get('category', ''),
                    'annualBenefit': int(scheme.get('annualBenefit', 0) or 0),
                    'ministry': scheme.get('ministry', ''),
                    'applyUrl': scheme.get('applyUrl', ''),
                    'benefitType': scheme.get('benefitType', ''),
                    'description': scheme.get('description', ''),
                    'state': scheme.get('state', ['All']),
                    'type': scheme.get('type', 'Central'),
                })

        matched.sort(key=lambda x: x['annualBenefit'], reverse=True)
        total = sum(s['annualBenefit'] for s in matched)

        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type,Authorization',
                'Content-Type': 'application/json',
            },
            'body': json.dumps({
                'matchedSchemes': matched,
                'totalAnnualBenefit': total,
                'schemesCount': len(matched),
            }, cls=DecimalEncoder),
        }
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type,Authorization',
                'Content-Type': 'application/json',
            },
            'body': json.dumps({'error': 'Internal server error', 'message': str(e)}),
        }
