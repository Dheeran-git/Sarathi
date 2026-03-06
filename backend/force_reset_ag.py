import boto3
import time
import json

client = boto3.client('bedrock-agent', region_name='us-east-1')
agent_id = '9ZWECPAM8P'
ag_id = 'JLNDBCFC7W'
executor_arn = 'arn:aws:lambda:us-east-1:056048976827:function:sarathi-agent-executor'

def force_reset():
    try:
        print(f"Disabling action group {ag_id}...")
        client.update_agent_action_group(
            agentId=agent_id,
            agentVersion='DRAFT',
            actionGroupId=ag_id,
            actionGroupName='SarathiActions',
            actionGroupState='DISABLED',
            # We must provide some executor/schema to make it valid
            actionGroupExecutor={'lambda': executor_arn},
            # Dummy schema for disabling if needed
            apiSchema={'payload': json.dumps({"openapi":"3.0.0","info":{"title":"temp","version":"1.0.0"},"paths":{}})}
        )
        time.sleep(3)
        
        print(f"Deleting action group {ag_id}...")
        client.delete_agent_action_group(
            agentId=agent_id,
            agentVersion='DRAFT',
            actionGroupId=ag_id
        )
        time.sleep(3)
        print("Reset successful.")
    except Exception as e:
        print(f"Error during reset: {e}")

if __name__ == "__main__":
    force_reset()
