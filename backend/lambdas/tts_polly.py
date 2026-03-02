"""
sarathi-tts-polly — Text-to-Speech via Amazon Polly.

Receives { text, language } and returns base64-encoded MP3 audio.
Uses Neural voices: Kajal (en-IN) and Aditi (hi-IN).
"""
import json
import base64
import boto3

polly = boto3.client('polly', region_name='us-east-1')

# Voice mapping: language → (VoiceId, Engine, LanguageCode)
VOICES = {
    'en': ('Kajal',  'neural',   'en-IN'),
    'hi': ('Aditi',  'standard', 'hi-IN'),
}

MAX_TEXT_LENGTH = 1500  # Keep requests small for cost + latency


def lambda_handler(event, context):
    try:
        body = json.loads(event.get('body', '{}')) if isinstance(event.get('body'), str) else event

        text = (body.get('text') or '').strip()
        language = (body.get('language') or 'en').strip().lower()

        if not text:
            return _response(400, {'error': 'Missing "text" parameter'})

        # Truncate long text
        if len(text) > MAX_TEXT_LENGTH:
            text = text[:MAX_TEXT_LENGTH]

        voice_id, engine, lang_code = VOICES.get(language, VOICES['en'])

        result = polly.synthesize_speech(
            Text=text,
            OutputFormat='mp3',
            VoiceId=voice_id,
            Engine=engine,
            LanguageCode=lang_code,
        )

        audio_stream = result['AudioStream'].read()
        audio_base64 = base64.b64encode(audio_stream).decode('utf-8')

        return _response(200, {
            'audioBase64': audio_base64,
            'contentType': 'audio/mpeg',
        })

    except Exception as e:
        print(f'[tts_polly] Error: {e}')
        return _response(500, {
            'error': 'TTS synthesis failed',
            'message': str(e),
        })


def _response(status_code, body):
    return {
        'statusCode': status_code,
        'headers': {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type,Authorization',
            'Content-Type': 'application/json',
        },
        'body': json.dumps(body),
    }
