import requests
import json

# Test profile: A 25-year old farmer from Karnataka
profile = {
    "age": 25,
    "gender": "male",
    "occupation": "farmer",
    "state": "Karnataka",
    "category": "General",
    "income": 10000
}

# API Gateway URL for eligibility
# Note: I'll use the one from previous logs if found, or assume standard structure.
# Based on create_check_role_route.py, the API ID is mvbx0sv4n3
url = "https://mvbx0sv4n3.execute-api.us-east-1.amazonaws.com/prod/eligibility"

print(f"Testing eligibility with profile: {profile}")
try:
    response = requests.post(url, json=profile)
    data = response.json()
    print(f"Status: {response.status_code}")
    print(f"Matched Schemes Count: {data.get('schemesCount')}")
    print(f"Total Annual Benefit: {data.get('totalAnnualBenefit')}")
    
    if data.get('matchedSchemes'):
        print("\nTop 3 Matched Schemes:")
        for s in data['matchedSchemes'][:3]:
            print(f"- {s['name']} ({s['id']}): Benefit: {s['annualBenefit']}")
except Exception as e:
    print(f"Error: {e}")

# Also test fetching 'all' schemes
all_url = "https://mvbx0sv4n3.execute-api.us-east-1.amazonaws.com/prod/scheme/all"
print(f"\nTesting fetching all schemes...")
try:
    response = requests.get(all_url)
    data = response.json()
    print(f"Status: {response.status_code}")
    # filter for items with Published status in the fetch lambda
    # the fetch lambda only returns status=='Published'
    print(f"Total Published Schemes returned: {len(data) if isinstance(data, list) else 'error'}")
except Exception as e:
    print(f"Error: {e}")
