import boto3

iam = boto3.client('iam', region_name='us-east-1')
role_name = 'SarathiLambdaRole'

print(f"Checking policies for role: {role_name}")

try:
    attached = iam.list_attached_role_policies(RoleName=role_name)
    print("\nAttached Policies:")
    for p in attached.get('AttachedPolicies', []):
        print(f"- {p['PolicyName']} ({p['PolicyArn']})")

    inline = iam.list_role_policies(RoleName=role_name)
    print("\nInline Policies:")
    for p_name in inline.get('PolicyNames', []):
        print(f"- {p_name}")
        policy = iam.get_role_policy(RoleName=role_name, PolicyName=p_name)
        print(f"  Content: {policy['PolicyDocument']}")

except Exception as e:
    print(f"Error checking IAM: {e}")
