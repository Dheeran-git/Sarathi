import json
import boto3
from decimal import Decimal
import time

# ── setup ────────────────────────────────────────────────────────────────────
JSON_PATH = r"c:\Users\mohit\OneDrive\Desktop\Sarathi\VILLAGES_DATASET\schemes_cleaned.json"
TABLE_NAME = 'SarathiSchemes'
REGION = 'us-east-1'

dynamodb = boto3.resource('dynamodb', region_name=REGION)
table = dynamodb.Table(TABLE_NAME)

def sanitize_for_dynamo(obj):
    """Recursively convert floats to Decimals and remove empty strings/nulls for DynamoDB."""
    if isinstance(obj, dict):
        return {k: sanitize_for_dynamo(v) for k, v in obj.items() if v is not None and v != ""}
    if isinstance(obj, list):
        return [sanitize_for_dynamo(i) for i in obj if i is not None and i != ""]
    if isinstance(obj, float):
        return Decimal(str(obj))
    return obj

def map_scheme(raw):
    """Map the 'schemes_cleaned.json' format to Sarathi's expected schema."""
    elig = raw.get('eligibility', {})
    
    # Flatten eligibility fields
    # Note: eligibility_engine expects 'categories' as a comma-separated string
    cats_list = elig.get('category', ['General', 'OBC', 'SC', 'ST'])
    if not isinstance(cats_list, list):
        cats_list = ['General', 'OBC', 'SC', 'ST']
        
    categories_str = ",".join(cats_list)
    
    states = raw.get('states', ['All'])
    # If states is empty or has junk, default to All
    if not states or not isinstance(states, list):
        states = ['All']
    
    # Simple logic for 'type'
    scheme_type = 'Central' if 'All' in states or raw.get('scope') == 'central' else 'State'
    
    mapped = {
        'schemeId': raw.get('schemeId'),
        'nameEnglish': raw.get('nameEnglish'),
        'nameHindi': raw.get('nameHindi', ''),
        'description': raw.get('description', ''),
        'benefits': raw.get('benefits', ''),
        'exclusions': raw.get('exclusions', ''),
        'howToApply': raw.get('howToApply', ''),
        'documentsRequired': raw.get('documentsRequired', ''),
        'ministry': raw.get('ministry', ''),
        'state': states,
        'type': scheme_type,
        'status': 'Published', # Make them visible in UI
        'source': raw.get('source', 'myscheme.gov.in'),
        'applyUrl': raw.get('applyUrl', ''),
        
        # Eligibility fields (flattened for engine)
        'minAge': int(elig.get('minAge', 0)),
        'maxAge': int(elig.get('maxAge', 99)),
        'maxMonthlyIncome': int(elig.get('maxMonthlyIncome', 0)) or 999999,
        'gender': elig.get('gender', 'any').lower(),
        'occupation': elig.get('occupation', 'any').lower(),
        'categories': categories_str,
        'isWidow': 'any',
        'annualBenefit': int(raw.get('annualBenefit', 0) or 0)
    }
    
    return sanitize_for_dynamo(mapped)

# ── execution ────────────────────────────────────────────────────────────────

print(f"Loading data from {JSON_PATH}...")
with open(JSON_PATH, 'r', encoding='utf-8') as f:
    raw_data = json.load(f)

print(f"Loaded {len(raw_data)} schemes. Starting batch upload to {TABLE_NAME}...")

success_count = 0
error_count = 0

with table.batch_writer() as batch:
    for i, raw_item in enumerate(raw_data):
        try:
            mapped_item = map_scheme(raw_item)
            if not mapped_item.get('schemeId') or not mapped_item.get('nameEnglish'):
                print(f"Skipping item {i} due to missing ID or Name")
                continue
                
            batch.put_item(Item=mapped_item)
            success_count += 1
            
            if success_count % 100 == 0:
                print(f"Progress: {success_count} items seeded...")
                
        except Exception as e:
            print(f"Error seeding item {i} ({raw_item.get('schemeId')}): {e}")
            error_count += 1

print(f"\nSeeding complete!")
print(f"Successfully seeded: {success_count}")
print(f"Errors: {error_count}")
