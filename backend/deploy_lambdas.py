"""Deploy all Lambda functions to AWS (us-east-1)."""
import boto3, zipfile, os, sys, io, json
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

client = boto3.client('lambda', region_name='us-east-1')

# Core lambdas: name -> source file
LAMBDAS = {
    'sarathi-eligibility-engine': 'eligibility_engine.py',
    'sarathi-digital-twin': 'digital_twin.py',
    'sarathi-scheme-fetch': 'scheme_fetch.py',
    'sarathi-panchayat-stats': 'panchayat_stats.py',
    'sarathi-conflict-detector': 'conflict_detector.py',
    'sarathi-citizen-save': 'citizen_save.py',
    'sarathi-bedrock-explainer': 'bedrock_explainer.py',
    'sarathi-panchayat-notifier': 'panchayat_notifier.py',
    'sarathi-applications': 'applications.py',
    'sarathi-agent-executor': 'bedrock_agent_executor.py',
    'sarathi-invoke-agent': 'invoke_bedrock_agent.py',
    'sarathi-admin-schemes': 'admin_schemes.py',
}

# Extra files to bundle alongside specific lambdas
EXTRA_FILES = {
    'sarathi-eligibility-engine': ['schemes.json'],
}

base = os.path.join(os.path.dirname(__file__), 'lambdas')

for fn_name, filename in LAMBDAS.items():
    filepath = os.path.join(base, filename)
    if not os.path.exists(filepath):
        print(f"[SKIP] {fn_name}: {filename} not found")
        continue
    with open(filepath, 'r', encoding='utf-8') as f:
        code = f.read()

    # Create zip in memory
    buf = io.BytesIO()
    with zipfile.ZipFile(buf, 'w', zipfile.ZIP_DEFLATED) as zf:
        # Write to both names to handle mixed AWS handler configurations
        zf.writestr('lambda_function.py', code)
        zf.writestr(filename, code)
        
        # Bundle any extra files (e.g. schemes.json for eligibility engine)
        for extra in EXTRA_FILES.get(fn_name, []):
            extra_path = os.path.join(base, extra)
            if os.path.exists(extra_path):
                zf.write(extra_path, extra)
    buf.seek(0)

    try:
        resp = client.update_function_code(
            FunctionName=fn_name,
            ZipFile=buf.read()
        )
        print(f"[OK] {fn_name} -> {resp['LastModified']}")
    except client.exceptions.ResourceNotFoundException:
        print(f"[SKIP] {fn_name}: function does not exist yet (create it first)")
    except Exception as e:
        print(f"[ERR] {fn_name}: {e}")

print("\nAll deployments complete.")
