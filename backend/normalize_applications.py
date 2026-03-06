import boto3
from boto3.dynamodb.conditions import Attr

dynamodb = boto3.resource('dynamodb', region_name='us-east-1')
table = dynamodb.Table('SarathiApplications')

def normalize_existing():
    print("Scanning for applications needing normalization...")
    resp = table.scan()
    items = resp.get('Items', [])
    
    count = 0
    for item in items:
        pid = item.get('panchayatId')
        # If numeric and doesn't have LGD_ prefix
        if pid and str(pid).isdigit() and not str(pid).startswith('LGD_'):
            new_pid = f"LGD_{pid}"
            print(f"Normalizing {item['applicationId']}: {pid} -> {new_pid}")
            table.update_item(
                Key={'applicationId': item['applicationId']},
                UpdateExpression='SET panchayatId = :p',
                ExpressionAttributeValues={':p': new_pid}
            )
            count += 1
            
    print(f"Normalized {count} items.")

if __name__ == "__main__":
    normalize_existing()
