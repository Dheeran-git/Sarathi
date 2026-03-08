"""
agent_invoke – POST /agent
Invokes the Sarathi Bedrock Orchestrator Agent (multi-agent supervisor).
Maintains session memory per citizen via memoryId.
Includes context enrichment, follow-up suggestions, retry/backoff, sanitization, and logging.
"""
import json
import os
import re
import time
import boto3

REGION = 'us-east-1'
ORCHESTRATOR_AGENT_ID = os.environ.get('ORCHESTRATOR_AGENT_ID', 'JWIEP70LX8')
ORCHESTRATOR_AGENT_ALIAS_ID = os.environ.get('ORCHESTRATOR_AGENT_ALIAS_ID', 'R5S1HHR88R')

bedrock_agent_runtime = boto3.client('bedrock-agent-runtime', region_name=REGION)
bedrock = boto3.client('bedrock-runtime', region_name=REGION)
dynamodb = boto3.resource('dynamodb', region_name=REGION)
citizens_table = dynamodb.Table('SarathiCitizens')

BEDROCK_MODEL_ID = os.environ.get('BEDROCK_MODEL_ID', 'amazon.nova-pro-v1:0')

# Prompt injection patterns
_INJECTION_PATTERNS = [
    r'ignore\s+(all\s+)?previous\s+instructions',
    r'you\s+are\s+now\s+a',
    r'system\s*:\s*',
    r'OVERRIDE\s+SYSTEM',
    r'forget\s+(all\s+)?instructions',
]
_INJECTION_RE = re.compile('|'.join(_INJECTION_PATTERNS), re.IGNORECASE)


def cors_headers():
    return {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Amz-Date,X-Api-Key',
        'Access-Control-Allow-Methods': 'GET,POST,PATCH,OPTIONS',
        'Content-Type': 'application/json',
    }


def sanitize_id(raw_id):
    """Sanitize an ID for Bedrock Agent (only [0-9a-zA-Z._:-] allowed)."""
    return ''.join(c if c.isalnum() or c in '._:-' else '-' for c in raw_id)[:100]


def _sanitize_input(text):
    """Strip prompt injection patterns."""
    if not text:
        return text
    return _INJECTION_RE.sub('[FILTERED]', text)


def _get_citizen_context(citizen_id):
    """Fetch citizen profile for context enrichment."""
    if not citizen_id:
        return ''
    try:
        result = citizens_table.get_item(Key={'citizenId': citizen_id})
        item = result.get('Item')
        if not item:
            return ''
        parts = []
        if item.get('name'):
            parts.append(f"Name: {item['name']}")
        if item.get('age'):
            parts.append(f"Age: {item['age']}")
        if item.get('gender') and item['gender'] != 'any':
            parts.append(f"Gender: {item['gender']}")
        if item.get('state'):
            parts.append(f"State: {item['state']}")
        if item.get('income'):
            parts.append(f"Monthly Income: ₹{item['income']}")
        if item.get('category'):
            parts.append(f"Category: {item['category']}")
        if item.get('occupation') or item.get('persona'):
            parts.append(f"Occupation: {item.get('occupation') or item.get('persona')}")
        if item.get('isWidow'):
            parts.append("Status: Widow")
        if item.get('disability'):
            parts.append("Status: Person with disability")
        matched = item.get('matchedSchemes', [])
        if matched:
            parts.append(f"Eligible for {len(matched)} schemes")
        return '\n'.join(parts)
    except Exception as e:
        print(f"[WARN] Failed to fetch citizen context: {e}")
        return ''


def _generate_followups(response_text, language='en'):
    """Generate 2-3 contextual follow-up questions from the agent response."""
    try:
        lang_instruction = "in Hindi" if language == 'hi' else "in English"
        prompt = (
            f"Based on this welfare advisor response, generate exactly 3 short follow-up questions "
            f"a rural Indian citizen might ask next {lang_instruction}. "
            f"Each question should be on a new line, under 15 words, and directly relevant.\n\n"
            f"Response: {response_text[:500]}\n\n"
            f"Follow-up questions:"
        )
        payload = {
            "messages": [{"role": "user", "content": [{"text": prompt}]}],
            "inferenceConfig": {"maxTokens": 150, "temperature": 0.5},
        }
        resp = bedrock.invoke_model(
            modelId=BEDROCK_MODEL_ID,
            body=json.dumps(payload),
            contentType='application/json',
            accept='application/json',
        )
        result = json.loads(resp['body'].read())
        content = result.get('output', {}).get('message', {}).get('content', [])
        raw = content[0].get('text', '') if content else ''
        followups = [line.strip().lstrip('0123456789.-) ') for line in raw.strip().split('\n') if line.strip()]
        return followups[:3]
    except Exception as e:
        print(f"[WARN] Follow-up generation failed: {e}")
        return []


def lambda_handler(event, context):
    try:
        body = json.loads(event.get('body', '{}')) if isinstance(event.get('body'), str) else event

        message = _sanitize_input(body.get('message', '').strip())
        session_id = body.get('sessionId', '').strip()
        citizen_id = body.get('citizenId', '').strip()
        language = body.get('language', 'en')
        include_followups = body.get('includeFollowups', True)

        if not message:
            return {
                'statusCode': 400,
                'headers': cors_headers(),
                'body': json.dumps({'error': 'message is required'}),
            }

        # Rate limiting
        try:
            from rate_limiter import check_rate_limit, rate_limit_response
            allowed, remaining = check_rate_limit(citizen_id)
            if not allowed:
                return rate_limit_response()
        except ImportError:
            pass

        if not ORCHESTRATOR_AGENT_ID or not ORCHESTRATOR_AGENT_ALIAS_ID:
            return {
                'statusCode': 503,
                'headers': cors_headers(),
                'body': json.dumps({'error': 'Agent not configured. Set ORCHESTRATOR_AGENT_ID and ORCHESTRATOR_AGENT_ALIAS_ID env vars.'}),
            }

        # Context enrichment: prepend citizen profile summary
        citizen_context = _get_citizen_context(citizen_id)
        enriched_message = message
        if citizen_context:
            enriched_message = (
                f"[Citizen Profile Context]\n{citizen_context}\n\n"
                f"[Citizen's Question]\n{message}"
            )

        # Use citizenId as both sessionId and memoryId for persistent context
        effective_session = sanitize_id(citizen_id or session_id or 'default-session')

        invoke_kwargs = dict(
            agentId=ORCHESTRATOR_AGENT_ID,
            agentAliasId=ORCHESTRATOR_AGENT_ALIAS_ID,
            sessionId=effective_session,
            inputText=enriched_message,
            enableTrace=False,
        )
        if citizen_id:
            invoke_kwargs['memoryId'] = sanitize_id(citizen_id)

        print(f"Invoking agent {ORCHESTRATOR_AGENT_ID} session={effective_session} citizenId={citizen_id}")

        if citizen_id:
            invoke_kwargs['sessionState'] = {
                'sessionAttributes': {
                    'citizenId': citizen_id
                }
            }

        # Retry with backoff
        last_err = None
        completion = ''
        for attempt in range(3):
            try:
                start_ts = time.time()
                response = bedrock_agent_runtime.invoke_agent(**invoke_kwargs)
                latency_ms = int((time.time() - start_ts) * 1000)

                # Collect streamed completion chunks
                event_stream = response.get('completion', [])
                for chunk_event in event_stream:
                    chunk = chunk_event.get('chunk', {})
                    if 'bytes' in chunk:
                        completion += chunk['bytes'].decode('utf-8')

                # Log AI invocation
                print(json.dumps({
                    'ai_invocation': True,
                    'caller': 'agent_invoke',
                    'agentId': ORCHESTRATOR_AGENT_ID,
                    'latencyMs': latency_ms,
                    'responseLength': len(completion),
                    'attempt': attempt + 1,
                    'citizenId': citizen_id,
                }))
                last_err = None
                break
            except Exception as e:
                last_err = e
                if attempt < 2:
                    time.sleep(2 ** attempt)
                    print(f"[WARN] Agent retry {attempt + 1}/3: {e}")

        if last_err:
            raise last_err

        # Generate follow-up suggestions
        followups = []
        if include_followups and completion:
            followups = _generate_followups(completion, language)

        result = {
            'response': completion,
            'sessionId': effective_session,
            'citizenId': citizen_id,
            'followupSuggestions': followups,
        }
        if citizen_context:
            result['hasProfileContext'] = True

        return {
            'statusCode': 200,
            'headers': cors_headers(),
            'body': json.dumps(result),
        }

    except Exception as e:
        print(f"Error in agent_invoke: {str(e)}")
        return {
            'statusCode': 500,
            'headers': cors_headers(),
            'body': json.dumps({
                'error': 'AI agent is temporarily unavailable. Please try again in a moment.',
                'message': str(e),
            }),
        }
