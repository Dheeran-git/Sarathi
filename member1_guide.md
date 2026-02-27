⚙️

# **MEMBER 1**

## **Backend & AWS Lead**

*Your Complete Personal Guide — Every Task, Every Day, Every Line of Code*

**Team Boolean Bandits · Sarathi Platform · AWS AI for Bharat Hackathon**

---

# Your Role — What You Are

You are the foundation of the entire project. Every other member's work depends on what you build. Member 2 cannot connect Lex to anything until you have a Lambda ready. Member 3 cannot show real data until your API is live. Member 4 cannot test anything until your endpoints exist. You are not just a backend developer — you are the infrastructure on which the entire Sarathi platform runs.

---

> 🏗️ **Your Domain in One Line**
>
> You own everything that runs on AWS servers: DynamoDB tables, Lambda functions, API Gateway, S3 storage, IAM permissions, billing monitoring, and CloudWatch logs. If it runs in the cloud, it's yours.

---

## **What You Own vs. What You Don't**

| YOU OWN (Member 1) | NOT YOUR RESPONSIBILITY |
|---|---|
| DynamoDB — creating tables, seeding data, managing indexes | Amazon Lex bot setup → Member 2 |
| All 6 Lambda functions — writing, testing, deploying | Amazon Bedrock / Polly → Member 2 |
| API Gateway — all routes, CORS, deployment stages | React frontend code → Member 3 |
| IAM roles for Lambda execution | Amplify hosting setup → Member 3 |
| S3 buckets for document storage and audio files | Cognito user pool setup → Member 4 |
| CloudWatch monitoring and Lambda logs | Demo scripts and video → Member 4 |
| AWS billing monitoring (your account) | GitHub README → Member 4 |
| Sharing API contracts and documentation with the team | |

---

# Tools You Need Installed on Your Laptop

Before you write a single line of code, make sure all of these are installed and working. This takes about 30–45 minutes but saves hours of frustration later.

| # | Tool |
|---|---|
| 01 | **Python 3.11** — All your Lambda functions will be written in Python 3.11. Check by running: `python3 --version` in your terminal. If not installed, download from python.org. |
| 02 | **AWS CLI (Command Line Interface)** — The tool that lets you control AWS from your terminal instead of clicking around the console. Install from: docs.aws.amazon.com/cli/latest/userguide/install-cliv2.html |
| 03 | **AWS SAM CLI (optional but recommended)** — Makes deploying Lambda functions much easier. Install from: docs.aws.amazon.com/serverless-application-model/latest/developerguide/install-sam-cli.html |
| 04 | **Postman** — The tool for testing your APIs. Download free from postman.com. You'll use this every single day to verify your Lambdas are working before handing them to Member 3. |
| 05 | **VS Code with Python extension** — Your code editor. Install the Python extension and AWS Toolkit extension inside VS Code. The AWS Toolkit lets you deploy Lambdas directly from VS Code. |
| 06 | **Git + GitHub account** — For pushing your Lambda code. Make sure you're added as a collaborator to the team's GitHub repo by Member 4. |

---

### **Configure AWS CLI — Do This Right Now**

Open your terminal and run this command:

```
aws configure
```

It will ask you 4 things. Fill them in exactly like this:

| It Asks | What You Type |
|---|---|
| AWS Access Key ID | Your access key from IAM (go to IAM → Users → your user → Security credentials → Create access key) |
| AWS Secret Access Key | The secret key shown once when you create the access key — copy it immediately |
| Default region name | ap-south-1 |
| Default output format | json |

Test it worked by running:

```
aws s3 ls
```

If you see an empty list or a list of S3 buckets — you're connected. If you see an error — your keys are wrong, redo the IAM access key step.

---

# Your Day-by-Day Plan

You have 5 days. Here is exactly what you do each day, in what order, and why. Do not skip steps. Each step is a dependency for the next.

---

## DAY 1 — Morning: AWS Account Setup (9 AM – 12 PM)

| DAY 1 — Foundation | 🎯 **Your Goal Today:** DynamoDB tables created and seeded with real scheme data. Lambda execution role created. Team has AWS access. Billing is monitored. |
|---|---|

You are the account owner. Do these in order before letting anyone else touch anything.

**Task 1 — Verify billing credits are applied:**

- Go to AWS Console → search 'Billing' → click Credits
- Confirm $100.00 USD shows as available credit
- If not showing, re-redeem the credit code from the email

**Task 2 — Verify billing alerts exist:**

- Go to Billing → Budgets
- Confirm 3 alerts exist: $40, $70, $90
- If missing, create them now (this was done in the IAM setup session)

**Task 3 — Verify all team members can log in:**

- Message the team group — ask each member to confirm they can access the AWS console
- Ask each to confirm their region is set to ap-south-1 (Mumbai) — top right of console
- If anyone has access issues, fix IAM permissions now before the day goes further

---

## DAY 1 — Afternoon: DynamoDB Tables (12 PM – 5 PM)

DynamoDB is your database. You need to create 2 tables and fill them with data. This is the most important thing you do on Day 1 — every other part of the system depends on this data existing.

**Task 4 — Create the Schemes Table:**

- Go to AWS Console → search 'DynamoDB' → click it
- Click 'Create table'
- Table name: SarathiSchemes
- Partition key: schemeId (type: String)
- Table settings: select 'Customize settings'
- Capacity mode: select 'On-demand' (NOT provisioned — on-demand means you pay per request, not per hour. Much cheaper for hackathon.)
- Leave everything else as default → click 'Create table'
- Wait ~1 minute for table status to show 'Active'

**Task 5 — Create the Citizens Table:**

- Click 'Create table' again
- Table name: SarathiCitizens
- Partition key: citizenId (type: String)
- Capacity mode: On-demand
- Click 'Create table' → wait for Active status

**Task 6 — Seed the Schemes Table with Real Data:**

This is the most important task of Day 1. You need to manually enter 18 real Indian government schemes into DynamoDB. Here is exactly how:

- Go to DynamoDB → Tables → SarathiSchemes → click 'Explore table items'
- Click 'Create item'
- Switch from 'Form' view to 'JSON' view (toggle at top)
- Paste one scheme at a time using the JSON below

> 📋 **Copy-Paste This JSON for Each Scheme**
>
> Click 'Create item' in DynamoDB, switch to JSON view, paste the JSON below, change the values for each scheme, click 'Create item'. Repeat for all 18 schemes.

**Scheme 1 — PM-KISAN (paste this exact JSON):**

```json
{
  "schemeId": { "S": "pm-kisan" },
  "nameHindi": { "S": "प्रधानमंत्री किसान सम्मान निधि" },
  "nameEnglish": { "S": "PM-KISAN" },
  "ministry": { "S": "Ministry of Agriculture & Farmers Welfare" },
  "category": { "S": "agriculture" },
  "annualBenefit": { "N": "6000" },
  "benefitType": { "S": "Direct Bank Transfer" },
  "minAge": { "N": "18" },
  "maxAge": { "N": "99" },
  "gender": { "S": "any" },
  "maxMonthlyIncome": { "N": "99999" },
  "occupation": { "S": "farmer" },
  "isWidow": { "S": "any" },
  "categories": { "S": "SC,ST,OBC,General" },
  "applyUrl": { "S": "https://pmkisan.gov.in" }
}
```

**All 18 schemes to enter — use the same JSON structure, just change the values:**

| schemeId | nameEnglish | category | annualBenefit (₹) | occupation | gender | isWidow | maxMonthlyIncome |
|---|---|---|---|---|---|---|---|
| pm-kisan | PM-KISAN | agriculture | 6000 | farmer | any | any | 99999 |
| pmay-g | PM Awas Yojana (Gramin) | housing | 120000 | any | any | any | 5000 |
| ayushman-bharat | Ayushman Bharat PMJAY | health | 500000 | any | any | any | 4167 |
| pm-ujjwala | PM Ujjwala Yojana | women | 1600 | any | female | any | 3333 |
| mgnregs | MGNREGS | employment | 36000 | any | any | any | 99999 |
| widow-pension | Indira Gandhi Widow Pension | women | 18000 | any | female | true | 3333 |
| nsp-scholarship | National Scholarship Portal | education | 25000 | student | any | any | 8333 |
| beti-bachao | Beti Bachao Beti Padhao | women | 15000 | any | female | any | 99999 |
| pm-matru | PM Matru Vandana Yojana | women | 5000 | any | female | any | 99999 |
| pmegp | PM Employment Generation Programme | employment | 250000 | any | any | any | 99999 |
| nrlm-shg | Aajeevika — NRLM | employment | 15000 | any | female | any | 5000 |
| pmjjby | PM Jeevan Jyoti Bima Yojana | health | 200000 | any | any | any | 99999 |
| atal-pension | Atal Pension Yojana | employment | 60000 | any | any | any | 99999 |
| jan-dhan | PM Jan Dhan Yojana | employment | 10000 | any | any | any | 99999 |
| sukanya | Sukanya Samridhi Yojana | education | 65000 | student | female | any | 99999 |
| nfbs | National Family Benefit Scheme | women | 20000 | any | any | any | 3333 |
| vayoshri | Rashtriya Vayoshri Yojana | health | 5000 | any | any | any | 2500 |
| old-age-pension | Indira Gandhi Old Age Pension | health | 12000 | any | any | any | 3333 |

> ⚠️ **Important Notes on Income Values**
>
> The maxMonthlyIncome values above are in rupees per month. 99999 means no income limit. 4167 means ₹50,000/year BPL threshold. 3333 means ₹40,000/year poverty line.

**Task 7 — Create Lambda Execution Role:**

- Go to IAM → Roles → Create role
- Trusted entity type: AWS service
- Use case: Lambda → click Next
- Search and attach these policies: AmazonDynamoDBFullAccess, AmazonBedrockFullAccess, AmazonPollyFullAccess, AmazonSNSFullAccess, CloudWatchLogsFullAccess, AmazonS3FullAccess
- Role name: SarathiLambdaRole → click Create role
- Copy the Role ARN — you'll need it when creating each Lambda

> ✅ **End of Day 1 Checklist**
>
> Before sleeping: (1) $100 credits confirmed in billing. (2) Both DynamoDB tables are Active. (3) All 18 schemes are in SarathiSchemes table. (4) SarathiLambdaRole is created. (5) All team members confirmed AWS console access.

---

## DAY 2 — Build All 6 Lambda Functions

| DAY 2 — Lambda Functions | 🎯 **Your Goal Today:** All 6 Lambda functions written, deployed, and individually tested with real test data. API Gateway routes created. |
|---|---|

Today is your heaviest coding day. You will write 6 Python functions and deploy each one to AWS Lambda. Follow this exact order — each one builds on the previous.

**How to Create a Lambda Function (do this for each one below)**

- Go to AWS Console → search 'Lambda' → click it
- Click 'Create function'
- Choose 'Author from scratch'
- Function name: (use the name given below)
- Runtime: Python 3.11
- Execution role: select 'Use an existing role' → select SarathiLambdaRole
- Click 'Create function'
- In the code editor, delete the default code and paste your Python code
- Click 'Deploy' (orange button) — this saves and deploys your code
- Click 'Test' to run it with a test event — create a test event using the JSON input shown below

> 💡 **Set These on Every Lambda**
>
> After creating each Lambda, click 'Configuration' tab → General configuration → Edit → set Timeout to 30 seconds and Memory to 256 MB. The default 3-second timeout will cause failures.

---

### **Lambda 1 — sarathi-eligibility-engine**

This is the most important Lambda. It receives a citizen's profile and returns all schemes they qualify for.

**Full Python code — paste this exactly:**

```python
import json
import boto3
from boto3.dynamodb.conditions import Attr

dynamodb = boto3.resource('dynamodb', region_name='ap-south-1')
schemes_table = dynamodb.Table('SarathiSchemes')

def lambda_handler(event, context):
    # Parse input
    body = json.loads(event.get('body', '{}')) if isinstance(event.get('body'), str) else event
    age = int(body.get('age', 0))
    gender = body.get('gender', 'any').lower()
    monthly_income = int(body.get('monthlyIncome', 0))
    is_widow = bool(body.get('isWidow', False))
    occupation = body.get('occupation', 'any').lower()
    category = body.get('category', 'General')

    # Fetch all schemes from DynamoDB
    response = schemes_table.scan()
    all_schemes = response['Items']

    matched = []
    for scheme in all_schemes:
        # Check age
        if age < int(scheme.get('minAge', 0)): continue
        if age > int(scheme.get('maxAge', 99)): continue

        # Check income
        max_income = int(scheme.get('maxMonthlyIncome', 99999))
        if monthly_income > max_income: continue

        # Check gender
        scheme_gender = scheme.get('gender', 'any')
        if scheme_gender != 'any' and scheme_gender != gender: continue

        # Check widow requirement
        widow_req = scheme.get('isWidow', 'any')
        if widow_req == 'true' and not is_widow: continue

        # Check occupation
        scheme_occ = scheme.get('occupation', 'any')
        if scheme_occ != 'any' and scheme_occ != occupation: continue

        matched.append({
            'schemeId': scheme['schemeId'],
            'nameHindi': scheme.get('nameHindi', ''),
            'nameEnglish': scheme.get('nameEnglish', ''),
            'category': scheme.get('category', ''),
            'annualBenefit': int(scheme.get('annualBenefit', 0)),
            'ministry': scheme.get('ministry', ''),
            'applyUrl': scheme.get('applyUrl', ''),
        })

    # Sort by annual benefit (highest first)
    matched.sort(key=lambda x: x['annualBenefit'], reverse=True)

    total = sum(s['annualBenefit'] for s in matched)

    return {
        'statusCode': 200,
        'headers': {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'application/json'
        },
        'body': json.dumps({
            'matchedSchemes': matched,
            'totalAnnualBenefit': total,
            'schemesCount': len(matched)
        })
    }
```

**Test event to use (paste in Lambda test console):**

```json
{
  "age": 55,
  "gender": "female",
  "monthlyIncome": 2000,
  "isWidow": true,
  "occupation": "any",
  "category": "SC"
}
```

Expected result: You should see at least 6–8 matched schemes including widow-pension, pmay-g, ayushman-bharat, pm-ujjwala, mgnregs, nfbs.

---

### **Lambda 2 — sarathi-digital-twin**

Takes a citizen profile and their matched schemes. Returns a 3-year monthly income projection showing how their income grows as they enroll in schemes one by one.

```python
import json

def lambda_handler(event, context):
    body = json.loads(event.get('body', '{}')) if isinstance(event.get('body'), str) else event
    current_income = int(body.get('monthlyIncome', 2000))
    matched_schemes = body.get('matchedSchemes', [])
    poverty_line = 8000  # rupees per month

    # Sort schemes by annual benefit ascending (take easiest/smallest first)
    schemes_sorted = sorted(matched_schemes, key=lambda x: x.get('annualBenefit', 0))

    def generate_pathway(schemes_to_use):
        income = current_income
        data_points = []
        scheme_index = 0
        months_per_scheme = max(2, 36 // max(len(schemes_to_use), 1))

        for month in range(1, 37):  # 36 months = 3 years
            # Enroll a new scheme every few months
            if scheme_index < len(schemes_to_use) and month % months_per_scheme == 1:
                scheme = schemes_to_use[scheme_index]
                income += int(scheme.get('annualBenefit', 0)) / 12
                scheme_name = scheme.get('nameEnglish', '')
                scheme_index += 1
            else:
                scheme_name = None

            data_points.append({
                'month': month,
                'income': round(income),
                'scheme': scheme_name
            })
        return data_points

    def months_to_exit(pathway):
        for point in pathway:
            if point['income'] >= poverty_line:
                return point['month']
        return None

    best_path   = generate_pathway(schemes_sorted)
    medium_path = generate_pathway(schemes_sorted[:max(1, len(schemes_sorted)//2)])
    min_path    = generate_pathway(schemes_sorted[:3])

    return {
        'statusCode': 200,
        'headers': { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
        'body': json.dumps({
            'currentMonthlyIncome': current_income,
            'povertyLine': poverty_line,
            'pathways': {
                'best':   best_path,
                'medium': medium_path,
                'minimum': min_path
            },
            'monthsToPovertyExit': {
                'best':    months_to_exit(best_path),
                'medium':  months_to_exit(medium_path),
                'minimum': months_to_exit(min_path)
            }
        })
    }
```

---

### **Lambda 3 — sarathi-scheme-fetch**

Simple lookup — takes a schemeId, returns full scheme details from DynamoDB.

```python
import json
import boto3

dynamodb = boto3.resource('dynamodb', region_name='ap-south-1')
table = dynamodb.Table('SarathiSchemes')

def lambda_handler(event, context):
    scheme_id = event.get('pathParameters', {}).get('schemeId', '')
    if not scheme_id:
        scheme_id = event.get('schemeId', '')

    response = table.get_item(Key={ 'schemeId': scheme_id })
    item = response.get('Item')

    if not item:
        return {
            'statusCode': 404,
            'headers': { 'Access-Control-Allow-Origin': '*' },
            'body': json.dumps({ 'error': 'Scheme not found' })
        }

    return {
        'statusCode': 200,
        'headers': { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
        'body': json.dumps(item)
    }
```

---

### **Lambda 4 — sarathi-panchayat-stats**

Returns village-level stats for the Panchayat Dashboard. Reads from the SarathiCitizens table.

```python
import json
import boto3
from boto3.dynamodb.conditions import Attr

dynamodb = boto3.resource('dynamodb', region_name='ap-south-1')
citizens_table = dynamodb.Table('SarathiCitizens')

def lambda_handler(event, context):
    panchayat_id = event.get('pathParameters', {}).get('panchayatId', 'rampur-barabanki-up')

    # Scan for all citizens in this panchayat
    response = citizens_table.scan(
        FilterExpression=Attr('panchayatId').eq(panchayat_id)
    )
    citizens = response.get('Items', [])

    # Count by status
    enrolled = [c for c in citizens if c.get('status') == 'enrolled']
    eligible  = [c for c in citizens if c.get('status') == 'eligible']
    zero      = [c for c in citizens if c.get('status') == 'none']

    # Build alerts
    alerts = []
    widows_unserved = [c for c in eligible if c.get('isWidow') == 'true']
    if widows_unserved:
        alerts.append({
            'type': 'widow_pension',
            'urgency': 'high',
            'count': len(widows_unserved),
            'title': f'{len(widows_unserved)} विधवाएं पेंशन से वंचित',
            'description': f'{len(widows_unserved)} widows eligible for pension but not enrolled'
        })

    elderly_unserved = [c for c in eligible if int(c.get('age', 0)) >= 60]
    if elderly_unserved:
        alerts.append({
            'type': 'old_age_pension',
            'urgency': 'high',
            'count': len(elderly_unserved),
            'title': f'{len(elderly_unserved)} बुजुर्ग पेंशन से वंचित',
            'description': f'{len(elderly_unserved)} elderly citizens missing old age pension'
        })

    return {
        'statusCode': 200,
        'headers': { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
        'body': json.dumps({
            'panchayatId': panchayat_id,
            'panchayatName': 'Rampur Panchayat',
            'district': 'Barabanki',
            'state': 'Uttar Pradesh',
            'totalHouseholds': len(citizens),
            'enrolled': len(enrolled),
            'eligibleNotEnrolled': len(eligible),
            'zeroBenefits': len(zero),
            'households': citizens,
            'alerts': alerts
        })
    }
```

---

### **Lambda 5 — sarathi-conflict-detector**

Checks matched schemes for conflicts and returns the optimal bundle recommendation.

```python
import json

# Hardcoded conflict rules
CONFLICTS = [
    {
        'scheme1': 'pmegp',
        'scheme2': 'nrlm-shg',
        'reason': 'Cannot receive two entrepreneurship loans simultaneously',
        'recommended': 'nrlm-shg',
        'reasoning': 'NRLM SHG has lower interest rate — better for first-time borrowers'
    },
    {
        'scheme1': 'mgnregs',
        'scheme2': 'pmegp',
        'reason': 'PMEGP income from business disqualifies from MGNREGS wage employment',
        'recommended': 'pmegp',
        'reasoning': 'PMEGP provides higher long-term income than MGNREGS daily wages'
    },
]

def lambda_handler(event, context):
    body = json.loads(event.get('body', '{}')) if isinstance(event.get('body'), str) else event
    matched_ids = [s.get('schemeId', '') for s in body.get('matchedSchemes', [])]
    matched_schemes = body.get('matchedSchemes', [])

    detected_conflicts = []
    excluded = set()

    for conflict in CONFLICTS:
        if conflict['scheme1'] in matched_ids and conflict['scheme2'] in matched_ids:
            detected_conflicts.append(conflict)
            # Remove the non-recommended scheme from optimal bundle
            for s in [conflict['scheme1'], conflict['scheme2']]:
                if s != conflict['recommended']:
                    excluded.add(s)

    optimal_bundle = [s for s in matched_schemes if s.get('schemeId') not in excluded]
    total_value = sum(s.get('annualBenefit', 0) for s in optimal_bundle)

    return {
        'statusCode': 200,
        'headers': { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
        'body': json.dumps({
            'conflicts': detected_conflicts,
            'optimalBundle': optimal_bundle,
            'totalOptimalValue': total_value,
            'conflictsFound': len(detected_conflicts)
        })
    }
```

---

### **Lambda 6 — sarathi-citizen-save**

Saves a citizen's profile to DynamoDB after the chat intake. Creates a unique ID for them.

```python
import json
import boto3
import uuid
from datetime import datetime

dynamodb = boto3.resource('dynamodb', region_name='ap-south-1')
table = dynamodb.Table('SarathiCitizens')

def lambda_handler(event, context):
    body = json.loads(event.get('body', '{}')) if isinstance(event.get('body'), str) else event

    citizen = {
        'citizenId': str(uuid.uuid4()),
        'name': body.get('name', 'Unknown'),
        'age': int(body.get('age', 0)),
        'gender': body.get('gender', 'any'),
        'state': body.get('state', ''),
        'monthlyIncome': int(body.get('monthlyIncome', 0)),
        'category': body.get('category', 'General'),
        'isWidow': str(body.get('isWidow', False)).lower(),
        'occupation': body.get('occupation', 'any'),
        'panchayatId': body.get('panchayatId', 'rampur-barabanki-up'),
        'matchedSchemes': body.get('matchedSchemes', []),
        'enrolledSchemes': [],
        'status': 'eligible',
        'createdAt': datetime.utcnow().isoformat()
    }

    table.put_item(Item=citizen)

    return {
        'statusCode': 200,
        'headers': { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
        'body': json.dumps({ 'citizenId': citizen['citizenId'], 'status': 'saved' })
    }
```

> ✅ **End of Day 2 Checklist**
>
> Before sleeping: (1) All 6 Lambda functions are deployed and show green 'Active' status. (2) Each Lambda tested with the test event — all return statusCode 200. (3) Share the eligibility Lambda test result screenshot in team chat so Member 3 and Member 4 can see it's working.

---

## DAY 3 — Build API Gateway

| DAY 3 — API Gateway | 🎯 **Your Goal Today:** API Gateway is live with all routes. CORS is enabled. Member 3 can now make real API calls from the frontend. |
|---|---|

API Gateway is the 'front door' that the React frontend uses to reach your Lambda functions. Without this, the frontend can only use mock data. Today you connect the two worlds.

### **Step 1: Create the API**

- Go to AWS Console → search 'API Gateway' → click it
- Click 'Create API'
- Choose 'REST API' (not HTTP API, not WebSocket) → click Build
- API name: SarathiAPI
- API endpoint type: Regional
- Click 'Create API'

### **Step 2: Create All Routes**

You need to create 6 routes. For each one, follow this exact process:

- In the API resources panel, click 'Create resource'
- Enter the resource name and path as shown in the table below
- After creating the resource, click 'Create method'
- Select the HTTP method (POST or GET)
- Integration type: Lambda Function
- Lambda function: type the Lambda name and select it
- Check 'Use Lambda Proxy integration' — this is required
- Click Save

| Resource Path | Method | Lambda to Connect | Notes |
|---|---|---|---|
| /eligibility | POST | sarathi-eligibility-engine | Used by chat page after citizen answers all 6 questions |
| /twin | POST | sarathi-digital-twin | Used by Digital Twin page to generate income chart |
| /scheme/{schemeId} | GET | sarathi-scheme-fetch | {schemeId} is a path parameter — tick 'proxy' when creating |
| /panchayat/{panchayatId} | GET | sarathi-panchayat-stats | {panchayatId} is a path parameter |
| /citizen | POST | sarathi-citizen-save | Saves citizen profile after chat intake |
| /conflicts | POST | sarathi-conflict-detector | Used by conflict resolver widget |

### **Step 3: Enable CORS on Every Route**

CORS is what allows the browser to call your API. Without it, every API call from the frontend will be blocked. Do this for every single resource:

- Click on the resource (e.g., /eligibility)
- Click 'Enable CORS' from the Actions dropdown
- Access-Control-Allow-Origin: type `*`
- Access-Control-Allow-Headers: `Content-Type,Authorization`
- Access-Control-Allow-Methods: check POST, GET, OPTIONS
- Click 'Enable CORS and replace existing CORS headers'
- Repeat for every resource

### **Step 4: Deploy the API**

- Click 'Deploy API' from the Actions dropdown
- Deployment stage: click 'New stage'
- Stage name: prod
- Click 'Deploy'
- On the next screen, copy the 'Invoke URL' — it looks like:

```
https://abc123xyz.execute-api.ap-south-1.amazonaws.com/prod
```

- Send this URL to Member 3 and Member 4 in the team chat — they need it immediately

### **Step 5: Test Every Route in Postman**

Before handing this to Member 3, test every single endpoint yourself:

| Endpoint | Test Request Body | Expected Response |
|---|---|---|
| POST /eligibility | `{ "age": 55, "gender": "female", "monthlyIncome": 2000, "isWidow": true }` | matchedSchemes array with 6+ schemes, totalAnnualBenefit > 0 |
| POST /twin | `{ "monthlyIncome": 2000, "matchedSchemes": [...paste from above...] }` | pathways.best with 36 monthly data points |
| GET /scheme/pm-kisan | No body needed | Full PM-KISAN scheme object |
| GET /panchayat/rampur-barabanki-up | No body needed | Stats object with household counts |
| POST /citizen | `{ "name": "Kamla Devi", "age": 55, "gender": "female" }` | `{ "citizenId": "some-uuid", "status": "saved" }` |
| POST /conflicts | `{ "matchedSchemes": [{"schemeId": "pmegp"}, {"schemeId": "nrlm-shg"}] }` | conflicts array with 1 conflict detected |

> ✅ **End of Day 3 Checklist**
>
> Before sleeping: (1) API Gateway is deployed to 'prod' stage. (2) Invoke URL shared with Member 3 and Member 4. (3) All 6 endpoints tested in Postman and returning correct responses. (4) Screenshot of Postman results shared in team chat.

---

## DAY 4 — Seed Demo Data + Monitor + Harden

| DAY 4 — Data Seeding + Performance | 🎯 **Your Goal Today:** 3 demo citizen personas seeded into DynamoDB. API performance verified. CloudWatch monitored for errors. |
|---|---|

### **Task 1: Seed the 3 Demo Citizen Personas into DynamoDB**

Go to DynamoDB → SarathiCitizens table → Explore items → Create item → JSON view. Paste each one:

**Persona 1 — Kamla Devi:**

```json
{
  "citizenId": { "S": "demo-kamla-devi" },
  "name": { "S": "Kamla Devi" },
  "age": { "N": "55" },
  "gender": { "S": "female" },
  "state": { "S": "UP" },
  "monthlyIncome": { "N": "2000" },
  "category": { "S": "SC" },
  "isWidow": { "S": "true" },
  "occupation": { "S": "any" },
  "panchayatId": { "S": "rampur-barabanki-up" },
  "status": { "S": "eligible" },
  "matchedSchemes": { "L": [] },
  "enrolledSchemes": { "L": [] }
}
```

**Persona 2 — Ramu Prasad:**

```json
{
  "citizenId": { "S": "demo-ramu-prasad" },
  "name": { "S": "Ramu Prasad" },
  "age": { "N": "30" },
  "gender": { "S": "male" },
  "state": { "S": "Bihar" },
  "monthlyIncome": { "N": "8000" },
  "category": { "S": "OBC" },
  "isWidow": { "S": "false" },
  "occupation": { "S": "any" },
  "panchayatId": { "S": "rampur-barabanki-up" },
  "status": { "S": "eligible" },
  "matchedSchemes": { "L": [] },
  "enrolledSchemes": { "L": [] }
}
```

**Persona 3 — Meena Ji (Sarpanch):**

```json
{
  "citizenId": { "S": "demo-meena-sarpanch" },
  "name": { "S": "Meena Ji" },
  "age": { "N": "42" },
  "gender": { "S": "female" },
  "state": { "S": "Rajasthan" },
  "monthlyIncome": { "N": "15000" },
  "category": { "S": "OBC" },
  "isWidow": { "S": "false" },
  "occupation": { "S": "any" },
  "panchayatId": { "S": "rampur-barabanki-up" },
  "status": { "S": "enrolled" },
  "matchedSchemes": { "L": [] },
  "enrolledSchemes": { "L": [] }
}
```

### **Task 2: Seed 15+ Household Records for Village Map**

The Panchayat Dashboard village map needs households to show dots. Seed at least 15 citizens with different statuses. Use the same format as above but with different citizenIds and statuses (enrolled, eligible, none). Make roughly: 60% enrolled, 25% eligible, 15% none — this gives a realistic and compelling village map.

> 💡 **Quick Way to Seed Many Records**
>
> Instead of doing this one by one in the console, write a simple Python script locally and run it with your AWS CLI credentials. Create a file `seed_households.py`, write a loop that calls `dynamodb.put_item()` 15 times with different data, run `python3 seed_households.py`. Done in 2 minutes.

### **Task 3: Monitor CloudWatch for Errors**

- Go to AWS Console → CloudWatch → Log groups
- You'll see a log group for each Lambda: /aws/lambda/sarathi-eligibility-engine etc.
- Click each one → click the most recent log stream
- Look for any ERROR lines in red — these mean something is broken
- If you see errors, read the error message and fix the Lambda code
- Share any errors you can't fix with the team group immediately

### **Task 4: Performance Check**

- In Postman, run the /eligibility endpoint 5 times in a row
- Look at the response time shown at the bottom of Postman (e.g., '342 ms')
- If any response takes more than 3000ms (3 seconds), something is wrong
- Common cause: DynamoDB scan is slow because table has too many items — add a filter
- Target: eligibility engine should respond in under 1500ms

> ✅ **End of Day 4 Checklist**
>
> Before sleeping: (1) All 3 demo personas exist in DynamoDB. (2) At least 15 household records seeded for village map. (3) CloudWatch shows no critical errors. (4) All endpoints respond in under 2 seconds. (5) Tell Member 4 that all demo data is ready.

---

## DAY 5 — Final Hardening

| DAY 5 — Final Checks + Submission Support | 🎯 **Your Goal Today:** API is stable, no errors in CloudWatch, billing is under control, GitHub Lambda code is committed and tagged. |
|---|---|

### **Morning: Full End-to-End Test**

- Open the live Amplify URL in an incognito browser (ask Member 3 for the URL)
- Go through the full Kamla Devi demo scenario yourself — from chat to Digital Twin
- Watch CloudWatch logs in a separate tab while doing this — look for any Lambda errors
- Fix every error you find. Day 5 morning is the last chance for backend fixes.

### **Midday: AWS Hygiene**

- Go to AWS Billing → check current spend — should be well under $40
- Go to Lambda → check all 6 functions are deployed and Active
- Go to API Gateway → confirm 'prod' stage is deployed (check the Last Modified date)
- Go to DynamoDB → confirm both tables have items (Schemes: 18 items, Citizens: 18+ items)
- Delete any test resources you created that aren't being used

### **Afternoon: GitHub Commit**

- Create a folder in the GitHub repo called /backend
- Save each Lambda function as a .py file: eligibility_engine.py, digital_twin.py, etc.
- Add a README inside /backend explaining each Lambda's purpose and input/output
- Commit and push to your feature branch → open PR to dev → merge to main
- This is proof to judges that backend code exists and is real

> ✅ **Final Submission Checklist — Your Items**
>
> Before the team submits: (1) All 6 Lambda functions deployed and working. (2) API Gateway live URL working (test it one last time). (3) DynamoDB has all scheme data and demo citizen data. (4) CloudWatch shows no critical errors. (5) Lambda code committed to GitHub /backend folder. (6) Billing is under control — not above $40 after 5 days.

---

# Troubleshooting — Common Problems

| Problem | What It Means | How to Fix It |
|---|---|---|
| Lambda returns 'Internal Server Error' | Your Python code crashed | Go to CloudWatch → find the log for that Lambda → read the error message → fix the code → redeploy |
| Lambda returns 'Task timed out' | Function took longer than 30 seconds | Go to Lambda → Configuration → General → increase timeout to 60 seconds |
| Frontend gets CORS error in browser | CORS not enabled on API Gateway | Go to API Gateway → click the resource → Enable CORS → redeploy the API to prod stage |
| DynamoDB returns empty list | Table is empty or filter is wrong | Go to DynamoDB → Explore items → confirm items exist. Check your scan filter logic in the Lambda. |
| 'AccessDeniedException' in CloudWatch | Lambda role missing a permission | Go to IAM → Roles → SarathiLambdaRole → attach the missing policy (e.g., AmazonBedrockFullAccess) |
| API Gateway returns 403 Forbidden | API not deployed after changes | Go to API Gateway → Actions → Deploy API → select prod stage → deploy again |
| Billing going up faster than expected | A service is running that you forgot about | Go to Billing → Cost Explorer → see which service is costing the most → turn it off |

---

**You are the engine of Sarathi.**
*Every other member's work depends on what you build.*
Build it solid. Build it fast. Build it once.
