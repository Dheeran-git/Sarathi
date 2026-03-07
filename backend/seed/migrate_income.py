"""
migrate_income.py — One-time migration script to convert annual income values to monthly.

After the UI was changed from "annual income" to "monthly income", existing citizen
records may still have annual values. This script scans SarathiCitizens and divides
income values by 12 for records where income > 50000 (likely annual, not monthly).

Usage:
  python backend/seed/migrate_income.py          # dry run (default)
  python backend/seed/migrate_income.py --apply  # apply changes

Requires AWS credentials with DynamoDB read/write access.
"""
import sys
import boto3
from decimal import Decimal

REGION = 'us-east-1'
TABLE_NAME = 'SarathiCitizens'
ANNUAL_THRESHOLD = 50000  # Values above this are assumed to be annual

DRY_RUN = '--apply' not in sys.argv

dynamodb = boto3.resource('dynamodb', region_name=REGION)
table = dynamodb.Table(TABLE_NAME)


def migrate():
    print(f"{'DRY RUN' if DRY_RUN else 'APPLYING CHANGES'} — scanning {TABLE_NAME}...")

    response = table.scan()
    items = response.get('Items', [])
    while 'LastEvaluatedKey' in response:
        response = table.scan(ExclusiveStartKey=response['LastEvaluatedKey'])
        items.extend(response.get('Items', []))

    migrated = 0
    skipped = 0

    for item in items:
        citizen_id = item.get('citizenId', 'unknown')
        income = item.get('income') or item.get('monthlyIncome')

        if income is None:
            skipped += 1
            continue

        income_val = float(income)
        if income_val <= ANNUAL_THRESHOLD:
            skipped += 1
            continue

        new_income = Decimal(str(round(income_val / 12)))
        print(f"  {citizen_id}: {income_val} -> {new_income}")

        if not DRY_RUN:
            update_expr = 'SET income = :inc'
            expr_values = {':inc': new_income}

            if 'monthlyIncome' in item:
                update_expr += ', monthlyIncome = :inc'

            table.update_item(
                Key={'citizenId': citizen_id},
                UpdateExpression=update_expr,
                ExpressionAttributeValues=expr_values,
            )

        migrated += 1

    print(f"\nTotal scanned: {len(items)}")
    print(f"Migrated: {migrated}")
    print(f"Skipped (already monthly or no income): {skipped}")

    if DRY_RUN and migrated > 0:
        print("\nThis was a DRY RUN. Run with --apply to write changes.")


if __name__ == '__main__':
    migrate()
