import boto3
import json
import time
import os

# Configuration
REGION = "us-east-1"
# We'll use a unique bucket name. In a real scenario, this would be more stable.
# For now, let's try to find an existing sarathi bucket or create one.
BUCKET_NAME = "sarathi-knowledge-base-store" 
KNOWLEDGE_BASE_NAME = "SarathiSchemeKB"
DATA_SOURCE_NAME = "SarathiSchemeCorpus"
EMBEDDING_MODEL_ARN = f"arn:aws:bedrock:{REGION}::foundation-model/amazon.titan-embed-text-v1"

bedrock_agent = boto3.client('bedrock-agent', region_name=REGION)
s3 = boto3.client('s3', region_name=REGION)
iam = boto3.client('iam', region_name=REGION)

def create_s3_bucket():
    print(f"Ensuring bucket {BUCKET_NAME} exists...")
    try:
        s3.head_bucket(Bucket=BUCKET_NAME)
        print("Bucket exists.")
    except:
        print("Creating bucket...")
        s3.create_bucket(Bucket=BUCKET_NAME)
    
    # Upload corpus
    corpus_path = os.path.join("backend", "knowledge_base", "scheme_corpus.txt")
    if os.path.exists(corpus_path):
        print(f"Uploading {corpus_path} to S3...")
        s3.upload_file(corpus_path, BUCKET_NAME, "schemes/scheme_corpus.txt")
    else:
        print(f"Error: {corpus_path} not found. Run generate_corpus.js first.")
        exit(1)

def get_iam_role():
    role_name = "SarathiKBServiceRole"
    try:
        response = iam.get_role(RoleName=role_name)
        return response['Role']['Arn']
    except iam.exceptions.NoSuchEntityException:
        print(f"Creating role {role_name}...")
        trust_policy = {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Principal": {"Service": "bedrock.amazonaws.com"},
                    "Action": "sts:AssumeRole"
                }
            ]
        }
        role_arn = iam.create_role(
            RoleName=role_name,
            AssumeRolePolicyDocument=json.dumps(trust_policy)
        )['Role']['Arn']
        
        # Attach policies
        policies = [
            "arn:aws:iam::aws:policy/AmazonS3ReadOnlyAccess",
            "arn:aws:iam::aws:policy/AmazonBedrockFullAccess"
        ]
        for p in policies:
            iam.attach_role_policy(RoleName=role_name, PolicyArn=p)
            
        # Add inline policy for OpenSearch Serverless Access
        iam.put_role_policy(
            RoleName=role_name,
            PolicyName='AOSSAccessForBedrockKB',
            PolicyDocument=json.dumps({
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Action": [
                            "aoss:APIAccessAll"
                        ],
                        "Resource": "*"
                    }
                ]
            })
        )
        
        # Add inline policy for Bedrock Knowledge Base specific needs if any
        # (Usually full access covers it, but for production you'd be tighter)
        
        print("Waiting for role replication...")
        time.sleep(10)
        return role_arn

def setup_kb(role_arn):
    print("Checking for existing Knowledge Base...")
    kbs = bedrock_agent.list_knowledge_bases(maxResults=100)['knowledgeBaseSummaries']
    kb_id = next((kb['knowledgeBaseId'] for kb in kbs if kb['name'] == KNOWLEDGE_BASE_NAME), None)
    
    if not kb_id:
        print("Creating Knowledge Base...")
        response = bedrock_agent.create_knowledge_base(
            name=KNOWLEDGE_BASE_NAME,
            roleArn=role_arn,
            knowledgeBaseConfiguration={
                'type': 'VECTOR',
                'vectorKnowledgeBaseConfiguration': {
                    'embeddingModelArn': EMBEDDING_MODEL_ARN
                }
            },
            storageConfiguration={
                'type': 'OPENSEARCH_SERVERLESS',
                'opensearchServerlessConfiguration': {
                    'collectionArn': 'arn:aws:aoss:us-east-1:056048976827:collection/kbs67wzzl0gxo81xw90h',
                    'vectorIndexName': 'bedrock-knowledge-base-default-index',
                    'fieldMapping': {
                        'vectorField': 'bedrock-knowledge-base-default-vector',
                        'textField': 'AMAZON_BEDROCK_TEXT_CHUNK',
                        'metadataField': 'AMAZON_BEDROCK_METADATA'
                    }
                }
            }
        )
        kb_id = response['knowledgeBase']['knowledgeBaseId']
        print(f"Created KB ID: {kb_id}")
    else:
        print(f"Knowledge Base already exists: {kb_id}")
    
    # Create Data Source
    sources = bedrock_agent.list_data_sources(knowledgeBaseId=kb_id)['dataSourceSummaries']
    ds_id = next((ds['dataSourceId'] for ds in sources if ds['name'] == DATA_SOURCE_NAME), None)
    
    if not ds_id:
        print("Creating Data Source...")
        response = bedrock_agent.create_data_source(
            knowledgeBaseId=kb_id,
            name=DATA_SOURCE_NAME,
            dataSourceConfiguration={
                'type': 'S3',
                's3Configuration': {
                    'bucketArn': f"arn:aws:s3:::{BUCKET_NAME}",
                    'inclusionPrefixes': ['schemes/']
                }
            }
        )
        ds_id = response['dataSource']['dataSourceId']
        print(f"Created Data Source ID: {ds_id}")
    else:
        print(f"Data Source already exists: {ds_id}")
    
    return kb_id, ds_id

def sync_kb(kb_id, ds_id):
    print("Starting sync...")
    response = bedrock_agent.start_ingestion_job(
        knowledgeBaseId=kb_id,
        dataSourceId=ds_id
    )
    job_id = response['ingestionJob']['ingestionJobId']
    print(f"Sync Job Started: {job_id}")
    
    while True:
        status = bedrock_agent.get_ingestion_job(
            knowledgeBaseId=kb_id,
            dataSourceId=ds_id,
            ingestionJobId=job_id
        )['ingestionJob']['status']
        print(f"Sync status: {status}")
        if status in ['COMPLETE', 'FAILED', 'STOPPED']:
            break
        time.sleep(5)

if __name__ == "__main__":
    create_s3_bucket()
    role_arn = get_iam_role()
    kb_id, ds_id = setup_kb(role_arn)
    sync_kb(kb_id, ds_id)
    print("Knowledge Base Setup and Sync Complete!")
