import json
import os

# Bedrock Agent Action Group: Eligibility & Search
# Merged from origin/main with fast local schemes.json loading.

def lambda_handler(event, context):
    print("Received event:", json.dumps(event))
    actionGroup = event.get('actionGroup', '')
    function = event.get('function', '')
    parameters = event.get('parameters', [])
    params = {p['name']: p['value'] for p in parameters}
    
    # Load schemes from bundled JSON
    schemes = []
    try:
        # Check if we are in the lambda root
        path = 'schemes.json'
        if not os.path.exists(path):
            path = '/var/task/schemes.json'
            
        with open(path, 'r', encoding='utf-8') as f:
            schemes = json.load(f)
    except Exception as e:
        print(f"Error loading schemes.json: {e}")

    response_body_text = ""
    
    if function == 'SearchSchemes' or function == 'get_eligible_schemes':
        query = params.get('query', '').lower()
        
        if not query or query == 'all':
            matched = schemes[:5]
        else:
            q = query.replace("-", " ")
            matched = []
            for s in schemes:
                search_text = (
                    str(s.get('schemeId', '')).lower().replace("-", " ") + " " +
                    str(s.get('nameEnglish', '')).lower() + " " +
                    str(s.get('ministry', '')).lower() + " " +
                    str(s.get('briefDescription', '')).lower() + " " +
                    str(s.get('tags', [])).lower()
                )
                if q in search_text:
                    matched.append(s)
            matched = matched[:5] # Limit to 5 for token efficiency
            
        results = []
        for s in matched:
            results.append({
                'schemeId': s.get('schemeId'),
                'name': s.get('nameEnglish'),
                'benefit': s.get('annualBenefit'),
                'ministry': s.get('ministry'),
                'description': s.get('briefDescription', '')[:200]
            })
        
        response_body_text = json.dumps({'found': len(results), 'schemes': results})

    elif function == 'GetSchemeDetails' or function == 'check_scheme_eligibility':
        scheme_id = params.get('schemeId')
        match = next((s for s in schemes if s.get('schemeId') == scheme_id), None)
        
        if not match:
            # Fuzzy match by name if ID fails
            q = str(scheme_id).lower()
            match = next((s for s in schemes if q in s.get('nameEnglish', '').lower()), None)

        if match:
            response_data = {
                'schemeId': match.get('schemeId'),
                'name': match.get('nameEnglish'),
                'eligibility': match.get('eligibilityCriteriaEnglish', 'Standard criteria.'),
                'documents': match.get('documentsRequiredEnglish', 'Aadhaar, Income Proof.'),
                'benefit': match.get('annualBenefit'),
                'howToApply': match.get('applyUrl', 'Apply via Sarathi portal.')
            }
            response_body_text = json.dumps(response_data)
        else:
            response_body_text = json.dumps({'error': 'Scheme not found.'})

    else:
        response_body_text = f"Function {function} not recognized."

    return {
        'response': {
            'actionGroup': actionGroup,
            'function': function,
            'functionResponse': {
                'responseBody': {
                    'TEXT': {'body': response_body_text}
                }
            }
        },
        'messageVersion': '1.0'
    }
