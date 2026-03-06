import boto3
import json
from decimal import Decimal

class DecimalEncoder(json.JSONEncoder):
    def default(self, o):
        if isinstance(o, Decimal):
            return int(o) if o % 1 == 0 else float(o)
        return super().default(o)

dynamodb = boto3.resource('dynamodb', region_name='us-east-1')
panchayats_table = dynamodb.Table('SarathiPanchayats')

def find_mandya():
    print("Scanning for District 'Mandya'...")
    from boto3.dynamodb.conditions import Attr
    res = panchayats_table.scan(FilterExpression=Attr('district').eq('Mandya'))
    items = res.get('Items', [])
    print(f"Found {len(items)} results.")
    for item in items:
        print(f"Name: {item.get('panchayatName')}, ID: {item.get('panchayatId')}, LGD: {item.get('lgdCode')}")

if __name__ == "__main__":
    find_mandya()
