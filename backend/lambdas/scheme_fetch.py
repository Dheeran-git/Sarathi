import json
import boto3
from decimal import Decimal

dynamodb = boto3.resource('dynamodb', region_name='ap-south-1')
table = dynamodb.Table('SarathiSchemes')

class DecimalEncoder(json.JSONEncoder):
    def default(self, o):
        if isinstance(o, Decimal):
            return int(o) if o % 1 == 0 else float(o)
        return super().default(o)

def lambda_handler(event, context):
    scheme_id = event.get('pathParameters', {}).get('schemeId', '')
    if not scheme_id:
        scheme_id = event.get('schemeId', '')

    response = table.get_item(Key={ 'schemeId': scheme_id })
    item = response.get('Item')

    if not item:
        return {
            'statusCode': 404,
            'headers': { 'Access-Control-Allow-Origin': '*' },
            'body': json.dumps({ 'error': 'Scheme not found' })
        }

    return {
        'statusCode': 200,
        'headers': { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
        'body': json.dumps(item, cls=DecimalEncoder)
    }
