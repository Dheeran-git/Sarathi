# Design Document: Sarathi Welfare Platform

## Overview

Sarathi is an AI-driven, proactive welfare intelligence platform that transforms India's welfare delivery system from reactive and fragmented to proactive and intelligent. The platform uses conversational AI, knowledge graphs, predictive modeling, and privacy-preserving technologies to ensure the right benefit reaches the right citizen at the right time, even if they cannot read, write, or use the internet.

### Design Philosophy

**Voice-First, Offline-First, Privacy-First**: The platform is designed from the ground up for illiterate citizens in remote areas with intermittent connectivity, using zero-knowledge proofs to protect sensitive data while enabling welfare access.

**Proactive Intelligence**: Rather than waiting for citizens to discover schemes, Sarathi uses life-event triggers, welfare digital twins, and Panchayat outreach to proactively identify and enroll eligible beneficiaries.

**Ethical AI**: Every decision is explainable in simple language, fraud detection includes human-in-loop safeguards, and community validation creates accountability.

### Key Innovations

1. **Welfare Digital Twin**: Predictive simulation of citizen's welfare trajectory over 3-5 years
2. **Conflict-Resolution Engine**: Game theory-based optimization for benefit bundle selection
3. **Zero-Knowledge Proofs**: Privacy-preserving eligibility verification
4. **Offline-First Mesh Networking**: P2P data collection in areas with zero connectivity
5. **Benefit Portability**: Inter-state migrant tracking and benefit translation
6. **Community Validation Loop**: Governance performance index through citizen feedback

## Solution Architecture & Interaction Flows

### 1. Solution Architecture Overview

Sarathi implements a five-layer event-driven welfare intelligence system:

```
┌─────────────────────────────────────────────────────────────────┐
│                    CITIZENS / PANCHAYAT OFFICIALS                │
└─────────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│              LAYER 1: INTERACTION LAYER                          │
│  Voice Interface │ Chat Interface │ IVR │ Panchayat Dashboard   │
│  (Amazon Lex)    │ (Amazon Lex)   │     │ (React Web App)       │
└─────────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│              LAYER 2: INTELLIGENCE LAYER (Core Brain)            │
│  ┌──────────────────┐  ┌──────────────────┐  ┌───────────────┐ │
│  │ Eligibility      │  │ Conflict         │  │ Fraud & Risk  │ │
│  │ Matching Engine  │  │ Resolution       │  │ Analysis      │ │
│  │ (Graph Traversal)│  │ (Optimization)   │  │ (ML Models)   │ │
│  └──────────────────┘  └──────────────────┘  └───────────────┘ │
│  ┌──────────────────┐  ┌──────────────────┐                    │
│  │ Welfare Digital  │  │ Explainability   │                    │
│  │ Twin (Prediction)│  │ Engine (Bedrock) │                    │
│  └──────────────────┘  └──────────────────┘                    │
└─────────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│         LAYER 3: DATA & KNOWLEDGE LAYER                          │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Welfare Knowledge Graph (Amazon Neptune)                 │  │
│  │  • Citizens • Schemes • Rules • Conflicts • Life Events   │  │
│  └──────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Operational Data Store (DynamoDB)                        │  │
│  │  • Profiles • Applications • Consent • Panchayat Actions  │  │
│  └──────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Document Storage (S3)                                    │  │
│  │  • Scheme PDFs • Application Forms • Evidence Documents  │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│         LAYER 4: OUTREACH & NOTIFICATION LAYER                   │
│  ┌──────────────────┐  ┌──────────────────┐  ┌───────────────┐ │
│  │ Panchayat Alerts │  │ Citizen          │  │ Life-Event    │ │
│  │ (Eligible Non-   │  │ Notifications    │  │ Triggers      │ │
│  │  Beneficiaries)  │  │ (Status Updates) │  │ (Proactive)   │ │
│  └──────────────────┘  └──────────────────┘  └───────────────┘ │
│           Amazon SNS │ WhatsApp/SMS │ Amazon Location Service   │
└─────────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│         LAYER 5: GOVERNANCE, ETHICS & AUDIT LAYER                │
│  ┌──────────────────┐  ┌──────────────────┐  ┌───────────────┐ │
│  │ Explainability   │  │ Consent          │  │ Audit Logs    │ │
│  │ Reports          │  │ Management       │  │ (Immutable)   │ │
│  └──────────────────┘  └──────────────────┘  └───────────────┘ │
│  ┌──────────────────┐  ┌──────────────────┐                    │
│  │ Community        │  │ Performance      │                    │
│  │ Validation       │  │ Metrics          │                    │
│  └──────────────────┘  └──────────────────┘                    │
└─────────────────────────────────────────────────────────────────┘
```

### 2. High-Level Architecture (Conceptual)

```
                    ┌─────────────────────────────────┐
                    │  Citizens / Panchayat Officials │
                    └────────────┬────────────────────┘
                                 │
                    ┌────────────▼────────────────────┐
                    │  Conversational & Assisted UI   │
                    │  Voice │ Chat │ IVR │ Dashboard │
                    └────────────┬────────────────────┘
                                 │
                    ┌────────────▼────────────────────┐
                    │   Eligibility Intelligence Core │
                    │  Knowledge Graph + Rules Engine │
                    │  + Conflict Resolution + Fraud  │
                    └────────────┬────────────────────┘
                                 │
                    ┌────────────▼────────────────────┐
                    │  Scheme Actions & Outreach      │
                    │  Applications │ Alerts │ Guide  │
                    └────────────┬────────────────────┘
                                 │
                    ┌────────────▼────────────────────┐
                    │  Audit, Ethics & Governance     │
                    │  Explainability │ Validation    │
                    └─────────────────────────────────┘
```

### 3. Architecture Layers (Detailed)

#### 3.1 Interaction Layer

**Purpose**: Provide multiple access channels for citizens and Panchayat officials, with emphasis on voice-first design for illiterate users.

**Components**:

1. **Voice Interface (Citizen Mode)**
   - Technology: Amazon Lex with Polly for speech synthesis
   - Supports 22 Indian languages with dialect recognition
   - 90% transcription accuracy within 2 seconds
   - Conversational flow for profile collection and scheme discovery
   - Simple language explanations using Amazon Bedrock

2. **Chat Interface (Alternative Mode)**
   - Technology: Amazon Lex text-based bot
   - Same conversational logic as voice interface
   - Accessible via WhatsApp, SMS, web chat
   - Supports rich media (images, buttons, carousels)

3. **IVR / Missed Call System (Basic Phone Users)**
   - Technology: Amazon Connect
   - DTMF-based navigation for feature phones
   - Missed call triggers for benefit confirmation
   - Voice message recording for feedback

4. **Panchayat Assisted App (Official-Operated Mode)**
   - Technology: React web application
   - Guided workflow for assisted registration
   - Offline-first with local storage and sync queue
   - Document capture via camera
   - Real-time eligibility checking

5. **Panchayat Dashboard (Outreach & Monitoring)**
   - Technology: React web application with data visualization
   - Eligible non-beneficiary lists
   - Life-event alerts
   - Performance metrics and governance index
   - Fraud flag review interface

**Key Design Choices**:
- **No Forms**: All data collection through conversational flow
- **Local Language Support**: Every interaction in citizen's preferred language
- **Unified Backend**: All channels use same API Gateway and Lambda functions
- **Progressive Enhancement**: Works on basic phones, enhanced on smartphones

**Requirements Addressed**: Req 1 (Voice-First), Req 5 (Assisted Registration), Req 14 (Multi-Language), Req 15 (Accessibility)



#### 3.2 Intelligence Layer (Core Brain)

**Purpose**: Implement the core welfare intelligence algorithms including eligibility matching, conflict resolution, fraud detection, and predictive modeling.

**Components**:

1. **Eligibility Matching Engine**
   - Technology: AWS Lambda + Amazon Neptune graph traversal
   - Graph-based eligibility evaluation using Gremlin queries
   - Sub-3-second response time for complex eligibility checks
   - Handles 10,000 concurrent evaluations
   - Caches common eligibility patterns in DynamoDB

   **Algorithm**:
   ```
   function evaluateEligibility(citizenId, schemeId):
     1. Load citizen node from Knowledge Graph
     2. Load scheme node with eligibility criteria edges
     3. Traverse graph matching citizen attributes to criteria
     4. For each criterion:
        - Check if citizen has required attribute/relationship
        - Verify evidence nodes are valid and not expired
        - Calculate confidence score
     5. Aggregate results: ELIGIBLE | INELIGIBLE | NEEDS_VERIFICATION
     6. Generate explainability path showing matched/unmatched criteria
     7. Return decision + confidence + explanation
   ```

2. **Conflict Resolution Engine**
   - Technology: AWS Lambda with optimization libraries (SciPy/OR-Tools)
   - Models scheme conflicts as constraint satisfaction problem
   - Uses linear programming or genetic algorithms for optimization
   - Ranks benefit bundles by value, coverage, effort, probability

   **Algorithm**:
   ```
   function findOptimalBundle(citizenId, eligibleSchemes):
     1. Build conflict graph from scheme relationships
     2. Identify mutually exclusive scheme groups
     3. For each valid combination:
        - Calculate total monetary value
        - Calculate coverage breadth (categories covered)
        - Calculate application effort (documents needed)
        - Calculate approval probability (Trust_Score)
     4. Apply multi-objective optimization:
        - Maximize: value × 0.5 + coverage × 0.3 + probability × 0.2
        - Minimize: effort
     5. Return top 3 ranked bundles with trade-off explanations
   ```

3. **Fraud & Risk Analysis Engine**
   - Technology: AWS Lambda + Amazon SageMaker for ML models
   - Multi-layered fraud detection with explainability
   - Risk scoring: Low (0-30), Medium (31-60), High (61-100)
   - Human-in-loop review for medium/high risk

   **Algorithm**:
   ```
   function calculateFraudScore(application):
     score = 0
     factors = []
     
     // Evidence Quality Check (0-20 points)
     if missing_critical_evidence:
       score += 15
       factors.append("Missing critical documents")
     if expired_evidence:
       score += 10
       factors.append("Expired certificates")
     
     // Cross-Scheme Consistency (0-25 points)
     inconsistencies = checkCrossSchemeConsistency(application)
     score += inconsistencies.count × 5
     factors.extend(inconsistencies.descriptions)
     
     // Lifestyle-Income Anomaly (0-25 points)
     anomaly_score = detectLifestyleIncomeAnomaly(application)
     score += anomaly_score
     if anomaly_score > 15:
       factors.append("Lifestyle indicators exceed declared income")
     
     // Historical Pattern Analysis (0-15 points)
     if similar_rejected_applications_in_past:
       score += 10
       factors.append("Similar application rejected previously")
     
     // Duplicate Benefit Check (0-15 points)
     if duplicate_benefit_detected:
       score += 15
       factors.append("Already enrolled in conflicting scheme")
     
     return {
       score: score,
       risk_level: getRiskLevel(score),
       factors: factors,
       recommendation: getRecommendation(score)
     }
   ```

4. **Welfare Digital Twin Engine**
   - Technology: AWS Lambda + Amazon SageMaker for predictive models
   - Simulates citizen's life trajectory over 3-5 years
   - Predicts life events with confidence scores
   - Identifies future scheme eligibility

   **Algorithm**:
   ```
   function createWelfareTwin(citizenId, years=5):
     citizen = loadCitizenProfile(citizenId)
     timeline = []
     
     for year in range(1, years+1):
       // Predict life events
       events = predictLifeEvents(citizen, year)
       
       for event in events:
         // Calculate confidence based on demographic patterns
         confidence = calculateEventConfidence(event, citizen)
         
         // Identify schemes triggered by event
         triggered_schemes = findSchemesByLifeEvent(event)
         
         // Filter by predicted eligibility
         eligible_schemes = []
         for scheme in triggered_schemes:
           future_citizen = simulateCitizenState(citizen, year)
           if wouldBeEligible(future_citizen, scheme):
             eligible_schemes.append(scheme)
         
         timeline.append({
           year: year,
           event: event,
           confidence: confidence,
           schemes: eligible_schemes,
           preparation_steps: generatePreparationSteps(eligible_schemes)
         })
     
     // Identify poverty exit pathways
     pathways = identifyPovertyExitPathways(timeline)
     
     return {
       timeline: timeline,
       pathways: pathways,
       total_potential_value: calculateTotalValue(timeline)
     }
   ```

5. **Explainability Engine**
   - Technology: Amazon Bedrock (Claude/Titan models)
   - Converts technical decisions to simple language
   - Generates explanations in citizen's preferred language
   - Provides step-by-step reasoning for eligibility decisions

   **Algorithm**:
   ```
   function generateExplanation(decision, language):
     prompt = buildPrompt(decision, language)
     
     // Use Amazon Bedrock to generate simple explanation
     explanation = bedrock.invoke({
       model: "anthropic.claude-v2",
       prompt: prompt,
       max_tokens: 500,
       temperature: 0.3
     })
     
     // Structure explanation
     return {
       decision_summary: explanation.summary,
       criteria_matched: explanation.matched_criteria,
       criteria_unmatched: explanation.unmatched_criteria,
       next_steps: explanation.recommended_actions,
       language: language
     }
   ```

**Requirements Addressed**: Req 2 (Eligibility Engine), Req 6 (Conflict Detection), Req 7 (Optimal Bundle), Req 8 (Fraud Prevention), Req 9 (Welfare Twin), Req 10 (Explainability), Req 21 (Digital Twin), Req 22 (Conflict Resolution)

#### 3.3 Data & Knowledge Layer

**Purpose**: Store and manage all welfare data using appropriate data models for different access patterns.

**Components**:

1. **Welfare Knowledge Graph (Amazon Neptune)**
   
   **Why Knowledge Graph?**
   - Eligibility rules are inherently relational (citizen → has → attribute → matches → criterion)
   - Multi-scheme reasoning requires traversing complex relationships
   - Conflict detection needs graph analysis (mutual exclusion edges)
   - Policy changes can be modeled as graph updates without code changes
   - Graph queries (Gremlin) naturally express eligibility logic

   **Node Types**:
   ```
   Citizen {
     id: string (Aadhaar/unique ID)
     name: string
     age: integer
     gender: enum
     location: {state, district, panchayat}
     income: integer
     caste: enum
     disability_status: boolean
     household_id: string
   }
   
   Scheme {
     id: string
     name: string
     description: string
     state: string
     category: enum (pension, education, health, housing, etc.)
     benefit_value: integer
     benefit_type: enum (one-time, recurring, in-kind)
     enrollment_window: {start_date, end_date}
     age_limit: {min, max}
     purpose: string (for purpose-lock enforcement)
   }
   
   EligibilityCriterion {
     id: string
     criterion_type: enum (income, age, caste, disability, etc.)
     operator: enum (less_than, greater_than, equals, in_range)
     threshold_value: any
     required: boolean
   }
   
   Evidence {
     id: string
     evidence_type: enum (income_cert, caste_cert, disability_cert, etc.)
     issuing_authority: string
     issue_date: date
     expiry_date: date
     verification_status: enum (pending, verified, expired)
     document_url: string (S3 path)
   }
   
   LifeEvent {
     id: string
     event_type: enum (birth, death, marriage, disability, migration, etc.)
     event_date: date
     citizen_id: string
     household_id: string
     verified: boolean
   }
   
   Conflict {
     id: string
     conflict_type: enum (mutual_exclusion, purpose_lock, quota_limit)
     reason: string
   }
   
   Household {
     id: string
     head_of_household: string (citizen_id)
     location: {state, district, panchayat}
     total_income: integer
     member_count: integer
   }
   ```

   **Edge Types**:
   ```
   Citizen -[HAS_ATTRIBUTE]-> Attribute
   Citizen -[MEMBER_OF]-> Household
   Citizen -[ENROLLED_IN]-> Scheme
   Citizen -[APPLIED_FOR]-> Scheme
   Citizen -[HAS_EVIDENCE]-> Evidence
   Citizen -[EXPERIENCED]-> LifeEvent
   
   Scheme -[REQUIRES]-> EligibilityCriterion
   Scheme -[CONFLICTS_WITH]-> Scheme
   Scheme -[TRIGGERED_BY]-> LifeEvent
   Scheme -[REQUIRES_EVIDENCE]-> EvidenceType
   
   EligibilityCriterion -[VERIFIED_BY]-> Evidence
   
   LifeEvent -[TRIGGERS]-> Scheme
   ```

   **Example Graph Query (Gremlin)**:
   ```gremlin
   // Find all schemes a citizen is eligible for
   g.V().hasLabel('Citizen').has('id', citizenId)
     .as('citizen')
     .V().hasLabel('Scheme')
     .as('scheme')
     .where(
       __.out('REQUIRES').as('criterion')
         .where(
           __.select('citizen')
             .out('HAS_ATTRIBUTE')
             .has('matches', __.select('criterion'))
         )
     )
     .select('scheme')
   ```

2. **Operational Data Store (Amazon DynamoDB)**
   
   **Why DynamoDB?**
   - Fast key-value access for user profiles and sessions
   - High throughput for concurrent voice/chat interactions
   - Automatic scaling for 10,000+ concurrent users
   - Single-digit millisecond latency
   - Built-in encryption and backup

   **Tables**:
   ```
   CitizenProfiles {
     PK: citizen_id (string)
     SK: "PROFILE"
     name: string
     phone: string
     preferred_language: string
     location: map
     consent_status: boolean
     consent_timestamp: timestamp
     last_interaction: timestamp
     created_at: timestamp
     updated_at: timestamp
   }
   
   Applications {
     PK: application_id (string)
     SK: "APPLICATION"
     citizen_id: string (GSI)
     scheme_id: string
     status: enum (pending, approved, rejected, delivered)
     submitted_at: timestamp
     processed_at: timestamp
     fraud_score: number
     risk_level: string
     reviewer_id: string
     documents: list<string> (S3 URLs)
   }
   
   PanchayatActions {
     PK: panchayat_id (string)
     SK: timestamp#action_id
     action_type: enum (outreach, registration, review, validation)
     official_id: string
     citizen_id: string
     details: map
     timestamp: timestamp
   }
   
   ConsentLogs {
     PK: citizen_id (string)
     SK: timestamp#consent_id
     consent_type: enum (data_collection, data_sharing, zkp_verification)
     granted: boolean
     purpose: string
     timestamp: timestamp
   }
   
   SyncQueue {
     PK: device_id (string)
     SK: timestamp#operation_id
     operation_type: enum (registration, update, document_upload)
     payload: map
     status: enum (pending, syncing, completed, failed)
     retry_count: number
     created_at: timestamp
   }
   
   ValidationTokens {
     PK: application_id (string)
     SK: "VALIDATION"
     citizen_id: string
     scheme_id: string
     validation_method: enum (missed_call, sms, voice_note, in_person)
     validated: boolean
     validation_timestamp: timestamp
     feedback: string
   }
   ```

3. **Document Storage (Amazon S3)**
   
   **Buckets**:
   ```
   sarathi-scheme-documents/
     ├── schemes/{state}/{scheme_id}/
     │   ├── description.pdf
     │   ├── application_form.pdf
     │   └── guidelines.pdf
     ├── evidence/{citizen_id}/{evidence_type}/
     │   ├── {document_id}.pdf
     │   └── {document_id}.jpg
     └── audio/{citizen_id}/
         ├── consent_{timestamp}.mp3
         └── feedback_{timestamp}.mp3
   ```

   **Lifecycle Policies**:
   - Evidence documents: Retain for 7 years (compliance requirement)
   - Audio consent: Retain for 3 years
   - Scheme documents: Versioned, retain all versions

**Requirements Addressed**: Req 2 (Knowledge Graph), Req 16 (Audit Trail), Req 18 (Data Security), Req 19 (Scheme Management)



#### 3.4 Outreach & Notification Layer

**Purpose**: Proactively reach out to citizens and Panchayats with timely alerts and notifications.

**Components**:

1. **Panchayat Alert System**
   - Technology: AWS Lambda + Amazon SNS
   - Triggers: Life events, newly eligible citizens, deadline approaching
   - Delivery: Dashboard notifications, SMS, email
   - Priority classification: High (time-sensitive), Medium (new eligibility), Low (routine)

   **Alert Types**:
   ```
   NewlyEligibleAlert {
     citizen_id: string
     citizen_name: string
     eligible_schemes: list<scheme>
     total_benefit_value: integer
     priority: enum (high, medium, low)
     reason: string (life event, age milestone, policy change)
   }
   
   InvisibleCitizenAlert {
     household_id: string
     household_head: string
     zero_benefit_duration: integer (days)
     eligible_schemes: list<scheme>
     vulnerability_score: integer
   }
   
   DeadlineAlert {
     citizen_id: string
     scheme_id: string
     deadline: date
     days_remaining: integer
     urgency: enum (critical, warning, info)
   }
   ```

2. **Citizen Notification System**
   - Technology: Amazon SNS + WhatsApp Business API + SMS Gateway
   - Triggers: Application status change, benefit disbursement, new eligibility
   - Multi-channel: WhatsApp > SMS > Voice call (fallback chain)
   - Language-aware: Notifications in citizen's preferred language

   **Notification Types**:
   ```
   ApplicationStatusNotification {
     application_id: string
     status: enum (submitted, under_review, approved, rejected, delivered)
     next_steps: string
     estimated_delivery: date (if approved)
   }
   
   BenefitDisbursementNotification {
     scheme_name: string
     amount: integer
     disbursement_date: date
     validation_request: {
       missed_call_number: string
       sms_keyword: string
     }
   }
   
   NewEligibilityNotification {
     scheme_name: string
     benefit_value: integer
     eligibility_reason: string (life event, age milestone)
     application_guidance: string
     deadline: date (if applicable)
   }
   ```

3. **Life-Event Trigger System**
   - Technology: AWS Lambda + Amazon EventBridge
   - Monitors: Birth/death registrations, disability certificates, migration reports
   - Batch processing: Every 6 hours for offline-collected events
   - Real-time processing: For online-reported events

   **Event Processing Flow**:
   ```
   function processLifeEvent(event):
     1. Validate event data and source
     2. Create LifeEvent node in Knowledge Graph
     3. Link to affected citizen(s) and household
     4. Query schemes triggered by this event type
     5. Evaluate eligibility for each triggered scheme
     6. Generate alerts for Panchayat and citizen
     7. Update Welfare Digital Twin predictions
     8. Log event in audit trail
   ```

**Design Principle**: System reaches out first - citizens don't need to actively search.

**Requirements Addressed**: Req 3 (Life-Event Triggers), Req 4 (Panchayat Dashboard), Req 13 (Community Validation), Req 28 (Deadline Intelligence), Req 29 (Invisible Citizen Detection)

#### 3.5 Governance, Ethics & Audit Layer

**Purpose**: Ensure transparency, accountability, and ethical operation of the welfare system.

**Components**:

1. **Explainability System**
   - Technology: Amazon Bedrock + AWS Lambda
   - Generates human-readable explanations for all decisions
   - Supports 22 Indian languages
   - Includes visual aids (matched/unmatched criteria)

   **Explainability Report Structure**:
   ```
   ExplainabilityReport {
     decision_id: string
     decision_type: enum (eligibility, fraud_flag, bundle_recommendation)
     decision: string
     confidence: float
     
     explanation: {
       summary: string (simple language)
       criteria_evaluated: list<{
         criterion: string
         citizen_value: any
         required_value: any
         matched: boolean
         explanation: string
       }>
       reasoning_steps: list<string>
       contributing_factors: list<string>
     }
     
     next_steps: list<string>
     appeal_process: string
     language: string
   }
   ```

2. **Consent Management System**
   - Technology: AWS Lambda + DynamoDB
   - Granular consent for different data uses
   - Consent withdrawal support
   - Audit trail for all consent actions

   **Consent Types**:
   ```
   - DATA_COLLECTION: Basic profile information
   - DATA_SHARING: Sharing with Panchayat officials
   - ZKP_VERIFICATION: Zero-knowledge proof generation
   - BENEFIT_PORTABILITY: Inter-state data transfer
   - ANALYTICS: Anonymized data for policy insights
   ```

3. **Audit Log System**
   - Technology: AWS Lambda + DynamoDB + S3 (long-term storage)
   - Immutable logs with cryptographic hashing
   - Tamper-evident using hash chains
   - 7-year retention for compliance

   **Audit Log Entry**:
   ```
   AuditLogEntry {
     log_id: string (UUID)
     timestamp: timestamp (ISO 8601)
     user_id: string
     user_role: enum (citizen, panchayat_official, admin, system)
     action_type: enum (eligibility_check, registration, approval, data_access, etc.)
     resource_type: enum (citizen, scheme, application, etc.)
     resource_id: string
     action_details: map
     ip_address: string
     device_id: string
     previous_hash: string (hash of previous log entry)
     current_hash: string (SHA-256 of this entry)
   }
   ```

4. **Community Validation System**
   - Technology: AWS Lambda + DynamoDB + Amazon Managed Blockchain (optional)
   - Missed call / SMS / Voice note validation
   - Immutable validation tokens
   - Governance performance index calculation

   **Validation Token**:
   ```
   ValidationToken {
     token_id: string
     application_id: string
     citizen_id: string
     scheme_id: string
     panchayat_id: string
     validation_method: enum (missed_call, sms, voice_note, in_person)
     validated: boolean
     validation_timestamp: timestamp
     feedback_sentiment: enum (positive, neutral, negative)
     feedback_text: string (optional)
     blockchain_hash: string (optional, for immutability)
   }
   ```

5. **Governance Performance Index**
   - Technology: AWS Lambda + Amazon QuickSight for visualization
   - Real-time calculation of performance metrics
   - Public transparency dashboard (anonymized)
   - Ranking and recognition system

   **Performance Metrics**:
   ```
   PanchayatPerformance {
     panchayat_id: string
     period: {start_date, end_date}
     
     metrics: {
       delivery_success_rate: float (0-100)
       average_processing_time: integer (days)
       citizen_satisfaction_score: float (0-100)
       validation_rate: float (0-100)
       outreach_coverage: float (0-100)
       fraud_detection_accuracy: float (0-100)
     }
     
     performance_index: float (0-100, weighted average)
     rank: integer (within district/state)
     trend: enum (improving, stable, declining)
   }
   ```

**Requirements Addressed**: Req 10 (Explainability), Req 13 (Community Validation), Req 16 (Audit Trail), Req 18 (Data Security), Req 26 (Community Validation Loop), Req 27 (Trust Score)

### 4. Key Interaction Flows

#### 4.1 Citizen Interaction Flow (Direct Access)

```
┌─────────────┐
│   Citizen   │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────────────┐
│  Voice/Chat Interface (Amazon Lex)      │
│  "I want to know what benefits I can    │
│   get for my family"                    │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│  Profile Collection (Conversational)    │
│  - Name, Age, Location                  │
│  - Income, Household size               │
│  - Special circumstances                │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│  Eligibility Evaluation                 │
│  (Knowledge Graph Traversal)            │
│  - Match citizen attributes to schemes  │
│  - Detect conflicts                     │
│  - Calculate optimal bundle             │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│  Scheme Explanation (Amazon Bedrock)    │
│  "You qualify for 8 schemes:            │
│   1. Widow Pension - ₹1000/month        │
│   2. Child Education - ₹5000/year       │
│   ... (in simple language)"             │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│  Application Guidance                   │
│  - Document checklist                   │
│  - Nearest CSC/Panchayat location       │
│  - Estimated approval time              │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│  Status Updates (SNS Notifications)     │
│  - Application submitted                │
│  - Under review                         │
│  - Approved / Rejected                  │
│  - Benefit delivered                    │
└─────────────────────────────────────────┘
```

**Requirements Addressed**: Req 1 (Voice-First), Req 2 (Eligibility Engine), Req 7 (Optimal Bundle), Req 10 (Explainability)

#### 4.2 Illiterate Citizen Interaction Flow (Assisted)

```
┌──────────────────┐
│  Life Event /    │
│  Panchayat Alert │
└────────┬─────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│  Panchayat Official Opens Assisted Mode │
│  (React Web App on Tablet)              │
└────────┬────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│  Voice Conversation with Citizen        │
│  (Official holds device, citizen speaks)│
│  - Amazon Lex captures responses        │
│  - Local language support               │
└────────┬────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│  Eligibility Explained (Voice Output)   │
│  "Aap 5 yojanaon ke liye yogya hain..." │
│  (You qualify for 5 schemes...)         │
└────────┬────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│  Consent Captured (Voice Recording)     │
│  "Do you agree to share your data?"     │
│  Citizen: "Haan" (Yes)                  │
└────────┬────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│  Documents Captured (Camera)            │
│  - Income certificate                   │
│  - Aadhaar card                         │
│  - Other evidence                       │
└────────┬────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│  Applications Submitted                 │
│  - Offline queue if no internet         │
│  - Sync when connected                  │
│  - Receipt generated                    │
└─────────────────────────────────────────┘
```

**Requirements Addressed**: Req 1 (Voice-First), Req 5 (Assisted Registration), Req 11 (Offline-First), Req 14 (Multi-Language)

#### 4.3 Panchayat Outreach Flow

```
┌─────────────────────────────────────────┐
│  Eligibility Engine (Background Job)    │
│  - Evaluates all citizens in Panchayat  │
│  - Identifies eligible non-beneficiaries│
│  - Calculates benefit values            │
└────────┬────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│  Panchayat Dashboard Alert              │
│  "47 households eligible but not        │
│   enrolled - Total potential: ₹42 lakh" │
└────────┬────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│  Priority Classification                │
│  1. Elderly couple - ₹95,000/year       │
│  2. Widow with children - ₹72,000/year  │
│  3. Disabled person - ₹48,000/year      │
│  ... (sorted by vulnerability + value)  │
└────────┬────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│  Field Visit Planning                   │
│  - Contact information                  │
│  - Location on map (Amazon Location)    │
│  - Outreach script in local language    │
│  - Document checklist                   │
└────────┬────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│  Assisted Enrollments (Field Worker)    │
│  - Voice-based data collection          │
│  - Document capture                     │
│  - Offline operation                    │
└────────┬────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│  Status Monitoring                      │
│  - Track outreach attempts              │
│  - Monitor enrollment success           │
│  - Update performance metrics           │
└─────────────────────────────────────────┘
```

**Requirements Addressed**: Req 3 (Life-Event Triggers), Req 4 (Panchayat Dashboard), Req 5 (Assisted Registration), Req 29 (Invisible Citizen Detection)



#### 4.4 Life-Event Triggered Flow

```
┌─────────────────────────────────────────┐
│  Life Event Detected                    │
│  (Birth/Death/Disability/Migration)     │
│  Source: Government registry / Citizen  │
└────────┬────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│  Eligibility Re-evaluation              │
│  - Load citizen profile from graph      │
│  - Query schemes triggered by event     │
│  - Evaluate new eligibility             │
│  - Update Welfare Digital Twin          │
└────────┬────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│  New Schemes Identified                 │
│  Event: Birth                           │
│  New Eligibility:                       │
│  - Maternity benefit                    │
│  - Child nutrition scheme               │
│  - Immunization support                 │
└────────┬────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│  Panchayat & Citizen Notified           │
│  Panchayat: "New birth - 3 schemes"     │
│  Citizen: "Congratulations! You qualify │
│            for maternity benefits"      │
└────────┬────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│  Assisted or Direct Enrollment          │
│  - Panchayat outreach (assisted)        │
│  - OR citizen self-service (direct)     │
│  - Application guidance provided        │
└─────────────────────────────────────────┘
```

**Requirements Addressed**: Req 3 (Life-Event Triggers), Req 9 (Welfare Twin), Req 21 (Digital Twin)

#### 4.5 Fraud & Misuse Prevention Flow

```
┌─────────────────────────────────────────┐
│  Application Attempt                    │
│  Citizen applies for scheme             │
└────────┬────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│  Evidence Consistency Check             │
│  - Verify all documents present         │
│  - Check expiry dates                   │
│  - Validate issuing authorities         │
└────────┬────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│  Cross-Scheme Validation                │
│  - Query all enrolled schemes           │
│  - Check for data inconsistencies       │
│  - Detect duplicate benefits            │
│  - Verify purpose-lock compliance       │
└────────┬────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│  Risk Score Computed                    │
│  Fraud_Score = 45                       │
│  Risk_Level = MEDIUM                    │
│  Factors:                               │
│  - Income inconsistency across schemes  │
│  - Vehicle ownership vs BPL claim       │
└────────┬────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│  Action Based on Risk Level             │
│                                         │
│  LOW (0-30):                            │
│  → Auto-approve with audit trail        │
│                                         │
│  MEDIUM (31-60):                        │
│  → Human review with explainability     │
│  → Field verification if needed         │
│                                         │
│  HIGH (61-100):                         │
│  → Detailed investigation               │
│  → Field verification required          │
│  → Escalate to district level           │
└─────────────────────────────────────────┘
```

**Requirements Addressed**: Req 8 (Fraud Prevention), Req 10 (Explainability)

#### 4.6 Migrant Welfare Portability Flow

```
┌─────────────────────────────────────────┐
│  Location Change Detected               │
│  Source: Amazon Location Service        │
│  Citizen moved: Bihar → Delhi           │
└────────┬────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│  Home State Benefits Reviewed           │
│  Current enrollments:                   │
│  - PDS Ration Card (Bihar)              │
│  - Health Insurance (Bihar)             │
│  - Child Education Support              │
└────────┬────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│  Host State Equivalents Mapped          │
│  Inter-State Benefit Bridge:            │
│  Bihar PDS → Delhi PDS                  │
│  Bihar Health → Ayushman Bharat         │
│  Education → Portable (no change)       │
└────────┬────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│  Portable Schemes Enabled               │
│  - Initiate transfer requests           │
│  - Notify Delhi Panchayat               │
│  - Provide document checklist           │
│  - Track transfer status                │
└────────┬────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│  Family Benefits Continue               │
│  - Unified profile across states        │
│  - Migrant dashboard shows both states  │
│  - Automatic restoration on return      │
└─────────────────────────────────────────┘
```

**Requirements Addressed**: Req 12 (Migrant Support), Req 25 (Benefit Portability)

#### 4.7 Offline-First Interaction Flow

```
┌─────────────────────────────────────────┐
│  No Internet Connectivity               │
│  Field worker in remote tribal area     │
└────────┬────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│  Data Stored Locally                    │
│  - Citizen profile in local storage     │
│  - Documents captured via camera        │
│  - Voice consent recorded               │
│  - Eligibility checked against cache    │
└────────┬────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│  Assisted Enrollment (Offline)          │
│  - 200 common schemes cached            │
│  - Basic eligibility rules available    │
│  - Receipt generated with temp ID       │
│  - Queued in SyncQueue table            │
└────────┬────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│  Connectivity Restored                  │
│  Field worker reaches 4G zone           │
│  OR returns to Panchayat office         │
└────────┬────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│  Secure Cloud Sync                      │
│  - Upload queued registrations          │
│  - Upload documents to S3               │
│  - Full eligibility re-evaluation       │
│  - Conflict resolution if needed        │
│  - Permanent application ID assigned    │
│  - Citizen notified of confirmation     │
└─────────────────────────────────────────┘
```

**Requirements Addressed**: Req 11 (Offline-First), Req 24 (Mesh Networking)

### 5. End-to-End System Flow (Summary)

```
Event/Interaction
       ↓
Eligibility Intelligence (Knowledge Graph + ML)
       ↓
Conflict & Risk Analysis (Optimization + Fraud Detection)
       ↓
Proactive Outreach (Panchayat Alerts + Citizen Notifications)
       ↓
Assisted/Direct Enrollment (Voice-First + Offline-Capable)
       ↓
Benefit Delivery (Integration with PFMS)
       ↓
Community Validation & Governance Feedback (Validation Tokens + Performance Index)
```

## Technology Stack & System Components

### 10. Technology Stack Overview

Sarathi uses a serverless, cloud-native architecture built entirely on AWS services, organized into four layers:

1. **Interaction Layer**: User interfaces and conversational AI
2. **Intelligence Layer**: Core business logic and ML models
3. **Data Layer**: Storage and retrieval systems
4. **Integration & Notification Layer**: External systems and messaging

### 10.1 Interaction Layer

| Technology | Purpose | Key Features |
|------------|---------|--------------|
| **Amazon Lex** | Conversational AI (text + voice) | - Multi-language support (22 Indian languages)<br>- Intent recognition and slot filling<br>- Profile collection through conversation<br>- Integration with Lambda for business logic<br>- 90% transcription accuracy target |
| **Amazon Polly** | Text-to-speech synthesis | - Natural-sounding voices in Indian languages<br>- SSML support for pronunciation<br>- Neural TTS for better quality |
| **Amazon Transcribe** | Speech-to-text conversion | - Real-time transcription<br>- Custom vocabulary for Indian names/terms<br>- Dialect recognition |
| **Amazon Connect** | IVR / Voice Gateway | - Phone-based access for basic phones<br>- DTMF navigation<br>- Missed-call interaction<br>- Call recording for consent |
| **React** | Web & Mobile UI | - Panchayat Dashboard<br>- Assisted registration interface<br>- Progressive Web App (PWA)<br>- Offline-first with service workers |
| **Amazon S3 + CloudFront** | Static hosting & CDN | - Fast global access<br>- HTTPS by default<br>- Edge caching for low latency |

**Requirements Addressed**: Req 1, 5, 14, 15

### 10.2 Intelligence Layer (Core Brain)

| Technology | Purpose | Key Features |
|------------|---------|--------------|
| **Amazon Neptune** | Knowledge Graph Database | - Graph data model for schemes, citizens, rules<br>- Gremlin query language<br>- ACID transactions<br>- Fast graph traversal for eligibility<br>- Handles complex relationships and conflicts |
| **AWS Lambda** | Serverless compute | - Eligibility matching logic<br>- Conflict resolution algorithms<br>- Fraud detection scoring<br>- Welfare twin predictions<br>- Auto-scaling to 10,000+ concurrent<br>- Pay-per-use pricing |
| **Amazon Bedrock** | Natural language AI | - Claude/Titan models for explanations<br>- Convert technical decisions to simple language<br>- Multi-language support<br>- Reasoning and summarization |
| **Amazon SageMaker** | ML model training & hosting | - Fraud detection models<br>- Life-event prediction models<br>- Lifestyle-income anomaly detection<br>- Continuous learning from feedback |
| **Amazon Comprehend** | NLP & entity extraction | - Document understanding<br>- Sentiment analysis for feedback<br>- Entity extraction from forms<br>- Language detection |

**Requirements Addressed**: Req 2, 6, 7, 8, 9, 10, 21, 22

### 10.3 Data Layer

| Technology | Purpose | Key Features |
|------------|---------|--------------|
| **Amazon DynamoDB** | NoSQL database | - Fast key-value access (single-digit ms)<br>- Citizen profiles<br>- Panchayat records<br>- Application status<br>- Consent logs<br>- Auto-scaling<br>- Point-in-time recovery |
| **Amazon S3** | Object storage | - Scheme PDFs and documents<br>- Application forms<br>- Uploaded evidence documents<br>- Audio consent recordings<br>- Lifecycle policies for retention<br>- Versioning for compliance |
| **Amazon ElastiCache** | In-memory caching | - Cache common eligibility queries<br>- Session management<br>- Reduce Neptune load<br>- Sub-millisecond latency |

**Requirements Addressed**: Req 2, 16, 18, 19

### 10.4 Location & Outreach Layer

| Technology | Purpose | Key Features |
|------------|---------|--------------|
| **Amazon Location Service** | Geospatial services | - Find nearest CSCs/Panchayats<br>- Migrant detection via location tracking<br>- Route planning for field workers<br>- Geocoding addresses<br>- Privacy-preserving location tracking |

**Requirements Addressed**: Req 12, 25

### 10.5 Notification & Engagement Layer

| Technology | Purpose | Key Features |
|------------|---------|--------------|
| **Amazon SNS** | Messaging & alerts | - Panchayat notifications<br>- Citizen reminders<br>- Life-event alerts<br>- Multi-channel (SMS, email, mobile push)<br>- Topic-based pub/sub |
| **Amazon SES** | Email delivery | - Transactional emails<br>- Application confirmations<br>- Reports to administrators |
| **WhatsApp Business API** | WhatsApp messaging | - Status updates<br>- Application confirmations<br>- Voice note interactions<br>- Rich media support |
| **SMS Gateway** | SMS delivery | - Fallback for WhatsApp<br>- Missed call numbers<br>- Validation requests<br>- Multi-language support |

**Requirements Addressed**: Req 3, 4, 13, 26, 28

### 10.6 Offline-First & Edge Support

| Technology | Purpose | Key Features |
|------------|---------|--------------|
| **Local Storage API** | Browser-based offline storage | - Cache citizen data<br>- Queue operations<br>- Store documents temporarily<br>- 5-10 MB capacity |
| **IndexedDB** | Structured offline storage | - Store scheme definitions<br>- Cache eligibility rules<br>- Larger capacity (50+ MB)<br>- Transactional |
| **Service Workers** | Offline PWA functionality | - Cache static assets<br>- Background sync<br>- Push notifications<br>- Offline-first architecture |
| **AWS IoT Greengrass** | Edge computing | - Run Lambda functions locally<br>- Offline eligibility checks<br>- Secure local processing<br>- Automatic sync when connected |

**Requirements Addressed**: Req 11, 24

### 10.7 Privacy, Security & Ethics Layer

| Technology | Purpose | Key Features |
|------------|---------|--------------|
| **AWS KMS** | Key management | - Encryption key management<br>- Automatic key rotation<br>- Audit logging of key usage |
| **AWS IAM** | Identity & access management | - Role-based access control<br>- Least privilege principle<br>- Multi-factor authentication<br>- Temporary credentials |
| **AWS CloudTrail** | API audit logging | - Track all API calls<br>- Compliance reporting<br>- Security analysis |
| **AWS CloudWatch** | Monitoring & logging | - Application logs<br>- Performance metrics<br>- Alerting<br>- Dashboards |
| **Custom ZKP Library** | Zero-knowledge proofs | - Privacy-preserving verification<br>- Cryptographic commitments<br>- Threshold verification<br>- Based on established crypto libraries |

**Requirements Addressed**: Req 10, 16, 18, 23



### 10.8 Technology Stack Mapping to Features

| Feature | Primary Technologies | Supporting Technologies |
|---------|---------------------|------------------------|
| Voice-First Interface | Amazon Lex, Polly, Transcribe | Lambda, API Gateway |
| Knowledge Graph Eligibility | Amazon Neptune | Lambda, ElastiCache |
| Conflict Resolution | Lambda (optimization libs) | Neptune, DynamoDB |
| Fraud Detection | SageMaker, Lambda | Neptune, DynamoDB |
| Welfare Digital Twin | SageMaker, Lambda | Neptune, DynamoDB |
| Explainability | Amazon Bedrock | Lambda, Comprehend |
| Panchayat Dashboard | React, CloudFront | API Gateway, Lambda |
| Assisted Registration | React, Lex | Lambda, S3, DynamoDB |
| Offline Operation | Service Workers, IndexedDB | IoT Greengrass, Lambda |
| Migrant Portability | Location Service | Neptune, Lambda, SNS |
| Community Validation | Lambda, DynamoDB | SNS, Managed Blockchain |
| Zero-Knowledge Proofs | Custom crypto library | Lambda, KMS |
| Audit Trail | DynamoDB, S3 | CloudTrail, CloudWatch |
| Multi-Language | Lex, Polly, Bedrock | Comprehend, Lambda |
| Notifications | SNS, SES | WhatsApp API, SMS Gateway |

### 10.9 Why This Tech Stack Works for a Hackathon

**Fast to Prototype**:
- Serverless = no infrastructure management
- Managed services = focus on business logic
- Pre-built AI services = no model training from scratch
- Quick integration with AWS SDKs

**Scales Automatically**:
- Lambda scales to 10,000+ concurrent
- DynamoDB auto-scales with traffic
- Neptune handles 100M+ nodes
- No capacity planning needed

**Minimal DevOps**:
- No servers to patch or maintain
- Automatic backups and recovery
- Built-in monitoring and logging
- Pay-per-use pricing (cost-effective for demo)

**Real-World Deployable**:
- Production-grade services
- Enterprise security and compliance
- 99.9% uptime SLAs
- Can scale from hackathon to national deployment

**AWS Ecosystem Aligned**:
- All services integrate seamlessly
- Single cloud provider = simpler architecture
- Unified IAM and security model
- Comprehensive documentation and support

## Components and Interfaces

### API Architecture

Sarathi uses a RESTful API architecture with GraphQL for complex queries.

#### API Gateway Configuration

```
API Gateway (REST API)
├── /citizens
│   ├── POST /register
│   ├── GET /{citizenId}
│   ├── PUT /{citizenId}
│   ├── GET /{citizenId}/eligibility
│   └── GET /{citizenId}/welfare-twin
├── /schemes
│   ├── GET /
│   ├── GET /{schemeId}
│   ├── POST / (admin only)
│   └── PUT /{schemeId} (admin only)
├── /applications
│   ├── POST /
│   ├── GET /{applicationId}
│   ├── GET /citizen/{citizenId}
│   └── PUT /{applicationId}/status
├── /panchayat
│   ├── GET /{panchayatId}/dashboard
│   ├── GET /{panchayatId}/alerts
│   ├── GET /{panchayatId}/performance
│   └── POST /{panchayatId}/outreach
├── /validation
│   ├── POST /confirm
│   └── GET /{applicationId}/status
└── /sync
    ├── POST /queue
    └── GET /status/{deviceId}
```

### API Contracts

#### 1. Citizen Registration API

**Endpoint**: `POST /citizens/register`

**Request**:
```json
{
  "name": "string",
  "phone": "string",
  "aadhaar": "string (encrypted)",
  "age": "integer",
  "gender": "enum (male, female, other)",
  "location": {
    "state": "string",
    "district": "string",
    "panchayat": "string",
    "pincode": "string"
  },
  "household": {
    "household_id": "string (optional)",
    "head_of_household": "boolean",
    "member_count": "integer",
    "total_income": "integer"
  },
  "attributes": {
    "caste": "enum (general, obc, sc, st)",
    "disability_status": "boolean",
    "disability_type": "string (optional)",
    "bpl_status": "boolean",
    "occupation": "string"
  },
  "consent": {
    "data_collection": "boolean",
    "data_sharing": "boolean",
    "zkp_verification": "boolean"
  },
  "preferred_language": "string",
  "registered_by": {
    "type": "enum (self, panchayat_official, field_worker)",
    "official_id": "string (if assisted)"
  }
}
```

**Response**:
```json
{
  "citizen_id": "string (UUID)",
  "status": "success",
  "message": "Registration successful",
  "next_steps": [
    "Upload income certificate",
    "Visit Panchayat for verification"
  ],
  "eligible_schemes_count": "integer",
  "estimated_benefit_value": "integer"
}
```

#### 2. Eligibility Check API

**Endpoint**: `GET /citizens/{citizenId}/eligibility`

**Query Parameters**:
- `include_conflicts`: boolean (default: true)
- `include_explanations`: boolean (default: true)
- `language`: string (default: citizen's preferred language)

**Response**:
```json
{
  "citizen_id": "string",
  "evaluation_timestamp": "ISO 8601 timestamp",
  "eligible_schemes": [
    {
      "scheme_id": "string",
      "scheme_name": "string",
      "category": "string",
      "benefit_value": "integer",
      "benefit_type": "enum (one-time, recurring, in-kind)",
      "confidence": "float (0-1)",
      "eligibility_status": "enum (eligible, ineligible, needs_verification)",
      "explanation": {
        "summary": "string",
        "criteria_matched": ["string"],
        "criteria_unmatched": ["string"],
        "missing_documents": ["string"]
      },
      "trust_score": {
        "approval_probability": "float (0-1)",
        "estimated_processing_days": "integer",
        "community_success_rate": "float (0-1)"
      },
      "deadline": "ISO 8601 date (optional)",
      "conflicts_with": ["scheme_id"]
    }
  ],
  "optimal_bundles": [
    {
      "bundle_id": "string",
      "schemes": ["scheme_id"],
      "total_value": "integer",
      "coverage_breadth": "integer",
      "application_effort": "enum (low, medium, high)",
      "combined_probability": "float (0-1)",
      "explanation": "string"
    }
  ],
  "conflicts_detected": [
    {
      "scheme_a": "scheme_id",
      "scheme_b": "scheme_id",
      "conflict_type": "enum (mutual_exclusion, purpose_lock, quota_limit)",
      "explanation": "string"
    }
  ]
}
```

#### 3. Welfare Digital Twin API

**Endpoint**: `GET /citizens/{citizenId}/welfare-twin`

**Query Parameters**:
- `years`: integer (default: 5, max: 10)
- `include_pathways`: boolean (default: true)

**Response**:
```json
{
  "citizen_id": "string",
  "generated_at": "ISO 8601 timestamp",
  "simulation_years": "integer",
  "timeline": [
    {
      "year": "integer",
      "predicted_events": [
        {
          "event_type": "enum (education_milestone, retirement, health_change, etc.)",
          "event_description": "string",
          "confidence": "float (0-1)",
          "month": "integer (1-12, optional)"
        }
      ],
      "triggered_schemes": [
        {
          "scheme_id": "string",
          "scheme_name": "string",
          "benefit_value": "integer",
          "eligibility_confidence": "float (0-1)",
          "preparation_steps": [
            {
              "step": "string",
              "deadline": "ISO 8601 date",
              "documents_needed": ["string"]
            }
          ]
        }
      ]
    }
  ],
  "poverty_exit_pathways": [
    {
      "pathway_id": "string",
      "pathway_name": "string",
      "description": "string",
      "scheme_sequence": [
        {
          "year": "integer",
          "scheme_id": "string",
          "scheme_name": "string",
          "expected_impact": "string"
        }
      ],
      "projected_income_increase": "integer",
      "success_probability": "float (0-1)"
    }
  ],
  "total_potential_value": "integer",
  "recommendations": ["string"]
}
```

#### 4. Application Submission API

**Endpoint**: `POST /applications`

**Request**:
```json
{
  "citizen_id": "string",
  "scheme_id": "string",
  "documents": [
    {
      "document_type": "string",
      "document_url": "string (S3 URL)",
      "uploaded_at": "ISO 8601 timestamp"
    }
  ],
  "submitted_by": {
    "type": "enum (self, panchayat_official, field_worker)",
    "official_id": "string (if assisted)"
  },
  "offline_submission": "boolean",
  "device_id": "string (for offline tracking)"
}
```

**Response**:
```json
{
  "application_id": "string (UUID)",
  "status": "enum (submitted, queued, under_review)",
  "submitted_at": "ISO 8601 timestamp",
  "fraud_score": "integer (0-100)",
  "risk_level": "enum (low, medium, high)",
  "estimated_processing_days": "integer",
  "next_steps": ["string"],
  "receipt_url": "string (PDF receipt)"
}
```

#### 5. Panchayat Dashboard API

**Endpoint**: `GET /panchayat/{panchayatId}/dashboard`

**Response**:
```json
{
  "panchayat_id": "string",
  "panchayat_name": "string",
  "generated_at": "ISO 8601 timestamp",
  "summary": {
    "total_households": "integer",
    "enrolled_households": "integer",
    "invisible_citizens": "integer",
    "pending_applications": "integer",
    "total_benefits_secured": "integer (rupees)"
  },
  "alerts": [
    {
      "alert_id": "string",
      "alert_type": "enum (newly_eligible, life_event, deadline, invisible_citizen)",
      "priority": "enum (high, medium, low)",
      "citizen_id": "string",
      "citizen_name": "string",
      "details": "string",
      "eligible_schemes": ["scheme_id"],
      "potential_benefit_value": "integer",
      "action_required": "string",
      "deadline": "ISO 8601 date (optional)"
    }
  ],
  "life_events": [
    {
      "event_id": "string",
      "event_type": "string",
      "citizen_id": "string",
      "citizen_name": "string",
      "event_date": "ISO 8601 date",
      "triggered_schemes": ["scheme_id"],
      "outreach_status": "enum (pending, contacted, enrolled)"
    }
  ],
  "performance": {
    "delivery_success_rate": "float (0-100)",
    "average_processing_days": "integer",
    "citizen_satisfaction": "float (0-100)",
    "validation_rate": "float (0-100)",
    "performance_index": "float (0-100)",
    "district_rank": "integer",
    "state_rank": "integer"
  }
}
```

#### 6. Fraud Review API

**Endpoint**: `GET /applications/{applicationId}/fraud-analysis`

**Response**:
```json
{
  "application_id": "string",
  "citizen_id": "string",
  "scheme_id": "string",
  "fraud_score": "integer (0-100)",
  "risk_level": "enum (low, medium, high)",
  "contributing_factors": [
    {
      "factor": "string",
      "weight": "integer",
      "description": "string",
      "evidence": "string"
    }
  ],
  "cross_scheme_analysis": {
    "enrolled_schemes": ["scheme_id"],
    "inconsistencies": [
      {
        "field": "string",
        "value_in_scheme_a": "any",
        "value_in_scheme_b": "any",
        "explanation": "string"
      }
    ]
  },
  "lifestyle_income_analysis": {
    "declared_income": "integer",
    "lifestyle_indicators": [
      {
        "indicator": "string",
        "value": "string",
        "expected_income_range": "string"
      }
    ],
    "anomaly_score": "integer (0-100)"
  },
  "recommendation": "enum (approve, verify, investigate, reject)",
  "explainability_report": {
    "summary": "string",
    "detailed_reasoning": "string",
    "suggested_actions": ["string"]
  }
}
```

#### 7. Offline Sync API

**Endpoint**: `POST /sync/queue`

**Request**:
```json
{
  "device_id": "string",
  "operations": [
    {
      "operation_id": "string (UUID)",
      "operation_type": "enum (registration, application, document_upload, update)",
      "timestamp": "ISO 8601 timestamp",
      "payload": "object (operation-specific data)",
      "priority": "enum (high, medium, low)"
    }
  ]
}
```

**Response**:
```json
{
  "sync_id": "string",
  "status": "enum (processing, completed, partial_failure)",
  "processed_operations": "integer",
  "failed_operations": "integer",
  "results": [
    {
      "operation_id": "string",
      "status": "enum (success, failure)",
      "permanent_id": "string (if applicable)",
      "error": "string (if failed)"
    }
  ]
}
```

### Lambda Function Interfaces

#### 1. EligibilityEvaluator Lambda

**Input Event**:
```json
{
  "citizen_id": "string",
  "scheme_id": "string (optional, if checking specific scheme)",
  "include_conflicts": "boolean",
  "include_explanations": "boolean",
  "language": "string"
}
```

**Output**:
```json
{
  "statusCode": 200,
  "body": {
    // Same as Eligibility Check API response
  }
}
```

**Environment Variables**:
- `NEPTUNE_ENDPOINT`: Neptune cluster endpoint
- `DYNAMODB_TABLE_CITIZENS`: DynamoDB table name
- `BEDROCK_MODEL_ID`: Amazon Bedrock model identifier
- `CACHE_TTL`: ElastiCache TTL in seconds



#### 2. ConflictResolver Lambda

**Input Event**:
```json
{
  "citizen_id": "string",
  "eligible_schemes": ["scheme_id"],
  "optimization_criteria": {
    "value_weight": "float (0-1, default 0.5)",
    "coverage_weight": "float (0-1, default 0.3)",
    "probability_weight": "float (0-1, default 0.2)"
  },
  "max_bundles": "integer (default 3)"
}
```

**Output**:
```json
{
  "statusCode": 200,
  "body": {
    "bundles": [/* optimal bundle objects */],
    "conflicts": [/* conflict objects */]
  }
}
```

#### 3. FraudDetector Lambda

**Input Event**:
```json
{
  "application_id": "string",
  "citizen_id": "string",
  "scheme_id": "string",
  "application_data": "object"
}
```

**Output**:
```json
{
  "statusCode": 200,
  "body": {
    "fraud_score": "integer",
    "risk_level": "string",
    "factors": ["string"],
    "recommendation": "string",
    "explainability_report": "object"
  }
}
```

#### 4. WelfareTwinGenerator Lambda

**Input Event**:
```json
{
  "citizen_id": "string",
  "years": "integer",
  "include_pathways": "boolean"
}
```

**Output**:
```json
{
  "statusCode": 200,
  "body": {
    // Same as Welfare Digital Twin API response
  }
}
```

#### 5. LifeEventProcessor Lambda

**Input Event** (from EventBridge):
```json
{
  "event_type": "enum (birth, death, disability, migration, etc.)",
  "event_date": "ISO 8601 date",
  "citizen_id": "string",
  "household_id": "string",
  "event_details": "object",
  "source": "string (government_registry, citizen_report, etc.)"
}
```

**Output**:
```json
{
  "statusCode": 200,
  "body": {
    "event_id": "string",
    "triggered_schemes": ["scheme_id"],
    "alerts_generated": {
      "panchayat_alerts": "integer",
      "citizen_notifications": "integer"
    },
    "welfare_twin_updated": "boolean"
  }
}
```

## Data Models

### Knowledge Graph Schema (Amazon Neptune)

#### Vertex Labels and Properties

**Citizen Vertex**:
```
Label: Citizen
Properties:
  - id: String (primary key, Aadhaar or unique ID)
  - name: String
  - age: Integer
  - date_of_birth: Date
  - gender: String (male, female, other)
  - phone: String
  - state: String
  - district: String
  - panchayat: String
  - pincode: String
  - household_id: String
  - income: Integer
  - caste: String (general, obc, sc, st)
  - disability_status: Boolean
  - disability_type: String (optional)
  - bpl_status: Boolean
  - occupation: String
  - preferred_language: String
  - consent_data_collection: Boolean
  - consent_data_sharing: Boolean
  - consent_zkp: Boolean
  - created_at: Timestamp
  - updated_at: Timestamp
```

**Scheme Vertex**:
```
Label: Scheme
Properties:
  - id: String (primary key)
  - name: String
  - name_translations: Map<String, String> (language -> translated name)
  - description: String
  - description_translations: Map<String, String>
  - state: String (or "CENTRAL" for national schemes)
  - category: String (pension, education, health, housing, etc.)
  - benefit_value: Integer
  - benefit_type: String (one-time, recurring, in-kind)
  - benefit_frequency: String (monthly, yearly, one-time)
  - enrollment_window_start: Date (optional)
  - enrollment_window_end: Date (optional)
  - age_min: Integer (optional)
  - age_max: Integer (optional)
  - purpose: String (for purpose-lock enforcement)
  - quota_limit: Integer (optional)
  - quota_filled: Integer (optional)
  - active: Boolean
  - version: Integer
  - created_at: Timestamp
  - updated_at: Timestamp
```

**EligibilityCriterion Vertex**:
```
Label: EligibilityCriterion
Properties:
  - id: String (primary key)
  - criterion_type: String (income, age, caste, disability, gender, location, etc.)
  - operator: String (less_than, greater_than, equals, in_range, in_list, not_equals)
  - threshold_value: String (JSON-encoded for complex values)
  - required: Boolean
  - weight: Float (for weighted eligibility scoring)
  - description: String
  - description_translations: Map<String, String>
```

**Evidence Vertex**:
```
Label: Evidence
Properties:
  - id: String (primary key)
  - evidence_type: String (income_cert, caste_cert, disability_cert, aadhaar, etc.)
  - issuing_authority: String
  - issue_date: Date
  - expiry_date: Date (optional)
  - verification_status: String (pending, verified, expired, rejected)
  - document_url: String (S3 path)
  - verified_by: String (official_id, optional)
  - verified_at: Timestamp (optional)
```

**LifeEvent Vertex**:
```
Label: LifeEvent
Properties:
  - id: String (primary key)
  - event_type: String (birth, death, marriage, disability, migration, education_milestone, etc.)
  - event_date: Date
  - verified: Boolean
  - source: String (government_registry, citizen_report, panchayat_report)
  - details: String (JSON-encoded event-specific data)
  - created_at: Timestamp
```

**Household Vertex**:
```
Label: Household
Properties:
  - id: String (primary key)
  - head_of_household_id: String (citizen_id)
  - state: String
  - district: String
  - panchayat: String
  - total_income: Integer
  - member_count: Integer
  - bpl_status: Boolean
  - created_at: Timestamp
  - updated_at: Timestamp
```

**Conflict Vertex**:
```
Label: Conflict
Properties:
  - id: String (primary key)
  - conflict_type: String (mutual_exclusion, purpose_lock, quota_limit)
  - reason: String
  - description: String
  - created_at: Timestamp
```

#### Edge Labels and Properties

**HAS_ATTRIBUTE Edge**:
```
Label: HAS_ATTRIBUTE
From: Citizen
To: Attribute (generic vertex for various attributes)
Properties:
  - attribute_type: String
  - attribute_value: String
  - verified: Boolean
  - updated_at: Timestamp
```

**MEMBER_OF Edge**:
```
Label: MEMBER_OF
From: Citizen
To: Household
Properties:
  - relationship: String (head, spouse, child, parent, other)
  - since: Date
```

**ENROLLED_IN Edge**:
```
Label: ENROLLED_IN
From: Citizen
To: Scheme
Properties:
  - enrollment_date: Date
  - application_id: String
  - status: String (active, paused, completed, cancelled)
  - benefit_start_date: Date
  - benefit_end_date: Date (optional)
```

**APPLIED_FOR Edge**:
```
Label: APPLIED_FOR
From: Citizen
To: Scheme
Properties:
  - application_id: String
  - application_date: Date
  - status: String (pending, approved, rejected, delivered)
  - fraud_score: Integer
  - risk_level: String
```

**HAS_EVIDENCE Edge**:
```
Label: HAS_EVIDENCE
From: Citizen
To: Evidence
Properties:
  - purpose: String (for which scheme/criterion)
  - attached_at: Timestamp
```

**EXPERIENCED Edge**:
```
Label: EXPERIENCED
From: Citizen
To: LifeEvent
Properties:
  - role: String (subject, affected_family_member)
```

**REQUIRES Edge**:
```
Label: REQUIRES
From: Scheme
To: EligibilityCriterion
Properties:
  - priority: Integer (for evaluation order)
  - mandatory: Boolean
```

**CONFLICTS_WITH Edge**:
```
Label: CONFLICTS_WITH
From: Scheme
To: Scheme
Properties:
  - conflict_id: String (references Conflict vertex)
  - conflict_type: String
  - bidirectional: Boolean (true for mutual exclusion)
```

**TRIGGERED_BY Edge**:
```
Label: TRIGGERED_BY
From: Scheme
To: LifeEvent (actually to event type, modeled as vertex)
Properties:
  - relevance_score: Float
  - auto_notify: Boolean
```

**REQUIRES_EVIDENCE Edge**:
```
Label: REQUIRES_EVIDENCE
From: Scheme
To: EvidenceType (vertex representing evidence types)
Properties:
  - mandatory: Boolean
  - alternatives: List<String> (alternative evidence types)
```

**VERIFIED_BY Edge**:
```
Label: VERIFIED_BY
From: EligibilityCriterion
To: Evidence
Properties:
  - verification_date: Timestamp
  - verified_by: String (official_id)
```

### DynamoDB Table Schemas

#### CitizenProfiles Table

```
Table Name: CitizenProfiles
Partition Key: citizen_id (String)
Sort Key: None

Attributes:
  - citizen_id: String
  - name: String
  - phone: String
  - aadhaar_encrypted: String
  - age: Number
  - gender: String
  - location: Map {
      state: String,
      district: String,
      panchayat: String,
      pincode: String
    }
  - household_id: String
  - preferred_language: String
  - consent_status: Boolean
  - consent_details: Map {
      data_collection: Boolean,
      data_sharing: Boolean,
      zkp_verification: Boolean,
      timestamp: String
    }
  - last_interaction: String (ISO 8601)
  - created_at: String (ISO 8601)
  - updated_at: String (ISO 8601)

Global Secondary Indexes:
  - PhoneIndex: phone (Partition Key)
  - HouseholdIndex: household_id (Partition Key)
  - PanchayatIndex: location.panchayat (Partition Key), created_at (Sort Key)
```

#### Applications Table

```
Table Name: Applications
Partition Key: application_id (String)
Sort Key: None

Attributes:
  - application_id: String
  - citizen_id: String
  - scheme_id: String
  - status: String (pending, under_review, approved, rejected, delivered)
  - submitted_at: String (ISO 8601)
  - processed_at: String (ISO 8601, optional)
  - fraud_score: Number
  - risk_level: String (low, medium, high)
  - reviewer_id: String (optional)
  - review_notes: String (optional)
  - documents: List<Map> {
      document_type: String,
      document_url: String,
      uploaded_at: String
    }
  - offline_submission: Boolean
  - device_id: String (optional)
  - created_at: String (ISO 8601)
  - updated_at: String (ISO 8601)

Global Secondary Indexes:
  - CitizenIndex: citizen_id (Partition Key), submitted_at (Sort Key)
  - SchemeIndex: scheme_id (Partition Key), submitted_at (Sort Key)
  - StatusIndex: status (Partition Key), submitted_at (Sort Key)
```

#### PanchayatActions Table

```
Table Name: PanchayatActions
Partition Key: panchayat_id (String)
Sort Key: timestamp#action_id (String)

Attributes:
  - panchayat_id: String
  - action_id: String
  - timestamp: String (ISO 8601)
  - action_type: String (outreach, registration, review, validation, document_verification)
  - official_id: String
  - citizen_id: String
  - details: Map (action-specific data)
  - outcome: String (optional)

Global Secondary Indexes:
  - OfficialIndex: official_id (Partition Key), timestamp (Sort Key)
  - CitizenIndex: citizen_id (Partition Key), timestamp (Sort Key)
```

#### ConsentLogs Table

```
Table Name: ConsentLogs
Partition Key: citizen_id (String)
Sort Key: timestamp#consent_id (String)

Attributes:
  - citizen_id: String
  - consent_id: String
  - timestamp: String (ISO 8601)
  - consent_type: String (data_collection, data_sharing, zkp_verification, benefit_portability, analytics)
  - granted: Boolean
  - purpose: String
  - expires_at: String (ISO 8601, optional)
  - withdrawn_at: String (ISO 8601, optional)
  - recorded_by: String (official_id or "self")
```

#### SyncQueue Table

```
Table Name: SyncQueue
Partition Key: device_id (String)
Sort Key: timestamp#operation_id (String)

Attributes:
  - device_id: String
  - operation_id: String
  - timestamp: String (ISO 8601)
  - operation_type: String (registration, application, document_upload, update)
  - payload: Map (operation-specific data)
  - status: String (pending, syncing, completed, failed)
  - retry_count: Number
  - last_retry_at: String (ISO 8601, optional)
  - error_message: String (optional)
  - created_at: String (ISO 8601)

TTL Attribute: ttl (Number, Unix timestamp, auto-delete after 30 days)

Global Secondary Indexes:
  - StatusIndex: status (Partition Key), timestamp (Sort Key)
```

#### ValidationTokens Table

```
Table Name: ValidationTokens
Partition Key: application_id (String)
Sort Key: None

Attributes:
  - application_id: String
  - citizen_id: String
  - scheme_id: String
  - panchayat_id: String
  - validation_method: String (missed_call, sms, voice_note, in_person)
  - validated: Boolean
  - validation_timestamp: String (ISO 8601, optional)
  - feedback_sentiment: String (positive, neutral, negative, optional)
  - feedback_text: String (optional)
  - feedback_audio_url: String (S3 URL, optional)
  - blockchain_hash: String (optional)
  - created_at: String (ISO 8601)

Global Secondary Indexes:
  - CitizenIndex: citizen_id (Partition Key), created_at (Sort Key)
  - PanchayatIndex: panchayat_id (Partition Key), validated (Sort Key)
  - SchemeIndex: scheme_id (Partition Key), validated (Sort Key)
```

#### AuditLogs Table

```
Table Name: AuditLogs
Partition Key: log_date (String, format: YYYY-MM-DD)
Sort Key: timestamp#log_id (String)

Attributes:
  - log_id: String (UUID)
  - log_date: String (YYYY-MM-DD, for partitioning)
  - timestamp: String (ISO 8601)
  - user_id: String
  - user_role: String (citizen, panchayat_official, field_worker, admin, system)
  - action_type: String (eligibility_check, registration, approval, data_access, etc.)
  - resource_type: String (citizen, scheme, application, etc.)
  - resource_id: String
  - action_details: Map
  - ip_address: String
  - device_id: String
  - previous_hash: String (hash of previous log entry)
  - current_hash: String (SHA-256 of this entry)

Global Secondary Indexes:
  - UserIndex: user_id (Partition Key), timestamp (Sort Key)
  - ResourceIndex: resource_id (Partition Key), timestamp (Sort Key)

Note: Older logs archived to S3 after 90 days, retained for 7 years
```

## Security and Privacy Design Patterns

### 1. Zero-Knowledge Proof Implementation

**Purpose**: Allow eligibility verification without exposing sensitive data (income, health status, caste).

**Architecture**:

```
┌─────────────────────────────────────────────────────────────┐
│  Citizen's Device (or Panchayat device with citizen present)│
│                                                              │
│  1. Citizen provides sensitive data (e.g., income = ₹50,000)│
│  2. ZKP Library generates proof:                            │
│     - Commitment: hash(income + random_nonce)               │
│     - Proof: cryptographic proof that income < ₹60,000      │
│     - Does NOT reveal actual income value                   │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│  Sarathi Backend (Lambda + KMS)                             │
│                                                              │
│  3. Receives: commitment + proof (NOT actual income)        │
│  4. Verifies proof using ZKP verification algorithm         │
│  5. Result: "Qualifies: YES" or "Qualifies: NO"             │
│  6. Stores: commitment (not actual value)                   │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│  Panchayat Official's View                                  │
│                                                              │
│  Sees: "Income Eligibility: ✓ Verified"                     │
│  Does NOT see: Actual income amount                         │
└─────────────────────────────────────────────────────────────┘
```

**Implementation Details**:

```python
# Pseudocode for ZKP Income Verification

class ZKPIncomeVerifier:
    def generate_proof(actual_income, threshold, nonce):
        """
        Generate zero-knowledge proof that income < threshold
        without revealing actual income
        """
        # Create commitment
        commitment = hash(actual_income + nonce)
        
        # Generate range proof (using bulletproofs or similar)
        proof = range_proof_generate(
            value=actual_income,
            lower_bound=0,
            upper_bound=threshold,
            commitment=commitment
        )
        
        return {
            "commitment": commitment,
            "proof": proof,
            "threshold": threshold
        }
    
    def verify_proof(commitment, proof, threshold):
        """
        Verify the proof without learning actual income
        """
        is_valid = range_proof_verify(
            commitment=commitment,
            proof=proof,
            lower_bound=0,
            upper_bound=threshold
        )
        
        return {
            "verified": is_valid,
            "qualifies": is_valid,  # If proof is valid, income < threshold
            "threshold": threshold
        }
```

**Supported Criteria for ZKP**:
- Income thresholds (income < X)
- Age ranges (age between X and Y)
- Disability status (has disability: yes/no)
- Land ownership (land < X acres)
- Caste category (belongs to category: yes/no)

**Libraries Used**:
- **libsodium**: For cryptographic primitives
- **bulletproofs**: For range proofs
- **AWS KMS**: For key management and secure operations

**Requirements Addressed**: Req 10 (Privacy), Req 18 (Data Security), Req 23 (Zero-Knowledge Proofs)



### 2. Encryption Strategy

**Data at Rest**:
- **DynamoDB**: Server-side encryption with AWS KMS
- **S3**: Server-side encryption (SSE-KMS) with customer-managed keys
- **Neptune**: Encryption at rest enabled
- **Aadhaar Data**: Additional application-level encryption before storage

**Data in Transit**:
- **All API calls**: TLS 1.3
- **Internal service communication**: VPC with private subnets
- **Mobile/Web to API Gateway**: HTTPS only

**Key Management**:
- **AWS KMS**: Customer-managed keys with automatic rotation
- **Separate keys** for different data types (PII, documents, audit logs)
- **Key policies**: Least privilege access

### 3. Access Control (IAM Roles)

**Role-Based Access Control**:

```
Roles:
  - Citizen: Read own data, submit applications, view eligibility
  - Panchayat_Official: Read citizens in jurisdiction, assisted registration, view dashboard
  - Field_Worker: Assisted registration, offline sync, limited data access
  - District_Admin: View all Panchayats in district, review fraud flags, performance reports
  - State_Admin: View all districts, scheme management, policy analytics
  - System_Admin: Full access, user management, system configuration
  - Auditor: Read-only access to audit logs, no PII access
```

**IAM Policy Example (Panchayat Official)**:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "dynamodb:GetItem",
        "dynamodb:Query"
      ],
      "Resource": "arn:aws:dynamodb:*:*:table/CitizenProfiles",
      "Condition": {
        "StringEquals": {
          "dynamodb:LeadingKeys": ["${aws:PrincipalTag/panchayat_id}"]
        }
      }
    },
    {
      "Effect": "Allow",
      "Action": [
        "lambda:InvokeFunction"
      ],
      "Resource": [
        "arn:aws:lambda:*:*:function:EligibilityEvaluator",
        "arn:aws:lambda:*:*:function:AssistedRegistration"
      ]
    },
    {
      "Effect": "Deny",
      "Action": [
        "dynamodb:DeleteItem",
        "dynamodb:UpdateItem"
      ],
      "Resource": "arn:aws:dynamodb:*:*:table/AuditLogs"
    }
  ]
}
```

### 4. Audit Trail Implementation

**Immutable Logging with Hash Chains**:

```python
# Pseudocode for tamper-evident audit logging

class AuditLogger:
    def __init__(self):
        self.previous_hash = self.get_last_hash()
    
    def log_action(self, user_id, action_type, resource_id, details):
        """
        Create immutable audit log entry with hash chain
        """
        log_entry = {
            "log_id": generate_uuid(),
            "timestamp": current_timestamp(),
            "user_id": user_id,
            "action_type": action_type,
            "resource_id": resource_id,
            "details": details,
            "previous_hash": self.previous_hash
        }
        
        # Calculate hash of current entry
        current_hash = sha256(json.dumps(log_entry, sort_keys=True))
        log_entry["current_hash"] = current_hash
        
        # Store in DynamoDB
        dynamodb.put_item(
            TableName="AuditLogs",
            Item=log_entry
        )
        
        # Update previous_hash for next entry
        self.previous_hash = current_hash
        
        return log_entry
    
    def verify_integrity(self, start_date, end_date):
        """
        Verify audit log integrity by checking hash chain
        """
        logs = dynamodb.query(
            TableName="AuditLogs",
            KeyConditionExpression="log_date BETWEEN :start AND :end"
        )
        
        previous_hash = None
        for log in logs:
            # Verify hash matches
            calculated_hash = sha256(json.dumps({
                k: v for k, v in log.items() if k != "current_hash"
            }, sort_keys=True))
            
            if calculated_hash != log["current_hash"]:
                return {"valid": False, "tampered_log": log["log_id"]}
            
            # Verify chain
            if previous_hash and log["previous_hash"] != previous_hash:
                return {"valid": False, "broken_chain_at": log["log_id"]}
            
            previous_hash = log["current_hash"]
        
        return {"valid": True}
```

### 5. Consent Management

**Granular Consent Tracking**:

```python
# Pseudocode for consent management

class ConsentManager:
    def request_consent(self, citizen_id, consent_type, purpose):
        """
        Request consent from citizen
        """
        # Generate consent request
        consent_request = {
            "consent_id": generate_uuid(),
            "citizen_id": citizen_id,
            "consent_type": consent_type,
            "purpose": purpose,
            "requested_at": current_timestamp()
        }
        
        # Send notification to citizen
        notify_citizen(citizen_id, consent_request)
        
        return consent_request
    
    def record_consent(self, citizen_id, consent_type, granted, purpose):
        """
        Record citizen's consent decision
        """
        consent_log = {
            "citizen_id": citizen_id,
            "consent_id": generate_uuid(),
            "timestamp": current_timestamp(),
            "consent_type": consent_type,
            "granted": granted,
            "purpose": purpose,
            "expires_at": calculate_expiry(consent_type)
        }
        
        # Store in DynamoDB
        dynamodb.put_item(
            TableName="ConsentLogs",
            Item=consent_log
        )
        
        # Update citizen profile
        update_citizen_consent_status(citizen_id, consent_type, granted)
        
        # Audit log
        audit_log(citizen_id, "CONSENT_RECORDED", consent_log)
        
        return consent_log
    
    def check_consent(self, citizen_id, consent_type, purpose):
        """
        Check if citizen has granted consent for specific purpose
        """
        consents = dynamodb.query(
            TableName="ConsentLogs",
            KeyConditionExpression="citizen_id = :cid",
            FilterExpression="consent_type = :type AND granted = :true AND expires_at > :now"
        )
        
        return len(consents) > 0
    
    def withdraw_consent(self, citizen_id, consent_type):
        """
        Allow citizen to withdraw consent
        """
        # Mark consent as withdrawn
        dynamodb.update_item(
            TableName="ConsentLogs",
            Key={"citizen_id": citizen_id},
            UpdateExpression="SET withdrawn_at = :now",
            ConditionExpression="consent_type = :type AND granted = :true"
        )
        
        # Update citizen profile
        update_citizen_consent_status(citizen_id, consent_type, False)
        
        # Audit log
        audit_log(citizen_id, "CONSENT_WITHDRAWN", {"consent_type": consent_type})
```

## Offline-First Synchronization Strategy

### Sync Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  Field Worker Device (Offline)                              │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │  Local Storage (IndexedDB)                         │    │
│  │  - Cached schemes (200 most common)                │    │
│  │  - Eligibility rules                               │    │
│  │  - Citizen data (collected offline)                │    │
│  │  - Documents (base64 encoded)                      │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │  Sync Queue (IndexedDB)                            │    │
│  │  - Pending registrations                           │    │
│  │  - Pending applications                            │    │
│  │  - Pending document uploads                        │    │
│  │  - Priority: high, medium, low                     │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │  Service Worker                                    │    │
│  │  - Detects connectivity changes                    │    │
│  │  - Triggers background sync                        │    │
│  │  - Handles conflicts                               │    │
│  └────────────────────────────────────────────────────┘    │
└────────────────────┬────────────────────────────────────────┘
                     │ Connectivity Restored
                     ▼
┌─────────────────────────────────────────────────────────────┐
│  Sarathi Backend (AWS)                                      │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │  Sync API (Lambda)                                 │    │
│  │  - Receives queued operations                      │    │
│  │  - Validates data                                  │    │
│  │  - Detects conflicts                               │    │
│  │  - Processes in priority order                     │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │  Conflict Resolver                                 │    │
│  │  - Last-write-wins (for non-critical data)         │    │
│  │  - Manual review (for critical data)               │    │
│  │  - Merge strategies (for compatible changes)       │    │
│  └────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

### Sync Algorithm

```python
# Pseudocode for offline sync

class OfflineSyncManager:
    def queue_operation(self, operation_type, payload, priority="medium"):
        """
        Queue operation for later sync
        """
        operation = {
            "operation_id": generate_uuid(),
            "operation_type": operation_type,
            "payload": payload,
            "priority": priority,
            "timestamp": current_timestamp(),
            "retry_count": 0,
            "status": "pending"
        }
        
        # Store in IndexedDB
        indexedDB.put("SyncQueue", operation)
        
        return operation
    
    def sync_when_online(self):
        """
        Sync all queued operations when connectivity restored
        """
        if not is_online():
            return {"status": "offline"}
        
        # Get all pending operations, sorted by priority and timestamp
        operations = indexedDB.query("SyncQueue", {
            "status": "pending",
            "order_by": ["priority DESC", "timestamp ASC"]
        })
        
        results = []
        for operation in operations:
            try:
                # Send to backend
                response = api.post("/sync/queue", {
                    "device_id": get_device_id(),
                    "operations": [operation]
                })
                
                if response.success:
                    # Update local status
                    operation["status"] = "completed"
                    operation["permanent_id"] = response.permanent_id
                    indexedDB.update("SyncQueue", operation)
                    
                    # Update local data with server response
                    update_local_data(operation, response)
                    
                    results.append({"operation_id": operation.operation_id, "status": "success"})
                else:
                    # Handle failure
                    operation["retry_count"] += 1
                    operation["last_error"] = response.error
                    
                    if operation["retry_count"] >= 3:
                        operation["status"] = "failed"
                        # Notify user
                        notify_user("Sync failed for operation: " + operation.operation_id)
                    
                    indexedDB.update("SyncQueue", operation)
                    results.append({"operation_id": operation.operation_id, "status": "failed"})
            
            except Exception as e:
                # Network error, will retry later
                results.append({"operation_id": operation.operation_id, "status": "error", "error": str(e)})
        
        return {"status": "completed", "results": results}
    
    def resolve_conflict(self, local_data, server_data):
        """
        Resolve conflicts between local and server data
        """
        # Strategy 1: Last-write-wins (for non-critical data)
        if local_data["updated_at"] > server_data["updated_at"]:
            return local_data
        else:
            return server_data
        
        # Strategy 2: Manual review (for critical data like applications)
        if is_critical_data(local_data):
            return {
                "status": "conflict",
                "local": local_data,
                "server": server_data,
                "requires_manual_review": True
            }
        
        # Strategy 3: Merge (for compatible changes)
        if can_merge(local_data, server_data):
            return merge_data(local_data, server_data)
```

### Mesh Networking (P2P Data Collection)

**For areas with zero connectivity**:

```
┌─────────────────────────────────────────────────────────────┐
│  Citizen's Basic Phone (Bluetooth enabled)                  │
│  - Stores basic profile data                                │
│  - Can transmit via Bluetooth                               │
└────────────────────┬────────────────────────────────────────┘
                     │ Bluetooth/Wi-Fi Direct
                     ▼
┌─────────────────────────────────────────────────────────────┐
│  Field Worker's Device (Offline)                            │
│  - Collects data from multiple citizens via Bluetooth       │
│  - Stores locally with encryption                           │
│  - Queues for sync                                          │
└────────────────────┬────────────────────────────────────────┘
                     │ Travels to connected area
                     ▼
┌─────────────────────────────────────────────────────────────┐
│  Panchayat Office (4G/Wi-Fi)                                │
│  - Field worker device auto-syncs when connected            │
│  - Uploads all collected data                               │
│  - Receives confirmations                                   │
└─────────────────────────────────────────────────────────────┘
```

**Implementation using AWS IoT Greengrass**:

```python
# Pseudocode for mesh networking with IoT Greengrass

class MeshNetworkManager:
    def collect_via_bluetooth(self, citizen_phone_id):
        """
        Collect data from citizen's phone via Bluetooth
        """
        # Establish Bluetooth connection
        connection = bluetooth.connect(citizen_phone_id)
        
        # Request data
        citizen_data = connection.request_data()
        
        # Encrypt locally
        encrypted_data = encrypt_with_device_key(citizen_data)
        
        # Store in local Greengrass storage
        greengrass.store_local(encrypted_data)
        
        # Queue for sync
        queue_operation("registration", encrypted_data, priority="high")
        
        # Disconnect
        connection.close()
        
        return {"status": "collected", "citizen_id": citizen_data["id"]}
    
    def relay_to_nearest_connected_device(self):
        """
        If another field worker device is nearby and connected,
        relay data through them
        """
        # Discover nearby devices
        nearby_devices = bluetooth.discover_devices()
        
        for device in nearby_devices:
            if device.is_sarathi_device() and device.is_connected():
                # Relay queued operations through this device
                operations = get_pending_operations()
                device.relay_operations(operations)
                return {"status": "relayed", "device_id": device.id}
        
        return {"status": "no_relay_available"}
```

**Requirements Addressed**: Req 11 (Offline-First), Req 24 (Mesh Networking)

## Fraud Detection Algorithm Architecture

### Multi-Layered Fraud Detection

```
┌─────────────────────────────────────────────────────────────┐
│  Layer 1: Evidence Quality Check (0-20 points)              │
│  - Missing critical documents: +15                          │
│  - Expired certificates: +10                                │
│  - Unverified issuing authority: +5                         │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│  Layer 2: Cross-Scheme Consistency (0-25 points)            │
│  - Income inconsistency across schemes: +10                 │
│  - Caste mismatch: +15                                      │
│  - Address discrepancy: +5                                  │
│  - Duplicate benefit attempt: +20                           │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│  Layer 3: Lifestyle-Income Anomaly (0-25 points)            │
│  - Vehicle ownership vs BPL claim: +15                      │
│  - Property ownership vs income: +10                        │
│  - Smartphone/travel patterns vs income: +5                 │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│  Layer 4: Historical Pattern Analysis (0-15 points)         │
│  - Similar rejected application: +10                        │
│  - Multiple applications in short time: +5                  │
│  - Flagged by community validation: +10                     │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│  Layer 5: Purpose-Lock Enforcement (0-15 points)            │
│  - Already enrolled in same-purpose scheme: +15             │
│  - Attempting duplicate benefit: +10                        │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│  Total Fraud Score (0-100)                                  │
│  - Low Risk (0-30): Auto-approve                            │
│  - Medium Risk (31-60): Human review                        │
│  - High Risk (61-100): Detailed investigation               │
└─────────────────────────────────────────────────────────────┘
```

### Machine Learning Model for Fraud Detection

**Model Architecture**:

```
Input Features (50+ features):
  - Citizen attributes (age, income, location, etc.)
  - Application attributes (scheme type, benefit value, etc.)
  - Evidence quality scores
  - Cross-scheme consistency metrics
  - Lifestyle indicators
  - Historical patterns
  - Temporal features (time of day, day of week)
  - Geospatial features (distance from Panchayat, urban/rural)

Model: Gradient Boosting (XGBoost)
  - Handles mixed data types well
  - Provides feature importance
  - Fast inference
  - Robust to imbalanced data

Output:
  - Fraud probability (0-1)
  - Feature contributions (SHAP values for explainability)
  - Risk level classification

Training:
  - Labeled data from human reviews
  - Continuous learning from feedback
  - Quarterly model retraining
  - A/B testing for model updates
```

**Requirements Addressed**: Req 8 (Fraud Prevention)



### Conflict Resolution Engine - Optimization Approach

The conflict resolution engine uses multi-objective optimization to
 find the optimal combination of schemes that maximizes citizen benefits while respecting all conflict constraints.

**Optimization Problem Formulation**:

```
Given:
  - Set of eligible schemes S = {s1, s2, ..., sn}
  - Conflict graph C where edge (si, sj) means schemes conflict
  - Benefit values B = {b1, b2, ..., bn}
  - Application effort E = {e1, e2, ..., en}
  - Approval probabilities P = {p1, p2, ..., pn}

Objective:
  Maximize: Σ (bi × pi × wi) - λ × Σ ei
  
  Where:
    wi = weight for scheme i based on coverage category
    λ = effort penalty coefficient
    
Subject to:
  - No two conflicting schemes selected: ∀(si, sj) ∈ C, xi + xj ≤ 1
  - Purpose-lock constraints: Only one scheme per purpose
  - Quota constraints: Respect scheme capacity limits
  - xi ∈ {0, 1} (binary decision variable)
```

**Algorithm**:

```python
def findOptimalBundle(citizen_id, eligible_schemes):
    # Build conflict graph
    conflict_graph = buildConflictGraph(eligible_schemes)
    
    # Calculate metrics for each scheme
    for scheme in eligible_schemes:
        scheme.benefit_value = calculateBenefitValue(scheme)
        scheme.effort_score = calculateEffortScore(scheme)
        scheme.approval_prob = calculateApprovalProbability(citizen_id, scheme)
        scheme.coverage_weight = getCoverageWeight(scheme.category)
    
    # Use integer linear programming
    from scipy.optimize import linprog
    
    # Define objective function (maximize weighted benefit - effort)
    c = [-scheme.benefit_value * scheme.approval_prob * scheme.coverage_weight 
         + EFFORT_PENALTY * scheme.effort_score 
         for scheme in eligible_schemes]
    
    # Define conflict constraints
    A_ub = []
    b_ub = []
    for (i, j) in conflict_graph.edges:
        constraint = [0] * len(eligible_schemes)
        constraint[i] = 1
        constraint[j] = 1
        A_ub.append(constraint)
        b_ub.append(1)  # xi + xj <= 1
    
    # Define purpose-lock constraints
    purpose_groups = groupByPurpose(eligible_schemes)
    for group in purpose_groups:
        constraint = [1 if i in group else 0 for i in range(len(eligible_schemes))]
        A_ub.append(constraint)
        b_ub.append(1)  # Only one per purpose
    
    # Solve optimization problem
    result = linprog(c, A_ub=A_ub, b_ub=b_ub, 
                     bounds=[(0, 1)] * len(eligible_schemes),
                     method='highs')
    
    # Extract selected schemes
    selected_indices = [i for i, x in enumerate(result.x) if x > 0.5]
    optimal_bundle = [eligible_schemes[i] for i in selected_indices]
    
    # Generate alternative bundles
    alternatives = generateAlternatives(eligible_schemes, conflict_graph, top_k=3)
    
    return {
        'optimal_bundle': optimal_bundle,
        'total_value': sum(s.benefit_value for s in optimal_bundle),
        'total_effort': sum(s.effort_score for s in optimal_bundle),
        'expected_value': sum(s.benefit_value * s.approval_prob for s in optimal_bundle),
        'alternatives': alternatives,
        'trade_offs': explainTradeOffs(optimal_bundle, alternatives)
    }
```

**Requirements Addressed**: Req 6 (Conflict Detection), Req 7 (Optimal Bundle), Req 22 (Conflict Resolution Engine)

### Welfare Digital Twin - Prediction Model

The welfare digital twin uses demographic patterns and life-stage modeling to predict future eligibility.

**Prediction Model Architecture**:

```
Life Event Prediction:
  - Markov Chain model for life transitions
  - States: {student, employed, unemployed, married, parent, elderly, disabled, deceased}
  - Transition probabilities learned from demographic data
  - Confidence scores based on current state and age

Eligibility Forecasting:
  - For each predicted life event, query triggered schemes
  - Simulate citizen state at future time t
  - Evaluate eligibility using projected attributes
  - Calculate confidence = P(event) × P(eligibility | event)

Poverty Exit Pathway:
  - Dynamic programming to find optimal scheme sequence
  - Objective: Maximize income growth over time
  - Constraints: Scheme dependencies, time windows, effort capacity
```

**Algorithm**:

```python
def createWelfareTwin(citizen_id, years=5):
    citizen = loadCitizenProfile(citizen_id)
    timeline = []
    current_state = citizen.current_life_stage
    
    for year in range(1, years + 1):
        # Predict life events using Markov model
        predicted_events = []
        
        # Age-based events
        if citizen.age + year == 18:
            predicted_events.append({
                'event': 'EDUCATION_COMPLETION',
                'confidence': 0.85,
                'schemes': ['Higher Education Scholarship', 'Skill Training']
            })
        
        if citizen.age + year == 60:
            predicted_events.append({
                'event': 'RETIREMENT',
                'confidence': 0.95,
                'schemes': ['Old Age Pension', 'Senior Citizen Health']
            })
        
        # Demographic pattern-based events
        if citizen.marital_status == 'married' and citizen.children_count == 0:
            birth_prob = calculateBirthProbability(citizen, year)
            if birth_prob > 0.3:
                predicted_events.append({
                    'event': 'BIRTH',
                    'confidence': birth_prob,
                    'schemes': ['Maternity Benefit', 'Child Nutrition', 'Immunization']
                })
        
        # Economic transition events
        if current_state == 'unemployed':
            employment_prob = calculateEmploymentProbability(citizen, year)
            if employment_prob > 0.4:
                predicted_events.append({
                    'event': 'EMPLOYMENT',
                    'confidence': employment_prob,
                    'schemes': ['Employment Guarantee', 'Skill Certification']
                })
        
        # For each predicted event, evaluate future eligibility
        for event in predicted_events:
            future_citizen = simulateCitizenState(citizen, year, event)
            eligible_schemes = []
            
            for scheme_name in event['schemes']:
                scheme = loadScheme(scheme_name)
                if wouldBeEligible(future_citizen, scheme):
                    eligible_schemes.append({
                        'scheme': scheme,
                        'benefit_value': scheme.benefit_value,
                        'preparation_steps': generatePreparationSteps(scheme, year)
                    })
            
            timeline.append({
                'year': year,
                'event': event['event'],
                'confidence': event['confidence'],
                'eligible_schemes': eligible_schemes,
                'preparation_deadline': f"{year - 1} years from now"
            })
        
        # Update current state for next iteration
        current_state = predictNextState(current_state, predicted_events)
    
    # Identify poverty exit pathways
    pathways = identifyPovertyExitPathways(timeline, citizen)
    
    return {
        'citizen_id': citizen_id,
        'timeline': timeline,
        'pathways': pathways,
        'total_potential_value': sum(
            event['eligible_schemes'][0]['benefit_value'] 
            for event in timeline 
            if event['eligible_schemes']
        ),
        'recommendations': generateLongTermRecommendations(timeline, pathways)
    }

def identifyPovertyExitPathways(timeline, citizen):
    """
    Use dynamic programming to find optimal scheme sequences
    that maximize income growth over time
    """
    pathways = []
    
    # Define poverty line threshold
    poverty_line = 12000  # monthly income
    
    # Simulate different scheme combinations
    for combination in generateSchemeCombinations(timeline):
        projected_income = citizen.current_income
        steps = []
        
        for year, schemes in combination:
            # Calculate income impact
            for scheme in schemes:
                if scheme.benefit_type == 'income_support':
                    projected_income += scheme.monthly_value
                elif scheme.benefit_type == 'skill_training':
                    projected_income *= 1.3  # 30% income increase post-training
                elif scheme.benefit_type == 'employment':
                    projected_income = max(projected_income, scheme.guaranteed_wage)
            
            steps.append({
                'year': year,
                'schemes': schemes,
                'projected_income': projected_income
            })
            
            # Check if crossed poverty line
            if projected_income > poverty_line:
                pathways.append({
                    'steps': steps,
                    'years_to_exit': year,
                    'final_income': projected_income,
                    'income_growth': projected_income - citizen.current_income
                })
                break
    
    # Sort pathways by years to exit (faster is better)
    pathways.sort(key=lambda p: p['years_to_exit'])
    
    return pathways[:3]  # Return top 3 pathways
```

**Requirements Addressed**: Req 9 (Welfare Twin), Req 21 (Digital Twin - Predictive Life-Path Planning)

## Why This Architecture Works

### 1. Handles Complexity at Scale

**Challenge**: India has 700+ schemes with complex, overlapping eligibility rules across 28 states.

**Solution**: 
- Knowledge graph naturally models relational eligibility rules
- Graph traversal handles multi-scheme reasoning efficiently
- Scales to 100M+ citizens with sub-3-second response times
- Serverless architecture auto-scales with demand

### 2. Inclusive by Design

**Challenge**: 70% of target beneficiaries are illiterate or semi-literate with limited digital access.

**Solution**:
- Voice-first interface using Amazon Lex (no reading required)
- 22 Indian languages with dialect support
- Offline-first architecture with mesh networking for zero-connectivity zones
- Panchayat-assisted mode for human-in-loop support
- Works on basic phones (no smartphone needed)

### 3. Proactive Rather Than Reactive

**Challenge**: Current systems wait for citizens to discover and apply for schemes.

**Solution**:
- Life-event triggers automatically identify newly eligible citizens
- Panchayat dashboard shows eligible non-beneficiaries
- Welfare digital twin predicts future eligibility 3-5 years ahead
- Proactive notifications via SMS, WhatsApp, voice calls
- System reaches out first - citizens don't need to search

### 4. Ethical and Explainable

**Challenge**: AI decisions in welfare must be transparent and fair to build trust.

**Solution**:
- Every decision explained in simple language using Amazon Bedrock
- Zero-knowledge proofs protect sensitive data while enabling verification
- Human-in-loop for fraud flag reviews (system flags, humans decide)
- Community validation creates accountability through citizen feedback
- Audit logs provide complete traceability
- Bias detection and fairness metrics tracked continuously

### 5. Hackathon-Feasible and Real-World Ready

**Challenge**: Build a working prototype quickly while ensuring production viability.

**Solution**:
- Serverless architecture (no infrastructure management)
- AWS managed services (Neptune, Lex, Bedrock, Lambda)
- Fast iteration with event-driven design
- Minimal DevOps overhead
- Same architecture scales from hackathon demo to national deployment
- Enterprise security and compliance built-in

## Architecture Takeaway for Judges

**Sarathi's architecture transforms welfare from static portals into a living, intelligent system that actively reaches the people it serves.**

Key differentiators:
1. **First AI-powered welfare delivery engine** (not just a scheme finder)
2. **Designed for the poorest and illiterate** (voice-first, offline-capable)
3. **Proactive intelligence** (life-events, digital twins, Panchayat outreach)
4. **Ethical AI** (explainable, privacy-preserving, community-validated)
5. **Production-ready** (serverless, scalable, secure)

## Implementation Roadmap

### Phase 1: Foundation (Months 1-3)
- Set up AWS infrastructure (Neptune, Lambda, DynamoDB, API Gateway)
- Implement knowledge graph schema and eligibility engine
- Build basic REST APIs
- Create admin interface for scheme management

### Phase 2: Conversational AI (Months 4-6)
- Integrate Amazon Lex for voice/chat interface
- Implement multi-language support (start with 5 languages)
- Build explainability engine using Amazon Bedrock
- Create IVR integration for basic phones

### Phase 3: Panchayat Tools (Months 7-9)
- Develop Panchayat dashboard (React web app)
- Implement assisted registration workflow
- Build offline-first architecture with sync queue
- Create outreach tracking and reporting

### Phase 4: Advanced Features (Months 10-12)
- Implement fraud detection with ML models
- Build conflict resolution optimization engine
- Create welfare digital twin prediction model
- Develop zero-knowledge proof verification

### Phase 5: Scale & Integration (Months 13-15)
- Integrate with Aadhaar, PFMS, state databases
- Implement mesh networking for offline zones
- Build benefit portability for migrants
- Create community validation system

### Phase 6: Pilot & Refinement (Months 16-18)
- Conduct pilot in 5 districts across 3 states
- Collect feedback and refine algorithms
- Optimize performance and cost
- Prepare for national rollout

## Conclusion

Sarathi's architecture represents a paradigm shift in welfare delivery - from fragmented, reactive portals to an intelligent, proactive system that ensures the right benefit reaches the right citizen at the right time, even if they cannot read, write, or use the internet.

The five-layer architecture (Interaction, Intelligence, Data, Outreach, Governance) provides:
- **Inclusivity**: Voice-first, offline-capable, multi-language
- **Intelligence**: Knowledge graphs, ML, optimization, prediction
- **Proactivity**: Life-event triggers, Panchayat outreach, digital twins
- **Ethics**: Explainability, privacy-preservation, community validation
- **Scalability**: Serverless, auto-scaling, 100M+ citizens

By combining conversational AI, knowledge graphs, predictive modeling, and privacy-preserving technologies on AWS's serverless platform, Sarathi transforms welfare from a burden on citizens to a proactive support system that actively identifies and enrolls eligible beneficiaries.

**"Sarathi is India's first AI-powered welfare delivery engine, designed for the poorest, the illiterate, and the invisible - because no eligible citizen should be left behind."**
