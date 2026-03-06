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
from datetime import datetime

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
        # If not in registry, we initialize it from metadata provided by the frontend
        print(f"[INFO] Initializing new panchayat record for {panchayat_id}")
        panchayat = {
            'panchayatId': panchayat_id,
            'lgdCode': lgd_code,
            'panchayatName': body.get('panchayatName', 'Unknown'),
            'state': body.get('state', 'Unknown'),
            'district': body.get('district', 'Unknown'),
            'block': body.get('block', 'Unknown'),
            'status': 'unclaimed',
            'officials': {}
        }
        # In this case, we don't return 404. We continue and Let the update_item initialize it.

    officials = panchayat.get('officials', {})

    # Check if this specific role is already claimed
    if panchayat.get('status') == 'active' and panchayat.get('role') == role and not officials:
        return response(409, {
            'error': f'The {role.replace("_", " ").title()} role is already claimed',
            'officialName': panchayat.get('officialName', 'Unknown'),
            'message': 'Only one official per role is allowed per Gram Panchayat.',
        })

    if role in officials and officials[role].get('status') in ['active', 'pending_verification']:
        return response(409, {
            'error': f'The {role.replace("_", " ").title()} role is already claimed',
            'officialName': officials[role].get('name', 'Unknown'),
            'message': 'Only one official per role is allowed per Gram Panchayat.',
        })

    # Claim the panchayat role
    now = datetime.utcnow().isoformat()
    status = 'active' if AUTO_APPROVE else 'pending_verification'

    # Add to officials map
    officials[role] = {
        'name': official_name,
        'cognitoSub': cognito_sub,
        'email': email,
        'status': status,
        'registeredAt': now,
        'verified': AUTO_APPROVE
    }

    # If this is the FIRST official, we can also set the top-level fields for backwards compatibility
    update_expr = 'SET officials = :officials'
    expr_vals = {':officials': officials}
    expr_names = {}

    if not panchayat.get('status') or panchayat.get('status') == 'unclaimed':
        update_expr += ', #s = :status, officialName = :name, officialCognitoSub = :sub, #r = :role, registeredAt = :now, verified = :verified'
        expr_names['#s'] = 'status'
        expr_names['#r'] = 'role'
        expr_vals[':status'] = status
        expr_vals[':name'] = official_name
        expr_vals[':sub'] = cognito_sub
        expr_vals[':role'] = role
        expr_vals[':now'] = now
        expr_vals[':verified'] = AUTO_APPROVE

    kwargs = {
        'Key': {'panchayatId': panchayat_id},
        'UpdateExpression': update_expr,
        'ExpressionAttributeValues': expr_vals
    }
    if expr_names:
        kwargs['ExpressionAttributeNames'] = expr_names

    panchayats_table.update_item(**kwargs)

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


def handle_check_role(event):
    """Check if a panchayatId + role combination is already taken."""
    params = event.get('queryStringParameters') or {}
    pid = params.get('panchayatId', '').strip()
    role_to_check = params.get('role', '').strip()

    if not pid or not role_to_check:
        return response(400, {'error': 'panchayatId and role are required'})

    try:
        result = panchayats_table.get_item(Key={'panchayatId': pid})
        panchayat = result.get('Item')
        
        if panchayat:
            officials = panchayat.get('officials', {})
            
            # Legacy check for old single-official structure
            if panchayat.get('status') == 'active' and panchayat.get('role') == role_to_check and not officials:
                taken_by = panchayat.get('officialName', 'another official')
                return response(200, {
                    'available': False,
                    'message': f'This role is already taken by {taken_by}.',
                    'takenBy': taken_by,
                })

            # Modern map check
            if role_to_check in officials:
                status = officials[role_to_check].get('status', '')
                if status in ['active', 'pending_verification']:
                    taken_by = officials[role_to_check].get('name', 'another official')
                    return response(200, {
                        'available': False,
                        'message': f'This role is already taken by {taken_by}.',
                        'takenBy': taken_by,
                    })

        return response(200, {'available': True, 'message': 'This role is available.'})

    except Exception as e:
        print(f"[ERR] check-role: {e}")
        # If check fails, allow signup to proceed
        return response(200, {'available': True, 'message': 'Could not verify — proceeding.'})


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
        elif '/panchayat/check-role' in path and method == 'GET':
            return handle_check_role(event)
        elif '/profile' in path and method == 'GET':
            return handle_profile(event)
        else:
            return response(404, {'error': f'Route not found: {method} {path}'})

    except Exception as e:
        print(f"[ERR] {e}")
        return response(500, {'error': 'Internal server error', 'message': str(e)})

