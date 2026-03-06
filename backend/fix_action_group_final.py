import boto3
import json
import time

client = boto3.client('bedrock-agent', region_name='us-east-1')
agent_id = '9ZWECPAM8P'

def fix():
    print(f"Checking action groups for agent {agent_id} (DRAFT)...")
    resp = client.list_agent_action_groups(agentId=agent_id, agentVersion='DRAFT')
    groups = resp.get('actionGroupSummaries', [])
    
    for g in groups:
        name = g['actionGroupName']
        ag_id = g['actionGroupId']
        state = g['actionGroupState']
        print(f"Found: {name} ({ag_id}) - State: {state}")
        
        if name == 'SarathiActions':
            print(f"Attempting to disable legacy group {ag_id}...")
            try:
                # We need to provide the existing executor to update state
                # Get full details first
                full = client.get_agent_action_group(agentId=agent_id, agentVersion='DRAFT', actionGroupId=ag_id)['agentActionGroup']
                client.update_agent_action_group(
                    agentId=agent_id,
                    agentVersion='DRAFT',
                    actionGroupId=ag_id,
                    actionGroupName=name,
                    actionGroupState='DISABLED',
                    actionGroupExecutor=full['actionGroupExecutor'],
                    apiSchema=full.get('apiSchema', {})
                )
                print(f"Disabled {name}")
            except Exception as e:
                print(f"Failed to disable {name}: {e}")

    # Create V2 with proper schema
    print("\nCreating/Updating SarathiActionsV2...")
    api_schema = {
        "openapi": "3.0.0",
        "info": {"title": "Sarathi API", "version": "1.0.0"},
        "paths": {
            "/apply": {
                "post": {
                    "summary": "Apply for a scheme",
                    "operationId": "ApplyForScheme",
                    "requestBody": {
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "properties": {
                                        "schemeId": {"type": "string"},
                                        "applicantName": {"type": "string"},
                                        "aadhaarNumber": {"type": "string"},
                                        "mobileNumber": {"type": "string"},
                                        "bankAccount": {"type": "string"}
                                    },
                                    "required": ["schemeId", "applicantName", "aadhaarNumber", "mobileNumber", "bankAccount"]
                                }
                            }
                        }
                    },
                    "responses": {"200": {"description": "OK"}}
                }
            },
            "/search": {
                "get": {
                    "summary": "Search schemes",
                    "operationId": "SearchSchemes",
                    "parameters": [{"name": "query", "in": "query", "required": False, "schema": {"type": "string"}}],
                    "responses": {"200": {"description": "OK"}}
                }
            }
        }
    }
    
    v2_exists = next((g for g in groups if g['actionGroupName'] == 'SarathiActionsV2'), None)
    
    executor_arn = 'arn:aws:lambda:us-east-1:056048976827:function:sarathi-agent-executor'
    
    try:
        if v2_exists:
            print(f"Updating V2 ({v2_exists['actionGroupId']})...")
            client.update_agent_action_group(
                agentId=agent_id,
                agentVersion='DRAFT',
                actionGroupId=v2_exists['actionGroupId'],
                actionGroupName='SarathiActionsV2',
                actionGroupExecutor={'lambda': executor_arn},
                apiSchema={'payload': json.dumps(api_schema)}
            )
        else:
            print("Creating V2...")
            client.create_agent_action_group(
                agentId=agent_id,
                agentVersion='DRAFT',
                actionGroupName='SarathiActionsV2',
                actionGroupExecutor={'lambda': executor_arn},
                apiSchema={'payload': json.dumps(api_schema)}
            )
        print("V2 Success.")
    except Exception as e:
        print(f"V2 Failed: {e}")

    print("\nPreparing Agent...")
    client.prepare_agent(agentId=agent_id)
    print("Agent preparing. Wait 10s...")
    time.sleep(10)
    print("Done.")

if __name__ == "__main__":
    fix()
