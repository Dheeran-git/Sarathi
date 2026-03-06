"""
Create sarathi-applications Lambda + API Gateway routes for /apply and /applications.
Run once: python backend/create_api_routes.py
"""
import boto3, zipfile, io, os, json, time

REGION = 'us-east-1'
ACCOUNT_ID = '056048976827'
REST_API_ID = 'mvbx0sv4n3'
LAMBDA_ROLE = 'arn:aws:iam::056048976827:role/SarathiLambdaRole'
FN_NAME = 'sarathi-applications'

lambda_client = boto3.client('lambda', region_name=REGION)
apigw = boto3.client('apigateway', region_name=REGION)

# --- 1. Create Lambda ---
src_path = os.path.join(os.path.dirname(__file__), 'lambdas', 'applications.py')
with open(src_path, 'r', encoding='utf-8') as f:
    code = f.read()
buf = io.BytesIO()
with zipfile.ZipFile(buf, 'w', zipfile.ZIP_DEFLATED) as zf:
    zf.writestr('lambda_function.py', code)
buf.seek(0)

try:
    lambda_client.get_function(FunctionName=FN_NAME)
    print(f"[SKIP] {FN_NAME} already exists")
except lambda_client.exceptions.ResourceNotFoundException:
    resp = lambda_client.create_function(
        FunctionName=FN_NAME,
        Runtime='python3.12',
        Role=LAMBDA_ROLE,
        Handler='lambda_function.lambda_handler',
        Code={'ZipFile': buf.read()},
        Timeout=30,
        MemorySize=256,
    )
    print(f"[OK] Created Lambda: {resp['FunctionArn']}")
    time.sleep(5)  # wait for function to be ready

FN_ARN = f'arn:aws:lambda:{REGION}:{ACCOUNT_ID}:function:{FN_NAME}'
INTEGRATION_URI = f'arn:aws:apigateway:{REGION}:lambda:path/2015-03-31/functions/{FN_ARN}/invocations'

# --- 2. Get existing resources ---
resources = {}
resp = apigw.get_resources(restApiId=REST_API_ID, limit=500)
for r in resp.get('items', []):
    resources[r.get('path', '')] = r['id']
root_id = resources['/']
print(f"Root resource ID: {root_id}")
print(f"Existing resources: {list(resources.keys())}")

CORS_HEADERS = {
    'method.response.header.Access-Control-Allow-Headers': "'Content-Type,X-Amz-Date,Authorization,X-Api-Key'",
    'method.response.header.Access-Control-Allow-Methods': "'GET,POST,PATCH,OPTIONS'",
    'method.response.header.Access-Control-Allow-Origin': "'*'",
}


def find_child_resource(parent_id, path_part):
    """Find a resource by parent ID and path part."""
    for path, rid in resources.items():
        if path.split('/')[-1] == path_part:
            # Check if this resource's parent matches
            parent_path = path.rsplit('/', 1)[0] or '/'
            if resources.get(parent_path) == parent_id:
                return rid
    return None


def create_resource(parent_id, path_part):
    existing_id = find_child_resource(parent_id, path_part)
    if existing_id:
        print(f"[SKIP] Resource /{path_part} already exists: {existing_id}")
        return existing_id
    r = apigw.create_resource(restApiId=REST_API_ID, parentId=parent_id, pathPart=path_part)
    new_id = r['id']
    # Update local cache so subsequent calls can find children of this new resource
    resources[r['path']] = new_id
    print(f"[OK] Created resource /{path_part}: {new_id}")
    return new_id


def add_lambda_method(resource_id, http_method):
    try:
        apigw.put_method(
            restApiId=REST_API_ID, resourceId=resource_id,
            httpMethod=http_method, authorizationType='NONE',
        )
    except apigw.exceptions.ConflictException:
        print(f"  [SKIP] {http_method} method already exists")
    apigw.put_integration(
        restApiId=REST_API_ID, resourceId=resource_id,
        httpMethod=http_method, type='AWS_PROXY',
        integrationHttpMethod='POST', uri=INTEGRATION_URI,
    )
    try:
        apigw.put_method_response(
            restApiId=REST_API_ID, resourceId=resource_id,
            httpMethod=http_method, statusCode='200',
        )
    except apigw.exceptions.ConflictException:
        pass
    try:
        apigw.put_integration_response(
            restApiId=REST_API_ID, resourceId=resource_id,
            httpMethod=http_method, statusCode='200',
        )
    except apigw.exceptions.ConflictException:
        pass
    print(f"  [OK] {http_method} -> {FN_NAME}")


def add_options(resource_id, methods_str):
    try:
        apigw.put_method(
            restApiId=REST_API_ID, resourceId=resource_id,
            httpMethod='OPTIONS', authorizationType='NONE',
        )
    except apigw.exceptions.ConflictException:
        print(f"  [SKIP] OPTIONS already exists")
        return
    apigw.put_integration(
        restApiId=REST_API_ID, resourceId=resource_id,
        httpMethod='OPTIONS', type='MOCK',
        requestTemplates={'application/json': '{"statusCode": 200}'},
    )
    params = {k: True for k in CORS_HEADERS}
    apigw.put_method_response(
        restApiId=REST_API_ID, resourceId=resource_id,
        httpMethod='OPTIONS', statusCode='200',
        responseParameters=params,
    )
    cors = dict(CORS_HEADERS)
    cors['method.response.header.Access-Control-Allow-Methods'] = f"'{methods_str},OPTIONS'"
    apigw.put_integration_response(
        restApiId=REST_API_ID, resourceId=resource_id,
        httpMethod='OPTIONS', statusCode='200',
        responseParameters=cors,
    )
    print(f"  [OK] OPTIONS (CORS)")


# --- 3. Create /apply ---
apply_id = create_resource(root_id, 'apply')
add_lambda_method(apply_id, 'POST')
add_options(apply_id, 'POST')

# --- 4. Create /apply/{applicationId} ---
app_id_id = create_resource(apply_id, '{applicationId}')
add_lambda_method(app_id_id, 'PATCH')
add_lambda_method(app_id_id, 'POST')
add_options(app_id_id, 'PATCH,POST')

# --- 5. Create /applications ---
apps_id = create_resource(root_id, 'applications')

# --- 6. Create /applications/{userId} ---
apps_user_id = create_resource(apps_id, '{userId}')
add_lambda_method(apps_user_id, 'GET')
add_options(apps_user_id, 'GET')

# --- 7. Lambda permission ---
try:
    lambda_client.add_permission(
        FunctionName=FN_NAME,
        StatementId='apigw-invoke',
        Action='lambda:InvokeFunction',
        Principal='apigateway.amazonaws.com',
        SourceArn=f'arn:aws:execute-api:{REGION}:{ACCOUNT_ID}:{REST_API_ID}/*/*',
    )
    print("[OK] Lambda invoke permission granted to API Gateway")
except lambda_client.exceptions.ResourceConflictException:
    print("[SKIP] Lambda permission already exists")

# --- 8. Deploy ---
apigw.create_deployment(restApiId=REST_API_ID, stageName='prod')
print("\n[DONE] Routes created and deployed to prod.")
