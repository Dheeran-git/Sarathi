import json
import boto3

lex_client = boto3.client('lexv2-runtime', region_name='us-east-1')

BOT_ID = 'XQ7YG2H6XO'
BOT_ALIAS_ID = 'TSTALIASID'

def lambda_handler(event, context):
    """
    Proxy Lambda: receives text from frontend, sends to Lex, returns Lex response.
    This is NOT the fulfillment Lambda — this forwards user messages TO the Lex bot.
    """
    try:
        body = json.loads(event.get('body', '{}')) if isinstance(event.get('body'), str) else event
        message = body.get('message', '')
        session_id = body.get('sessionId', 'web-session-default')
        locale = body.get('locale', 'en_US')  # default English

        if not message:
            return response_json(400, {'error': 'message is required'})

        # Call Lex Runtime V2
        lex_response = lex_client.recognize_text(
            botId=BOT_ID,
            botAliasId=BOT_ALIAS_ID,
            localeId=locale,
            sessionId=session_id,
            text=message
        )

        # Extract bot messages
        messages = lex_response.get('messages', [])
        bot_message = messages[0].get('content', '') if messages else ''

        # Extract session state
        session_state = lex_response.get('sessionState', {})
        intent = session_state.get('intent', {})
        dialog_action = session_state.get('dialogAction', {})

        # Extract filled slots
        slots = {}
        raw_slots = intent.get('slots', {}) or {}
        for key, val in raw_slots.items():
            if val and val.get('value'):
                slots[key] = val['value'].get('interpretedValue', val['value'].get('originalValue', ''))

        return response_json(200, {
            'message': bot_message,
            'dialogState': dialog_action.get('type', ''),
            'slotToElicit': dialog_action.get('slotToElicit', ''),
            'slots': slots,
            'intentName': intent.get('name', ''),
            'intentState': intent.get('state', ''),
            'allMessages': [m['content'] for m in messages],
        })

    except Exception as e:
        print(f'[lex-proxy] Error: {str(e)}')
        return response_json(500, {'error': str(e)})


def response_json(status, body):
    return {
        'statusCode': status,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
        },
        'body': json.dumps(body, ensure_ascii=False)
    }
