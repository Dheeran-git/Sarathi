"""
A2: Add panchayatId-updatedAt GSI to SarathiCitizens table.
Run once: python backend/create_gsi.py
Wait ~5 min for GSI to reach ACTIVE before deploying panchayat_stats update.
"""
import boto3, time

dynamodb = boto3.client('dynamodb', region_name='us-east-1')

print("Adding GSI panchayatId-updatedAt-index to SarathiCitizens...")
dynamodb.update_table(
    TableName='SarathiCitizens',
    AttributeDefinitions=[
        {'AttributeName': 'panchayatId', 'AttributeType': 'S'},
        {'AttributeName': 'updatedAt',   'AttributeType': 'S'},
    ],
    GlobalSecondaryIndexUpdates=[{'Create': {
        'IndexName': 'panchayatId-updatedAt-index',
        'KeySchema': [
            {'AttributeName': 'panchayatId', 'KeyType': 'HASH'},
            {'AttributeName': 'updatedAt',   'KeyType': 'RANGE'},
        ],
        'Projection': {'ProjectionType': 'ALL'},
    }}]
)
print("GSI creation initiated. Polling for ACTIVE status...")

while True:
    resp = dynamodb.describe_table(TableName='SarathiCitizens')
    gsi_list = resp['Table'].get('GlobalSecondaryIndexes', [])
    gsi = next((g for g in gsi_list if g['IndexName'] == 'panchayatId-updatedAt-index'), None)
    if gsi:
        status = gsi['IndexStatus']
        print(f"  Status: {status}")
        if status == 'ACTIVE':
            print("GSI is ACTIVE. You can now deploy the updated panchayat_stats lambda.")
            break
    time.sleep(15)
