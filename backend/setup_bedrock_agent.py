import boto3
import json
import time

REGION = 'us-east-1'
ACCOUNT_ID = '056048976827'
ROLE_ARN = 'arn:aws:iam::056048976827:role/SarathiLambdaRole'

client = boto3.client('bedrock-agent', region_name=REGION)
lam = boto3.client('lambda', region_name=REGION)
apigw = boto3.client('apigateway', region_name=REGION)
iam = boto3.client('iam', region_name=REGION)

print("Starting Bedrock Agent Setup...")

# --- 1. Create Bedrock Agent Role ---
try:
    bedrock_role = iam.create_role(
        RoleName='AmazonBedrockExecutionRoleForAgents_Sarathi',
        AssumeRolePolicyDocument=json.dumps({
            "Version": "2012-10-17",
            "Statement": [{
                "Effect": "Allow",
                "Principal": {"Service": "bedrock.amazonaws.com"},
                "Action": "sts:AssumeRole"
            }]
        })
    )
    print("Created Bedrock IAM Role")
    
    # Attach policies to bedrock role allowing model invocation
    iam.put_role_policy(
        RoleName='AmazonBedrockExecutionRoleForAgents_Sarathi',
        PolicyName='BedrockAgentInvokeModel',
        PolicyDocument=json.dumps({
            "Version": "2012-10-17",
            "Statement": [{
                "Effect": "Allow",
                "Action": ["bedrock:InvokeModel"],
                "Resource": [
                    "arn:aws:bedrock:us-east-1::foundation-model/amazon.nova-pro-v1:0",
                    "arn:aws:bedrock:us-east-1::foundation-model/anthropic.claude-3-haiku-20240307-v1:0"
                ]
            }]
        })
    )
    print("Attached policies to Bedrock Role")
    time.sleep(10) # Wait for role to propagate
except Exception as e:
    print(f"Role might exist: {str(e)}")

# --- 2. Create the Bedrock Agent ---
agent_role_arn = f"arn:aws:iam::{ACCOUNT_ID}:role/AmazonBedrockExecutionRoleForAgents_Sarathi"

print("\nCreating or Updating Bedrock Agent...")
agent_id = None
try:
    # Check if agent exists
    agents = client.list_agents(maxResults=100)['agentSummaries']
    agent_id = next((a['agentId'] for a in agents if a['agentName'] == 'SarathiCitizenAgent'), None)
    
    if agent_id:
        print(f"Agent exists (ID: {agent_id}), updating...")
        client.update_agent(
            agentId=agent_id,
            agentName='SarathiCitizenAgent',
            agentResourceRoleArn=agent_role_arn,
            foundationModel='amazon.nova-pro-v1:0',
            instruction="""You are Sarathi, an intelligent government welfare AI assistant for Indian citizens.
Your goal is to converse with users in a warm, simple, and polite manner.

CRITICAL RULES:
1. DATA COLLECTION & CONSENT: You MUST ask for explicit user consent AND collect the following details before calling 'ApplyForScheme': Full Name, Aadhaar Number (last 4 digits ok), Mobile Number, and Bank Account Number. Never apply without the user explicitly providing this data and saying 'yes' or 'proceed'.
2. RESEARCH & SCHEME IDs: To find schemes, ALWAYS use the 'SearchSchemes' action first. You MUST use the formal 'schemeId' (e.g., SCH-xxxx) returned by 'SearchSchemes' when calling 'ApplyForScheme'. NEVER use the common name (like 'test6') as the schemeId.
3. PERSONALIZATION: First, use 'GetCitizenProfile' to fetch the user's details. Use this data to tailor your response.
4. SYSTEM CONTEXT: You can check application statuses using 'CheckApplicationStatus'.
5. TONE: Be warm, empathetic, and patient. If a user is confused, explain things step-by-step.
6. CONCISE: Keep responses conversational and easy to read. Use bullet points for lists."""
        )
    else:
        print("Creating new Agent...")
        agent_resp = client.create_agent(
            agentName='SarathiCitizenAgent',
            agentResourceRoleArn=agent_role_arn,
            foundationModel='amazon.nova-pro-v1:0',
            instruction="""You are Sarathi, an intelligent government welfare AI assistant for Indian citizens.
Your goal is to converse with users in a warm, simple, and polite manner.

CRITICAL RULES:
1. DATA COLLECTION & CONSENT: You MUST ask for explicit user consent AND collect the following details before calling 'ApplyForScheme': Full Name, Aadhaar Number (last 4 digits ok), Mobile Number, and Bank Account Number. Never apply without the user explicitly providing this data and saying 'yes' or 'proceed'.
2. RESEARCH & SCHEME IDs: To find schemes, ALWAYS use the 'SearchSchemes' action first. You MUST use the formal 'schemeId' (e.g., SCH-xxxx) returned by 'SearchSchemes' when calling 'ApplyForScheme'. NEVER use the common name (like 'test6') as the schemeId.
3. PERSONALIZATION: First, use 'GetCitizenProfile' to fetch the user's details. Use this data to tailor your response.
4. SYSTEM CONTEXT: You can check application statuses using 'CheckApplicationStatus'.
5. TONE: Be warm, empathetic, and patient. If a user is confused, explain things step-by-step.
6. CONCISE: Keep responses conversational and easy to read. Use bullet points for lists."""
        )
        agent_id = agent_resp['agent']['agentId']
        
    print(f"Agent Ready. ID: {agent_id}")
    time.sleep(5) 
except Exception as e:
    print(f"Failed to handle agent: {str(e)}")
    # If we still don't have agent_id, something is wrong
    if not agent_id: exit(1)

# --- 3. Deploy Executor Lambda (The Action Group) ---
print("\nDeploying Executor Lambda...")
import zipfile
import io

import os

# Use absolute path or search for the file
FILE_DIR = os.path.dirname(os.path.abspath(__file__))
executor_path = os.path.join(FILE_DIR, 'lambdas', 'bedrock_agent_executor.py')

with open(executor_path, 'r') as f:
    code = f.read()

buf = io.BytesIO()
with zipfile.ZipFile(buf, 'w', zipfile.ZIP_DEFLATED) as zf:
    zf.writestr('lambda_function.py', code)
zip_bytes = buf.getvalue()

try:
    lam.create_function(
        FunctionName='sarathi-agent-executor',
        Runtime='python3.11',
        Role=ROLE_ARN,
        Handler='lambda_function.lambda_handler',
        Code={'ZipFile': zip_bytes},
        Timeout=30,
        MemorySize=256,
    )
    print("Created Executor Lambda")
except Exception as e:
    lam.update_function_code(FunctionName='sarathi-agent-executor', ZipFile=zip_bytes)
    print("Updated Executor Lambda")

executor_arn = f"arn:aws:lambda:{REGION}:{ACCOUNT_ID}:function:sarathi-agent-executor"

# Give Bedrock permission to invoke this Lambda
try:
    lam.add_permission(
        FunctionName='sarathi-agent-executor',
        StatementId='allow-bedrock-agent',
        Action='lambda:InvokeFunction',
        Principal='bedrock.amazonaws.com',
        SourceArn=f"arn:aws:bedrock:{REGION}:{ACCOUNT_ID}:agent/{agent_id}"
    )
except:
    pass

# --- 4. Attach Action Group to Agent ---
print("\nAttaching or Updating Action Group...")
ACTION_GROUP_NAME = 'SarathiActionsV2'
api_schema_payload = json.dumps({
    "openapi": "3.0.0",
    "info": {
        "title": "Sarathi Scheme API",
        "version": "1.0.0"
    },
    "paths": {
        "/search": {
            "get": {
                "summary": "Search for schemes with rich details",
                "operationId": "SearchSchemes",
                "parameters": [
                    {
                        "name": "query",
                        "in": "query",
                        "description": "Keywords like 'farmer', 'pension', 'education' to find matching schemes with full eligibility and benefit details.",
                        "required": False,
                        "schema": {"type": "string"}
                    }
                ],
                "responses": {"200": {"description": "Returns a list of matching schemes with detailed field data."}}
            }
        },
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
                                    "citizenId": {"type": "string", "description": "The ID of the citizen. Optional if provided by session."},
                                    "schemeId": {"type": "string", "description": "The ID of the scheme to apply for."},
                                    "applicantName": {"type": "string", "description": "Full name of the applicant."},
                                    "aadhaarNumber": {"type": "string", "description": "Aadhaar number of the applicant."},
                                    "mobileNumber": {"type": "string", "description": "Mobile number of the applicant."},
                                    "bankAccount": {"type": "string", "description": "Bank account number of the applicant for benefits."}
                                },
                                "required": ["schemeId", "applicantName", "aadhaarNumber", "mobileNumber", "bankAccount"]
                            }
                        }
                    }
                },
                "responses": {"200": {"description": "Application successful"}}
            }
        },
        "/status": {
            "get": {
                "summary": "Check application status",
                "operationId": "CheckApplicationStatus",
                "parameters": [
                    {
                        "name": "citizenId",
                        "in": "query",
                        "required": True,
                        "schema": {"type": "string"}
                    },
                    {
                        "name": "schemeId",
                        "in": "query",
                        "required": True,
                        "schema": {"type": "string"}
                    }
                ],
                "responses": {"200": {"description": "Status checked"}}
            }
        },
        "/profile": {
            "get": {
                "summary": "Get citizen profile",
                "operationId": "GetCitizenProfile",
                "parameters": [
                    {
                        "name": "citizenId",
                        "in": "query",
                        "required": True,
                        "schema": {"type": "string"}
                    }
                ],
                "responses": {"200": {"description": "Profile fetched"}}
            }
        }
    }
})

try:
    ag_list = client.list_agent_action_groups(agentId=agent_id, agentVersion='DRAFT', maxResults=100)['actionGroupSummaries']
    old_ag = next((ag for ag in ag_list if ag['actionGroupName'] == ACTION_GROUP_NAME), None)
    
    if old_ag:
        print(f"Updating existing Action Group {old_ag['actionGroupId']}...")
        client.update_agent_action_group(
            agentId=agent_id,
            agentVersion='DRAFT',
            actionGroupId=old_ag['actionGroupId'],
            actionGroupName=ACTION_GROUP_NAME,
            actionGroupExecutor={'lambda': executor_arn},
            apiSchema={'payload': api_schema_payload}
        )
        print("Action Group updated")
    else:
        print(f"Creating new Action Group {ACTION_GROUP_NAME}...")
        client.create_agent_action_group(
            agentId=agent_id,
            agentVersion='DRAFT',
            actionGroupName=ACTION_GROUP_NAME,
            actionGroupExecutor={'lambda': executor_arn},
            apiSchema={'payload': api_schema_payload}
        )
        print("Action Group created")
except Exception as e:
    print(f"Failed to handle action group: {str(e)}")

# --- 5. Prepare and Create Alias ---
print("\nSkipping Knowledge Base Association due to IAM restrictions. Agent will use Action Groups for search.")

print("\nPreparing Agent...")
client.prepare_agent(agentId=agent_id)
time.sleep(10)

print("Creating or Updating Agent Alias (v1)...")
try:
    alias_resp = client.create_agent_alias(
        agentId=agent_id,
        agentAliasName='v1'
    )
    alias_id = alias_resp['agentAlias']['agentAliasId']
    print(f"Created Agent Alias ID: {alias_id}")
except Exception as e:
    # If it exists, find its ID
    print(f"Alias might exist: {str(e)}")
    aliases = client.list_agent_aliases(agentId=agent_id, maxResults=100)['agentAliasSummaries']
    alias_id = next((a['agentAliasId'] for a in aliases if a['agentAliasName'] == 'v1'), None)
    print(f"Using existing Agent Alias ID: {alias_id}")

print("\n--- Summary ---")
print(f"AGENT_ID = '{agent_id}'")
print(f"AGENT_ALIAS_ID = '{alias_id}'")
print("\nRun deploy_agent_route.py next to hook this into API Gateway.")
