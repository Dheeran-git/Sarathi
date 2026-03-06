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
    'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token',
    'Access-Control-Allow-Methods': 'GET,POST,PATCH,OPTIONS',
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


def _normalize_pid(pid):
    """Ensure panchayatId has the LGD_ prefix if it's numeric."""
    if not pid: return 'unassigned'
    p = str(pid).strip()
    if p.isdigit() and not p.startswith('LGD_'):
        return f"LGD_{p}"
    return p


def handle_post_apply(event):
    """POST /apply — create a new application."""
    body = _body(event)
    citizen_id = body.get('citizenId', '').strip()
    scheme_id  = body.get('schemeId', '').strip()
    panchayat_id = _normalize_pid(body.get('panchayatId', ''))
    
    if not citizen_id or not scheme_id:
        return _err(400, 'citizenId and schemeId are required')

    now = datetime.now(timezone.utc).isoformat()
    application_id = str(uuid.uuid4())[:8].upper()  # Short readable ID

    item = {
        'applicationId': application_id,
        'citizenId': citizen_id,
        'panchayatId': panchayat_id or 'unassigned',
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


def handle_get_panchayat_applications(event):
    """GET /panchayat-applications/{panchayatId} — query applications in a panchayat."""
    path_params = event.get('pathParameters') or {}
    panchayat_id = _normalize_pid(path_params.get('panchayatId', '').strip())

    if not panchayat_id or panchayat_id == 'unassigned':
        return _err(400, 'panchayatId path parameter is required')

    print(f"[DEBUG] Querying applications for panchayat: {panchayat_id}")
    try:
        resp = table.query(
            IndexName='panchayatId-createdAt-index',
            KeyConditionExpression=Key('panchayatId').eq(panchayat_id),
            ScanIndexForward=False,
            Limit=100
        )
        return _ok({'applications': resp.get('Items', []), 'count': resp.get('Count', 0)})
    except Exception as e:
        print(f"[ERROR] Panchayat query failed: {str(e)}")
        return _err(500, f"Database query failed: {str(e)}")


def handle_get_all_applications(event):
    """GET /applications/all — admin view of all applications."""
    print("[DEBUG] Scanning all applications...")
    try:
        # Scan all applications for admin view. 
        # For very large tables we would use pagination, but for now scan is fine.
        resp = table.scan() 
        items = resp.get('Items', [])
        
        # Log count
        print(f"[DEBUG] Found {len(items)} applications in first scan.")
        
        # Don't iterate overly many times in a single Lambda call to avoid 29s API GW timeout
        return _ok({'applications': items, 'count': len(items)})
    except Exception as e:
        print(f"[ERROR] Scan failed: {str(e)}")
        return _err(500, f"Database scan failed: {str(e)}")


def handle_get_applications(event):
    """GET /applications/{userId} — query citizen's applications."""
    print(f"[DEBUG] event: {json.dumps(event)}")
    path_params = event.get('pathParameters') or {}
    path = event.get('path', '')
    
    user_id = path_params.get('userId', '').strip()
    
    # Robust fallback: extract from path if parameter is missing
    if not user_id and '/applications/' in path:
        user_id = path.split('/applications/')[-1].split('/')[0].strip()
        print(f"[DEBUG] Parsed user_id from path: {user_id}")

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
    path = event.get('path', '')
    application_id = path_params.get('applicationId', '').strip()
    
    # Robust fallback: extract from path if parameter is missing (matches /apply/ID)
    if not application_id and '/apply/' in path:
        application_id = path.split('/apply/')[-1].split('/')[0].strip()
        print(f"[DEBUG] Parsed application_id from path: {application_id}")

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

        if method == 'GET' and path.startswith('/panchayat-applications/'):
            return handle_get_panchayat_applications(event)

        if method == 'GET' and path.startswith('/applications/'):
            return handle_get_applications(event)

        if (method == 'PATCH' or method == 'POST') and path.startswith('/apply/') and path != '/apply':
            return handle_patch_apply(event)

        return _err(404, f'No handler for {method} {path}')

    except Exception as e:
        print(f"[FATAL] Global error: {str(e)}")
        import traceback
        traceback.print_exc()
        return {
            'statusCode': 500,
            'headers': CORS_HEADERS,
            'body': json.dumps({'error': 'Internal server error', 'message': str(e)}),
        }
