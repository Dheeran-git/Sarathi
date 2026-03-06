import boto3
import json
from decimal import Decimal

class DecimalEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, Decimal):
            return float(obj)
        return super(DecimalEncoder, self).default(obj)

dynamo = boto3.resource('dynamodb', region_name='us-east-1')

def get_data():
    schemes_table = dynamo.Table('SarathiSchemes')
    apps_table = dynamo.Table('SarathiApplications')
    
    schemes = schemes_table.scan().get('Items', [])
    apps = apps_table.scan().get('Items', [])
    
    print("--- SCHEMES ---")
    for s in schemes:
        print(f"ID: {s.get('schemeId')}, Name: {s.get('nameEnglish')}, Status: {s.get('status')}")
    
    print("\n--- APPLICATIONS ---")
    for a in apps:
        print(f"AppID: {a.get('applicationId')}, SchemeId: {a.get('schemeId')}, SchemeName: {a.get('schemeName')}")

get_data()
