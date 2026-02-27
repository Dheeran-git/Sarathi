import json
import boto3
from decimal import Decimal
from boto3.dynamodb.conditions import Attr

dynamodb = boto3.resource('dynamodb', region_name='us-east-1')
schemes_table = dynamodb.Table('SarathiSchemes')

class DecimalEncoder(json.JSONEncoder):
    def default(self, o):
        if isinstance(o, Decimal):
            return int(o) if o % 1 == 0 else float(o)
        return super().default(o)

def lambda_handler(event, context):
    try:
        # Parse input — handle both API Gateway proxy and direct invocation
        body = json.loads(event.get('body', '{}')) if isinstance(event.get('body'), str) else event
        age = int(body.get('age', 0))
        gender = body.get('gender', 'any').lower().strip()
        monthly_income = int(body.get('monthlyIncome', 0))
        is_widow = body.get('isWidow', False)
        if isinstance(is_widow, str):
            is_widow = is_widow.lower() in ('true', '1', 'yes')
        occupation = body.get('occupation', 'any').lower().strip()
        category = body.get('category', 'General').strip()

        # Fetch ALL schemes from DynamoDB with pagination
        all_schemes = []
        response = schemes_table.scan()
        all_schemes.extend(response['Items'])
        while 'LastEvaluatedKey' in response:
            response = schemes_table.scan(ExclusiveStartKey=response['LastEvaluatedKey'])
            all_schemes.extend(response['Items'])

        matched = []
        for scheme in all_schemes:
            # Check age range
            if age < int(scheme.get('minAge', 0)):
                continue
            if age > int(scheme.get('maxAge', 99)):
                continue

            # Check income ceiling
            max_income = int(scheme.get('maxMonthlyIncome', 99999))
            if monthly_income > max_income:
                continue

            # Check gender requirement
            scheme_gender = scheme.get('gender', 'any')
            if scheme_gender != 'any' and scheme_gender != gender:
                continue

            # Check widow requirement
            widow_req = scheme.get('isWidow', 'any')
            if widow_req == 'true' and not is_widow:
                continue

            # Check occupation requirement
            scheme_occ = scheme.get('occupation', 'any')
            if scheme_occ != 'any' and scheme_occ != occupation:
                continue

            # Check category (SC/ST/OBC/General) against scheme's allowed categories
            allowed_cats = scheme.get('categories', 'SC,ST,OBC,General')
            if isinstance(allowed_cats, str):
                allowed_list = [c.strip() for c in allowed_cats.split(',')]
            else:
                allowed_list = allowed_cats
            if category not in allowed_list and 'General' not in allowed_list:
                continue

            matched.append({
                'schemeId': scheme['schemeId'],
                'nameHindi': scheme.get('nameHindi', ''),
                'nameEnglish': scheme.get('nameEnglish', ''),
                'category': scheme.get('category', ''),
                'annualBenefit': int(scheme.get('annualBenefit', 0)),
                'ministry': scheme.get('ministry', ''),
                'applyUrl': scheme.get('applyUrl', ''),
                'benefitType': scheme.get('benefitType', ''),
            })

        # Sort by annual benefit (highest first)
        matched.sort(key=lambda x: x['annualBenefit'], reverse=True)

        total = sum(s['annualBenefit'] for s in matched)

        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type,Authorization',
                'Content-Type': 'application/json'
            },
            'body': json.dumps({
                'matchedSchemes': matched,
                'totalAnnualBenefit': total,
                'schemesCount': len(matched)
            }, cls=DecimalEncoder)
        }
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json'
            },
            'body': json.dumps({
                'error': 'Internal server error',
                'message': str(e)
            })
        }
