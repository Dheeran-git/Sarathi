import boto3
import json
import time
import os

# Get IDs from the setup script output or list them
REGION = "us-east-1"
bedrock_agent_runtime = boto3.client('bedrock-agent-runtime', region_name=REGION)
bedrock_agent = boto3.client('bedrock-agent', region_name=REGION)

def get_ids():
    agents = bedrock_agent.list_agents(maxResults=10)['agentSummaries']
    agent_id = next((a['agentId'] for a in agents if a['agentName'] == 'SarathiCitizenAgent'), None)
    if not agent_id:
        print("Agent not found!")
        exit(1)
    
    aliases = bedrock_agent.list_agent_aliases(agentId=agent_id, maxResults=10)['agentAliasSummaries']
    alias_id = next((a['agentAliasId'] for a in aliases if a['agentAliasName'] == 'v1'), None)
    
    return agent_id, alias_id

def test_prompt(agent_id, alias_id, prompt, session_id):
    print(f"\nUser: {prompt}")
    response = bedrock_agent_runtime.invoke_agent(
        agentId=agent_id,
        agentAliasId=alias_id,
        sessionId=session_id,
        inputText=prompt
    )
    
    completion = ""
    for event in response.get('completion'):
        if 'chunk' in event:
            completion += event['chunk']['bytes'].decode('utf-8')
    
    print(f"Assistant: {completion}")
    return completion

if __name__ == "__main__":
    agent_id, alias_id = get_ids()
    session_id = f"test-{int(time.time())}"
    
    print(f"Testing Agent {agent_id} (Alias {alias_id})")
    
    # Test 1: RAG Search
    test_prompt(agent_id, alias_id, "Find me a scheme for farmers that gives money every year.", session_id)
    
    # Test 2: Status check (Real data)
    test_prompt(agent_id, alias_id, "What is the status of my application? My ID is guest.", session_id)
    
    # Test 3: Consent Check
    test_prompt(agent_id, alias_id, "Apply for PM Kisan for me.", session_id)
