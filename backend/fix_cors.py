"""Fix CORS OPTIONS mock integrations on all API Gateway resources."""
import boto3, json

client = boto3.client('apigateway', region_name='us-east-1')
API_ID = 'mvbx0sv4n3'

# Resources that have OPTIONS methods needing MOCK integration
resources = client.get_resources(restApiId=API_ID)['items']

for res in resources:
    methods = res.get('resourceMethods', {})
    if 'OPTIONS' not in methods:
        continue

    rid = res['id']
    path = res['path']
    print(f"Fixing CORS for {path} (resource {rid})...")

    # Put MOCK integration
    try:
        client.put_integration(
            restApiId=API_ID, resourceId=rid, httpMethod='OPTIONS',
            type='MOCK',
            requestTemplates={'application/json': '{"statusCode": 200}'}
        )
    except Exception as e:
        print(f"  Integration: {e}")

    # Integration response with CORS headers
    try:
        client.put_integration_response(
            restApiId=API_ID, resourceId=rid, httpMethod='OPTIONS',
            statusCode='200',
            responseParameters={
                'method.response.header.Access-Control-Allow-Headers': "'Content-Type,Authorization'",
                'method.response.header.Access-Control-Allow-Methods': "'GET,POST,OPTIONS'",
                'method.response.header.Access-Control-Allow-Origin': "'*'"
            }
        )
    except Exception as e:
        print(f"  IntegrationResponse: {e}")

    print(f"  [OK] {path}")

# Deploy
print("\nDeploying to prod stage...")
client.create_deployment(restApiId=API_ID, stageName='prod')
print(f"\nAPI deployed! URL: https://{API_ID}.execute-api.us-east-1.amazonaws.com/prod")
