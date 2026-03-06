import boto3
import json

client = boto3.client('bedrock-runtime', region_name='us-east-1')

payload = {
    "anthropic_version": "bedrock-2023-05-31",
    "max_tokens": 1024,
    "messages": [
        {
            "role": "user",
            "content": "Hello, are you active?"
        }
    ]
}

try:
    print("Invoking Claude 3 Haiku directly...")
    response = client.invoke_model(
        modelId='anthropic.claude-3-haiku-20240307-v1:0',
        body=json.dumps(payload)
    )
    result = json.loads(response.get('body').read())
    print("Success!")
    print(result['content'][0]['text'])
except Exception as e:
    print(f"Model Invoke Error: {e}")
