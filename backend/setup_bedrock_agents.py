"""
setup_bedrock_agents.py — One-time setup script
Creates:
  1. sarathi-eligibility-agent (Nova Pro + KB + check_eligibility action)
  2. sarathi-application-agent (Nova Pro + KB + get_application_guide action)
  3. sarathi-twin-agent (Nova Pro + calculate_twin action)
  4. sarathi-orchestrator-agent (supervisor, all 3 sub-agents as collaborators)
  5. Aliases for all agents (production-ready)

Prerequisites:
  - setup_knowledge_base.py must have been run (need KB_ID)
  - All action Lambda functions must be deployed
  - Bedrock Guardrail must exist (optional but recommended)

Set KB_ID and optionally GUARDRAIL_ID/GUARDRAIL_VERSION before running.
Run: KB_ID=<your-kb-id> python backend/setup_bedrock_agents.py
"""
import json
import os
import time
import boto3

REGION = 'us-east-1'
ACCOUNT_ID = boto3.client('sts').get_caller_identity()['Account']

KB_ID = os.environ.get('KB_ID', '')
GUARDRAIL_ID = os.environ.get('GUARDRAIL_ID', '')
GUARDRAIL_VERSION = os.environ.get('GUARDRAIL_VERSION', 'DRAFT')
LAMBDA_ROLE_ARN = f"arn:aws:iam::{ACCOUNT_ID}:role/SarathiLambdaRole"

ELIGIBILITY_LAMBDA = f"arn:aws:lambda:{REGION}:{ACCOUNT_ID}:function:sarathi-agent-action-eligibility"
APPLICATION_LAMBDA = f"arn:aws:lambda:{REGION}:{ACCOUNT_ID}:function:sarathi-agent-action-application"
TWIN_LAMBDA = f"arn:aws:lambda:{REGION}:{ACCOUNT_ID}:function:sarathi-agent-action-twin"

MODEL_ID = f"arn:aws:bedrock:{REGION}::foundation-model/amazon.nova-pro-v1:0"

bedrock_agent = boto3.client('bedrock-agent', region_name=REGION)
lambda_client = boto3.client('lambda', region_name=REGION)


def _guardrail_config():
    if GUARDRAIL_ID:
        return {'guardrailIdentifier': GUARDRAIL_ID, 'guardrailVersion': GUARDRAIL_VERSION}
    return {}


def _wait_for_agent(agent_id):
    """Wait for agent to reach NOT_PREPARED or PREPARED state."""
    for _ in range(30):
        resp = bedrock_agent.get_agent(agentId=agent_id)
        status = resp['agent']['agentStatus']
        if status in ('NOT_PREPARED', 'PREPARED', 'FAILED'):
            return status
        time.sleep(5)
    return 'UNKNOWN'


def create_agent(name, instruction, with_kb=True):
    """Create a Bedrock Agent with Nova Pro."""
    kwargs = dict(
        agentName=name,
        agentResourceRoleArn=LAMBDA_ROLE_ARN,
        description=f"Sarathi {name} agent",
        foundationModel=MODEL_ID,
        instruction=instruction,
        idleSessionTTLInSeconds=1800,
        memoryConfiguration={
            'enabledMemoryTypes': ['SESSION_SUMMARY'],
            'storageDays': 30,
        },
    )
    if GUARDRAIL_ID:
        kwargs['guardrailConfiguration'] = _guardrail_config()

    try:
        resp = bedrock_agent.create_agent(**kwargs)
        agent_id = resp['agent']['agentId']
        print(f"  Created agent {name}: {agent_id}")
    except bedrock_agent.exceptions.ConflictException:
        existing = bedrock_agent.list_agents(maxResults=20)
        for a in existing.get('agentSummaries', []):
            if a['agentName'] == name:
                agent_id = a['agentId']
                print(f"  Agent {name} already exists: {agent_id}")
                break
        else:
            raise

    # Attach KB if requested
    if with_kb and KB_ID:
        _wait_for_agent(agent_id)
        try:
            bedrock_agent.associate_agent_knowledge_base(
                agentId=agent_id,
                agentVersion='DRAFT',
                knowledgeBaseId=KB_ID,
                description="Sarathi scheme knowledge base",
                knowledgeBaseState='ENABLED',
            )
            print(f"    Attached KB {KB_ID} to {name}")
        except bedrock_agent.exceptions.ConflictException:
            print(f"    KB {KB_ID} already attached to {name}")

    return agent_id


def add_action_group(agent_id, group_name, function_name, function_arn, func_schema):
    """Add an action group (Lambda action) to an agent."""
    _wait_for_agent(agent_id)

    try:
        bedrock_agent.create_agent_action_group(
            agentId=agent_id,
            agentVersion='DRAFT',
            actionGroupName=group_name,
            actionGroupExecutor={'lambda': function_arn},
            functionSchema={
                'functions': [func_schema]
            },
            description=f"Action group for {group_name}",
        )
        print(f"    Action group {group_name} added to {agent_id}")
    except bedrock_agent.exceptions.ConflictException:
        print(f"    Action group {group_name} already exists on {agent_id}")

    # Add resource-based policy so Bedrock can invoke the Lambda
    try:
        lambda_client.add_permission(
            FunctionName=function_name,
            StatementId=f"bedrock-invoke-{agent_id[:8]}",
            Action='lambda:InvokeFunction',
            Principal='bedrock.amazonaws.com',
            SourceArn=f"arn:aws:bedrock:{REGION}:{ACCOUNT_ID}:agent/{agent_id}",
        )
        print(f"    Lambda permission added for {function_name}")
    except lambda_client.exceptions.ResourceConflictException:
        print(f"    Lambda permission already exists for {function_name}")


def prepare_and_alias(agent_id, alias_name):
    """Prepare agent and create a named alias."""
    bedrock_agent.prepare_agent(agentId=agent_id)
    print(f"    Preparing agent {agent_id}...")

    for _ in range(60):
        resp = bedrock_agent.get_agent(agentId=agent_id)
        status = resp['agent']['agentStatus']
        if status == 'PREPARED':
            break
        if status == 'FAILED':
            raise RuntimeError(f"Agent {agent_id} preparation failed")
        time.sleep(5)

    try:
        resp = bedrock_agent.create_agent_alias(
            agentId=agent_id,
            agentAliasName=alias_name,
        )
        alias_id = resp['agentAlias']['agentAliasId']
    except bedrock_agent.exceptions.ConflictException:
        existing = bedrock_agent.list_agent_aliases(agentId=agent_id, maxResults=20)
        for a in existing.get('agentAliasSummaries', []):
            if a['agentAliasName'] == alias_name:
                alias_id = a['agentAliasId']
                break
        else:
            raise
    print(f"    Alias {alias_name}: {alias_id}")
    return alias_id


def create_orchestrator(eligibility_id, eligibility_alias, application_id, application_alias, twin_id, twin_alias):
    """Create the orchestrator (supervisor) agent with all 3 sub-agents."""
    resp = bedrock_agent.create_agent(
        agentName='sarathi-orchestrator-agent',
        agentResourceRoleArn=LAMBDA_ROLE_ARN,
        description="Sarathi AI welfare orchestrator — routes citizen queries to specialist sub-agents",
        foundationModel=MODEL_ID,
        instruction=(
            "You are Sarathi, an AI welfare assistant for Indian rural citizens. "
            "Your role is to help citizens understand and access government welfare schemes.\n\n"
            "Routing rules:\n"
            "- For eligibility questions ('what schemes am I eligible for', 'do I qualify for...'): "
            "route to the eligibility specialist agent\n"
            "- For application/document questions ('how do I apply', 'what documents do I need'): "
            "route to the application guide specialist agent\n"
            "- For income projection questions ('how much will I earn', 'financial projection'): "
            "route to the digital twin specialist agent\n\n"
            "Always respond in plain, simple language. If the citizen has shared their language preference, "
            "respond accordingly. Keep responses concise and actionable."
        ),
        agentCollaboration='SUPERVISOR',
        idleSessionTTLInSeconds=1800,
        memoryConfiguration={
            'enabledMemoryTypes': ['SESSION_SUMMARY'],
            'storageDays': 30,
        },
    )
    orch_id = resp['agent']['agentId']
    print(f"  Created orchestrator: {orch_id}")

    _wait_for_agent(orch_id)

    # Associate sub-agents as collaborators
    for sub_id, sub_alias, name, desc in [
        (eligibility_id, eligibility_alias, 'eligibility-specialist', "Eligibility specialist — check scheme matches for citizen profiles"),
        (application_id, application_alias, 'application-guide', "Application guide — document checklists and step-by-step guidance"),
        (twin_id, twin_alias, 'digital-twin', "Digital twin — 36-month income projections and conflict detection"),
    ]:
        sub_arn = f"arn:aws:bedrock:{REGION}:{ACCOUNT_ID}:agent-alias/{sub_id}/{sub_alias}"
        bedrock_agent.associate_agent_collaborator(
            agentId=orch_id,
            agentVersion='DRAFT',
            agentDescriptor={'aliasArn': sub_arn},
            collaboratorName=name,
            collaborationInstruction=desc,
            relayConversationHistory='TO_COLLABORATOR',
        )
        print(f"    Associated sub-agent {sub_id}/{sub_alias}")

    return orch_id


def main():
    print("=== Sarathi Bedrock Agents Setup ===\n")

    if not KB_ID:
        print("[WARN] KB_ID not set — agents will be created without Knowledge Base")
        print("       Set KB_ID=<your-kb-id> environment variable and re-run to attach KB")

    # 1. Eligibility Agent
    print("1. Creating sarathi-eligibility-agent...")
    elig_id = create_agent(
        'sarathi-eligibility-agent',
        instruction=(
            "You are an eligibility specialist for Indian government welfare schemes. "
            "Use the check_eligibility action to match citizen profiles to schemes. "
            "Use the Knowledge Base to provide rich context about each scheme. "
            "Explain clearly why a citizen qualifies or does not qualify, in simple language. "
            "Always mention the annual benefit amount for matched schemes."
        ),
        with_kb=bool(KB_ID),
    )
    add_action_group(elig_id, 'check_eligibility_group', 'sarathi-agent-action-eligibility',
                     ELIGIBILITY_LAMBDA, {
                         'name': 'check_eligibility',
                         'description': 'Check citizen eligibility for welfare schemes',
                         'parameters': {
                             'age': {'type': 'string', 'description': 'Citizen age in years', 'required': True},
                             'monthlyIncome': {'type': 'string', 'description': 'Monthly income in INR', 'required': True},
                             'gender': {'type': 'string', 'description': 'male/female/any', 'required': False},
                             'category': {'type': 'string', 'description': 'SC/ST/OBC/General', 'required': False},
                             'details': {'type': 'string', 'description': 'JSON with optional fields: state, occupation, isWidow (true/false), disability (true/false)', 'required': False},
                         },
                     })
    elig_alias = prepare_and_alias(elig_id, 'sarathi-eligibility-prod')

    # 2. Application Agent
    print("\n2. Creating sarathi-application-agent...")
    app_id = create_agent(
        'sarathi-application-agent',
        instruction=(
            "You are an application guide specialist for Indian government welfare schemes. "
            "Use the get_application_guide action to provide complete document checklists "
            "and step-by-step application guidance. "
            "Always end with the official portal URL for each scheme. "
            "Explain each document requirement simply so a rural citizen can understand."
        ),
        with_kb=bool(KB_ID),
    )
    add_action_group(app_id, 'application_guide_group', 'sarathi-agent-action-application',
                     APPLICATION_LAMBDA, {
                         'name': 'get_application_guide',
                         'description': 'Get complete application guide for a welfare scheme',
                         'parameters': {
                             'schemeId': {'type': 'string', 'description': 'The scheme ID', 'required': True},
                         },
                     })
    app_alias = prepare_and_alias(app_id, 'sarathi-application-prod')

    # 3. Digital Twin Agent
    print("\n3. Creating sarathi-twin-agent...")
    twin_id = create_agent(
        'sarathi-twin-agent',
        instruction=(
            "You are a financial planning specialist for Indian rural citizens. "
            "Use the calculate_twin action for 36-month income projections and conflict resolution. "
            "Frame results as monthly household income increase. "
            "Highlight the optimal bundle of schemes with no conflicts. "
            "Show the percentage income increase over 36 months."
        ),
        with_kb=False,
    )
    add_action_group(twin_id, 'twin_calculation_group', 'sarathi-agent-action-twin',
                     TWIN_LAMBDA, {
                         'name': 'calculate_twin',
                         'description': 'Calculate 36-month income projections with welfare scheme benefits',
                         'parameters': {
                             'monthlyIncome': {'type': 'string', 'description': 'Current monthly income in INR', 'required': True},
                             'matchedSchemes': {'type': 'string', 'description': 'JSON array of matched scheme objects', 'required': True},
                         },
                     })
    twin_alias = prepare_and_alias(twin_id, 'sarathi-twin-prod')

    # 4. Orchestrator
    print("\n4. Creating sarathi-orchestrator-agent (supervisor)...")
    orch_id = create_orchestrator(elig_id, elig_alias, app_id, app_alias, twin_id, twin_alias)
    orch_alias = prepare_and_alias(orch_id, 'sarathi-orchestrator-prod')

    print("\n=== DONE ===")
    print("\nAdd these to sarathi-agent-invoke Lambda environment variables:")
    print(f"  ORCHESTRATOR_AGENT_ID={orch_id}")
    print(f"  ORCHESTRATOR_AGENT_ALIAS_ID={orch_alias}")
    print(f"\nSub-agent IDs (for reference):")
    print(f"  ELIGIBILITY_AGENT_ID={elig_id}  ALIAS={elig_alias}")
    print(f"  APPLICATION_AGENT_ID={app_id}  ALIAS={app_alias}")
    print(f"  TWIN_AGENT_ID={twin_id}  ALIAS={twin_alias}")


if __name__ == '__main__':
    main()
