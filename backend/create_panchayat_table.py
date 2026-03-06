"""Create the SarathiPanchayats DynamoDB table + GSI."""
import boto3
import sys

REGION = 'us-east-1'
TABLE_NAME = 'SarathiPanchayats'

dynamodb = boto3.client('dynamodb', region_name=REGION)

# Check if table already exists
existing = dynamodb.list_tables()['TableNames']
if TABLE_NAME in existing:
    print(f"[OK] Table '{TABLE_NAME}' already exists — skipping creation.")
    sys.exit(0)

print(f"Creating table '{TABLE_NAME}'...")
dynamodb.create_table(
    TableName=TABLE_NAME,
    KeySchema=[
        {'AttributeName': 'panchayatId', 'KeyType': 'HASH'},
    ],
    AttributeDefinitions=[
        {'AttributeName': 'panchayatId', 'AttributeType': 'S'},
        {'AttributeName': 'state', 'AttributeType': 'S'},
        {'AttributeName': 'district', 'AttributeType': 'S'},
    ],
    GlobalSecondaryIndexes=[
        {
            'IndexName': 'state-district-index',
            'KeySchema': [
                {'AttributeName': 'state', 'KeyType': 'HASH'},
                {'AttributeName': 'district', 'KeyType': 'RANGE'},
            ],
            'Projection': {'ProjectionType': 'ALL'},
            'ProvisionedThroughput': {'ReadCapacityUnits': 5, 'WriteCapacityUnits': 5},
        },
    ],
    ProvisionedThroughput={'ReadCapacityUnits': 5, 'WriteCapacityUnits': 5},
)

# Wait for table to become active
waiter = dynamodb.get_waiter('table_exists')
print("Waiting for table to become ACTIVE...")
waiter.wait(TableName=TABLE_NAME)
print(f"[OK] Table '{TABLE_NAME}' created successfully with state-district-index GSI.")
