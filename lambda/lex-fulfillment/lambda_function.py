"""
Sarathi — Lex Fulfillment Lambda
Member 2 · AWS AI Services

Called by Amazon Lex when the SarathiBot conversation completes.
Receives citizen profile from Lex slots, calls the eligibility-engine
Lambda (built by Member 1), and returns the result to the user.
"""

import json
import boto3
import os
import uuid

lambda_client = boto3.client('lambda')
dynamodb = boto3.resource('dynamodb')

ELIGIBILITY_LAMBDA = os.environ.get('ELIGIBILITY_LAMBDA', 'eligibility-engine')
CITIZENS_TABLE = os.environ.get('CITIZENS_TABLE', 'SarathiCitizens')


def lambda_handler(event, context):
    """Main handler — invoked by Amazon Lex."""
    print(f"[LexFulfillment] Received event: {json.dumps(event)}")

    intent_name = event.get('sessionState', {}).get('intent', {}).get('name', '')
    slots = event.get('sessionState', {}).get('intent', {}).get('slots', {})

    # ── Collect all slots from the dialog ──────────────────────────
    citizen_profile = extract_profile(slots)
    print(f"[LexFulfillment] Extracted profile: {json.dumps(citizen_profile, ensure_ascii=False)}")

    # ── Call eligibility-engine Lambda ─────────────────────────────
    try:
        elig_response = lambda_client.invoke(
            FunctionName=ELIGIBILITY_LAMBDA,
            InvocationType='RequestResponse',
            Payload=json.dumps(citizen_profile),
        )
        elig_result = json.loads(elig_response['Payload'].read())
        body = elig_result if isinstance(elig_result, dict) else json.loads(elig_result.get('body', '{}'))

        matched_schemes = body.get('matchedSchemes', [])
        total_benefit = body.get('totalAnnualBenefit', 0)
        matched_count = len(matched_schemes)

        # Build a nice Hindi + English summary
        if matched_count > 0:
            top_3 = ', '.join(
                s.get('nameHindi', s.get('nameEnglish', ''))
                for s in matched_schemes[:3]
            )
            message = (
                f"🎉 {citizen_profile['name']} जी, आपके लिए {matched_count} सरकारी योजनाएं मिलीं!\n"
                f"💰 कुल वार्षिक लाभ: ₹{total_benefit:,}\n"
                f"📋 प्रमुख योजनाएं: {top_3}\n\n"
                f"अधिक जानकारी के लिए सारथी ऐप खोलें।"
            )
        else:
            message = (
                f"{citizen_profile['name']} जी, हमें अभी कोई सीधे मिलने वाली योजना नहीं मिली। "
                "कृपया अपनी जानकारी दोबारा जांचें या पंचायत कार्यालय से संपर्क करें।"
            )

    except Exception as e:
        print(f"[LexFulfillment] Error calling eligibility-engine: {str(e)}")
        message = "कुछ तकनीकी समस्या हुई। कृपया थोड़ी देर बाद पुनः प्रयास करें।"

    # ── Save citizen profile to DynamoDB ──────────────────────────
    try:
        save_citizen(citizen_profile, matched_schemes if 'matched_schemes' in dir() else [])
    except Exception as e:
        print(f"[LexFulfillment] Error saving citizen: {str(e)}")

    # ── Return response to Lex ────────────────────────────────────
    return close_dialog(event, message)


def extract_profile(slots):
    """Pull citizen info from Lex slot values."""
    return {
        'name': get_slot(slots, 'citizenName') or 'Unknown',
        'age': safe_int(get_slot(slots, 'citizenAge')),
        'state': get_slot(slots, 'citizenState') or '',
        'income': safe_int(get_slot(slots, 'monthlyIncome')),
        'category': get_slot(slots, 'category') or 'General',
        'gender': get_slot(slots, 'gender') or 'any',
        'isWidow': (get_slot(slots, 'isWidow') or '').lower() in ('yes', 'हाँ', 'haan'),
        'occupation': get_slot(slots, 'occupation') or 'none',
    }


def get_slot(slots, name):
    """Safely extract interpretedValue from a Lex V2 slot."""
    slot = slots.get(name)
    if slot and isinstance(slot, dict):
        value = slot.get('value')
        if value:
            return value.get('interpretedValue')
    return None


def safe_int(val):
    """Convert to int safely."""
    try:
        return int(val)
    except (TypeError, ValueError):
        return 0


def save_citizen(profile, matched_schemes):
    """Persist citizen profile in DynamoDB."""
    table = dynamodb.Table(CITIZENS_TABLE)
    citizen_id = str(uuid.uuid4())
    item = {
        'citizenId': citizen_id,
        'name': profile['name'],
        'age': profile['age'],
        'state': profile['state'],
        'monthlyIncome': profile['income'],
        'category': profile['category'],
        'gender': profile['gender'],
        'isWidow': profile['isWidow'],
        'occupation': profile['occupation'],
        'matchedSchemes': [s.get('schemeId', s.get('id', '')) for s in matched_schemes],
        'status': 'eligible' if matched_schemes else 'none',
    }
    table.put_item(Item=item)
    print(f"[LexFulfillment] Saved citizen {citizen_id}")
    return citizen_id


def close_dialog(event, message):
    """Build a Lex V2 Close response."""
    return {
        'sessionState': {
            'dialogAction': {
                'type': 'Close',
            },
            'intent': {
                'name': event['sessionState']['intent']['name'],
                'state': 'Fulfilled',
            },
        },
        'messages': [
            {
                'contentType': 'PlainText',
                'content': message,
            }
        ],
    }
