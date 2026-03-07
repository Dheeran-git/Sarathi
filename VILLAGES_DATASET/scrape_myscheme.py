import requests
import json
import time
import os

BASE_URL = "https://api.myscheme.gov.in/schemes/v6/public/schemes"

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36",
    "Referer": "https://www.myscheme.gov.in/",
    "Origin": "https://www.myscheme.gov.in",
    "Accept": "application/json, text/plain, */*",
    "Accept-Language": "en-GB,en-US;q=0.9,en;q=0.8,hi;q=0.7",
    "Sec-Fetch-Site": "same-site",
    "Sec-Fetch-Mode": "cors",
    "Sec-Fetch-Dest": "empty",
    "X-Api-Key": "tYTy5eEhlu9rFjyxuCr7ra7ACp4dv1RH8gWuHTDc"
}



with open('schemes_cleaned.json', encoding='utf-8') as f:
    cleaned = json.load(f)

slugs = [s['schemeId'] for s in cleaned]
print(f"Total slugs to fetch: {len(slugs)}")

os.makedirs('scheme_jsons', exist_ok=True)

success, failed, skipped = 0, 0, 0

for i, slug in enumerate(slugs):
    out_path = f"scheme_jsons/{slug}.json"
    if os.path.exists(out_path):
        skipped += 1
        continue

    url = f"{BASE_URL}?slug={slug}&lang=en"

    try:
        r = requests.get(url, headers=HEADERS, timeout=15)

        if r.status_code == 200:
            data = r.json()
            with open(out_path, 'w', encoding='utf-8') as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
            success += 1
        else:
            print(f"[{r.status_code}] {slug}")
            failed += 1

    except Exception as e:
        print(f"Error [{slug}]: {e}")
        failed += 1

    if (i + 1) % 100 == 0:
        print(f"Progress: {i+1}/{len(slugs)} | Success: {success} | Failed: {failed}")

    time.sleep(0.5)

print(f"\nDone. Success: {success} | Failed: {failed} | Skipped: {skipped}")