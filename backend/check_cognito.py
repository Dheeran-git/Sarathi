import boto3
import json

cognito = boto3.client('cognito-idp', region_name='us-east-1')

def check_user():
    pool_id = 'us-east-1_7lFWvsXg3'
    username = 'tentanms2006@gov.in'
    try:
        res = cognito.admin_get_user(UserPoolId=pool_id, Username=username)
        print(json.dumps(res['UserAttributes'], indent=2))
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check_user()
