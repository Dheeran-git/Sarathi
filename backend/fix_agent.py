import boto3
import json

REGION = 'us-east-1'
ACCOUNT_ID = '056048976827'
AGENT_ID = '9ZWECPAM8P'
executor_arn = f"arn:aws:lambda:{REGION}:{ACCOUNT_ID}:function:sarathi-agent-executor"

client = boto3.client('bedrock-agent', region_name=REGION)

try:
    print("Deleting old action group if any...")
    client.delete_agent_action_group(
        agentId=AGENT_ID,
        agentVersion='DRAFT',
        actionGroupName='SarathiActions'
    )
except Exception as e:
    pass

print("Attaching Action Group to Agent...")
try:
    # Instead of an OpenAPI schema, use functionSchema which is simpler and less prone to parsing errors
    client.create_agent_action_group(
        agentId=AGENT_ID,
        agentVersion='DRAFT',
        actionGroupName='SarathiActions',
        description='Actions to search, apply, and check status for government schemes.',
        actionGroupExecutor={'lambda': executor_arn},
        functionSchema={
            'functions': [
                {
                    'name': 'SearchSchemes',
                    'description': 'Search for schemes based on user criteria.',
                    'parameters': {
                        'query': {
                            'description': 'Search query to filter schemes. Use "all" for all schemes.',
                            'type': 'string',
                            'required': False
                        }
                    }
                },
                {
                    'name': 'ApplyForScheme',
                    'description': 'Apply for a scheme on behalf of a citizen.',
                    'parameters': {
                        'citizenId': {
                            'description': 'The unique ID of the citizen applying',
                            'type': 'string',
                            'required': True
                        },
                        'schemeId': {
                            'description': 'The unique ID of the scheme being applied for',
                            'type': 'string',
                            'required': True
                        }
                    }
                },
                {
                    'name': 'CheckApplicationStatus',
                    'description': 'Check the status of a previously submitted scheme application.',
                    'parameters': {
                        'citizenId': {
                            'description': 'The unique ID of the citizen',
                            'type': 'string',
                            'required': True
                        },
                        'schemeId': {
                            'description': 'The unique ID of the scheme',
                            'type': 'string',
                            'required': True
                        }
                    }
                }
            ]
        }
    )
    print("Action Group attached successfully.")
    
    print("Preparing Agent...")
    client.prepare_agent(agentId=AGENT_ID)
except Exception as e:
    print(f"Error: {e}")
