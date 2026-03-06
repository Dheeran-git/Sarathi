import json
import boto3
import os

# This Lambda is called by API Gateway at POST /agent
# It forwards the request to the Amazon Bedrock Agent

def lambda_handler(event, context):
    agent_id = os.environ.get('AGENT_ID')
    agent_alias_id = os.environ.get('AGENT_ALIAS_ID')
    
    if not agent_id or not agent_alias_id:
        return {
            'statusCode': 500,
            'headers': {'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Agent ID or Alias ID not configured'})
        }

    try:
        body = json.loads(event.get('body', '{}'))
        prompt = body.get('prompt')
        session_id = body.get('sessionId')
        citizen_id = body.get('citizenId', '')
        
        if not prompt or not session_id:
            return {
                'statusCode': 400,
                'headers': {'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'prompt and sessionId are required'})
            }
            
        print(f"Invoking Bedrock Agent {agent_id} for session {session_id} and user {citizen_id}")

        client = boto3.client('bedrock-agent-runtime', region_name='us-east-1')
        
        invoke_params = {
            'agentId': agent_id,
            'agentAliasId': agent_alias_id,
            'sessionId': session_id,
            'inputText': prompt,
        }
        
        if citizen_id:
            invoke_params['sessionState'] = {
                'sessionAttributes': {
                    'citizenId': citizen_id
                }
            }

        response = client.invoke_agent(**invoke_params)
        
        # Bedrock Agent returns a streaming response. We must read the EventStream.
        completion = ""
        for event in response.get('completion'):
            if 'chunk' in event:
                chunk = event['chunk']
                bytes_data = chunk.get('bytes', b'')
                text = bytes_data.decode('utf-8')
                completion += text

        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json'
            },
            'body': json.dumps({'response': completion})
        }
        
    except Exception as e:
        print(f"Error invoking Bedrock agent: {str(e)}")
        return {
            'statusCode': 500,
            'headers': {'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': str(e)})
        }
