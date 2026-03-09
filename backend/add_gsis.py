import boto3

def create_gsis():
    dynamodb = boto3.client('dynamodb', region_name='us-east-1')
    try:
        response = dynamodb.update_table(
            TableName='SarathiSchemes',
            AttributeDefinitions=[
                {'AttributeName': 'status', 'AttributeType': 'S'},
                {'AttributeName': 'nameEnglish', 'AttributeType': 'S'},
                {'AttributeName': 'annualBenefit', 'AttributeType': 'N'},
            ],
            GlobalSecondaryIndexUpdates=[
                {
                    'Create': {
                        'IndexName': 'status-name-index',
                        'KeySchema': [
                            {'AttributeName': 'status', 'KeyType': 'HASH'},
                            {'AttributeName': 'nameEnglish', 'KeyType': 'RANGE'}
                        ],
                        'Projection': {
                            'ProjectionType': 'INCLUDE',
                            'NonKeyAttributes': ['schemeId', 'categories', 'level', 'ministry']
                        }
                    }
                },
                {
                    'Create': {
                        'IndexName': 'status-benefit-index',
                        'KeySchema': [
                            {'AttributeName': 'status', 'KeyType': 'HASH'},
                            {'AttributeName': 'annualBenefit', 'KeyType': 'RANGE'}
                        ],
                        'Projection': {
                            'ProjectionType': 'INCLUDE',
                            'NonKeyAttributes': ['schemeId', 'categories', 'level', 'ministry']
                        }
                    }
                }
            ]
        )
        print("Successfully initiated GSI creation.")
    except Exception as e:
        print(f"Error or already creating/created: {e}")

if __name__ == "__main__":
    create_gsis()
