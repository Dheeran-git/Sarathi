import boto3
import requests
import json
import os

CLIENT_ID = '5lqb4vhfnr4b628vn0iims85a9'
USERNAME = 'testcitizen@example.com' # Needs an existing citizen, or create one
PASSWORD = 'Password!123'
API_URL = 'https://mvbx0sv4n3.execute-api.us-east-1.amazonaws.com/prod'

client = boto3.client('cognito-idp', region_name='us-east-1')

def register_and_login():
    try:
        client.sign_up(ClientId=CLIENT_ID, Username=USERNAME, Password=PASSWORD, UserAttributes=[{'Name': 'email', 'Value': USERNAME}])
        client.admin_confirm_sign_up(UserPoolId='us-east-1_FoiBWBYwO', Username=USERNAME)
        print("User created and confirmed.")
    except client.exceptions.UsernameExistsException:
        print("User already exists.")
    
    auth_resp = client.initiate_auth(
        ClientId=CLIENT_ID,
        AuthFlow='USER_PASSWORD_AUTH',
        AuthParameters={'USERNAME': USERNAME, 'PASSWORD': PASSWORD}
    )
    
    id_token = auth_resp['AuthenticationResult']['IdToken']
    print("Got IdToken:", id_token[:20] + "...")
    return id_token

def test_apply(token):
    headers = {
        'Authorization': token,
        'Content-Type': 'application/json'
    }
    payload = {
        'citizenId': USERNAME,
        'schemeId': 'cde',
        'schemeName': 'CDE Scheme',
        'documentsChecked': [],
        'personalDetails': {'name': 'Test Citizen'}
    }
    
    print("\nSending POST /apply...")
    resp = requests.post(f"{API_URL}/apply", headers=headers, json=payload)
    print("Status:", resp.status_code)
    print("Response:", resp.text)

if __name__ == '__main__':
    token = register_and_login()
    test_apply(token)
