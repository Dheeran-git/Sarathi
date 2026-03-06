"""
setup_knowledge_base.py — One-time setup script
Creates:
  1. OpenSearch Serverless collection 'sarathi-scheme-search' (VECTORSEARCH)
  2. Required encryption/network/data access policies
  3. Bedrock Knowledge Base 'sarathi-scheme-kb' with Titan embedding
  4. Data source pointing to sarathi-knowledge-base-docs S3 bucket
  5. Ingestion job to index all scheme documents

Prerequisites:
  - run generate_kb_documents.py first
  - SarathiLambdaRole and SarathiBedrockKBRole must exist (or will be created)
  - AWS credentials with aoss:*, bedrock:*, iam:* permissions

Run: python backend/setup_knowledge_base.py
"""
import json
import time
import boto3

REGION = 'us-east-1'
ACCOUNT_ID = boto3.client('sts').get_caller_identity()['Account']

KB_BUCKET = 'sarathi-knowledge-base-docs'
COLLECTION_NAME = 'sarathi-scheme-search'
KB_NAME = 'sarathi-scheme-kb'
KB_ROLE_NAME = 'SarathiBedrockKBRole'
LAMBDA_ROLE_NAME = 'SarathiLambdaRole'

aoss = boto3.client('opensearchserverless', region_name=REGION)
bedrock_agent = boto3.client('bedrock-agent', region_name=REGION)
iam = boto3.client('iam')


def get_or_create_kb_role():
    """Create SarathiBedrockKBRole if it doesn't exist."""
    role_arn = f"arn:aws:iam::{ACCOUNT_ID}:role/{KB_ROLE_NAME}"
    try:
        iam.get_role(RoleName=KB_ROLE_NAME)
        print(f"  Role {KB_ROLE_NAME} already exists")
        return role_arn
    except iam.exceptions.NoSuchEntityException:
        pass

    trust_policy = json.dumps({
        "Version": "2012-10-17",
        "Statement": [{
            "Effect": "Allow",
            "Principal": {"Service": "bedrock.amazonaws.com"},
            "Action": "sts:AssumeRole",
        }]
    })

    iam.create_role(
        RoleName=KB_ROLE_NAME,
        AssumeRolePolicyDocument=trust_policy,
        Description="Role for Sarathi Bedrock Knowledge Base",
    )

    kb_policy = json.dumps({
        "Version": "2012-10-17",
        "Statement": [
            {
                "Effect": "Allow",
                "Action": ["s3:GetObject", "s3:ListBucket"],
                "Resource": [
                    f"arn:aws:s3:::{KB_BUCKET}",
                    f"arn:aws:s3:::{KB_BUCKET}/*",
                ],
            },
            {
                "Effect": "Allow",
                "Action": ["aoss:APIAccessAll"],
                "Resource": f"arn:aws:aoss:{REGION}:{ACCOUNT_ID}:collection/*",
            },
            {
                "Effect": "Allow",
                "Action": ["bedrock:InvokeModel"],
                "Resource": f"arn:aws:bedrock:{REGION}::foundation-model/amazon.titan-embed-text-v2:0",
            },
        ]
    })

    iam.put_role_policy(
        RoleName=KB_ROLE_NAME,
        PolicyName='SarathiBedrockKBPolicy',
        PolicyDocument=kb_policy,
    )
    print(f"  Created role {KB_ROLE_NAME}")
    return role_arn


def setup_opensearch():
    """Create OpenSearch Serverless collection with required policies."""
    lambda_role_arn = f"arn:aws:iam::{ACCOUNT_ID}:role/{LAMBDA_ROLE_NAME}"
    kb_role_arn = f"arn:aws:iam::{ACCOUNT_ID}:role/{KB_ROLE_NAME}"

    # Encryption policy
    try:
        aoss.create_security_policy(
            name='sarathi-search-encryption',
            type='encryption',
            policy=json.dumps({
                "Rules": [{"ResourceType": "collection", "Resource": [f"collection/{COLLECTION_NAME}"]}],
                "AWSOwnedKey": True,
            }),
        )
        print("  Created encryption policy")
    except aoss.exceptions.ConflictException:
        print("  Encryption policy already exists")

    # Network policy
    try:
        aoss.create_security_policy(
            name='sarathi-search-network',
            type='network',
            policy=json.dumps([{
                "Rules": [
                    {"ResourceType": "collection", "Resource": [f"collection/{COLLECTION_NAME}"]},
                    {"ResourceType": "dashboard", "Resource": [f"collection/{COLLECTION_NAME}"]},
                ],
                "AllowFromPublic": True,
            }]),
        )
        print("  Created network policy")
    except aoss.exceptions.ConflictException:
        print("  Network policy already exists")

    # Data access policy
    try:
        aoss.create_access_policy(
            name='sarathi-search-data-access',
            type='data',
            policy=json.dumps([{
                "Rules": [
                    {
                        "ResourceType": "collection",
                        "Resource": [f"collection/{COLLECTION_NAME}"],
                        "Permission": ["aoss:CreateCollectionItems", "aoss:DeleteCollectionItems",
                                       "aoss:UpdateCollectionItems", "aoss:DescribeCollectionItems"],
                    },
                    {
                        "ResourceType": "index",
                        "Resource": [f"index/{COLLECTION_NAME}/*"],
                        "Permission": ["aoss:CreateIndex", "aoss:DeleteIndex", "aoss:UpdateIndex",
                                       "aoss:DescribeIndex", "aoss:ReadDocument", "aoss:WriteDocument"],
                    },
                ],
                "Principal": [lambda_role_arn, kb_role_arn, f"arn:aws:iam::{ACCOUNT_ID}:root"],
            }]),
        )
        print("  Created data access policy")
    except aoss.exceptions.ConflictException:
        print("  Data access policy already exists")

    # Create collection
    try:
        resp = aoss.create_collection(
            name=COLLECTION_NAME,
            type='VECTORSEARCH',
            description='Sarathi scheme document vector store',
        )
        collection_id = resp['createCollectionDetail']['id']
        print(f"  Collection created: {collection_id}")
    except aoss.exceptions.ConflictException:
        existing = aoss.list_collections(collectionFilters={'name': COLLECTION_NAME})
        collection_id = existing['collectionSummaries'][0]['id']
        print(f"  Collection already exists: {collection_id}")

    # Wait for ACTIVE status
    print("  Waiting for collection to become ACTIVE (this may take 2-5 minutes)...")
    for _ in range(60):
        resp = aoss.batch_get_collection(ids=[collection_id])
        status = resp['collectionDetails'][0]['status']
        print(f"    Status: {status}")
        if status == 'ACTIVE':
            break
        time.sleep(10)
    else:
        raise TimeoutError("Collection did not become ACTIVE within 10 minutes")

    collection_endpoint = resp['collectionDetails'][0]['collectionEndpoint']
    print(f"  Collection endpoint: {collection_endpoint}")
    return collection_id, collection_endpoint


def create_knowledge_base(kb_role_arn, collection_id):
    """Create the Bedrock Knowledge Base."""
    try:
        resp = bedrock_agent.create_knowledge_base(
            name=KB_NAME,
            description='Sarathi scheme documents for RAG',
            roleArn=kb_role_arn,
            knowledgeBaseConfiguration={
                'type': 'VECTOR',
                'vectorKnowledgeBaseConfiguration': {
                    'embeddingModelArn': f'arn:aws:bedrock:{REGION}::foundation-model/amazon.titan-embed-text-v2:0',
                },
            },
            storageConfiguration={
                'type': 'OPENSEARCH_SERVERLESS',
                'opensearchServerlessConfiguration': {
                    'collectionArn': f'arn:aws:aoss:{REGION}:{ACCOUNT_ID}:collection/{collection_id}',
                    'vectorIndexName': 'sarathi-schemes-index',
                    'fieldMapping': {
                        'vectorField': 'embedding',
                        'textField': 'text',
                        'metadataField': 'metadata',
                    },
                },
            },
        )
        kb_id = resp['knowledgeBase']['knowledgeBaseId']
        print(f"  Knowledge Base created: {kb_id}")
        return kb_id
    except bedrock_agent.exceptions.ConflictException:
        existing = bedrock_agent.list_knowledge_bases(maxResults=20)
        for kb in existing.get('knowledgeBaseSummaries', []):
            if kb['name'] == KB_NAME:
                print(f"  Knowledge Base already exists: {kb['knowledgeBaseId']}")
                return kb['knowledgeBaseId']
        raise


def create_data_source(kb_id):
    """Create S3 data source and start ingestion."""
    try:
        resp = bedrock_agent.create_data_source(
            knowledgeBaseId=kb_id,
            name='sarathi-schemes-s3',
            description='Scheme documents from S3',
            dataSourceConfiguration={
                'type': 'S3',
                's3Configuration': {
                    'bucketArn': f'arn:aws:s3:::{KB_BUCKET}',
                    'inclusionPrefixes': ['schemes/'],
                },
            },
            vectorIngestionConfiguration={
                'chunkingConfiguration': {
                    'chunkingStrategy': 'FIXED_SIZE',
                    'fixedSizeChunkingConfiguration': {
                        'maxTokens': 512,
                        'overlapPercentage': 20,
                    },
                },
            },
        )
        ds_id = resp['dataSource']['dataSourceId']
        print(f"  Data source created: {ds_id}")
        return ds_id
    except bedrock_agent.exceptions.ConflictException:
        existing = bedrock_agent.list_data_sources(knowledgeBaseId=kb_id)
        ds_id = existing['dataSourceSummaries'][0]['dataSourceId']
        print(f"  Data source already exists: {ds_id}")
        return ds_id


def start_ingestion(kb_id, ds_id):
    """Start ingestion job to index documents."""
    resp = bedrock_agent.start_ingestion_job(
        knowledgeBaseId=kb_id,
        dataSourceId=ds_id,
    )
    job_id = resp['ingestionJob']['ingestionJobId']
    print(f"  Ingestion job started: {job_id}")
    return job_id


def main():
    print("=== Sarathi Knowledge Base Setup ===\n")

    print("1. Creating SarathiBedrockKBRole...")
    kb_role_arn = get_or_create_kb_role()

    print("\n2. Setting up OpenSearch Serverless...")
    collection_id, collection_endpoint = setup_opensearch()

    print("\n3. Creating Bedrock Knowledge Base...")
    kb_id = create_knowledge_base(kb_role_arn, collection_id)

    print("\n4. Creating S3 data source...")
    ds_id = create_data_source(kb_id)

    print("\n5. Starting ingestion job...")
    job_id = start_ingestion(kb_id, ds_id)

    print("\n=== DONE ===")
    print("\nSave these IDs — add them to Lambda environment variables:")
    print(f"  KB_ID={kb_id}")
    print(f"  DATA_SOURCE_ID={ds_id}")
    print(f"  COLLECTION_ID={collection_id}")
    print(f"  COLLECTION_ENDPOINT={collection_endpoint}")
    print("\nNext step: Run setup_bedrock_agents.py with KB_ID set")


if __name__ == '__main__':
    main()
