"""
zkp_verifier — Zero-Knowledge Proof simulation for privacy-preserving eligibility.

Routes:
  POST /zkp/prove   — generate proof that citizen meets eligibility thresholds
                      WITHOUT exposing actual values
  POST /zkp/verify  — verify a previously generated proof

Uses HMAC-based commitment scheme (hashlib + secrets).
Stores proof audit logs in DynamoDB (SarathiZKPAuditLog) with TTL 365 days.
Includes CORS headers and structured logging.
"""
import json
import os
import hashlib
import hmac
import secrets
import time
import boto3
from datetime import datetime, timezone, timedelta
from decimal import Decimal

REGION = 'us-east-1'
ZKP_AUDIT_TABLE = os.environ.get('ZKP_AUDIT_TABLE', 'SarathiZKPAuditLog')
TTL_DAYS = int(os.environ.get('ZKP_TTL_DAYS', '365'))
HMAC_SECRET_PARAM = os.environ.get('ZKP_HMAC_SECRET', '')

dynamodb = boto3.resource('dynamodb', region_name=REGION)
audit_table = dynamodb.Table(ZKP_AUDIT_TABLE)

# Module-level HMAC key: either from env or generated at cold-start
_HMAC_KEY = HMAC_SECRET_PARAM.encode() if HMAC_SECRET_PARAM else secrets.token_bytes(32)


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


def _response(status, body):
    return {
        'statusCode': status,
        'headers': cors_headers(),
        'body': json.dumps(body, cls=DecimalEncoder),
    }


# ---------------------------------------------------------------------------
# Commitment scheme helpers
# ---------------------------------------------------------------------------

def _generate_nonce():
    """Generate a cryptographic nonce for commitment binding."""
    return secrets.token_hex(16)


def _compute_commitment(field_name, comparison_result, nonce):
    """
    Create an HMAC-based commitment to a comparison result.
    The commitment binds to the boolean outcome (e.g., income < 10000 => True)
    WITHOUT revealing the actual value.
    """
    message = f"{field_name}:{comparison_result}:{nonce}".encode()
    return hmac.new(_HMAC_KEY, message, hashlib.sha256).hexdigest()


def _verify_commitment(field_name, comparison_result, nonce, commitment):
    """Verify that a commitment matches the expected values."""
    expected = _compute_commitment(field_name, comparison_result, nonce)
    return hmac.compare_digest(expected, commitment)


def _evaluate_threshold(actual_value, operator, threshold):
    """Evaluate whether actual_value meets the threshold condition."""
    try:
        actual = float(actual_value)
        thresh = float(threshold)
    except (ValueError, TypeError):
        return False

    if operator == '<':
        return actual < thresh
    elif operator == '<=':
        return actual <= thresh
    elif operator == '>':
        return actual > thresh
    elif operator == '>=':
        return actual >= thresh
    elif operator == '==':
        return actual == thresh
    elif operator == '!=':
        return actual != thresh
    else:
        return False


# ---------------------------------------------------------------------------
# Proof generation
# ---------------------------------------------------------------------------

def _generate_proof(citizen_data, thresholds):
    """
    Generate a ZKP-style proof for each threshold criterion.

    citizen_data: dict of actual values, e.g. {"income": 8000, "age": 45}
    thresholds: list of dicts, e.g. [
        {"field": "income", "operator": "<", "value": 10000, "label": "Income below poverty line"},
        {"field": "age", "operator": ">=", "value": 18, "label": "Adult citizen"}
    ]

    Returns commitments (hashes), proof metadata, and overall qualification.
    """
    commitments = {}
    nonces = {}
    results = {}
    all_pass = True

    for criterion in thresholds:
        field = criterion.get('field', '')
        operator = criterion.get('operator', '<')
        threshold_value = criterion.get('value')
        label = criterion.get('label', field)

        actual_value = citizen_data.get(field)
        if actual_value is None:
            # Cannot evaluate — treat as not passing
            meets = False
        else:
            meets = _evaluate_threshold(actual_value, operator, threshold_value)

        nonce = _generate_nonce()
        commitment = _compute_commitment(field, str(meets), nonce)

        commitments[field] = commitment
        nonces[field] = nonce
        results[field] = {
            'label': label,
            'meets': meets,
            'criterion': f"{field} {operator} {threshold_value}",
        }

        if not meets:
            all_pass = False

    proof_id = f"zkp-{secrets.token_hex(12)}"

    return {
        'proofId': proof_id,
        'commitments': commitments,
        'nonces': nonces,
        'results': results,
        'qualifies': all_pass,
        'criteriaCount': len(thresholds),
        'criteriaPassedCount': sum(1 for r in results.values() if r['meets']),
    }


def _store_audit_log(proof_id, citizen_id, action, proof_data):
    """Store proof event in audit log with TTL."""
    try:
        ttl = int((datetime.now(timezone.utc) + timedelta(days=TTL_DAYS)).timestamp())
        audit_table.put_item(Item={
            'proofId': proof_id,
            'citizenId': citizen_id,
            'action': action,
            'qualifies': proof_data.get('qualifies', False),
            'criteriaCount': proof_data.get('criteriaCount', 0),
            'criteriaPassedCount': proof_data.get('criteriaPassedCount', 0),
            'commitments': proof_data.get('commitments', {}),
            'createdAt': datetime.now(timezone.utc).isoformat(),
            'expiresAt': ttl,
        })
    except Exception as e:
        print(f"[WARN] Failed to store ZKP audit log: {e}")


# ---------------------------------------------------------------------------
# Proof verification
# ---------------------------------------------------------------------------

def _verify_proof(proof_id, commitments, nonces, results):
    """
    Verify that all commitments are valid for the given results.
    This confirms the proof was not tampered with.
    """
    verified_fields = {}
    all_valid = True

    for field, commitment in commitments.items():
        nonce = nonces.get(field)
        result = results.get(field, {})
        meets = result.get('meets')

        if nonce is None or meets is None:
            verified_fields[field] = False
            all_valid = False
            continue

        valid = _verify_commitment(field, str(meets), nonce, commitment)
        verified_fields[field] = valid
        if not valid:
            all_valid = False

    return {
        'proofId': proof_id,
        'verified': all_valid,
        'fieldVerification': verified_fields,
    }


# ---------------------------------------------------------------------------
# Lambda handler
# ---------------------------------------------------------------------------

def lambda_handler(event, context):
    method = event.get('httpMethod', '')
    path = event.get('path', '') or event.get('resource', '')

    if method == 'OPTIONS':
        return _response(200, {})

    if method != 'POST':
        return _response(405, {'error': f'Method not allowed: {method}'})

    try:
        body = json.loads(event.get('body', '{}')) if isinstance(event.get('body'), str) else event

        # POST /zkp/prove
        if 'prove' in path:
            citizen_id = str(body.get('citizenId', '')).strip()
            if not citizen_id:
                return _response(400, {'error': 'citizenId is required'})

            citizen_data = body.get('citizenData', {})
            thresholds = body.get('thresholds', [])

            if not citizen_data:
                return _response(400, {'error': 'citizenData is required (dict of field:value pairs)'})
            if not thresholds:
                return _response(400, {
                    'error': 'thresholds is required (list of {field, operator, value, label})'
                })

            proof = _generate_proof(citizen_data, thresholds)

            # Store audit log
            _store_audit_log(proof['proofId'], citizen_id, 'prove', proof)

            print(json.dumps({
                'zkp_proof_generated': True,
                'citizenId': citizen_id,
                'proofId': proof['proofId'],
                'qualifies': proof['qualifies'],
                'criteriaCount': proof['criteriaCount'],
                'criteriaPassedCount': proof['criteriaPassedCount'],
                'timestamp': datetime.now(timezone.utc).isoformat(),
            }))

            return _response(200, {
                'proofId': proof['proofId'],
                'commitments': proof['commitments'],
                'qualifies': proof['qualifies'],
                'criteriaCount': proof['criteriaCount'],
                'criteriaPassedCount': proof['criteriaPassedCount'],
                'results': {
                    field: {
                        'label': r['label'],
                        'meets': r['meets'],
                        'criterion': r['criterion'],
                    }
                    for field, r in proof['results'].items()
                },
                'nonces': proof['nonces'],
                'explanation': (
                    "We prove you qualify without showing private information. "
                    "Each commitment is a cryptographic hash that confirms whether you meet "
                    "a requirement, without revealing your actual data values."
                ),
                'generatedAt': datetime.now(timezone.utc).isoformat(),
            })

        # POST /zkp/verify
        if 'verify' in path:
            proof_id = str(body.get('proofId', '')).strip()
            commitments = body.get('commitments', {})
            nonces = body.get('nonces', {})
            results = body.get('results', {})

            if not proof_id:
                return _response(400, {'error': 'proofId is required'})
            if not commitments:
                return _response(400, {'error': 'commitments dict is required'})
            if not nonces:
                return _response(400, {'error': 'nonces dict is required'})
            if not results:
                return _response(400, {'error': 'results dict is required'})

            verification = _verify_proof(proof_id, commitments, nonces, results)

            # Check if any result says qualifies
            qualifies = all(r.get('meets', False) for r in results.values())

            # Audit log for verification
            _store_audit_log(proof_id, body.get('citizenId', 'unknown'), 'verify', {
                'qualifies': qualifies,
                'commitments': commitments,
                'criteriaCount': len(commitments),
                'criteriaPassedCount': sum(1 for r in results.values() if r.get('meets')),
            })

            print(json.dumps({
                'zkp_verification': True,
                'proofId': proof_id,
                'verified': verification['verified'],
                'qualifies': qualifies,
                'timestamp': datetime.now(timezone.utc).isoformat(),
            }))

            return _response(200, {
                'proofId': verification['proofId'],
                'verified': verification['verified'],
                'qualifies': qualifies,
                'fieldVerification': verification['fieldVerification'],
                'explanation': (
                    "Verification confirms the proof has not been tampered with. "
                    "Each field commitment was checked against the provided nonces and results."
                ),
                'verifiedAt': datetime.now(timezone.utc).isoformat(),
            })

        return _response(404, {'error': f'Route not found: {method} {path}'})

    except Exception as e:
        print(f"[ERR] zkp_verifier: {e}")
        return _response(500, {'error': 'Internal server error', 'message': str(e)})
