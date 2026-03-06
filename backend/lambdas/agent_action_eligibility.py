"""
agent_action_eligibility — Bedrock Agent Action Group
Receives citizen profile fields from the eligibility agent,
runs is_eligible() logic, returns matched schemes JSON.
Internal only — invoked by Bedrock Agent, not API Gateway.
"""
import json
import os
import boto3
from decimal import Decimal

REGION = 'us-east-1'

# Load schemes.json bundled with this Lambda
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
    """Check if a citizen profile matches a scheme (replicated from eligibility_engine)."""
    age = int(profile.get('age', 0) or 0)
    monthly_income = int(profile.get('income', 0) or profile.get('monthlyIncome', 0) or 0)

    min_age = int(scheme.get('minAge', 0) or 0)
    max_age = int(scheme.get('maxAge', 99) or 99)
    if age < min_age or age > max_age:
        return False

    max_monthly = int(scheme.get('maxMonthlyIncome', 999999) or 999999)
    if monthly_income > max_monthly:
        return False

    scheme_gender = (scheme.get('gender') or 'any').lower().strip()
    if scheme_gender != 'any':
        profile_gender = (profile.get('gender') or 'any').lower().strip()
        if profile_gender != 'any' and profile_gender != scheme_gender:
            return False

    scheme_occ = (scheme.get('occupation') or 'any').lower().strip()
    if scheme_occ != 'any':
        profile_occ = (profile.get('occupation') or '').lower().strip()
        profile_persona = (profile.get('persona') or '').lower().strip()
        if profile_occ != scheme_occ and profile_persona != scheme_occ:
            return False

    raw_cats = scheme.get('categories', 'SC,ST,OBC,General') or 'SC,ST,OBC,General'
    scheme_cats = [c.strip() for c in raw_cats.split(',')]
    profile_cat = (profile.get('category') or 'General').strip()
    if profile_cat not in scheme_cats:
        return False

    scheme_widow = (scheme.get('isWidow') or 'any').lower().strip()
    if scheme_widow == 'true':
        if not _to_bool(profile.get('isWidow', False)):
            return False

    return True


def _extract_param(parameters, name, default=''):
    """Extract a named parameter from Bedrock action group parameters list."""
    for p in (parameters or []):
        if p.get('name') == name:
            return p.get('value', default)
    return default


def lambda_handler(event, context):
    """
    Bedrock Agent Action Group handler.
    Event format: { actionGroup, function, parameters: [{name, type, value}] }
    """
    try:
        action_group = event.get('actionGroup', '')
        function = event.get('function', 'check_eligibility')
        parameters = event.get('parameters', [])

        if function == 'check_eligibility':
            # Extract citizen profile from parameters (max 5 params due to Bedrock quota)
            # details is an optional JSON string: {"state":"..","occupation":"..","isWidow":true,"disability":false}
            details_str = _extract_param(parameters, 'details', '{}')
            try:
                details = json.loads(details_str) if details_str else {}
            except Exception:
                details = {}
            profile = {
                'age': _extract_param(parameters, 'age', '0'),
                'income': _extract_param(parameters, 'monthlyIncome', '0'),
                'gender': _extract_param(parameters, 'gender', 'any'),
                'category': _extract_param(parameters, 'category', 'General'),
                'state': details.get('state', ''),
                'occupation': details.get('occupation', ''),
                'persona': details.get('occupation', ''),
                'isWidow': str(details.get('isWidow', 'false')),
                'disability': str(details.get('disability', 'false')),
            }

            matched = [s for s in LOCAL_SCHEMES if is_eligible(profile, s)]
            total_benefit = sum(int(s.get('annualBenefit', 0) or 0) for s in matched)

            result_text = json.dumps({
                'matchedSchemes': matched[:10],  # Top 10
                'totalMatchedCount': len(matched),
                'totalAnnualBenefit': total_benefit,
            }, cls=DecimalEncoder)

        else:
            result_text = json.dumps({'error': f'Unknown function: {function}'})

        return {
            'messageVersion': '1.0',
            'response': {
                'actionGroup': action_group,
                'function': function,
                'functionResponse': {
                    'responseBody': {
                        'TEXT': {
                            'body': result_text
                        }
                    }
                }
            }
        }

    except Exception as e:
        return {
            'messageVersion': '1.0',
            'response': {
                'actionGroup': event.get('actionGroup', ''),
                'function': event.get('function', ''),
                'functionResponse': {
                    'responseBody': {
                        'TEXT': {
                            'body': json.dumps({'error': str(e)})
                        }
                    }
                }
            }
        }
