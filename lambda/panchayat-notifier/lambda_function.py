"""
Sarathi — Panchayat Notifier Lambda
Member 2 · AWS AI Services

Triggered when a new citizen is found eligible for schemes.
Sends SMS/notification to Panchayat officials via Amazon SNS.
"""

import json
import boto3
import os
from datetime import datetime

sns = boto3.client('sns')

TOPIC_ARN = os.environ.get('SNS_TOPIC_ARN', '')


def lambda_handler(event, context):
    """
    Input: {
        "citizenName": "Kamla Devi",
        "panchayatId": "rampur-barabanki-up",
        "matchedSchemes": [ { "nameHindi": "...", "annualBenefit": 6000 }, ... ],
        "totalAnnualBenefit": 64800
    }
    """
    print(f"[PanchayatNotifier] Event: {json.dumps(event, ensure_ascii=False)}")

    # Support API Gateway wrapper
    if isinstance(event.get('body'), str):
        body = json.loads(event['body'])
    else:
        body = event

    citizen_name = body.get('citizenName', 'Unknown')
    panchayat_id = body.get('panchayatId', 'unknown')
    schemes = body.get('matchedSchemes', [])
    total_benefit = body.get('totalAnnualBenefit', 0)
    matched_count = len(schemes)

    # ── Build the notification message ────────────────────────────
    top_schemes = ', '.join(
        s.get('nameHindi', s.get('nameEnglish', 'योजना'))
        for s in schemes[:3]
    )

    timestamp = datetime.utcnow().strftime('%d-%m-%Y %H:%M')

    # Hindi message for Panchayat officials
    message_hindi = (
        f"🔔 सारथी अलर्ट — नया पात्र नागरिक\n"
        f"━━━━━━━━━━━━━━━━━━━━\n"
        f"👤 नाम: {citizen_name}\n"
        f"📍 पंचायत: {panchayat_id}\n"
        f"📋 पात्र योजनाएं: {matched_count}\n"
        f"💰 कुल वार्षिक लाभ: ₹{total_benefit:,}\n"
        f"📌 प्रमुख: {top_schemes}\n"
        f"⏰ समय: {timestamp} UTC\n"
        f"━━━━━━━━━━━━━━━━━━━━\n"
        f"कृपया इस नागरिक से संपर्क करें और पंजीकरण में सहायता करें।"
    )

    # English message for email subscribers
    message_english = (
        f"🔔 Sarathi Alert — New Eligible Citizen\n"
        f"{'='*40}\n"
        f"Name: {citizen_name}\n"
        f"Panchayat: {panchayat_id}\n"
        f"Eligible Schemes: {matched_count}\n"
        f"Total Annual Benefit: ₹{total_benefit:,}\n"
        f"Top Schemes: {top_schemes}\n"
        f"Time: {timestamp} UTC\n"
        f"{'='*40}\n"
        f"Please reach out to this citizen and assist with enrollment."
    )

    subject = f"Sarathi: {matched_count} schemes found for {citizen_name}"

    # ── Send via SNS ──────────────────────────────────────────────
    if not TOPIC_ARN:
        print("[PanchayatNotifier] No SNS_TOPIC_ARN configured — skipping notification")
        return api_response(200, {
            'message': 'No SNS topic configured',
            'notification': message_hindi,
        })

    try:
        response = sns.publish(
            TopicArn=TOPIC_ARN,
            Message=json.dumps({
                'default': message_english,
                'sms': message_hindi[:160],  # SMS truncated to 160 chars
                'email': message_english,
            }),
            Subject=subject,
            MessageStructure='json',
            MessageAttributes={
                'panchayatId': {
                    'DataType': 'String',
                    'StringValue': panchayat_id,
                },
                'urgency': {
                    'DataType': 'String',
                    'StringValue': 'high' if total_benefit > 50000 else 'medium',
                },
            },
        )
        print(f"[PanchayatNotifier] SNS MessageId: {response['MessageId']}")

        return api_response(200, {
            'messageId': response['MessageId'],
            'citizenName': citizen_name,
            'schemesNotified': matched_count,
        })

    except Exception as e:
        print(f"[PanchayatNotifier] SNS error: {str(e)}")
        return api_response(500, {'error': str(e)})


def api_response(status_code, body):
    """Standard API Gateway response format."""
    return {
        'statusCode': status_code,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type,Authorization',
        },
        'body': json.dumps(body, ensure_ascii=False),
    }
