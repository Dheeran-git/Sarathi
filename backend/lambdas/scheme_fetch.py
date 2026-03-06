import json
import boto3
from decimal import Decimal

dynamodb = boto3.resource('dynamodb', region_name='us-east-1')
table = dynamodb.Table('SarathiSchemes')

class DecimalEncoder(json.JSONEncoder):
    def default(self, o):
        if isinstance(o, Decimal):
            return int(o) if o % 1 == 0 else float(o)
        return super().default(o)

def lambda_handler(event, context):
    try:
        scheme_id = ''
        if event.get('pathParameters'):
            scheme_id = event['pathParameters'].get('schemeId', '')
        if not scheme_id:
            scheme_id = event.get('schemeId', '')

        if not scheme_id:
            return {
                'statusCode': 400,
                'headers': { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Amz-Date,X-Api-Key', 'Access-Control-Allow-Methods': 'GET,POST,PATCH,OPTIONS', 'Content-Type': 'application/json' },
                'body': json.dumps({ 'error': 'schemeId is required' })
            }

        if scheme_id.lower() == 'all':
            response = table.scan()
            items = response.get('Items', [])
            while 'LastEvaluatedKey' in response:
                response = table.scan(ExclusiveStartKey=response['LastEvaluatedKey'])
                items.extend(response.get('Items', []))
            
            # Filter for Published schemes only for public endpoint
            items = [item for item in items if item.get('status') == 'Published']
            
            # Return lightweight data for listing (full details via individual fetch)
            listing = []
            for item in items:
                listing.append({
                    'schemeId': item.get('schemeId', ''),
                    'nameEnglish': item.get('nameEnglish', ''),
                    'shortTitle': item.get('shortTitle', ''),
                    'level': item.get('level', ''),
                    'type': item.get('type', ''),
                    'state': item.get('state', []),
                    'ministry': item.get('ministry', ''),
                    'categories': item.get('categories', []),
                    'tags': item.get('tags', []),
                    'briefDescription': str(item.get('briefDescription', ''))[:200],
                    'applyUrl': item.get('applyUrl', ''),
                    'annualBenefit': item.get('annualBenefit', 0),
                })
            
            return {
                'statusCode': 200,
                'headers': {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Amz-Date,X-Api-Key',
                    'Access-Control-Allow-Methods': 'GET,POST,PATCH,OPTIONS',
                    'Content-Type': 'application/json'
                },
                'body': json.dumps(listing, cls=DecimalEncoder)
            }

        response = table.get_item(Key={ 'schemeId': scheme_id })
        item = response.get('Item')

        if not item:
            return {
                'statusCode': 404,
                'headers': { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Amz-Date,X-Api-Key', 'Access-Control-Allow-Methods': 'GET,POST,PATCH,OPTIONS', 'Content-Type': 'application/json' },
                'body': json.dumps({ 'error': 'Scheme not found' })
            }

        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Amz-Date,X-Api-Key',
                'Access-Control-Allow-Methods': 'GET,POST,PATCH,OPTIONS',
                'Content-Type': 'application/json'
            },
            'body': json.dumps(item, cls=DecimalEncoder)
        }
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Amz-Date,X-Api-Key', 'Access-Control-Allow-Methods': 'GET,POST,PATCH,OPTIONS', 'Content-Type': 'application/json' },
            'body': json.dumps({ 'error': 'Internal server error', 'message': str(e) })
        }
