import boto3
import sys

def confirm_user(email):
    # SarathiPanchayat user pool
    USER_POOL_ID = 'us-east-1_lvbRzfVqx'
    
    client = boto3.client('cognito-idp', 'us-east-1')
    try:
        response = client.admin_confirm_sign_up(
            UserPoolId=USER_POOL_ID,
            Username=email
        )
        print(f"Successfully confirmed user: {email}")
        print(response)
    except Exception as e:
        print(f"Error confirming user {email}: {e}")

if __name__ == "__main__":
    email = sys.argv[1] if len(sys.argv) > 1 else "panchayat.test6@gov.in"
    confirm_user(email)
