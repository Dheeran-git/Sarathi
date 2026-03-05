import json

def lambda_handler(event, context):
    try:
        body = json.loads(event.get('body', '{}')) if isinstance(event.get('body'), str) else event
        current_income = int(body.get('monthlyIncome', 2000))
        matched_schemes = body.get('matchedSchemes', [])
        poverty_line = 8000  # rupees per month

        # Validate input
        if current_income < 0:
            current_income = 0
        if not isinstance(matched_schemes, list):
            matched_schemes = []

        # Sort schemes by annual benefit ascending (take easiest/smallest first)
        schemes_sorted = sorted(matched_schemes, key=lambda x: int(x.get('annualBenefit', 0)))

        def generate_pathway(schemes_to_use):
            income = current_income
            data_points = []
            scheme_index = 0
            months_per_scheme = max(2, 36 // max(len(schemes_to_use), 1))

            for month in range(1, 37):  # 36 months = 3 years
                # Enroll a new scheme every few months
                if scheme_index < len(schemes_to_use) and month % months_per_scheme == 1:
                    scheme = schemes_to_use[scheme_index]
                    income += int(scheme.get('annualBenefit', 0)) / 12
                    scheme_name_en = scheme.get('nameEnglish', scheme.get('name', ''))
                    scheme_name_hi = scheme.get('nameHindi', scheme_name_en)
                    scheme_index += 1
                else:
                    scheme_name_en = None
                    scheme_name_hi = None

                data_points.append({
                    'month': month,
                    'income': round(income),
                    'scheme': scheme_name_en,
                    'schemeHindi': scheme_name_hi,
                })
            return data_points

        def months_to_exit(pathway):
            for point in pathway:
                if point['income'] >= poverty_line:
                    return point['month']
            return None

        best_path   = generate_pathway(schemes_sorted)
        medium_path = generate_pathway(schemes_sorted[:max(1, len(schemes_sorted)//2)])
        min_path    = generate_pathway(schemes_sorted[:3])

        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Amz-Date,X-Api-Key',
                'Access-Control-Allow-Methods': 'GET,POST,PATCH,OPTIONS',
                'Content-Type': 'application/json'
            },
            'body': json.dumps({
                'currentMonthlyIncome': current_income,
                'povertyLine': poverty_line,
                'pathways': {
                    'best':   best_path,
                    'medium': medium_path,
                    'minimum': min_path
                },
                'monthsToPovertyExit': {
                    'best':    months_to_exit(best_path),
                    'medium':  months_to_exit(medium_path),
                    'minimum': months_to_exit(min_path)
                }
            })
        }
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Amz-Date,X-Api-Key', 'Access-Control-Allow-Methods': 'GET,POST,PATCH,OPTIONS', 'Content-Type': 'application/json' },
            'body': json.dumps({ 'error': 'Internal server error', 'message': str(e) })
        }
