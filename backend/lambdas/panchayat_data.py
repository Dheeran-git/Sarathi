"""
panchayat_data — CRUD for panchayat-level features stored as nested attributes
in the SarathiPanchayats DynamoDB table.

Routes:
  GET    /panchayat/{panchayatId}/campaigns     → list campaigns
  POST   /panchayat/{panchayatId}/campaigns     → add/replace campaigns
  GET    /panchayat/{panchayatId}/grievances    → list grievances
  POST   /panchayat/{panchayatId}/grievances    → add/replace grievances
  GET    /panchayat/{panchayatId}/calendar       → list calendar events
  POST   /panchayat/{panchayatId}/calendar       → add/replace calendar events
  GET    /panchayat/{panchayatId}/village-profile → get village profile
  POST   /panchayat/{panchayatId}/village-profile → update village profile
  GET    /panchayat/{panchayatId}/analytics      → get analytics data
  POST   /panchayat/{panchayatId}/analytics      → update analytics data
"""
import json
import os
import boto3
from datetime import datetime, timezone
from decimal import Decimal

REGION = os.environ.get('AWS_REGION', 'us-east-1')
dynamodb = boto3.resource('dynamodb', region_name=REGION)
panchayats_table = dynamodb.Table('SarathiPanchayats')


class DecimalEncoder(json.JSONEncoder):
    def default(self, o):
        if isinstance(o, Decimal):
            return int(o) if o % 1 == 0 else float(o)
        return super().default(o)


def cors_headers():
    return {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization',
        'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
        'Content-Type': 'application/json',
    }


def response(status, body):
    return {
        'statusCode': status,
        'headers': cors_headers(),
        'body': json.dumps(body, cls=DecimalEncoder),
    }


# Map URL segments to DynamoDB attribute names
FEATURE_MAP = {
    'campaigns': 'campaigns',
    'grievances': 'grievances',
    'calendar': 'calendarEvents',
    'village-profile': 'villageProfile',
    'analytics': 'analyticsData',
}


def _convert_floats(obj):
    """Recursively convert floats to Decimal for DynamoDB."""
    if isinstance(obj, float):
        return Decimal(str(obj))
    if isinstance(obj, dict):
        return {k: _convert_floats(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [_convert_floats(i) for i in obj]
    return obj


def handle_get(panchayat_id, feature_key):
    """Get a nested feature attribute from SarathiPanchayats."""
    attr_name = FEATURE_MAP.get(feature_key)
    if not attr_name:
        return response(400, {'error': f'Unknown feature: {feature_key}'})

    result = panchayats_table.get_item(
        Key={'panchayatId': panchayat_id},
        ProjectionExpression=attr_name,
    )
    item = result.get('Item', {})
    data = item.get(attr_name, [] if feature_key != 'village-profile' else {})
    return response(200, {'panchayatId': panchayat_id, feature_key: data})


def handle_post(panchayat_id, feature_key, body):
    """Update a nested feature attribute in SarathiPanchayats."""
    attr_name = FEATURE_MAP.get(feature_key)
    if not attr_name:
        return response(400, {'error': f'Unknown feature: {feature_key}'})

    data = body.get('data') or body.get(feature_key) or body
    data = _convert_floats(data)

    panchayats_table.update_item(
        Key={'panchayatId': panchayat_id},
        UpdateExpression='SET #attr = :val, updatedAt = :now',
        ExpressionAttributeNames={'#attr': attr_name},
        ExpressionAttributeValues={
            ':val': data,
            ':now': datetime.now(timezone.utc).isoformat(),
        },
    )

    return response(200, {
        'panchayatId': panchayat_id,
        'updated': attr_name,
        'message': f'{feature_key} updated successfully',
    })


def lambda_handler(event, context):
    try:
        method = event.get('httpMethod', 'GET')
        path = event.get('path', '') or event.get('resource', '')
        path_params = event.get('pathParameters') or {}
        panchayat_id = path_params.get('panchayatId', '').strip()

        if method == 'OPTIONS':
            return response(200, {})

        if not panchayat_id:
            return response(400, {'error': 'panchayatId is required'})

        # Extract feature from path: /panchayat/{id}/campaigns → campaigns
        feature_key = None
        for key in FEATURE_MAP:
            if key in path:
                feature_key = key
                break

        if not feature_key:
            return response(404, {'error': f'Route not found: {method} {path}'})

        if method == 'GET':
            return handle_get(panchayat_id, feature_key)
        elif method == 'POST':
            body = json.loads(event.get('body', '{}')) if isinstance(event.get('body'), str) else event
            return handle_post(panchayat_id, feature_key, body)
        else:
            return response(405, {'error': f'Method not allowed: {method}'})

    except Exception as e:
        print(f"[ERR] panchayat_data: {e}")
        return response(500, {'error': 'Internal server error', 'message': str(e)})
