import boto3
import json
from decimal import Decimal

class DecimalEncoder(json.JSONEncoder):
    def default(self, o):
        if isinstance(o, Decimal):
            return int(o) if o % 1 == 0 else float(o)
        return super().default(o)

dynamodb = boto3.resource('dynamodb', region_name='us-east-1')
citizens_table = dynamodb.Table('SarathiCitizens')
apps_table = dynamodb.Table('SarathiApplications')

def debug_data():
    citizen_email = "tentanms2006@gmail.com"
    print(f"--- Citizen Profile: {citizen_email} ---")
    res = citizens_table.get_item(Key={'citizenId': citizen_email})
    if 'Item' in res:
        print(json.dumps(res['Item'], cls=DecimalEncoder, indent=2))
        pid = res['Item'].get('panchayatId')
        code = res['Item'].get('panchayatCode')
        print(f"Profile panchayatId: {pid}, panchayatCode: {code}")
        
        print(f"\n--- Applications for citizen: {citizen_email} ---")
        app_res = apps_table.scan(FilterExpression=boto3.dynamodb.conditions.Attr('citizenId').eq(citizen_email))
        apps = app_res.get('Items', [])
        for app in apps:
            print(f"AppID: {app['applicationId']}, Scheme: {app.get('schemeName')}, Status: {app.get('status')}, panchayatId: {app.get('panchayatId')}")
    else:
        print("Citizen profile not found.")

if __name__ == "__main__":
    debug_data()
