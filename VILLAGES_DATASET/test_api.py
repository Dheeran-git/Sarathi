import requests
import json
import sys

BASE_URL = "https://api.myscheme.gov.in/schemes/v6/public/schemes"

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Referer": "https://www.myscheme.gov.in/",
    "Origin": "https://www.myscheme.gov.in",
    "Accept": "application/json, text/plain, */*",
    "X-Api-Key": "tYTy5eEhlu9rFjyxuCr7ra7ACp4dv1RH8gWuHTDc"
}

# Test fetching a single scheme by slug
test_slug = "aaelss"  # Assam Abhinandan Education Loan Subsidy Scheme
url = f"{BASE_URL}?slug={test_slug}&lang=en"
print(f"Fetching: {url}")

r = requests.get(url, headers=HEADERS, timeout=15)
print(f"Status: {r.status_code}")

if r.status_code == 200:
    data = r.json()
    print(json.dumps(data, ensure_ascii=False, indent=2)[:3000])
else:
    print(f"Response: {r.text[:500]}")

# Also test the search endpoint
print("\n\n--- Testing Search API ---")
search_url = "https://api.myscheme.gov.in/search/v4/schemes"
params = {
    "lang": "en",
    "q": "",
    "sizePage": 5,
    "numberOfPage": 0,
}
rs = requests.get(search_url, headers=HEADERS, params=params, timeout=15)
print(f"Search Status: {rs.status_code}")
if rs.status_code == 200:
    sd = rs.json()
    print(json.dumps(sd, ensure_ascii=False, indent=2)[:2000])
else:
    print(f"Search Response: {rs.text[:500]}")
