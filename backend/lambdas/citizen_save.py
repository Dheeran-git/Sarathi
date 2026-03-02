import json
import boto3
from decimal import Decimal
from datetime import datetime

dynamodb = boto3.resource('dynamodb', region_name='us-east-1')
table = dynamodb.Table('SarathiCitizens')


class DecimalEncoder(json.JSONEncoder):
    def default(self, o):
        if isinstance(o, Decimal):
            return int(o) if o % 1 == 0 else float(o)
        return super().default(o)


def convert_to_dynamodb(obj):
    """Convert floats and nested structures to DynamoDB-safe types."""
    if isinstance(obj, float):
        return Decimal(str(obj))
    if isinstance(obj, dict):
        return {k: convert_to_dynamodb(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [convert_to_dynamodb(i) for i in obj]
    return obj


def cors_headers():
    return {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization',
        'Content-Type': 'application/json',
    }


def to_bool(val):
    """Normalize a value to a boolean."""
    if isinstance(val, bool):
        return val
    return str(val).lower().strip() in ('true', '1', 'yes')


def lambda_handler(event, context):
    http_method = event.get('httpMethod', 'POST')
    path_params = event.get('pathParameters') or {}

    # ── GET /citizen/{userId} — fetch saved profile ─────────────────────────
    if http_method == 'GET':
        user_id = path_params.get('userId', '').strip()
        if not user_id:
            return {
                'statusCode': 400,
                'headers': cors_headers(),
                'body': json.dumps({'error': 'userId path parameter is required'}),
            }
        try:
            result = table.get_item(Key={'citizenId': user_id})
            item = result.get('Item')
            if not item:
                return {
                    'statusCode': 404,
                    'headers': cors_headers(),
                    'body': json.dumps({'error': 'Profile not found'}),
                }
            return {
                'statusCode': 200,
                'headers': cors_headers(),
                'body': json.dumps(item, cls=DecimalEncoder),
            }
        except Exception as e:
            return {
                'statusCode': 500,
                'headers': cors_headers(),
                'body': json.dumps({'error': 'Failed to fetch profile', 'message': str(e)}),
            }

    # ── POST /citizen — save / upsert full profile ──────────────────────────
    try:
        body = json.loads(event.get('body', '{}')) if isinstance(event.get('body'), str) else event

        # Use cognitoUserId if provided (user-mapped); fall back to a name-slug for anonymous sessions
        cognito_user_id = body.get('cognitoUserId', '').strip()
        name = body.get('name', '').strip()
        citizen_id = cognito_user_id if cognito_user_id else f"anon-{name.lower().replace(' ', '-')}" if name else 'anon-unknown'

        now = datetime.utcnow().isoformat()

        # Accept income as either 'income' (frontend) or 'monthlyIncome' (legacy)
        income = int(body.get('income', 0) or body.get('monthlyIncome', 0) or 0)

        citizen = {
            'citizenId': citizen_id,

            # Core profile fields
            'name': name or 'Unknown',
            'age': int(body.get('age', 0) or 0),
            'gender': body.get('gender', 'any').lower().strip() if body.get('gender') else 'any',
            'state': body.get('state', '').strip(),
            'income': income,
            'monthlyIncome': income,          # keep backward compat
            'category': body.get('category', 'General').strip() if body.get('category') else 'General',
            'urban': body.get('urban'),       # can be True/False/'urban'/'rural'
            'persona': body.get('persona', '').strip() if body.get('persona') else '',
            'occupation': body.get('occupation', '').strip() if body.get('occupation') else body.get('persona', ''),

            # Boolean flags
            'isWidow': to_bool(body.get('isWidow', False)),
            'disability': to_bool(body.get('disability', False)),
            'hasDisability': to_bool(body.get('hasDisability', False)),
            'pregnant': to_bool(body.get('pregnant', False)),
            'shgMember': to_bool(body.get('shgMember', False)),
            'landOwned': to_bool(body.get('landOwned', False)),
            'hasRationCard': to_bool(body.get('hasRationCard', False)),
            'hasJobCard': to_bool(body.get('hasJobCard', False)),
            'hasEnterprise': to_bool(body.get('hasEnterprise', False)),
            'seekingWork': to_bool(body.get('seekingWork', False)),

            # Additional fields
            'educationLevel': body.get('educationLevel', ''),
            'panchayatId': body.get('panchayatId', 'rampur-barabanki-up'),

            # Scheme data
            'matchedSchemes': convert_to_dynamodb(body.get('matchedSchemes', [])),
            'enrolledSchemes': convert_to_dynamodb(body.get('enrolledSchemes', [])),
            'totalAnnualBenefit': int(body.get('totalAnnualBenefit', 0) or 0),
            'status': 'eligible' if body.get('matchedSchemes') else 'pending',

            'updatedAt': now,
        }

        # Preserve createdAt on updates (don't overwrite if record already exists)
        existing = table.get_item(Key={'citizenId': citizen_id}).get('Item')
        citizen['createdAt'] = existing['createdAt'] if existing else now

        table.put_item(Item=citizen)

        return {
            'statusCode': 200,
            'headers': cors_headers(),
            'body': json.dumps({'citizenId': citizen_id, 'status': 'saved'}),
        }

    except Exception as e:
        return {
            'statusCode': 500,
            'headers': cors_headers(),
            'body': json.dumps({'error': 'Internal server error', 'message': str(e)}),
        }
