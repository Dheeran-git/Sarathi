"""
workflow_trigger — POST /apply/workflow
Triggers Step Functions SarathiApplicationWorkflow for a welfare application.
Also handles internal task callbacks from Step Functions:
  task=validate — checks documents against scheme requirements
  task=process_decision — updates application status in DynamoDB
"""
import json
import os
import uuid
import boto3
from datetime import datetime, timezone
from decimal import Decimal

REGION = 'us-east-1'
STATE_MACHINE_ARN = os.environ.get('STATE_MACHINE_ARN', '')

sfn = boto3.client('stepfunctions', region_name=REGION)
dynamodb = boto3.resource('dynamodb', region_name=REGION)
applications_table = dynamodb.Table('SarathiApplications')
schemes_table = dynamodb.Table('SarathiSchemes')

# Load local schemes as fallback
_SCHEMES_PATH = os.path.join(os.path.dirname(__file__), 'schemes.json')
try:
    with open(_SCHEMES_PATH, 'r', encoding='utf-8') as _f:
        _LOCAL_SCHEMES = {s['schemeId']: s for s in json.load(_f) if 'schemeId' in s}
except (FileNotFoundError, KeyError):
    _LOCAL_SCHEMES = {}


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


def _get_scheme(scheme_id):
    try:
        result = schemes_table.get_item(Key={'schemeId': scheme_id})
        return result.get('Item')
    except Exception:
        return _LOCAL_SCHEMES.get(scheme_id)


def lambda_handler(event, context):
    try:
        # Internal Step Functions task callbacks
        task = event.get('task', '')

        if task == 'validate':
            application_id = event.get('applicationId', '')
            scheme_id = event.get('schemeId', '')
            uploaded_docs = event.get('documents', [])

            scheme = _get_scheme(scheme_id)
            required_docs = []
            if scheme:
                required_docs = scheme.get('documentsRequiredEn') or scheme.get('documentsRequired') or []

            missing = [doc for doc in required_docs if not any(
                doc.lower() in ud.lower() for ud in uploaded_docs
            )]

            return {
                'valid': len(missing) == 0,
                'missingDocuments': missing,
                'applicationId': application_id,
            }

        elif task == 'process_decision':
            application_id = event.get('applicationId', '')
            decision = event.get('decision', 'pending')
            reason = event.get('reason', '')

            if application_id:
                try:
                    applications_table.update_item(
                        Key={'applicationId': application_id},
                        UpdateExpression='SET #s = :status, decisionReason = :reason, decidedAt = :dt',
                        ExpressionAttributeNames={'#s': 'status'},
                        ExpressionAttributeValues={
                            ':status': decision,
                            ':reason': reason,
                            ':dt': datetime.now(timezone.utc).isoformat(),
                        },
                    )
                except Exception as e:
                    print(f"[WARN] Failed to update application {application_id}: {e}")

            return {'updated': True, 'applicationId': application_id}

        # HTTP POST /apply/workflow — start execution
        body = json.loads(event.get('body', '{}')) if isinstance(event.get('body'), str) else event

        application_id = body.get('applicationId') or str(uuid.uuid4())
        citizen_id = body.get('citizenId', '').strip()
        scheme_id = body.get('schemeId', '').strip()
        documents = body.get('documents', [])

        if not citizen_id or not scheme_id:
            return {
                'statusCode': 400,
                'headers': cors_headers(),
                'body': json.dumps({'error': 'citizenId and schemeId are required'}),
            }

        if not STATE_MACHINE_ARN:
            return {
                'statusCode': 503,
                'headers': cors_headers(),
                'body': json.dumps({'error': 'STATE_MACHINE_ARN not configured'}),
            }

        execution_input = json.dumps({
            'applicationId': application_id,
            'citizenId': citizen_id,
            'schemeId': scheme_id,
            'documents': documents,
            'submittedAt': datetime.now(timezone.utc).isoformat(),
        })

        execution_name = f"app-{application_id[:8]}-{datetime.now(timezone.utc).strftime('%Y%m%d%H%M%S')}"

        sfn_response = sfn.start_execution(
            stateMachineArn=STATE_MACHINE_ARN,
            name=execution_name,
            input=execution_input,
        )
        execution_arn = sfn_response['executionArn']

        # Update application record with execution ARN
        try:
            applications_table.update_item(
                Key={'applicationId': application_id},
                UpdateExpression='SET executionArn = :arn, workflowStatus = :status, workflowStartedAt = :dt',
                ExpressionAttributeValues={
                    ':arn': execution_arn,
                    ':status': 'workflow_started',
                    ':dt': datetime.now(timezone.utc).isoformat(),
                },
            )
        except Exception as e:
            print(f"[WARN] Failed to update application record: {e}")

        return {
            'statusCode': 200,
            'headers': cors_headers(),
            'body': json.dumps({
                'applicationId': application_id,
                'executionArn': execution_arn,
                'status': 'workflow_started',
            }),
        }

    except Exception as e:
        return {
            'statusCode': 500,
            'headers': cors_headers(),
            'body': json.dumps({'error': 'Internal server error', 'message': str(e)}),
        }
