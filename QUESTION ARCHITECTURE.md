QUESTION ARCHITECTURE

SECTION 1

**🧠 CORE IDEA**

We collect:

**Phase 1 → Core Profile (8-12 questions)**

**Phase 2 → Conditional Branching**

**Phase 3 → Scheme Matching**

**Phase 4 → Optional AI explanation**

**🔵 PHASE 1 - CORE PROFILE (Always Asked)**

These are mandatory for everyone:

- Age
- Gender
- Marital Status
- State
- Urban / Rural
- Annual Household Income
- Caste Category (General/OBC/SC/ST/EWS)
- Disability? (Yes/No)
- Occupation Type
- BPL / Ration Card Type

These 10 questions alone filter 70% of schemes.

**🔵 PHASE 2 - BRANCHING LOGIC**

Now we dynamically branch.

**🟢 IF Age < 18 → Child Branch**

Ask:

- Currently studying?
- Class level?
- Government school?
- Girl child?
- Orphan?
- Minority category?

Match:

- Scholarship schemes
- Girl child schemes
- Minority education support

**🟢 IF Age 18-35 → Youth Branch**

Ask:

- Employment status
- Skill trained?
- Interested in training?
- Startup interest?
- Self-employed?
- Education level

Match:

- Skill India
- PMKVY
- Startup India
- Mudra Loan

**🟢 IF Occupation = Farmer**

Ask:

- Land ownership?
- Land size?
- Tenant farmer?
- Irrigated land?
- Livestock?
- PM-Kisan registered?

Match:

- PM-Kisan
- Crop insurance
- Soil health schemes
- Irrigation subsidy

**🟢 IF Gender = Female**

Ask:

- Pregnant?
- Lactating mother?
- SHG member?
- Widow?
- Girl child parent?

Match:

- Maternity benefit
- Widow pension
- Women entrepreneurship schemes

**🟢 IF Age ≥ 60 → Senior Citizen**

Ask:

- Pension receiving?
- Income below threshold?
- Widow?

Match:

- Old age pension
- Widow pension

**🟢 IF Disability = Yes**

Ask:

- Disability %
- Type of disability
- Certificate available?

Match:

- Disability pension
- Assistive device schemes
- Special scholarship

**🟢 IF Urban Poor**

Ask:

- Own house?
- Slum resident?
- Street vendor?

Match:

- PMAY Urban
- Street Vendor loan
- Urban livelihood mission

**🟢 IF Rural Poor**

Ask:

- Kutcha house?
- MGNREGA job card?
- Self Help Group member?

Match:

- PMAY Gramin
- NRLM
- MGNREGA

**🔵 PHASE 3 - ELIGIBILITY ENGINE LOGIC**

Instead of asking everything, you build a rule engine:

Example rule:

IF age >= 18  
AND occupation == farmer  
AND land_owned == True  
AND income < 200000  
→ Eligible for PM-Kisan

Another:

IF gender == female  
AND widow == True  
AND age > 18  
AND income < 150000  
→ Widow Pension

Each scheme becomes a condition block.

**🧠 REAL SYSTEM STRUCTURE**

Your backend should have:

schemes = \[  
{  
"id": "pm_kisan",  
"conditions": {  
"occupation": "farmer",  
"land_owned": True,  
"income_max": 200000  
}  
},  
...  
\]

Then match dynamically.

**🔥 BEST PRACTICAL QUESTION FLOW**

Instead of 100 questions,  
you ask in this order:

**Step 1 - Identify Primary Persona**

Ask:

- Are you a farmer?
- Are you a student?
- Are you unemployed?
- Are you a senior citizen?
- Are you a woman seeking support?
- Are you running a business?

Let user select category first.

Then branch deeply.

**🎯 PROFESSIONAL FLOW (Like Real Systems)**

- Identify Persona
- Collect income + location
- Collect category
- Collect document status
- Branch to detailed questions
- Compute eligibility

SECTION 2

GOOD. Now we design this like a **real national-level eligibility engine**, not a college demo.

I'll give you:

- ✅ Full System Architecture
- ✅ Dynamic Question Flow Design
- ✅ Rule Engine Structure (JSON-based)
- ✅ Python Matching Logic
- ✅ How Lex Should Be Used Properly
- ✅ How Bedrock Fits (Optional AI Layer)

This will be production-grade logic.

**🧠 1️⃣ COMPLETE SYSTEM ARCHITECTURE**

**🎯 High-Level Flow**

User  
→ Frontend / Lex  
→ Profile Builder  
→ Eligibility Engine  
→ Scheme Rules Database  
→ Matched Schemes  
→ Bedrock (optional explanation)  
→ Response

**🏗 Architecture Components**

**🔹 1. Frontend / Lex**

- Collects answers dynamically
- Sends profile JSON to backend

**🔹 2. Profile Object**

All answers stored in one structured object:

{  
"age": 28,  
"gender": "female",  
"state": "Karnataka",  
"income": 120000,  
"category": "OBC",  
"isWidow": false,  
"occupation": "farmer",  
"landOwned": true,  
"landSize": 2.5,  
"disability": false,  
"urban": false  
}

This is your universal citizen profile.

**🧠 2️⃣ DYNAMIC QUESTION FLOW DESIGN**

Instead of fixed 100 questions, use this logic:

**🔵 STEP 1 - Core Filter Questions (Ask Everyone)**

- Age
- Gender
- State
- Urban / Rural
- Annual Income
- Caste Category
- Occupation

These filter 60-70% of schemes immediately.

**🔵 STEP 2 - Persona Detection**

Ask:

Which best describes you?

- Farmer
- Student
- Unemployed
- Business Owner
- Senior Citizen
- Homemaker
- Disabled
- Pregnant Woman

Now branch.

**🔵 STEP 3 - Conditional Deep Questions**

**If Farmer:**

- Land ownership?
- Land size?
- Tenant farmer?
- Livestock?

**If Student:**

- Class level?
- Govt school?
- Girl child?
- Minority?

**If Business Owner:**

- MSME registered?
- Turnover?
- Loan needed?

**If Woman:**

- Widow?
- SHG member?
- Pregnant?

**If Senior Citizen:**

- Age above 60?
- Pension receiving?

**If Disabled:**

- Disability %?
- Certificate available?

**🧠 3️⃣ SCHEME DATABASE STRUCTURE (Professional Way)**

Instead of writing hardcoded if-statements,  
store schemes like this:

{  
"id": "pm_kisan",  
"name": "PM Kisan Samman Nidhi",  
"conditions": {  
"occupation": \["farmer"\],  
"landOwned": true,  
"incomeMax": 200000  
}  
}

Another:

{  
"id": "widow_pension",  
"conditions": {  
"gender": \["female"\],  
"isWidow": true,  
"incomeMax": 150000  
}  
}

Another:

{  
"id": "skill_india",  
"conditions": {  
"ageMin": 18,  
"ageMax": 35,  
"employmentStatus": \["unemployed"\]  
}  
}

**🧠 4️⃣ ELIGIBILITY ENGINE LOGIC (Python Example)**

def is_eligible(profile, scheme):  
conditions = scheme\["conditions"\]  
<br/>if "ageMin" in conditions and profile\["age"\] < conditions\["ageMin"\]:  
return False  
<br/>if "ageMax" in conditions and profile\["age"\] > conditions\["ageMax"\]:  
return False  
<br/>if "occupation" in conditions and profile\["occupation"\] not in conditions\["occupation"\]:  
return False  
<br/>if "incomeMax" in conditions and profile\["income"\] > conditions\["incomeMax"\]:  
return False  
<br/>if "gender" in conditions and profile\["gender"\] not in conditions\["gender"\]:  
return False  
<br/>if "isWidow" in conditions and profile\["isWidow"\] != conditions\["isWidow"\]:  
return False  
<br/>return True

Then:

matched = \[\]  
<br/>for scheme in schemes:  
if is_eligible(profile, scheme):  
matched.append(scheme)

That's your engine.

**🧠 5️⃣ HOW LEX SHOULD BE USED PROPERLY**

Lex should NOT contain 100 static slots.

Instead:

Use Lex for:

- Basic profile intake
- Persona selection
- Few core branching questions

Then:

Send profile to backend.  
Backend returns:

- Next required question  
    OR
- Matched schemes

This makes it dynamic.

**🧠 6️⃣ WHERE BEDROCK FITS**

Bedrock is NOT needed for eligibility.

Bedrock is useful for:

- Generating simple explanation in local language
- Personalizing scheme summary
- Explaining "why eligible"

Example:

prompt = f"""  
Explain why {profile\['name'\]} is eligible for {scheme_name}  
in simple Kannada.  
"""

Bedrock generates explanation.

**🎯 FINAL PROFESSIONAL STRUCTURE**

You should have:

- schemes.json (all schemes + conditions)
- eligibility_engine.py
- question_flow_engine.py
- profile_builder.py
- Optional ai_explainer.py