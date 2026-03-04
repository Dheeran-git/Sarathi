"""
One-shot migration script: creates all Sarathi infrastructure in us-east-1.
Creates DynamoDB tables, Lambda functions, API Gateway, CORS, and prod deployment.
Prints the new API invoke URL at the end.

Usage:
    cd backend
    python migrate_to_us_east.py
"""
import boto3, zipfile, io, os, json, time, sys

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

REGION     = 'us-east-1'
ACCOUNT_ID = '056048976827'
ROLE_ARN   = 'arn:aws:iam::056048976827:role/SarathiLambdaRole'

dynamo = boto3.client('dynamodb',    region_name=REGION)
lam    = boto3.client('lambda',      region_name=REGION)
apigw  = boto3.client('apigateway', region_name=REGION)

LAMBDAS = {
    'sarathi-eligibility-engine': 'eligibility_engine.py',
    'sarathi-digital-twin':       'digital_twin.py',
    'sarathi-scheme-fetch':       'scheme_fetch.py',
    'sarathi-panchayat-stats':    'panchayat_stats.py',
    'sarathi-conflict-detector':  'conflict_detector.py',
    'sarathi-citizen-save':       'citizen_save.py',
}

LAMBDAS_DIR = os.path.join(os.path.dirname(__file__), 'lambdas')

# ─── 1. DynamoDB Tables ──────────────────────────────────────────────────────
print("\n=== STEP 1: DynamoDB Tables ===")
for table_name, pk in [('SarathiSchemes', 'schemeId'), ('SarathiCitizens', 'citizenId')]:
    try:
        dynamo.create_table(
            TableName=table_name,
            BillingMode='PAY_PER_REQUEST',
            AttributeDefinitions=[{'AttributeName': pk, 'AttributeType': 'S'}],
            KeySchema=[{'AttributeName': pk, 'KeyType': 'HASH'}],
        )
        print(f"  [Created] {table_name}")
    except dynamo.exceptions.ResourceInUseException:
        print(f"  [Exists]  {table_name} already exists — skipping")

print("  Waiting for tables to become ACTIVE...")
for table_name in ['SarathiSchemes', 'SarathiCitizens']:
    waiter = boto3.client('dynamodb', region_name=REGION).get_waiter('table_exists')
    waiter.wait(TableName=table_name)
    print(f"  [ACTIVE]  {table_name}")

# ─── 2. Lambda Functions ─────────────────────────────────────────────────────
print("\n=== STEP 2: Lambda Functions ===")
for fn_name, filename in LAMBDAS.items():
    filepath = os.path.join(LAMBDAS_DIR, filename)
    with open(filepath, 'r', encoding='utf-8') as f:
        code = f.read()

    buf = io.BytesIO()
    with zipfile.ZipFile(buf, 'w', zipfile.ZIP_DEFLATED) as zf:
        zf.writestr('lambda_function.py', code)
    zip_bytes = buf.getvalue()

    try:
        lam.create_function(
            FunctionName=fn_name,
            Runtime='python3.11',
            Role=ROLE_ARN,
            Handler='lambda_function.lambda_handler',
            Code={'ZipFile': zip_bytes},
            Timeout=30,
            MemorySize=256,
        )
        print(f"  [Created] {fn_name}")
    except lam.exceptions.ResourceConflictException:
        # Function already exists — just update the code
        lam.update_function_code(FunctionName=fn_name, ZipFile=zip_bytes)
        print(f"  [Updated] {fn_name} (already existed)")

print("  Waiting for all Lambdas to become Active...")
time.sleep(5)  # brief pause — Lambdas activate quickly
for fn_name in LAMBDAS:
    for attempt in range(10):
        config = lam.get_function_configuration(FunctionName=fn_name)
        state = config.get('State', '')
        if state == 'Active':
            print(f"  [Active]  {fn_name}")
            break
        time.sleep(2)

# ─── 3. API Gateway ──────────────────────────────────────────────────────────
print("\n=== STEP 3: API Gateway ===")
api = apigw.create_rest_api(
    name='SarathiAPI',
    description='Sarathi welfare scheme eligibility platform',
)
api_id  = api['id']
root_id = apigw.get_resources(restApiId=api_id)['items'][0]['id']
print(f"  [Created] REST API: {api_id}  (root resource: {root_id})")

def lambda_uri(fn_name):
    return (f"arn:aws:apigateway:{REGION}:lambda:path/2015-03-31/functions/"
            f"arn:aws:lambda:{REGION}:{ACCOUNT_ID}:function:{fn_name}/invocations")

def add_cors_options(resource_id, path):
    """Add OPTIONS method with MOCK integration for CORS preflight."""
    apigw.put_method(restApiId=api_id, resourceId=resource_id,
                     httpMethod='OPTIONS', authorizationType='NONE')
    apigw.put_integration(restApiId=api_id, resourceId=resource_id, httpMethod='OPTIONS',
                          type='MOCK', requestTemplates={'application/json': '{"statusCode":200}'})
    apigw.put_method_response(
        restApiId=api_id, resourceId=resource_id, httpMethod='OPTIONS', statusCode='200',
        responseParameters={
            'method.response.header.Access-Control-Allow-Headers': False,
            'method.response.header.Access-Control-Allow-Methods': False,
            'method.response.header.Access-Control-Allow-Origin':  False,
        }
    )
    apigw.put_integration_response(
        restApiId=api_id, resourceId=resource_id, httpMethod='OPTIONS', statusCode='200',
        responseParameters={
            'method.response.header.Access-Control-Allow-Headers': "'Content-Type,Authorization'",
            'method.response.header.Access-Control-Allow-Methods': "'GET,POST,OPTIONS'",
            'method.response.header.Access-Control-Allow-Origin':  "'*'",
        }
    )
    print(f"  [CORS]    {path}")

def create_route(parent_id, path_part, http_method, fn_name):
    """Create resource + method + Lambda proxy integration + CORS + permission."""
    res = apigw.create_resource(restApiId=api_id, parentId=parent_id, pathPart=path_part)
    rid = res['id']
    full_path = f"/{path_part}"

    apigw.put_method(restApiId=api_id, resourceId=rid,
                     httpMethod=http_method, authorizationType='NONE')
    apigw.put_integration(
        restApiId=api_id, resourceId=rid, httpMethod=http_method,
        type='AWS_PROXY', integrationHttpMethod='POST', uri=lambda_uri(fn_name)
    )
    apigw.put_method_response(
        restApiId=api_id, resourceId=rid, httpMethod=http_method, statusCode='200',
        responseParameters={'method.response.header.Access-Control-Allow-Origin': False}
    )

    # Lambda invoke permission
    import random
    stmt_id = f"apigw-{fn_name}-{random.randint(10000,99999)}"
    lam.add_permission(
        FunctionName=fn_name,
        StatementId=stmt_id,
        Action='lambda:InvokeFunction',
        Principal='apigateway.amazonaws.com',
        SourceArn=f"arn:aws:execute-api:{REGION}:{ACCOUNT_ID}:{api_id}/*/{http_method}/*"
    )

    add_cors_options(rid, full_path)
    print(f"  [Route]   {http_method} {full_path} → {fn_name}")
    return rid

# /eligibility  (POST)
create_route(root_id, 'eligibility', 'POST', 'sarathi-eligibility-engine')

# /twin  (POST)
create_route(root_id, 'twin', 'POST', 'sarathi-digital-twin')

# /scheme/{schemeId}  (GET)
scheme_res = apigw.create_resource(restApiId=api_id, parentId=root_id, pathPart='scheme')
scheme_parent_id = scheme_res['id']
scheme_id_res = apigw.create_resource(restApiId=api_id, parentId=scheme_parent_id, pathPart='{schemeId}')
scheme_id_res_id = scheme_id_res['id']
apigw.put_method(restApiId=api_id, resourceId=scheme_id_res_id,
                 httpMethod='GET', authorizationType='NONE')
apigw.put_integration(
    restApiId=api_id, resourceId=scheme_id_res_id, httpMethod='GET',
    type='AWS_PROXY', integrationHttpMethod='POST', uri=lambda_uri('sarathi-scheme-fetch')
)
apigw.put_method_response(
    restApiId=api_id, resourceId=scheme_id_res_id, httpMethod='GET', statusCode='200',
    responseParameters={'method.response.header.Access-Control-Allow-Origin': False}
)
import random
lam.add_permission(
    FunctionName='sarathi-scheme-fetch',
    StatementId=f"apigw-scheme-fetch-{random.randint(10000,99999)}",
    Action='lambda:InvokeFunction',
    Principal='apigateway.amazonaws.com',
    SourceArn=f"arn:aws:execute-api:{REGION}:{ACCOUNT_ID}:{api_id}/*/GET/*"
)
add_cors_options(scheme_id_res_id, '/scheme/{schemeId}')
print(f"  [Route]   GET /scheme/{{schemeId}} -> sarathi-scheme-fetch")

# /panchayat/{panchayatId}  (GET)
panch_res = apigw.create_resource(restApiId=api_id, parentId=root_id, pathPart='panchayat')
panch_parent_id = panch_res['id']
panch_id_res = apigw.create_resource(restApiId=api_id, parentId=panch_parent_id, pathPart='{panchayatId}')
panch_id_res_id = panch_id_res['id']
apigw.put_method(restApiId=api_id, resourceId=panch_id_res_id,
                 httpMethod='GET', authorizationType='NONE')
apigw.put_integration(
    restApiId=api_id, resourceId=panch_id_res_id, httpMethod='GET',
    type='AWS_PROXY', integrationHttpMethod='POST', uri=lambda_uri('sarathi-panchayat-stats')
)
apigw.put_method_response(
    restApiId=api_id, resourceId=panch_id_res_id, httpMethod='GET', statusCode='200',
    responseParameters={'method.response.header.Access-Control-Allow-Origin': False}
)
lam.add_permission(
    FunctionName='sarathi-panchayat-stats',
    StatementId=f"apigw-panch-stats-{random.randint(10000,99999)}",
    Action='lambda:InvokeFunction',
    Principal='apigateway.amazonaws.com',
    SourceArn=f"arn:aws:execute-api:{REGION}:{ACCOUNT_ID}:{api_id}/*/GET/*"
)
add_cors_options(panch_id_res_id, '/panchayat/{panchayatId}')
print(f"  [Route]   GET /panchayat/{{panchayatId}} -> sarathi-panchayat-stats")

# /citizen  (POST)
create_route(root_id, 'citizen', 'POST', 'sarathi-citizen-save')

# /conflicts  (POST)
create_route(root_id, 'conflicts', 'POST', 'sarathi-conflict-detector')

# ─── 4. Deploy to prod ───────────────────────────────────────────────────────
print("\n=== STEP 4: Deploy to prod stage ===")
apigw.create_deployment(restApiId=api_id, stageName='prod')
invoke_url = f"https://{api_id}.execute-api.{REGION}.amazonaws.com/prod"
print(f"  [OK] Deployed!")
print(f"\n{'='*60}")
print(f"  NEW API URL: {invoke_url}")
print(f"  NEW API ID:  {api_id}")
print(f"{'='*60}")
print(f"\nNext steps:")
print(f"  1. Update fix_cors.py: API_ID = '{api_id}'")
print(f"  2. Update .env: VITE_API_BASE_URL={invoke_url}")
print(f"  3. Run: python deploy_lambdas.py")
print(f"  4. Run: python fix_cors.py")
print(f"  5. Run: cd seed && python seed_schemes.py && python seed_citizens.py")
