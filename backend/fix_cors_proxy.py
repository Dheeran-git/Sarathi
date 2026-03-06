import boto3

REGION = 'us-east-1'
ACCOUNT_ID = '056048976827'
REST_API_ID = 'mvbx0sv4n3'
FN_NAME = 'sarathi-applications'
FN_ARN = f'arn:aws:lambda:{REGION}:{ACCOUNT_ID}:function:{FN_NAME}'
INTEGRATION_URI = f'arn:aws:apigateway:{REGION}:lambda:path/2015-03-31/functions/{FN_ARN}/invocations'

apigw = boto3.client('apigateway', region_name=REGION)

resource_id = 'ornf63' # /apply
http_method = 'OPTIONS'

# Delete old mock method
try:
    apigw.delete_method(restApiId=REST_API_ID, resourceId=resource_id, httpMethod=http_method)
    print("Deleted old OPTIONS method")
except Exception as e:
    print("Delete error (might not exist):", e)

# Recreate OPTIONS mapped to Lambda
print("Recreating OPTIONS method...")
apigw.put_method(
    restApiId=REST_API_ID, resourceId=resource_id,
    httpMethod=http_method, authorizationType='NONE',
)

apigw.put_integration(
    restApiId=REST_API_ID, resourceId=resource_id,
    httpMethod=http_method, type='AWS_PROXY',
    integrationHttpMethod='POST', uri=INTEGRATION_URI,
)

apigw.create_deployment(restApiId=REST_API_ID, stageName='prod')
print("Deployed OPTIONS -> Lambda Proxy successfully.")
