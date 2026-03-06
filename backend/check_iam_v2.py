import boto3
import json

session = boto3.Session(region_name='us-east-1')
iam = session.client('iam')
role_name = 'SarathiLambdaRole'

print(f"Checking for BedrockFullAgentAccess on {role_name}")

try:
    # Try to get the specific policy I asked the user to create
    policy = iam.get_role_policy(RoleName=role_name, PolicyName='BedrockFullAgentAccess')
    print("Policy found!")
    print(json.dumps(policy['PolicyDocument'], indent=2))
except Exception as e:
    print(f"Could not find or read policy: {e}")
    # List all inline policies to see what exists
    try:
        inline = iam.list_role_policies(RoleName=role_name)
        print(f"Existing inline policies: {inline.get('PolicyNames', [])}")
    except:
        pass
