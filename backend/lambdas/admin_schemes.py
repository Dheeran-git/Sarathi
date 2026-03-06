import json
import boto3
import uuid
import os
import traceback
from datetime import datetime, timezone
from decimal import Decimal

dynamo = boto3.resource('dynamodb', region_name='us-east-1')
table = dynamo.Table('SarathiSchemes')

CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
    'Content-Type': 'application/json',
}

class DecimalEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, Decimal):
            return int(obj) if obj % 1 == 0 else float(obj)
        return super(DecimalEncoder, self).default(obj)

def _ok(data, status=200):
    return {
        'statusCode': status,
        'headers': CORS_HEADERS,
        'body': json.dumps(data, cls=DecimalEncoder)
    }

def _err(status, message):
    return {
        'statusCode': status,
        'headers': CORS_HEADERS,
        'body': json.dumps({'error': message})
    }

def lambda_handler(event, context):
    try:
        print(f"[DEBUG] Event: {json.dumps(event)}")
        
        http_method = event.get('httpMethod', '')
        path = event.get('path', '')
        path_parameters = event.get('pathParameters') or {}
        
        if http_method == 'OPTIONS':
            return _ok({}, status=200)

        if http_method == 'GET':
            # Admin gets ALL schemes, including drafts
            print("[DEBUG] Scanning all schemes...")
            response = table.scan()
            items = response.get('Items', [])
            return _ok(items)
            
        elif http_method == 'POST':
            body = json.loads(event.get('body') or '{}')
            scheme_id = f"SCH-{str(uuid.uuid4())[:8]}"
            print(f"[DEBUG] Creating scheme {scheme_id}...")
            
            # Robust decimal conversion
            try:
                benefit = Decimal(str(body.get('annualBenefit', 0) or 0))
            except:
                benefit = Decimal('0')

            item = {
                'schemeId': scheme_id,
                'nameEnglish': body.get('nameEnglish', 'Untitled Scheme'),
                'ministry': body.get('ministry', 'Unknown'),
                'annualBenefit': benefit,
                'details': body.get('details', ''),
                'status': body.get('status', 'Draft'), 
                'category': body.get('category', 'General'),
                'stateCentralTag': body.get('stateCentralTag', 'Central'),
                'deadline': body.get('deadline', ''),
                'documentsRequiredEn': body.get('documentsRequiredEn', []),
                'applyUrl': body.get('applyUrl', ''),
                'viewCount': 0,
                'applicationCount': 0,
                'launchedBy': 'ADMIN-001',
                'createdAt': datetime.now(timezone.utc).isoformat()
            }
            
            table.put_item(Item=item)
            return _ok({'message': 'Scheme created', 'schemeId': scheme_id}, status=201)
            
        elif http_method == 'PUT':
            scheme_id = path_parameters.get('id')
            if not scheme_id and '/scheme/' in path:
                scheme_id = path.split('/scheme/')[-1].split('/')[0].strip()
                
            if not scheme_id:
                return _err(400, 'Missing scheme ID')
                
            body = json.loads(event.get('body') or '{}')
            print(f"[DEBUG] Updating scheme {scheme_id}...")
            
            try:
                benefit = Decimal(str(body.get('annualBenefit', 0) or 0))
            except:
                benefit = Decimal('0')

            # Simple full update
            update_expr = "SET #n = :n, ministry = :m, annualBenefit = :b, details = :d, #s = :s, category = :c, stateCentralTag = :t, deadline = :dl, documentsRequiredEn = :rd, applyUrl = :al, updatedAt = :u"
            attr_names = {'#n': 'nameEnglish', '#s': 'status'}
            attr_vals = {
                ':n': body.get('nameEnglish'),
                ':m': body.get('ministry'),
                ':b': benefit,
                ':d': body.get('details'),
                ':s': body.get('status'),
                ':c': body.get('category'),
                ':t': body.get('stateCentralTag'),
                ':dl': body.get('deadline'),
                ':rd': body.get('documentsRequiredEn', []),
                ':al': body.get('applyUrl', ''),
                ':u': datetime.now(timezone.utc).isoformat()
            }
            
            table.update_item(
                Key={'schemeId': scheme_id},
                UpdateExpression=update_expr,
                ExpressionAttributeNames=attr_names,
                ExpressionAttributeValues=attr_vals
            )
            
            return _ok({'message': 'Scheme updated'})
            
        elif http_method == 'DELETE':
            scheme_id = path_parameters.get('id')
            if not scheme_id and '/scheme/' in path:
                scheme_id = path.split('/scheme/')[-1].split('/')[0].strip()
                
            if not scheme_id:
                return _err(400, 'Missing scheme ID')
                
            print(f"[DEBUG] Deleting scheme {scheme_id}...")
            table.delete_item(Key={'schemeId': scheme_id})
            return _ok({'message': 'Scheme deleted'})
            
        return _err(405, f'Method {http_method} {path} Not Allowed')
        
    except Exception as e:
        print(f"[FATAL] Error: {str(e)}")
        traceback.print_exc()
        return {
            'statusCode': 500,
            'headers': CORS_HEADERS,
            'body': json.dumps({'error': 'Internal server error', 'details': str(e)})
        }
