"""
Seed all 18 government schemes into DynamoDB SarathiSchemes table.

Prerequisites:
  - AWS CLI configured with `aws configure` (region: ap-south-1)
  - pip install boto3
  - DynamoDB table 'SarathiSchemes' created with partition key 'schemeId' (String)

Usage:
  python seed_schemes.py
"""

import json
import boto3
import os

dynamodb = boto3.resource('dynamodb', region_name='ap-south-1')
table = dynamodb.Table('SarathiSchemes')

def seed():
    # Load scheme data from JSON file
    data_path = os.path.join(os.path.dirname(__file__), 'scheme_data.json')
    with open(data_path, 'r', encoding='utf-8') as f:
        schemes = json.load(f)

    print(f"Seeding {len(schemes)} schemes into SarathiSchemes table...")

    with table.batch_writer() as batch:
        for scheme in schemes:
            batch.put_item(Item=scheme)
            print(f"  ✅ {scheme['schemeId']} — {scheme['nameEnglish']}")

    print(f"\nDone! {len(schemes)} schemes seeded successfully.")

if __name__ == '__main__':
    seed()
