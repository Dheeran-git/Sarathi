"""
agent_action_application — Bedrock Agent Action Group
Receives schemeId, fetches full scheme from DynamoDB,
returns document checklist + steps + official portal URL.
Internal only — invoked by Bedrock Agent, not API Gateway.
"""
import json
import os
import boto3
from decimal import Decimal

REGION = 'us-east-1'
dynamodb = boto3.resource('dynamodb', region_name=REGION)
schemes_table = dynamodb.Table('SarathiSchemes')

# Load local schemes.json as fallback
_SCHEMES_PATH = os.path.join(os.path.dirname(__file__), 'schemes.json')
try:
    with open(_SCHEMES_PATH, 'r', encoding='utf-8') as _f:
        _LOCAL_SCHEMES = {s['schemeId']: s for s in json.load(_f) if 'schemeId' in s}
except (FileNotFoundError, KeyError):
    _LOCAL_SCHEMES = {}


class DecimalEncoder(json.JSONEncoder):
    def default(self, o):
        if isinstance(o, Decimal):
            return int(o) if o % 1 == 0 else float(o)
        return super().default(o)


def _fetch_scheme(scheme_id):
    """Fetch scheme from DynamoDB or fall back to local JSON."""
    try:
        result = schemes_table.get_item(Key={'schemeId': scheme_id})
        item = result.get('Item')
        if item:
            return item
    except Exception as e:
        print(f"[WARN] DynamoDB fetch failed: {e}")
    return _LOCAL_SCHEMES.get(scheme_id)


def _extract_param(parameters, name, default=''):
    for p in (parameters or []):
        if p.get('name') == name:
            return p.get('value', default)
    return default


def lambda_handler(event, context):
    try:
        action_group = event.get('actionGroup', '')
        function = event.get('function', 'get_application_guide')
        parameters = event.get('parameters', [])

        if function == 'get_application_guide':
            scheme_id = _extract_param(parameters, 'schemeId', '')

            if not scheme_id:
                result_text = json.dumps({'error': 'schemeId is required'})
            else:
                scheme = _fetch_scheme(scheme_id)
                if not scheme:
                    result_text = json.dumps({'error': f'Scheme {scheme_id} not found'})
                else:
                    docs_en = scheme.get('documentsRequiredEn') or scheme.get('documentsRequired') or []
                    apply_url = scheme.get('applyUrl', '')
                    steps = [
                        f"1. Gather required documents: {', '.join(docs_en[:3]) if docs_en else 'Aadhaar, Income Certificate, Bank Account'}",
                        f"2. Visit the official portal: {apply_url or 'myscheme.gov.in'}",
                        "3. Register/Login with your Aadhaar or mobile number",
                        "4. Fill in the application form with your personal and bank details",
                        "5. Upload scanned copies of required documents",
                        "6. Submit the application and note down the reference/application number",
                        "7. Track your application status on the portal using the reference number",
                    ]
                    result_text = json.dumps({
                        'schemeName': scheme.get('nameEnglish', scheme_id),
                        'documentsRequired': docs_en,
                        'applicationSteps': steps,
                        'officialPortalUrl': apply_url,
                        'ministry': scheme.get('ministry', ''),
                        'annualBenefit': int(scheme.get('annualBenefit', 0) or 0),
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
                        'TEXT': {'body': result_text}
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
                        'TEXT': {'body': json.dumps({'error': str(e)})}
                    }
                }
            }
        }
