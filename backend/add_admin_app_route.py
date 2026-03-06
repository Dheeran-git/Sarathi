import boto3
import json

# Configuration
REGION = 'us-east-1'
ACCOUNT_ID = '056048976827'
REST_API_ID = 'mvbx0sv4n3'
PARENT_RESOURCE_ID = 'mxqxhx'  # /applications
LAMBDA_NAME = 'sarathi-applications'
LAMBDA_ARN = f'arn:aws:lambda:{REGION}:{ACCOUNT_ID}:function:{LAMBDA_NAME}'
INTEGRATION_URI = f'arn:aws:apigateway:{REGION}:lambda:path/2015-03-31/functions/{LAMBDA_ARN}/invocations'

apigw = boto3.client('apigateway', region_name=REGION)
lambda_client = boto3.client('lambda', region_name=REGION)

def create_route_and_method():
    print("Creating /applications/all resource...")
    try:
        res = apigw.create_resource(
            restApiId=REST_API_ID,
            parentId=PARENT_RESOURCE_ID,
            pathPart='all'
        )
        resource_id = res['id']
        print(f"  [OK] /applications/all created: {resource_id}")
    except apigw.exceptions.ConflictException:
        # Need to find existing ID
        resources = apigw.get_resources(restApiId=REST_API_ID)['items']
        resource_id = next(r['id'] for r in resources if r['path'] == '/applications/all')
        print(f"  [SKIP] /applications/all already exists: {resource_id}")

    # Setup GET
    print(f"Setting up GET for /applications/all...")
    try:
        apigw.put_method(
            restApiId=REST_API_ID,
            resourceId=resource_id,
            httpMethod='GET',
            authorizationType='NONE'
        )
    except apigw.exceptions.ConflictException:
        pass

    apigw.put_integration(
        restApiId=REST_API_ID,
        resourceId=resource_id,
        httpMethod='GET',
        type='AWS_PROXY',
        integrationHttpMethod='POST',
        uri=INTEGRATION_URI
    )

    # Setup OPTIONS for CORS
    print("Setting up OPTIONS for CORS...")
    try:
        apigw.put_method(
            restApiId=REST_API_ID,
            resourceId=resource_id,
            httpMethod='OPTIONS',
            authorizationType='NONE'
        )
    except apigw.exceptions.ConflictException:
        pass

    apigw.put_integration(
        restApiId=REST_API_ID,
        resourceId=resource_id,
        httpMethod='OPTIONS',
        type='MOCK',
        requestTemplates={'application/json': '{"statusCode": 200}'}
    )

    apigw.put_method_response(
        restApiId=REST_API_ID,
        resourceId=resource_id,
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
        resourceId=resource_id,
        httpMethod='OPTIONS',
        statusCode='200',
        responseParameters={
            'method.response.header.Access-Control-Allow-Headers': "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'",
            'method.response.header.Access-Control-Allow-Methods': "'GET,OPTIONS'",
            'method.response.header.Access-Control-Allow-Origin': "'*'"
        }
    )

    # Deployment
    apigw.create_deployment(restApiId=REST_API_ID, stageName='prod')
    print("[OK] API Gateway updated and deployed")

if __name__ == '__main__':
    create_route_and_method()
