"""
insights_generator — Multi-trigger Lambda
Trigger 1: EventBridge 'sarathi-weekly-insights' — generates AI insights for all panchayats
Trigger 2: GET /panchayat/{panchayatId}/insights — on-demand single panchayat
Trigger 3: POST /panchayat/{panchayatId}/generate-campaign — AI campaign content
Trigger 4: POST /panchayat/{panchayatId}/generate-report — AI performance report

Uses Amazon Nova Pro via Bedrock to generate 3-5 actionable priority insights.
Stores results in SarathiPanchayatInsights with 90-day TTL.
Includes retry/backoff, input sanitization, and AI invocation logging.
"""
import json
import os
import re
import time
import boto3
from datetime import datetime, timedelta, timezone
from decimal import Decimal
from boto3.dynamodb.conditions import Key

REGION = 'us-east-1'
BEDROCK_MODEL_ID = os.environ.get('BEDROCK_MODEL_ID', 'amazon.nova-pro-v1:0')
BEDROCK_GUARDRAIL_ID = os.environ.get('BEDROCK_GUARDRAIL_ID', '')
BEDROCK_GUARDRAIL_VERSION = os.environ.get('BEDROCK_GUARDRAIL_VERSION', '1')

bedrock = boto3.client('bedrock-runtime', region_name=REGION)
dynamodb = boto3.resource('dynamodb', region_name=REGION)
insights_table = dynamodb.Table('SarathiPanchayatInsights')
citizens_table = dynamodb.Table('SarathiCitizens')
panchayats_table = dynamodb.Table('SarathiPanchayats')

# Prompt injection patterns
_INJECTION_PATTERNS = [
    r'ignore\s+(all\s+)?previous\s+instructions',
    r'you\s+are\s+now\s+a',
    r'system\s*:\s*',
    r'OVERRIDE\s+SYSTEM',
    r'forget\s+(all\s+)?instructions',
]
_INJECTION_RE = re.compile('|'.join(_INJECTION_PATTERNS), re.IGNORECASE)

def _sanitize(text):
    if not text:
        return text
    return _INJECTION_RE.sub('[FILTERED]', text)


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


def _get_panchayat_stats(panchayat_id):
    """Fetch citizen stats for a panchayat via GSI query."""
    try:
        response = citizens_table.query(
            IndexName='panchayatId-updatedAt-index',
            KeyConditionExpression=Key('panchayatId').eq(panchayat_id),
        )
        citizens = response.get('Items', [])
        while 'LastEvaluatedKey' in response:
            response = citizens_table.query(
                IndexName='panchayatId-updatedAt-index',
                KeyConditionExpression=Key('panchayatId').eq(panchayat_id),
                ExclusiveStartKey=response['LastEvaluatedKey'],
            )
            citizens.extend(response.get('Items', []))

        total = len(citizens)
        enrolled = sum(1 for c in citizens if c.get('status') == 'enrolled')
        eligible_not = sum(1 for c in citizens if c.get('status') == 'eligible')
        zero = sum(1 for c in citizens if c.get('status') == 'none')
        receiving_pct = round((enrolled / total) * 100) if total > 0 else 0
        welfare_gap_pct = 100 - receiving_pct

        return {
            'total': total,
            'enrolled': enrolled,
            'eligibleNotEnrolled': eligible_not,
            'zeroBenefits': zero,
            'receivingPercent': receiving_pct,
            'welfareGapPercent': welfare_gap_pct,
        }
    except Exception as e:
        print(f"[WARN] Failed to get stats for {panchayat_id}: {e}")
        return {'total': 0, 'enrolled': 0, 'eligibleNotEnrolled': 0, 'zeroBenefits': 0,
                'receivingPercent': 0, 'welfareGapPercent': 100}


def _invoke_bedrock_with_retry(prompt, caller='insights', max_tokens=600, temperature=0.4):
    """Call Bedrock with retry/backoff, logging, and sanitization."""
    prompt = _sanitize(prompt)
    payload = {
        "messages": [{"role": "user", "content": [{"text": prompt}]}],
        "inferenceConfig": {"maxTokens": max_tokens, "temperature": temperature},
    }
    kwargs = dict(
        modelId=BEDROCK_MODEL_ID,
        body=json.dumps(payload),
        contentType='application/json',
        accept='application/json',
    )
    if BEDROCK_GUARDRAIL_ID:
        kwargs['guardrailIdentifier'] = BEDROCK_GUARDRAIL_ID
        kwargs['guardrailVersion'] = BEDROCK_GUARDRAIL_VERSION

    last_err = None
    for attempt in range(3):
        try:
            start_ts = time.time()
            resp = bedrock.invoke_model(**kwargs)
            latency_ms = int((time.time() - start_ts) * 1000)
            result = json.loads(resp['body'].read())
            content = result.get('output', {}).get('message', {}).get('content', [])
            raw_text = content[0].get('text', '') if content else ''
            usage = result.get('usage', {})
            print(json.dumps({
                'ai_invocation': True,
                'caller': caller,
                'model': BEDROCK_MODEL_ID,
                'inputTokens': usage.get('inputTokens', 0),
                'outputTokens': usage.get('outputTokens', 0),
                'latencyMs': latency_ms,
                'attempt': attempt + 1,
            }))
            return raw_text
        except Exception as e:
            last_err = e
            if attempt < 2:
                time.sleep(2 ** attempt)
                print(f"[WARN] Bedrock retry {attempt + 1}/3 ({caller}): {e}")
    raise last_err


def _generate_insights_bedrock(panchayat_name, stats):
    """Call Nova Pro to generate actionable insights."""
    prompt = (
        f"You are a welfare analytics expert advising the panchayat secretary of {panchayat_name}.\n\n"
        f"Current statistics:\n"
        f"- Total households: {stats['total']}\n"
        f"- Enrolled in schemes: {stats['enrolled']} ({stats['receivingPercent']}%)\n"
        f"- Eligible but not enrolled: {stats['eligibleNotEnrolled']}\n"
        f"- Receiving zero benefits: {stats['zeroBenefits']}\n"
        f"- Welfare gap: {stats['welfareGapPercent']}%\n\n"
        f"Generate exactly 3-5 specific, actionable priority actions for this week. "
        f"Each action must follow this exact format on a new line:\n"
        f"PRIORITY N: [Title] — [Specific action step] — Impact: [Expected outcome]\n\n"
        f"Focus on the most critical welfare gaps. Be concrete and specific to Indian rural welfare schemes "
        f"(PM-KISAN, PMAY, Ayushman, MGNREGS, old age pension, widow pension)."
    )
    return _invoke_bedrock_with_retry(prompt, caller='insights')


def _parse_insights(raw_text, stats):
    """Parse PRIORITY N: [Title] — [Step] — Impact: [Impact] format."""
    insights = []
    lines = raw_text.strip().split('\n')

    for line in lines:
        line = line.strip()
        if not line.startswith('PRIORITY'):
            continue
        try:
            # Remove "PRIORITY N: " prefix
            rest = line.split(':', 1)[1].strip() if ':' in line else line
            parts = rest.split('—')
            if len(parts) >= 2:
                title = parts[0].strip()
                action = parts[1].strip()
                impact = parts[2].replace('Impact:', '').strip() if len(parts) >= 3 else ''

                # Determine severity from priority number
                priority_num = 1
                import re
                m = re.search(r'PRIORITY\s+(\d+)', line)
                if m:
                    priority_num = int(m.group(1))

                severity = 'high' if priority_num <= 2 else ('medium' if priority_num == 3 else 'low')

                # Determine action type
                action_type = 'notify'
                if 'visit' in action.lower() or 'view' in action.lower():
                    action_type = 'view'
                elif 'camp' in action.lower() or 'drive' in action.lower():
                    action_type = 'analyze'

                insights.append({
                    'severity': severity,
                    'title': title,
                    'text': f"{action} {impact}".strip(),
                    'actionText': 'Send Notification' if action_type == 'notify' else 'View Citizens',
                    'actionType': action_type,
                })
        except Exception:
            continue

    # Fallback if parsing fails
    if not insights:
        if stats.get('zeroBenefits', 0) > 5:
            insights.append({
                'severity': 'high',
                'text': f"{stats['zeroBenefits']} households receiving zero benefits. Immediate outreach required.",
                'actionText': 'View Citizens', 'actionType': 'view',
            })
        if stats.get('welfareGapPercent', 0) > 50:
            insights.append({
                'severity': 'medium',
                'text': f"Welfare gap is {stats['welfareGapPercent']}%. Consider organizing a registration camp.",
                'actionText': 'Send Notification', 'actionType': 'notify',
            })
        if not insights:
            insights.append({
                'severity': 'low',
                'text': 'Enrollment is stable. Continue regular KYC validation for existing beneficiaries.',
                'actionText': 'Run Analysis', 'actionType': 'analyze',
            })

    return insights


def _generate_for_panchayat(panchayat_id, panchayat_name='Unknown Panchayat'):
    """Generate and store insights for a single panchayat."""
    stats = _get_panchayat_stats(panchayat_id)
    raw_text = _generate_insights_bedrock(panchayat_name, stats)
    insights = _parse_insights(raw_text, stats)

    generated_at = datetime.now(timezone.utc).isoformat()
    expires_at = int((datetime.now(timezone.utc) + timedelta(days=90)).timestamp())

    insights_table.put_item(Item={
        'panchayatId': panchayat_id,
        'generatedAt': generated_at,
        'insights': insights,
        'stats': stats,
        'expiresAt': expires_at,
    })

    return insights


def _generate_campaign_content(panchayat_name, stats, target_group='', message_theme=''):
    """Generate AI campaign content for panchayat outreach."""
    prompt = (
        f"You are a welfare outreach campaign designer for {panchayat_name} panchayat.\n\n"
        f"Current statistics:\n"
        f"- Total households: {stats['total']}\n"
        f"- Eligible but not enrolled: {stats['eligibleNotEnrolled']}\n"
        f"- Receiving zero benefits: {stats['zeroBenefits']}\n"
        f"- Welfare gap: {stats['welfareGapPercent']}%\n\n"
        f"Target group: {target_group or 'all eligible citizens'}\n"
        f"Campaign theme: {message_theme or 'welfare enrollment drive'}\n\n"
        f"Generate a campaign plan with:\n"
        f"1. CAMPAIGN_TITLE: A catchy title for the campaign\n"
        f"2. TARGET_MESSAGE: A persuasive SMS/WhatsApp message (under 160 chars) in simple Hindi+English\n"
        f"3. SCHEDULE: Suggested 3-day activity schedule\n"
        f"4. TALKING_POINTS: 3-4 key points for field workers to communicate\n"
        f"5. EXPECTED_IMPACT: Estimated reach and enrollment improvement\n\n"
        f"Be specific to Indian rural welfare context. Use simple language."
    )
    return _invoke_bedrock_with_retry(prompt, caller='campaign_generator', max_tokens=800)


def _generate_performance_report(panchayat_name, stats, grievance_count=0, app_count=0):
    """Generate AI narrative performance report."""
    prompt = (
        f"You are a government welfare performance analyst. Generate a monthly performance report "
        f"for {panchayat_name} panchayat.\n\n"
        f"Statistics:\n"
        f"- Total households: {stats['total']}\n"
        f"- Enrolled: {stats['enrolled']} ({stats['receivingPercent']}%)\n"
        f"- Eligible unenrolled: {stats['eligibleNotEnrolled']}\n"
        f"- Zero benefits: {stats['zeroBenefits']}\n"
        f"- Welfare gap: {stats['welfareGapPercent']}%\n"
        f"- Grievances filed: {grievance_count}\n"
        f"- Applications submitted: {app_count}\n\n"
        f"Generate a structured report with:\n"
        f"1. EXECUTIVE_SUMMARY: 2-3 sentence overview\n"
        f"2. PERFORMANCE_GRADE: A/B/C/D/F with justification\n"
        f"3. KEY_ACHIEVEMENTS: 2-3 positive highlights\n"
        f"4. AREAS_OF_CONCERN: 2-3 critical gaps\n"
        f"5. RECOMMENDATIONS: 3-4 actionable next steps\n"
        f"6. RISK_FLAGS: Any urgent issues needing attention\n\n"
        f"Be specific and data-driven. Reference actual Indian welfare schemes."
    )
    return _invoke_bedrock_with_retry(prompt, caller='performance_report', max_tokens=1000)


def _generate_grievance_analysis(grievance_text, category=''):
    """AI classify grievance severity and draft response."""
    prompt = (
        f"You are a welfare grievance officer. Analyze this citizen grievance:\n\n"
        f"Category: {category or 'General'}\n"
        f"Grievance: {grievance_text}\n\n"
        f"Provide:\n"
        f"1. SEVERITY: critical/high/medium/low\n"
        f"2. CATEGORY: benefit_not_received/application_stuck/document_issue/eligibility_dispute/other\n"
        f"3. DRAFT_RESPONSE: A compassionate, actionable response to the citizen (under 100 words)\n"
        f"4. INTERNAL_NOTES: Action items for the panchayat official\n"
        f"5. ESCALATION_NEEDED: yes/no with reason\n\n"
        f"Be empathetic and specific. Use simple language the citizen can understand."
    )
    return _invoke_bedrock_with_retry(prompt, caller='grievance_classifier', max_tokens=500)


def _generate_admin_spotlight(all_panchayat_stats):
    """AI spotlight: identify at-risk panchayats and trends."""
    stats_summary = "\n".join(
        f"- {p['name']}: gap={p['gapPct']}%, zero-benefit={p.get('zeroBenefits', 0)}, enrolled={p.get('enrolled', 0)}/{p.get('total', 0)}"
        for p in all_panchayat_stats[:20]
    )
    prompt = (
        f"You are a district welfare administrator. Analyze these panchayat statistics:\n\n"
        f"{stats_summary}\n\n"
        f"Identify:\n"
        f"1. TOP_3_AT_RISK: The 3 most at-risk panchayats with specific reasons\n"
        f"2. TREND_ANALYSIS: Overall welfare delivery trend\n"
        f"3. URGENT_ACTIONS: 2-3 immediate interventions needed\n"
        f"4. SUCCESS_STORIES: Any panchayat performing well and why\n\n"
        f"Be data-driven and actionable."
    )
    return _invoke_bedrock_with_retry(prompt, caller='admin_spotlight', max_tokens=600)


def lambda_handler(event, context):
    method = event.get('httpMethod', '')
    path = event.get('path', '') or event.get('resource', '')

    # POST /panchayat/{panchayatId}/generate-campaign
    if method == 'POST' and 'generate-campaign' in path:
        try:
            path_params = event.get('pathParameters') or {}
            panchayat_id = path_params.get('panchayatId', '').strip()
            if not panchayat_id:
                return {'statusCode': 400, 'headers': cors_headers(), 'body': json.dumps({'error': 'panchayatId is required'})}
            body = json.loads(event.get('body', '{}')) if isinstance(event.get('body'), str) else event
            stats = _get_panchayat_stats(panchayat_id)
            panchayat_name = panchayat_id
            try:
                p = panchayats_table.get_item(Key={'panchayatId': panchayat_id}).get('Item', {})
                panchayat_name = p.get('panchayatName', panchayat_id)
            except Exception:
                pass
            campaign = _generate_campaign_content(
                panchayat_name, stats,
                target_group=body.get('targetGroup', ''),
                message_theme=body.get('messageTheme', ''),
            )
            return {'statusCode': 200, 'headers': cors_headers(), 'body': json.dumps({
                'panchayatId': panchayat_id, 'campaign': campaign, 'stats': stats,
            }, cls=DecimalEncoder)}
        except Exception as e:
            return {'statusCode': 500, 'headers': cors_headers(), 'body': json.dumps({'error': str(e)})}

    # POST /panchayat/{panchayatId}/generate-report
    if method == 'POST' and 'generate-report' in path:
        try:
            path_params = event.get('pathParameters') or {}
            panchayat_id = path_params.get('panchayatId', '').strip()
            if not panchayat_id:
                return {'statusCode': 400, 'headers': cors_headers(), 'body': json.dumps({'error': 'panchayatId is required'})}
            body = json.loads(event.get('body', '{}')) if isinstance(event.get('body'), str) else event
            stats = _get_panchayat_stats(panchayat_id)
            panchayat_name = panchayat_id
            try:
                p = panchayats_table.get_item(Key={'panchayatId': panchayat_id}).get('Item', {})
                panchayat_name = p.get('panchayatName', panchayat_id)
            except Exception:
                pass
            report = _generate_performance_report(
                panchayat_name, stats,
                grievance_count=int(body.get('grievanceCount', 0)),
                app_count=int(body.get('applicationCount', 0)),
            )
            return {'statusCode': 200, 'headers': cors_headers(), 'body': json.dumps({
                'panchayatId': panchayat_id, 'report': report, 'stats': stats,
            }, cls=DecimalEncoder)}
        except Exception as e:
            return {'statusCode': 500, 'headers': cors_headers(), 'body': json.dumps({'error': str(e)})}

    # POST /grievance/analyze
    if method == 'POST' and 'grievance' in path and 'analyze' in path:
        try:
            body = json.loads(event.get('body', '{}')) if isinstance(event.get('body'), str) else event
            text = body.get('grievanceText', '').strip()
            if not text:
                return {'statusCode': 400, 'headers': cors_headers(), 'body': json.dumps({'error': 'grievanceText is required'})}
            analysis = _generate_grievance_analysis(text, category=body.get('category', ''))
            return {'statusCode': 200, 'headers': cors_headers(), 'body': json.dumps({'analysis': analysis})}
        except Exception as e:
            return {'statusCode': 500, 'headers': cors_headers(), 'body': json.dumps({'error': str(e)})}

    # POST /admin/spotlight
    if method == 'POST' and 'spotlight' in path:
        try:
            body = json.loads(event.get('body', '{}')) if isinstance(event.get('body'), str) else event
            panchayat_stats_list = body.get('panchayatStats', [])
            if not panchayat_stats_list:
                # Fetch from DB
                response = panchayats_table.scan(ProjectionExpression='panchayatId,panchayatName,totalHouseholds,enrolled')
                items = response.get('Items', [])
                for p in items:
                    total = int(p.get('totalHouseholds', 0) or 0)
                    enrolled = int(p.get('enrolled', 0) or 0)
                    gap = round(100 - (enrolled / total * 100)) if total > 0 else 100
                    panchayat_stats_list.append({
                        'name': p.get('panchayatName', p.get('panchayatId', '')),
                        'gapPct': gap, 'total': total, 'enrolled': enrolled,
                        'zeroBenefits': int(p.get('zeroBenefits', 0) or 0),
                    })
            spotlight = _generate_admin_spotlight(panchayat_stats_list)
            return {'statusCode': 200, 'headers': cors_headers(), 'body': json.dumps({'spotlight': spotlight})}
        except Exception as e:
            return {'statusCode': 500, 'headers': cors_headers(), 'body': json.dumps({'error': str(e)})}

    # HTTP GET /panchayat/{panchayatId}/insights (on-demand)
    if method == 'GET' or event.get('requestContext'):
        path_params = event.get('pathParameters') or {}
        panchayat_id = path_params.get('panchayatId', '').strip()

        if not panchayat_id:
            return {
                'statusCode': 400,
                'headers': cors_headers(),
                'body': json.dumps({'error': 'panchayatId is required'}),
            }

        try:
            # Check if recent insights exist (< 1 hour old)
            result = insights_table.query(
                KeyConditionExpression=Key('panchayatId').eq(panchayat_id),
                ScanIndexForward=False,
                Limit=1,
            )
            items = result.get('Items', [])
            if items:
                generated_at = items[0].get('generatedAt', '')
                if generated_at:
                    age_minutes = (datetime.now(timezone.utc) - datetime.fromisoformat(generated_at)).total_seconds() / 60
                    if age_minutes < 60:
                        return {
                            'statusCode': 200,
                            'headers': cors_headers(),
                            'body': json.dumps({
                                'panchayatId': panchayat_id,
                                'insights': items[0].get('insights', []),
                                'generatedAt': generated_at,
                                'cached': True,
                            }, cls=DecimalEncoder),
                        }

            # Try to get panchayat name
            panchayat_name = panchayat_id
            try:
                p = panchayats_table.get_item(Key={'panchayatId': panchayat_id}).get('Item', {})
                panchayat_name = p.get('panchayatName', panchayat_id)
            except Exception:
                pass

            insights = _generate_for_panchayat(panchayat_id, panchayat_name)

            return {
                'statusCode': 200,
                'headers': cors_headers(),
                'body': json.dumps({
                    'panchayatId': panchayat_id,
                    'insights': insights,
                    'generatedAt': datetime.now(timezone.utc).isoformat(),
                    'cached': False,
                }, cls=DecimalEncoder),
            }

        except Exception as e:
            return {
                'statusCode': 500,
                'headers': cors_headers(),
                'body': json.dumps({'error': str(e)}),
            }

    # EventBridge scheduled trigger — weekly insights for all panchayats
    try:
        response = panchayats_table.scan(ProjectionExpression='panchayatId,panchayatName')
        panchayats = response.get('Items', [])
        while 'LastEvaluatedKey' in response:
            response = panchayats_table.scan(
                ProjectionExpression='panchayatId,panchayatName',
                ExclusiveStartKey=response['LastEvaluatedKey'],
            )
            panchayats.extend(response.get('Items', []))

        generated_count = 0
        for p in panchayats:
            pid = p.get('panchayatId', '')
            pname = p.get('panchayatName', pid)
            if pid:
                try:
                    _generate_for_panchayat(pid, pname)
                    generated_count += 1
                except Exception as e:
                    print(f"[WARN] Failed for {pid}: {e}")

        return {'statusCode': 200, 'body': f'Generated insights for {generated_count} panchayats'}

    except Exception as e:
        return {'statusCode': 500, 'body': f'Error: {str(e)}'}
