import boto3
import json
import time

iam = boto3.client('iam')
bedrock = boto3.client('bedrock-agent', region_name='us-east-1')

agent_id = '9ZWECPAM8P'
role_name = 'SarathiBedrockAgentRole_v2'

# 1. Create Trust Policy
trust_policy = {
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Principal": {
                "Service": "bedrock.amazonaws.com"
            },
            "Action": "sts:AssumeRole"
        }
    ]
}

# 2. Create Permissions Policy
# This covers model invocation, lambda execution (for action groups), and S3 (if needed)
permissions_policy = {
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "bedrock:InvokeModel",
                "bedrock:InvokeModelWithResponseStream"
            ],
            "Resource": [
                "arn:aws:bedrock:us-east-1::foundation-model/amazon.nova-premier-v1:0",
                "arn:aws:bedrock:us-east-1::foundation-model/amazon.nova-lite-v1:0",
                "arn:aws:bedrock:us-east-1::foundation-model/anthropic.claude-3-haiku-20240307-v1:0"
            ]
        },
        {
            "Effect": "Allow",
            "Action": "lambda:InvokeFunction",
            "Resource": "arn:aws:lambda:us-east-1:056048976827:function:sarathi-agent-executor"
        }
    ]
}

try:
    print(f"Checking if role {role_name} exists...")
    try:
        iam.get_role(RoleName=role_name)
        print("Role exists, deleting to recreate...")
        # (Simplified: just update it instead)
    except iam.exceptions.NoSuchEntityException:
        print("Creating role...")
        iam.create_role(
            RoleName=role_name,
            AssumeRolePolicyDocument=json.dumps(trust_policy)
        )

    print("Attaching permissions...")
    iam.put_role_policy(
        RoleName=role_name,
        PolicyName='BedrockAgentPolicy',
        PolicyDocument=json.dumps(permissions_policy)
    )

    # Wait for IAM propagation
    print("Waiting for IAM propagation (10s)...")
    time.sleep(10)

    role_arn = iam.get_role(RoleName=role_name)['Role']['Arn']
    print(f"Role ARN: {role_arn}")

    print(f"Updating agent {agent_id} with new role...")
    bedrock.update_agent(
        agentId=agent_id,
        agentName='SarathiCitizenAgent',
        foundationModel='amazon.nova-premier-v1:0',
        agentResourceRoleArn=role_arn,
        instruction="You are Sarathi, a helpful government scheme assistant. You help citizens search for schemes, check application status, and apply for schemes on their behalf."
    )

    print("Preparing agent...")
    bedrock.prepare_agent(agentId=agent_id)
    print("✅ Agent role fixed and agent prepared!")

except Exception as e:
    print(f"Error: {e}")
