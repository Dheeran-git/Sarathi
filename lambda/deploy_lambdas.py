#!/usr/bin/env python3
"""
Sarathi — Lambda Deployment Script
Member 2 · AWS AI Services

Packages and deploys all 3 Lambda functions to AWS.
Run: python deploy_lambdas.py

Prerequisites:
  - AWS CLI configured with correct credentials
  - IAM role 'sarathi-lambda-role' must exist
"""

import subprocess
import os
import zipfile
import json
import sys
import shutil

# ── Config ────────────────────────────────────────────────────────────
REGION = 'us-east-1'
ROLE_NAME = 'sarathi-lambda-role'
RUNTIME = 'python3.11'
PROJECT_ROOT = os.path.dirname(os.path.abspath(__file__))

LAMBDAS = [
    {
        'name': 'lex-fulfillment',
        'dir': 'lex-fulfillment',
        'handler': 'lambda_function.lambda_handler',
        'timeout': 10,
        'memory': 256,
        'env': {
            'ELIGIBILITY_LAMBDA': 'eligibility-engine',
            'CITIZENS_TABLE': 'SarathiCitizens',
        },
        'description': 'Sarathi Lex bot fulfillment — processes citizen profile and calls eligibility engine',
    },
    {
        'name': 'bedrock-explainer',
        'dir': 'bedrock-explainer',
        'handler': 'lambda_function.lambda_handler',
        'timeout': 15,
        'memory': 512,
        'env': {
            'AUDIO_BUCKET': 'sarathi-audio-output',
            'CACHE_TABLE': 'SarathiExplanationCache',
            'USE_CACHE': 'true',
            'BEDROCK_MODEL_ID': 'anthropic.claude-3-haiku-20240307-v1:0',
        },
        'description': 'Sarathi Bedrock explainer — Hindi scheme explanations + Polly audio',
    },
    {
        'name': 'panchayat-notifier',
        'dir': 'panchayat-notifier',
        'handler': 'lambda_function.lambda_handler',
        'timeout': 5,
        'memory': 128,
        'env': {
            'SNS_TOPIC_ARN': 'REPLACE_WITH_YOUR_SNS_TOPIC_ARN',
        },
        'description': 'Sarathi Panchayat notifier — sends SNS alerts for new eligible citizens',
    },
]


def get_role_arn():
    """Get the Lambda execution role ARN."""
    result = subprocess.run(
        ['aws', 'iam', 'get-role', '--role-name', ROLE_NAME, '--region', REGION],
        capture_output=True, text=True,
    )
    if result.returncode != 0:
        print(f"❌ Role '{ROLE_NAME}' not found. Create it first:")
        print(f"   See create_iam_role() below or ask Member 1.")
        sys.exit(1)
    role = json.loads(result.stdout)
    return role['Role']['Arn']


def package_lambda(lambda_config):
    """Create a ZIP file for the Lambda function."""
    dir_path = os.path.join(PROJECT_ROOT, lambda_config['dir'])
    zip_path = os.path.join(PROJECT_ROOT, f"{lambda_config['name']}.zip")

    # Remove old ZIP
    if os.path.exists(zip_path):
        os.remove(zip_path)

    with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zf:
        for root, dirs, files in os.walk(dir_path):
            for file in files:
                file_path = os.path.join(root, file)
                arcname = os.path.relpath(file_path, dir_path)
                zf.write(file_path, arcname)

    print(f"📦 Packaged: {zip_path}")
    return zip_path


def deploy_lambda(lambda_config, role_arn):
    """Deploy or update a Lambda function."""
    zip_path = package_lambda(lambda_config)
    func_name = lambda_config['name']

    env_vars = json.dumps({'Variables': lambda_config.get('env', {})})

    # Check if function exists
    check = subprocess.run(
        ['aws', 'lambda', 'get-function', '--function-name', func_name, '--region', REGION],
        capture_output=True, text=True,
    )

    if check.returncode == 0:
        # Update existing function
        print(f"🔄 Updating: {func_name}")
        subprocess.run([
            'aws', 'lambda', 'update-function-code',
            '--function-name', func_name,
            '--zip-file', f'fileb://{zip_path}',
            '--region', REGION,
        ], check=True)

        # Update config
        subprocess.run([
            'aws', 'lambda', 'update-function-configuration',
            '--function-name', func_name,
            '--timeout', str(lambda_config['timeout']),
            '--memory-size', str(lambda_config['memory']),
            '--environment', env_vars,
            '--region', REGION,
        ], check=True)
    else:
        # Create new function
        print(f"🆕 Creating: {func_name}")
        subprocess.run([
            'aws', 'lambda', 'create-function',
            '--function-name', func_name,
            '--runtime', RUNTIME,
            '--role', role_arn,
            '--handler', lambda_config['handler'],
            '--zip-file', f'fileb://{zip_path}',
            '--timeout', str(lambda_config['timeout']),
            '--memory-size', str(lambda_config['memory']),
            '--environment', env_vars,
            '--description', lambda_config.get('description', ''),
            '--region', REGION,
            '--tags', 'Project=Sarathi,Member=Member2,Environment=prod',
        ], check=True)

    print(f"✅ Deployed: {func_name}")

    # Clean up ZIP
    os.remove(zip_path)


def create_iam_role():
    """Create the IAM role needed for Member 2's Lambda functions."""
    trust_policy = {
        "Version": "2012-10-17",
        "Statement": [{
            "Effect": "Allow",
            "Principal": {"Service": "lambda.amazonaws.com"},
            "Action": "sts:AssumeRole"
        }]
    }

    print("🔑 Creating IAM role...")
    subprocess.run([
        'aws', 'iam', 'create-role',
        '--role-name', ROLE_NAME,
        '--assume-role-policy-document', json.dumps(trust_policy),
        '--region', REGION,
    ], check=True)

    # Attach required policies
    policies = [
        'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
        'arn:aws:iam::aws:policy/AmazonDynamoDBFullAccess',
        'arn:aws:iam::aws:policy/AmazonBedrockFullAccess',
        'arn:aws:iam::aws:policy/AmazonPollyFullAccess',
        'arn:aws:iam::aws:policy/AmazonSNSFullAccess',
        'arn:aws:iam::aws:policy/AmazonS3FullAccess',
        'arn:aws:iam::aws:policy/AWSLambda_FullAccess',
    ]
    for policy in policies:
        subprocess.run([
            'aws', 'iam', 'attach-role-policy',
            '--role-name', ROLE_NAME,
            '--policy-arn', policy,
        ], check=True)
        print(f"   ✅ Attached: {policy.split('/')[-1]}")

    print("✅ IAM role created. Wait 10 seconds for propagation before deploying.")


def main():
    if '--create-role' in sys.argv:
        create_iam_role()
        return

    print("=" * 60)
    print("🚀 Sarathi Lambda Deployment — Member 2 AI Services")
    print("=" * 60)

    role_arn = get_role_arn()
    print(f"📌 Role ARN: {role_arn}")

    for config in LAMBDAS:
        print(f"\n{'─' * 40}")
        deploy_lambda(config, role_arn)

    print(f"\n{'=' * 60}")
    print("✅ All Lambda functions deployed successfully!")
    print("=" * 60)
    print("\n🔗 Next steps:")
    print("  1. Go to AWS Console → Lambda → verify all 3 functions")
    print("  2. Connect 'lex-fulfillment' to SarathiBot in Lex console")
    print("  3. Test 'bedrock-explainer' with a scheme JSON payload")
    print("  4. Update SNS_TOPIC_ARN in 'panchayat-notifier' env vars")


if __name__ == '__main__':
    main()
