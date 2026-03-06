import boto3
import json

REGION = 'us-east-1'
ACCOUNT_ID = '056048976827'
REST_API_ID = 'mvbx0sv4n3'
RESOURCE_ID = '8b42s1'  # /scheme
LAMBDA_NAME = 'sarathi-admin-schemes'
LAMBDA_ARN = f'arn:aws:lambda:{REGION}:{ACCOUNT_ID}:function:{LAMBDA_NAME}'
INTEGRATION_URI = f'arn:aws:apigateway:{REGION}:lambda:path/2015-03-31/functions/{LAMBDA_ARN}/invocations'

apigw = boto3.client('apigateway', region_name=REGION)
lambda_client = boto3.client('lambda', region_name=REGION)

def setup_method(method):
    print(f"Setting up {method} for /scheme...")
    try:
        apigw.put_method(
            restApiId=REST_API_ID,
            resourceId=RESOURCE_ID,
            httpMethod=method,
            authorizationType='NONE'
        )
        print(f"  [OK] Method {method} created")
    except apigw.exceptions.ConflictException:
        print(f"  [SKIP] Method {method} already exists")

    apigw.put_integration(
        restApiId=REST_API_ID,
        resourceId=RESOURCE_ID,
        httpMethod=method,
        type='AWS_PROXY',
        integrationHttpMethod='POST',
        uri=INTEGRATION_URI
    )
    print(f"  [OK] Integration set for {method}")

def setup_options():
    print("Setting up OPTIONS for CORS...")
    try:
        apigw.put_method(
            restApiId=REST_API_ID,
            resourceId=RESOURCE_ID,
            httpMethod='OPTIONS',
            authorizationType='NONE'
        )
    except apigw.exceptions.ConflictException:
        pass

    apigw.put_integration(
        restApiId=REST_API_ID,
        resourceId=RESOURCE_ID,
        httpMethod='OPTIONS',
        type='MOCK',
        requestTemplates={'application/json': '{"statusCode": 200}'}
    )

    apigw.put_method_response(
        restApiId=REST_API_ID,
        resourceId=RESOURCE_ID,
        httpMethod='OPTIONS',
        statusCode='200',
        responseParameters={
            'method.response.header.Access-Control-Allow-Headers': True,
            'method.response.header.Access-Control-Allow-Methods': True,
            'method.response.header.Access-Control-Allow-Origin': True
        }
    )

    apigw.put_integration_response(
        restApiId=REST_API_ID,
        resourceId=RESOURCE_ID,
        httpMethod='OPTIONS',
        statusCode='200',
        responseParameters={
            'method.response.header.Access-Control-Allow-Headers': "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'",
            'method.response.header.Access-Control-Allow-Methods': "'GET,POST,PUT,DELETE,OPTIONS'",
            'method.response.header.Access-Control-Allow-Origin': "'*'"
        }
    )
    print("  [OK] OPTIONS (CORS) setup complete")

# 1. Setup GET and POST and PUT and DELETE
for m in ['GET', 'POST', 'PUT', 'DELETE']:
    setup_method(m)

# 2. Setup OPTIONS
setup_options()

# 3. Add Lambda permission
try:
    lambda_client.add_permission(
        FunctionName=LAMBDA_NAME,
        StatementId='apigw-invoke-scheme',
        Action='lambda:InvokeFunction',
        Principal='apigateway.amazonaws.com',
        SourceArn=f'arn:aws:execute-api:{REGION}:{ACCOUNT_ID}:{REST_API_ID}/*/*'
    )
    print("[OK] Lambda permission added")
except lambda_client.exceptions.ResourceConflictException:
    print("[SKIP] Lambda permission already exists")

# 4. Deploy
apigw.create_deployment(restApiId=REST_API_ID, stageName='prod')
print("[OK] API deployed to prod")
