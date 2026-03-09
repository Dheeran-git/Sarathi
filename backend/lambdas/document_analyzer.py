"""
document_analyzer — POST /document/analyze, POST /document/verify-ai
Extracts text from uploaded documents using Amazon Textract,
maps entities via Amazon Comprehend, and stores results in DynamoDB.
Supports: aadhaar, income_cert, ration_card, job_card, bank_statement.
AI verification: Bedrock explains extraction results and suggests corrections.
Profile auto-update: Extracted fields update citizen profile in DynamoDB.
"""
import json
import os
import re
import uuid
import time
import boto3
from datetime import datetime, timedelta, timezone

REGION = 'us-east-1'
DOCUMENTS_BUCKET = os.environ.get('DOCUMENTS_BUCKET', os.environ.get('DOCUMENT_BUCKET', 'sarathi-documents'))
EXTRACTIONS_TABLE = os.environ.get('EXTRACTIONS_TABLE', 'SarathiDocumentExtractions')
BEDROCK_MODEL_ID = os.environ.get('BEDROCK_MODEL_ID', 'amazon.nova-pro-v1:0')

textract = boto3.client('textract', region_name=REGION)
comprehend = boto3.client('comprehend', region_name=REGION)
bedrock = boto3.client('bedrock-runtime', region_name=REGION)
dynamodb = boto3.resource('dynamodb', region_name=REGION)
extractions_table = dynamodb.Table(EXTRACTIONS_TABLE)
citizens_table = dynamodb.Table('SarathiCitizens')


def cors_headers():
    return {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Amz-Date,X-Api-Key',
        'Access-Control-Allow-Methods': 'GET,POST,PATCH,OPTIONS',
        'Content-Type': 'application/json',
    }


def _extract_text_textract(bucket, key):
    """Detect document text using Textract sync API."""
    response = textract.detect_document_text(
        Document={'S3Object': {'Bucket': bucket, 'Name': key}}
    )
    lines = []
    for block in response.get('Blocks', []):
        if block.get('BlockType') == 'LINE':
            text = block.get('Text', '').strip()
            confidence = block.get('Confidence', 0)
            if text:
                lines.append({'text': text, 'confidence': confidence})
    return lines


def _extract_entities_comprehend(full_text):
    """Extract entities and PII from text using Comprehend."""
    entities = []
    pii_entities = []

    if not full_text.strip():
        return entities, pii_entities

    # Truncate to Comprehend max (5000 bytes UTF-8)
    truncated = full_text[:4900]

    try:
        ent_response = comprehend.detect_entities(Text=truncated, LanguageCode='en')
        entities = ent_response.get('Entities', [])
    except Exception as e:
        print(f"[WARN] Comprehend entities failed: {e}")

    try:
        pii_response = comprehend.detect_pii_entities(Text=truncated, LanguageCode='en')
        pii_entities = pii_response.get('Entities', [])
    except Exception as e:
        print(f"[WARN] Comprehend PII failed: {e}")

    return entities, pii_entities


def _parse_aadhaar(lines, text, entities, pii_entities):
    """Map Aadhaar card fields."""
    fields = {}
    confidences = {}

    # Name — first PERSON entity
    person_entities = [e for e in entities if e.get('Type') == 'PERSON']
    if person_entities:
        fields['name'] = person_entities[0]['Text']
        confidences['name'] = round(person_entities[0].get('Score', 0) * 100)

    # DOB → age
    dob_pattern = re.compile(r'\b(\d{2})[/\-.](\d{2})[/\-.](\d{4})\b')
    year_pattern = re.compile(r'\bYear of Birth[:\s]+(\d{4})\b', re.IGNORECASE)
    for line in lines:
        m = dob_pattern.search(line['text'])
        if m:
            try:
                birth_year = int(m.group(3))
                age = datetime.now().year - birth_year
                fields['age'] = age
                confidences['age'] = round(line['confidence'])
                break
            except ValueError:
                pass
        m2 = year_pattern.search(line['text'])
        if m2:
            try:
                age = datetime.now().year - int(m2.group(1))
                fields['age'] = age
                confidences['age'] = round(line['confidence'])
                break
            except ValueError:
                pass

    # Gender
    for line in lines:
        lower = line['text'].lower()
        if 'male' in lower and 'fe' not in lower:
            fields['gender'] = 'male'
            confidences['gender'] = round(line['confidence'])
            break
        elif 'female' in lower:
            fields['gender'] = 'female'
            confidences['gender'] = round(line['confidence'])
            break

    # Aadhaar last 4 digits from PII or pattern
    aadhaar_pattern = re.compile(r'\b\d{4}\s\d{4}\s\d{4}\b')
    masked_pattern = re.compile(r'[Xx]{4}\s[Xx]{4}\s(\d{4})')
    for line in lines:
        m = aadhaar_pattern.search(line['text'])
        if m:
            fields['aadhaarLast4'] = m.group(0).replace(' ', '')[-4:]
            confidences['aadhaarLast4'] = round(line['confidence'])
            break
        m2 = masked_pattern.search(line['text'])
        if m2:
            fields['aadhaarLast4'] = m2.group(1)
            confidences['aadhaarLast4'] = round(line['confidence'])
            break

    # Mobile number (10-digit Indian mobile starting with 6-9)
    mobile_pattern = re.compile(r'\b[6-9]\d{9}\b')
    for line in lines:
        m = mobile_pattern.search(line['text'])
        if m:
            fields['mobile'] = m.group(0)
            confidences['mobile'] = round(line['confidence'])
            break

    # Address — LOCATION entities
    location_entities = [e for e in entities if e.get('Type') == 'LOCATION']
    if location_entities:
        fields['address'] = ', '.join(e['Text'] for e in location_entities[:3])
        confidences['address'] = round(location_entities[0].get('Score', 0) * 100)

    return fields, confidences


def _parse_income_cert(lines, text, entities, pii_entities):
    """Map income certificate fields."""
    fields = {}
    confidences = {}

    person_entities = [e for e in entities if e.get('Type') == 'PERSON']
    if person_entities:
        fields['name'] = person_entities[0]['Text']
        confidences['name'] = round(person_entities[0].get('Score', 0) * 100)

    # Annual income → monthly income
    income_pattern = re.compile(r'(?:Rs\.?|INR|₹)\s*([\d,]+)', re.IGNORECASE)
    annual_pattern = re.compile(r'annual[^₹\d]*([\d,]+)', re.IGNORECASE)
    for line in lines:
        m = income_pattern.search(line['text'])
        if m:
            try:
                annual = int(m.group(1).replace(',', ''))
                fields['income'] = annual // 12  # Monthly income
                confidences['income'] = round(line['confidence'])
                break
            except ValueError:
                pass
        m2 = annual_pattern.search(line['text'])
        if m2:
            try:
                annual = int(m2.group(1).replace(',', ''))
                fields['income'] = annual // 12
                confidences['income'] = round(line['confidence'])
                break
            except ValueError:
                pass

    # Issuing authority
    org_entities = [e for e in entities if e.get('Type') == 'ORGANIZATION']
    if org_entities:
        fields['issuingAuthority'] = org_entities[0]['Text']
        confidences['issuingAuthority'] = round(org_entities[0].get('Score', 0) * 100)

    return fields, confidences


def _parse_ration_card(lines, text, entities, pii_entities):
    """Map ration card fields."""
    fields = {}
    confidences = {}

    # Family size — look for number of members
    members_pattern = re.compile(r'(?:members|family size)[:\s]+(\d+)', re.IGNORECASE)
    for line in lines:
        m = members_pattern.search(line['text'])
        if m:
            fields['familySize'] = int(m.group(1))
            confidences['familySize'] = round(line['confidence'])
            break

    # Category (APL/BPL/Antyodaya → category mapping)
    cat_map = {
        'bpl': 'SC',  # Below Poverty Line → SC/ST often
        'antyodaya': 'ST',
        'apl': 'General',
    }
    for line in lines:
        lower = line['text'].lower()
        for cat_key, cat_val in cat_map.items():
            if cat_key in lower:
                fields['rationCardType'] = cat_key.upper()
                confidences['rationCardType'] = round(line['confidence'])
                break

    # State from location entities
    location_entities = [e for e in entities if e.get('Type') == 'LOCATION']
    if location_entities:
        fields['state'] = location_entities[0]['Text']
        confidences['state'] = round(location_entities[0].get('Score', 0) * 100)

    return fields, confidences


def _parse_job_card(lines, text, entities, pii_entities):
    """Map MGNREGS job card fields."""
    fields = {}
    confidences = {}

    # Job card number
    jc_pattern = re.compile(r'\b[A-Z]{2}\d{2}[A-Z0-9]{5,}\b')
    for line in lines:
        m = jc_pattern.search(line['text'])
        if m:
            fields['mgnregaJobCardNumber'] = m.group(0)
            confidences['mgnregaJobCardNumber'] = round(line['confidence'])
            break

    # Panchayat and village from location entities
    location_entities = [e for e in entities if e.get('Type') == 'LOCATION']
    if len(location_entities) >= 2:
        fields['panchayatName'] = location_entities[0]['Text']
        fields['village'] = location_entities[1]['Text']
        confidences['panchayatName'] = round(location_entities[0].get('Score', 0) * 100)
        confidences['village'] = round(location_entities[1].get('Score', 0) * 100)
    elif location_entities:
        fields['village'] = location_entities[0]['Text']
        confidences['village'] = round(location_entities[0].get('Score', 0) * 100)

    return fields, confidences


def _parse_bank_statement(lines, text, entities, pii_entities):
    """Map bank statement / passbook fields."""
    fields = {}
    confidences = {}

    # Account holder name — first PERSON entity
    person_entities = [e for e in entities if e.get('Type') == 'PERSON']
    if person_entities:
        fields['name'] = person_entities[0]['Text']
        confidences['name'] = round(person_entities[0].get('Score', 0) * 100)

    # Bank account number — last 4 digits
    # Match patterns like "A/C No: 12345678901234" or "Account Number 12345678901234"
    acct_pattern = re.compile(r'(?:a/?c\s*(?:no\.?|number)?|account\s*(?:no\.?|number)?)[:\s]*(\d{9,18})', re.IGNORECASE)
    acct_standalone = re.compile(r'\b(\d{9,18})\b')
    for line in lines:
        m = acct_pattern.search(line['text'])
        if m:
            fields['bankAccountLast4'] = m.group(1)[-4:]
            confidences['bankAccountLast4'] = round(line['confidence'])
            break
    # Fallback: look for long digit sequences near "account" keyword
    if 'bankAccountLast4' not in fields:
        for i, line in enumerate(lines):
            if 'account' in line['text'].lower() or 'a/c' in line['text'].lower():
                # Check this line and next line for account number
                for check_line in lines[i:i+2]:
                    m = acct_standalone.search(check_line['text'])
                    if m:
                        fields['bankAccountLast4'] = m.group(1)[-4:]
                        confidences['bankAccountLast4'] = round(check_line['confidence'])
                        break
                if 'bankAccountLast4' in fields:
                    break

    # Mobile number
    mobile_pattern = re.compile(r'\b[6-9]\d{9}\b')
    for line in lines:
        m = mobile_pattern.search(line['text'])
        if m:
            fields['mobile'] = m.group(0)
            confidences['mobile'] = round(line['confidence'])
            break

    return fields, confidences


DOCUMENT_PARSERS = {
    'aadhaar': _parse_aadhaar,
    'income_cert': _parse_income_cert,
    'ration_card': _parse_ration_card,
    'job_card': _parse_job_card,
    'bank_statement': _parse_bank_statement,
}


def _ai_verify_extraction(extracted_fields, document_type, citizen_profile=None):
    """Use Bedrock to explain extraction results and suggest corrections."""
    profile_context = ''
    if citizen_profile:
        parts = []
        if citizen_profile.get('name'):
            parts.append(f"Name: {citizen_profile['name']}")
        if citizen_profile.get('age'):
            parts.append(f"Age: {citizen_profile['age']}")
        if citizen_profile.get('income'):
            parts.append(f"Income: ₹{citizen_profile['income']}/month")
        if parts:
            profile_context = f"\nExisting profile: {', '.join(parts)}"

    fields_text = '\n'.join(f"- {k}: {v}" for k, v in extracted_fields.items())
    prompt = (
        f"You are a document verification assistant for Indian welfare services.\n"
        f"Document type: {document_type}\n"
        f"Extracted fields:\n{fields_text}\n"
        f"{profile_context}\n\n"
        f"In simple language that a rural citizen can understand:\n"
        f"1. SUMMARY: Explain what was found in 2-3 sentences\n"
        f"2. VERIFICATION: For each field, say if it looks correct or needs re-upload\n"
        f"3. MISMATCHES: Flag any differences with the existing profile\n"
        f"4. ACTION_NEEDED: What the citizen should do next (if anything)\n"
        f"Keep it under 150 words. Use simple English."
    )
    try:
        payload = {
            "messages": [{"role": "user", "content": [{"text": prompt}]}],
            "inferenceConfig": {"maxTokens": 300, "temperature": 0.3},
        }
        for attempt in range(3):
            try:
                start_ts = time.time()
                resp = bedrock.invoke_model(
                    modelId=BEDROCK_MODEL_ID,
                    body=json.dumps(payload),
                    contentType='application/json',
                    accept='application/json',
                )
                latency_ms = int((time.time() - start_ts) * 1000)
                result = json.loads(resp['body'].read())
                content = result.get('output', {}).get('message', {}).get('content', [])
                text = content[0].get('text', '') if content else ''
                usage = result.get('usage', {})
                print(json.dumps({
                    'ai_invocation': True, 'caller': 'doc_verify',
                    'model': BEDROCK_MODEL_ID,
                    'inputTokens': usage.get('inputTokens', 0),
                    'outputTokens': usage.get('outputTokens', 0),
                    'latencyMs': latency_ms,
                }))
                return text
            except Exception as e:
                if attempt < 2:
                    time.sleep(2 ** attempt)
    except Exception as e:
        print(f"[WARN] AI verification failed: {e}")
    return ''


def _auto_update_citizen_profile(citizen_id, extracted_fields, document_type):
    """Auto-update citizen profile from extracted document fields."""
    if not citizen_id or not extracted_fields:
        return False
    # Map extracted fields to citizen profile fields
    update_expr_parts = []
    expr_values = {}
    field_mapping = {
        'name': 'name',
        'age': 'age',
        'gender': 'gender',
        'income': 'income',
        'state': 'state',
        'familySize': 'familySize',
        'village': 'village',
        'address': 'address',
        'aadhaarLast4': 'aadhaarLast4',
        'mobile': 'mobile',
        'bankAccountLast4': 'bankAccountLast4',
    }
    for extract_key, profile_key in field_mapping.items():
        if extract_key in extracted_fields and extracted_fields[extract_key]:
            update_expr_parts.append(f"{profile_key} = :{profile_key}")
            val = extracted_fields[extract_key]
            expr_values[f':{profile_key}'] = int(val) if profile_key in ('age', 'income') else val

    if not update_expr_parts:
        return False

    update_expr_parts.append('updatedAt = :now')
    expr_values[':now'] = datetime.now(timezone.utc).isoformat()

    try:
        citizens_table.update_item(
            Key={'citizenId': citizen_id},
            UpdateExpression='SET ' + ', '.join(update_expr_parts),
            ExpressionAttributeValues=expr_values,
        )
        print(f"[INFO] Auto-updated citizen {citizen_id} with {list(extracted_fields.keys())}")
        return True
    except Exception as e:
        print(f"[WARN] Profile auto-update failed for {citizen_id}: {e}")
        return False


def lambda_handler(event, context):
    try:
        method = event.get('httpMethod', 'POST')
        path = event.get('path', '') or event.get('resource', '')
        body = json.loads(event.get('body', '{}')) if isinstance(event.get('body'), str) else event

        # POST /document/verify-ai — AI verification feedback only
        if 'verify-ai' in path:
            extracted_fields = body.get('extractedFields', {})
            document_type = body.get('documentType', '')
            citizen_profile = body.get('citizenProfile')
            verification = _ai_verify_extraction(extracted_fields, document_type, citizen_profile)
            return {
                'statusCode': 200,
                'headers': cors_headers(),
                'body': json.dumps({'verification': verification, 'documentType': document_type}),
            }

        # POST /document/analyze — main extraction flow
        s3_key = body.get('s3Key', '').strip()
        document_type = body.get('documentType', '').strip().lower()
        citizen_id = body.get('citizenId', '').strip()

        if not s3_key or not document_type:
            return {
                'statusCode': 400,
                'headers': cors_headers(),
                'body': json.dumps({'error': 's3Key and documentType are required'}),
            }

        # Textract: detect document text
        lines = _extract_text_textract(DOCUMENTS_BUCKET, s3_key)
        full_text = ' '.join(line['text'] for line in lines)

        # Comprehend: extract entities
        entities, pii_entities = _extract_entities_comprehend(full_text)

        # Parse fields by document type
        parser = DOCUMENT_PARSERS.get(document_type, lambda *args: ({}, {}))
        extracted_fields, confidence_scores = parser(lines, full_text, entities, pii_entities)

        # Compute average confidence
        avg_confidence = round(
            sum(confidence_scores.values()) / len(confidence_scores)
        ) if confidence_scores else 0

        # Store extraction result in DynamoDB (TTL 7 days)
        doc_id = s3_key.split('/')[-2] if '/' in s3_key else str(uuid.uuid4())
        expires_at = int((datetime.now(timezone.utc) + timedelta(days=7)).timestamp())

        try:
            extractions_table.put_item(Item={
                'documentId': doc_id,
                'citizenId': citizen_id,
                'documentType': document_type,
                's3Key': s3_key,
                'extractedFields': extracted_fields,
                'confidenceScores': confidence_scores,
                'uploadedAt': datetime.now(timezone.utc).isoformat(),
                'expiresAt': expires_at,
            })
        except Exception as db_err:
            print(f"[WARN] DynamoDB write failed: {db_err}")

        # AI verification feedback
        ai_verification = ''
        if extracted_fields:
            ai_verification = _ai_verify_extraction(extracted_fields, document_type)

        # Auto-update citizen profile from extracted fields
        profile_updated = False
        if citizen_id and extracted_fields:
            profile_updated = _auto_update_citizen_profile(citizen_id, extracted_fields, document_type)

        return {
            'statusCode': 200,
            'headers': cors_headers(),
            'body': json.dumps({
                'documentId': doc_id,
                'documentType': document_type,
                'extractedFields': extracted_fields,
                'confidenceScores': confidence_scores,
                'averageConfidence': avg_confidence,
                'rawLineCount': len(lines),
                'aiVerification': ai_verification,
                'profileUpdated': profile_updated,
            }),
        }

    except Exception as e:
        return {
            'statusCode': 500,
            'headers': cors_headers(),
            'body': json.dumps({'error': 'Internal server error', 'message': str(e)}),
        }
