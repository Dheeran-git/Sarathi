# Sarathi Backend — AWS Lambda + DynamoDB + API Gateway

## Architecture Overview

```
React Frontend (Amplify)
    ↓ HTTPS
API Gateway (SarathiAPI — REST)
    ↓ Lambda Proxy Integration
6 Lambda Functions (Python 3.11)
    ↓ boto3
DynamoDB (2 Tables)
```

## DynamoDB Tables

| Table | Partition Key | Purpose |
|-------|--------------|---------|
| `SarathiSchemes` | `schemeId` (String) | 18 government welfare schemes |
| `SarathiCitizens` | `citizenId` (String) | Citizen profiles + demo personas |

Both tables use **On-demand** capacity mode.

---

## Lambda Functions

### 1. `sarathi-eligibility-engine`
**File:** `lambdas/eligibility_engine.py`
**Trigger:** POST `/eligibility`
**Input:** Citizen profile (age, gender, monthlyIncome, isWidow, occupation, category)
**Output:** Array of matched schemes sorted by annual benefit

### 2. `sarathi-digital-twin`
**File:** `lambdas/digital_twin.py`
**Trigger:** POST `/twin`
**Input:** monthlyIncome + matchedSchemes array
**Output:** 3-year monthly income projections (best/medium/minimum pathways)

### 3. `sarathi-scheme-fetch`
**File:** `lambdas/scheme_fetch.py`
**Trigger:** GET `/scheme/{schemeId}`
**Input:** schemeId path parameter
**Output:** Full scheme details from DynamoDB

### 4. `sarathi-panchayat-stats`
**File:** `lambdas/panchayat_stats.py`
**Trigger:** GET `/panchayat/{panchayatId}`
**Input:** panchayatId path parameter
**Output:** Village stats (enrolled/eligible/zero-benefit counts, alerts)

### 5. `sarathi-conflict-detector`
**File:** `lambdas/conflict_detector.py`
**Trigger:** POST `/conflicts`
**Input:** matchedSchemes array
**Output:** Detected conflicts + optimal bundle recommendation

### 6. `sarathi-citizen-save`
**File:** `lambdas/citizen_save.py`
**Trigger:** POST `/citizen`
**Input:** Citizen profile data
**Output:** Generated citizenId + save confirmation

---

## API Gateway Routes

| Method | Path | Lambda | Purpose |
|--------|------|--------|---------|
| POST | `/eligibility` | sarathi-eligibility-engine | Scheme matching |
| POST | `/twin` | sarathi-digital-twin | Income projections |
| GET | `/scheme/{schemeId}` | sarathi-scheme-fetch | Scheme details |
| GET | `/panchayat/{panchayatId}` | sarathi-panchayat-stats | Village dashboard |
| POST | `/conflicts` | sarathi-conflict-detector | Conflict detection |
| POST | `/citizen` | sarathi-citizen-save | Save citizen profile |

**CORS** is enabled on all routes with `Access-Control-Allow-Origin: *`.

---

## Seeding Scripts

```bash
# Install boto3 if not already installed
pip install boto3

# Seed all 18 schemes
python seed/seed_schemes.py

# Seed 3 demo personas + 15 households
python seed/seed_citizens.py
```

---

## IAM Role

**Role Name:** `SarathiLambdaRole`
**Attached Policies:**
- AmazonDynamoDBFullAccess
- AmazonBedrockFullAccess
- AmazonPollyFullAccess
- AmazonSNSFullAccess
- CloudWatchLogsFullAccess
- AmazonS3FullAccess

---

## Lambda Configuration

All Lambdas should have:
- **Runtime:** Python 3.11
- **Timeout:** 30 seconds
- **Memory:** 256 MB
- **Execution Role:** SarathiLambdaRole

---

## Team: Boolean Bandits
Built for AWS AI for Bharat Hackathon 2025
