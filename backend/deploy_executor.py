import boto3
import zipfile
import io
import os

REGION = 'us-east-1'
FUNCTION_NAME = 'sarathi-agent-executor'

lam = boto3.client('lambda', region_name=REGION)

def deploy():
    print(f"Deploying code for {FUNCTION_NAME}...")
    executor_path = os.path.join('lambdas', 'bedrock_agent_executor.py')
    
    with open(executor_path, 'r') as f:
        code = f.read()

    buf = io.BytesIO()
    with zipfile.ZipFile(buf, 'w', zipfile.ZIP_DEFLATED) as zf:
        zf.writestr('lambda_function.py', code)
    zip_bytes = buf.getvalue()

    try:
        lam.update_function_code(FunctionName=FUNCTION_NAME, ZipFile=zip_bytes)
        print("Success: Updated Lambda function code.")
    except Exception as e:
        print(f"Error updating Lambda: {e}")

if __name__ == "__main__":
    deploy()
