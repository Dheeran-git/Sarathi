import json
import os
from decimal import Decimal

# Load schemes.json bundled with the Lambda
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
    """Normalize various truthy/falsy representations to bool."""
    if isinstance(value, bool):
        return value
    if isinstance(value, str):
        return value.lower() in ('true', '1', 'yes')
    return bool(value)


def is_eligible(profile, scheme):
    """Check if a citizen profile satisfies a scheme's conditions.

    Each key in `conditions` maps to a typed check:
      ageMin / ageMax        — numeric range on profile['age']
      incomeMax              — profile['income'] or profile['monthlyIncome']*12
      gender                 — list of allowed genders
      occupation             — list of allowed occupations
      category               — list of allowed caste categories
      isWidow / disability / pregnant / landOwned / shgMember — boolean flags
      urban                  — boolean (True = urban, False = rural)
      persona                — list of allowed persona strings
    """
    conds = scheme.get('conditions', {})
    age = int(profile.get('age', 0))
    income = int(profile.get('income', 0)) or int(profile.get('monthlyIncome', 0)) * 12

    # Age range
    if 'ageMin' in conds and age < int(conds['ageMin']):
        return False
    if 'ageMax' in conds and age > int(conds['ageMax']):
        return False

    # Income ceiling
    if 'incomeMax' in conds and income > int(conds['incomeMax']):
        return False

    # State filtering (top-level scheme field, not inside conditions)
    scheme_states = scheme.get('state', ['All'])
    if isinstance(scheme_states, str):
        scheme_states = [scheme_states]
    profile_state = profile.get('state', '').strip()
    if profile_state and 'All' not in scheme_states:
        if profile_state not in scheme_states:
            return False

    # Gender
    if 'gender' in conds:
        pg = profile.get('gender', 'any').lower().strip()
        if pg != 'any' and pg not in [g.lower() for g in conds['gender']]:
            return False

    # Occupation
    if 'occupation' in conds:
        po = profile.get('occupation', 'any').lower().strip()
        if po != 'any' and po not in [o.lower() for o in conds['occupation']]:
            return False

    # Caste category
    if 'category' in conds:
        pc = profile.get('category', 'General').strip()
        if pc not in conds['category']:
            return False

    # Boolean flags
    for flag in ('isWidow', 'disability', 'pregnant', 'landOwned', 'shgMember'):
        if flag in conds:
            if _to_bool(conds[flag]) and not _to_bool(profile.get(flag, False)):
                return False

    # Urban / Rural
    if 'urban' in conds:
        profile_urban = profile.get('urban')
        if profile_urban is not None:
            if _to_bool(conds['urban']) != _to_bool(profile_urban):
                return False

    # Persona
    if 'persona' in conds:
        pp = profile.get('persona', '').lower().strip()
        if pp and pp not in [p.lower() for p in conds['persona']]:
            return False

    return True


def lambda_handler(event, context):
    try:
        body = json.loads(event.get('body', '{}')) if isinstance(event.get('body'), str) else event

        # Use local schemes.json; fall back to DynamoDB if empty
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
                    'id': scheme.get('id', scheme.get('schemeId', '')),
                    'name': scheme.get('name', scheme.get('nameEnglish', '')),
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
                'Content-Type': 'application/json',
            },
            'body': json.dumps({
                'error': 'Internal server error',
                'message': str(e),
            }),
        }
