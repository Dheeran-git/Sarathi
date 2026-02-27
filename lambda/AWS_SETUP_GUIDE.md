# 🚀 Member 2 — Step-by-Step AWS Console Guide

Complete walkthrough for setting up Amazon Lex, Bedrock, Polly, and SNS.

---

## Prerequisites

### Get AWS Access from Member 1

Ask Member 1 for your IAM credentials with these policies attached:
- `AmazonLexFullAccess`
- `AmazonBedrockFullAccess`
- `AmazonPollyFullAccess`
- `AmazonSNSFullAccess`
- `AWSLambdaFullAccess`
- `AmazonDynamoDBFullAccess`
- `AmazonS3FullAccess`

### Configure AWS CLI

```bash
aws configure
# Access Key ID: (from Member 1)
# Secret Access Key: (from Member 1)
# Region: us-east-1
# Output: json
```

---

## STEP 1: Create AWS Resources (Automated)

Run the setup script to create S3 bucket, DynamoDB table, and SNS topic:

```bash
cd c:\Users\mohit\OneDrive\Desktop\Sarathi\lambda
setup_aws_resources.bat
```

---

## STEP 2: Create IAM Role for Lambda

```bash
python deploy_lambdas.py --create-role
```

Wait 10 seconds for AWS IAM to propagate.

---

## STEP 3: Deploy Lambda Functions

```bash
python deploy_lambdas.py
```

This deploys all 3 functions: `lex-fulfillment`, `bedrock-explainer`, `panchayat-notifier`.

---

## STEP 4: Enable Bedrock Model Access

1. Go to **AWS Console → Amazon Bedrock → Model access** (left sidebar)
2. Click **"Manage model access"**
3. Check ✅ **Anthropic → Claude 3 Haiku**
4. Click **"Request model access"**
5. Wait 1-2 minutes for approval (usually instant)

---

## STEP 5: Create SarathiBot in Amazon Lex

### 5.1 Create the Bot

1. Go to **AWS Console → Amazon Lex → Create bot**
2. Choose **"Create a blank bot"**
3. Settings:
   - **Bot name**: `SarathiBot`
   - **Description**: Sarathi welfare assistant for finding government schemes
   - **IAM permissions**: Create a role with basic Lex permissions
   - **COPPA**: No
   - **Idle session timeout**: 5 minutes
4. Click **"Next"**
5. **Language**: Add both:
   - `Hindi (hi_IN)` — Voice: **Aditi**
   - `English (en_US)` — Voice: **Joanna**

### 5.2 Create Custom Slot Types

Go to **Slot types** in the left sidebar. Create these:

| Slot Type Name | Values |
|----------------|--------|
| `IndianState` | UP, Bihar, Rajasthan, MP, Maharashtra, Gujarat, Tamil Nadu, Karnataka, Kerala, West Bengal, Odisha, Punjab, Haryana, Jharkhand, Chhattisgarh, Uttarakhand, Delhi |
| `CasteCategory` | SC, ST, OBC, General, सामान्य |
| `Gender` | male, female, other, पुरुष, महिला, अन्य |
| `YesNo` | yes, no, हाँ, नहीं |
| `Occupation` | farmer, laborer, unemployed, student, self-employed, किसान, मजदूर, बेरोजगार, छात्र |

### 5.3 Create the `CollectProfile` Intent

1. Click **Intents → Add intent → Add empty intent**
2. Name: `CollectProfile`
3. **Sample utterances** (add all):
   ```
   मुझे योजनाएं ढूंढनी हैं
   सरकारी योजना बताइए
   योजनाएं ढूंढें
   किसान हूँ
   विधवा पेंशन चाहिए
   I want to find schemes
   Find government schemes
   Help me find welfare schemes
   ```

4. **Add Slots** (in this order — Lex will ask them sequentially):

   | # | Slot Name | Slot Type | Prompt |
   |---|-----------|-----------|--------|
   | 1 | citizenName | AMAZON.FirstName | नमस्ते! मैं सारथी हूँ। आपकी सरकारी योजनाएं ढूंढने में मदद करूंगा। आपका शुभ नाम बताइए? |
   | 2 | citizenAge | AMAZON.Number | {citizenName} जी, आपकी उम्र कितनी है? |
   | 3 | citizenState | IndianState | आप कौन से राज्य में रहते हैं? |
   | 4 | monthlyIncome | AMAZON.Number | आपके परिवार की मासिक आय कितनी है? (रुपये में बताइए) |
   | 5 | category | CasteCategory | आपका वर्ग क्या है? — SC, ST, OBC, या सामान्य? |
   | 6 | gender | Gender | आप पुरुष हैं या महिला? |
   | 7 | isWidow | YesNo | क्या आप विधवा/विधुर हैं? (हाँ या नहीं) |
   | 8 | occupation | Occupation | आपका काम-धंधा क्या है? (किसान, मजदूर, बेरोजगार, छात्र, या अन्य) |

5. **Fulfillment**:
   - Toggle **"Active"** ON
   - Select Lambda function: `lex-fulfillment`
   - Version/Alias: `$LATEST`

6. **Closing response**:
   ```
   धन्यवाद! सारथी हमेशा आपकी सेवा में। 🙏
   ```

7. Click **"Save intent"**

### 5.4 Build and Test

1. Click **"Build"** (top right) — wait 30-60 seconds
2. Click **"Test"** to open the test window
3. Type: `मुझे योजनाएं ढूंढनी हैं`
4. Answer all 8 questions
5. Verify the bot returns scheme results from your Lambda

---

## STEP 6: Test Lambda Functions

### Test bedrock-explainer

1. Go to **AWS Console → Lambda → bedrock-explainer**
2. Click **"Test"** → Create test event
3. Paste this payload:

```json
{
  "scheme": {
    "id": "pm-kisan",
    "nameHindi": "प्रधानमंत्री किसान सम्मान निधि",
    "annualBenefit": 6000,
    "benefitDescription": "₹6,000 प्रति वर्ष तीन किश्तों में छोटे किसानों को।",
    "eligibility": { "minAge": 18, "occupation": ["farmer"] }
  }
}
```

4. Click **"Test"** — verify you get:
   - `explanationHindi`: A 2-sentence Hindi explanation
   - `audioUrl`: A pre-signed S3 URL (click to test playback)

### Test panchayat-notifier

1. Go to **Lambda → panchayat-notifier**
2. Update the `SNS_TOPIC_ARN` env variable with your actual ARN
3. Paste test payload from `test_payloads.json` → `panchayatNotifier` event
4. Click **"Test"** — check your email for the notification

---

## STEP 7: Set Up Billing Alerts (Critical!)

1. Go to **AWS Billing → Budgets → Create budget**
2. Create a **$15 monthly budget** with alerts at:
   - $5 (33%) — email notification
   - $10 (67%) — email notification
   - $15 (100%) — email notification

---

## STEP 8: Update SNS Topic ARN

After the SNS topic is created:

1. Go to **SNS → Topics → SarathiPanchayatAlerts**
2. Copy the **Topic ARN** (looks like `arn:aws:sns:us-east-1:123456:SarathiPanchayatAlerts`)
3. Go to **Lambda → panchayat-notifier → Configuration → Environment variables**
4. Set `SNS_TOPIC_ARN` = your copied ARN
5. Click **Save**

---

## Quick Reference — What You Built

| Service | Resource Name | Purpose |
|---------|---------------|---------|
| **Lex** | SarathiBot | Conversational chatbot |
| **Lambda** | lex-fulfillment | Processes Lex responses |
| **Lambda** | bedrock-explainer | Hindi explanations + audio |
| **Lambda** | panchayat-notifier | SMS/email alerts |
| **Bedrock** | Claude 3 Haiku | AI explanation generation |
| **Polly** | Aditi voice | Hindi text-to-speech |
| **S3** | sarathi-audio-output | Audio file storage |
| **SNS** | SarathiPanchayatAlerts | Panchayat notifications |
| **DynamoDB** | SarathiExplanationCache | Cache AI explanations |

---

## Estimated AWS Costs

| Service | Daily Cost | 5-Day Total |
|---------|-----------|-------------|
| Lex | $0.50 | $2.50 |
| Bedrock (Claude Haiku) | $0.20 | $1.00 |
| Polly | $0.10 | $0.50 |
| Lambda | $0.05 | $0.25 |
| S3 | $0.01 | $0.05 |
| SNS | $0.05 | $0.25 |
| DynamoDB | $0.05 | $0.25 |
| **Total** | **~$0.96** | **~$4.80** |

Well within your $100 budget! 💰
