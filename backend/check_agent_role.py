import boto3
import json

session = boto3.Session(region_name='us-east-1')
iam = session.client('iam')
role_name = 'SarathiBedrockAgentRole'

print(f"Checking policies for agent role: {role_name}")

try:
    inline = iam.list_role_policies(RoleName=role_name)
    print("\nInline Policies:")
    for p_name in inline.get('PolicyNames', []) :
        print(f"- {p_name}")
        policy = iam.get_role_policy(RoleName=role_name, PolicyName=p_name)
        print(f"  Content: {json.dumps(policy['PolicyDocument'], indent=2)}")

    attached = iam.list_attached_role_policies(RoleName=role_name)
    print("\nAttached Policies:")
    for p in attached.get('AttachedPolicies', []):
        print(f"- {p['PolicyName']} ({p['PolicyArn']})")

    trust = iam.get_role(RoleName=role_name)
    print("\nTrust Relationship:")
    print(json.dumps(trust['Role']['AssumeRolePolicyDocument'], indent=2))

except Exception as e:
    print(f"Error checking agent role: {e}")
