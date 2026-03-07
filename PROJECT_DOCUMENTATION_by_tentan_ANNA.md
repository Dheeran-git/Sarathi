# Sarathi | सारथी — Project Documentation

> An AI-powered platform that connects India's rural citizens with 700+ government welfare schemes and provides Panchayat officials with data-driven governance tools.

---

## 🏗️ High-Level Architecture

Sarathi follows a modern serverless architecture designed for scalability and accessibility:

- **Frontend**: Single Page Application (SPA) built with **React 18** and **Vite 7**.
- **Backend**: Serverless API powered by **10 AWS Lambda Functions** (Python).
- **Security**: Double-layered authentication via **AWS Cognito** (Citizen & Panchayat pools).
- **Communication**: REST APIs managed through **AWS API Gateway** in `us-east-1`.
- **Intelligent Engine**: **AWS Bedrock (Nova Lite)** for AI-driven scheme logic and **Amazon Lex** for conversational flows.

---

## 🚀 Core Features

### 1. Citizen Experience
- **AI Eligibility Chat**: A branching conversation tree that profiles users and matches them to schemes.
- **Welfare Digital Twin**: A 36-month income projection chart visualizing how welfare impacts poverty levels.
- **Voice-First Navigation**: Integrated Web Speech API for hands-free, multilingual interaction (Hindi/English).
- **Scheme Explainer**: AI-generated simple-language summaries with audio playback via **Amazon Polly**.

### 2. Panchayat Governance
- **Panchayat Dashboard**: Real-time stats on households, benefits coverage, and welfare gaps.
- **Governance Heatmap**: Color-coded visualization of scheme penetration in the village.
- **Outreach Tools**: Targeted notification systems to reach unserved citizens based on eligibility gaps.
- **Performance Reporting**: Automated PDF reports for monthly governance auditing.

---

## 🛠️ Technical Stack

| Layer | Technology |
|-------|-----------|
| **Core** | React 18, Vite 7, TailwindCSS |
| **Auth** | AWS Cognito (Dual User Pools) |
| **DB** | DynamoDB (Citizens, Schemes, Applications, Conflicts, Cache) |
| **AI** | AWS Bedrock (Nova Lite), Amazon Lex |
| **Media** | Amazon Polly (Text-to-Speech), AWS S3 (Storage) |
| **Deployment** | AWS Amplify, us-east-1 REST API |

---

## 📖 Branch Highlights & Development History

This section details the specific evolution of the project through its key development branches.

### 🔹 Branch: `dev1` (Admin & Agent Core)
The focus of `dev1` was on establishing the management layer and resolving critical authentication blockers.

- **Admin/Agent Roles**: Implementation of the initial administrative roles to manage the platform backend.
- **Authentication Resilience**: Fixed critical bugs in the Panchayat login portal that prevented official access.
- **Base Stability**: Merged the stable `main` branch to ensure a clean foundation for advanced features.
- **Integration**: Initial work on the `AdminAnalytics` and `AdminApplicantsPage` structures.

### 🔹 Branch: `dev2` (Comprehensive Governance & Scaling)
The `dev2` branch represents a massive feature expansion and infrastructure migration.

- **Infrastructure Migration**: Successfully migrated all AWS resources from `ap-south-1` (Mumbai) to `us-east-1` (N. Virginia) for better AI service availability.
- **Database Expansion**: Expanded the schemes database from 15 to **86+ schemes**, including pan-India state filtering.
- **10+ New Governance Pages**: Developed the full suite of Panchayat tools:
    - `GrievanceTracker`: For managing citizen complaints.
    - `PanchayatAnalytics`: Data visualization for village welfare.
    - `VillageProfile`: Demographic breakdown of the jurisdiction.
    - `PerformanceReport`: Automated auditing tools.
    - `WelfareCalendar`: Milestone tracking for scheme deadlines.
- **Voice System Patches**: Fixed a browser TTS garbage collection bug causing dropped voice loops; implemented hands-free "Live Conversation" mode.
- **Amplify Deployment**: Configured `amplify.yml` and environment variables for the first stable production-ready deployment.
- **Digital Twin Logic**: Integrated live API data for `SchemeTimeline` and `ConflictResolver`.

---

## 📂 Project Structure

```text
Sarathi/
├── sarathi-frontend/       # React Frontend Components & Pages
│   ├── src/pages/panchayat # Governance suite (10+ pages)
│   └── public/data         # Hierarchical LGD location data
├── backend/                # Serverless Backend
│   └── lambdas/            # Python logic for Eligibility, Twin, etc.
├── lambda/                 # Infrastructure configuration (Lex, Bedrock)
└── VILLAGES_DATASET/       # Raw LGD village processing scripts
```

---

*Documentation generated on 2026-03-06*
