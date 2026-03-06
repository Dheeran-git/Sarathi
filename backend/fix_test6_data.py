import boto3
import json

dynamo = boto3.client('dynamodb', region_name='us-east-1')

def fix_data():
    print("Starting data correction for 'test6' applications...")
    
    # 1. Get the formal schemeId for 'test6'
    resp = dynamo.scan(TableName='SarathiSchemes')
    actual_sid = None
    actual_sname = "test6"
    for s in resp.get('Items', []):
        name = s.get('name', {}).get('S') or s.get('nameEnglish', {}).get('S', '')
        if name.lower() == 'test6':
            actual_sid = s.get('schemeId', {}).get('S')
            actual_sname = name
            print(f"Found formal ID for 'test6': {actual_sid}")
            break
            
    if not actual_sid:
        print("Error: Could not find formal schemeId for 'test6'.")
        return

    # 2. Find applications with incorrect legacy schemeId "test6"
    # We found these in the previous john_doe_apps.json
    apps_resp = dynamo.scan(
        TableName='SarathiApplications',
        FilterExpression='schemeId = :sid',
        ExpressionAttributeValues={':sid': {'S': 'test6'}}
    )
    
    apps_to_fix = apps_resp.get('Items', [])
    print(f"Found {len(apps_to_fix)} applications to fix.")
    
    for app in apps_to_fix:
        app_id = app['applicationId']['S']
        print(f"Updating Application {app_id}...")
        try:
            dynamo.update_item(
                TableName='SarathiApplications',
                Key={'applicationId': {'S': app_id}},
                UpdateExpression='SET schemeId = :sid, schemeName = :sname',
                ExpressionAttributeValues={
                    ':sid': {'S': actual_sid},
                    ':sname': {'S': actual_sname}
                }
            )
            print(f"Success: Updated {app_id}")
        except Exception as e:
            print(f"Error updating {app_id}: {e}")

    print("Data correction complete.")

if __name__ == "__main__":
    fix_data()
