import boto3
import json
from decimal import Decimal

class DecimalEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, Decimal):
            return float(obj)
        return super(DecimalEncoder, self).default(obj)

dynamo = boto3.resource('dynamodb', region_name='us-east-1')
table = dynamo.Table('SarathiApplications')

response = table.scan(Limit=20)
items = response.get('Items', [])

print(json.dumps(items, indent=2, cls=DecimalEncoder))
