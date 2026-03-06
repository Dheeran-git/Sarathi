import json
import boto3
from decimal import Decimal

class DecimalEncoder(json.JSONEncoder):
    def default(self, o):
        if isinstance(o, Decimal):
            return float(o)
        return super().default(o)

dynamodb = boto3.resource('dynamodb', region_name='us-east-1')
table = dynamodb.Table('SarathiSchemes')

response = table.scan()
items = response.get('Items', [])
abc = [i for i in items if i.get('nameEnglish') == 'abc']

print(json.dumps(abc, indent=2, cls=DecimalEncoder))
