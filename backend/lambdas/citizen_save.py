import json
import boto3
import uuid
from decimal import Decimal
from datetime import datetime

dynamodb = boto3.resource('dynamodb', region_name='ap-south-1')
table = dynamodb.Table('SarathiCitizens')

def convert_to_dynamodb(obj):
    """Convert floats and nested structures to DynamoDB-safe types."""
    if isinstance(obj, float):
        return Decimal(str(obj))
    if isinstance(obj, dict):
        return {k: convert_to_dynamodb(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [convert_to_dynamodb(i) for i in obj]
    return obj

def lambda_handler(event, context):
    try:
        body = json.loads(event.get('body', '{}')) if isinstance(event.get('body'), str) else event

        # Validate required fields
        name = body.get('name', '').strip()
        if not name:
            return {
                'statusCode': 400,
                'headers': { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
                'body': json.dumps({ 'error': 'Name is required' })
            }

        citizen = {
            'citizenId': str(uuid.uuid4()),
            'name': name,
            'age': int(body.get('age', 0)),
            'gender': body.get('gender', 'any').lower().strip(),
            'state': body.get('state', '').strip(),
            'monthlyIncome': int(body.get('monthlyIncome', 0)),
            'category': body.get('category', 'General').strip(),
            'isWidow': str(body.get('isWidow', False)).lower(),
            'occupation': body.get('occupation', 'any').lower().strip(),
            'panchayatId': body.get('panchayatId', 'rampur-barabanki-up'),
            'matchedSchemes': convert_to_dynamodb(body.get('matchedSchemes', [])),
            'enrolledSchemes': [],
            'status': 'eligible',
            'createdAt': datetime.utcnow().isoformat()
        }

        table.put_item(Item=citizen)

        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type,Authorization',
                'Content-Type': 'application/json'
            },
            'body': json.dumps({ 'citizenId': citizen['citizenId'], 'status': 'saved' })
        }
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
            'body': json.dumps({ 'error': 'Internal server error', 'message': str(e) })
        }
