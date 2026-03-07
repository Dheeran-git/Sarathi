"""
Extract numeric annual benefit amounts from raw benefits text.
Updates both DynamoDB and the schemes.json bundle.
"""
import json
import re
import boto3
import sys
import io
from decimal import Decimal

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

BUNDLE_PATH = r'c:\Users\mohit\OneDrive\Desktop\Sarathi\backend\lambdas\schemes.json'
TABLE_NAME = 'SarathiSchemes'

dynamodb = boto3.resource('dynamodb', region_name='us-east-1')
table = dynamodb.Table(TABLE_NAME)

def extract_benefit(text):
    if not text:
         return 0
    patterns = [
        r'(?:â‚¹|₹|Rs\.?|INR)\s*([\d,]+)',
        r'([\d,]+)\s*(?:/-|rupees)'
    ]
    
    amts = []
    for pattern in patterns:
        matches = re.findall(pattern, text, re.IGNORECASE)
        for match in matches:
            clean_num = match.replace(',', '').strip()
            try:
                val = float(clean_num)
                if 100 <= val <= 5000000:
                    amts.append(val)
            except ValueError:
                pass
                
    if amts:
        return int(max(amts))
    return 0

print("Scanning DynamoDB for schemes...", flush=True)
all_schemes = []
response = table.scan(ProjectionExpression="schemeId, benefitsMd")
all_schemes.extend(response.get('Items', []))
while 'LastEvaluatedKey' in response:
    response = table.scan(ProjectionExpression="schemeId, benefitsMd", ExclusiveStartKey=response['LastEvaluatedKey'])
    all_schemes.extend(response.get('Items', []))

print(f"Found {len(all_schemes)} schemes.", flush=True)

updates_needed = []
for item in all_schemes:
    sid = item.get('schemeId')
    text = item.get('benefitsMd', '')
    benefit = extract_benefit(text)
    if benefit > 0:
        updates_needed.append((sid, benefit))

print(f"Found monetary benefits for {len(updates_needed)} schemes. Updating DynamoDB...", flush=True)

import threading
from concurrent.futures import ThreadPoolExecutor, as_completed

success = 0
lock = threading.Lock()

def update_scheme(sid, ben):
    try:
        table.update_item(
             Key={'schemeId': sid},
             UpdateExpression="SET annualBenefit = :b",
             ExpressionAttributeValues={':b': Decimal(str(ben))}
        )
        return True
    except Exception as e:
        print(f"Error updating {sid}: {e}", flush=True)
        return False

with ThreadPoolExecutor(max_workers=30) as executor:
    futures = [executor.submit(update_scheme, sid, ben) for sid, ben in updates_needed]
    for future in as_completed(futures):
        if future.result():
            with lock:
                success += 1
                if success % 100 == 0:
                    print(f"Updated {success}/{len(updates_needed)} items in DB.", flush=True)

print(f"DB update complete. {success}/{len(updates_needed)} records updated.", flush=True)

print("\nUpdating schemes.json bundle...", flush=True)
with open(BUNDLE_PATH, 'r', encoding='utf-8') as f:
    bundle = json.load(f)

update_dict = {sid: ben for sid, ben in updates_needed}
updated_bundle = 0
for s in bundle:
    sid = s.get('schemeId')
    if sid in update_dict:
        s['annualBenefit'] = update_dict[sid]
        updated_bundle += 1

with open(BUNDLE_PATH, 'w', encoding='utf-8') as f:
    json.dump(bundle, f, ensure_ascii=False)

print(f"Bundle update complete. {updated_bundle} schemes updated with benefit amount.", flush=True)
print("Done! Run deploy_lambdas.py to deploy the updated bundle.", flush=True)
