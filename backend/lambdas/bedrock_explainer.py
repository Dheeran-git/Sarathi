"""
bedrock_explainer — POST /explain
Explains a government scheme in simple terms using AWS Bedrock (Nova Lite).
Optionally generates Hindi audio via Amazon Polly.
Caches results in SarathiExplanationCache DynamoDB table.
"""
import json
import os
import boto3
from datetime import datetime

REGION = 'us-east-1'
CACHE_TABLE = os.environ.get('CACHE_TABLE', 'SarathiExplanationCache')
AUDIO_BUCKET = os.environ.get('AUDIO_BUCKET', 'sarathi-audio-output')
BEDROCK_MODEL_ID = os.environ.get('BEDROCK_MODEL_ID', 'amazon.nova-lite-v1:0')

dynamodb = boto3.resource('dynamodb', region_name=REGION)
cache_table = dynamodb.Table(CACHE_TABLE)
bedrock = boto3.client('bedrock-runtime', region_name=REGION)
polly = boto3.client('polly', region_name=REGION)
s3 = boto3.client('s3', region_name=REGION)


def cors_headers():
    return {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Amz-Date,X-Api-Key',
        'Access-Control-Allow-Methods': 'GET,POST,PATCH,OPTIONS',
        'Content-Type': 'application/json',
    }


def lambda_handler(event, context):
    try:
        body = json.loads(event.get('body', '{}')) if isinstance(event.get('body'), str) else event

        scheme_id = body.get('schemeId', '').strip()
        scheme_name = body.get('schemeName', '').strip()
        scheme_description = body.get('description', '').strip()
        include_audio = body.get('audio', False)

        if not scheme_id:
            return {
                'statusCode': 400,
                'headers': cors_headers(),
                'body': json.dumps({'error': 'schemeId is required'}),
            }

        # Check cache first
        cache_key = f"{scheme_id}:{'audio' if include_audio else 'text'}"
        try:
            cached = cache_table.get_item(Key={'schemeId': cache_key}).get('Item')
            if cached:
                return {
                    'statusCode': 200,
                    'headers': cors_headers(),
                    'body': json.dumps({
                        'schemeId': scheme_id,
                        'explanation': cached.get('explanation', ''),
                        'audioUrl': cached.get('audioUrl', ''),
                        'cached': True,
                    }),
                }
        except Exception:
            pass  # Cache miss or error — proceed to generate

        # Build prompt for Bedrock
        prompt = (
            f"Explain the Indian government scheme '{scheme_name}' in simple, clear English "
            f"that a rural citizen with basic literacy can understand. "
            f"Include: what it is, who is eligible, what benefit they get, and how to apply. "
            f"Keep the response under 150 words. Do not use jargon.\n\n"
            f"Scheme description: {scheme_description}"
        )

        bedrock_payload = {
            "messages": [
                {"role": "user", "content": [{"text": prompt}]}
            ],
            "inferenceConfig": {
                "maxTokens": 300,
                "temperature": 0.3,
            }
        }

        bedrock_response = bedrock.invoke_model(
            modelId=BEDROCK_MODEL_ID,
            body=json.dumps(bedrock_payload),
            contentType='application/json',
            accept='application/json',
        )
        result = json.loads(bedrock_response['body'].read())
        content = result.get('output', {}).get('message', {}).get('content', [])
        explanation = content[0].get('text', '') if content else ''

        audio_url = ''
        if include_audio and explanation:
            try:
                polly_response = polly.synthesize_speech(
                    Text=explanation,
                    OutputFormat='mp3',
                    VoiceId='Aditi',  # Hindi/English bilingual voice
                    Engine='standard',
                )
                audio_data = polly_response['AudioStream'].read()
                s3_key = f"explanations/{scheme_id}.mp3"
                s3.put_object(
                    Bucket=AUDIO_BUCKET,
                    Key=s3_key,
                    Body=audio_data,
                    ContentType='audio/mpeg',
                )
                audio_url = f"https://{AUDIO_BUCKET}.s3.{REGION}.amazonaws.com/{s3_key}"
            except Exception as polly_err:
                print(f"Polly error: {polly_err}")

        # Store in cache
        try:
            cache_table.put_item(Item={
                'schemeId': cache_key,
                'explanation': explanation,
                'audioUrl': audio_url,
                'generatedAt': datetime.utcnow().isoformat(),
            })
        except Exception:
            pass  # Cache write failure is non-fatal

        return {
            'statusCode': 200,
            'headers': cors_headers(),
            'body': json.dumps({
                'schemeId': scheme_id,
                'explanation': explanation,
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
