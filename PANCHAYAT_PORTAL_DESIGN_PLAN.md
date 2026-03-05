# Service-by-Service Reality Check

## DynamoDB — Safe, with one catch
DynamoDB's always-free tier gives you **25 GB of storage**, **25 provisioned WCUs**, and **25 RCUs** — enough to handle approximately 200 million requests per month on AWS, and this never expires. For a demo or hackathon load, that's more than sufficient for reads and writes.

**The one real risk:** seeding 250,000 panchayat records from `lgd_hierarchy.json`. This involves 250,000 write operations in a single batch. If you run `seed_panchayats.py` naively in one go, it will exceed your free tier of 25 WCU and cost a few dollars. 

**The fix:** throttle the script to write slowly or seed only a representative sample (e.g., seed just one state like UP or MH with around 20,000 panchayats) for demo purposes. You don't need all 250,000 records to demonstrate the flow.

## Lambda — Completely safe
Lambda's always-free tier provides **1 million requests per month** and **400,000 GB-seconds of compute time**, resetting monthly forever. Even with 16 Lambda functions and active testing during a hackathon build, you'll not approach 1 million invocations.

## API Gateway — Safe for 12 months
API Gateway's free tier includes **1 million REST API calls per month** for the first 12 months after account creation. After this period, it switches to pay-as-you-go pricing.
- Cost beyond free tier: approximately $1 in Lambda costs and $3.50 in API Gateway charges for an additional 5 million requests.
- *Source:* CloudOptimo — so even if you exceed the free limit, costs are minimal.

## Bedrock (Nova Lite) — Watch this one
This service is *not* on the free tier. Each AI explain call incurs real money per token used.
- For a hackathon demo: cache responses aggressively (using SarathiExplanationCache) and avoid auto-triggering Bedrock on every dashboard load.
- Keep it manual/on-demand only to control costs.

## Polly, SNS, S3 — Negligible
All these services have very generous free tiers:
- Polly: 5 million characters/month free for the first 12 months.
- S3: 5 GB of storage free.
- SNS: 1 million publishes free.
*Conclusion:* These will not pose issues during your project.

## Cognito — Free up to 50,000 MAUs
Cognito is completely free at your scale. The combined user pools for panchayats and citizens won't reach that limit during a demo.

# The 3 Things to Actually Worry About
1. **DynamoDB seed script:**
   - Do not run it naively on the full dataset of 250,000 records.
   - Seed only one state for demos,
   - Throttle writes to approximately 20 per second.
2. **Bedrock calls:**
   - Do not auto-invoke on page load.
   - Keep it behind a manual "Explain" button,
   - Use caching tables to handle repeated requests efficiently.r>3. **CloudWatch Logs:**
   - Lambda functions generate logs (~10 KB per execution).
   - At high invocation counts (e.g., two million), logs can accumulate (~20 GB), costing around $7.50 for ingestion.
b>At hackathon scale:**
don't worry too much but set log retention to *7 days* in each Lambda function to prevent slow accumulation.


# Sarathi — Panchayat Portal: Complete Design & Implementation Plan

> **Goal**: Give every Gram Panchayat head (Sarpanch / Secretary) across India a unique, verified account — mapped to their exact village boundary — so they can manage, track, and serve every citizen in their jurisdiction through one intelligent dashboard.

---

## Table of Contents

1. [The Core Problem to Solve](#1-the-core-problem-to-solve)
2. [Panchayat Account Identity Model](#2-panchayat-account-identity-model)
3. [How to Serve Unique Accounts to Every Panchayat in India](#3-how-to-serve-unique-accounts-to-every-panchayat-in-india)
4. [Citizen ↔ Panchayat Mapping Logic](#4-citizen--panchayat-mapping-logic)
5. [Panchayat Portal — Full Feature Design](#5-panchayat-portal--full-feature-design)
6. [Page-by-Page Implementation Plan](#6-page-by-page-implementation-plan)
7. [New Lambda Functions Required](#7-new-lambda-functions-required)
8. [New DynamoDB Tables Required](#8-new-dynamodb-tables-required)
9. [New API Routes Required](#9-new-api-routes-required)
10. [Frontend File Structure Changes](#10-frontend-file-structure-changes)
11. [AWS Cognito Setup for Panchayat Pool](#11-aws-cognito-setup-for-panchayat-pool)
12. [Panchayat Onboarding Flow](#12-panchayat-onboarding-flow)
13. [Implementation Phases & Priority Order](#13-implementation-phases--priority-order)

---

## 1. The Core Problem to Solve

India has approximately **2.5 lakh+ Gram Panchayats** across 29 states and 7 UTs. Each Panchayat head (Sarpanch or Secretary) needs:

- A **unique, verified identity** tied to their specific Panchayat LGD code
- Access to **only their village's citizens** — no cross-village data leakage
- Tools to **act on welfare gaps** — not just see data
- A system that works even on **low-bandwidth connections**

The challenge is **not just authentication** — it's building a scoped data architecture where a Sarpanch of Village X can never accidentally (or maliciously) see the data of Village Y.

---

## 2. Panchayat Account Identity Model

### The Unique ID Structure

Every Panchayat account in Sarathi is anchored to the **LGD (Local Government Directory) Panchayat Code** — the government's own unique identifier for every Gram Panchayat in India.

```
Panchayat Identity = LGD Panchayat Code (6-digit)
Example: 123456 → Rampur Gram Panchayat, Amethi, Uttar Pradesh
```

This code already exists in your `lgd_hierarchy.json` (57 MB dataset). Every village record already contains a `panchayat_code` and `panchayat_name` field — **you already have the full map**.

### Account Data Model

```json
{
  "panchayatId":   "LGD_123456",            // Primary key = LGD code prefixed
  "officialName":  "Ram Kumar Yadav",
  "role":          "sarpanch | secretary | field_worker",
  "mobile":        "+91XXXXXXXXXX",
  "email":         "ramkumar@sarathi.gov",
  "state":         "Uttar Pradesh",
  "district":      "Amethi",
  "block":         "Gauriganj",
  "panchayatName": "Rampur Gram Panchayat",
  "lgdCode":       "123456",
  "villagesCovered": ["village_001", "village_002"], // All LGD village codes under this panchayat
  "verified":      true,
  "verifiedBy":    "BDO_AMETHI",            // Block Development Officer approval
  "createdAt":     "2025-01-01T00:00:00Z",
  "lastLogin":     "2025-03-01T10:30:00Z",
  "cognitoSub":    "cognito-uuid-here"
}
```

### Key Design Decisions

- `panchayatId` = `"LGD_" + lgdCode` — deterministic, collision-free, traceable to government records
- One panchayat can have **multiple officials** (Sarpanch + Secretary + Field Worker) — each gets their own Cognito account but same `panchayatId` scope
- All DynamoDB queries for citizens use `panchayatId` as a **partition key filter** — a panchayat official can never fetch outside their scope

---

## 3. How to Serve Unique Accounts to Every Panchayat in India

This is the most important architectural question. Here is the full system:

### Step 1: Pre-Seed the Panchayat Registry

Before any Sarpanch signs up, you pre-populate a `SarathiPanchayats` DynamoDB table using your existing LGD data:

```python
# seed_panchayats.py — run once from lgd_hierarchy.json
for each unique panchayat in lgd_hierarchy.json:
    insert {
        panchayatId: "LGD_" + panchayat_code,
        panchayatName: panchayat_name,
        block: block_name,
        district: district_name,
        state: state_name,
        lgdCode: panchayat_code,
        villagesCovered: [list of village LGD codes under this panchayat],
        status: "unclaimed",   // no official has registered yet
        verified: false
    }
```

This gives you **~2.5 lakh records pre-loaded**. Every Panchayat has a digital identity before anyone even signs up.

### Step 2: Sarpanch Self-Registration with Claim Flow

```
Panchayat official visits /panchayat/signup
      │
      ▼
Step 1: Enter mobile number (OTP sent via SNS)
      │
      ▼
Step 2: Search and SELECT their Panchayat
        (Search by: State → District → Block → Panchayat Name)
        (Uses your existing LGD hierarchy data)
      │
      ▼
Step 3: Enter personal details + upload proof of identity
        (Aadhaar last 4, official ID, appointment letter)
      │
      ▼
Step 4: "Claim" the Panchayat — system checks if panchayatId is already claimed
        If unclaimed → status changes to "pending_verification"
        If already claimed → show existing official name, contact BDO to resolve
      │
      ▼
Step 5: BDO/Admin approves → account becomes active
        OR: Auto-approval for hackathon demo (configurable)
```

### Step 3: Cognito Custom Attributes for Scope Enforcement

In the **Panchayat Cognito User Pool**, add these custom attributes to every user's JWT token:

```
custom:panchayatId    = "LGD_123456"
custom:lgdCode        = "123456"
custom:role           = "sarpanch"
custom:state          = "Uttar Pradesh"
custom:district       = "Amethi"
```

Every API call from a panchayat official automatically carries these claims in their JWT. The Lambda functions **extract `panchayatId` from the JWT** — they never trust a `panchayatId` passed in the request body for data access. This is your **server-side scope enforcement**.

### Step 4: Lambda Scope Guard (Critical Security Layer)

```python
# In every panchayat-facing Lambda:
def get_panchayat_id_from_token(event):
    claims = event['requestContext']['authorizer']['claims']
    return claims['custom:panchayatId']  # Always from JWT, never from body

def handler(event, context):
    panchayat_id = get_panchayat_id_from_token(event)
    # All queries are scoped to this panchayat_id
    # If body contains a different panchayatId — ignore it
```

This ensures **zero horizontal privilege escalation** even if someone manipulates API requests.

---

## 4. Citizen ↔ Panchayat Mapping Logic

### How a Citizen Gets Assigned to a Panchayat

This already partially exists in your `LocationSetupPage`. Here's how to complete it:

```
Citizen selects: State → District → Block → Village
                                                │
                                                ▼
                          LGD lookup: village_code → panchayat_code
                                                │
                                                ▼
                    citizen.panchayatId = "LGD_" + panchayat_code
                    citizen.panchayatName = panchayat_name
                    (saved to SarathiCitizens DynamoDB table)
```

### DynamoDB Index for Panchayat-to-Citizen Queries

In your `SarathiCitizens` table, you need a **Global Secondary Index (GSI)**:

```
GSI Name: panchayatId-index
Partition Key: panchayatId (String)
Sort Key: createdAt (String)
```

This allows `panchayat_stats.py` Lambda to run:
```python
response = citizens_table.query(
    IndexName='panchayatId-index',
    KeyConditionExpression=Key('panchayatId').eq(panchayat_id)
)
```

This single query returns **all citizens belonging to that panchayat** in O(1) DynamoDB time regardless of total platform scale.

---

## 5. Panchayat Portal — Full Feature Design

Below are all the features the Panchayat Portal should have, organized by priority.

---

### Feature 1: Panchayat Dashboard (Home) — `/panchayat`

**Already partially exists — expand it significantly.**

#### Stat Cards Row (4 cards)
| Card | Metric | Logic |
|------|--------|-------|
| Total Households | Count of distinct citizen records | `COUNT(citizens WHERE panchayatId = X)` |
| Receiving Benefits | Citizens with ≥1 approved application | Filter applications table |
| Eligible But Unserved | Matched schemes > 0 but 0 applications | Cross-join citizens + applications |
| Zero Benefit | Citizens with 0 matched schemes | From eligibility engine results |

#### AI Insights Panel
- Bedrock-generated paragraph: _"12 widows in your panchayat have not applied for IGNWPS pension. Sending them a reminder could unlock ₹1.44 lakh in annual benefits."_
- Regenerates daily, cached in DynamoDB

#### Priority Alerts Panel
Alerts sorted by urgency:
- 🔴 **Critical**: Elderly (70+) with no pension registered
- 🟠 **High**: Pregnant women not on PM Matru Vandana
- 🟡 **Medium**: Farmers without PM-KISAN enrollment
- 🟢 **Low**: BPL households not on Ayushman Bharat

#### Governance Heatmap
A grid where:
- **Rows** = Citizens
- **Columns** = Key schemes (PM-KISAN, PMAY, Ayushman, Ujjwala, MGNREGS, Pension)
- **Cell color** = Green (enrolled), Yellow (eligible, not applied), Red (not eligible), Grey (unknown)

---

### Feature 2: Citizen Registry — `/panchayat/citizens`

A **full data table** of every citizen in the panchayat.

#### Table Columns
- Name | Age | Gender | Village | Income | Social Category | Schemes Matched | Status | Actions

#### Filter & Search
- Filter by: Village (if multiple villages), Gender, Age Group, Social Category, Benefit Status
- Search by name or Aadhaar suffix

#### Row Actions
- **View Profile** → opens citizen detail drawer
- **Notify** → sends SMS/push via Panchayat Notifier Lambda
- **Assist Application** → Sarpanch can start an application on behalf of the citizen (assisted mode)
- **Flag for Field Visit** → marks citizen for in-person follow-up

#### Expandable Row
Click any citizen row to see:
- Their matched schemes with benefit amounts
- Application status per scheme
- Welfare Digital Twin summary (projected annual income)
- Last interaction date with Sarathi platform

#### Bulk Actions
- Select multiple citizens → Bulk Notify
- Export selected as CSV
- Bulk assign for field worker visit

---

### Feature 3: Scheme Coverage Analytics — `/panchayat/analytics`

**New page** — visual analytics for the Sarpanch.

#### Charts to include

**Bar Chart: Scheme-wise Enrollment**
- X-axis: Scheme names
- Y-axis: Number of citizens enrolled vs eligible
- Shows "gap" between eligible and enrolled for every scheme

**Pie Chart: Benefit Category Distribution**
- Agriculture / Housing / Health / Women / Employment / Education
- Shows which welfare category dominates their village

**Line Chart: Monthly Application Trend**
- Applications submitted per month over last 12 months
- Shows whether outreach campaigns are working

**Village Comparison (if multiple villages)**
- Horizontal bar chart comparing coverage % per village
- Helps identify which hamlet is most underserved

#### Key Metrics Cards
- Total annual benefit unlocked (₹ sum of all approved benefits)
- Total potential annual benefit if all eligible citizens enrolled
- "Welfare Gap" = potential minus unlocked (the opportunity number)
- Average schemes per citizen (benchmark: platform average is 2-3, target 8-10)

---

### Feature 4: Applications Manager — `/panchayat/applications`

**New page** — Sarpanch sees all applications filed by citizens in their panchayat.

#### Table View
| Column | Details |
|--------|---------|
| Citizen Name | Linked to citizen profile |
| Scheme Name | With category badge |
| Applied Date | |
| Status | Pending / Submitted / Approved / Rejected |
| Documents | Checklist completion status |
| Action | Update status, add note |

#### Status Management
Sarpanch can update application status (simulating the approval workflow):
- Mark as "Forwarded to Block Office"
- Mark as "Documents Verified"
- Add rejection reason if rejected

#### Filters
- Filter by scheme, status, date range, village

---

### Feature 5: Outreach & Notifications — `/panchayat/outreach`

**New page** — tools to proactively reach unserved citizens.

#### Notification Composer
1. **Select Target Group**: (e.g., "All widows not on IGNWPS pension")
2. **Preview Recipient List**: Shows names + phone numbers
3. **Select Notification Type**: SMS, Push Notification, WhatsApp (future)
4. **Compose Message**: Pre-filled templates in Hindi/English, editable
5. **Send & Track**: Delivery status per recipient

#### Pre-built Campaign Templates
- _"Dear [Name], you may be eligible for ₹[amount] under [scheme]. Visit your Panchayat or dial 1800-XXX to apply."_
- Available in Hindi, Tamil, Telugu, Bengali (expandable)

#### Campaign History
- List of past notification campaigns
- Open rate, reply rate, conversion rate (citizens who applied after notification)

#### Field Visit Planner
- List of citizens flagged for in-person visit
- Grouped by village/hamlet for route efficiency
- Mark visits as completed with notes

---

### Feature 6: Village Profile — `/panchayat/village`

**New page** — a structured overview of the panchayat's demographics.

#### Sections

**Demographics Summary**
- Total population (sum of citizen profiles)
- Gender ratio
- Age distribution pyramid chart
- Social category breakdown (SC/ST/OBC/General)
- BPL household count

**Economic Profile**
- Income distribution histogram (0–5k, 5–10k, 10–20k, 20k+)
- Primary occupations pie chart (Farmer / Labourer / Business / Unemployed / Student)
- Average monthly household income

**Geographic Coverage**
- List of hamlets/villages under this panchayat
- Citizen count per hamlet
- Coverage status per hamlet

**Infrastructure Tags** (manually updatable by Sarpanch)
- Has ASHA worker: Yes/No
- Has Anganwadi: Yes/No
- Has PM Jan Dhan Bank: Yes/No
- Internet connectivity: Good/Poor/None

---

### Feature 7: Welfare Calendar — `/panchayat/calendar`

**New page** — upcoming scheme deadlines and life events.

#### Calendar View
- Monthly calendar with markers for:
  - Scheme application deadlines (e.g., PM-KISAN installment dates)
  - Citizens' upcoming life events (child turning 18 → scholarship eligibility)
  - Outreach campaign dates
  - Government review/audit dates

#### Life Event Alerts
Pulled from citizen profiles, shows upcoming triggers:
- "Priya Devi's daughter turns 18 in 45 days — pre-alert for NSP Scholarship"
- "5 senior citizens turn 60 this quarter — pre-register for IGNOAPS"
- "PM-KISAN April installment — 12 farmers not yet enrolled"

---

### Feature 8: Grievance Tracker — `/panchayat/grievances`

**New page** — track complaints and issues from citizens.

#### Grievance Log
Citizens (or Sarpanch on their behalf) can log:
- Application stuck / no update
- Benefit not received despite approval
- Wrong eligibility determination
- Document upload failure

#### Resolution Workflow
- Sarpanch assigns grievance to relevant category
- Escalation path: Panchayat → Block → District
- Resolution SLA tracking (7 days at panchayat level)
- Auto-escalation if SLA breached

---

### Feature 9: Panchayat Performance Report — `/panchayat/report`

**New page** — downloadable monthly report for accountability.

#### Report Contents
- Total citizens served this month
- New applications filed
- Benefits approved (with ₹ value)
- Welfare gap closed (% improvement)
- Unresolved grievances
- Notifications sent + response rate

#### Export Options
- PDF report (branded Sarathi + Panchayat name)
- CSV raw data
- Share link (for BDO review)

---

### Feature 10: Official Profile & Settings — `/panchayat/settings`

Settings page for the Panchayat official account.

#### Sections
- **Official Details**: Name, role, mobile, email (editable)
- **Panchayat Info**: Name, LGD code, block, district, state (read-only — set at registration)
- **Co-Officials**: Add Secretary or Field Worker accounts under same panchayat
- **Notification Preferences**: Which alerts to receive via SMS/email
- **Language**: Hindi / English toggle (persisted per account)
- **Logout / Change Password**

---

## 6. Page-by-Page Implementation Plan

### Existing Pages to Modify

#### `/panchayat` (PanchayatDashboard) — Major Expansion
**Current state**: Basic stat cards + citizen table + AI insights + alerts + heatmap  
**Changes needed**:
- Add "Welfare Gap ₹ Value" stat card (potential minus delivered)
- Add date range picker to filter stats
- Upgrade AI Insights to include actionable CTA buttons ("Notify these citizens")
- Add quick-link cards to all new pages
- Add "Panchayat Performance Score" badge (0–100)

#### `/panchayat/login` — Minor Changes
- Add "Find My Panchayat" help flow during login
- Add "First time? Register your Panchayat" CTA with clearer copy

#### `/panchayat/signup` (PanchayatSignupPage) — Major Expansion
**Current state**: Basic form  
**Changes needed**: Full 5-step onboarding wizard (see Section 12)

### New Pages to Build

| Route | Page Component | Priority |
|-------|---------------|----------|
| `/panchayat/citizens` | `PanchayatCitizenRegistry` | P0 — Core |
| `/panchayat/analytics` | `PanchayatAnalytics` | P0 — Core |
| `/panchayat/applications` | `PanchayatApplicationsManager` | P1 — High |
| `/panchayat/outreach` | `PanchayatOutreach` | P1 — High |
| `/panchayat/village` | `VillageProfile` | P1 — High |
| `/panchayat/calendar` | `WelfareCalendar` | P2 — Medium |
| `/panchayat/grievances` | `GrievanceTracker` | P2 — Medium |
| `/panchayat/report` | `PerformanceReport` | P2 — Medium |
| `/panchayat/settings` | `PanchayatSettings` | P1 — High |

---

## 7. New Lambda Functions Required

### Lambda 1: `panchayat_onboarding.py`
**Route**: `POST /panchayat/register`, `GET /panchayat/search`, `POST /panchayat/claim`

```python
# Responsibilities:
# 1. GET /panchayat/search?state=UP&district=Amethi&block=Gauriganj
#    → Returns list of panchayats from SarathiPanchayats table
# 2. POST /panchayat/claim { lgdCode, officialName, mobile, role, proofType }
#    → Checks if panchayat is already claimed
#    → Creates Cognito user with custom attributes
#    → Sets panchayat status to "pending_verification"
# 3. POST /panchayat/verify-claim { lgdCode, adminApprovalCode }
#    → Marks panchayat as verified, activates Cognito user
```

### Lambda 2: `panchayat_analytics.py`
**Route**: `GET /panchayat/{id}/analytics`

```python
# Responsibilities:
# 1. Aggregate scheme-wise enrollment counts
# 2. Compute welfare gap (potential vs delivered ₹)
# 3. Monthly application trend (last 12 months)
# 4. Village-wise coverage comparison
# 5. Returns structured JSON for all charts on /panchayat/analytics
```

### Lambda 3: `panchayat_outreach.py`
**Route**: `POST /panchayat/campaign`, `GET /panchayat/{id}/campaigns`

```python
# Responsibilities:
# 1. Accept target criteria (e.g., all widows without pension)
# 2. Query SarathiCitizens to build recipient list
# 3. Send bulk SMS via Amazon SNS
# 4. Log campaign to SarathiCampaigns table
# 5. Track delivery status
```

### Lambda 4: `panchayat_grievance.py`
**Route**: `POST /grievance`, `GET /grievances/{panchayatId}`, `PATCH /grievance/{id}`

```python
# Responsibilities:
# 1. Create grievance record in SarathiGrievances table
# 2. List all grievances for a panchayat (scoped by JWT)
# 3. Update grievance status, add resolution notes
# 4. Auto-escalate SLA-breached grievances (EventBridge trigger)
```

### Lambda 5: `panchayat_report.py`
**Route**: `GET /panchayat/{id}/report?month=2025-03`

```python
# Responsibilities:
# 1. Aggregate all monthly metrics
# 2. Generate PDF report using reportlab (Lambda layer)
# 3. Upload to S3, return signed URL
# 4. Cache report for 24 hours
```

### Lambda 6: `life_event_detector.py` (EventBridge Scheduled — runs nightly)
**Trigger**: EventBridge cron `0 2 * * ? *`

```python
# Responsibilities:
# 1. Scan all citizens for upcoming life events:
#    - Children turning 18 (scholarship eligibility)
#    - Adults turning 60 (pension eligibility)
#    - Pregnancies reaching 6 months (Matru Vandana)
# 2. Create alerts in SarathiAlerts table for relevant Panchayat
# 3. Push notification to Sarpanch (SNS)
```

### Upgrade Existing: `panchayat_stats.py`
- Add `welfare_gap_amount` to response
- Add `performance_score` (0-100 composite metric)
- Add `life_event_alerts` array
- Add `unclaimed_benefits_count`

---

## 8. New DynamoDB Tables Required

### Table 1: `SarathiPanchayats`
The master registry — pre-seeded from LGD data.

| Attribute | Type | Description |
|-----------|------|-------------|
| `panchayatId` | String (PK) | "LGD_123456" |
| `lgdCode` | String | Raw 6-digit LGD code |
| `panchayatName` | String | Official name |
| `block` | String | Block name |
| `district` | String | District name |
| `state` | String | State name |
| `villagesCovered` | List | All LGD village codes |
| `status` | String | "unclaimed" / "pending" / "active" |
| `officialCognitoSub` | String | Cognito user ID of registered Sarpanch |
| `officialName` | String | Sarpanch's name |
| `verified` | Boolean | BDO verification status |
| `registeredAt` | String | ISO timestamp |

**GSIs**:
- `state-district-index`: `state` (PK) + `district` (SK) — for panchayat search during signup
- `lgdCode-index`: `lgdCode` (PK) — for direct lookup

### Table 2: `SarathiCampaigns`
Notification campaigns sent by panchayat officials.

| Attribute | Type | Description |
|-----------|------|-------------|
| `campaignId` | String (PK) | UUID |
| `panchayatId` | String (SK) | Scoped to panchayat |
| `targetCriteria` | Map | Filter used to select recipients |
| `recipientCount` | Number | How many citizens targeted |
| `messageText` | String | SMS/notification text |
| `language` | String | "hindi" / "english" |
| `sentAt` | String | ISO timestamp |
| `deliveredCount` | Number | SNS delivery count |
| `conversionCount` | Number | Recipients who applied after |

### Table 3: `SarathiGrievances`
Citizen complaints and resolution tracking.

| Attribute | Type | Description |
|-----------|------|-------------|
| `grievanceId` | String (PK) | UUID |
| `panchayatId` | String (GSI PK) | For panchayat-scoped queries |
| `citizenId` | String | Complainant |
| `category` | String | "application_stuck" / "benefit_not_received" / "wrong_eligibility" |
| `description` | String | Grievance details |
| `status` | String | "open" / "in_progress" / "resolved" / "escalated" |
| `assignedTo` | String | "panchayat" / "block" / "district" |
| `resolutionNote` | String | Official's notes |
| `createdAt` | String | ISO timestamp |
| `resolvedAt` | String | ISO timestamp |
| `slaDeadline` | String | 7 days from creation |

### Table 4: `SarathiAlerts`
Life-event and system alerts for panchayat officials.

| Attribute | Type | Description |
|-----------|------|-------------|
| `alertId` | String (PK) | UUID |
| `panchayatId` | String (GSI PK) | Scoped to panchayat |
| `alertType` | String | "life_event" / "scheme_deadline" / "unserved_citizen" |
| `priority` | String | "critical" / "high" / "medium" / "low" |
| `citizenId` | String | Relevant citizen (if applicable) |
| `schemeId` | String | Relevant scheme (if applicable) |
| `message` | String | Human-readable alert text |
| `messageHindi` | String | Hindi translation |
| `isRead` | Boolean | Dismissed by official |
| `createdAt` | String | ISO timestamp |
| `expiresAt` | String | Auto-clear date |

---

## 9. New API Routes Required

| Method | Route | Lambda | Description |
|--------|-------|--------|-------------|
| `GET` | `/panchayat/search` | `panchayat_onboarding` | Search panchayats by location (for signup) |
| `POST` | `/panchayat/claim` | `panchayat_onboarding` | Claim a panchayat account |
| `GET` | `/panchayat/{id}/citizens` | `panchayat_stats` (upgraded) | Full citizen list with pagination |
| `GET` | `/panchayat/{id}/analytics` | `panchayat_analytics` | Charts data for analytics page |
| `GET` | `/panchayat/{id}/applications` | `applications` (upgraded) | All applications in panchayat |
| `POST` | `/panchayat/campaign` | `panchayat_outreach` | Send bulk notification campaign |
| `GET` | `/panchayat/{id}/campaigns` | `panchayat_outreach` | List past campaigns |
| `POST` | `/grievance` | `panchayat_grievance` | File a grievance |
| `GET` | `/grievances/{panchayatId}` | `panchayat_grievance` | List grievances |
| `PATCH` | `/grievance/{grievanceId}` | `panchayat_grievance` | Update grievance status |
| `GET` | `/panchayat/{id}/report` | `panchayat_report` | Generate monthly PDF report |
| `GET` | `/panchayat/{id}/alerts` | `panchayat_stats` (upgraded) | Life-event + priority alerts |
| `POST` | `/panchayat/{id}/co-official` | `panchayat_onboarding` | Add Secretary / Field Worker |

All routes use **Cognito Panchayat User Pool** as authorizer. The `panchayatId` in the path is **validated against JWT claims** in every Lambda — it cannot be spoofed.

---

## 10. Frontend File Structure Changes

```
sarathi-frontend/src/
│
├── pages/
│   ├── panchayat/
│   │   ├── PanchayatDashboard.jsx          ← Exists — expand
│   │   ├── PanchayatLoginPage.jsx          ← Exists — minor changes
│   │   ├── PanchayatSignupPage.jsx         ← Exists — major rewrite (5-step wizard)
│   │   ├── PanchayatVerifyPage.jsx         ← Exists — keep
│   │   ├── PanchayatForgotPasswordPage.jsx ← Exists — keep
│   │   ├── PanchayatCitizenRegistry.jsx    ← NEW
│   │   ├── PanchayatAnalytics.jsx          ← NEW
│   │   ├── PanchayatApplicationsManager.jsx← NEW
│   │   ├── PanchayatOutreach.jsx           ← NEW
│   │   ├── VillageProfile.jsx              ← NEW
│   │   ├── WelfareCalendar.jsx             ← NEW
│   │   ├── GrievanceTracker.jsx            ← NEW
│   │   ├── PerformanceReport.jsx           ← NEW
│   │   └── PanchayatSettings.jsx           ← NEW
│
├── components/panchayat/
│   ├── AIInsights.jsx                      ← Exists — upgrade
│   ├── AlertsPanel.jsx                     ← Exists — upgrade
│   ├── CitizenTable.jsx                    ← Exists — major upgrade
│   ├── GovernanceHeatmap.jsx               ← Exists — keep
│   ├── VillageMap.jsx                      ← Exists — upgrade
│   ├── SchemeEnrollmentChart.jsx           ← NEW (Bar chart for analytics)
│   ├── WelfareGapCard.jsx                  ← NEW (₹ gap metric)
│   ├── CampaignComposer.jsx                ← NEW (notification builder)
│   ├── CitizenDetailDrawer.jsx             ← NEW (slide-out detail panel)
│   ├── GrievanceCard.jsx                   ← NEW
│   ├── LifeEventAlert.jsx                  ← NEW
│   ├── PerformanceScoreBadge.jsx           ← NEW
│   └── PanchayatSidebar.jsx               ← NEW (navigation sidebar)
│
├── context/
│   └── PanchayatContext.jsx               ← NEW (mirrors CitizenContext for panchayat)
│
└── data/
    └── mockPanchayat.js                   ← Exists — extend with new mock data
```

### New React Router Routes to Add

```jsx
// In App.jsx, inside <PrivateRoute role="panchayat">:
<Route path="/panchayat"               element={<PanchayatDashboard />} />
<Route path="/panchayat/citizens"      element={<PanchayatCitizenRegistry />} />
<Route path="/panchayat/analytics"     element={<PanchayatAnalytics />} />
<Route path="/panchayat/applications"  element={<PanchayatApplicationsManager />} />
<Route path="/panchayat/outreach"      element={<PanchayatOutreach />} />
<Route path="/panchayat/village"       element={<VillageProfile />} />
<Route path="/panchayat/calendar"      element={<WelfareCalendar />} />
<Route path="/panchayat/grievances"    element={<GrievanceTracker />} />
<Route path="/panchayat/report"        element={<PerformanceReport />} />
<Route path="/panchayat/settings"      element={<PanchayatSettings />} />
```

### PanchayatContext (New)

```jsx
// context/PanchayatContext.jsx
// Mirrors CitizenContext but for panchayat officials
const PanchayatContext = createContext();

// Stores:
// - panchayatProfile (from SarathiPanchayats table)
// - citizenList (paginated, from panchayatId-index GSI)
// - analyticsData (cached, refreshes every 30 min)
// - alerts (from SarathiAlerts table)
// - campaigns (from SarathiCampaigns table)
// Only activates when userType === 'panchayat'
```

---

## 11. AWS Cognito Setup for Panchayat Pool

Your Panchayat User Pool already exists. Here is what to add/verify:

### Custom Attributes to Add

Go to Cognito → Panchayat User Pool → Attributes → Add custom attributes:

```
custom:panchayatId    (String, mutable: false)  ← Set at registration, never changes
custom:lgdCode        (String, mutable: false)
custom:role           (String, mutable: true)   ← Can be updated by admin
custom:state          (String, mutable: false)
custom:district       (String, mutable: false)
custom:panchayatName  (String, mutable: false)
custom:verified       (String, mutable: true)   ← "true"/"false"
```

### Pre-Token Generation Lambda Trigger

Add a Lambda trigger on the Panchayat User Pool to **inject panchayat claims** into every JWT:

```python
# cognito_pre_token.py
def handler(event, context):
    # Fetch panchayat details from DynamoDB using user's panchayatId
    panchayat_id = event['request']['userAttributes'].get('custom:panchayatId')
    # Add to ID token claims
    event['response']['claimsOverrideDetails'] = {
        'claimsToAddOrOverride': {
            'panchayatId': panchayat_id,
            'role': event['request']['userAttributes'].get('custom:role', 'sarpanch')
        }
    }
    return event
```

### Password Policy
- Minimum 8 characters
- Require number + special character
- No SMS MFA (too complex for rural officials — use email OTP instead)
- Temporary password expires in 7 days (for admin-created accounts)

---

## 12. Panchayat Onboarding Flow

### 5-Step Registration Wizard (`/panchayat/signup`)

```
┌─────────────────────────────────────────────────────┐
│  Step 1: Mobile Verification                        │
│  ┌─────────────────────────────┐                   │
│  │ Enter mobile number          │                   │
│  │ [+91 __________]             │                   │
│  │         [Send OTP]           │                   │
│  └─────────────────────────────┘                   │
│  Enter 6-digit OTP from SMS                        │
└─────────────────────────────────────────────────────┘
                    ▼
┌─────────────────────────────────────────────────────┐
│  Step 2: Find Your Panchayat                        │
│  State    [Dropdown]                                │
│  District [Dropdown - loads on state select]        │
│  Block    [Dropdown - loads on district select]     │
│  Panchayat[Searchable dropdown - shows LGD names]  │
│                                                     │
│  ✓ Uses your existing LGD hierarchy JSON            │
│  ✓ Shows LGD code for verification                  │
│  ✓ Shows if panchayat is already claimed            │
└─────────────────────────────────────────────────────┘
                    ▼
┌─────────────────────────────────────────────────────┐
│  Step 3: Official Details                           │
│  Full Name        [_______________]                 │
│  Role             [Sarpanch / Secretary / Worker]  │
│  Email (optional) [_______________]                 │
│  Aadhaar last 4   [____]                            │
└─────────────────────────────────────────────────────┘
                    ▼
┌─────────────────────────────────────────────────────┐
│  Step 4: Set Password                               │
│  Password         [_______________]                 │
│  Confirm Password [_______________]                 │
│  (strength meter shown)                             │
└─────────────────────────────────────────────────────┘
                    ▼
┌─────────────────────────────────────────────────────┐
│  Step 5: Confirmation                               │
│  ✅ Panchayat: Rampur GP, Amethi, UP               │
│  ✅ Role: Sarpanch                                  │
│  ✅ LGD Code: 123456                               │
│                                                     │
│  Status: Pending BDO Verification                  │
│  (or: Auto-approved for demo mode)                  │
│                                                     │
│  [Go to Dashboard]                                  │
└─────────────────────────────────────────────────────┘
```

### Admin Verification Console (Simple)

A lightweight admin page (separate from panchayat portal) at `/admin/verify-panchayats`:
- Lists all panchayats with `status: "pending_verification"`
- Admin (BDO) can approve or reject with one click
- On approval: Cognito user is enabled, `custom:verified` set to "true", welcome SMS sent

For hackathon purposes, you can set `AUTO_APPROVE=true` environment variable in the onboarding Lambda to skip BDO verification.

---

## 13. Implementation Phases & Priority Order

### Phase 1 — Foundation (Build First)
These are the load-bearing pieces everything else depends on.

1. **Pre-seed `SarathiPanchayats` table** from your existing `lgd_hierarchy.json`
   - Write `seed_panchayats.py` script
   - Run it to populate ~2.5 lakh panchayat records
   - Add `panchayatId-index` GSI to `SarathiCitizens` table

2. **Upgrade Panchayat Signup to 5-step wizard**
   - Implement panchayat search by LGD hierarchy
   - Implement "claim" logic with conflict detection
   - Add custom Cognito attributes

3. **Scope enforcement in existing Lambdas**
   - Upgrade `panchayat_stats.py` to always extract `panchayatId` from JWT
   - Verify `citizen_save.py` correctly sets `panchayatId` from village selection

---

### Phase 2 — Core Portal Pages (Build Second)
4. **`PanchayatCitizenRegistry`** (`/panchayat/citizens`)
   - Full sortable/filterable table
   - Expandable rows with scheme details
   - `CitizenDetailDrawer` component

5. **`PanchayatAnalytics`** (`/panchayat/analytics`)
   - Deploy `panchayat_analytics.py` Lambda
   - Scheme-wise enrollment bar chart
   - Welfare gap card

6. **Upgrade `PanchayatDashboard`** with new stat cards + welfare gap + quick links

---

### Phase 3 — Action Tools (Build Third)
7. **`PanchayatOutreach`** (`/panchayat/outreach`)
   - Campaign composer
   - Bulk SMS via SNS
   - Campaign history table

8. **`PanchayatApplicationsManager`** (`/panchayat/applications`)
   - Aggregated view of all applications
   - Status update capability

9. **`PanchayatSettings`** (`/panchayat/settings`)
   - Profile edit
   - Add co-officials

---

### Phase 4 — Advanced Features (Build Last)
10. **`VillageProfile`** — demographic overview
11. **`WelfareCalendar`** — life events + deadlines
12. **`GrievanceTracker`** + `panchayat_grievance.py` Lambda
13. **`PerformanceReport`** + PDF generation Lambda
14. **`life_event_detector.py`** — nightly EventBridge job

---

## Summary: What Makes This System Unique

| Capability | How It Works |
|-----------|-------------|
| **2.5 lakh unique panchayat accounts** | LGD pre-seed + claim flow |
| **Zero data leakage between panchayats** | JWT-scoped DynamoDB queries |
| **Automatic citizen assignment** | Village → LGD panchayat code lookup |
| **Proactive outreach** | Life event detector + bulk SNS campaigns |
| **Accountability** | Performance score + downloadable monthly reports |
| **Scale** | DynamoDB GSI handles 100M+ citizens with O(1) panchayat query |
| **Rural usability** | Hindi UI, simple flows, low-bandwidth pages |

---

*Document Version: 1.0 | Sarathi — सारथी | For internal implementation use*
