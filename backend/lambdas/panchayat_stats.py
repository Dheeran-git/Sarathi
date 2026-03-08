"""
Panchayat Stats Lambda — upgraded for real panchayat identity.

Extracts panchayatId from:
1. JWT claims (custom:panchayatId) — for authenticated requests
2. Path parameter — fallback
3. No more hardcoded 'rampur-barabanki-up' default

Also fetches panchayat metadata from SarathiPanchayats table.
"""
import json
import os
import boto3
import time
from decimal import Decimal
from boto3.dynamodb.conditions import Key

REGION = os.environ.get('AWS_REGION', 'us-east-1')
dynamodb = boto3.resource('dynamodb', region_name=REGION)
citizens_table = dynamodb.Table('SarathiCitizens')
panchayats_table = dynamodb.Table('SarathiPanchayats')
apps_table = dynamodb.Table('SarathiApplications')
lambda_client = boto3.client('lambda', region_name=REGION)

class DecimalEncoder(json.JSONEncoder):
    def default(self, o):
        if isinstance(o, Decimal):
            return int(o) if o % 1 == 0 else float(o)
        return super().default(o)


def cors_headers():
    return {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization',
        'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
        'Content-Type': 'application/json',
    }


def get_panchayat_id(event):
    """Extract panchayatId: JWT first, then path param. No hardcoded default."""
    # 1. Try JWT claims
    claims = (event.get('requestContext', {}).get('authorizer', {}).get('claims') or {})
    
    # Priority A: Check for lgdCode
    lgd = claims.get('custom:lgdCode', '').strip()
    if lgd: return f"LGD_{lgd}"

    # Priority B: Check for panchayatId
    jwt_pid = claims.get('custom:panchayatId', '').strip()
    if jwt_pid:
        return _normalize_pid(jwt_pid)

    # 2. Try path parameter
    path_params = event.get('pathParameters') or {}
    path_pid = path_params.get('panchayatId', '').strip()
    if path_pid:
        return _normalize_pid(path_pid)

    return None


def _normalize_pid(pid):
    """Ensure panchayatId has the LGD_ prefix if it's numeric."""
    if not pid: return 'unassigned'
    p = str(pid).strip()
    if p.isdigit() and not p.startswith('LGD_'):
        return f"LGD_{p}"
    return p


def get_panchayat_meta(panchayat_id, citizens=None):
    """Fetch panchayat metadata with multiple fallbacks.
    Priority: 1) DynamoDB table, 2) Derived from citizen records, 3) Slug fallback."""
    # 1. Try DynamoDB lookups
    try:
        result = panchayats_table.get_item(Key={'panchayatId': panchayat_id})
        item = result.get('Item')
        if item:
            return {
                'panchayatName': item.get('panchayatName', 'Unknown Panchayat'),
                'district': item.get('district', 'Unknown'),
                'state': item.get('state', 'Unknown'),
                'block': item.get('block', ''),
                'lgdCode': item.get('lgdCode', ''),
            }
    except Exception as e:
        print(f"[WARN] Failed to fetch panchayat meta: {e}")

    # 2. Secondary fallback: derive from citizen location fields (if provided)
    if citizens:
        for c in citizens:
            if c.get('panchayatName'):
                return {
                    'panchayatName': c['panchayatName'],
                    'district': c.get('district', 'Unknown'),
                    'state': c.get('state', 'Unknown'),
                    'block': c.get('block', ''),
                    'lgdCode': c.get('lgdCode', ''),
                }

    # 3. Third fallback: LGD format
    if panchayat_id.startswith('LGD_'):
        return {
            'panchayatName': f'Panchayat {panchayat_id[4:]}',
            'district': 'Unknown',
            'state': 'Unknown',
            'block': '',
            'lgdCode': panchayat_id[4:],
        }
        
    # 4. Final fallback: derive from slug-based ID
    parts = panchayat_id.replace('-', ' ').split()
    return {
        'panchayatName': ' '.join(p.capitalize() for p in parts[:-2]) + ' Panchayat' if len(parts) > 2 else panchayat_id.replace('-', ' ').title(),
        'district': parts[-2].capitalize() if len(parts) >= 2 else 'Unknown',
        'state': parts[-1].upper() if len(parts) >= 1 else 'Unknown',
    }


def lambda_handler(event, context):
    try:
        panchayat_id = get_panchayat_id(event)

        if not panchayat_id:
            return {
                'statusCode': 400,
                'headers': cors_headers(),
                'body': json.dumps({'error': 'No panchayatId found. Please log in with a panchayat account.'}),
            }

        # Helper to fetch all pages for a given panchayat ID
        def fetch_citizens_for_pid(pid):
            items = []
            response = citizens_table.query(
                IndexName='panchayatId-updatedAt-index',
                KeyConditionExpression=Key('panchayatId').eq(pid),
                ScanIndexForward=False,
            )
            items.extend(response.get('Items', []))
            while 'LastEvaluatedKey' in response:
                response = citizens_table.query(
                    IndexName='panchayatId-updatedAt-index',
                    KeyConditionExpression=Key('panchayatId').eq(pid),
                    ScanIndexForward=False,
                    ExclusiveStartKey=response['LastEvaluatedKey'],
                )
                items.extend(response.get('Items', []))
            return items

        # Query citizens via GSI (Dual Query for backward compatibility)
        citizens = fetch_citizens_for_pid(panchayat_id)
        
        # If the ID has an LGD_ prefix, also try finding the legacy bare number
        legacy_pid = panchayat_id.replace('LGD_', '') if panchayat_id.startswith('LGD_') else None
        if legacy_pid and legacy_pid != panchayat_id and legacy_pid.isdigit():
            legacy_citizens = fetch_citizens_for_pid(legacy_pid)
            
            # Combine them, ensuring no duplication by citizenId
            seen_ids = {c.get('citizenId') for c in citizens if c.get('citizenId')}
            for lc in legacy_citizens:
                cid = lc.get('citizenId')
                if cid and cid not in seen_ids:
                    citizens.append(lc)
                    seen_ids.add(cid)

        # Build citizen map for name lookups
        citizen_map = {c['citizenId']: c.get('name', 'Unknown Citizen') for c in citizens if 'citizenId' in c}
        citizen_ids = list(citizen_map.keys())

        # FETCH APPLICATIONS FOR ALL IDENTIFIED CITIZENS
        # This ensures we get all applications from "our" citizens even if they tagged with a different GP ID
        applications = []
        app_ids_seen = set()

        def fetch_apps_for_citizen(cid):
            try:
                resp = apps_table.query(
                    IndexName='citizenId-createdAt-index',
                    KeyConditionExpression=Key('citizenId').eq(cid),
                    ScanIndexForward=False,
                    Limit=20
                )
                return resp.get('Items', [])
            except Exception as e:
                print(f"[WARN] Failed to fetch apps for citizen {cid}: {e}")
                return []

        # For performance in a demo, we'll fetch apps for the first 100 citizens
        # In a real system, we'd use a more efficient way or a proper search index
        for cid in citizen_ids[:100]:
            citizen_apps = fetch_apps_for_citizen(cid)
            for app in citizen_apps:
                aid = app.get('applicationId')
                if aid and aid not in app_ids_seen:
                    # Inject citizen name since we have it
                    app['citizenName'] = citizen_map.get(cid)
                    applications.append(app)
                    app_ids_seen.add(aid)

        # Also fetch by panchayat_id directly as a fallback for citizens not in our registry
        def fetch_apps_by_pid(pid):
            try:
                resp = apps_table.query(
                    IndexName='panchayatId-createdAt-index',
                    KeyConditionExpression=Key('panchayatId').eq(pid),
                    ScanIndexForward=False,
                    Limit=50
                )
                return resp.get('Items', [])
            except:
                return []

        extra_apps = fetch_apps_by_pid(panchayat_id)
        if legacy_pid:
            extra_apps.extend(fetch_apps_by_pid(legacy_pid))

        for app in extra_apps:
            aid = app.get('applicationId')
            cid = app.get('citizenId')
            if aid and aid not in app_ids_seen:
                # If citizen is in our map, use that name
                if cid in citizen_map:
                    app['citizenName'] = citizen_map.get(cid)
                else:
                    # Fallback to name in personalDetails or generic
                    app['citizenName'] = app.get('personalDetails', {}).get('name', 'Resident')
                
                applications.append(app)
                app_ids_seen.add(aid)

        # Sort all combined applications
        applications.sort(key=lambda x: x.get('createdAt', ''), reverse=True)
        applications = applications[:100]

        # Count by status
        enrolled = [c for c in citizens if c.get('status') == 'enrolled']
        eligible = [c for c in citizens if c.get('status') == 'eligible']
        zero = [c for c in citizens if c.get('status') == 'none']

        total = len(citizens)
        enrolled_count = len(enrolled)
        eligible_count = len(eligible)

        # Compute performance score (0-100)
        receiving_pct = round((enrolled_count / total) * 100) if total > 0 else 0
        performance_score = min(100, receiving_pct + (10 if total > 5 else 0))

        # Compute welfare gap (estimated ₹ value)
        avg_benefit = 15000  # ₹15,000 average annual benefit per scheme
        welfare_gap = eligible_count * avg_benefit

        # Build dynamic alerts
        alerts = []
        widows_unserved = [c for c in eligible if str(c.get('isWidow')).lower() in (True, 'true', 'yes', '1')]
        if widows_unserved:
            alerts.append({
                'type': 'widow_pension', 'urgency': 'high',
                'count': len(widows_unserved),
                'title': f'{len(widows_unserved)} widows eligible for pension but not enrolled',
                'description': f'{len(widows_unserved)} widows eligible for pension but not enrolled',
            })

        elderly_unserved = [c for c in eligible if int(c.get('age', 0)) >= 60]
        if elderly_unserved:
            alerts.append({
                'type': 'old_age_pension', 'urgency': 'high',
                'count': len(elderly_unserved),
                'title': f'{len(elderly_unserved)} elderly citizens missing old age pension',
                'description': f'{len(elderly_unserved)} elderly citizens missing old age pension',
            })

        meta = get_panchayat_meta(panchayat_id, citizens=citizens)

        # Invisible Citizen Detection: households with zero benefits despite eligibility
        invisible_citizens = []
        for c in citizens:
            matched = c.get('matchedSchemes', []) or []
            enrolled_schemes = c.get('enrolledSchemes', []) or []
            status = c.get('status', '')
            # A citizen is "invisible" if they have matched schemes but zero enrolled + not actively enrolled
            if len(matched) > 0 and len(enrolled_schemes) == 0 and status != 'enrolled':
                vulnerability_score = 0
                # Higher score = more vulnerable = higher priority
                c_age = int(c.get('age', 0) or 0)
                c_income = int(c.get('income', 0) or c.get('monthlyIncome', 0) or 0)
                if c_age >= 60:
                    vulnerability_score += 30
                if c_age < 6:
                    vulnerability_score += 25
                if str(c.get('isWidow', '')).lower() in ('true', '1', 'yes'):
                    vulnerability_score += 25
                if str(c.get('disability', '')).lower() in ('true', '1', 'yes'):
                    vulnerability_score += 20
                if c_income > 0 and c_income < 3000:
                    vulnerability_score += 15
                elif c_income == 0:
                    vulnerability_score += 10
                cat = str(c.get('category', '')).upper()
                if cat in ('SC', 'ST'):
                    vulnerability_score += 10
                # More matched schemes = more missed opportunity
                vulnerability_score += min(20, len(matched) * 4)
                # Estimated lost benefit
                lost_benefit = sum(int(s.get('annualBenefit', 0) or 0) for s in matched)

                invisible_citizens.append({
                    'citizenId': c.get('citizenId', ''),
                    'name': c.get('name', 'Unknown'),
                    'age': c_age,
                    'gender': c.get('gender', ''),
                    'category': c.get('category', ''),
                    'ward': c.get('ward', ''),
                    'isWidow': str(c.get('isWidow', '')).lower() in ('true', '1', 'yes'),
                    'disability': str(c.get('disability', '')).lower() in ('true', '1', 'yes'),
                    'income': c_income,
                    'matchedSchemesCount': len(matched),
                    'matchedSchemeNames': [s.get('nameEnglish', s.get('schemeId', '')) for s in matched[:5]],
                    'lostAnnualBenefit': lost_benefit,
                    'vulnerabilityScore': vulnerability_score,
                })

        # Sort by vulnerability score descending
        invisible_citizens.sort(key=lambda x: x['vulnerabilityScore'], reverse=True)

        # Fetch AI insights — invoke insights_generator synchronously (10s timeout)
        ai_insights = []
        try:
            insights_payload = {
                'httpMethod': 'GET',
                'pathParameters': {'panchayatId': panchayat_id},
            }
            insights_resp = lambda_client.invoke(
                FunctionName='sarathi-insights-generator',
                InvocationType='RequestResponse',
                Payload=json.dumps(insights_payload),
            )
            insights_body = json.loads(insights_resp['Payload'].read())
            if isinstance(insights_body.get('body'), str):
                insights_data = json.loads(insights_body['body'])
            else:
                insights_data = insights_body
            ai_insights = insights_data.get('insights', [])
        except Exception as insights_err:
            print(f"[WARN] Insights generator failed (non-fatal): {insights_err}")

        return {
            'statusCode': 200,
            'headers': cors_headers(),
            'body': json.dumps({
                'panchayatId': panchayat_id,
                'panchayatName': meta['panchayatName'],
                'district': meta['district'],
                'state': meta['state'],
                'block': meta.get('block', ''),
                'lgdCode': meta.get('lgdCode', ''),
                'totalHouseholds': total,
                'enrolled': enrolled_count,
                'eligibleNotEnrolled': eligible_count,
                'zeroBenefits': len(zero),
                'receivingPercent': receiving_pct,
                'performanceScore': performance_score,
                'welfareGapAmount': welfare_gap,
                'households': citizens,
                'applications': applications,
                'alerts': alerts,
                'insights': ai_insights,
                'invisibleCitizens': invisible_citizens[:50],
                'invisibleCitizensCount': len(invisible_citizens),
                'totalLostBenefit': sum(ic['lostAnnualBenefit'] for ic in invisible_citizens),
            }, cls=DecimalEncoder),
        }

    except Exception as e:
        print(f"[ERROR] {e}")
        return {
            'statusCode': 500,
            'headers': cors_headers(),
            'body': json.dumps({'error': 'Internal server error', 'message': str(e)}),
        }
