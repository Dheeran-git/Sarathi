@echo off
REM ============================================================
REM  Sarathi — AWS Resources Setup Script (Member 2)
REM  Run this AFTER Member 1 gives you IAM credentials
REM  and you have run 'aws configure' with your creds.
REM ============================================================

echo.
echo ===================================================
echo  Sarathi — Member 2 AWS Setup
echo ===================================================
echo.

set REGION=us-east-1

REM ── Step 1: Create S3 bucket for Polly audio output ─────────
echo [1/5] Creating S3 bucket for audio files...
aws s3 mb s3://sarathi-audio-output --region %REGION% 2>nul
echo      Done: sarathi-audio-output

REM ── Step 2: Set CORS on S3 bucket ──────────────────────────
echo [2/5] Setting CORS policy on S3 bucket...
echo [{"AllowedHeaders":["*"],"AllowedMethods":["GET"],"AllowedOrigins":["*"],"ExposeHeaders":[],"MaxAgeSeconds":3600}] > %TEMP%\cors.json
aws s3api put-bucket-cors --bucket sarathi-audio-output --cors-configuration file://%TEMP%\cors.json --region %REGION%
del %TEMP%\cors.json
echo      Done: CORS configured

REM ── Step 3: Create DynamoDB cache table ────────────────────
echo [3/5] Creating explanation cache table...
aws dynamodb create-table ^
  --table-name SarathiExplanationCache ^
  --attribute-definitions AttributeName=schemeId,AttributeType=S ^
  --key-schema AttributeName=schemeId,KeyType=HASH ^
  --billing-mode PAY_PER_REQUEST ^
  --region %REGION% ^
  --tags Key=Project,Value=Sarathi Key=Member,Value=Member2 2>nul
echo      Done: SarathiExplanationCache table

REM ── Step 4: Create SNS topic ───────────────────────────────
echo [4/5] Creating SNS topic for Panchayat alerts...
aws sns create-topic --name SarathiPanchayatAlerts --region %REGION% --tags Key=Project,Value=Sarathi
echo      Done: SarathiPanchayatAlerts topic

REM ── Step 5: Subscribe your email to SNS (for testing) ──────
echo [5/5] Subscribing test email to SNS topic...
echo.
echo ⚠️  IMPORTANT: Replace YOUR_EMAIL@example.com below with your real email!
echo     Then check your email and click the confirmation link.
echo.
REM Uncomment the next 3 lines after setting your email:
REM set EMAIL=YOUR_EMAIL@example.com
REM for /f "tokens=*" %%a in ('aws sns list-topics --region %REGION% --query "Topics[?contains(TopicArn,'SarathiPanchayatAlerts')].TopicArn" --output text') do set TOPIC_ARN=%%a
REM aws sns subscribe --topic-arn %TOPIC_ARN% --protocol email --notification-endpoint %EMAIL% --region %REGION%

echo.
echo ===================================================
echo  ✅ All AWS resources created!
echo.
echo  Next steps:
echo    1. Create Lex bot manually in AWS Console (see guide)
echo    2. Deploy Lambda functions: python lambda\deploy_lambdas.py
echo    3. Connect Lex to lex-fulfillment Lambda
echo    4. Enable Bedrock model access in console
echo ===================================================
echo.
pause
