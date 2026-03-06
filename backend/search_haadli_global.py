import boto3
import json
from decimal import Decimal

class DecimalEncoder(json.JSONEncoder):
    def default(self, o):
        if isinstance(o, Decimal):
            return int(o) if o % 1 == 0 else float(o)
        return super().default(o)

dynamodb = boto3.resource('dynamodb', region_name='us-east-1')

def search_haadli():
    print("--- Searching SarathiPanchayats ---")
    table = dynamodb.Table('SarathiPanchayats')
    res = table.scan()
    for item in res.get('Items', []):
        name = item.get('panchayatName', '').lower()
        if 'haadli' in name or 'hadli' in name:
            print(json.dumps(item, cls=DecimalEncoder, indent=2))

    print("\n--- Searching SarathiCitizens for Haadli ---")
    table = dynamodb.Table('SarathiCitizens')
    res = table.scan()
    for item in res.get('Items', []):
        name = item.get('panchayatName', '').lower()
        if 'haadli' in name or 'hadli' in name:
            print(f"Citizen: {item['citizenId']}, Name: {item.get('name')}, PID: {item.get('panchayatId')}, Code: {item.get('panchayatCode')}, Village: {item.get('villageCode')}")

if __name__ == "__main__":
    search_haadli()
