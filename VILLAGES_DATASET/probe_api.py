import requests
import json
import sys
io = __import__('io')
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

BASE_URL = "https://api.myscheme.gov.in/schemes/v6/public/schemes"

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    "Referer": "https://www.myscheme.gov.in/",
    "Origin": "https://www.myscheme.gov.in",
    "Accept": "application/json, text/plain, */*",
    "X-Api-Key": "tYTy5eEhlu9rFjyxuCr7ra7ACp4dv1RH8gWuHTDc"
}

# Fetch a rich scheme that has all fields populated
test_slugs = ["aaelss", "abvky", "acandabc", "pm-kisan"]  

for slug in test_slugs:
    url = f"{BASE_URL}?slug={slug}&lang=en"
    r = requests.get(url, headers=HEADERS, timeout=15)
    print(f"[{r.status_code}] {slug}")
    if r.status_code == 200:
        data = r.json()
        # Save to file for inspection
        with open(f"sample_api_{slug}.json", 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        print(f"  Saved to sample_api_{slug}.json")
        
        # Print top-level keys
        raw_data = data.get('data', {}).get('en', {})
        print(f"  Top-level keys: {list(raw_data.keys())}")
        bd = raw_data.get('basicDetails', {})
        print(f"  basicDetails keys: {list(bd.keys())}")
        print(f"  schemeName: {bd.get('schemeName', 'N/A')}")
        print(f"  level: {bd.get('level')}")
        print(f"  state: {bd.get('state')}")
        print(f"  nodalMinistryName: {bd.get('nodalMinistryName')}")
        print(f"  tags: {bd.get('tags', [])[:5]}")
        print(f"  targetBeneficiaries: {[b.get('label','') for b in (bd.get('targetBeneficiaries') or [])][:5]}")
        print()
