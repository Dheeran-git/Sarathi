import json
import os
from decimal import Decimal

_SCHEMES_PATH = os.path.join(os.path.dirname(__file__), 'schemes.json')
try:
    with open(_SCHEMES_PATH, 'r', encoding='utf-8') as _f:
        LOCAL_SCHEMES = json.load(_f)
except FileNotFoundError:
    LOCAL_SCHEMES = []

class DecimalEncoder(json.JSONEncoder):
    def default(self, o):
        if isinstance(o, Decimal):
            return int(o) if o % 1 == 0 else float(o)
        return super().default(o)

def get_profile_tags(profile):
    tags = set()
    persona = str(profile.get('persona', '')).lower()
    
    # Category
    cat = str(profile.get('category', '')).upper()
    if cat in ['SC', 'ST', 'OBC']: tags.add(cat)
    if profile.get('minority'): tags.add('minority')
    
    # Financial / BPL
    bpl = str(profile.get('bplCard', '')).upper()
    if bpl in ['BPL', 'AAY']: 
        tags.add('bpl')
        tags.add('poor')
        
    # Demographic
    gender = str(profile.get('gender', '')).lower()
    if gender == 'female': 
        tags.add('women')
        tags.add('girl')
        tags.add('female')
    
    if profile.get('isWidow'):
        tags.update(['widow', 'destitute'])
    if profile.get('pregnant') or profile.get('lactating'):
        tags.update(['pregnant', 'maternity', 'mother', 'lactating'])
        
    if profile.get('disability'):
        tags.update(['disabled', 'disability', 'handicapped', 'divyang'])
        
    age = int(profile.get('age') or 0)
    if age >= 60:
        tags.update(['senior citizen', 'old age', 'pension'])
    if age < 18:
        tags.update(['child', 'children'])

    # Persona based
    if persona == 'farmer' or profile.get('landOwned'):
        tags.update(['farmer', 'agriculture', 'kisan', 'irrigation', 'crop'])
    if persona == 'student' or profile.get('classLevel'):
        tags.update(['student', 'education', 'scholarship', 'school', 'college'])
    if persona == 'business' or profile.get('msmeRegistered'):
        tags.update(['business', 'msme', 'entrepreneur', 'enterprise', 'industry'])
    if persona == 'labourer' or profile.get('mgnregaCard') or profile.get('streetVendor'):
        tags.update(['labourer', 'worker', 'vendor', 'employment', 'shramik'])
        
    if profile.get('shgMember'):
        tags.update(['shg', 'self help group'])
        
    # Health/Housing
    if profile.get('kutchaHouse'):
        tags.update(['housing', 'shelter', 'awaas'])
        
    return tags
    
def score_scheme(profile_tags, scheme, profile):
    score = 0
    scheme_str = " ".join((scheme.get('categories') or []) + (scheme.get('tags') or [])).lower()
    
    # Exact tag / category intersections
    for pt in profile_tags:
        if pt in scheme_str:
            score += 10
            
    # Penalize if it's strongly for a specific group the user is NOT part of
    gender_strict = str(scheme.get('gender', 'any')).lower()
    user_gender = str(profile.get('gender', 'any')).lower()
    if gender_strict in ['male', 'female'] and user_gender in ['male', 'female'] and gender_strict != user_gender:
        return -1 # hard disqualify
        
    # Hard age disqualify if dataset actually has strict ages
    min_age = int(scheme.get('minAge', 0))
    max_age = int(scheme.get('maxAge', 99))
    user_age = int(profile.get('age', 0))
    if user_age > 0 and (user_age < min_age or user_age > max_age):
        return -1

    return score


def lambda_handler(event, context):
    try:
        body = json.loads(event.get('body', '{}')) if isinstance(event.get('body'), str) else event

        all_schemes = LOCAL_SCHEMES
        if not all_schemes:
            import boto3
            t = boto3.resource('dynamodb', region_name='us-east-1').Table('SarathiSchemes')
            r = t.scan()
            all_schemes = r['Items']
            while 'LastEvaluatedKey' in r:
                r = t.scan(ExclusiveStartKey=r['LastEvaluatedKey'])
                all_schemes.extend(r['Items'])

        profile_tags = get_profile_tags(body)
        
        scored = []
        for scheme in all_schemes:
            if scheme.get('status') == 'Published':
                s = score_scheme(profile_tags, scheme, body)
                if s >= 10: # at least one meaningful tag overlap
                    scored.append((s, scheme))
                    
        # Sort by score primarily, then by benefit amount
        scored.sort(key=lambda x: (x[0], int(x[1].get('annualBenefit', 0))), reverse=True)
        
        # Take top 15 matches to avoid overwhelming frontend
        matched = []
        for s, scheme in scored[:15]:
            matched.append({
                'id': scheme.get('schemeId', scheme.get('id', '')),
                'name': scheme.get('nameEnglish', scheme.get('name', '')),
                'nameHindi': scheme.get('nameHindi', ''),
                'category': scheme.get('category', ''),
                'annualBenefit': int(scheme.get('annualBenefit', 0) or 0),
                'ministry': scheme.get('ministry', ''),
                'applyUrl': scheme.get('applyUrl', ''),
                'benefitType': scheme.get('benefitType', ''),
                'description': scheme.get('description', ''),
                'state': scheme.get('state', ['All']),
                'type': scheme.get('type', 'Central'),
                'matchScore': s
            })

        total = sum(s['annualBenefit'] for s in matched)

        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Amz-Date,X-Api-Key',
                'Access-Control-Allow-Methods': 'GET,POST,PATCH,OPTIONS',
                'Content-Type': 'application/json',
            },
            'body': json.dumps({
                'matchedSchemes': matched,
                'totalAnnualBenefit': total,
                'schemesCount': len(matched),
            }, cls=DecimalEncoder),
        }
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {
                'Access-Control-Allow-Origin': '*',
            },
            'body': json.dumps({'error': 'Internal server error', 'message': str(e)}),
        }
