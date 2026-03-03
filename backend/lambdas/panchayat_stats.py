import json
import boto3
from decimal import Decimal
from boto3.dynamodb.conditions import Key

dynamodb = boto3.resource('dynamodb', region_name='us-east-1')
citizens_table = dynamodb.Table('SarathiCitizens')

# Known panchayat metadata — extend as needed
_PANCHAYAT_META = {
    'rampur-barabanki-up': {
        'panchayatName': 'Rampur Panchayat',
        'district': 'Barabanki',
        'state': 'Uttar Pradesh',
    },
}

def _panchayat_meta(panchayat_id):
    if panchayat_id in _PANCHAYAT_META:
        return _PANCHAYAT_META[panchayat_id]
    # Derive readable name from ID slug
    parts = panchayat_id.replace('-', ' ').split()
    return {
        'panchayatName': ' '.join(p.capitalize() for p in parts[:-2]) + ' Panchayat' if len(parts) > 2 else panchayat_id.replace('-', ' ').title(),
        'district': parts[-2].capitalize() if len(parts) >= 2 else 'Unknown',
        'state': parts[-1].upper() if len(parts) >= 1 else 'Unknown',
    }

class DecimalEncoder(json.JSONEncoder):
    def default(self, o):
        if isinstance(o, Decimal):
            return int(o) if o % 1 == 0 else float(o)
        return super().default(o)

def lambda_handler(event, context):
    try:
        panchayat_id = 'rampur-barabanki-up'
        if event.get('pathParameters'):
            panchayat_id = event['pathParameters'].get('panchayatId', panchayat_id)

        # Query via GSI for efficiency — no full table scan
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
        zero     = [c for c in citizens if c.get('status') == 'none']

        # Build dynamic alerts from data
        alerts = []
        widows_unserved = [c for c in eligible if c.get('isWidow') in (True, 'true', 'yes', '1')]
        if widows_unserved:
            alerts.append({
                'type': 'widow_pension',
                'urgency': 'high',
                'count': len(widows_unserved),
                'title': f'{len(widows_unserved)} widows eligible for pension but not enrolled',
                'description': f'{len(widows_unserved)} widows eligible for pension but not enrolled'
            })

        elderly_unserved = [c for c in eligible if int(c.get('age', 0)) >= 60]
        if elderly_unserved:
            alerts.append({
                'type': 'old_age_pension',
                'urgency': 'high',
                'count': len(elderly_unserved),
                'title': f'{len(elderly_unserved)} elderly citizens missing old age pension',
                'description': f'{len(elderly_unserved)} elderly citizens missing old age pension'
            })

        meta = _panchayat_meta(panchayat_id)
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type,Authorization',
                'Content-Type': 'application/json'
            },
            'body': json.dumps({
                'panchayatId': panchayat_id,
                'panchayatName': meta['panchayatName'],
                'district': meta['district'],
                'state': meta['state'],
                'totalHouseholds': len(citizens),
                'enrolled': len(enrolled),
                'eligibleNotEnrolled': len(eligible),
                'zeroBenefits': len(zero),
                'households': citizens,
                'alerts': alerts
            }, cls=DecimalEncoder)
        }
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type,Authorization', 'Content-Type': 'application/json' },
            'body': json.dumps({ 'error': 'Internal server error', 'message': str(e) })
        }
