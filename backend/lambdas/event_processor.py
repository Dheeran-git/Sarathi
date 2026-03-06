"""
event_processor — Multi-trigger Lambda
Trigger 1: DynamoDB Streams (SarathiCitizens) — re-run eligibility on profile changes,
           diff old vs new matched schemes, SNS alert for new matches.
Trigger 2: EventBridge 'daily_gap_scan' — scan panchayats for welfare gap > 50%
Trigger 3: EventBridge 'monthly_performance_update' — recalculate performance scores
"""
import json
import os
import boto3
from decimal import Decimal
from boto3.dynamodb.conditions import Key

REGION = 'us-east-1'
SNS_TOPIC_ARN = os.environ.get('SNS_TOPIC_ARN', 'arn:aws:sns:us-east-1:056048976827:SarathiPanchayatAlerts')

dynamodb = boto3.resource('dynamodb', region_name=REGION)
citizens_table = dynamodb.Table('SarathiCitizens')
panchayats_table = dynamodb.Table('SarathiPanchayats')
sns = boto3.client('sns', region_name=REGION)

# Load local schemes for eligibility re-check
_SCHEMES_PATH = os.path.join(os.path.dirname(__file__), 'schemes.json')
try:
    with open(_SCHEMES_PATH, 'r', encoding='utf-8') as _f:
        LOCAL_SCHEMES = json.load(_f)
except FileNotFoundError:
    LOCAL_SCHEMES = []

# Fields that affect eligibility
ELIGIBILITY_FIELDS = {'age', 'income', 'monthlyIncome', 'category', 'gender', 'state',
                       'occupation', 'persona', 'isWidow', 'disability', 'pregnant'}


class DecimalEncoder(json.JSONEncoder):
    def default(self, o):
        if isinstance(o, Decimal):
            return int(o) if o % 1 == 0 else float(o)
        return super().default(o)


def _to_bool(value):
    if isinstance(value, bool):
        return value
    if isinstance(value, str):
        return value.lower() in ('true', '1', 'yes')
    return bool(value)


def is_eligible(profile, scheme):
    age = int(profile.get('age', 0) or 0)
    monthly_income = int(profile.get('income', 0) or profile.get('monthlyIncome', 0) or 0)
    min_age = int(scheme.get('minAge', 0) or 0)
    max_age = int(scheme.get('maxAge', 99) or 99)
    if age < min_age or age > max_age:
        return False
    max_monthly = int(scheme.get('maxMonthlyIncome', 999999) or 999999)
    if monthly_income > max_monthly:
        return False
    scheme_gender = (scheme.get('gender') or 'any').lower().strip()
    if scheme_gender != 'any':
        profile_gender = (profile.get('gender') or 'any').lower().strip()
        if profile_gender != 'any' and profile_gender != scheme_gender:
            return False
    scheme_occ = (scheme.get('occupation') or 'any').lower().strip()
    if scheme_occ != 'any':
        profile_occ = (profile.get('occupation') or '').lower().strip()
        profile_persona = (profile.get('persona') or '').lower().strip()
        if profile_occ != scheme_occ and profile_persona != scheme_occ:
            return False
    raw_cats = scheme.get('categories', 'SC,ST,OBC,General') or 'SC,ST,OBC,General'
    scheme_cats = [c.strip() for c in raw_cats.split(',')]
    profile_cat = (profile.get('category') or 'General').strip()
    if profile_cat not in scheme_cats:
        return False
    scheme_widow = (scheme.get('isWidow') or 'any').lower().strip()
    if scheme_widow == 'true':
        if not _to_bool(profile.get('isWidow', False)):
            return False
    return True


def _deserialize_dynamodb(obj):
    """Convert DynamoDB image dict to plain dict."""
    if isinstance(obj, dict):
        if 'S' in obj:
            return obj['S']
        if 'N' in obj:
            val = obj['N']
            return int(val) if '.' not in val else float(val)
        if 'BOOL' in obj:
            return obj['BOOL']
        if 'NULL' in obj:
            return None
        if 'L' in obj:
            return [_deserialize_dynamodb(i) for i in obj['L']]
        if 'M' in obj:
            return {k: _deserialize_dynamodb(v) for k, v in obj['M'].items()}
        return {k: _deserialize_dynamodb(v) for k, v in obj.items()}
    return obj


def _handle_stream(record):
    """Process a single DynamoDB stream record."""
    event_name = record.get('eventName', '')
    if event_name not in ('MODIFY', 'INSERT'):
        return

    new_image = record.get('dynamodb', {}).get('NewImage', {})
    old_image = record.get('dynamodb', {}).get('OldImage', {})

    new_item = _deserialize_dynamodb(new_image)
    old_item = _deserialize_dynamodb(old_image)

    # Check if any eligibility-relevant field changed
    changed = False
    for field in ELIGIBILITY_FIELDS:
        if str(new_item.get(field)) != str(old_item.get(field)):
            changed = True
            break

    if not changed:
        return

    citizen_id = new_item.get('citizenId', '')
    panchayat_id = new_item.get('panchayatId', '')
    citizen_name = new_item.get('name', 'Citizen')

    # Re-run eligibility
    new_matched = [s for s in LOCAL_SCHEMES if is_eligible(new_item, s)]
    old_matched_ids = set(
        s.get('schemeId', '') for s in (old_item.get('matchedSchemes') or [])
    )
    new_matched_ids = {s.get('schemeId', '') for s in new_matched}
    newly_eligible = [s for s in new_matched if s.get('schemeId', '') not in old_matched_ids]

    if newly_eligible:
        # Update DynamoDB
        try:
            citizens_table.update_item(
                Key={'citizenId': citizen_id},
                UpdateExpression='SET matchedSchemes = :schemes',
                ExpressionAttributeValues={':schemes': new_matched},
            )
        except Exception as e:
            print(f"[WARN] Failed to update citizen {citizen_id}: {e}")

        # Publish SNS alert
        scheme_names = ', '.join(s.get('nameEnglish', s.get('schemeId', '')) for s in newly_eligible[:3])
        try:
            sns.publish(
                TopicArn=SNS_TOPIC_ARN,
                Message=(
                    f"SARATHI NEW ELIGIBILITY ALERT\n\n"
                    f"Citizen: {citizen_name} ({citizen_id})\n"
                    f"Panchayat: {panchayat_id}\n"
                    f"Newly eligible schemes: {scheme_names}\n\n"
                    f"Please reach out to this citizen to help them enroll."
                ),
                Subject=f"New scheme eligibility — {citizen_name}",
            )
        except Exception as e:
            print(f"[WARN] SNS publish failed: {e}")


def _handle_daily_gap_scan():
    """Scan all panchayats, alert if welfare gap > 50%."""
    try:
        response = panchayats_table.scan(ProjectionExpression='panchayatId,panchayatName,totalHouseholds,enrolled')
        items = response.get('Items', [])
        while 'LastEvaluatedKey' in response:
            response = panchayats_table.scan(
                ProjectionExpression='panchayatId,panchayatName,totalHouseholds,enrolled',
                ExclusiveStartKey=response['LastEvaluatedKey'],
            )
            items.extend(response.get('Items', []))

        high_gap_panchayats = []
        for p in items:
            total = int(p.get('totalHouseholds', 0) or 0)
            enrolled = int(p.get('enrolled', 0) or 0)
            if total > 0:
                enrolled_pct = (enrolled / total) * 100
                gap_pct = 100 - enrolled_pct
                if gap_pct > 50:
                    high_gap_panchayats.append({
                        'id': p.get('panchayatId', ''),
                        'name': p.get('panchayatName', ''),
                        'gapPct': round(gap_pct),
                    })

        if high_gap_panchayats:
            names = ', '.join(f"{p['name']} ({p['gapPct']}% gap)" for p in high_gap_panchayats[:5])
            sns.publish(
                TopicArn=SNS_TOPIC_ARN,
                Message=(
                    f"SARATHI DAILY WELFARE GAP SCAN\n\n"
                    f"High-gap panchayats (>50% unenrolled):\n{names}\n\n"
                    f"Total: {len(high_gap_panchayats)} panchayats need urgent attention."
                ),
                Subject="Sarathi Daily Gap Scan — High Welfare Gaps Detected",
            )
    except Exception as e:
        print(f"[ERR] Daily gap scan failed: {e}")


def _handle_monthly_performance_update():
    """Recalculate performance scores for all panchayats."""
    try:
        response = panchayats_table.scan(ProjectionExpression='panchayatId,totalHouseholds,enrolled')
        items = response.get('Items', [])
        while 'LastEvaluatedKey' in response:
            response = panchayats_table.scan(
                ProjectionExpression='panchayatId,totalHouseholds,enrolled',
                ExclusiveStartKey=response['LastEvaluatedKey'],
            )
            items.extend(response.get('Items', []))

        for p in items:
            pid = p.get('panchayatId', '')
            total = int(p.get('totalHouseholds', 0) or 0)
            enrolled = int(p.get('enrolled', 0) or 0)
            if total > 0 and pid:
                pct = min(100, round((enrolled / total) * 100) + (10 if total > 5 else 0))
                try:
                    panchayats_table.update_item(
                        Key={'panchayatId': pid},
                        UpdateExpression='SET performanceScore = :score',
                        ExpressionAttributeValues={':score': pct},
                    )
                except Exception as e:
                    print(f"[WARN] Failed to update panchayat {pid}: {e}")
    except Exception as e:
        print(f"[ERR] Monthly performance update failed: {e}")


def lambda_handler(event, context):
    # DynamoDB Streams trigger
    if 'Records' in event:
        for record in event['Records']:
            if record.get('eventSource') == 'aws:dynamodb':
                _handle_stream(record)
        return {'statusCode': 200, 'body': 'Stream processed'}

    # EventBridge scheduled trigger
    action = event.get('action', '')
    if action == 'daily_gap_scan':
        _handle_daily_gap_scan()
        return {'statusCode': 200, 'body': 'Daily gap scan complete'}
    elif action == 'monthly_performance_update':
        _handle_monthly_performance_update()
        return {'statusCode': 200, 'body': 'Monthly performance update complete'}

    return {'statusCode': 200, 'body': 'No action taken'}
