import json

def lambda_handler(event, context):
    """
    Cognito Pre Sign-up trigger to auto-confirm Panchayat officials.
    """
    print("PreSignUp Event Received:", json.dumps(event))

    # We want to auto-confirm every user for this specific identity pool
    # so they do not have to verify their .gov.in email via OTP.
    event['response']['autoConfirmUser'] = True
    event['response']['autoVerifyEmail'] = True
    # If dealing with phones we could also do:
    # event['response']['autoVerifyPhone'] = True

    return event
