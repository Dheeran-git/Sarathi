import boto3
import json
import time

REGION = "us-east-1"
ACCOUNT_ID = boto3.client('sts').get_caller_identity().get('Account')
COLLECTION_NAME = "bedrock-kb-collection"
INDEX_NAME = "bedrock-knowledge-base-default-index"

aoss = boto3.client('opensearchserverless', region_name=REGION)
iam = boto3.client('iam', region_name=REGION)
bedrock_agent = boto3.client('bedrock-agent', region_name=REGION)

print(f"AWS Account ID: {ACCOUNT_ID}")

# 1. Create OpenSearch Serverless Collection
try:
    cols = aoss.list_collections().get('collectionSummaries', [])
    col = next((c for c in cols if c['name'] == COLLECTION_NAME), None)
    
    if col:
        print(f"Collection {COLLECTION_NAME} exists: {col['id']}")
        col_id = col['id']
        col_arn = col['arn']
    else:
        print(f"Creating Collection {COLLECTION_NAME}...")
        # Security Policies
        aoss.create_security_policy(
            name=f"{COLLECTION_NAME}-encrypt",
            type='encryption',
            policy=json.dumps({"Rules":[{"ResourceType":"collection","Resource":[f"collection/{COLLECTION_NAME}"]}],"AWSOwnedKey":True})
        )
        
        aoss.create_security_policy(
            name=f"{COLLECTION_NAME}-network",
            type='network',
            policy=json.dumps([{"Rules":[{"ResourceType":"collection","Resource":[f"collection/{COLLECTION_NAME}"]}, {"ResourceType":"dashboard","Resource":[f"collection/{COLLECTION_NAME}"]}],"AllowFromPublic":True}])
        )
        
        # Access Policy - Give access to the current user/role AND the Bedrock Role
        role_arn = iam.get_role(RoleName="SarathiKBServiceRole")['Role']['Arn']
        current_identity = boto3.client('sts').get_caller_identity()['Arn']
        
        aoss.create_access_policy(
            name=f"{COLLECTION_NAME}-access",
            type='data',
            policy=json.dumps([
                {
                    "Rules": [
                        {"ResourceType": "collection", "Resource": [f"collection/{COLLECTION_NAME}"], "Permission": ["aoss:*"]},
                        {"ResourceType": "index", "Resource": [f"index/{COLLECTION_NAME}/*"], "Permission": ["aoss:*"]}
                    ],
                    "Principal": [role_arn, current_identity]
                }
            ])
        )

        resp = aoss.create_collection(
            name=COLLECTION_NAME,
            type='VECTORSEARCH',
            description='Vector store for Sarathi Schemes'
        )
        col_id = resp['createCollectionDetail']['id']
        col_arn = resp['createCollectionDetail']['arn']
        
        print("Waiting for collection to be ACTIVE...")
        while True:
            status = aoss.batch_get_collection(names=[COLLECTION_NAME])['collectionDetails'][0]['status']
            print(f"Status: {status}")
            if status == 'ACTIVE': break
            time.sleep(10)
            
except Exception as e:
    print(f"Error handling collection: {str(e)}")
    # If policy already exists, we ignore it for now or assume collection exists
    cols = aoss.list_collections().get('collectionSummaries', [])
    col = next((c for c in cols if c['name'] == COLLECTION_NAME), None)
    col_id = col['id']
    col_arn = col['arn']

print(f"\nCollection ARN: {col_arn}")

# 2. Wait for data plane to be ready
import requests
from requests_aws4auth import AWS4Auth
credentials = boto3.Session().get_credentials()
awsauth = AWS4Auth(credentials.access_key, credentials.secret_key, REGION, 'aoss', session_token=credentials.token)
host = f"https://{col_id}.{REGION}.aoss.amazonaws.com"

print(f"\nConnecting to {host} to create vector index {INDEX_NAME}...")
# Note: Creating index might require opensearch-py, using requests for a raw PUT

index_body = {
  "settings": {
    "index": {
      "knn": True,
      "knn.algo_param.ef_search": 512
    }
  },
  "mappings": {
    "properties": {
      "bedrock-knowledge-base-default-vector": {
        "type": "knn_vector",
        "dimension": 1536, # Titan v1 dimension
        "method": {
          "name": "hnsw",
          "engine": "nmslib",
          "space_type": "cosinesimil"
        }
      },
      "AMAZON_BEDROCK_TEXT_CHUNK": {
        "type": "text",
        "index": True
      },
      "AMAZON_BEDROCK_METADATA": {
        "type": "text",
        "index": False
      }
    }
  }
}

retry = 0
while retry < 5:
    try:
        r = requests.put(f"{host}/{INDEX_NAME}", auth=awsauth, json=index_body)
        print(f"Index creation response: {r.status_code} - {r.text}")
        if r.status_code in [200, 201, 400]: # 400 usually means it already exists
            break
    except Exception as e:
        print(f"Connection failed: {str(e)}")
    
    retry += 1
    time.sleep(10)

print("\n--- UPDATE setup_knowledge_base.py with this ARN ---")
print(f"COLLECTION_ARN = '{col_arn}'")
