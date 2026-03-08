import boto3
import json

api_id = "mvbx0sv4n3"
region = "us-east-1"
resources = ["gl53tw", "wa6g2t"] # upload-url, analyze

client = boto3.client('apigateway', region_name=region)

for res_id in resources:
    print(f"Fixing CORS for resource {res_id}")
    
    # 1. Ensure method exists
    try:
        client.put_method(
            restApiId=api_id,
            resourceId=res_id,
            httpMethod='OPTIONS',
            authorizationType='NONE'
        )
    except client.exceptions.ConflictException:
        print(f"  OPTIONS method already exists for {res_id}")

    # 2. Add MOCK integration
    client.put_integration(
        restApiId=api_id,
        resourceId=res_id,
        httpMethod='OPTIONS',
        type='MOCK',
        requestTemplates={'application/json': '{"statusCode": 200}'}
    )

    # 3. Add Method Response
    try:
        client.put_method_response(
            restApiId=api_id,
            resourceId=res_id,
            httpMethod='OPTIONS',
            statusCode='200',
            responseParameters={
                "method.response.header.Access-Control-Allow-Headers": True,
                "method.response.header.Access-Control-Allow-Methods": True,
                "method.response.header.Access-Control-Allow-Origin": True
            }
        )
    except client.exceptions.ConflictException:
        print(f"  Method response already exists for {res_id}")

    # 4. Add Integration Response with CORS headers
    client.put_integration_response(
        restApiId=api_id,
        resourceId=res_id,
        httpMethod='OPTIONS',
        statusCode='200',
        responseParameters={
            "method.response.header.Access-Control-Allow-Headers": "'Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token'",
            "method.response.header.Access-Control-Allow-Methods": "'GET,POST,OPTIONS'",
            "method.response.header.Access-Control-Allow-Origin": "'*'"
        }
    )
    print(f"  CORS fixed for {res_id}")

# 5. Deploy
print("Deploying API...")
client.create_deployment(
    restApiId=api_id,
    stageName='prod'
)
print("Deployment complete.")
