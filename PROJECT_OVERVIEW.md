# Sarathi | सारथी — AI Welfare Engine

> **An AI-powered platform that connects India's rural citizens with the 700+ government welfare schemes they're eligible for, and gives Panchayat officials a data-driven dashboard to track and close welfare gaps in their villages.**

---

## Table of Contents

- [High-Level Architecture](#high-level-architecture)
- [Tech Stack](#tech-stack)
- [User-Facing Portals](#user-facing-portals)
  - [A. Citizen Portal](#a-citizen-portal)
  - [B. Panchayat Official Portal](#b-panchayat-official-portal)
- [Frontend Pages (21 Total)](#frontend-pages-21-total)
- [Components (22 Total)](#components-22-total)
- [State Management & Context](#state-management--context)
- [Backend — AWS Lambda Functions (10)](#backend--aws-lambda-functions-10)
- [AWS Services Used](#aws-services-used)
- [Schemes Database](#schemes-database)
- [Conversational Question Flow](#conversational-question-flow)
- [Village & Location Data](#village--location-data)
- [Bilingual Support (English / Hindi)](#bilingual-support-english--hindi)
- [API Routes](#api-routes)
- [Project File Structure](#project-file-structure)

---

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (React + Vite)                  │
│  Citizen Portal ←→ Panchayat Portal                             │
│  21 Pages │ 22 Components │ Framer Motion Animations            │
└──────────────────────────┬──────────────────────────────────────┘
                           │ HTTPS (Axios)
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                  API GATEWAY (REST, us-east-1)                  │
│        Cognito Authorizer (Citizen + Panchayat User Pools)      │
└──────────────────────────┬──────────────────────────────────────┘
                           │
     ┌─────────────────────┼─────────────────────┐
     ▼                     ▼                     ▼
┌──────────┐      ┌──────────────┐      ┌──────────────┐
│ Lambda   │      │   DynamoDB   │      │   Bedrock    │
│ Functions│ ────→│   Tables     │      │  (Nova Lite) │
│ (10)     │      │  (5 tables)  │      │   AI Engine  │
└──────────┘      └──────────────┘      └──────────────┘
     │                                        │
     ▼                                        ▼
┌──────────┐                           ┌──────────────┐
│ Amazon   │                           │ Amazon Polly │
│ Lex Bot  │                           │ (Text→Audio) │
└──────────┘                           └──────────────┘
                                              │
                                              ▼
                                       ┌──────────────┐
                                       │  S3 Bucket   │
                                       │ (Audio files)│
                                       └──────────────┘
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18 + Vite 7, TailwindCSS, Framer Motion |
| **Routing** | React Router v6 (SPA with route-based code splitting) |
| **Auth** | AWS Cognito (2 User Pools — Citizen & Panchayat) |
| **API** | AWS API Gateway (REST) with Cognito Authorizer |
| **Backend** | 10 AWS Lambda Functions (Python 3.x) |
| **Database** | DynamoDB (5 tables: Citizens, Schemes, Applications, Conflicts, ExplanationCache) |
| **AI/ML** | AWS Bedrock (Amazon Nova Lite) for scheme explanations |
| **Voice** | Amazon Polly (Text-to-Speech, Aditi voice) |
| **Chatbot** | Amazon Lex (conversational eligibility flow) |
| **Storage** | S3 (audio files for scheme explanations) |
| **Hosting** | AWS Amplify / S3 + CloudFront |

---

## User-Facing Portals

### A. Citizen Portal

The citizen-facing experience guides rural users through a conversational flow to discover their scheme eligibility.

#### 1. Landing Page (`/`)
- Animated hero section with orbiting welfare icons and village illustration
- Animated counters showing platform impact stats (700+ schemes, ₹2.8L+ average benefit, 3-second results)
- Problem statement section explaining why Sarathi exists (700+ schemes, scattered across 47 portals)
- "How it Works" feature blocks (3 steps: Speak → AI Matches → Digital Twin)
- Persona cards showing example beneficiaries (Farmer, Widow, Senior Citizen)
- CTA to create account or log in

#### 2. Conversational Eligibility Chat (`/chat`)
- **Chat-style interface** where the AI asks questions step-by-step
- **4-phase progress bar**: Core Profile → Persona → Details → Results
- Multi-type inputs: text, number, choice buttons (e.g., Male/Female/Other), boolean (Yes/No)
- **Voice input support** via Web Speech API for semi-literate users
- Branching question flow based on persona (Farmer, Student, Business, Unemployed, Senior)
- Additional branches for females (widow, SHG, pregnant), rural/urban
- After all questions → calls the **Eligibility Engine** Lambda → displays matched schemes with total annual benefit
- **Frontend fallback engine**: if the backend is down, matches schemes locally using `mockSchemes.js`
- Results saved to `CitizenContext` and persisted to DynamoDB

#### 3. Citizen Dashboard (`/dashboard`)
- Profile completion ring showing % of fields filled
- Quick stats: total matched schemes, annual benefit amount, applications submitted
- Quick-action cards: Find Schemes, Digital Twin, My Schemes, Browse All
- Recent applications list with status badges (pending, submitted, approved, rejected)
- Location badge showing the citizen's village assignment

#### 4. Digital Twin (`/twin`)
- **3-Pathway Income Projection Chart** (Recharts):
  - Best path (all eligible schemes enrolled)
  - Medium path (half schemes)
  - Minimum path (top 3 only)
- Shows month-by-month income growth over 36 months
- Poverty line marker (₹8,000/month) to show when citizen can cross it
- **Scheme Timeline**: shows when each scheme kicks in over the 3-year journey
- **Conflict Resolver**: detects conflicting/overlapping schemes and recommends the optimal bundle
- Stat cards: current income, projected income, total benefit, active schemes

#### 5. Schemes Browser (`/schemes`)
- Filterable grid of all government schemes
- Filter by category: Agriculture, Housing, Health, Education, Women, Employment
- Search bar for scheme names
- Scheme cards showing name, ministry, category, annual benefit, description

#### 6. Scheme Detail Page (`/schemes/:schemeId`)
- Full scheme info with tabbed sections: Overview, Eligibility, Benefits, How to Apply, Documents
- **AI Explain button** — calls Bedrock to generate simple-language explanation
- **Audio playback** — Polly-generated MP3 of the explanation
- **Share** capability (Web Share API)
- Apply button linking to the in-app application flow
- Category label translations (Hindi/English)

#### 7. Apply Page (`/apply/:schemeId`)
- Document checklist with checkboxes
- Personal details form (name, Aadhaar last 4, mobile, bank account last 4)
- Notes field for additional info
- Submits application to the `SarathiApplications` DynamoDB table
- Redirects to applications page after submission

#### 8. My Applications (`/applications`)
- List of all submitted applications with status badges
- Status tracking: submitted → approved/rejected
- Scheme name, application ID, date submitted

#### 9. My Eligible Schemes (`/my-schemes`)
- Displays all schemes the citizen was matched to during the chat flow
- Quick links to apply or view details

#### 10. Profile Page (`/profile`)
- Full profile view with all collected data
- Editable fields: name, age, gender, state, income, category, area type, occupation
- Read-only location fields: village, district, block, panchayat
- Profile completion percentage
- Quick stats: eligible schemes count, annual benefit
- Logout functionality

#### 11. Location Setup (`/setup-location`)
- 4-step hierarchical location picker:
  - State → District → Block → Village
- Loads location data dynamically from JSON files in `/public/data/locations/`
- Search/filter within each step
- Auto-assigns the nearest panchayat based on village selection
- Saves to citizen profile and DynamoDB

---

### B. Panchayat Official Portal

A comprehensive governance dashboard for village panchayat officials (Sarpanch / Secretary).

#### 1. Panchayat Dashboard (`/panchayat`)
- **Header**: Panchayat name, district, state, live data indicator
- **4 Stat Cards**: Total Households, Receiving Benefits (with %), Eligible But Unserved, Zero Benefits
- **AI Insights Panel**: Auto-generated recommendations based on data (e.g., "Demographic enrollment is stable. Suggest conducting follow-up KYC validations for older beneficiaries.")
- **Alerts Panel**: Urgent issues like unserved widows, elderly without pension
- **Citizen Table**: Full sortable table of all citizens in the panchayat
  - Columns: Name, Age, Gender, Income, Village, Schemes, Status
  - Row-level actions: View, Notify
  - Expandable rows showing matched scheme details
- **Governance Heatmap**: Color-coded grid showing scheme coverage per citizen
  - Schemes tracked: PM-KISAN, PMAY, Ayushman, Ujjwala, MGNREGS, Pension
- **Village Map**: Visual geographic representation of the panchayat area
- **CSV Download**: Export full citizen data as a report
- **Notify Citizen**: Send SMS/notification to unserved citizens (via Panchayat Notifier Lambda)

---

## Frontend Pages (21 Total)

| Page | Route | Description |
|------|-------|-------------|
| `LandingPage` | `/` | Public-facing marketing page |
| `ChatPage` | `/chat` | AI-driven eligibility profiling chat |
| `DashboardPage` | `/dashboard` | Citizen's personal dashboard |
| `TwinPage` | `/twin` | Digital twin income projections |
| `SchemesPage` | `/schemes` | Browse all schemes |
| `SchemeDetailPage` | `/schemes/:id` | Individual scheme details + AI explain |
| `ApplyPage` | `/apply/:id` | Apply for a scheme |
| `ApplicationsPage` | `/applications` | Track submitted applications |
| `EligibleSchemesPage` | `/my-schemes` | Citizen's matched schemes |
| `ProfilePage` | `/profile` | View/edit profile |
| `LocationSetupPage` | `/setup-location` | Set village location |
| `LoginPage` | `/citizen/login` | Citizen login |
| `SignupPage` | `/citizen/signup` | Citizen signup |
| `VerifyPage` | `/citizen/verify` | Email verification (OTP) |
| `ForgotPasswordPage` | `/forgot-password` | Citizen password reset |
| `PanchayatLoginPage` | `/panchayat/login` | Panchayat official login |
| `PanchayatSignupPage` | `/panchayat/signup` | Panchayat official signup |
| `PanchayatVerifyPage` | `/panchayat/verify` | Panchayat email OTP verification |
| `PanchayatForgotPasswordPage` | `/panchayat/forgot-password` | Panchayat password reset |
| `PanchayatDashboard` | `/panchayat` | Panchayat governance dashboard |
| `AboutPage` | `/about` | About Sarathi |

---

## Components (22 Total)

### Chat Components (`components/chat/`)
| Component | Purpose |
|-----------|---------|
| `ChatPanel` | Renders the message history (user + bot bubbles) |
| `InputBar` | Text input, voice mic button, choice buttons, submit |
| `ProgressSteps` | 4-phase progress bar showing chat progress |
| `ResultsPanel` | Displays scheme matches and total benefit at end of chat |

### Panchayat Components (`components/panchayat/`)
| Component | Purpose |
|-----------|---------|
| `AIInsights` | AI-generated recommendations for the sarpanch |
| `AlertsPanel` | Urgent alerts (unserved widows, elderly, etc.) |
| `CitizenTable` | Full data table of all citizens with expandable rows |
| `GovernanceHeatmap` | Color-coded scheme coverage grid |
| `VillageMap` | SVG-based geographic village visualization |

### Digital Twin Components (`components/twin/`)
| Component | Purpose |
|-----------|---------|
| `PathwayChart` | Recharts line chart showing 3-year income pathways |
| `SchemeTimeline` | Timeline of when each scheme activates |
| `ConflictResolver` | Detects and resolves conflicting scheme overlaps |

### UI Components (`components/ui/`)
| Component | Purpose |
|-----------|---------|
| `Navbar` | Top navigation bar with role-aware links |
| `ChatBubble` | Styled message bubble (user/bot) |
| `SchemeCard` | Card component for scheme display |
| `StatCard` | Metric card with icon, value, label |
| `EmptyState` | Placeholder for empty data views |
| `LoadingSkeleton` | Shimmer loading placeholder |
| `LanguageToggle` | Hindi/English language switch |
| `Toast` | Toast notification system |
| `VoiceButton` | Microphone button for voice input |

### Auth Components (`components/auth/`)
| Component | Purpose |
|-----------|---------|
| `PrivateRoute` | Route guard checking auth + role (citizen/panchayat) |

---

## State Management & Context

### `AuthContext`
- Manages dual authentication (citizen & panchayat)
- Stores tokens in `localStorage` (separate keys for each portal)
- Auto-refreshes Cognito tokens every 45 minutes
- Provides: `isAuthenticated`, `userType`, `user`, `login()`, `logout()`
- JWT decoding for panchayat-specific claims

### `CitizenContext`
- Stores and persists the citizen's full profile to `localStorage`
- Auto-syncs profile to DynamoDB with debounced saves (2-second delay)
- Loads profile from DB on login, falls back to localStorage if API fails
- Only activates for `citizen` userType (skips for panchayat users)
- Manages eligible schemes list and application data

### `LanguageContext`
- Global Hindi/English language toggle
- Consumed by all pages and components via `useLanguage()` hook

---

## Backend — AWS Lambda Functions (10)

| Lambda | Route | Description |
|--------|-------|-------------|
| **Eligibility Engine** | `POST /eligibility` | Matches a citizen profile against all schemes using 7 criteria (age, income, gender, occupation, caste, widow status, state). Returns matched schemes sorted by benefit. |
| **Digital Twin** | `POST /twin` | Generates 3-year income pathway projections (best/medium/minimum) showing month-by-month income growth as schemes are enrolled. Includes poverty exit month calculation. |
| **Bedrock Explainer** | `POST /explain` | Uses AWS Bedrock (Nova Lite) to explain a scheme in simple language. Generates Hindi audio via Amazon Polly. Results cached in DynamoDB. |
| **Citizen Save** | `POST /citizen`, `GET /citizen/{id}` | Upserts a full citizen profile to DynamoDB with 30+ fields. Supports GET to retrieve saved profiles. Auto-assigns panchayat IDs. |
| **Panchayat Stats** | `GET /panchayat/{id}` | Queries all citizens in a panchayat via GSI. Returns aggregated stats (enrolled, eligible, zero-benefit), household data, and dynamic alerts. |
| **Conflict Detector** | `POST /conflicts` | Detects overlapping/conflicting schemes from DynamoDB rules table. Returns optimal bundle with conflicts removed. |
| **Applications** | `POST /apply`, `GET /applications/{id}`, `PATCH /apply/{id}` | Full CRUD for scheme applications. Submit, list by citizen, and update status (pending/submitted/approved/rejected). |
| **Scheme Fetch** | `GET /scheme/{id}`, `GET /scheme/all` | Fetch individual scheme or all schemes from DynamoDB `SarathiSchemes` table. |
| **Panchayat Notifier** | `POST /notify` | Sends notification to unserved citizens. Used by panchayat officials from the dashboard. |
| **Lex Proxy** | `POST /lex` | Proxies messages to Amazon Lex chatbot for conversational eligibility flow. |

---

## AWS Services Used

| Service | Usage |
|---------|-------|
| **Cognito** | 2 User Pools (Citizen, Panchayat) with email signup + OTP verification |
| **API Gateway** | REST API with Cognito authorizer, CORS configured |
| **Lambda** | 10 serverless functions (Python) |
| **DynamoDB** | 5 tables: `SarathiCitizens`, `SarathiSchemes`, `SarathiApplications`, `SarathiConflicts`, `SarathiExplanationCache` |
| **Bedrock** | Amazon Nova Lite model for AI-powered scheme explanations |
| **Polly** | Text-to-Speech (Aditi voice) for audio explanations |
| **Lex** | Conversational chatbot with custom intents and slots |
| **S3** | Audio file storage (`sarathi-audio-output` bucket) |
| **CloudFront** | CDN for frontend hosting |

---

## Schemes Database

The platform currently has **15+ government welfare schemes** with full data including:
- **Agriculture**: PM-KISAN (₹6,000/yr), PMFBY
- **Housing**: PMAY-G (₹1,20,000)
- **Health**: Ayushman Bharat PM-JAY (₹5,00,000), PM Jeevan Jyoti Bima (₹2,00,000)
- **Women**: PM Ujjwala (₹9,600), IGNWPS Widow Pension (₹12,000/yr), Beti Bachao Beti Padhao (₹15,000), PM Matru Vandana (₹5,000)
- **Employment**: MGNREGS (₹36,000/yr), PMEGP (₹2,50,000), NRLM Aajeevika (₹50,000)
- **Education**: National Scholarship Portal (₹20,000)
- **Senior Citizen**: IGNOAPS Old Age Pension

Each scheme includes: eligibility criteria (age, income, gender, category, occupation, state), annual benefit amount, ministry, apply URL, step-by-step how to apply, required documents, benefit descriptions, and Hindi/English names.

### Eligibility Matching Criteria
The engine checks **7 parameters** per scheme:
1. Age range (`minAge`, `maxAge`)
2. Monthly income ceiling (`maxMonthlyIncome`)
3. Gender filter (`any`, `male`, `female`)
4. Occupation/Persona (`any`, `farmer`, `student`, etc.)
5. Caste category (`SC`, `ST`, `OBC`, `General`)
6. Widow status (`any`, `true`)
7. State/Geography (`All` or specific state list)

---

## Conversational Question Flow

The chat-based profiling follows a **branching conversation tree**:

```
Phase 1: CORE QUESTIONS (always asked)
  ├── Name (text)
  ├── Age (number)
  ├── Gender (choice: Male/Female/Other)
  ├── State (choice: Indian states)
  ├── Annual Income (number, in ₹)
  ├── Social Category (choice: General/OBC/SC/ST)
  └── Area (choice: Urban/Rural)

Phase 2: PERSONA (occupation)
  └── Choice: Farmer / Student / Business / Unemployed / Senior

Phase 3: BRANCH QUESTIONS (based on persona)
  ├── Farmer: Land ownership, land size, MGNREGS card
  ├── Student: Education level, govt school, minority
  ├── Business: MSME registration, enterprise status
  ├── Unemployed: Skill training, job seeking
  └── Senior: Disability status

  + Female branch: Widow, SHG member, pregnant
  + Rural branch: Ration card, SHG (conditional)
  + Urban branch: Street vendor status

Phase 4: RESULTS
  └── API call → matched schemes + total annual benefit
```

All questions have **Hindi translations** for bilingual support.

---

## Village & Location Data

- **Source**: LGD (Local Government Directory) hierarchy dataset
- **57 MB** JSON file (`lgd_hierarchy.json`) containing all Indian villages
- **Processing Scripts**:
  - `process_lgd.py` — processes the raw LGD data
  - `split_hierarchy.py` — splits into per-state/district/block JSON files
- **Frontend Data**: Pre-split JSON files served from `/public/data/locations/`
  - Structure: `states.json` → `villages/{state}/{district}.json` → individual village data
- Used by `LocationSetupPage` for hierarchical State → District → Block → Village selection
- Each village record includes: village code, panchayat code, panchayat name, block, district, state

---

## Bilingual Support (English / Hindi)

- **128+ translation keys** in `translations.js` covering all UI text
- Language toggle available on every page via `LanguageToggle` component
- Chat questions have `prompt` (English) and `promptHi` (Hindi) variants
- Scheme names stored in both `nameEnglish` and `nameHindi`
- Number formatting adapts to locale (`localizeNum` utility)
- Polly audio uses the bilingual **Aditi** voice

---

## API Routes

| Method | Route | Lambda | Auth |
|--------|-------|--------|------|
| `POST` | `/eligibility` | Eligibility Engine | Cognito |
| `POST` | `/twin` | Digital Twin | Cognito |
| `POST` | `/explain` | Bedrock Explainer | Cognito |
| `POST` | `/citizen` | Citizen Save | Cognito |
| `GET` | `/citizen/{userId}` | Citizen Save | Cognito |
| `GET` | `/panchayat/{panchayatId}` | Panchayat Stats | Cognito |
| `POST` | `/conflicts` | Conflict Detector | Cognito |
| `GET` | `/scheme/{schemeId}` | Scheme Fetch | Cognito |
| `GET` | `/scheme/all` | Scheme Fetch | Cognito |
| `POST` | `/apply` | Applications | Cognito |
| `GET` | `/applications/{userId}` | Applications | Cognito |
| `PATCH` | `/apply/{applicationId}` | Applications | Cognito |
| `POST` | `/notify` | Panchayat Notifier | Cognito |
| `POST` | `/lex` | Lex Proxy | Cognito |

**Base URL**: `https://mvbx0sv4n3.execute-api.us-east-1.amazonaws.com/prod`

---

## Project File Structure

```
Sarathi/
├── sarathi-frontend/           # React + Vite frontend
│   ├── src/
│   │   ├── pages/              # 21 page components
│   │   ├── components/
│   │   │   ├── auth/           # PrivateRoute
│   │   │   ├── chat/           # ChatPanel, InputBar, ProgressSteps, ResultsPanel
│   │   │   ├── panchayat/      # AIInsights, AlertsPanel, CitizenTable, Heatmap, Map
│   │   │   ├── twin/           # PathwayChart, SchemeTimeline, ConflictResolver
│   │   │   └── ui/             # Navbar, SchemeCard, StatCard, Toast, etc.
│   │   ├── context/            # AuthContext, CitizenContext, LanguageContext
│   │   ├── data/               # questionFlow, mockSchemes, mockCitizens, mockPanchayat
│   │   ├── hooks/              # useAudioPlayer, useEligibility, useVoiceInput
│   │   ├── services/           # authService (Cognito SDK)
│   │   ├── utils/              # api.js (Axios), translations.js, formatters.js
│   │   └── styles/             # TailwindCSS config
│   ├── public/data/locations/  # Pre-split village hierarchy JSONs
│   └── .env                    # Environment variables (Cognito IDs, API URL)
│
├── backend/
│   ├── lambdas/                # 10 Lambda functions (Python)
│   │   ├── eligibility_engine.py
│   │   ├── digital_twin.py
│   │   ├── bedrock_explainer.py
│   │   ├── citizen_save.py
│   │   ├── panchayat_stats.py
│   │   ├── conflict_detector.py
│   │   ├── applications.py
│   │   ├── scheme_fetch.py
│   │   ├── panchayat_notifier.py
│   │   └── schemes.json        # Bundled schemes data
│   ├── seed/                   # DynamoDB seed data
│   ├── deploy_lambdas.py       # Lambda deployment script
│   ├── create_api_routes.py    # API Gateway setup
│   └── setup_authorizer.py     # Cognito authorizer setup
│
├── lambda/
│   ├── lex-fulfillment/        # Lex bot fulfillment Lambda
│   ├── lex-proxy/              # Lex conversation proxy
│   ├── bedrock-explainer/      # Bedrock AI Lambda
│   ├── panchayat-notifier/     # Notification Lambda
│   ├── lex-bot-config.json     # Lex bot intents & utterances
│   └── lex_slots.json          # Lex slot definitions
│
├── VILLAGES_DATASET/           # Raw LGD village data + processing scripts
│   ├── lgd_hierarchy.json      # 57 MB raw hierarchy
│   ├── process_lgd.py
│   └── split_hierarchy.py
│
├── sarathi_aws_plan.md         # AWS infrastructure plan
├── sarathi_frontend_spec.md    # Frontend specification
├── requirements.md             # Full project requirements
└── amplify.yml                 # AWS Amplify build config
```

---

## Environment Variables

| Variable | Description |
|----------|-------------|
| `VITE_API_BASE_URL` | API Gateway invoke URL |
| `VITE_AWS_REGION` | AWS region (`us-east-1`) |
| `VITE_CITIZEN_CLIENT_ID` | Cognito Citizen User Pool App Client ID |
| `VITE_PANCHAYAT_CLIENT_ID` | Cognito Panchayat User Pool App Client ID |

---

## Key Design Decisions

1. **Dual User Pools**: Citizen and Panchayat officials have separate Cognito pools, separate auth flows, and role-based route protection
2. **Conversational UX**: Chat-based profiling to make the process accessible to semi-literate rural users
3. **Frontend Fallback**: If the backend eligibility API is down, a local matching engine kicks in using `mockSchemes.js`
4. **Debounced DB Sync**: Profile changes save to localStorage immediately and sync to DynamoDB with a 2-second debounce
5. **Cached AI Explanations**: Bedrock + Polly outputs are cached in DynamoDB to avoid redundant AI calls
6. **Hierarchical Location Data**: 57 MB village hierarchy is pre-split into small JSON files loaded on-demand
7. **Cross-Pool Token Isolation**: The API interceptor prevents token-wipe redirects when citizen APIs fail for panchayat users (and vice versa)
