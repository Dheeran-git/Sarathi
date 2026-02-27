import json
import boto3
from boto3.dynamodb.conditions import Attr

dynamodb = boto3.resource('dynamodb', region_name='ap-south-1')
citizens_table = dynamodb.Table('SarathiCitizens')

def lambda_handler(event, context):
    panchayat_id = event.get('pathParameters', {}).get('panchayatId', 'rampur-barabanki-up')

    # Scan for all citizens in this panchayat
    response = citizens_table.scan(
        FilterExpression=Attr('panchayatId').eq(panchayat_id)
    )
    citizens = response.get('Items', [])

    # Count by status
    enrolled = [c for c in citizens if c.get('status') == 'enrolled']
    eligible  = [c for c in citizens if c.get('status') == 'eligible']
    zero      = [c for c in citizens if c.get('status') == 'none']

    # Build alerts
    alerts = []
    widows_unserved = [c for c in eligible if c.get('isWidow') == 'true']
    if widows_unserved:
        alerts.append({
            'type': 'widow_pension',
            'urgency': 'high',
            'count': len(widows_unserved),
            'title': f'{len(widows_unserved)} विधवाएं पेंशन से वंचित',
            'description': f'{len(widows_unserved)} widows eligible for pension but not enrolled'
        })

    elderly_unserved = [c for c in eligible if int(c.get('age', 0)) >= 60]
    if elderly_unserved:
        alerts.append({
            'type': 'old_age_pension',
            'urgency': 'high',
            'count': len(elderly_unserved),
            'title': f'{len(elderly_unserved)} बुजुर्ग पेंशन से वंचित',
            'description': f'{len(elderly_unserved)} elderly citizens missing old age pension'
        })

    return {
        'statusCode': 200,
        'headers': { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
        'body': json.dumps({
            'panchayatId': panchayat_id,
            'panchayatName': 'Rampur Panchayat',
            'district': 'Barabanki',
            'state': 'Uttar Pradesh',
            'totalHouseholds': len(citizens),
            'enrolled': len(enrolled),
            'eligibleNotEnrolled': len(eligible),
            'zeroBenefits': len(zero),
            'households': citizens,
            'alerts': alerts
        })
    }
