"""
insights_generator — Multi-trigger Lambda
Trigger 1: EventBridge 'sarathi-weekly-insights' — generates AI insights for all panchayats
Trigger 2: GET /panchayat/{panchayatId}/insights — on-demand single panchayat

Uses Amazon Nova Pro via Bedrock to generate 3-5 actionable priority insights.
Stores results in SarathiPanchayatInsights with 90-day TTL.
"""
import json
import os
import boto3
from datetime import datetime, timedelta, timezone
from decimal import Decimal
from boto3.dynamodb.conditions import Key

REGION = 'us-east-1'
BEDROCK_MODEL_ID = os.environ.get('BEDROCK_MODEL_ID', 'amazon.nova-pro-v1:0')
BEDROCK_GUARDRAIL_ID = os.environ.get('BEDROCK_GUARDRAIL_ID', '')
BEDROCK_GUARDRAIL_VERSION = os.environ.get('BEDROCK_GUARDRAIL_VERSION', 'DRAFT')

bedrock = boto3.client('bedrock-runtime', region_name=REGION)
dynamodb = boto3.resource('dynamodb', region_name=REGION)
insights_table = dynamodb.Table('SarathiPanchayatInsights')
citizens_table = dynamodb.Table('SarathiCitizens')
panchayats_table = dynamodb.Table('SarathiPanchayats')


class DecimalEncoder(json.JSONEncoder):
    def default(self, o):
        if isinstance(o, Decimal):
            return int(o) if o % 1 == 0 else float(o)
        return super().default(o)


def cors_headers():
    return {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization',
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

    payload = {
        "messages": [{"role": "user", "content": [{"text": prompt}]}],
        "inferenceConfig": {"maxTokens": 600, "temperature": 0.4},
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

    resp = bedrock.invoke_model(**kwargs)
    result = json.loads(resp['body'].read())
    content = result.get('output', {}).get('message', {}).get('content', [])
    raw_text = content[0].get('text', '') if content else ''
    return raw_text


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


def lambda_handler(event, context):
    # HTTP GET /panchayat/{panchayatId}/insights (on-demand)
    if event.get('httpMethod') == 'GET' or event.get('requestContext'):
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
