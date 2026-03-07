import json

JSON_PATH = r"c:\Users\mohit\OneDrive\Desktop\Sarathi\VILLAGES_DATASET\schemes_cleaned.json"
OUTPUT_PATH = r"c:\Users\mohit\OneDrive\Desktop\Sarathi\backend\lambdas\schemes.json"

def map_scheme(raw):
    """Simplified mapper for the local JSON bundle."""
    elig = raw.get('eligibility', {})
    cats_list = elig.get('category', ['General', 'OBC', 'SC', 'ST'])
    if not isinstance(cats_list, list):
        cats_list = ['General', 'OBC', 'SC', 'ST']
    categories_str = ",".join(cats_list)
    
    states = raw.get('states', ['All'])
    if not states or not isinstance(states, list):
        states = ['All']
    
    scheme_type = 'Central' if 'All' in states or raw.get('scope') == 'central' else 'State'
    
    return {
        'schemeId': raw.get('schemeId'),
        'nameEnglish': raw.get('nameEnglish'),
        'nameHindi': raw.get('nameHindi', ''),
        'description': raw.get('description', ''),
        'ministry': raw.get('ministry', ''),
        'state': states,
        'type': scheme_type,
        'status': 'Published',
        'applyUrl': raw.get('applyUrl', ''),
        'minAge': int(elig.get('minAge', 0)),
        'maxAge': int(elig.get('maxAge', 99)),
        'maxMonthlyIncome': int(elig.get('maxMonthlyIncome', 0)) or 999999,
        'gender': elig.get('gender', 'any').lower(),
        'occupation': elig.get('occupation', 'any').lower(),
        'categories': categories_str,
        'isWidow': 'any',
        'annualBenefit': int(raw.get('annualBenefit', 0) or 0)
    }

print("Reading raw data...")
with open(JSON_PATH, 'r', encoding='utf-8') as f:
    raw_data = json.load(f)

print("Mapping schemes for local bundle...")
mapped_data = [map_scheme(s) for s in raw_data if s.get('schemeId')]

print(f"Writing {len(mapped_data)} schemes to {OUTPUT_PATH}...")
with open(OUTPUT_PATH, 'w', encoding='utf-8') as f:
    json.dump(mapped_data, f, ensure_ascii=False)

print("Done!")
