"""
Seed SarathiPanchayats from the frontend's processed village JSON files.

These files already contain panchayatCode and panchayatName for each village.
Located in: sarathi-frontend/public/data/locations/villages/{state}/{district}/{block}.json

Usage:
  python seed_panchayats.py                          # seed ALL available states
  python seed_panchayats.py --dry-run                # preview without writing

Throttled to ~20 writes/sec to stay within DynamoDB free-tier WCU.
"""
import json
import boto3
import time
import sys
import os
import glob
import argparse

REGION = 'us-east-1'
TABLE_NAME = 'SarathiPanchayats'
VILLAGES_DIR = os.path.join(os.path.dirname(__file__), '..', '..', 'sarathi-frontend', 'public', 'data', 'locations', 'villages')

dynamodb = boto3.resource('dynamodb', region_name=REGION)
table = dynamodb.Table(TABLE_NAME)


def unslugify(slug):
    """Convert a slug like 'uttar_pradesh' back to 'Uttar Pradesh'."""
    return slug.replace('_', ' ').title()


def extract_panchayats_from_frontend():
    """Scan all village JSON files and extract unique panchayats."""
    panchayats = {}  # keyed by panchayatCode to deduplicate

    if not os.path.exists(VILLAGES_DIR):
        print(f"[ERR] Villages directory not found: {VILLAGES_DIR}")
        return []

    # Walk: villages/{state_slug}/{district_slug}/{block_slug}.json
    state_dirs = [d for d in os.listdir(VILLAGES_DIR) if os.path.isdir(os.path.join(VILLAGES_DIR, d))]

    for state_slug in sorted(state_dirs):
        state_name = unslugify(state_slug)
        state_path = os.path.join(VILLAGES_DIR, state_slug)

        district_dirs = [d for d in os.listdir(state_path) if os.path.isdir(os.path.join(state_path, d))]
        for district_slug in sorted(district_dirs):
            district_name = unslugify(district_slug)
            district_path = os.path.join(state_path, district_slug)

            block_files = glob.glob(os.path.join(district_path, '*.json'))
            for block_file in block_files:
                block_name = unslugify(os.path.splitext(os.path.basename(block_file))[0])

                try:
                    with open(block_file, 'r', encoding='utf-8') as f:
                        villages = json.load(f)
                except Exception as e:
                    print(f"  [WARN] Failed to read {block_file}: {e}")
                    continue

                for village in villages:
                    pc = village.get('panchayatCode', '').strip()
                    pn = village.get('panchayatName', '').strip()
                    vcode = village.get('code', '').strip()

                    if not pc or pc in ('', 'nan', 'NA', 'None'):
                        continue

                    pid = f"LGD_{pc}"
                    if pid not in panchayats:
                        panchayats[pid] = {
                            'panchayatId': pid,
                            'lgdCode': pc,
                            'panchayatName': pn or f'{block_name} GP',
                            'block': block_name,
                            'district': district_name,
                            'state': state_name,
                            'status': 'unclaimed',
                            'verified': False,
                            'villagesCovered': [],
                        }
                    # Add this village to coverage list
                    if vcode and vcode not in panchayats[pid]['villagesCovered']:
                        panchayats[pid]['villagesCovered'].append(vcode)

    return list(panchayats.values())


def seed(panchayats, dry_run=False, batch_size=25, delay=1.5):
    """Write panchayat records to DynamoDB with throttling."""
    total = len(panchayats)
    print(f"\n{'[DRY RUN] ' if dry_run else ''}Seeding {total} panchayats to {TABLE_NAME}...")

    written = 0
    for i in range(0, total, batch_size):
        batch = panchayats[i:i + batch_size]
        if not dry_run:
            with table.batch_writer() as writer:
                for p in batch:
                    item = {
                        'panchayatId': p['panchayatId'],
                        'lgdCode': p['lgdCode'],
                        'panchayatName': p['panchayatName'],
                        'block': p['block'],
                        'district': p['district'],
                        'state': p['state'],
                        'status': p['status'],
                        'verified': p['verified'],
                        'villagesCovered': p['villagesCovered'],
                    }
                    writer.put_item(Item=item)
        written += len(batch)
        pct = round(written / total * 100)
        sys.stdout.write(f"\r  [{pct}%] {written}/{total} records written")
        sys.stdout.flush()
        if not dry_run and i + batch_size < total:
            time.sleep(delay)  # throttle to ~17 writes/sec

    print(f"\n[OK] {written} panchayats seeded successfully.")
    return written


def main():
    parser = argparse.ArgumentParser(description='Seed SarathiPanchayats from frontend village data')
    parser.add_argument('--dry-run', action='store_true', help='Preview without writing')
    args = parser.parse_args()

    print(f"Scanning village files in {VILLAGES_DIR}...")
    panchayats = extract_panchayats_from_frontend()

    if not panchayats:
        print("[WARN] No panchayats found in frontend village data.")
        return

    # Show summary
    states = sorted(set(p['state'] for p in panchayats))
    districts = set(p['district'] for p in panchayats)
    print(f"\nExtracted {len(panchayats)} unique panchayats")
    print(f"  States: {len(states)} — {states}")
    print(f"  Districts: {len(districts)}")
    print(f"  Sample: {panchayats[0]['panchayatName']} ({panchayats[0]['panchayatId']}), {panchayats[0]['district']}, {panchayats[0]['state']}")

    seed(panchayats, dry_run=args.dry_run)


if __name__ == '__main__':
    main()
