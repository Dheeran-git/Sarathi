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

def find_active_karnataka():
    print("Scanning for active panchayats in Karnataka...")
    from boto3.dynamodb.conditions import Attr
    res = panchayats_table.scan(FilterExpression=Attr('state').eq('Karnataka') & Attr('status').eq('active'))
    items = res.get('Items', [])
    print(f"Found {len(items)} active results.")
    for item in items:
        print(json.dumps(item, cls=DecimalEncoder, indent=2))

if __name__ == "__main__":
    find_active_karnataka()
