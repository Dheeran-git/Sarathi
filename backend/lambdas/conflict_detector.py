import json

# Hardcoded conflict rules — can be moved to DynamoDB for scalability
CONFLICTS = [
    {
        'scheme1': 'pmegp',
        'scheme2': 'nrlm-shg',
        'reason': 'Cannot receive two entrepreneurship loans simultaneously',
        'recommended': 'nrlm-shg',
        'reasoning': 'NRLM SHG has lower interest rate — better for first-time borrowers'
    },
    {
        'scheme1': 'mgnregs',
        'scheme2': 'pmegp',
        'reason': 'PMEGP income from business disqualifies from MGNREGS wage employment',
        'recommended': 'pmegp',
        'reasoning': 'PMEGP provides higher long-term income than MGNREGS daily wages'
    },
]

def lambda_handler(event, context):
    try:
        body = json.loads(event.get('body', '{}')) if isinstance(event.get('body'), str) else event
        matched_schemes = body.get('matchedSchemes', [])
        if not isinstance(matched_schemes, list):
            matched_schemes = []

        matched_ids = [s.get('schemeId', '') for s in matched_schemes]

        detected_conflicts = []
        excluded = set()

        for conflict in CONFLICTS:
            if conflict['scheme1'] in matched_ids and conflict['scheme2'] in matched_ids:
                detected_conflicts.append(conflict)
                # Remove the non-recommended scheme from optimal bundle
                for s in [conflict['scheme1'], conflict['scheme2']]:
                    if s != conflict['recommended']:
                        excluded.add(s)

        optimal_bundle = [s for s in matched_schemes if s.get('schemeId') not in excluded]
        total_value = sum(int(s.get('annualBenefit', 0)) for s in optimal_bundle)

        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type,Authorization',
                'Content-Type': 'application/json'
            },
            'body': json.dumps({
                'conflicts': detected_conflicts,
                'optimalBundle': optimal_bundle,
                'totalOptimalValue': total_value,
                'conflictsFound': len(detected_conflicts)
            })
        }
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
            'body': json.dumps({ 'error': 'Internal server error', 'message': str(e) })
        }
