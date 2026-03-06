import boto3
import json

iam = boto3.client('iam', region_name='us-east-1')
role_name = 'SarathiLambdaRole'
policy = {
    'Version': '2012-10-17',
    'Statement': [{
        'Effect': 'Allow',
        'Action': ['bedrock:InvokeAgent'],
        'Resource': '*'
    }]
}
try:
    iam.put_role_policy(RoleName=role_name, PolicyName='BedrockInvokeAgentPolicy', PolicyDocument=json.dumps(policy))
    print('Successfully attached BedrockInvokeAgentPolicy')
except Exception as e:
    print('Error:', e)
