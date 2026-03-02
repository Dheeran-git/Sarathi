"""Deploy all 6 hardened Lambda functions to AWS."""
import boto3, zipfile, os, sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

client = boto3.client('lambda', region_name='us-east-1')

LAMBDAS = {
    'sarathi-eligibility-engine': 'eligibility_engine.py',
    'sarathi-digital-twin': 'digital_twin.py',
    'sarathi-scheme-fetch': 'scheme_fetch.py',
    'sarathi-panchayat-stats': 'panchayat_stats.py',
    'sarathi-conflict-detector': 'conflict_detector.py',
    'sarathi-citizen-save': 'citizen_save.py',
    'sarathi-tts-polly': 'tts_polly.py',
}

base = os.path.join(os.path.dirname(__file__), 'lambdas')

for fn_name, filename in LAMBDAS.items():
    filepath = os.path.join(base, filename)
    with open(filepath, 'r', encoding='utf-8') as f:
        code = f.read()

    # Create zip in memory
    buf = io.BytesIO()
    with zipfile.ZipFile(buf, 'w', zipfile.ZIP_DEFLATED) as zf:
        zf.writestr('lambda_function.py', code)
    buf.seek(0)

    try:
        resp = client.update_function_code(
            FunctionName=fn_name,
            ZipFile=buf.read()
        )
        print(f"[OK] {fn_name} -> {resp['LastModified']}")
    except Exception as e:
        print(f"[ERR] {fn_name}: {e}")

print("\nAll deployments complete.")
