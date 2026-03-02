import json
import os
import uuid
import boto3
from decimal import Decimal
import time
from datetime import datetime

dynamodb = boto3.resource('dynamodb', region_name='us-east-1')
s3_client = boto3.client('s3', region_name='us-east-1')

CITIZENS_TABLE = 'SarathiCitizens'
DOCS_TABLE = 'SarathiDocuments'
S3_BUCKET = os.environ.get('S3_BUCKET', 'sarathi-docs-vault-056048976827')

# Helper for decimal JSON serialization
class DecimalEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, Decimal):
            return float(obj)
        return super(DecimalEncoder, self).default(obj)

def respond(status, body):
    return {
        'statusCode': status,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        'body': json.dumps(body, cls=DecimalEncoder)
    }

def get_json_body(event):
    if not event.get('body'): return {}
    return json.loads(event['body']) if isinstance(event['body'], str) else event['body']

def lambda_handler(event, context):
    try:
        # Determine action
        path = event.get('path', '')
        body = get_json_body(event)
        action = body.get('action') or event.get('queryStringParameters', {}).get('action', '')
        
        if '/vault/' in path and path.rstrip('/') != '/vault':
            action = path.split('/')[-1]

        citizen_id = body.get('citizenId') or event.get('queryStringParameters', {}).get('citizenId')
        
        if not citizen_id:
            return respond(400, {'error': 'citizenId is required'})
            
        if not action:
            return respond(400, {'error': 'action is required'})

        citizens_table = dynamodb.Table(CITIZENS_TABLE)
        docs_table = dynamodb.Table(DOCS_TABLE)

        # 1. Check Vault Status
        if action == 'status':
            response = citizens_table.get_item(Key={'citizenId': citizen_id})
            item = response.get('Item', {})
            return respond(200, {'isSetup': bool(item.get('vaultSetup'))})

        # 2. Setup Vault Password
        elif action == 'setup':
            password = body.get('password')
            if not password:
                return respond(400, {'error': 'password is required'})
            
            # Simple prototype storage
            citizens_table.update_item(
                Key={'citizenId': citizen_id},
                UpdateExpression="set vaultPassword = :p, vaultSetup = :s",
                ExpressionAttributeValues={':p': password, ':s': True}
            )
            return respond(200, {'message': 'Vault password set successfully'})

        # 3. Verify Vault Password
        elif action == 'verify':
            password = body.get('password')
            if not password:
                return respond(400, {'error': 'password is required'})
                
            response = citizens_table.get_item(Key={'citizenId': citizen_id})
            item = response.get('Item', {})
            
            if not item.get('vaultSetup'):
                return respond(404, {'error': 'Vault not set up yet', 'needsSetup': True})
                
            if item.get('vaultPassword') != password:
                return respond(401, {'error': 'Incorrect vault password'})
                
            return respond(200, {'message': 'Vault unlocked'})

        # 3.5 Reset Vault Password
        elif action == 'reset':
            # In a real application, this would involve OTP verification.
            # For this prototype, we just clear the vault setup state.
            citizens_table.update_item(
                Key={'citizenId': citizen_id},
                UpdateExpression="set vaultPassword = :p, vaultSetup = :s",
                ExpressionAttributeValues={':p': None, ':s': False}
            )
            return respond(200, {'message': 'Vault password reset successfully'})

        # 4. List Documents
        elif action == 'list':
            response = docs_table.query(
                KeyConditionExpression='citizenId = :c',
                ExpressionAttributeValues={':c': citizen_id}
            )
            return respond(200, {'documents': response.get('Items', [])})

        # 5. Request Upload (Presigned URL)
        elif action == 'upload':
            doc_type = body.get('docType')
            file_name = body.get('fileName')
            file_size = body.get('fileSize')
            file_type = body.get('fileType', 'application/pdf')
            
            if not all([doc_type, file_name]):
                return respond(400, {'error': 'docType and fileName are required'})
                
            doc_id = str(uuid.uuid4())
            s3_key = f"{citizen_id}/{doc_id}_{file_name}"
            
            # Save metadata
            doc_metadata = {
                'citizenId': citizen_id,
                'docId': doc_id,
                'docType': doc_type,
                'fileName': file_name,
                's3Key': s3_key,
                'fileSize': file_size,
                'status': 'UNDER REVIEW',
                'uploadDate': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
            }
            docs_table.put_item(Item=doc_metadata)
            
            # In a real app we'd generate a Presigned POST URL:
            # But creating a presigned PUT is simpler for prototyping
            presigned_url = s3_client.generate_presigned_url('put_object',
                                                    Params={'Bucket': S3_BUCKET,
                                                            'Key': s3_key,
                                                            'ContentType': file_type},
                                                    ExpiresIn=3600)
            
            return respond(200, {
                'uploadUrl': presigned_url,
                'document': doc_metadata
            })
            
        # 6. Get Download URL
        elif action == 'download':
            s3_key = body.get('s3Key') or event.get('queryStringParameters', {}).get('s3Key')
            if not s3_key:
                return respond(400, {'error': 's3Key is required'})
                
            presigned_url = s3_client.generate_presigned_url('get_object',
                                                    Params={'Bucket': S3_BUCKET,
                                                            'Key': s3_key},
                                                    ExpiresIn=3600)
            return respond(200, {'downloadUrl': presigned_url})

        # 7. Delete Document
        elif action == 'delete':
            doc_id = body.get('docId')
            s3_key = body.get('s3Key')
            if not doc_id or not s3_key:
                return respond(400, {'error': 'docId and s3Key are required'})
                
            # Delete from S3
            try:
                s3_client.delete_object(Bucket=S3_BUCKET, Key=s3_key)
            except Exception as e:
                print(f"S3 Delete Error: {e}")
                
            # Delete from DynamoDB
            docs_table.delete_item(Key={'citizenId': citizen_id, 'docId': doc_id})
            
            return respond(200, {'message': 'Document deleted'})

        else:
            return respond(404, {'error': 'Unknown vault action'})

    except Exception as e:
        print(f"Error: {str(e)}")
        return respond(500, {'error': str(e)})
