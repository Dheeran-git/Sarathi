"""
Panchayat Stats Lambda — upgraded for real panchayat identity.

Extracts panchayatId from:
1. JWT claims (custom:panchayatId) — for authenticated requests
2. Path parameter — fallback
3. No more hardcoded 'rampur-barabanki-up' default

Also fetches panchayat metadata from SarathiPanchayats table.
"""
import json
import os
import boto3
from decimal import Decimal
from boto3.dynamodb.conditions import Key

REGION = os.environ.get('AWS_REGION', 'us-east-1')
dynamodb = boto3.resource('dynamodb', region_name=REGION)
citizens_table = dynamodb.Table('SarathiCitizens')
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
        'Content-Type': 'application/json',
    }


def get_panchayat_id(event):
    """Extract panchayatId: JWT first, then path param. No hardcoded default."""
    # 1. Try JWT claims
    claims = (event.get('requestContext', {}).get('authorizer', {}).get('claims') or {})
    jwt_pid = claims.get('custom:panchayatId', '').strip()
    if jwt_pid:
        return jwt_pid

    # 2. Try path parameter
    path_params = event.get('pathParameters') or {}
    path_pid = path_params.get('panchayatId', '').strip()
    if path_pid:
        return path_pid

    return None


def get_panchayat_meta(panchayat_id):
    """Fetch panchayat metadata from SarathiPanchayats table."""
    try:
        result = panchayats_table.get_item(Key={'panchayatId': panchayat_id})
        item = result.get('Item')
        if item:
            return {
                'panchayatName': item.get('panchayatName', 'Unknown Panchayat'),
                'district': item.get('district', 'Unknown'),
                'state': item.get('state', 'Unknown'),
                'block': item.get('block', ''),
                'lgdCode': item.get('lgdCode', ''),
            }
    except Exception as e:
        print(f"[WARN] Failed to fetch panchayat meta: {e}")

    # Fallback: derive from panchayat ID
    if panchayat_id.startswith('LGD_'):
        return {
            'panchayatName': f'Panchayat {panchayat_id[4:]}',
            'district': 'Unknown',
            'state': 'Unknown',
            'block': '',
            'lgdCode': panchayat_id[4:],
        }
    # Legacy slug format
    parts = panchayat_id.replace('-', ' ').split()
    return {
        'panchayatName': ' '.join(p.capitalize() for p in parts[:-2]) + ' Panchayat' if len(parts) > 2 else panchayat_id.replace('-', ' ').title(),
        'district': parts[-2].capitalize() if len(parts) >= 2 else 'Unknown',
        'state': parts[-1].upper() if len(parts) >= 1 else 'Unknown',
    }


def lambda_handler(event, context):
    try:
        panchayat_id = get_panchayat_id(event)

        if not panchayat_id:
            return {
                'statusCode': 400,
                'headers': cors_headers(),
                'body': json.dumps({'error': 'No panchayatId found. Please log in with a panchayat account.'}),
            }

        # Query citizens via GSI
        citizens = []
        response = citizens_table.query(
            IndexName='panchayatId-updatedAt-index',
            KeyConditionExpression=Key('panchayatId').eq(panchayat_id),
            ScanIndexForward=False,
        )
        citizens.extend(response.get('Items', []))
        while 'LastEvaluatedKey' in response:
            response = citizens_table.query(
                IndexName='panchayatId-updatedAt-index',
                KeyConditionExpression=Key('panchayatId').eq(panchayat_id),
                ScanIndexForward=False,
                ExclusiveStartKey=response['LastEvaluatedKey'],
            )
            citizens.extend(response.get('Items', []))

        # Count by status
        enrolled = [c for c in citizens if c.get('status') == 'enrolled']
        eligible = [c for c in citizens if c.get('status') == 'eligible']
        zero = [c for c in citizens if c.get('status') == 'none']

        total = len(citizens)
        enrolled_count = len(enrolled)
        eligible_count = len(eligible)

        # Compute performance score (0-100)
        receiving_pct = round((enrolled_count / total) * 100) if total > 0 else 0
        performance_score = min(100, receiving_pct + (10 if total > 5 else 0))

        # Compute welfare gap (estimated ₹ value)
        avg_benefit = 15000  # ₹15,000 average annual benefit per scheme
        welfare_gap = eligible_count * avg_benefit

        # Build dynamic alerts
        alerts = []
        widows_unserved = [c for c in eligible if c.get('isWidow') in (True, 'true', 'yes', '1')]
        if widows_unserved:
            alerts.append({
                'type': 'widow_pension', 'urgency': 'high',
                'count': len(widows_unserved),
                'title': f'{len(widows_unserved)} widows eligible for pension but not enrolled',
                'description': f'{len(widows_unserved)} widows eligible for pension but not enrolled',
            })

        elderly_unserved = [c for c in eligible if int(c.get('age', 0)) >= 60]
        if elderly_unserved:
            alerts.append({
                'type': 'old_age_pension', 'urgency': 'high',
                'count': len(elderly_unserved),
                'title': f'{len(elderly_unserved)} elderly citizens missing old age pension',
                'description': f'{len(elderly_unserved)} elderly citizens missing old age pension',
            })

        meta = get_panchayat_meta(panchayat_id)

        return {
            'statusCode': 200,
            'headers': cors_headers(),
            'body': json.dumps({
                'panchayatId': panchayat_id,
                'panchayatName': meta['panchayatName'],
                'district': meta['district'],
                'state': meta['state'],
                'block': meta.get('block', ''),
                'lgdCode': meta.get('lgdCode', ''),
                'totalHouseholds': total,
                'enrolled': enrolled_count,
                'eligibleNotEnrolled': eligible_count,
                'zeroBenefits': len(zero),
                'receivingPercent': receiving_pct,
                'performanceScore': performance_score,
                'welfareGapAmount': welfare_gap,
                'households': citizens,
                'alerts': alerts,
            }, cls=DecimalEncoder),
        }

    except Exception as e:
        return {
            'statusCode': 500,
            'headers': cors_headers(),
            'body': json.dumps({'error': 'Internal server error', 'message': str(e)}),
        }
