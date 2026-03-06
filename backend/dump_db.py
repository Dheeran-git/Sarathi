import boto3
import json
from decimal import Decimal

class DecimalEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, Decimal):
            return float(obj)
        return super(DecimalEncoder, self).default(obj)

dynamo = boto3.resource('dynamodb', region_name='us-east-1')

schemes = dynamo.Table('SarathiSchemes').scan().get('Items', [])
apps = dynamo.Table('SarathiApplications').scan().get('Items', [])

data = {
    'schemes': schemes,
    'applications': apps
}

with open('db_dump.json', 'w') as f:
    json.dump(data, f, indent=2, cls=DecimalEncoder)

print(f"Dumped {len(schemes)} schemes and {len(apps)} applications to db_dump.json")
