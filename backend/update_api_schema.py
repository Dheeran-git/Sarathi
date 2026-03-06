import boto3
import json
import time

client = boto3.client('bedrock-agent', region_name='us-east-1')
agent_id = '9ZWECPAM8P'

schema = {
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
                        "required": False,
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
}

try:
    print('Updating action group...')
    client.update_agent_action_group(
        agentId=agent_id,
        agentVersion='DRAFT',
        actionGroupId='JLNDBCFC7W',
        actionGroupName='SarathiActions',
        actionGroupExecutor={'lambda': 'arn:aws:lambda:us-east-1:056048976827:function:sarathi-agent-executor'},
        apiSchema={'payload': json.dumps(schema)}
    )
    print('Updating agent memory...')
    client.prepare_agent(agentId=agent_id)
    time.sleep(5)
    print('All set.')
except Exception as e:
    print('Error:', e)
