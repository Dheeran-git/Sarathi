"""
agent_action_twin — Bedrock Agent Action Group
Receives monthlyIncome + matchedSchemes, runs 36-month income projections
and conflict resolution, returns pathways + optimal benefit bundle.
Internal only — invoked by Bedrock Agent, not API Gateway.
"""
import json

# Known conflicts between schemes
SCHEME_CONFLICTS = {
    ('pm-kisan', 'agri-infra-fund'): 'Both require land ownership. PM-KISAN is more accessible for small farmers.',
    ('pmay-gramin', 'pmay-urban'): 'PMAY-G is for rural areas, PMAY-U is for urban. Only one applies based on residence.',
    ('ignoaps', 'igndaps'): 'Old Age Pension and Disability Pension cannot be claimed simultaneously.',
    ('nrlm-shg', 'mudra-shishu'): 'Both provide credit — NRLM is group-based, MUDRA is individual. Consider MUDRA for higher amounts.',
}


def _to_num(val, default=0):
    try:
        return float(val) if val else default
    except (TypeError, ValueError):
        return default


def _run_twin(monthly_income, matched_schemes):
    """Calculate 36-month income projections with scheme benefits."""
    projections = []
    base = monthly_income

    # Build monthly benefit from schemes
    monthly_benefit = sum(
        _to_num(s.get('annualBenefit', 0)) / 12
        for s in matched_schemes
    )

    for month in range(1, 37):
        # Simple model: base income grows 0.3% per month, benefits are additive
        projected_base = base * (1.003 ** month)
        total = projected_base + monthly_benefit
        projections.append({
            'month': month,
            'baseIncome': round(projected_base),
            'benefitIncome': round(monthly_benefit),
            'totalIncome': round(total),
        })

    # Detect conflicts
    conflicts = []
    scheme_ids = [s.get('schemeId', '') for s in matched_schemes]
    for (s1, s2), reason in SCHEME_CONFLICTS.items():
        if s1 in scheme_ids and s2 in scheme_ids:
            conflicts.append({'schemes': [s1, s2], 'reason': reason})

    # Optimal bundle: remove lower-benefit scheme from conflicting pairs
    optimal_ids = set(scheme_ids)
    for conflict in conflicts:
        # Keep the scheme with higher annualBenefit
        s1_id, s2_id = conflict['schemes']
        s1 = next((s for s in matched_schemes if s.get('schemeId') == s1_id), None)
        s2 = next((s for s in matched_schemes if s.get('schemeId') == s2_id), None)
        if s1 and s2:
            b1 = _to_num(s1.get('annualBenefit', 0))
            b2 = _to_num(s2.get('annualBenefit', 0))
            remove_id = s2_id if b1 >= b2 else s1_id
            optimal_ids.discard(remove_id)

    optimal_bundle = [s for s in matched_schemes if s.get('schemeId') in optimal_ids]
    optimal_annual = sum(_to_num(s.get('annualBenefit', 0)) for s in optimal_bundle)

    month_36 = projections[-1] if projections else {}

    return {
        'projections': projections[::3],  # Every 3 months for readability
        'month36Income': month_36.get('totalIncome', 0),
        'baseIncome': monthly_income,
        'totalMonthlyBenefit': round(monthly_benefit),
        'totalAnnualBenefit': round(monthly_benefit * 12),
        'conflicts': conflicts,
        'optimalBundle': optimal_bundle,
        'optimalAnnualBenefit': round(optimal_annual),
        'incomeIncreasePct': round(((month_36.get('totalIncome', monthly_income) - monthly_income) / monthly_income * 100)) if monthly_income > 0 else 0,
    }


def _extract_param(parameters, name, default=''):
    for p in (parameters or []):
        if p.get('name') == name:
            return p.get('value', default)
    return default


def lambda_handler(event, context):
    try:
        action_group = event.get('actionGroup', '')
        function = event.get('function', 'calculate_twin')
        parameters = event.get('parameters', [])

        if function == 'calculate_twin':
            monthly_income = _to_num(_extract_param(parameters, 'monthlyIncome', '5000'))
            schemes_json = _extract_param(parameters, 'matchedSchemes', '[]')

            try:
                matched_schemes = json.loads(schemes_json) if isinstance(schemes_json, str) else schemes_json
            except (json.JSONDecodeError, TypeError):
                matched_schemes = []

            result = _run_twin(monthly_income, matched_schemes)
            result_text = json.dumps(result)
        else:
            result_text = json.dumps({'error': f'Unknown function: {function}'})

        return {
            'messageVersion': '1.0',
            'response': {
                'actionGroup': action_group,
                'function': function,
                'functionResponse': {
                    'responseBody': {
                        'TEXT': {'body': result_text}
                    }
                }
            }
        }

    except Exception as e:
        return {
            'messageVersion': '1.0',
            'response': {
                'actionGroup': event.get('actionGroup', ''),
                'function': event.get('function', ''),
                'functionResponse': {
                    'responseBody': {
                        'TEXT': {'body': json.dumps({'error': str(e)})}
                    }
                }
            }
        }
