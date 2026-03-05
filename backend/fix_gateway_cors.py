"""Check API Gateway authorizer and gateway responses, then fix CORS on 4xx/5xx."""
import boto3, json

client = boto3.client('apigateway', region_name='us-east-1')
API_ID = 'mvbx0sv4n3'

# Check authorizers
auths = client.get_authorizers(restApiId=API_ID)
print('=== AUTHORIZERS ===')
for a in auths.get('items', []):
    print(f"  {a['id']}: {a['name']} type={a['type']}")

# Check the 'citizen' resource methods
resources = client.get_resources(restApiId=API_ID)['items']
for r in resources:
    if r['path'] == '/citizen':
        print(f"\n=== /citizen resource (id={r['id']}) ===")
        for method_name in r.get('resourceMethods', {}).keys():
            try:
                m = client.get_method(restApiId=API_ID, resourceId=r['id'], httpMethod=method_name)
                auth_type = m.get('authorizationType', 'NONE')
                auth_id = m.get('authorizerId', 'N/A')
                print(f"  {method_name}: authType={auth_type} authorizerId={auth_id}")
            except Exception as e:
                print(f"  {method_name}: error {e}")

# Check current gateway responses
print('\n=== GATEWAY RESPONSES (before fix) ===')
try:
    gw_responses = client.get_gateway_responses(restApiId=API_ID)
    for gr in gw_responses.get('items', []):
        has_cors = 'gatewayresponse.header.Access-Control-Allow-Origin' in gr.get('responseParameters', {})
        print(f"  {gr['responseType']}: status={gr.get('statusCode','?')} cors={'YES' if has_cors else 'NO'}")
except Exception as e:
    print(f'  Error: {e}')

# Fix: Add CORS headers to all default 4xx and 5xx gateway responses
cors_params = {
    'gatewayresponse.header.Access-Control-Allow-Origin': "'*'",
    'gatewayresponse.header.Access-Control-Allow-Headers': "'Content-Type,Authorization'",
    'gatewayresponse.header.Access-Control-Allow-Methods': "'GET,POST,OPTIONS'",
}

response_types = [
    'DEFAULT_4XX',
    'DEFAULT_5XX',
    'UNAUTHORIZED',
    'ACCESS_DENIED',
    'MISSING_AUTHENTICATION_TOKEN',
]

print('\n=== FIXING GATEWAY RESPONSES ===')
for rt in response_types:
    try:
        client.put_gateway_response(
            restApiId=API_ID,
            responseType=rt,
            responseParameters=cors_params,
        )
        print(f"  [OK] {rt}")
    except Exception as e:
        print(f"  [ERR] {rt}: {e}")

# Deploy
print("\nDeploying to prod stage...")
client.create_deployment(restApiId=API_ID, stageName='prod')
print(f"Done! API redeployed.")
