import json
import boto3

def lambda_handler(event, context):
    actionGroup = event.get('actionGroup', '')
    function = event.get('function', '')
    parameters = event.get('parameters', [])
    params = {p['name']: p['value'] for p in parameters}
    
    response_body = {}
    
    if function == 'get_twin_projection':
        citizen_id = params.get('citizenId')
        response_body = {
            'currentIncome': 15000,
            'potentialIncome': 22000,
            'topOptimizations': [
                'Enroll in Skill India mission for certification',
                'Apply for Swarnima scheme startup loan'
            ]
        }
    
    elif function == 'detect_scheme_conflicts':
        citizen_id = params.get('citizenId')
        response_body = {
            'conflicts': [],
            'analysis': 'No significant conflicts detected between your current schemes.'
        }

    action_response = {
        'actionGroup': actionGroup,
        'function': function,
        'functionResponse': {
            'responseBody': {
                'TEXT': {'body': json.dumps(response_body)}
            }
        }
    }
    
    return {
        'response': action_response,
        'messageVersion': '1.0'
    }
