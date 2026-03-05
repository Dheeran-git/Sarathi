import boto3
import zipfile
import os
import io
import time
from botocore.exceptions import ClientError

REGION = 'us-east-1'
LAMBDA_NAME = 'SarathiPanchayatPreSignUp'
USER_POOL_ID = 'us-east-1_lvbRzfVqx' # From cognito_pools.txt we know SarathiPanchayat pool
ROLE_NAME = 'SarathiLambdaRole'

iam = boto3.client('iam')
lambda_client = boto3.client('lambda', region_name=REGION)
cognito = boto3.client('cognito-idp', region_name=REGION)

def get_role_arn():
    try:
        role = iam.get_role(RoleName=ROLE_NAME)
        return role['Role']['Arn']
    except ClientError as e:
        print(f"Error getting role: {e}")
        return None

def create_or_update_lambda():
    role_arn = get_role_arn()
    if not role_arn:
        return None

    # Create deployment package
    zip_buffer = io.BytesIO()
    with zipfile.ZipFile(zip_buffer, 'a', zipfile.ZIP_DEFLATED) as zip_file:
        file_path = os.path.join('lambdas', 'panchayat_pre_signup.py')
        zip_file.write(file_path, 'panchayat_pre_signup.py')

    zip_bytes = zip_buffer.getvalue()
    lambda_arn = None

    try:
        print(f"Checking if {LAMBDA_NAME} exists...")
        response = lambda_client.get_function(FunctionName=LAMBDA_NAME)
        print("Function exists. Updating code...")
        lambda_client.update_function_code(
            FunctionName=LAMBDA_NAME,
            ZipFile=zip_bytes
        )
        lambda_arn = response['Configuration']['FunctionArn']
    except ClientError as e:
        if e.response['Error']['Code'] == 'ResourceNotFoundException':
            print("Function doesn't exist. Creating...")
            response = lambda_client.create_function(
                FunctionName=LAMBDA_NAME,
                Runtime='python3.9',
                Role=role_arn,
                Handler='panchayat_pre_signup.lambda_handler',
                Code={'ZipFile': zip_bytes},
                Timeout=10,
                Environment={
                    'Variables': {
                        'ENV': 'production'
                    }
                }
            )
            lambda_arn = response['FunctionArn']
            print("Waiting for function to be active...")
            time.sleep(10)
        else:
            raise e

    # Add permission for Cognito to invoke the Lambda
    try:
        print("Adding invocation permission for Cognito...")
        lambda_client.add_permission(
            FunctionName=LAMBDA_NAME,
            StatementId='CognitoInvokePreSignUp',
            Action='lambda:InvokeFunction',
            Principal='cognito-idp.amazonaws.com',
            SourceArn=f'arn:aws:cognito-idp:{REGION}:{boto3.client("sts").get_caller_identity()["Account"]}:userpool/{USER_POOL_ID}'
        )
        print("Permission added successfully.")
    except ClientError as e:
        if e.response['Error']['Code'] == 'ResourceConflictException':
            print("Permission already exists.")
        else:
            print(f"Error adding permission: {e}")

    return lambda_arn

def attach_trigger_to_cognito(lambda_arn):
    print("Attaching Lambda trigger to Cognito User Pool...")
    try:
        # We need to get the existing config first to not overwrite other things
        pool = cognito.describe_user_pool(UserPoolId=USER_POOL_ID)['UserPool']
        
        # Keep existing lambda config but update PreSignUp
        lambda_config = pool.get('LambdaConfig', {})
        lambda_config['PreSignUp'] = lambda_arn
        
        # update_user_pool requires many arguments unfortunately. 
        # A simpler way if we only have front-end client is to just send the basic ones.
        # But we must send what's required if modified.
        # Let's try sending just the lambda config update
        
        # To avoid validation errors, we pass all existing policies/schemas if needed
        # Actually update_user_pool accepts selective fields. Let's see:
        
        params = {
            'UserPoolId': USER_POOL_ID,
            'LambdaConfig': lambda_config,
            'Policies': pool.get('Policies', {}),
            'AutoVerifiedAttributes': pool.get('AutoVerifiedAttributes', []),
        }

        if 'SmsVerificationMessage' in pool:
            params['SmsVerificationMessage'] = pool['SmsVerificationMessage']
        if 'EmailVerificationMessage' in pool:
            params['EmailVerificationMessage'] = pool['EmailVerificationMessage']
        if 'EmailVerificationSubject' in pool:
            params['EmailVerificationSubject'] = pool['EmailVerificationSubject']
        if 'VerificationMessageTemplate' in pool:
            params['VerificationMessageTemplate'] = pool['VerificationMessageTemplate']
        if 'SmsAuthenticationMessage' in pool:
            params['SmsAuthenticationMessage'] = pool['SmsAuthenticationMessage']
        if 'MfaConfiguration' in pool:
            params['MfaConfiguration'] = pool['MfaConfiguration']
        if 'DeviceConfiguration' in pool:
            params['DeviceConfiguration'] = pool['DeviceConfiguration']
        if 'EmailConfiguration' in pool:
            params['EmailConfiguration'] = pool['EmailConfiguration']
        if 'SmsConfiguration' in pool:
            params['SmsConfiguration'] = pool['SmsConfiguration']
        if 'UserPoolTags' in pool:
            params['UserPoolTags'] = pool['UserPoolTags']
        if 'AdminCreateUserConfig' in pool:
            # We must strip 'UnusedAccountValidityDays' if it contains invalid values sometimes, but let's just pass it
            admin_cfg = pool['AdminCreateUserConfig']
            params['AdminCreateUserConfig'] = admin_cfg
        if 'UserPoolAddOns' in pool:
            params['UserPoolAddOns'] = pool['UserPoolAddOns']
        if 'AccountRecoverySetting' in pool:
            params['AccountRecoverySetting'] = pool['AccountRecoverySetting']
            
        cognito.update_user_pool(**params)
        print("Successfully attached trigger!")

    except ClientError as e:
        print(f"Error updating User Pool: {e}")

if __name__ == '__main__':
    arn = create_or_update_lambda()
    if arn:
        attach_trigger_to_cognito(arn)
