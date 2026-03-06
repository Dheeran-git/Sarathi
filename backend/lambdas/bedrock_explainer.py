"""
bedrock_explainer — POST /explain
Explains a government scheme using Amazon Nova Pro with personalization,
Hindi translation via Amazon Translate, and multilingual TTS via Polly.
Applies Bedrock Guardrail for content safety + PII redaction.
Caches results in SarathiExplanationCache DynamoDB table.
"""
import json
import os
import hashlib
import boto3
from datetime import datetime

REGION = 'us-east-1'
CACHE_TABLE = os.environ.get('CACHE_TABLE', 'SarathiExplanationCache')
AUDIO_BUCKET = os.environ.get('AUDIO_BUCKET', 'sarathi-audio-output')
BEDROCK_MODEL_ID = os.environ.get('BEDROCK_MODEL_ID', 'amazon.nova-pro-v1:0')
BEDROCK_GUARDRAIL_ID = os.environ.get('BEDROCK_GUARDRAIL_ID', '')
BEDROCK_GUARDRAIL_VERSION = os.environ.get('BEDROCK_GUARDRAIL_VERSION', 'DRAFT')

dynamodb = boto3.resource('dynamodb', region_name=REGION)
cache_table = dynamodb.Table(CACHE_TABLE)
bedrock = boto3.client('bedrock-runtime', region_name=REGION)
polly = boto3.client('polly', region_name=REGION)
s3 = boto3.client('s3', region_name=REGION)
translate = boto3.client('translate', region_name=REGION)


def cors_headers():
    return {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Amz-Date,X-Api-Key',
        'Access-Control-Allow-Methods': 'GET,POST,PATCH,OPTIONS',
        'Content-Type': 'application/json',
    }


def _citizen_hash(citizen_id):
    """First 8 chars of MD5 hash of citizenId for cache key."""
    if not citizen_id:
        return 'anon'
    return hashlib.md5(citizen_id.encode()).hexdigest()[:8]


def _invoke_bedrock(prompt):
    """Invoke Nova Pro with optional guardrail."""
    payload = {
        "messages": [
            {"role": "user", "content": [{"text": prompt}]}
        ],
        "inferenceConfig": {
            "maxTokens": 500,
            "temperature": 0.3,
        }
    }
    kwargs = dict(
        modelId=BEDROCK_MODEL_ID,
        body=json.dumps(payload),
        contentType='application/json',
        accept='application/json',
    )
    if BEDROCK_GUARDRAIL_ID:
        kwargs['guardrailIdentifier'] = BEDROCK_GUARDRAIL_ID
        kwargs['guardrailVersion'] = BEDROCK_GUARDRAIL_VERSION

    resp = bedrock.invoke_model(**kwargs)
    result = json.loads(resp['body'].read())
    content = result.get('output', {}).get('message', {}).get('content', [])
    return content[0].get('text', '') if content else ''


def lambda_handler(event, context):
    try:
        body = json.loads(event.get('body', '{}')) if isinstance(event.get('body'), str) else event

        scheme_id = body.get('schemeId', '').strip()
        scheme_name = body.get('schemeName', '').strip()
        scheme_description = body.get('description', '').strip()
        include_audio = body.get('audio', False)
        language = body.get('language', 'en')
        citizen_profile = body.get('citizenProfile') or {}
        citizen_id = citizen_profile.get('citizenId', '') or body.get('citizenId', '')

        if not scheme_id:
            return {
                'statusCode': 400,
                'headers': cors_headers(),
                'body': json.dumps({'error': 'schemeId is required'}),
            }

        # Cache key includes citizen hash + language
        mode = 'audio' if include_audio else 'text'
        citizen_hash = _citizen_hash(citizen_id)
        cache_key = f"{scheme_id}:{citizen_hash}:{language}:{mode}"

        try:
            cached = cache_table.get_item(Key={'schemeId': cache_key}).get('Item')
            if cached:
                return {
                    'statusCode': 200,
                    'headers': cors_headers(),
                    'body': json.dumps({
                        'schemeId': scheme_id,
                        'explanation': cached.get('explanation', ''),
                        'explanationHindi': cached.get('explanationHindi', ''),
                        'audioUrl': cached.get('audioUrl', ''),
                        'applicationGuidance': cached.get('applicationGuidance', ''),
                        'cached': True,
                    }),
                }
        except Exception:
            pass  # Cache miss — proceed to generate

        # Build personalized prompt prefix
        personalization = ''
        if citizen_profile:
            name = citizen_profile.get('name', '')
            age = citizen_profile.get('age', '')
            occupation = citizen_profile.get('occupation') or citizen_profile.get('persona', '')
            state = citizen_profile.get('state', '')
            income = citizen_profile.get('income', '')
            parts = []
            if name:
                parts.append(f"For {name}")
            if age:
                parts.append(f"age {age}")
            if occupation:
                parts.append(str(occupation))
            if state:
                parts.append(f"in {state}")
            if income:
                parts.append(f"with ₹{income}/month")
            if parts:
                personalization = ', '.join(parts) + ': '

        # Main explanation prompt
        explain_prompt = (
            f"{personalization}"
            f"Explain the Indian government scheme '{scheme_name}' in simple, clear English "
            f"that a rural citizen with basic literacy can understand. "
            f"Include: what it is, who is eligible, what benefit they get, and how to apply. "
            f"Keep the response under 150 words. Do not use jargon.\n\n"
            f"Scheme description: {scheme_description}"
        )
        explanation = _invoke_bedrock(explain_prompt)

        # Application guidance prompt
        guidance_prompt = (
            f"{personalization}"
            f"Provide step-by-step application guidance for the scheme '{scheme_name}' "
            f"for this citizen's specific situation. List 4-5 concrete steps with required documents. "
            f"End with the official portal URL if known. Keep it under 200 words."
        )
        application_guidance = _invoke_bedrock(guidance_prompt)

        # Translate to Hindi if requested
        explanation_hindi = ''
        if language == 'hi' and explanation:
            try:
                tr = translate.translate_text(
                    Text=explanation,
                    SourceLanguageCode='en',
                    TargetLanguageCode='hi',
                )
                explanation_hindi = tr['TranslatedText']
            except Exception as tr_err:
                print(f"[WARN] Translate error: {tr_err}")
                explanation_hindi = explanation

        # Polly TTS
        audio_url = ''
        if include_audio:
            tts_text = explanation_hindi if language == 'hi' and explanation_hindi else explanation
            voice_id = 'Aditi' if language == 'hi' else 'Raveena'
            try:
                polly_response = polly.synthesize_speech(
                    Text=tts_text[:2900],  # Polly max ~3000 chars
                    OutputFormat='mp3',
                    VoiceId=voice_id,
                    Engine='standard',
                )
                audio_data = polly_response['AudioStream'].read()
                s3_key = f"explanations/{scheme_id}-{language}-{citizen_hash}.mp3"
                s3.put_object(
                    Bucket=AUDIO_BUCKET,
                    Key=s3_key,
                    Body=audio_data,
                    ContentType='audio/mpeg',
                )
                audio_url = f"https://{AUDIO_BUCKET}.s3.{REGION}.amazonaws.com/{s3_key}"
            except Exception as polly_err:
                print(f"[WARN] Polly error: {polly_err}")

        # Store in cache
        try:
            cache_table.put_item(Item={
                'schemeId': cache_key,
                'explanation': explanation,
                'explanationHindi': explanation_hindi,
                'applicationGuidance': application_guidance,
                'audioUrl': audio_url,
                'generatedAt': datetime.utcnow().isoformat(),
            })
        except Exception:
            pass

        return {
            'statusCode': 200,
            'headers': cors_headers(),
            'body': json.dumps({
                'schemeId': scheme_id,
                'explanation': explanation,
                'explanationHindi': explanation_hindi,
                'applicationGuidance': application_guidance,
                'audioUrl': audio_url,
                'cached': False,
            }),
        }

    except Exception as e:
        return {
            'statusCode': 500,
            'headers': cors_headers(),
            'body': json.dumps({'error': 'Internal server error', 'message': str(e)}),
        }
