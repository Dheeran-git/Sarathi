"""
A1: Add Cognito JWT Authorizer to API Gateway.
Run once: python backend/setup_authorizer.py
"""
import boto3

client = boto3.client('apigateway', region_name='us-east-1')
REST_API_ID = 'mvbx0sv4n3'

# Create authorizer for Citizen pool
auth = client.create_authorizer(
    restApiId=REST_API_ID,
    name='CognitoUserPoolAuthorizer',
    type='COGNITO_USER_POOLS',
    providerARNs=['arn:aws:cognito-idp:us-east-1:056048976827:userpool/us-east-1_FoiBWBYwO'],
    identitySource='method.request.header.Authorization',
)
AUTHORIZER_ID = auth['id']
print(f"Created authorizer: {AUTHORIZER_ID}")

# Protect these routes — GET /scheme/* stays public for LandingPage
PROTECTED = [
    ('POST', 'citizen'),
    ('GET',  'citizen/{userId}'),
    ('POST', 'eligibility'),
    ('POST', 'twin'),
    ('POST', 'conflicts'),
    ('POST', 'explain'),
    ('POST', 'notify'),
    ('POST', 'apply'),
    ('GET',  'applications/{userId}'),
    ('PATCH','apply/{applicationId}'),
]

def get_resources():
    """Return dict of path -> resourceId."""
    paginator = client.get_paginator('get_resources') if hasattr(client, 'get_paginator') else None
    resources = {}
    resp = client.get_resources(restApiId=REST_API_ID, limit=500)
    for r in resp.get('items', []):
        resources[r.get('path', '')] = r['id']
    return resources

resource_map = get_resources()
print(f"Found {len(resource_map)} resources")

patched = 0
for method, path_suffix in PROTECTED:
    full_path = f'/{path_suffix}'
    resource_id = resource_map.get(full_path)
    if not resource_id:
        print(f"  [SKIP] {method} {full_path} — resource not found")
        continue
    try:
        client.update_method(
            restApiId=REST_API_ID,
            resourceId=resource_id,
            httpMethod=method,
            patchOperations=[
                {'op': 'replace', 'path': '/authorizationType', 'value': 'COGNITO_USER_POOLS'},
                {'op': 'replace', 'path': '/authorizerId', 'value': AUTHORIZER_ID},
            ]
        )
        print(f"  [OK] {method} {full_path}")
        patched += 1
    except Exception as e:
        print(f"  [ERR] {method} {full_path}: {e}")

# Redeploy
client.create_deployment(restApiId=REST_API_ID, stageName='prod')
print(f"\nRedeployed. {patched} routes protected with Cognito JWT auth.")
