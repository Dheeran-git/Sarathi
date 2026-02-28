"""
Sarathi — Lex Fulfillment Lambda
Member 2 · AWS AI Services

Called by Amazon Lex during dialog (DialogCodeHook) and after slot
collection (FulfillmentCodeHook).

- DialogCodeHook:   Delegates back to Lex to continue slot collection.
- FulfillmentCodeHook: Calls the eligibility-engine Lambda (Member 1),
  saves the citizen profile, and returns the result.
"""

import json
import boto3
import os
import uuid

lambda_client = boto3.client('lambda')
dynamodb = boto3.resource('dynamodb')

ELIGIBILITY_LAMBDA = os.environ.get('ELIGIBILITY_LAMBDA', 'sarathi-eligibility-engine')
CITIZENS_TABLE = os.environ.get('CITIZENS_TABLE', 'SarathiCitizens')


def lambda_handler(event, context):
    """Main handler — invoked by Amazon Lex V2."""
    print(f"[LexFulfillment] Received event: {json.dumps(event)}")

    invocation_source = event.get('invocationSource', '')

    # ── DialogCodeHook: Lex is still collecting slots ─────────────
    # Just delegate back so Lex continues the conversation.
    if invocation_source == 'DialogCodeHook':
        print("[LexFulfillment] DialogCodeHook — delegating back to Lex")
        return delegate(event)

    # ── FulfillmentCodeHook: All slots collected, process now ─────
    slots = event.get('sessionState', {}).get('intent', {}).get('slots', {})

    citizen_profile = extract_profile(slots)
    print(f"[LexFulfillment] Extracted profile: {json.dumps(citizen_profile, ensure_ascii=False)}")

    matched_schemes = []

    # ── Call eligibility-engine Lambda ─────────────────────────────
    try:
        elig_response = lambda_client.invoke(
            FunctionName=ELIGIBILITY_LAMBDA,
            InvocationType='RequestResponse',
            Payload=json.dumps(citizen_profile),
        )
        elig_result = json.loads(elig_response['Payload'].read())
        if isinstance(elig_result.get('body'), str):
            body = json.loads(elig_result['body'])
        else:
            body = elig_result.get('body', elig_result)

        matched_schemes = body.get('matchedSchemes', [])
        total_benefit = body.get('totalAnnualBenefit', 0)
        matched_count = len(matched_schemes)

        # Build a nice English summary
        if matched_count > 0:
            top_3 = ', '.join(
                s.get('nameEnglish', s.get('name', ''))
                for s in matched_schemes[:3]
            )
            message = (
                f"🎉 {citizen_profile['name']}, we found {matched_count} government schemes for you!\n"
                f"💰 Total annual benefit: ₹{total_benefit:,}\n"
                f"📋 Top schemes: {top_3}\n\n"
                f"Please open the Sarathi app for more details."
            )
        else:
            message = (
                f"{citizen_profile['name']}, we didn't find any direct schemes for you at this time. "
                "Please verify your details or contact your Panchayat office."
            )

    except Exception as e:
        print(f"[LexFulfillment] Error calling eligibility-engine: {str(e)}")
        # ── Fallback: return a helpful response even without the engine ──
        message = (
            f"🙏 {citizen_profile['name']}, your details have been successfully recorded.\n"
            f"📋 Age: {citizen_profile['age']}, Income: ₹{citizen_profile['monthlyIncome']}\n"
            f"We will soon share your scheme eligibility with your Panchayat."
        )

    # ── Save citizen profile to DynamoDB ──────────────────────────
    try:
        save_citizen(citizen_profile, matched_schemes)
    except Exception as e:
        print(f"[LexFulfillment] Error saving citizen: {str(e)}")

    # ── Return response to Lex ────────────────────────────────────
    return close_dialog(event, message)


def delegate(event):
    """Delegate back to Lex to continue slot elicitation."""
    return {
        'sessionState': {
            'dialogAction': {
                'type': 'Delegate',
            },
            'intent': event['sessionState']['intent'],
            'sessionAttributes': event.get('sessionState', {}).get('sessionAttributes', {}),
        },
    }


def extract_profile(slots):
    """Pull citizen info from Lex slot values."""
    return {
        'name': get_slot(slots, 'citizenName') or 'Unknown',
        'age': safe_int(get_slot(slots, 'citizenAge')),
        'state': get_slot(slots, 'citizenState') or '',
        'monthlyIncome': safe_int(get_slot(slots, 'monthlyIncome')),
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
        'monthlyIncome': profile['monthlyIncome'],
        'category': profile['category'],
        'gender': profile['gender'],
        'isWidow': profile['isWidow'],
        'occupation': profile['occupation'],
        'panchayatId': 'rampur-barabanki-up',
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
            'sessionAttributes': event.get('sessionState', {}).get('sessionAttributes', {}),
        },
        'messages': [
            {
                'contentType': 'PlainText',
                'content': message,
            }
        ],
    }
