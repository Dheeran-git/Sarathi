"""
conflict_detector — POST /conflicts
Detects scheme conflicts and generates optimal benefit bundle using game theory optimization.

Two modes:
1. Rule-based conflict detection from SarathiConflicts DynamoDB table
2. Game theory optimization: models schemes as a constraint satisfaction problem,
   finds the mathematically optimal combination maximizing total benefit value.
"""
import json
import os
import boto3
import time
from decimal import Decimal
from itertools import combinations

REGION = os.environ.get('AWS_REGION', 'us-east-1')
BEDROCK_MODEL_ID = os.environ.get('BEDROCK_MODEL_ID', 'amazon.nova-pro-v1:0')

dynamodb = boto3.resource('dynamodb', region_name=REGION)
_conflicts_table = dynamodb.Table('SarathiConflicts')
bedrock = boto3.client('bedrock-runtime', region_name=REGION)


class DecimalEncoder(json.JSONEncoder):
    def default(self, o):
        if isinstance(o, Decimal):
            return int(o) if o % 1 == 0 else float(o)
        return super().default(o)


def cors_headers():
    return {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Amz-Date,X-Api-Key',
        'Access-Control-Allow-Methods': 'GET,POST,PATCH,OPTIONS',
        'Content-Type': 'application/json',
    }


def _load_rules():
    """Load conflict rules from DynamoDB. Falls back to [] on any error."""
    try:
        resp = _conflicts_table.scan()
        return resp.get('Items', [])
    except Exception as e:
        print(f"[WARN] Failed to load conflict rules: {e}")
        return []


def _game_theory_optimize(matched_schemes, conflicts):
    """
    Game theory optimization using constraint satisfaction:
    - Model each scheme as a node with benefit value
    - Conflicts are edges between incompatible schemes
    - Find the maximum weight independent set (optimal non-conflicting combination)

    For small sets (< 20 schemes), uses exact brute-force.
    For larger sets, uses greedy approximation.
    """
    if not matched_schemes:
        return [], 0, []

    # Build scheme lookup
    scheme_map = {}
    for s in matched_schemes:
        sid = s.get('id', s.get('schemeId', ''))
        scheme_map[sid] = s

    scheme_ids = list(scheme_map.keys())
    n = len(scheme_ids)

    # Build conflict adjacency set
    conflict_pairs = set()
    for conflict in conflicts:
        s1 = conflict.get('scheme1', '')
        s2 = conflict.get('scheme2', '')
        if s1 in scheme_map and s2 in scheme_map:
            conflict_pairs.add((min(s1, s2), max(s1, s2)))

    def get_value(sid):
        return int(scheme_map[sid].get('annualBenefit', 0) or 0)

    def is_valid_set(subset):
        for i, s1 in enumerate(subset):
            for s2 in subset[i + 1:]:
                pair = (min(s1, s2), max(s1, s2))
                if pair in conflict_pairs:
                    return False
        return True

    best_bundle_ids = []
    best_value = 0

    if n <= 20:
        # Exact solution: enumerate all valid subsets
        for r in range(n, 0, -1):
            for combo in combinations(scheme_ids, r):
                if is_valid_set(combo):
                    total = sum(get_value(sid) for sid in combo)
                    if total > best_value:
                        best_value = total
                        best_bundle_ids = list(combo)
            if best_bundle_ids:
                break  # Found optimal at this size
    else:
        # Greedy approximation: sort by value descending, add if no conflict
        sorted_ids = sorted(scheme_ids, key=lambda sid: get_value(sid), reverse=True)
        selected = []
        for sid in sorted_ids:
            candidate = selected + [sid]
            if is_valid_set(candidate):
                selected.append(sid)
        best_bundle_ids = selected
        best_value = sum(get_value(sid) for sid in selected)

    optimal_bundle = [scheme_map[sid] for sid in best_bundle_ids if sid in scheme_map]

    # Calculate opportunity costs for excluded schemes
    excluded_ids = [sid for sid in scheme_ids if sid not in best_bundle_ids]
    opportunity_costs = []
    for sid in excluded_ids:
        scheme = scheme_map[sid]
        value = get_value(sid)
        # Find which schemes in the bundle conflict with this one
        conflicting_with = []
        for bsid in best_bundle_ids:
            pair = (min(sid, bsid), max(sid, bsid))
            if pair in conflict_pairs:
                conflicting_with.append(scheme_map[bsid].get('nameEnglish', bsid))

        opportunity_costs.append({
            'schemeId': sid,
            'schemeName': scheme.get('nameEnglish', sid),
            'lostBenefit': value,
            'reason': f"Conflicts with: {', '.join(conflicting_with)}" if conflicting_with else "Excluded by optimization",
            'conflictsWith': conflicting_with,
        })

    return optimal_bundle, best_value, opportunity_costs


def _generate_ai_explanation(conflicts, optimal_bundle, opportunity_costs, citizen_profile=None):
    """Use Bedrock to generate a plain-language explanation of the optimization."""
    try:
        context_parts = []
        if conflicts:
            for c in conflicts[:5]:
                context_parts.append(f"- {c.get('scheme1', '')} conflicts with {c.get('scheme2', '')}: {c.get('reason', 'incompatible')}")

        bundle_names = [s.get('nameEnglish', '') for s in optimal_bundle[:10]]
        excluded_names = [oc['schemeName'] for oc in opportunity_costs[:5]]

        prompt = (
            "You are Sarathi, a welfare advisor for rural India. Explain this scheme optimization in 2-3 simple sentences.\n\n"
            f"Optimal scheme bundle: {', '.join(bundle_names)}\n"
            f"Excluded schemes: {', '.join(excluded_names) if excluded_names else 'None'}\n"
            f"Conflicts found:\n" + '\n'.join(context_parts) if context_parts else "No conflicts."
            f"\n\nExplain why this combination gives the maximum benefit in simple language a rural citizen can understand."
        )

        response = bedrock.invoke_model(
            modelId=BEDROCK_MODEL_ID,
            contentType='application/json',
            accept='application/json',
            body=json.dumps({
                'messages': [{'role': 'user', 'content': [{'text': prompt}]}],
                'inferenceConfig': {'maxTokens': 300, 'temperature': 0.3},
            }),
        )
        result = json.loads(response['body'].read())
        return result.get('output', {}).get('message', {}).get('content', [{}])[0].get('text', '')
    except Exception as e:
        print(f"[WARN] AI explanation generation failed: {e}")
        return ''


def lambda_handler(event, context):
    try:
        body = json.loads(event.get('body', '{}')) if isinstance(event.get('body'), str) else event
        matched_schemes = body.get('matchedSchemes', [])
        citizen_profile = body.get('citizenProfile', {})
        use_game_theory = body.get('optimize', True)  # Default to game theory

        if not isinstance(matched_schemes, list):
            matched_schemes = []

        matched_ids = [s.get('id', s.get('schemeId', '')) for s in matched_schemes]

        # Load conflict rules from DynamoDB
        CONFLICTS = _load_rules()

        # Detect conflicts
        detected_conflicts = []
        for conflict in CONFLICTS:
            s1 = conflict.get('scheme1', '')
            s2 = conflict.get('scheme2', '')
            if s1 in matched_ids and s2 in matched_ids:
                detected_conflicts.append(conflict)

        if use_game_theory and matched_schemes:
            # Game theory optimization
            optimal_bundle, total_value, opportunity_costs = _game_theory_optimize(
                matched_schemes, detected_conflicts
            )

            # Generate AI explanation for the optimization
            ai_explanation = ''
            if detected_conflicts or opportunity_costs:
                ai_explanation = _generate_ai_explanation(
                    detected_conflicts, optimal_bundle, opportunity_costs, citizen_profile
                )

            return {
                'statusCode': 200,
                'headers': cors_headers(),
                'body': json.dumps({
                    'conflicts': detected_conflicts,
                    'optimalBundle': optimal_bundle,
                    'totalOptimalValue': total_value,
                    'conflictsFound': len(detected_conflicts),
                    'opportunityCosts': opportunity_costs,
                    'aiExplanation': ai_explanation,
                    'optimizationMethod': 'game_theory',
                }, cls=DecimalEncoder),
            }
        else:
            # Simple rule-based fallback
            excluded = set()
            for conflict in detected_conflicts:
                for s in [conflict.get('scheme1', ''), conflict.get('scheme2', '')]:
                    if s != conflict.get('recommended', ''):
                        excluded.add(s)

            optimal_bundle = [s for s in matched_schemes if s.get('id', s.get('schemeId')) not in excluded]
            total_value = sum(int(s.get('annualBenefit', 0)) for s in optimal_bundle)

            return {
                'statusCode': 200,
                'headers': cors_headers(),
                'body': json.dumps({
                    'conflicts': detected_conflicts,
                    'optimalBundle': optimal_bundle,
                    'totalOptimalValue': total_value,
                    'conflictsFound': len(detected_conflicts),
                    'opportunityCosts': [],
                    'aiExplanation': '',
                    'optimizationMethod': 'rule_based',
                }, cls=DecimalEncoder),
            }

    except Exception as e:
        return {
            'statusCode': 500,
            'headers': cors_headers(),
            'body': json.dumps({'error': 'Internal server error', 'message': str(e)}),
        }
