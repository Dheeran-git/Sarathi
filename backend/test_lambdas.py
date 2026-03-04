"""Test all 6 API endpoints via direct Lambda invocation."""
import sys, io, boto3, json
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

client = boto3.client('lambda', region_name='us-east-1')

def invoke(fn_name, payload):
    print(f"\n{'='*60}")
    print(f"Testing: {fn_name}")
    print(f"{'='*60}")
    resp = client.invoke(
        FunctionName=fn_name,
        Payload=json.dumps(payload).encode()
    )
    result = json.loads(resp['Payload'].read())
    status = result.get('statusCode', 'N/A')
    body = json.loads(result.get('body', '{}')) if isinstance(result.get('body'), str) else result
    print(f"Status: {status}")
    print(f"Response: {json.dumps(body, indent=2, ensure_ascii=False)[:500]}")
    return body

# 1. Eligibility Engine
elig = invoke('sarathi-eligibility-engine', {
    'age': 55, 'gender': 'female', 'monthlyIncome': 2000,
    'isWidow': True, 'occupation': 'any', 'category': 'SC'
})
print(f"\nMatched {elig.get('schemesCount', 0)} schemes, total benefit: {elig.get('totalAnnualBenefit', 0)}")

# 2. Digital Twin
invoke('sarathi-digital-twin', {
    'monthlyIncome': 2000,
    'matchedSchemes': elig.get('matchedSchemes', [])[:3]
})

# 3. Scheme Fetch
invoke('sarathi-scheme-fetch', {'schemeId': 'pm-kisan'})

# 4. Panchayat Stats
invoke('sarathi-panchayat-stats', {
    'pathParameters': {'panchayatId': 'rampur-barabanki-up'}
})

# 5. Conflict Detector
invoke('sarathi-conflict-detector', {
    'matchedSchemes': [
        {'schemeId': 'pmegp', 'annualBenefit': 250000},
        {'schemeId': 'nrlm-shg', 'annualBenefit': 15000},
        {'schemeId': 'mgnregs', 'annualBenefit': 36000}
    ]
})

# 6. Citizen Save
invoke('sarathi-citizen-save', {
    'name': 'Test User', 'age': 30, 'gender': 'male',
    'monthlyIncome': 5000, 'category': 'OBC'
})

print("\n" + "="*60)
print("ALL TESTS COMPLETE!")
print("="*60)
