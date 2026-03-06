import boto3
import time

client = boto3.client('bedrock-agent', region_name='us-east-1')
agent_id = '9ZWECPAM8P'

# Use the cross-region inference profile ID for Nova Premier
# This is required for on-demand throughput for Nova models
inference_profile_id = 'us.amazon.nova-premier-v1:0' 

print(f"Updating agent {agent_id} to use inference profile: {inference_profile_id}...")

try:
    # 1. Update the agent configuration
    client.update_agent(
        agentId=agent_id,
        agentName='SarathiCitizenAgent',
        foundationModel=inference_profile_id,
        instruction="You are Sarathi, a powerful and helpful government scheme assistant. You help citizens search for schemes, check application status, and apply for schemes on their behalf. Use the provided tools (SearchSchemes, ApplyForScheme, CheckApplicationStatus) to fetch real data and provide intelligent, empathetic guidance.",
        agentResourceRoleArn='arn:aws:iam::056048976827:role/AmazonBedrockExecutionRoleForAgents_Sarathi'
    )
    print("Agent updated.")

    # 2. Re-prepare the agent
    print("Preparing agent...")
    client.prepare_agent(agentId=agent_id)
    print("Agent preparation started.")
    
    # Wait for prep
    time.sleep(5)
    
    print(f"\n✅ Successfully switched to {inference_profile_id}!")
    print("Please try the Smart Assistant again in the Bedrock console (after it finishes preparing).")

except Exception as e:
    print(f"Error switching to inference profile: {e}")
