import boto3

apigw = boto3.client('apigateway', region_name='us-east-1')
REST_API_ID = 'mvbx0sv4n3'
resource_id = 'ornf63' # /apply

CORS_HEADERS = {
    'method.response.header.Access-Control-Allow-Headers': "'Content-Type,X-Amz-Date,Authorization,X-Api-Key'",
    'method.response.header.Access-Control-Allow-Origin': "'*'",
    'method.response.header.Access-Control-Allow-Methods': "'POST,OPTIONS'"
}

params = {k: True for k in CORS_HEADERS}

try:
    apigw.put_method_response(
        restApiId=REST_API_ID, resourceId=resource_id,
        httpMethod='OPTIONS', statusCode='200',
        responseParameters=params,
    )
    print("Method response 200 created")
except Exception as e:
    print("Method response error:", str(e))

try:
    apigw.put_integration_response(
        restApiId=REST_API_ID, resourceId=resource_id,
        httpMethod='OPTIONS', statusCode='200',
        responseParameters=CORS_HEADERS,
    )
    print("Integration response created")
except Exception as e:
    print("Integration response error:", str(e))

# Deploy it
apigw.create_deployment(restApiId=REST_API_ID, stageName='prod')
print("Deployed to prod")
