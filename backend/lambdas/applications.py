"""
A5: sarathi-applications Lambda
Routes:
  POST /apply              — create new application
  GET  /applications/{userId} — list citizen's applications
  PATCH /apply/{applicationId} — update status
  POST /application/explain-status — AI status explanation
  POST /application/pre-fill — AI pre-fill application form
"""
import json
import os
import re
import time
import boto3
import uuid
from datetime import datetime, timezone
from decimal import Decimal
from boto3.dynamodb.conditions import Key

REGION = 'us-east-1'
BEDROCK_MODEL_ID = os.environ.get('BEDROCK_MODEL_ID', 'amazon.nova-pro-v1:0')

dynamodb = boto3.resource('dynamodb', region_name=REGION)
table = dynamodb.Table('SarathiApplications')
schemes_table = dynamodb.Table('SarathiSchemes')
bedrock = boto3.client('bedrock-runtime', region_name=REGION)

CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token',
    'Access-Control-Allow-Methods': 'GET,POST,PATCH,OPTIONS',
    'Content-Type': 'application/json',
}

VALID_STATUSES = {'pending', 'submitted', 'approved', 'rejected'}

# Prompt injection patterns
_INJECTION_RE = re.compile(r'ignore\s+(all\s+)?previous\s+instructions|you\s+are\s+now\s+a|system\s*:', re.IGNORECASE)


class DecimalEncoder(json.JSONEncoder):
    def default(self, o):
        if isinstance(o, Decimal):
            return int(o) if o % 1 == 0 else float(o)
        return super().default(o)


def _ok(data):
    return {
        'statusCode': 200,
        'headers': CORS_HEADERS,
        'body': json.dumps(data, cls=DecimalEncoder),
    }


def _err(code, message):
    return {
        'statusCode': code,
        'headers': CORS_HEADERS,
        'body': json.dumps({'error': message}),
    }


def _body(event):
    raw = event.get('body', '{}') or '{}'
    return json.loads(raw) if isinstance(raw, str) else raw


def _normalize_pid(pid):
    """Ensure panchayatId has the LGD_ prefix if it's numeric."""
    if not pid: return 'unassigned'
    p = str(pid).strip()
    if p.isdigit() and not p.startswith('LGD_'):
        return f"LGD_{p}"
    return p


def handle_post_apply(event):
    """POST /apply — create a new application."""
    body = _body(event)
    citizen_id = body.get('citizenId', '').strip()
    scheme_id  = body.get('schemeId', '').strip()
    panchayat_id = _normalize_pid(body.get('panchayatId', ''))
    
    if not citizen_id or not scheme_id:
        return _err(400, 'citizenId and schemeId are required')

    now = datetime.now(timezone.utc).isoformat()
    application_id = str(uuid.uuid4())[:8].upper()  # Short readable ID

    item = {
        'applicationId': application_id,
        'citizenId': citizen_id,
        'panchayatId': panchayat_id or 'unassigned',
        'schemeId': scheme_id,
        'schemeName': body.get('schemeName', ''),
        'status': 'submitted',
        'documentsChecked': body.get('documentsChecked', []),
        'personalDetails': {
            'name': body.get('personalDetails', {}).get('name', ''),
            'aadhaarLast4': body.get('personalDetails', {}).get('aadhaarLast4', ''),
            'mobile': body.get('personalDetails', {}).get('mobile', ''),
            'bankAccountLast4': body.get('personalDetails', {}).get('bankAccountLast4', ''),
        },
        'notes': body.get('notes', ''),
        'createdAt': now,
        'updatedAt': now,
    }

    table.put_item(Item=item)
    return _ok({'applicationId': application_id, 'status': 'submitted', 'createdAt': now})


def handle_get_panchayat_applications(event):
    """GET /panchayat-applications/{panchayatId} — query applications in a panchayat."""
    # Priority 1: JWT claims (most reliable if authenticated)
    claims = (event.get('requestContext', {}).get('authorizer', {}).get('claims') or {})
    lgd = claims.get('custom:lgdCode', '').strip()
    jwt_pid = claims.get('custom:panchayatId', '').strip()
    
    panchayat_id = None
    if lgd:
        panchayat_id = f"LGD_{lgd}"
    elif jwt_pid:
        panchayat_id = _normalize_pid(jwt_pid)

    # Priority 2: Path parameter fallback
    if not panchayat_id:
        path_params = event.get('pathParameters') or {}
        path_pid = path_params.get('panchayatId', '').strip()
        panchayat_id = _normalize_pid(path_pid)

    if not panchayat_id or panchayat_id == 'unassigned':
        return _err(400, 'panchayatId path parameter or JWT claim is required')

    print(f"[DEBUG] Querying applications for panchayat: {panchayat_id}")
    try:
        def fetch_applications_for_pid(pid):
            resp = table.query(
                IndexName='panchayatId-createdAt-index',
                KeyConditionExpression=Key('panchayatId').eq(pid),
                ScanIndexForward=False,
                Limit=100
            )
            return resp.get('Items', [])

        applications = fetch_applications_for_pid(panchayat_id)
        
        legacy_pid = panchayat_id.replace('LGD_', '') if panchayat_id.startswith('LGD_') else None
        if legacy_pid and legacy_pid != panchayat_id and legacy_pid.isdigit():
            legacy_apps = fetch_applications_for_pid(legacy_pid)
            
            seen_ids = {a.get('applicationId') for a in applications if a.get('applicationId')}
            for la in legacy_apps:
                aid = la.get('applicationId')
                if aid and aid not in seen_ids:
                    applications.append(la)
                    seen_ids.add(aid)
                    
        # Inject citizenName for frontend if missing
        citizens_table = dynamodb.Table('SarathiCitizens')
        citizen_cache = {}
        
        for app in applications:
            # 1. Try personalDetails
            if 'personalDetails' in app and app['personalDetails'].get('name'):
                app['citizenName'] = app['personalDetails']['name']
            else:
                # 2. Try fetching from SarathiCitizens
                cid = app.get('citizenId')
                if cid:
                    if cid not in citizen_cache:
                        try:
                            c_resp = citizens_table.get_item(Key={'citizenId': cid})
                            citizen_cache[cid] = c_resp.get('Item', {}).get('name', 'Unknown Citizen')
                        except Exception:
                            citizen_cache[cid] = 'Unknown Citizen'
                    app['citizenName'] = citizen_cache[cid]
                else:
                    app['citizenName'] = 'Unknown Citizen'
                    
        # Sort combined applications by createdAt (descending)
        applications.sort(key=lambda x: x.get('createdAt', ''), reverse=True)

        return _ok({'applications': applications[:100], 'count': len(applications[:100])})
    except Exception as e:
        print(f"[ERROR] Panchayat query failed: {str(e)}")
        return _err(500, f"Database query failed: {str(e)}")


def handle_get_all_applications(event):
    """GET /applications/all — admin view of all applications."""
    print("[DEBUG] Scanning all applications...")
    try:
        # Scan all applications for admin view. 
        # For very large tables we would use pagination, but for now scan is fine.
        resp = table.scan() 
        items = resp.get('Items', [])
        
        # Log count
        print(f"[DEBUG] Found {len(items)} applications in first scan.")
        
        # Don't iterate overly many times in a single Lambda call to avoid 29s API GW timeout
        return _ok({'applications': items, 'count': len(items)})
    except Exception as e:
        print(f"[ERROR] Scan failed: {str(e)}")
        return _err(500, f"Database scan failed: {str(e)}")


def handle_get_applications(event):
    """GET /applications/{userId} — query citizen's applications."""
    print(f"[DEBUG] event: {json.dumps(event)}")
    path_params = event.get('pathParameters') or {}
    path = event.get('path', '')
    
    user_id = path_params.get('userId', '').strip()
    
    # Robust fallback: extract from path if parameter is missing
    if not user_id and '/applications/' in path:
        user_id = path.split('/applications/')[-1].split('/')[0].strip()
        print(f"[DEBUG] Parsed user_id from path: {user_id}")

    if not user_id:
        return _err(400, 'userId path parameter is required')

    if user_id.lower() == 'all':
        return handle_get_all_applications(event)

    if user_id.startswith('panchayat-'):
        # CORS Workaround: Route panchayat queries through the existing /applications/ resource
        actual_pid = user_id.replace('panchayat-', '')
        print(f"[DEBUG] Sub-routing to panchayat applications for: {actual_pid}")
        # Inject into pathParameters so handle_get_panchayat_applications can read it
        if 'pathParameters' not in event or event['pathParameters'] is None:
            event['pathParameters'] = {}
        event['pathParameters']['panchayatId'] = actual_pid
        return handle_get_panchayat_applications(event)

    resp = table.query(
        IndexName='citizenId-createdAt-index',
        KeyConditionExpression=Key('citizenId').eq(user_id),
        ScanIndexForward=False,
        Limit=50,
    )
    return _ok({'applications': resp.get('Items', []), 'count': resp.get('Count', 0)})


def handle_patch_apply(event):
    """PATCH /apply/{applicationId} — update status."""
    path_params = event.get('pathParameters') or {}
    path = event.get('path', '')
    application_id = path_params.get('applicationId', '').strip()
    
    # Robust fallback: extract from path if parameter is missing (matches /apply/ID)
    if not application_id and '/apply/' in path:
        application_id = path.split('/apply/')[-1].split('/')[0].strip()
        print(f"[DEBUG] Parsed application_id from path: {application_id}")

    if not application_id:
        return _err(400, 'applicationId path parameter is required')

    body = _body(event)
    new_status = body.get('status', '').lower()
    if new_status not in VALID_STATUSES:
        return _err(400, f'status must be one of: {", ".join(sorted(VALID_STATUSES))}')

    now = datetime.now(timezone.utc).isoformat()
    table.update_item(
        Key={'applicationId': application_id},
        UpdateExpression='SET #s = :s, updatedAt = :u',
        ExpressionAttributeNames={'#s': 'status'},
        ExpressionAttributeValues={':s': new_status, ':u': now},
    )
    return _ok({'applicationId': application_id, 'status': new_status, 'updatedAt': now})


def _invoke_bedrock_simple(prompt, max_tokens=300):
    """Invoke Bedrock with retry for AI features."""
    payload = {
        "messages": [{"role": "user", "content": [{"text": prompt}]}],
        "inferenceConfig": {"maxTokens": max_tokens, "temperature": 0.3},
    }
    last_err = None
    for attempt in range(3):
        try:
            start_ts = time.time()
            resp = bedrock.invoke_model(
                modelId=BEDROCK_MODEL_ID,
                body=json.dumps(payload),
                contentType='application/json',
                accept='application/json',
            )
            latency_ms = int((time.time() - start_ts) * 1000)
            result = json.loads(resp['body'].read())
            content = result.get('output', {}).get('message', {}).get('content', [])
            text = content[0].get('text', '') if content else ''
            usage = result.get('usage', {})
            print(json.dumps({
                'ai_invocation': True, 'caller': 'applications',
                'model': BEDROCK_MODEL_ID,
                'inputTokens': usage.get('inputTokens', 0),
                'outputTokens': usage.get('outputTokens', 0),
                'latencyMs': latency_ms,
            }))
            return text
        except Exception as e:
            last_err = e
            if attempt < 2:
                time.sleep(2 ** attempt)
    raise last_err


def handle_explain_status(event):
    """POST /application/explain-status — AI status explanation."""
    body = _body(event)
    status = body.get('status', '').strip()
    scheme_name = body.get('schemeName', '').strip()
    created_at = body.get('createdAt', '')

    prompt = (
        f"You are a welfare application status advisor for rural India.\n"
        f"Application status: {status}\n"
        f"Scheme: {scheme_name}\n"
        f"Submitted: {created_at}\n\n"
        f"Explain in simple, reassuring language (under 80 words):\n"
        f"1. What this status means\n"
        f"2. What the citizen should do next\n"
        f"3. How long it typically takes\n"
        f"Use simple English. Be encouraging."
    )
    try:
        explanation = _invoke_bedrock_simple(prompt, max_tokens=200)
        return _ok({'explanation': explanation, 'status': status, 'aiPowered': True})
    except Exception as e:
        # Fallback to static explanations
        fallbacks = {
            'submitted': 'Your application has been submitted successfully. It is being reviewed by officials. This usually takes 2-4 weeks.',
            'pending': 'Your application is pending review. An official will review it soon. Please keep your documents ready.',
            'approved': 'Congratulations! Your application has been approved. Benefits will be credited to your bank account.',
            'rejected': 'Your application was not approved. Please check with your panchayat office for the reason and how to re-apply.',
        }
        return _ok({'explanation': fallbacks.get(status, 'Status information is currently unavailable.'), 'status': status, 'aiPowered': False})


def handle_pre_fill(event):
    """POST /application/pre-fill — AI pre-fill application form."""
    body = _body(event)
    scheme_id = body.get('schemeId', '').strip()
    citizen_profile = body.get('citizenProfile', {})
    extracted_docs = body.get('extractedDocs', {})

    # Merge profile and extracted doc data
    pre_filled = {}
    if citizen_profile.get('name'):
        pre_filled['name'] = citizen_profile['name']
    if citizen_profile.get('age'):
        pre_filled['age'] = citizen_profile['age']
    if citizen_profile.get('gender'):
        pre_filled['gender'] = citizen_profile['gender']
    if citizen_profile.get('income'):
        pre_filled['income'] = citizen_profile['income']
    if citizen_profile.get('state'):
        pre_filled['state'] = citizen_profile['state']
    if citizen_profile.get('category'):
        pre_filled['category'] = citizen_profile['category']

    # Overlay extracted document data (higher confidence)
    for doc_type, fields in extracted_docs.items():
        if isinstance(fields, dict):
            for k, v in fields.items():
                if v:
                    pre_filled[k] = v

    # Get scheme requirements
    required_docs = []
    try:
        result = schemes_table.get_item(Key={'schemeId': scheme_id})
        scheme = result.get('Item', {})
        required_docs = scheme.get('documentsRequiredEn') or scheme.get('documentsRequired') or []
    except Exception:
        pass

    return _ok({
        'preFilled': pre_filled,
        'requiredDocuments': required_docs,
        'schemeId': scheme_id,
        'completeness': round(len([v for v in pre_filled.values() if v]) / max(len(pre_filled), 1) * 100),
    })


def lambda_handler(event, context):
    try:
        method = event.get('httpMethod', '')
        path   = event.get('path', '')

        if method == 'OPTIONS':
            return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': ''}

        # AI endpoints
        if method == 'POST' and 'explain-status' in path:
            return handle_explain_status(event)

        if method == 'POST' and 'pre-fill' in path:
            return handle_pre_fill(event)

        if method == 'POST' and path == '/apply':
            return handle_post_apply(event)

        if method == 'GET' and path.startswith('/panchayat-applications/'):
            return handle_get_panchayat_applications(event)

        if method == 'GET' and path.startswith('/applications/'):
            return handle_get_applications(event)

        if (method == 'PATCH' or method == 'POST') and path.startswith('/apply/') and path != '/apply':
            return handle_patch_apply(event)

        return _err(404, f'No handler for {method} {path}')

    except Exception as e:
        print(f"[FATAL] Global error: {str(e)}")
        import traceback
        traceback.print_exc()
        return {
            'statusCode': 500,
            'headers': CORS_HEADERS,
            'body': json.dumps({'error': 'Internal server error', 'message': str(e)}),
        }
