"""
A5: sarathi-applications Lambda
Routes:
  POST /apply              — create new application
  GET  /applications/{userId} — list citizen's applications
  PATCH /apply/{applicationId} — update status
"""
import json
import boto3
import uuid
from datetime import datetime, timezone
from decimal import Decimal
from boto3.dynamodb.conditions import Key

dynamodb = boto3.resource('dynamodb', region_name='us-east-1')
table = dynamodb.Table('SarathiApplications')

CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    'Content-Type': 'application/json',
}

VALID_STATUSES = {'pending', 'submitted', 'approved', 'rejected'}


class DecimalEncoder(json.JSONEncoder):
    def default(self, o):
        if isinstance(o, Decimal):
            return int(o) if o % 1 == 0 else float(o)
        return super().default(o)


def _ok(data):
    return {
        'statusCode': 200,
        'headers': CORS_HEADERS,
        'body': json.dumps(data, cls=DecimalEncoder),
    }


def _err(code, message):
    return {
        'statusCode': code,
        'headers': CORS_HEADERS,
        'body': json.dumps({'error': message}),
    }


def _body(event):
    raw = event.get('body', '{}') or '{}'
    return json.loads(raw) if isinstance(raw, str) else raw


def handle_post_apply(event):
    """POST /apply — create a new application, OR list applications via action param."""
    body = _body(event)

    # Action-based routing: 'list' for citizen, 'listAll' for admin
    action = body.get('action', '').strip()

    if action == 'listAll':
        resp = table.scan(Limit=200)
        items = resp.get('Items', [])
        while 'LastEvaluatedKey' in resp and len(items) < 500:
            resp = table.scan(ExclusiveStartKey=resp['LastEvaluatedKey'], Limit=200)
            items.extend(resp.get('Items', []))
        return _ok({'applications': items, 'count': len(items)})

    if action == 'list':
        citizen_id = body.get('citizenId', '').strip()
        if not citizen_id:
            return _err(400, 'citizenId is required for action=list')
        resp = table.query(
            IndexName='citizenId-createdAt-index',
            KeyConditionExpression=Key('citizenId').eq(citizen_id),
            ScanIndexForward=False,
            Limit=50,
        )
        return _ok({'applications': resp.get('Items', []), 'count': resp.get('Count', 0)})

    # Default: create a new application
    citizen_id = body.get('citizenId', '').strip()
    scheme_id  = body.get('schemeId', '').strip()
    if not citizen_id or not scheme_id:
        return _err(400, 'citizenId and schemeId are required')

    now = datetime.now(timezone.utc).isoformat()
    application_id = str(uuid.uuid4())[:8].upper()  # Short readable ID

    item = {
        'applicationId': application_id,
        'citizenId': citizen_id,
        'schemeId': scheme_id,
        'schemeName': body.get('schemeName', ''),
        'status': 'submitted',
        'documentsChecked': body.get('documentsChecked', []),
        'personalDetails': {
            'name': body.get('personalDetails', {}).get('name', ''),
            'aadhaarLast4': body.get('personalDetails', {}).get('aadhaarLast4', ''),
            'mobile': body.get('personalDetails', {}).get('mobile', ''),
            'bankAccountLast4': body.get('personalDetails', {}).get('bankAccountLast4', ''),
        },
        'notes': body.get('notes', ''),
        'createdAt': now,
        'updatedAt': now,
    }

    table.put_item(Item=item)
    return _ok({'applicationId': application_id, 'status': 'submitted', 'createdAt': now})


def handle_get_all_applications(event):
    """GET /applications/all — admin view of all applications."""
    resp = table.scan(Limit=100)
    items = resp.get('Items', [])
    while 'LastEvaluatedKey' in resp and len(items) < 500:
        resp = table.scan(ExclusiveStartKey=resp['LastEvaluatedKey'], Limit=100)
        items.extend(resp.get('Items', []))
    return _ok({'applications': items, 'count': len(items)})


def handle_get_applications(event):
    """GET /applications/{userId} — query citizen's applications."""
    path_params = event.get('pathParameters') or {}
    user_id = path_params.get('userId', '').strip()
    if not user_id:
        return _err(400, 'userId path parameter is required')

    if user_id.lower() == 'all':
        return handle_get_all_applications(event)

    resp = table.query(
        IndexName='citizenId-createdAt-index',
        KeyConditionExpression=Key('citizenId').eq(user_id),
        ScanIndexForward=False,
        Limit=50,
    )
    return _ok({'applications': resp.get('Items', []), 'count': resp.get('Count', 0)})


def handle_patch_apply(event):
    """PATCH /apply/{applicationId} — update status."""
    path_params = event.get('pathParameters') or {}
    application_id = path_params.get('applicationId', '').strip()
    if not application_id:
        return _err(400, 'applicationId path parameter is required')

    body = _body(event)
    new_status = body.get('status', '').lower()
    if new_status not in VALID_STATUSES:
        return _err(400, f'status must be one of: {", ".join(sorted(VALID_STATUSES))}')

    now = datetime.now(timezone.utc).isoformat()
    table.update_item(
        Key={'applicationId': application_id},
        UpdateExpression='SET #s = :s, updatedAt = :u',
        ExpressionAttributeNames={'#s': 'status'},
        ExpressionAttributeValues={':s': new_status, ':u': now},
    )
    return _ok({'applicationId': application_id, 'status': new_status, 'updatedAt': now})


def lambda_handler(event, context):
    try:
        method = event.get('httpMethod', '')
        path   = event.get('path', '')

        if method == 'OPTIONS':
            return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': ''}

        if method == 'POST' and path == '/apply':
            return handle_post_apply(event)

        if method == 'GET' and path.startswith('/applications/'):
            return handle_get_applications(event)

        if method == 'PATCH' and path.startswith('/apply/'):
            return handle_patch_apply(event)

        return _err(404, f'No handler for {method} {path}')

    except Exception as e:
        return {
            'statusCode': 500,
            'headers': CORS_HEADERS,
            'body': json.dumps({'error': 'Internal server error', 'message': str(e)}),
        }
