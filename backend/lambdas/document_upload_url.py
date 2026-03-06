"""
document_upload_url — POST /document/upload-url
Generates a pre-signed S3 PUT URL for document uploads.
Documents are stored under documents/{citizenId}/{documentType}/{uuid}/{fileName}.
"""
import json
import os
import uuid
import boto3

REGION = 'us-east-1'
DOCUMENTS_BUCKET = os.environ.get('DOCUMENTS_BUCKET', 'sarathi-documents')

s3 = boto3.client('s3', region_name=REGION)

ALLOWED_DOCUMENT_TYPES = {'aadhaar', 'income_cert', 'ration_card', 'job_card', 'bank_statement'}
ALLOWED_EXTENSIONS = {'.jpg', '.jpeg', '.png', '.pdf'}


def cors_headers():
    return {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Amz-Date,X-Api-Key',
        'Access-Control-Allow-Methods': 'GET,POST,PATCH,OPTIONS',
        'Content-Type': 'application/json',
    }


def lambda_handler(event, context):
    try:
        body = json.loads(event.get('body', '{}')) if isinstance(event.get('body'), str) else event

        document_type = body.get('documentType', '').strip().lower()
        file_name = body.get('fileName', 'document.jpg').strip()
        citizen_id = body.get('citizenId', '').strip()

        if document_type not in ALLOWED_DOCUMENT_TYPES:
            return {
                'statusCode': 400,
                'headers': cors_headers(),
                'body': json.dumps({'error': f'documentType must be one of: {", ".join(sorted(ALLOWED_DOCUMENT_TYPES))}'}),
            }

        ext = os.path.splitext(file_name.lower())[1]
        if ext not in ALLOWED_EXTENSIONS:
            return {
                'statusCode': 400,
                'headers': cors_headers(),
                'body': json.dumps({'error': f'File must be one of: {", ".join(sorted(ALLOWED_EXTENSIONS))}. Max 5MB.'}),
            }

        if not citizen_id:
            return {
                'statusCode': 400,
                'headers': cors_headers(),
                'body': json.dumps({'error': 'citizenId is required'}),
            }

        doc_id = str(uuid.uuid4())
        s3_key = f"documents/{citizen_id}/{document_type}/{doc_id}/{file_name}"

        content_type_map = {
            '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
            '.png': 'image/png', '.pdf': 'application/pdf',
        }
        content_type = content_type_map.get(ext, 'application/octet-stream')

        upload_url = s3.generate_presigned_url(
            'put_object',
            Params={
                'Bucket': DOCUMENTS_BUCKET,
                'Key': s3_key,
                'ContentType': content_type,
            },
            ExpiresIn=300,
        )

        return {
            'statusCode': 200,
            'headers': cors_headers(),
            'body': json.dumps({
                'uploadUrl': upload_url,
                's3Key': s3_key,
                'documentId': doc_id,
                'expiresIn': 300,
            }),
        }

    except Exception as e:
        return {
            'statusCode': 500,
            'headers': cors_headers(),
            'body': json.dumps({'error': 'Internal server error', 'message': str(e)}),
        }
