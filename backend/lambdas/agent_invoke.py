"""
agent_invoke – POST /agent
Invokes the Sarathi Bedrock Orchestrator Agent (multi-agent supervisor).
Maintains session memory per citizen via memoryId.
"""
import json
import os
import boto3

REGION = 'us-east-1'
ORCHESTRATOR_AGENT_ID = os.environ.get('ORCHESTRATOR_AGENT_ID', '')
ORCHESTRATOR_AGENT_ALIAS_ID = os.environ.get('ORCHESTRATOR_AGENT_ALIAS_ID', '')

bedrock_agent_runtime = boto3.client('bedrock-agent-runtime', region_name=REGION)


def cors_headers():
    return {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Amz-Date,X-Api-Key',
        'Access-Control-Allow-Methods': 'GET,POST,PATCH,OPTIONS',
        'Content-Type': 'application/json',
    }


def sanitize_id(raw_id):
    """Sanitize an ID for Bedrock Agent (only [0-9a-zA-Z._:-] allowed)."""
    return ''.join(c if c.isalnum() or c in '._:-' else '-' for c in raw_id)[:100]


def lambda_handler(event, context):
    try:
        body = json.loads(event.get('body', '{}')) if isinstance(event.get('body'), str) else event

        message = body.get('message', '').strip()
        session_id = body.get('sessionId', '').strip()
        citizen_id = body.get('citizenId', '').strip()
        language = body.get('language', 'en')

        if not message:
            return {
                'statusCode': 400,
                'headers': cors_headers(),
                'body': json.dumps({'error': 'message is required'}),
            }

        if not ORCHESTRATOR_AGENT_ID or not ORCHESTRATOR_AGENT_ALIAS_ID:
            return {
                'statusCode': 503,
                'headers': cors_headers(),
                'body': json.dumps({'error': 'Agent not configured. Set ORCHESTRATOR_AGENT_ID and ORCHESTRATOR_AGENT_ALIAS_ID env vars.'}),
            }

        # Use citizenId as both sessionId and memoryId for persistent context
        effective_session = sanitize_id(citizen_id or session_id or 'default-session')

        invoke_kwargs = dict(
            agentId=ORCHESTRATOR_AGENT_ID,
            agentAliasId=ORCHESTRATOR_AGENT_ALIAS_ID,
            sessionId=effective_session,
            inputText=message,
            enableTrace=False,
        )
        if citizen_id:
            invoke_kwargs['memoryId'] = sanitize_id(citizen_id)

        print(f"Invoking agent {ORCHESTRATOR_AGENT_ID} session={effective_session} citizenId={citizen_id}")
        response = bedrock_agent_runtime.invoke_agent(**invoke_kwargs)

        # Collect streamed completion chunks
        completion = ''
        event_stream = response.get('completion', [])
        for chunk_event in event_stream:
            chunk = chunk_event.get('chunk', {})
            if 'bytes' in chunk:
                completion += chunk['bytes'].decode('utf-8')

        return {
            'statusCode': 200,
            'headers': cors_headers(),
            'body': json.dumps({
                'response': completion,
                'sessionId': effective_session,
                'citizenId': citizen_id,
            }),
        }

    except Exception as e:
        print(f"Error in agent_invoke: {str(e)}")
        return {
            'statusCode': 500,
            'headers': cors_headers(),
            'body': json.dumps({'error': 'Internal server error', 'message': str(e)}),
        }
