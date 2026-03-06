import json
import boto3

dynamodb = boto3.resource('dynamodb', region_name='us-east-1')
_conflicts_table = dynamodb.Table('SarathiConflicts')

def _load_rules():
    """Load conflict rules from DynamoDB. Falls back to [] on any error."""
    try:
        resp = _conflicts_table.scan()
        return resp.get('Items', [])
    except Exception:
        return []

def lambda_handler(event, context):
    try:
        body = json.loads(event.get('body', '{}')) if isinstance(event.get('body'), str) else event
        matched_schemes = body.get('matchedSchemes', [])
        if not isinstance(matched_schemes, list):
            matched_schemes = []

        matched_ids = [s.get('id', s.get('schemeId', '')) for s in matched_schemes]

        detected_conflicts = []
        excluded = set()

        CONFLICTS = _load_rules()
        for conflict in CONFLICTS:
            s1 = conflict.get('scheme1', '')
            s2 = conflict.get('scheme2', '')
            if s1 in matched_ids and s2 in matched_ids:
                detected_conflicts.append(conflict)
                # Remove the non-recommended scheme from optimal bundle
                for s in [s1, s2]:
                    if s != conflict.get('recommended', ''):
                        excluded.add(s)

        optimal_bundle = [s for s in matched_schemes if s.get('id', s.get('schemeId')) not in excluded]
        total_value = sum(int(s.get('annualBenefit', 0)) for s in optimal_bundle)

        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Amz-Date,X-Api-Key',
                'Access-Control-Allow-Methods': 'GET,POST,PATCH,OPTIONS',
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
            'headers': { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Amz-Date,X-Api-Key', 'Access-Control-Allow-Methods': 'GET,POST,PATCH,OPTIONS', 'Content-Type': 'application/json' },
            'body': json.dumps({ 'error': 'Internal server error', 'message': str(e) })
        }
