"""
A4: Create SarathiConflicts table and seed 10 conflict rules.
Run once: python backend/seed/seed_conflicts.py
"""
import boto3, time

dynamodb = boto3.resource('dynamodb', region_name='us-east-1')
client   = boto3.client('dynamodb', region_name='us-east-1')

TABLE_NAME = 'SarathiConflicts'

# Create table if needed
existing = client.list_tables()['TableNames']
if TABLE_NAME not in existing:
    print(f"Creating {TABLE_NAME}...")
    client.create_table(
        TableName=TABLE_NAME,
        AttributeDefinitions=[{'AttributeName': 'conflictId', 'AttributeType': 'S'}],
        KeySchema=[{'AttributeName': 'conflictId', 'KeyType': 'HASH'}],
        BillingMode='PAY_PER_REQUEST',
    )
    # Wait for ACTIVE
    waiter = client.get_waiter('table_exists')
    waiter.wait(TableName=TABLE_NAME)
    print(f"{TABLE_NAME} created and ACTIVE.")
else:
    print(f"{TABLE_NAME} already exists, skipping creation.")

table = dynamodb.Table(TABLE_NAME)

CONFLICTS = [
    {
        'conflictId': 'pmegp-nrlm-shg',
        'scheme1': 'pmegp',
        'scheme2': 'nrlm-shg',
        'reason': 'Cannot receive two entrepreneurship loans simultaneously',
        'recommended': 'nrlm-shg',
        'reasoning': 'NRLM SHG has lower interest rate — better for first-time borrowers',
    },
    {
        'conflictId': 'mgnregs-pmegp',
        'scheme1': 'mgnregs',
        'scheme2': 'pmegp',
        'reason': 'PMEGP income from business disqualifies from MGNREGS wage employment',
        'recommended': 'pmegp',
        'reasoning': 'PMEGP provides higher long-term income than MGNREGS daily wages',
    },
    {
        'conflictId': 'pmjdy-pmjjby',
        'scheme1': 'pmjdy',
        'scheme2': 'pmjjby',
        'reason': 'PMJJBY life insurance is only for PMJDY account holders — not a conflict but a sequence',
        'recommended': 'pmjjby',
        'reasoning': 'Enroll PMJDY first, then PMJJBY is automatically available',
    },
    {
        'conflictId': 'nsp-post-matric-sc',
        'scheme1': 'nsp',
        'scheme2': 'post-matric-sc',
        'reason': 'Cannot receive two central scholarships for the same course simultaneously',
        'recommended': 'post-matric-sc',
        'reasoning': 'Post Matric SC scholarship has higher stipend and broader coverage',
    },
    {
        'conflictId': 'pmay-gramin-pmay-urban',
        'scheme1': 'pmay-gramin',
        'scheme2': 'pmay-urban',
        'reason': 'Housing assistance is provided under only one scheme based on location',
        'recommended': 'pmay-gramin',
        'reasoning': 'Rural households should apply under PMAY-G for higher grant amount',
    },
    {
        'conflictId': 'deen-dayal-pmegp',
        'scheme1': 'deen-dayal-upadhyaya',
        'scheme2': 'pmegp',
        'reason': 'Both provide skill training and business support — overlap in coverage',
        'recommended': 'pmegp',
        'reasoning': 'PMEGP includes both training and capital subsidy in one scheme',
    },
    {
        'conflictId': 'ignoaps-nvbdp',
        'scheme1': 'ignoaps',
        'scheme2': 'nvbdp',
        'reason': 'State and central widow pension cannot both be claimed in some states',
        'recommended': 'ignoaps',
        'reasoning': 'IGNOAPS is a central scheme with standardized benefit — more reliable',
    },
    {
        'conflictId': 'pm-ujjwala-state-lpg',
        'scheme1': 'pm-ujjwala',
        'scheme2': 'state-lpg-subsidy',
        'reason': 'Dual LPG subsidy — central and state subsidies cannot be stacked on same connection',
        'recommended': 'pm-ujjwala',
        'reasoning': 'PMUY provides free connection + first refill — higher initial value',
    },
    {
        'conflictId': 'svamitva-pmay-gramin',
        'scheme1': 'svamitva',
        'scheme2': 'pmay-gramin',
        'reason': 'SVAMITVA property card required before PMAY-G housing loan in some states',
        'recommended': 'svamitva',
        'reasoning': 'Complete SVAMITVA registration first to strengthen PMAY-G application',
    },
    {
        'conflictId': 'pm-kisan-pm-kisan-maan',
        'scheme1': 'pm-kisan',
        'scheme2': 'pm-kisan-maan-dhan',
        'reason': 'PM-KISAN income may exceed threshold for PM Kisan Maan Dhan pension scheme',
        'recommended': 'pm-kisan',
        'reasoning': 'PM-KISAN direct income transfer has no income-eligibility conflict for most small farmers',
    },
]

with table.batch_writer() as batch:
    for rule in CONFLICTS:
        batch.put_item(Item=rule)

print(f"Seeded {len(CONFLICTS)} conflict rules into {TABLE_NAME}.")
