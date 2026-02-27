"""Day 4 — CloudWatch logs check + Performance test for all 6 Lambda endpoints."""
import sys, io, boto3, json, time

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

lambda_client = boto3.client('lambda', region_name='us-east-1')
logs_client = boto3.client('logs', region_name='us-east-1')

LAMBDAS = [
    ('sarathi-eligibility-engine', 'POST', {'age': 55, 'gender': 'female', 'monthlyIncome': 2000, 'isWidow': True, 'occupation': 'any', 'category': 'SC'}),
    ('sarathi-digital-twin', 'POST', {'monthlyIncome': 2000, 'matchedSchemes': [{'schemeId': 'pm-kisan', 'nameEnglish': 'PM-KISAN', 'annualBenefit': 6000}]}),
    ('sarathi-scheme-fetch', 'GET', {'schemeId': 'pm-kisan'}),
    ('sarathi-panchayat-stats', 'GET', {'pathParameters': {'panchayatId': 'rampur-barabanki-up'}}),
    ('sarathi-conflict-detector', 'POST', {'matchedSchemes': [{'schemeId': 'pmegp', 'annualBenefit': 250000}, {'schemeId': 'nrlm-shg', 'annualBenefit': 15000}]}),
    ('sarathi-citizen-save', 'POST', {'name': 'PerfTest', 'age': 30, 'gender': 'male', 'monthlyIncome': 5000, 'category': 'OBC'}),
]

print("=" * 70)
print("SARATHI BACKEND — HEALTH CHECK & PERFORMANCE TEST")
print("=" * 70)

# 1. CloudWatch Error Check
print("\n--- CLOUDWATCH ERROR CHECK ---")
errors_found = 0
for fn_name, _, _ in LAMBDAS:
    log_group = f"/aws/lambda/{fn_name}"
    try:
        streams = logs_client.describe_log_streams(
            logGroupName=log_group,
            orderBy='LastEventTime',
            descending=True,
            limit=1
        )['logStreams']
        if streams:
            events = logs_client.get_log_events(
                logGroupName=log_group,
                logStreamName=streams[0]['logStreamName'],
                limit=50
            )['events']
            errs = [e for e in events if 'ERROR' in e.get('message', '') or 'Traceback' in e.get('message', '')]
            if errs:
                errors_found += len(errs)
                print(f"  [WARN] {fn_name}: {len(errs)} error(s) in latest log stream")
            else:
                print(f"  [OK]   {fn_name}: No errors")
        else:
            print(f"  [--]   {fn_name}: No log streams yet")
    except Exception as e:
        print(f"  [--]   {fn_name}: {str(e)[:60]}")

print(f"\nTotal errors: {errors_found}")

# 2. Performance Test (5 invocations per Lambda)
print("\n--- PERFORMANCE TEST (5 invocations each) ---")
all_pass = True
for fn_name, method, payload in LAMBDAS:
    times = []
    for i in range(5):
        start = time.time()
        resp = lambda_client.invoke(FunctionName=fn_name, Payload=json.dumps(payload).encode())
        elapsed = (time.time() - start) * 1000  # ms
        times.append(elapsed)
        result = json.loads(resp['Payload'].read())
        status = result.get('statusCode', 'N/A')

    avg = sum(times) / len(times)
    mx = max(times)
    mn = min(times)
    verdict = "PASS" if mx < 3000 else "SLOW"
    if mx >= 3000:
        all_pass = False
    print(f"  {fn_name}:")
    print(f"    Avg: {avg:.0f}ms | Min: {mn:.0f}ms | Max: {mx:.0f}ms | [{verdict}]")

print(f"\n{'ALL ENDPOINTS PASS < 3s' if all_pass else 'SOME ENDPOINTS ARE SLOW'}")
print("=" * 70)
