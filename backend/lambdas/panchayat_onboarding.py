"""
Panchayat Onboarding Lambda — search, claim, and profile management.

Routes handled:
  GET  /panchayat/search?state=X&district=Y&block=Z  → Search panchayats from SarathiPanchayats
  POST /panchayat/claim                              → Claim a panchayat (auto-approve for demo)
  GET  /panchayat/{id}/profile                       → Fetch panchayat profile

Environment variables:
  AUTO_APPROVE=true   — skip BDO verification (for hackathon/demo)
  PANCHAYAT_POOL_ID   — Cognito User Pool ID for the panchayat pool
"""
import json
import os
import boto3
from decimal import Decimal
from datetime import datetime, timezone

REGION = os.environ.get('AWS_REGION', 'us-east-1')
AUTO_APPROVE = os.environ.get('AUTO_APPROVE', 'true').lower() == 'true'
PANCHAYAT_POOL_ID = os.environ.get('PANCHAYAT_POOL_ID', 'us-east-1_7lFWvsXg3')

dynamodb = boto3.resource('dynamodb', region_name=REGION)
panchayats_table = dynamodb.Table('SarathiPanchayats')
cognito = boto3.client('cognito-idp', region_name=REGION)


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


def handle_search(event):
    """Search panchayats by state, district, block."""
    params = event.get('queryStringParameters') or {}
    state = params.get('state', '').strip()
    district = params.get('district', '').strip()
    block = params.get('block', '').strip()

    if not state:
        return response(400, {'error': 'state parameter is required'})

    from boto3.dynamodb.conditions import Key, Attr

    if district:
        # Use GSI: state + district
        result = panchayats_table.query(
            IndexName='state-district-index',
            KeyConditionExpression=Key('state').eq(state) & Key('district').eq(district),
        )
        items = result.get('Items', [])

        # Filter by block if specified
        if block:
            items = [p for p in items if p.get('block', '').lower() == block.lower()]
    else:
        # Query by state only (scan with filter — OK for demo, not ideal at scale)
        result = panchayats_table.query(
            IndexName='state-district-index',
            KeyConditionExpression=Key('state').eq(state),
        )
        items = result.get('Items', [])

    # Return simplified results for dropdown (limit to 200 for performance)
    panchayats = [{
        'panchayatId': p['panchayatId'],
        'lgdCode': p.get('lgdCode', ''),
        'panchayatName': p.get('panchayatName', ''),
        'block': p.get('block', ''),
        'district': p.get('district', ''),
        'state': p.get('state', ''),
        'status': p.get('status', 'unclaimed'),
    } for p in items[:200]]

    return response(200, {
        'count': len(panchayats),
        'panchayats': panchayats,
    })


def handle_claim(event):
    """Claim a panchayat — link it to a Cognito user."""
    try:
        body = json.loads(event.get('body', '{}'))
    except:
        return response(400, {'error': 'Invalid JSON body'})

    lgd_code = body.get('lgdCode', '').strip()
    official_name = body.get('officialName', '').strip()
    role = body.get('role', 'sarpanch').strip()
    cognito_sub = body.get('cognitoSub', '').strip()
    email = body.get('email', '').strip()

    if not lgd_code:
        return response(400, {'error': 'lgdCode is required'})
    if not official_name:
        return response(400, {'error': 'officialName is required'})

    panchayat_id = f"LGD_{lgd_code}"

    # Fetch panchayat record
    result = panchayats_table.get_item(Key={'panchayatId': panchayat_id})
    panchayat = result.get('Item')

    if not panchayat:
        return response(404, {'error': f'Panchayat with LGD code {lgd_code} not found in registry'})

    # Check if already claimed
    if panchayat.get('status') == 'active' and panchayat.get('officialCognitoSub'):
        return response(409, {
            'error': 'This panchayat is already claimed by another official',
            'officialName': panchayat.get('officialName', 'Unknown'),
            'message': 'Contact the Block Development Officer (BDO) to resolve this.',
        })

    # Claim the panchayat
    now = datetime.now(timezone.utc).isoformat()
    status = 'active' if AUTO_APPROVE else 'pending_verification'

    panchayats_table.update_item(
        Key={'panchayatId': panchayat_id},
        UpdateExpression='SET #s = :status, officialName = :name, officialCognitoSub = :sub, #r = :role, registeredAt = :now, verified = :verified',
        ExpressionAttributeNames={'#s': 'status', '#r': 'role'},
        ExpressionAttributeValues={
            ':status': status,
            ':name': official_name,
            ':sub': cognito_sub,
            ':role': role,
            ':now': now,
            ':verified': AUTO_APPROVE,
        },
    )

    # Set Cognito custom attributes
    if cognito_sub and email:
        try:
            cognito.admin_update_user_attributes(
                UserPoolId=PANCHAYAT_POOL_ID,
                Username=email,
                UserAttributes=[
                    {'Name': 'custom:panchayatId', 'Value': panchayat_id},
                    {'Name': 'custom:lgdCode', 'Value': lgd_code},
                    {'Name': 'custom:panchayatRole', 'Value': role},
                    {'Name': 'custom:panchayatState', 'Value': panchayat.get('state', '')},
                    {'Name': 'custom:district', 'Value': panchayat.get('district', '')},
                    {'Name': 'custom:panchayatName', 'Value': panchayat.get('panchayatName', '')},
                ],
            )
        except Exception as e:
            print(f"[WARN] Failed to set Cognito attributes: {e}")
            # Don't fail the claim — DynamoDB is the source of truth

    return response(200, {
        'panchayatId': panchayat_id,
        'panchayatName': panchayat.get('panchayatName', ''),
        'status': status,
        'message': 'Account activated!' if AUTO_APPROVE else 'Account pending BDO verification.',
    })


def handle_profile(event):
    """Fetch panchayat profile by panchayatId."""
    path_params = event.get('pathParameters') or {}
    panchayat_id = path_params.get('panchayatId', '').strip()

    # Try to get from JWT claims first
    claims = (event.get('requestContext', {}).get('authorizer', {}).get('claims') or {})
    jwt_panchayat_id = claims.get('custom:panchayatId', '')

    # Use JWT claim if available, otherwise path param
    pid = jwt_panchayat_id or panchayat_id

    if not pid:
        return response(400, {'error': 'panchayatId is required'})

    result = panchayats_table.get_item(Key={'panchayatId': pid})
    panchayat = result.get('Item')

    if not panchayat:
        return response(404, {'error': f'Panchayat {pid} not found'})

    return response(200, panchayat)


def lambda_handler(event, context):
    try:
        method = event.get('httpMethod', 'GET')
        path = event.get('path', '') or event.get('resource', '')

        # OPTIONS preflight
        if method == 'OPTIONS':
            return response(200, {})

        # Route dispatch
        if '/panchayat/search' in path and method == 'GET':
            return handle_search(event)
        elif '/panchayat/claim' in path and method == 'POST':
            return handle_claim(event)
        elif '/profile' in path and method == 'GET':
            return handle_profile(event)
        else:
            return response(404, {'error': f'Route not found: {method} {path}'})

    except Exception as e:
        print(f"[ERR] {e}")
        return response(500, {'error': 'Internal server error', 'message': str(e)})
