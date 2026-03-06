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

def check_panchayats():
    ids = ["LGD_219293", "LGD_614744", "219293", "614744"]
    for pid in ids:
        print(f"--- Checking: {pid} ---")
        res = panchayats_table.get_item(Key={'panchayatId': pid})
        if 'Item' in res:
            print(json.dumps(res['Item'], cls=DecimalEncoder, indent=2))
        else:
            print("Not found.")

if __name__ == "__main__":
    check_panchayats()
