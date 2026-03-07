"""
Seed SarathiSchemes DynamoDB table from the Kaggle myscheme.gov.in dataset.
Source: kaggle.com/jainamgada45/indian-government-schemes  (CC0 license)
3,400 schemes with: name, slug, details, benefits, eligibility, application, documents, level, category, tags
"""
import csv
import json
import boto3
import sys
import io
import time
from decimal import Decimal

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

CSV_PATH = r'c:\Users\mohit\OneDrive\Desktop\Sarathi\VILLAGES_DATASET\kaggle_data\updated_data.csv'
TABLE_NAME = 'SarathiSchemes'
BUNDLE_PATH = r'c:\Users\mohit\OneDrive\Desktop\Sarathi\backend\lambdas\schemes.json'

dynamodb = boto3.resource('dynamodb', region_name='us-east-1')
table = dynamodb.Table(TABLE_NAME)


def clean(val):
    """Strip and return empty string for None."""
    if not val:
        return ""
    return val.strip()


def parse_tags(raw):
    """Parse comma-separated tags into a list."""
    if not raw:
        return []
    return [t.strip() for t in raw.split(',') if t.strip()]


def parse_categories(raw):
    """Parse comma-separated categories."""
    if not raw:
        return []
    return [c.strip() for c in raw.split(',') if c.strip()]


def infer_state(details, categories, level):
    """Try to infer state from the details text for state-level schemes."""
    if level.lower() != 'state':
        return ["All"]
    
    # Common state names to look for in text
    states = [
        "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
        "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka",
        "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram",
        "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu",
        "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
        "Andaman and Nicobar Islands", "Chandigarh", "Dadra and Nagar Haveli",
        "Daman and Diu", "Delhi", "Jammu and Kashmir", "Ladakh", "Lakshadweep",
        "Puducherry"
    ]
    
    text = (details or "") + " " + (categories or "")
    found = []
    for s in states:
        if s.lower() in text.lower():
            found.append(s)
    
    return found if found else ["State"]


def infer_ministry(details):
    """Try to extract ministry/department from details text."""
    if not details:
        return ""
    
    # Common patterns
    import re
    patterns = [
        r'Ministry of ([^,\.\n]+)',
        r'Department of ([^,\.\n]+)',
        r'(?:launched|introduced|implemented) by (?:the )?([^,\.\n]+)',
    ]
    for p in patterns:
        m = re.search(p, details, re.IGNORECASE)
        if m:
            return m.group(0).strip()[:100]
    return ""


def sanitize_for_dynamo(obj):
    """Remove empty values and convert floats for DynamoDB."""
    if isinstance(obj, dict):
        return {k: sanitize_for_dynamo(v) for k, v in obj.items()
                if v is not None and v != "" and v != [] and v != {}}
    if isinstance(obj, list):
        cleaned = [sanitize_for_dynamo(i) for i in obj if i is not None and i != ""]
        return cleaned if cleaned else None
    if isinstance(obj, float):
        return Decimal(str(obj))
    return obj


# ── Read CSV ───────────────────────────────────────────────────────────────────
print("Reading CSV...")
schemes = []
with open(CSV_PATH, 'r', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    for row in reader:
        name = clean(row.get('scheme_name', ''))
        slug = clean(row.get('slug', ''))
        if not name or not slug:
            continue
        
        details = clean(row.get('details', ''))
        benefits = clean(row.get('benefits', ''))
        eligibility = clean(row.get('eligibility', ''))
        application = clean(row.get('application', ''))
        documents = clean(row.get('documents', ''))
        level = clean(row.get('level', 'Central'))
        categories_raw = clean(row.get('schemeCategory', ''))
        tags_raw = clean(row.get('tags', ''))
        
        categories = parse_categories(categories_raw)
        tags = parse_tags(tags_raw)
        states = infer_state(details, categories_raw, level)
        ministry = infer_ministry(details)
        
        scheme = {
            'schemeId': slug,
            'nameEnglish': name,
            'shortTitle': slug.replace('-', ' ').title()[:50],
            'level': level.lower() if level else 'central',
            'type': 'Central Sector Scheme' if level.lower() == 'central' else 'State Sector Scheme',
            'state': states,
            'ministry': ministry,
            'categories': categories,
            'tags': tags,
            'briefDescription': details[:500] if details else '',
            'descriptionMd': details[:3000] if details else '',
            'benefitsMd': benefits[:2000] if benefits else '',
            'eligibilityMd': eligibility[:2000] if eligibility else '',
            'howToApply': application[:2000] if application else '',
            'documentsRequired': documents[:2000] if documents else '',
            'applyUrl': f'https://www.myscheme.gov.in/schemes/{slug}',
            'source': 'myscheme.gov.in',
            'status': 'Published',
            # Eligibility engine defaults
            'minAge': 0,
            'maxAge': 99,
            'maxMonthlyIncome': 999999,
            'gender': 'any',
            'occupation': 'any',
            'categories_str': 'SC,ST,OBC,General',
            'isWidow': 'any',
            'annualBenefit': 0,
        }
        schemes.append(scheme)

print(f"Parsed {len(schemes)} valid schemes from CSV")

# ── Write to DynamoDB ──────────────────────────────────────────────────────────
print(f"\nWriting {len(schemes)} items to DynamoDB table '{TABLE_NAME}'...")
start = time.time()
success = 0
errors = 0

with table.batch_writer() as batch:
    for i, scheme in enumerate(schemes):
        try:
            clean_item = sanitize_for_dynamo(scheme)
            if clean_item:
                batch.put_item(Item=clean_item)
                success += 1
        except Exception as e:
            errors += 1
            if errors <= 5:
                print(f"  Error [{scheme['schemeId']}]: {e}")
        
        if (i + 1) % 500 == 0:
            elapsed = time.time() - start
            print(f"  Written {i+1}/{len(schemes)} | {elapsed:.0f}s | Errors: {errors}")

elapsed = time.time() - start
print(f"\nDynamoDB seeding complete! Written: {success} | Errors: {errors} | Time: {elapsed:.0f}s")

# ── Generate optimized schemes.json bundle ─────────────────────────────────────
print(f"\nGenerating schemes.json bundle for eligibility engine...")
bundle = []
for s in schemes:
    bundle.append({
        'schemeId': s['schemeId'],
        'nameEnglish': s['nameEnglish'],
        'state': s['state'],
        'ministry': s['ministry'],
        'categories': s['categories'],
        'tags': s['tags'],
        'level': s['level'],
        'minAge': s['minAge'],
        'maxAge': s['maxAge'],
        'maxMonthlyIncome': s['maxMonthlyIncome'],
        'gender': s['gender'],
        'occupation': s['occupation'],
        'categories_str': s['categories_str'],
        'isWidow': s['isWidow'],
        'annualBenefit': s['annualBenefit'],
        'status': 'Published',
    })

with open(BUNDLE_PATH, 'w', encoding='utf-8') as f:
    json.dump(bundle, f, ensure_ascii=False)
print(f"Saved {len(bundle)} schemes to {BUNDLE_PATH}")

print("\nAll done! Run deploy_lambdas.py to push the updated bundle.")
