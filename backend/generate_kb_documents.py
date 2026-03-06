"""
generate_kb_documents.py — One-time setup script
Reads backend/lambdas/schemes.json, generates structured .txt per scheme,
and uploads all 18 files to the sarathi-knowledge-base-docs S3 bucket.
Run once: python backend/generate_kb_documents.py
"""
import json
import os
import boto3

KB_BUCKET = 'sarathi-knowledge-base-docs'
SCHEMES_PATH = os.path.join(os.path.dirname(__file__), 'lambdas', 'schemes.json')
REGION = 'us-east-1'

s3 = boto3.client('s3', region_name=REGION)


def scheme_to_text(scheme):
    """Convert a scheme dict to structured plain text for KB ingestion."""
    lines = []
    lines.append(f"SCHEME: {scheme.get('nameEnglish', scheme.get('name', 'Unknown'))}")
    lines.append(f"SCHEME_ID: {scheme.get('schemeId', '')}")
    lines.append(f"MINISTRY: {scheme.get('ministry', '')}")
    lines.append(f"CATEGORY: {scheme.get('category', '')}")
    lines.append("")

    lines.append("DESCRIPTION:")
    lines.append(scheme.get('description', scheme.get('benefitType', 'Government welfare scheme')))
    lines.append("")

    lines.append("ELIGIBILITY:")
    lines.append(f"  - Age range: {scheme.get('minAge', 0)} to {scheme.get('maxAge', 99)} years")
    lines.append(f"  - Maximum monthly income: Rs. {scheme.get('maxMonthlyIncome', 'No limit')}")
    lines.append(f"  - Gender: {scheme.get('gender', 'Any')}")
    lines.append(f"  - Social categories: {scheme.get('categories', 'All categories')}")
    lines.append(f"  - Occupation: {scheme.get('occupation', 'Any')}")
    if scheme.get('isWidow') == 'true':
        lines.append("  - Only for widows")
    lines.append("")

    lines.append("BENEFITS:")
    lines.append(f"  - Annual benefit: Rs. {scheme.get('annualBenefit', 0)}")
    lines.append(f"  - Benefit type: {scheme.get('benefitType', '')}")
    lines.append("")

    lines.append("HOW TO APPLY:")
    lines.append(f"  - Official portal: {scheme.get('applyUrl', 'myscheme.gov.in')}")

    docs_en = scheme.get('documentsRequiredEn') or scheme.get('documentsRequired') or []
    if docs_en:
        lines.append("  - Required documents:")
        for doc in docs_en:
            lines.append(f"    * {doc}")
    lines.append("")

    lines.append("APPLICATION STEPS:")
    lines.append("  1. Gather all required documents listed above")
    lines.append(f"  2. Visit the official portal: {scheme.get('applyUrl', 'myscheme.gov.in')}")
    lines.append("  3. Register/Login with your Aadhaar number or mobile number")
    lines.append("  4. Fill in personal details and upload documents")
    lines.append("  5. Submit application and save the reference number")
    lines.append("  6. Track application status using the reference number on the portal")
    lines.append("")

    state = scheme.get('state', 'All')
    if isinstance(state, list):
        state = ', '.join(state)
    lines.append(f"APPLICABLE STATES: {state}")

    return '\n'.join(lines)


def main():
    print(f"Reading schemes from: {SCHEMES_PATH}")
    with open(SCHEMES_PATH, 'r', encoding='utf-8') as f:
        schemes = json.load(f)

    print(f"Found {len(schemes)} schemes")

    # Ensure bucket exists
    try:
        s3.head_bucket(Bucket=KB_BUCKET)
        print(f"Bucket {KB_BUCKET} exists")
    except Exception:
        print(f"Creating bucket {KB_BUCKET}...")
        s3.create_bucket(Bucket=KB_BUCKET)
        s3.put_bucket_versioning(
            Bucket=KB_BUCKET,
            VersioningConfiguration={'Status': 'Enabled'}
        )
        print("Bucket created")

    uploaded = 0
    for scheme in schemes:
        scheme_id = scheme.get('schemeId', f'scheme-{uploaded}')
        text_content = scheme_to_text(scheme)
        s3_key = f"schemes/{scheme_id}.txt"

        s3.put_object(
            Bucket=KB_BUCKET,
            Key=s3_key,
            Body=text_content.encode('utf-8'),
            ContentType='text/plain',
        )
        print(f"  [OK] Uploaded {s3_key}")
        uploaded += 1

    print(f"\nUploaded {uploaded} scheme documents to s3://{KB_BUCKET}/schemes/")
    print("\nNext step: Run setup_knowledge_base.py to create the Bedrock Knowledge Base")


if __name__ == '__main__':
    main()
