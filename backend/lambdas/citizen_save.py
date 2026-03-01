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

    # ── POST /citizen — save / upsert profile ───────────────────────────────
    try:
        body = json.loads(event.get('body', '{}')) if isinstance(event.get('body'), str) else event

        name = body.get('name', '').strip()
        if not name:
            return {
                'statusCode': 400,
                'headers': cors_headers(),
                'body': json.dumps({'error': 'Name is required'}),
            }

        # Use cognitoUserId if provided (user-mapped); fall back to a name-slug for anonymous sessions
        cognito_user_id = body.get('cognitoUserId', '').strip()
        citizen_id = cognito_user_id if cognito_user_id else f"anon-{name.lower().replace(' ', '-')}"

        now = datetime.utcnow().isoformat()

        citizen = {
            'citizenId': citizen_id,
            'name': name,
            'age': int(body.get('age', 0)),
            'gender': body.get('gender', 'any').lower().strip(),
            'state': body.get('state', '').strip(),
            'monthlyIncome': int(body.get('monthlyIncome', 0)),
            'category': body.get('category', 'General').strip(),
            'isWidow': str(body.get('isWidow', False)).lower() in ('true', '1', 'yes'),
            'occupation': body.get('occupation', 'any').lower().strip(),
            'panchayatId': body.get('panchayatId', 'rampur-barabanki-up'),
            'matchedSchemes': convert_to_dynamodb(body.get('matchedSchemes', [])),
            'enrolledSchemes': convert_to_dynamodb(body.get('enrolledSchemes', [])),
            'totalAnnualBenefit': int(body.get('totalAnnualBenefit', 0)),
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
