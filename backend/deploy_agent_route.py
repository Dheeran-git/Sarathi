"""
Deploy POST /agent → sarathi-invoke-agent Lambda on API Gateway.
"""
import boto3, json, time

REGION = 'us-east-1'
ACCOUNT_ID = '056048976827'
API_ID = 'mvbx0sv4n3'

lam = boto3.client('lambda', region_name=REGION)
apigw = boto3.client('apigateway', region_name=REGION)

# 1. Find root resource
resources = apigw.get_resources(restApiId=API_ID, limit=500)
root_id = next(r['id'] for r in resources['items'] if r['path'] == '/')

# 2. Check if /agent resource already exists  
agent_resources = [r for r in resources['items'] if r.get('pathPart') == 'agent']
if agent_resources:
    rid = agent_resources[0]['id']
    print(f"Resource /agent already exists: {rid}")
else:
    res = apigw.create_resource(restApiId=API_ID, parentId=root_id, pathPart='agent')
    rid = res['id']
    print(f"Created resource /agent: {rid}")

# 3. PUT POST method
try:
    apigw.put_method(restApiId=API_ID, resourceId=rid, httpMethod='POST', authorizationType='NONE')
    print("Created POST method")
except:
    print("POST method already exists")

# 4. PUT integration
lambda_uri = (f"arn:aws:apigateway:{REGION}:lambda:path/2015-03-31/functions/"
              f"arn:aws:lambda:{REGION}:{ACCOUNT_ID}:function:sarathi-invoke-agent/invocations")
apigw.put_integration(
    restApiId=API_ID, resourceId=rid, httpMethod='POST',
    type='AWS_PROXY', integrationHttpMethod='POST', uri=lambda_uri
)
print("POST integration set")

# 5. Lambda permission
try:
    lam.add_permission(
        FunctionName='sarathi-invoke-agent',
        StatementId='apigw-agent-post',
        Action='lambda:InvokeFunction',
        Principal='apigateway.amazonaws.com',
        SourceArn=f"arn:aws:execute-api:{REGION}:{ACCOUNT_ID}:{API_ID}/*/POST/agent"
    )
    print("Lambda permission added")
except:
    print("Lambda permission already exists")

# 6. CORS OPTIONS
try:
    apigw.put_method(restApiId=API_ID, resourceId=rid, httpMethod='OPTIONS', authorizationType='NONE')
except: pass
apigw.put_integration(restApiId=API_ID, resourceId=rid, httpMethod='OPTIONS',
                      type='MOCK', requestTemplates={'application/json': '{"statusCode":200}'})
try:
    apigw.put_method_response(
        restApiId=API_ID, resourceId=rid, httpMethod='OPTIONS', statusCode='200',
        responseParameters={
            'method.response.header.Access-Control-Allow-Headers': False,
            'method.response.header.Access-Control-Allow-Methods': False,
            'method.response.header.Access-Control-Allow-Origin':  False,
        }
    )
except: pass
apigw.put_integration_response(
    restApiId=API_ID, resourceId=rid, httpMethod='OPTIONS', statusCode='200',
    responseParameters={
        'method.response.header.Access-Control-Allow-Headers': "'Content-Type,Authorization'",
        'method.response.header.Access-Control-Allow-Methods': "'POST,OPTIONS'",
        'method.response.header.Access-Control-Allow-Origin':  "'*'",
    }
)
print("CORS OPTIONS configured")

# 7. Deploy
apigw.create_deployment(restApiId=API_ID, stageName='prod')
print(f"\n✅ Deployed! URL: https://{API_ID}.execute-api.{REGION}.amazonaws.com/prod/agent")
