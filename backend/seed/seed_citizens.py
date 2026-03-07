"""
Seed 3 demo personas + 15 household records into DynamoDB SarathiCitizens table.
Each citizen gets a real ward assignment and pre-computed matchedSchemes using
the eligibility logic from scheme_data.json.

Prerequisites:
  - AWS CLI configured with `aws configure` (region: us-east-1)
  - pip install boto3
  - DynamoDB table 'SarathiCitizens' created with partition key 'citizenId' (String)

Usage:
  python seed_citizens.py
"""

import boto3
import random
import json
import os
from datetime import datetime, timezone

dynamodb = boto3.resource('dynamodb', region_name='us-east-1')
table = dynamodb.Table('SarathiCitizens')

# Load scheme data for eligibility matching
_data_path = os.path.join(os.path.dirname(__file__), 'scheme_data.json')
with open(_data_path, 'r', encoding='utf-8') as _f:
    ALL_SCHEMES = json.load(_f)


def compute_matched_schemes(age, gender, monthly_income, is_widow_str, occupation, category):
    """Replicate eligibility_engine.py logic to pre-compute matched schemes for seed data."""
    is_widow = is_widow_str in ('true', True)
    matched = []
    for s in ALL_SCHEMES:
        if age < int(s.get('minAge', 0)):
            continue
        if age > int(s.get('maxAge', 99)):
            continue
        if monthly_income > int(s.get('maxMonthlyIncome', 99999)):
            continue
        scheme_gender = s.get('gender', 'any')
        if scheme_gender != 'any' and scheme_gender != gender:
            continue
        widow_req = s.get('isWidow', 'any')
        if widow_req == 'true' and not is_widow:
            continue
        scheme_occ = s.get('occupation', 'any')
        if scheme_occ != 'any' and scheme_occ != occupation:
            continue
        cats = [c.strip() for c in str(s.get('categories', 'SC,ST,OBC,General')).split(',')]
        if category not in cats and 'General' not in cats:
            continue
        matched.append({
            'schemeId': s['schemeId'],
            'nameHindi': s.get('nameHindi', ''),
            'nameEnglish': s.get('nameEnglish', ''),
            'annualBenefit': int(s.get('annualBenefit', 0)),
        })
    matched.sort(key=lambda x: x['annualBenefit'], reverse=True)
    return matched


# ---------- 3 Demo Personas ----------
def _make_persona(citizen_id, name, age, gender, state, monthly_income, category,
                  is_widow, occupation, status, ward):
    matched = compute_matched_schemes(age, gender, monthly_income, is_widow, occupation, category)
    estimated_benefit = sum(s['annualBenefit'] for s in matched)
    return {
        'citizenId': citizen_id,
        'name': name,
        'age': age,
        'gender': gender,
        'state': state,
        'monthlyIncome': monthly_income,
        'category': category,
        'isWidow': is_widow,
        'occupation': occupation,
        'panchayatId': 'rampur-barabanki-up',
        'ward': ward,
        'status': status,
        'matchedSchemes': matched,
        'enrolledSchemes': [],
        'totalAnnualBenefit': estimated_benefit,
        'updatedAt': datetime.now(timezone.utc).isoformat(),
        'createdAt': datetime.now(timezone.utc).isoformat(),
    }


DEMO_PERSONAS = [
    _make_persona('demo-kamla-devi', 'Kamla Devi', 55, 'female', 'UP',
                  2000, 'SC', 'true', 'any', 'eligible', 'Ward 1'),
    _make_persona('demo-ramu-prasad', 'Ramu Prasad', 30, 'male', 'Bihar',
                  8000, 'OBC', 'false', 'any', 'eligible', 'Ward 2'),
    _make_persona('demo-meena-sarpanch', 'Meena Ji', 42, 'female', 'Rajasthan',
                  15000, 'OBC', 'false', 'any', 'enrolled', 'Ward 3'),
]

# ---------- 15 additional household records ----------
FIRST_NAMES_M = ['Rajesh', 'Suresh', 'Mohan', 'Dinesh', 'Ramesh', 'Vijay', 'Anil', 'Sanjay']
FIRST_NAMES_F = ['Sunita', 'Geeta', 'Anita', 'Poonam', 'Savitri', 'Rekha', 'Laxmi', 'Kavita']
CATEGORIES = ['SC', 'ST', 'OBC', 'General']
# Status distribution: ~60% enrolled, ~25% eligible, ~15% none
STATUS_WEIGHTS = ['enrolled'] * 9 + ['eligible'] * 4 + ['none'] * 2


def generate_households(count=15):
    households = []
    # Use a fixed seed for reproducibility so re-running creates the same dataset
    rng = random.Random(42)
    for i in range(1, count + 1):
        gender = rng.choice(['male', 'female'])
        name = rng.choice(FIRST_NAMES_M if gender == 'male' else FIRST_NAMES_F)
        age = rng.randint(18, 75)
        income = rng.choice([1500, 2000, 2500, 3000, 4000, 5000, 8000, 10000])
        status = rng.choice(STATUS_WEIGHTS)
        category = rng.choice(CATEGORIES)
        is_widow = 'true' if gender == 'female' and rng.random() < 0.15 else 'false'
        occupation = rng.choice(['farmer', 'any', 'any', 'farmer'])
        ward = f'Ward {((i - 1) % 6) + 1}'  # Distribute across Ward 1–6

        matched = compute_matched_schemes(age, gender, income, is_widow, occupation, category)
        estimated_benefit = sum(s['annualBenefit'] for s in matched)

        households.append({
            'citizenId': f'hh-rampur-{i:03d}',
            'name': f'{name} ({i})',
            'age': age,
            'gender': gender,
            'state': 'UP',
            'monthlyIncome': income,
            'category': category,
            'isWidow': is_widow,
            'occupation': occupation,
            'panchayatId': 'rampur-barabanki-up',
            'ward': ward,
            'status': status,
            'matchedSchemes': matched,
            'enrolledSchemes': [],
            'totalAnnualBenefit': estimated_benefit,
            'updatedAt': datetime.now(timezone.utc).isoformat(),
            'createdAt': datetime.now(timezone.utc).isoformat(),
        })
    return households


def seed():
    all_records = DEMO_PERSONAS + generate_households(15)
    print(f"Seeding {len(all_records)} citizens into SarathiCitizens table...")

    with table.batch_writer() as batch:
        for citizen in all_records:
            batch.put_item(Item=citizen)
            schemes_count = len(citizen.get('matchedSchemes', []))
            benefit = citizen.get('totalAnnualBenefit', 0)
            print(f"  [OK] {citizen['citizenId']} - {citizen['name']} "
                  f"({citizen['status']}, {citizen['ward']}, "
                  f"{schemes_count} schemes, Rs.{benefit:,})")

    print(f"\nDone! {len(all_records)} citizen records seeded successfully.")


if __name__ == '__main__':
    seed()
