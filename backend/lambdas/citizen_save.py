import json
import boto3
import uuid
from datetime import datetime

dynamodb = boto3.resource('dynamodb', region_name='ap-south-1')
table = dynamodb.Table('SarathiCitizens')

def lambda_handler(event, context):
    body = json.loads(event.get('body', '{}')) if isinstance(event.get('body'), str) else event

    citizen = {
        'citizenId': str(uuid.uuid4()),
        'name': body.get('name', 'Unknown'),
        'age': int(body.get('age', 0)),
        'gender': body.get('gender', 'any'),
        'state': body.get('state', ''),
        'monthlyIncome': int(body.get('monthlyIncome', 0)),
        'category': body.get('category', 'General'),
        'isWidow': str(body.get('isWidow', False)).lower(),
        'occupation': body.get('occupation', 'any'),
        'panchayatId': body.get('panchayatId', 'rampur-barabanki-up'),
        'matchedSchemes': body.get('matchedSchemes', []),
        'enrolledSchemes': [],
        'status': 'eligible',
        'createdAt': datetime.utcnow().isoformat()
    }

    table.put_item(Item=citizen)

    return {
        'statusCode': 200,
        'headers': { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
        'body': json.dumps({ 'citizenId': citizen['citizenId'], 'status': 'saved' })
    }
