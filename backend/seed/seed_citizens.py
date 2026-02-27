"""
Seed 3 demo personas + 15 household records into DynamoDB SarathiCitizens table.

Prerequisites:
  - AWS CLI configured with `aws configure` (region: ap-south-1)
  - pip install boto3
  - DynamoDB table 'SarathiCitizens' created with partition key 'citizenId' (String)

Usage:
  python seed_citizens.py
"""

import boto3
import random

dynamodb = boto3.resource('dynamodb', region_name='ap-south-1')
table = dynamodb.Table('SarathiCitizens')

# ---------- 3 Demo Personas ----------
DEMO_PERSONAS = [
    {
        'citizenId': 'demo-kamla-devi',
        'name': 'Kamla Devi',
        'age': 55,
        'gender': 'female',
        'state': 'UP',
        'monthlyIncome': 2000,
        'category': 'SC',
        'isWidow': 'true',
        'occupation': 'any',
        'panchayatId': 'rampur-barabanki-up',
        'status': 'eligible',
        'matchedSchemes': [],
        'enrolledSchemes': [],
    },
    {
        'citizenId': 'demo-ramu-prasad',
        'name': 'Ramu Prasad',
        'age': 30,
        'gender': 'male',
        'state': 'Bihar',
        'monthlyIncome': 8000,
        'category': 'OBC',
        'isWidow': 'false',
        'occupation': 'any',
        'panchayatId': 'rampur-barabanki-up',
        'status': 'eligible',
        'matchedSchemes': [],
        'enrolledSchemes': [],
    },
    {
        'citizenId': 'demo-meena-sarpanch',
        'name': 'Meena Ji',
        'age': 42,
        'gender': 'female',
        'state': 'Rajasthan',
        'monthlyIncome': 15000,
        'category': 'OBC',
        'isWidow': 'false',
        'occupation': 'any',
        'panchayatId': 'rampur-barabanki-up',
        'status': 'enrolled',
        'matchedSchemes': [],
        'enrolledSchemes': [],
    },
]

# ---------- 15 additional household records ----------
FIRST_NAMES_M = ['Rajesh', 'Suresh', 'Mohan', 'Dinesh', 'Ramesh', 'Vijay', 'Anil', 'Sanjay']
FIRST_NAMES_F = ['Sunita', 'Geeta', 'Anita', 'Poonam', 'Savitri', 'Rekha', 'Laxmi', 'Kavita']
CATEGORIES = ['SC', 'ST', 'OBC', 'General']
# Status distribution: ~60% enrolled, ~25% eligible, ~15% none
STATUS_WEIGHTS = ['enrolled'] * 9 + ['eligible'] * 4 + ['none'] * 2

def generate_households(count=15):
    households = []
    for i in range(1, count + 1):
        gender = random.choice(['male', 'female'])
        name = random.choice(FIRST_NAMES_M if gender == 'male' else FIRST_NAMES_F)
        age = random.randint(18, 75)
        income = random.choice([1500, 2000, 2500, 3000, 4000, 5000, 8000, 10000])
        status = random.choice(STATUS_WEIGHTS)
        is_widow = 'true' if gender == 'female' and random.random() < 0.15 else 'false'

        households.append({
            'citizenId': f'hh-rampur-{i:03d}',
            'name': f'{name} ({i})',
            'age': age,
            'gender': gender,
            'state': 'UP',
            'monthlyIncome': income,
            'category': random.choice(CATEGORIES),
            'isWidow': is_widow,
            'occupation': random.choice(['farmer', 'any', 'any', 'farmer']),
            'panchayatId': 'rampur-barabanki-up',
            'status': status,
            'matchedSchemes': [],
            'enrolledSchemes': [],
        })
    return households


def seed():
    all_records = DEMO_PERSONAS + generate_households(15)
    print(f"Seeding {len(all_records)} citizens into SarathiCitizens table...")

    with table.batch_writer() as batch:
        for citizen in all_records:
            batch.put_item(Item=citizen)
            print(f"  ✅ {citizen['citizenId']} — {citizen['name']} ({citizen['status']})")

    print(f"\nDone! {len(all_records)} citizen records seeded successfully.")


if __name__ == '__main__':
    seed()
