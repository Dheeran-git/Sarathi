"""
panchayat_notifier — POST /notify
Publishes welfare alert notifications to panchayat officials via AWS SNS.
"""
import json
import os
import boto3

REGION = 'us-east-1'
SNS_TOPIC_ARN = os.environ.get(
    'SNS_TOPIC_ARN',
    'arn:aws:sns:us-east-1:056048976827:SarathiPanchayatAlerts'
)

sns = boto3.client('sns', region_name=REGION)


def cors_headers():
    return {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Amz-Date,X-Api-Key',
        'Access-Control-Allow-Methods': 'GET,POST,PATCH,OPTIONS',
        'Content-Type': 'application/json',
    }


def lambda_handler(event, context):
    try:
        body = json.loads(event.get('body', '{}')) if isinstance(event.get('body'), str) else event

        notification_type = body.get('type', 'alert')
        panchayat_id = body.get('panchayatId', 'unknown')
        message = body.get('message', '')
        subject = body.get('subject', f'Sarathi Alert — {panchayat_id}')
        citizen_count = body.get('citizenCount', 0)
        scheme_name = body.get('schemeName', '')

        if not message:
            # Auto-generate message from structured fields
            if notification_type == 'unenrolled_alert':
                message = (
                    f"SARATHI WELFARE ALERT\n\n"
                    f"Panchayat: {panchayat_id}\n"
                    f"Scheme: {scheme_name}\n"
                    f"Citizens eligible but not enrolled: {citizen_count}\n\n"
                    f"Please follow up with these citizens to ensure they receive their entitled benefits."
                )
            else:
                message = f"Sarathi notification for panchayat {panchayat_id}: {notification_type}"

        response = sns.publish(
            TopicArn=SNS_TOPIC_ARN,
            Message=message,
            Subject=subject[:100],  # SNS subject max 100 chars
            MessageAttributes={
                'panchayatId': {
                    'DataType': 'String',
                    'StringValue': panchayat_id,
                },
                'notificationType': {
                    'DataType': 'String',
                    'StringValue': notification_type,
                },
            },
        )

        return {
            'statusCode': 200,
            'headers': cors_headers(),
            'body': json.dumps({
                'messageId': response['MessageId'],
                'status': 'sent',
                'panchayatId': panchayat_id,
            }),
        }

    except Exception as e:
        return {
            'statusCode': 500,
            'headers': cors_headers(),
            'body': json.dumps({'error': 'Internal server error', 'message': str(e)}),
        }
