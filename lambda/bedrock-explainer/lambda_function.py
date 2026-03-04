"""
Sarathi — Bedrock Explainer Lambda
Member 2 · AWS AI Services

Takes scheme data → generates a 2-sentence Hindi explanation using
Amazon Nova Pro on Amazon Bedrock → converts to audio using Amazon Polly
→ stores audio in S3 → returns text + pre-signed audio URL.
"""

import json
import boto3
import os
import hashlib

bedrock = boto3.client(
    'bedrock-runtime',
    region_name=os.environ.get('AWS_REGION', 'us-east-1'),
)
polly = boto3.client('polly')
s3 = boto3.client('s3')
dynamodb = boto3.resource('dynamodb')

AUDIO_BUCKET = os.environ.get('AUDIO_BUCKET', 'sarathi-audio-output')
CACHE_TABLE = os.environ.get('CACHE_TABLE', 'SarathiExplanationCache')
USE_CACHE = os.environ.get('USE_CACHE', 'true').lower() == 'true'

# ── Bedrock model ID ──────────────────────────────────────────────────
MODEL_ID = os.environ.get('BEDROCK_MODEL_ID', 'us.amazon.nova-lite-v1:0')


def lambda_handler(event, context):
    """
    Input:  { "scheme": { "id": "pm-kisan", "nameHindi": "...", ... } }
    Output: { "explanationHindi": "...", "audioUrl": "https://...", "schemeId": "pm-kisan" }
    """
    print(f"[BedrockExplainer] Event: {json.dumps(event, ensure_ascii=False)}")

    # Support both direct invocation and API Gateway
    if isinstance(event.get('body'), str):
        body = json.loads(event['body'])
    else:
        body = event

    scheme = body.get('scheme', body)
    scheme_id = scheme.get('id', scheme.get('schemeId', 'unknown'))

    # ── Check cache first ─────────────────────────────────────────
    if USE_CACHE:
        cached = get_cached_explanation(scheme_id)
        if cached:
            print(f"[BedrockExplainer] Cache hit for {scheme_id}")
            return api_response(200, cached)

    # ── Step 1: Generate Hindi explanation via Bedrock ─────────────
    explanation_hindi = generate_explanation(scheme)

    # ── Step 2: Generate audio via Polly ──────────────────────────
    audio_url = generate_audio(scheme_id, explanation_hindi)

    result = {
        'explanationHindi': explanation_hindi,
        'audioUrl': audio_url,
        'schemeId': scheme_id,
    }

    # ── Cache the result ──────────────────────────────────────────
    if USE_CACHE:
        cache_explanation(scheme_id, result)

    return api_response(200, result)


def generate_explanation(scheme):
    """Call Amazon Nova Lite to generate a 2-sentence Hindi explanation."""
    name = scheme.get('nameHindi', scheme.get('nameEnglish', 'योजना'))
    benefit = scheme.get('annualBenefit', 0)
    description = scheme.get('benefitDescription', scheme.get('benefitDescriptionEn', ''))
    eligibility = scheme.get('eligibility', {})

    prompt = f"""You are a helpful welfare advisor in rural India.
Explain this government scheme in exactly 2 simple sentences in Hindi
that an illiterate rural villager can understand.

Rules:
- Use very simple, everyday Hindi (बोलचाल की भाषा)
- No English words at all
- No technical or bureaucratic terms
- Mention the money amount if applicable
- Make it sound warm and encouraging

Scheme Name: {name}
Annual Benefit: ₹{benefit:,}
Description: {description}
Eligibility: {json.dumps(eligibility, ensure_ascii=False)}

Write ONLY the 2-sentence explanation in Hindi. Nothing else."""

    try:
        response = bedrock.converse(
            modelId=MODEL_ID,
            messages=[{'role': 'user', 'content': [{'text': prompt}]}],
            inferenceConfig={'maxTokens': 250, 'temperature': 0.3},
        )
        explanation = response['output']['message']['content'][0]['text'].strip()
        print(f"[BedrockExplainer] Generated: {explanation}")
        return explanation

    except Exception as e:
        print(f"[BedrockExplainer] Bedrock error: {str(e)}")
        # Fallback to the scheme's own Hindi description
        return scheme.get(
            'benefitDescription',
            'इस योजना से आपको सरकारी लाभ मिल सकता है। अधिक जानकारी के लिए पंचायत कार्यालय से संपर्क करें।'
        )


def generate_audio(scheme_id, text):
    """Convert Hindi text to speech using Amazon Polly, save to S3."""
    try:
        polly_response = polly.synthesize_speech(
            Text=text,
            OutputFormat='mp3',
            VoiceId='Aditi',          # Hindi female voice
            LanguageCode='hi-IN',
            Engine='standard',        # 'neural' for higher quality if available
        )

        audio_key = f"audio/explanations/{scheme_id}.mp3"

        s3.put_object(
            Bucket=AUDIO_BUCKET,
            Key=audio_key,
            Body=polly_response['AudioStream'].read(),
            ContentType='audio/mpeg',
        )

        # Pre-signed URL valid for 6 hours
        audio_url = s3.generate_presigned_url(
            'get_object',
            Params={'Bucket': AUDIO_BUCKET, 'Key': audio_key},
            ExpiresIn=21600,
        )
        print(f"[BedrockExplainer] Audio URL: {audio_url[:80]}...")
        return audio_url

    except Exception as e:
        print(f"[BedrockExplainer] Polly/S3 error: {str(e)}")
        return None


def get_cached_explanation(scheme_id):
    """Check DynamoDB cache for a previously generated explanation."""
    try:
        table = dynamodb.Table(CACHE_TABLE)
        response = table.get_item(Key={'schemeId': scheme_id})
        item = response.get('Item')
        if item:
            return {
                'explanationHindi': item.get('explanationHindi', ''),
                'audioUrl': item.get('audioUrl'),
                'schemeId': scheme_id,
            }
    except Exception:
        pass
    return None


def cache_explanation(scheme_id, result):
    """Save explanation to DynamoDB cache."""
    try:
        table = dynamodb.Table(CACHE_TABLE)
        table.put_item(Item={
            'schemeId': scheme_id,
            'explanationHindi': result['explanationHindi'],
            'audioUrl': result.get('audioUrl', ''),
        })
    except Exception as e:
        print(f"[BedrockExplainer] Cache write error: {str(e)}")


def api_response(status_code, body):
    """Standard API Gateway response format."""
    return {
        'statusCode': status_code,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type,Authorization',
        },
        'body': json.dumps(body, ensure_ascii=False),
    }
