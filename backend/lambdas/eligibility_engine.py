import json
import boto3
from boto3.dynamodb.conditions import Attr

dynamodb = boto3.resource('dynamodb', region_name='ap-south-1')
schemes_table = dynamodb.Table('SarathiSchemes')

def lambda_handler(event, context):
    # Parse input
    body = json.loads(event.get('body', '{}')) if isinstance(event.get('body'), str) else event
    age = int(body.get('age', 0))
    gender = body.get('gender', 'any').lower()
    monthly_income = int(body.get('monthlyIncome', 0))
    is_widow = bool(body.get('isWidow', False))
    occupation = body.get('occupation', 'any').lower()
    category = body.get('category', 'General')

    # Fetch all schemes from DynamoDB
    response = schemes_table.scan()
    all_schemes = response['Items']

    matched = []
    for scheme in all_schemes:
        # Check age
        if age < int(scheme.get('minAge', 0)): continue
        if age > int(scheme.get('maxAge', 99)): continue

        # Check income
        max_income = int(scheme.get('maxMonthlyIncome', 99999))
        if monthly_income > max_income: continue

        # Check gender
        scheme_gender = scheme.get('gender', 'any')
        if scheme_gender != 'any' and scheme_gender != gender: continue

        # Check widow requirement
        widow_req = scheme.get('isWidow', 'any')
        if widow_req == 'true' and not is_widow: continue

        # Check occupation
        scheme_occ = scheme.get('occupation', 'any')
        if scheme_occ != 'any' and scheme_occ != occupation: continue

        matched.append({
            'schemeId': scheme['schemeId'],
            'nameHindi': scheme.get('nameHindi', ''),
            'nameEnglish': scheme.get('nameEnglish', ''),
            'category': scheme.get('category', ''),
            'annualBenefit': int(scheme.get('annualBenefit', 0)),
            'ministry': scheme.get('ministry', ''),
            'applyUrl': scheme.get('applyUrl', ''),
        })

    # Sort by annual benefit (highest first)
    matched.sort(key=lambda x: x['annualBenefit'], reverse=True)

    total = sum(s['annualBenefit'] for s in matched)

    return {
        'statusCode': 200,
        'headers': {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'application/json'
        },
        'body': json.dumps({
            'matchedSchemes': matched,
            'totalAnnualBenefit': total,
            'schemesCount': len(matched)
        })
    }
