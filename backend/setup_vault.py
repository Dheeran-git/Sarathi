import boto3
import zipfile
import io
import os
import sys

REGION = 'us-east-1'
ACCOUNT_ID = '056048976827'
ROLE_ARN = 'arn:aws:iam::056048976827:role/SarathiLambdaRole'
S3_BUCKET = 'sarathi-docs-vault-056048976827'

dynamo = boto3.client('dynamodb', region_name=REGION)
s3 = boto3.client('s3', region_name=REGION)
lam = boto3.client('lambda', region_name=REGION)
apigw = boto3.client('apigateway', region_name=REGION)

print("=== 1. Creating S3 Bucket ===")
try:
    # us-east-1 doesn't need LocationConstraint
    s3.create_bucket(Bucket=S3_BUCKET)
    print(f"Created S3 bucket: {S3_BUCKET}")
except Exception as e:
    print(f"S3 bucket existence check: {e}")

# Configure CORS on the bucket
cors_configuration = {
    'CORSRules': [{
        'AllowedHeaders': ['*'],
        'AllowedMethods': ['PUT', 'POST', 'GET', 'HEAD'],
        'AllowedOrigins': ['*'], # In production, restrict to app origin
        'MaxAgeSeconds': 3000
    }]
}
try:
    s3.put_bucket_cors(Bucket=S3_BUCKET, CORSConfiguration=cors_configuration)
    print("Enabled CORS on S3 Bucket")
except Exception as e:
    print(f"Error setting CORS on S3: {e}")

print("\n=== 2. Creating DynamoDB Table for Documents ===")
table_name = 'SarathiDocuments'
try:
    dynamo.create_table(
        TableName=table_name,
        BillingMode='PAY_PER_REQUEST',
        AttributeDefinitions=[
            {'AttributeName': 'citizenId', 'AttributeType': 'S'},
            {'AttributeName': 'docId', 'AttributeType': 'S'}
        ],
        KeySchema=[
            {'AttributeName': 'citizenId', 'KeyType': 'HASH'},
            {'AttributeName': 'docId', 'KeyType': 'RANGE'}
        ],
    )
    print(f"Created table {table_name}")
    # Wait
    waiter = dynamo.get_waiter('table_exists')
    waiter.wait(TableName=table_name)
except dynamo.exceptions.ResourceInUseException:
    print(f"Table {table_name} already exists.")

print("\n=== 3. Deploying Lambda ===")
fn_name = 'sarathi-document-vault'
filepath = os.path.join(os.path.dirname(__file__), 'lambdas', 'document_vault.py')
with open(filepath, 'r', encoding='utf-8') as f:
    code = f.read()

buf = io.BytesIO()
with zipfile.ZipFile(buf, 'w', zipfile.ZIP_DEFLATED) as zf:
    zf.writestr('lambda_function.py', code)
zip_bytes = buf.getvalue()

try:
    lam.create_function(
        FunctionName=fn_name,
        Runtime='python3.11',
        Role=ROLE_ARN,
        Handler='lambda_function.lambda_handler',
        Code={'ZipFile': zip_bytes},
        Timeout=30,
        MemorySize=256,
        Environment={'Variables': {'S3_BUCKET': S3_BUCKET}}
    )
    print(f"Created Lambda {fn_name}")
except lam.exceptions.ResourceConflictException:
    lam.update_function_code(FunctionName=fn_name, ZipFile=zip_bytes)
    lam.update_function_configuration(FunctionName=fn_name, Environment={'Variables': {'S3_BUCKET': S3_BUCKET}})
    print(f"Updated Lambda {fn_name}")

print("\n=== 4. Updating API Gateway ===")
# Find SarathiAPI
apis = apigw.get_rest_apis()['items']
api_id = next((a['id'] for a in apis if a['name'] == 'SarathiAPI'), None)

if api_id:
    print(f"Found API Gateway: {api_id}")
    resources = apigw.get_resources(restApiId=api_id, limit=500)['items']
    root_id = next((r['id'] for r in resources if r['path'] == '/'), None)
    
    # Check if /vault exists
    vault_res = next((r for r in resources if r['path'] == '/vault'), None)
    if not vault_res:
        vault_res = apigw.create_resource(restApiId=api_id, parentId=root_id, pathPart='vault')
        rid = vault_res['id']
        
        # Add POST method mapping to lambda
        apigw.put_method(restApiId=api_id, resourceId=rid, httpMethod='POST', authorizationType='NONE')
        uri = f"arn:aws:apigateway:{REGION}:lambda:path/2015-03-31/functions/arn:aws:lambda:{REGION}:{ACCOUNT_ID}:function:{fn_name}/invocations"
        apigw.put_integration(
            restApiId=api_id, resourceId=rid, httpMethod='POST',
            type='AWS_PROXY', integrationHttpMethod='POST', uri=uri
        )
        # Mock OPTIONS for CORS
        apigw.put_method(restApiId=api_id, resourceId=rid, httpMethod='OPTIONS', authorizationType='NONE')
        apigw.put_integration(restApiId=api_id, resourceId=rid, httpMethod='OPTIONS', type='MOCK', requestTemplates={'application/json': '{"statusCode":200}'})
        apigw.put_method_response(restApiId=api_id, resourceId=rid, httpMethod='OPTIONS', statusCode='200', responseParameters={'method.response.header.Access-Control-Allow-Headers': False, 'method.response.header.Access-Control-Allow-Methods': False, 'method.response.header.Access-Control-Allow-Origin': False})
        apigw.put_integration_response(restApiId=api_id, resourceId=rid, httpMethod='OPTIONS', statusCode='200', responseParameters={'method.response.header.Access-Control-Allow-Headers': "'Content-Type,Authorization'", 'method.response.header.Access-Control-Allow-Methods': "'GET,POST,OPTIONS'", 'method.response.header.Access-Control-Allow-Origin': "'*'"})
        
        # Deploy
        apigw.create_deployment(restApiId=api_id, stageName='prod')
        print("Created /vault POST route and deployed to prod.")
    else:
        print("/vault route already exists")
    
    # Fix CORS via existing script if needed
    os.system('python fix_cors.py')
else:
    print("Could not find SarathiAPI")
