import boto3
from boto3.dynamodb.conditions import Attr

dynamodb = boto3.resource('dynamodb', region_name='us-east-1')
citizens_table = dynamodb.Table('SarathiCitizens')
apps_table = dynamodb.Table('SarathiApplications')

OLD_PID = "219293"
NEW_PID = "614744"
NEW_PID_FULL = "LGD_614744"

def repair():
    print(f"Repairing data: {OLD_PID} (incorrect) -> {NEW_PID} (correct)")
    
    # 1. Update Citizens
    print("Updating citizens...")
    res = citizens_table.scan(FilterExpression=Attr('panchayatId').eq(OLD_PID) | Attr('panchayatCode').eq(OLD_PID))
    items = res.get('Items', [])
    print(f"Found {len(items)} citizens.")
    for item in items:
        print(f"Updating citizen {item['citizenId']}...")
        citizens_table.update_item(
            Key={'citizenId': item['citizenId']},
            UpdateExpression='SET panchayatId = :p, panchayatCode = :p',
            ExpressionAttributeValues={':p': NEW_PID}
        )
        
    # 2. Update Applications
    print("\nUpdating applications...")
    # Scan for both normalized and un-normalized old PID
    res = apps_table.scan(FilterExpression=Attr('panchayatId').eq(OLD_PID) | Attr('panchayatId').eq(f"LGD_{OLD_PID}"))
    items = res.get('Items', [])
    print(f"Found {len(items)} applications.")
    for item in items:
        print(f"Updating application {item['applicationId']} to {NEW_PID_FULL}...")
        apps_table.update_item(
            Key={'applicationId': item['applicationId']},
            UpdateExpression='SET panchayatId = :p',
            ExpressionAttributeValues={':p': NEW_PID_FULL}
        )

    # 3. Handle applications with None/Null panchayatId but belonging to these citizens
    print("\nFixing applications with missing panchayatId for affected citizens...")
    citizen_ids = [i['citizenId'] for i in items] # This only includes citizen who had some app with old PID
    # Better: list all citizen IDs found in step 1
    citizen_ids = [i['citizenId'] for i in citizens_table.scan(FilterExpression=Attr('panchayatId').eq(NEW_PID)).get('Items', [])]
    
    for cid in citizen_ids:
        app_res = apps_table.scan(FilterExpression=Attr('citizenId').eq(cid) & (Attr('panchayatId').eq(None) | Attr('panchayatId').not_exists()))
        orphan_apps = app_res.get('Items', [])
        for app in orphan_apps:
            print(f"Fixing orphan application {app['applicationId']} for citizen {cid} -> {NEW_PID_FULL}")
            apps_table.update_item(
                Key={'applicationId': app['applicationId']},
                UpdateExpression='SET panchayatId = :p',
                ExpressionAttributeValues={':p': NEW_PID_FULL}
            )

    print("\nRepair complete.")

if __name__ == "__main__":
    repair()
