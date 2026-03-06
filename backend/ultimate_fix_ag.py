import boto3
import json
import time

client = boto3.client('bedrock-agent', region_name='us-east-1')
agent_id = '9ZWECPAM8P'
executor_arn = 'arn:aws:lambda:us-east-1:056048976827:function:sarathi-agent-executor'

schema = {
    'functions': [
        {
            'name': 'SearchSchemes',
            'description': 'Search for government schemes',
            'parameters': {'query': {'description': 'Search keywords', 'required': False, 'type': 'string'}}
        },
        {
            'name': 'ApplyForScheme',
            'description': 'Apply for a scheme. MUST collect applicantName, aadhaarNumber, mobileNumber, bankAccount first.',
            'parameters': {
                'schemeId': {'description': 'Scheme ID', 'required': True, 'type': 'string'},
                'applicantName': {'description': 'Full name of applicant', 'required': True, 'type': 'string'},
                'aadhaarNumber': {'description': 'Aadhaar (last 4 digits)', 'required': True, 'type': 'string'},
                'mobileNumber': {'description': 'Mobile number', 'required': True, 'type': 'string'},
                'bankAccount': {'description': 'Bank account number', 'required': True, 'type': 'string'}
            }
        }
    ]
}

def ultimate_fix():
    print(f"Starting ultimate fix for agent {agent_id}...")
    
    # List and Disable/Delete old groups
    resp = client.list_agent_action_groups(agentId=agent_id, agentVersion='DRAFT')
    for ag in resp.get('actionGroupSummaries', []):
        ag_id = ag['actionGroupId']
        ag_name = ag['actionGroupName']
        print(f"Found existing group: {ag_name} ({ag_id})")
        
        if ag_name == 'SarathiActions':
            print(f"Disabling {ag_name}...")
            try:
                # We need a dummy schema to update status if it was OpenAPI based
                client.update_agent_action_group(
                    agentId=agent_id, agentVersion='DRAFT', actionGroupId=ag_id,
                    actionGroupName=ag_name, actionGroupState='DISABLED',
                    actionGroupExecutor={'lambda': executor_arn},
                    functionSchema={'functions': [{'name': 'dummy', 'description': 'd'}]}
                )
                print("Disabled.")
                time.sleep(2)
                print(f"Deleting {ag_name}...")
                client.delete_agent_action_group(agentId=agent_id, agentVersion='DRAFT', actionGroupId=ag_id)
                print("Deleted.")
            except Exception as e:
                print(f"Failed to clean {ag_name}: {e}")

    # Create V3
    print("\nCreating SarathiActionsV3...")
    try:
        client.create_agent_action_group(
            agentId=agent_id, agentVersion='DRAFT',
            actionGroupName='SarathiActionsV3',
            actionGroupExecutor={'lambda': executor_arn},
            functionSchema=schema
        )
        print("V3 Created Successfully.")
    except Exception as e:
        print(f"V3 Creation failed: {e}")

    print("\nPreparing Agent...")
    client.prepare_agent(agentId=agent_id)
    print("Done.")

if __name__ == "__main__":
    ultimate_fix()
