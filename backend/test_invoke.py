import boto3
import json

client = boto3.client('bedrock-agent-runtime', region_name='us-east-1')

try:
    print("Testing InvokeAgent directly from terminal...")
    response = client.invoke_agent(
        agentId='9ZWECPAM8P',
        agentAliasId='TSTALIASID',
        sessionId='testTerminal',
        inputText='hello'
    )
    print("Invocation successful!")
    for event in response.get('completion'):
        if 'chunk' in event:
            print(event['chunk']['bytes'].decode())
except Exception as e:
    print(f"Terminal Invoke Error: {e}")
