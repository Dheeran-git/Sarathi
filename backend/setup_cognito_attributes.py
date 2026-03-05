"""Add custom attributes to the Panchayat Cognito User Pool."""
import boto3

REGION = 'us-east-1'
POOL_ID = 'us-east-1_lvbRzfVqx'  # SarathiPanchayat pool

cognito = boto3.client('cognito-idp', region_name=REGION)

ATTRIBUTES = [
    {'Name': 'officialName',  'AttributeDataType': 'String', 'Mutable': True,  'StringAttributeConstraints': {'MinLength': '0', 'MaxLength': '128'}},
    {'Name': 'mobileNumber',  'AttributeDataType': 'String', 'Mutable': True,  'StringAttributeConstraints': {'MinLength': '0', 'MaxLength': '16'}},
]

print(f"Adding {len(ATTRIBUTES)} custom attributes to pool {POOL_ID}...")

try:
    cognito.add_custom_attributes(
        UserPoolId=POOL_ID,
        CustomAttributes=ATTRIBUTES,
    )
    print("[OK] Custom attributes added successfully:")
    for a in ATTRIBUTES:
        print(f"  {a['Name']} (mutable={a['Mutable']})")
except Exception as e:
    if 'Existing custom attribute' in str(e):
        print("[WARN] Some attributes already exist — this is OK.")
    else:
        print(f"[ERR] {e}")
