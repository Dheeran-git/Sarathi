import boto3
import time

client = boto3.client('bedrock-agent', region_name='us-east-1')
agent_id = '9ZWECPAM8P'

# Amazon Nova Premier is the top-tier native model for reasoning and agents
amazon_model = 'amazon.nova-premier-v1:0' 

print(f"Updating agent {agent_id} to use model: {amazon_model}...")

try:
    # 1. Update the agent configuration
    client.update_agent(
        agentId=agent_id,
        agentName='SarathiCitizenAgent',
        foundationModel=amazon_model,
        instruction="You are Sarathi, a powerful and helpful government scheme assistant. You help citizens search for schemes, check application status, and apply for schemes on their behalf. Use the provided tools to fetch real data and provide intelligent, empathetic guidance.",
        agentResourceRoleArn='arn:aws:iam::056048976827:role/SarathiBedrockAgentRole'
    )
    print("Agent updated.")

    # 2. Re-prepare the agent
    print("Preparing agent...")
    client.prepare_agent(agentId=agent_id)
    print("Agent preparation started.")
    
    time.sleep(5)
    
    print(f"\n✅ Successfully switched to {amazon_model}!")
    print("This is the flagship Amazon Nova Premier model.")

except Exception as e:
    print(f"Error switching model: {e}")
