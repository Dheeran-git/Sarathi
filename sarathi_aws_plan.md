**SARATHI**

**AWS + Frontend Completion**

Full Execution Plan · Team of 4 · \$100 AWS Credits

Remote Collaboration · 5-Day Sprint · Hackathon Submission Ready

**Where You Stand Right Now**

Before planning what to do next, be clear about what exists and what
doesn\'t. This honest assessment drives every decision below.

  ------------------------------------------------------------------------
  **Area**         **Current State**        **What\'s Missing**
  ---------------- ------------------------ ------------------------------
  Frontend Pages   All 5 pages built, React No live data, no state flow
                   Router connected         between pages, not deployed

  AWS              Credits just received,   Every AWS service needs to be
  Infrastructure   nothing built yet        created and configured

  Backend / APIs   Does not exist           All Lambda functions, DynamoDB
                                            tables, API Gateway routes

  AI Services      Does not exist           Amazon Lex bot, Bedrock
                                            integration, Polly voice
                                            output

  Frontend ↔       Not connected            API calls, environment
  Backend                                   variables, CORS setup

  Deployment       Local only (localhost)   Live URL on AWS Amplify or
                                            Netlify

  Demo             Not prepared             3 scripted demo flows, demo
                                            video, final submission
  ------------------------------------------------------------------------

+-----------------------------------------------------------------------+
| **⚠️ The Most Important Shift in Mindset**                            |
|                                                                       |
| Your frontend pages are like a beautiful car with no engine. The next |
| 5 days are about building the engine, connecting it to the car, and   |
| getting it on the road. Everything is parallel --- two members finish |
| the frontend wiring while two others build AWS. They meet in the      |
| middle on Day 3.                                                      |
+-----------------------------------------------------------------------+

**What You Are Building on AWS**

This is the complete backend architecture. Every service listed below
needs to be created, configured, and connected. Read this before
touching anything in the AWS console.

  ------------------------------------------------------------------------
  **AWS Service**    **What It Does in Sarathi**        **Who Builds It**
  ------------------ ---------------------------------- ------------------
  DynamoDB           Stores all scheme data (700+       Member 1
                     schemes) and citizen profiles. Two 
                     tables: Schemes and Citizens.      

  Lambda (6          All backend logic --- eligibility  Member 1
  functions)         matching, digital twin simulation, 
                     panchayat stats, scheme fetch,     
                     citizen save, conflict detection.  

  API Gateway        The single entry point for the     Member 1
                     frontend to call the backend.      
                     Routes each URL path to the right  
                     Lambda.                            

  Amazon Lex         The conversational chatbot ---     Member 2
                     collects citizen profile through a 
                     natural conversation in Hindi and  
                     English.                           

  Amazon Bedrock     Takes matched scheme data and      Member 2
  (Claude Haiku)     generates simple plain-Hindi       
                     explanations for each scheme.      

  Amazon Polly       Converts Bedrock\'s Hindi text     Member 2
                     output to spoken audio for         
                     illiterate users.                  

  Amazon SNS         Sends SMS/WhatsApp alerts to       Member 2
                     Panchayat officials when new       
                     eligible citizens are detected.    

  Amazon Cognito     Login system for the Panchayat     Member 4
                     Dashboard. Officials need          
                     credentials to see sensitive       
                     village data.                      

  Amazon S3          Stores the built React app files   Member 1
                     and any uploaded documents (scheme 
                     PDFs, etc.).                       

  AWS Amplify        Hosts the frontend React app and   Member 3
                     gives it a public live URL.        
                     Auto-deploys on GitHub push.       

  CloudWatch         Logs and monitors all Lambda       Member 1
                     function errors. Essential for     (automatic)
                     debugging during integration.      
  ------------------------------------------------------------------------

**AWS Budget Management --- \$100 Credits**

+-----------------------------------------------------------------------+
| **🚨 Set Billing Alerts RIGHT NOW --- First Thing**                   |
|                                                                       |
| Go to AWS Console → Billing → Budgets → Create Budget. Set alerts at  |
| \$40, \$70, and \$90. This takes 5 minutes and prevents losing all    |
| credits accidentally. Do not skip this.                               |
+-----------------------------------------------------------------------+

  ------------------------------------------------------------------------
  **Service**        **How You\'ll Use It**             **Estimated Cost
                                                        (5 days)**
  ------------------ ---------------------------------- ------------------
  Amazon Bedrock     \~500 eligibility explanation      \~\$3--6
  (Claude Haiku)     calls during testing + demo        

  Amazon Lex         Chatbot interactions during dev +  \~\$2--4
                     demo testing                       

  Amazon Polly       Text-to-speech for Hindi           \~\$1--2
                     explanations, \~200 calls          

  AWS Lambda         \~10,000 invocations during dev    \~\$0--1
                     and testing (very cheap)           

  Amazon API Gateway \~50,000 API calls (generous       \~\$2
                     estimate)                          

  Amazon DynamoDB    On-demand pricing, very small      \~\$1--2
                     dataset                            

  Amazon S3          Frontend files + scheme PDFs       \~\$0--1
                     (\~50MB)                           

  AWS Amplify        Frontend hosting + build minutes   \~\$2--3

  Amazon Cognito     User pool (free tier: 50,000 MAUs) \~\$0

  Amazon SNS         SMS alerts (demo only, \~20        \~\$0--1
                     messages)                          

  TOTAL ESTIMATE     Leaves \~\$78--88 as safety buffer \~\$12--22
  ------------------------------------------------------------------------

⚠️ The biggest cost risk is leaving services running overnight. Member 1
should set a reminder every evening to check the billing dashboard.

**Team Roles --- Who Owns What**

Every member has a clear primary domain. There is no ambiguity about who
decides what within their domain. When in doubt, the domain owner
decides.

+-----------------------------------------------------------------------+
| ⚙️ **Member 1 --- AWS Backend Lead** · Strongest in Python / Node.js  |
|                                                                       |
| *Owns all AWS infrastructure, Lambda functions, and DynamoDB*         |
|                                                                       |
| -   Day 1: Create AWS account structure, IAM users for all 4 members, |
|     DynamoDB tables, billing alerts                                   |
|                                                                       |
| -   Day 1: Seed DynamoDB Schemes table with 18 real Indian schemes    |
|     (use the mockSchemes.js from frontend as the data source)         |
|                                                                       |
| -   Day 2: Build and deploy all 6 Lambda functions (eligibility       |
|     engine, digital twin calculator, panchayat stats, scheme fetch,   |
|     citizen save, conflict detector)                                  |
|                                                                       |
| -   Day 2: Create API Gateway with routes for each Lambda, enable     |
|     CORS for frontend domain                                          |
|                                                                       |
| -   Day 3: Test every API endpoint with Postman, fix bugs, share      |
|     Postman collection with Member 3 and 4                            |
|                                                                       |
| -   Day 4: Monitor CloudWatch logs during integration, fix any Lambda |
|     errors surfaced by Member 4\'s testing                            |
|                                                                       |
| -   Day 5: Performance check --- ensure all API responses return in   |
|     under 3 seconds                                                   |
+-----------------------------------------------------------------------+

+-----------------------------------------------------------------------+
| 🧠 **Member 2 --- AWS AI Services Lead** · Strongest in AI/ML, AWS AI |
| services                                                              |
|                                                                       |
| *Owns Lex, Bedrock, Polly, and SNS*                                   |
|                                                                       |
| -   Day 1: Create Amazon Lex bot --- define all 6 intents (name, age, |
|     state, income, category, situation). Test basic conversation flow |
|     in the Lex console.                                               |
|                                                                       |
| -   Day 2: Connect Lex to Member 1\'s eligibility Lambda --- when     |
|     conversation is complete, Lex calls Lambda with the collected     |
|     profile                                                           |
|                                                                       |
| -   Day 2: Set up Amazon Bedrock with Claude Haiku. Write the prompt  |
|     template that takes scheme data and generates a 2-sentence plain  |
|     Hindi explanation                                                 |
|                                                                       |
| -   Day 3: Integrate Polly --- pipe Bedrock\'s Hindi text output to   |
|     Polly, return an audio URL to the frontend                        |
|                                                                       |
| -   Day 3: Set up SNS topic for Panchayat alerts. Write the Lambda    |
|     trigger that fires when a new eligible citizen is detected        |
|                                                                       |
| -   Day 4: Add Hindi + English language support to Lex. Test          |
|     code-switching (user speaks Hindi, bot responds Hindi; user       |
|     switches to English, bot switches too)                            |
|                                                                       |
| -   Day 5: End-to-end test the full AI pipeline --- voice input → Lex |
|     → Lambda → Bedrock → Polly → audio response                       |
+-----------------------------------------------------------------------+

+-----------------------------------------------------------------------+
| 🎨 **Member 3 --- Frontend Completion Lead** · Strongest in React,    |
| UI/UX                                                                 |
|                                                                       |
| *Finishes the frontend wiring and deployment*                         |
|                                                                       |
| -   Day 1: Deploy the current frontend to AWS Amplify RIGHT NOW ---   |
|     get the live URL today, even if the app is static. Share URL with |
|     team.                                                             |
|                                                                       |
| -   Day 1: Build CitizenContext and LanguageContext (global state).   |
|     Wire all 5 pages through the context so state persists across     |
|     navigation.                                                       |
|                                                                       |
| -   Day 2: Build the conversation state machine in the Chat page ---  |
|     the 6-step intake flow that reads from conversationScript.js and  |
|     updates CitizenContext                                            |
|                                                                       |
| -   Day 2: Wire the local eligibility matcher --- after step 6, run   |
|     matchSchemes() against mockSchemes.js and show real results in    |
|     the Results Panel                                                 |
|                                                                       |
| -   Day 3: Replace mock data calls with real API calls to Member 1\'s |
|     API Gateway endpoints as they become available                    |
|                                                                       |
| -   Day 3: Wire the Digital Twin page to use CitizenContext data ---  |
|     chart and timeline should reflect the actual matched schemes      |
|                                                                       |
| -   Day 4: Add the 3 demo personas with auto-playback feature (the    |
|     \'Demo Mode\' bar described previously)                           |
|                                                                       |
| -   Day 4: Final UI polish --- loading skeletons, page transitions,   |
|     404 page, favicon, browser title                                  |
|                                                                       |
| -   Day 5: Cross-browser and mobile testing. Fix any layout issues.   |
|     Ensure live URL loads flawlessly from an incognito browser.       |
+-----------------------------------------------------------------------+

+-----------------------------------------------------------------------+
| 🔗 **Member 4 --- Integration, Testing & Demo Lead** · Full-stack     |
| generalist + strong communicator                                      |
|                                                                       |
| *Owns the connection between frontend and backend, and owns the final |
| demo*                                                                 |
|                                                                       |
| -   Day 1: Set up GitHub repo with branching strategy (main, dev,     |
|     feature branches). Write the README skeleton. Create the shared   |
|     Postman workspace.                                                |
|                                                                       |
| -   Day 2: As soon as Member 1 has even 1 API endpoint ready, test it |
|     with Postman. Document request/response format for Member 3.      |
|                                                                       |
| -   Day 3: Integration testing --- sit between Member 3 (frontend)    |
|     and Member 1 (backend). When frontend makes an API call and       |
|     something breaks, you debug and coordinate the fix.               |
|                                                                       |
| -   Day 3: Seed the 3 demo citizen personas into DynamoDB (Kamla      |
|     Devi, Ramu Prasad, Sarpanch Meena\'s village). Verify each        |
|     persona returns the correct matched schemes.                      |
|                                                                       |
| -   Day 4: Set up Amazon Cognito for Panchayat Dashboard login.       |
|     Create demo credentials: panchayat@sarathi.in / Demo@1234         |
|                                                                       |
| -   Day 4: Write the 3 demo scripts word-for-word. Each script is     |
|     2--3 minutes. Rehearse them yourself twice.                       |
|                                                                       |
| -   Day 5: Record the demo video --- you narrate, Member 3 operates   |
|     the live app on screen. Edit and upload to YouTube (unlisted).    |
|                                                                       |
| -   Day 5: Final GitHub cleanup --- merge all branches to main, write |
|     complete README, tag v1.0. Submit all 3 links.                    |
+-----------------------------------------------------------------------+

**5-Day Sprint Plan --- Day by Day**

Each day is split into parallel tracks. All 4 members work
simultaneously. The end-of-day sync is the single most important 15
minutes of each day.

+---------+------------------------------------------------------------+
| **DAY   | **🎯 Day Goal:**                                           |
| 1**     |                                                            |
|         | Every member has working AWS access, the app is live on a  |
| Fou     | URL, and all services are scaffolded (even if empty).      |
| ndation |                                                            |
+---------+------------------------------------------------------------+

**Morning (9 AM -- 1 PM) --- ALL HANDS TOGETHER**

  ------------------------------------------------------------------------
  **Task**                          **Who**         **Done When**
  --------------------------------- --------------- ----------------------
  Create the main AWS account.      Member 1        Billing dashboard
  Enable billing alerts at \$40,                    shows 3 active alerts
  \$70, \$90.                                       

  Create IAM users for Members 2,   Member 1        All 3 members can log
  3, 4 with these policies:                         into AWS console
  AmazonLexFullAccess,                              
  AmazonDynamoDBFullAccess,                         
  AWSLambdaFullAccess,                              
  AmazonBedrockFullAccess,                          
  AmazonPollyFullAccess,                            
  AmazonSNSFullAccess                               

  All members install AWS CLI, run  All             No credential errors
  \'aws configure\' with their                      in terminal
  credentials, test with \'aws s3                   
  ls\'                                              

  Create GitHub repo, add all       Member 4        GitHub repo is live
  members as collaborators, set up                  and public
  branch protection on main, push                   
  current frontend code                             
  ------------------------------------------------------------------------

**Afternoon (2 PM -- 7 PM) --- PARALLEL TRACKS**

  -------------------------------------------------------------------------------
  **Member 1 ---    **Member 2 --- AI** **Member 3 ---          **Member 4 ---
  Backend**                             Frontend**              Integration**
  ----------------- ------------------- ----------------------- -----------------
  Create DynamoDB:  Open Amazon Lex     Deploy current app to   Set up Postman
  Schemes table     console. Create bot AWS Amplify (connect    workspace. Create
  (partition key:   named               GitHub repo, set build  collection
  schemeId),        \'SarathiBot\'. Add command: npm run build, \'Sarathi API\'.
  Citizens table    first intent:       publish directory:      Share with team.
  (partition key:   CollectName. Test   dist). Share the live   Start writing
  citizenId).       in console.         URL in team chat.       README structure.
  Enable on-demand                                              
  billing.                                                      

  Seed Schemes      Add remaining 5     Build                   Write the shared
  table with all 18 intents to Lex:     CitizenContext.jsx and  API contract
  schemes from      CollectAge,         LanguageContext.jsx.    document: every
  mockSchemes.js.   CollectState,       Wrap App.jsx in both    endpoint, request
  Use AWS CLI or a  CollectIncome,      providers. Verify       format, response
  seeder script.    CollectCategory,    context persists across format. Paste in
                    CollectSituation.   route changes.          shared Google Doc
                                                                for Members 1 and
                                                                3 to align on.

  Create Lambda     Write the Lex       Build                   Set up shared
  execution role in fulfillment Lambda  conversationScript.js   .env template
  IAM with DynamoDB that receives the   with all 6 steps.       file in repo
  read/write and    completed citizen   Implement the Chat page (.env.example)
  CloudWatch logs   profile from Lex    state machine: show     listing all
  permissions.      and returns it as   question → wait for     environment
                    JSON.               answer → show next      variables Members
                                        question.               3 and 1 will
                                                                need.
  -------------------------------------------------------------------------------

+-----------------------------------------------------------------------+
| **🕕 End of Day 1 Sync (15 minutes --- mandatory)**                   |
|                                                                       |
| Everyone answers: (1) What did you complete? (2) What is your         |
| blocker? (3) What do you need from another member? Minimum acceptable |
| end state: AWS console access works for all 4 members. App is live on |
| Amplify URL. DynamoDB Schemes table is seeded.                        |
+-----------------------------------------------------------------------+

+---------+------------------------------------------------------------+
| **DAY   | **🎯 Day Goal:**                                           |
| 2**     |                                                            |
|         | The eligibility API works end-to-end. Lex completes a full |
| Core    | conversation. Frontend shows real matched schemes from     |
| Engine  | local logic.                                               |
+---------+------------------------------------------------------------+

  -----------------------------------------------------------------------------------------------
  **Member 1 --- Backend**  **Member 2 --- AI**  **Member 3 --- Frontend**      **Member 4 ---
                                                                                Integration**
  ------------------------- -------------------- ------------------------------ -----------------
  Build Lambda 1:           Connect Lex          Wire local eligibility matcher Test Member 1\'s
  eligibility-engine Input: fulfillment Lambda   in the Chat page. After step   eligibility
  { age, state, income,     to all 6 intents.    6, call                        Lambda the moment
  category, isWidow,        Test full            matchSchemes(citizenProfile,   it\'s deployed.
  occupation } Logic: scan  conversation in Lex  mockSchemes). Show results in  Send 3 test
  Schemes table, apply      console --- complete Results Panel with real scheme payloads (Kamla
  eligibility rules for     all 6 steps and      cards. This uses local data    Devi, Ramu,
  each scheme, return       verify the JSON      --- no API yet.                generic farmer).
  matched schemes sorted by output is correct.                                  Document what the
  annual benefit descending                                                     response looks
  Deploy and test with                                                          like.
  hardcoded test event in                                                       
  console.                                                                      

  Build Lambda 2:           Set up Amazon        Wire Digital Twin page to      As Member 1
  digital-twin-calculator   Bedrock. Test Claude CitizenContext. Chart should   finishes each
  Input: { citizenProfile,  Haiku with a direct  show the citizen\'s name in    Lambda,
  matchedSchemes } Logic:   API call from        the header. Timeline should    immediately test
  sequence schemes by       Lambda. Write the    list their actual matched      it in Postman and
  enrollment difficulty,    prompt: \'Given this schemes in order.              share the working
  calculate monthly income  scheme data:                                        request example
  at each step, return 36   {schemeJSON}, write                                 in the team doc.
  data points for 3 years   a 2-sentence                                        Keep track of
  Deploy and test.          explanation in                                      which endpoints
                            simple Hindi that a                                 are ready.
                            rural villager can                                  
                            understand.\'                                       

  Build Lambda 3:           Integrate Bedrock    Replace mockSchemes.js calls   Create the 3 demo
  scheme-fetch Input: {     into the eligibility with real API calls to Member  citizen records
  schemeId } Output: full   pipeline: when       1\'s eligibility-engine Lambda in DynamoDB
  scheme object from        eligibility-engine   (via API Gateway) as soon as   Citizens table:
  DynamoDB Also build       returns matched      Member 4 confirms the endpoint Kamla Devi (age
  Lambda 4: panchayat-stats schemes, call        is working. Keep mock as       55, widow, UP,
  Input: { panchayatId }    Bedrock for each     fallback if API is down.       BPL), Ramu Prasad
  Output: household counts, scheme to generate                                  (age 30, migrant,
  alert list, citizen table Hindi explanation.                                  Bihar, income
  data                      Return explanations                                 8000), Meena Ji
                            alongside scheme                                    (Panchayat
                            data.                                               secretary,
                                                                                Rajasthan).
  -----------------------------------------------------------------------------------------------

+-----------------------------------------------------------------------+
| **🕕 End of Day 2 Sync**                                              |
|                                                                       |
| Minimum acceptable: eligibility-engine Lambda deployed and tested.    |
| Chat page shows real matched schemes (even from local data is fine).  |
| Lex bot completes full 6-step conversation.                           |
+-----------------------------------------------------------------------+

+---------+------------------------------------------------------------+
| **DAY   | **🎯 Day Goal:**                                           |
| 3**     |                                                            |
|         | Full AI pipeline works: voice → Lex → Lambda → Bedrock →   |
| AI      | Hindi explanation → Polly audio. Frontend is calling real  |
| Pip     | APIs.                                                      |
| eline + |                                                            |
| Inte    |                                                            |
| gration |                                                            |
+---------+------------------------------------------------------------+

  ---------------------------------------------------------------------------------------------
  **Member 1 --- Backend**  **Member 2 --- AI**           **Member 3 ---      **Member 4 ---
                                                          Frontend**          Integration**
  ------------------------- ----------------------------- ------------------- -----------------
  Create API Gateway: REST  Integrate Polly: after        Replace all mock    Full end-to-end
  API with these routes:    Bedrock generates Hindi text, data calls with     test: open the
  POST /eligibility →       pipe it to Polly (voice:      Axios calls to      app, go through
  eligibility-engine POST   Aditi for Hindi, neural       Member 1\'s API     the chat flow as
  /twin →                   engine). Return a pre-signed  Gateway URL. Use    Kamla Devi,
  digital-twin-calculator   S3 URL for the audio file.    the                 verify scheme
  GET /scheme/{id} →        Test that the audio plays     VITE_API_BASE_URL   cards load from
  scheme-fetch GET          correctly.                    environment         the real API,
  /panchayat/{id} →                                       variable in         click through to
  panchayat-stats Enable                                  Amplify. Test each  Digital Twin,
  CORS on all routes.                                     page with real      verify chart
  Deploy to \'prod\' stage.                               data.               shows real data.
  Share the base URL.                                                         Document every
                                                                              bug found.

  Build Lambda 5:           Set up SNS topic              Add API error       Test the Lex +
  conflict-detector Input:  \'SarathiPanchayatAlerts\'.   handling: if any    Bedrock + Polly
  { matchedSchemes } Logic: Write Lambda 6:               API call fails,     pipeline
  check predefined conflict panchayat-notifier that fires fall back to mock   end-to-end.
  pairs (PMEGP + NRLM SHG,  when a household status       data silently       Record a screen
  MGNREGS + PMEGP, etc.)    changes to \'eligible\'.      (don\'t show error  video of it
  Output: conflicting       Trigger an SNS notification   to user during      working (not the
  pairs + recommended       with the household name and   demo). Add loading  final demo video
  optimal bundle Deploy and scheme list.                  skeleton states     --- just a test
  add route to API Gateway.                               while APIs are      recording for the
                                                          fetching.           team to review).
                                                                              Share in team
                                                                              chat.

  End-to-end performance    Optimize Bedrock latency: use Add the 3 demo      Fix all bugs
  check: use browser        streaming response if         personas to the     found in the
  DevTools Network tab to   possible. Cache scheme        Chat page as the    end-to-end test.
  measure API response      explanations in DynamoDB so   \'Demo Mode\' bar.  Coordinate
  times. Flag anything over the same scheme isn\'t        Clicking a persona  between Member 1
  2 seconds to Member 2 and re-explained on every         auto-fills          (backend) and
  Member 1 for              request.                      CitizenContext and  Member 3
  optimization.                                           plays back the      (frontend) to
                                                          conversation with a resolve each one.
                                                          typewriter effect.  Keep a running
                                                                              bug list in the
                                                                              shared doc.
  ---------------------------------------------------------------------------------------------

+-----------------------------------------------------------------------+
| **🕕 End of Day 3 Sync**                                              |
|                                                                       |
| Minimum acceptable: API Gateway is live. Frontend makes real API      |
| calls for at least the eligibility endpoint. Lex + Bedrock pipeline   |
| works (even without Polly audio is okay). This is the most critical   |
| sync --- surface problems early.                                      |
+-----------------------------------------------------------------------+

+---------+------------------------------------------------------------+
| **DAY   | **🎯 Day Goal:**                                           |
| 4**     |                                                            |
|         | App is feature-complete. All 3 demo scenarios work         |
| P       | perfectly. Panchayat login works. Demo scripts are         |
| olish + | finalized.                                                 |
| Demo    |                                                            |
| Prep    |                                                            |
+---------+------------------------------------------------------------+

  ---------------------------------------------------------------------------------
  **Member 1 ---       **Member 2 --- AI** **Member 3 ---    **Member 4 ---
  Backend**                                Frontend**        Integration**
  -------------------- ------------------- ----------------- ----------------------
  Performance          Multilingual        Panchayat         Set up Amazon Cognito
  hardening: add       polish: add proper  Dashboard: wire   user pool for
  DynamoDB indexes for Hindi slot prompts  to real           Panchayat login.
  faster queries. Add  to all Lex intents. panchayat-stats   Create test user:
  Lambda provisioned   Test that the bot   API. Village map  panchayat@sarathi.in /
  concurrency for the  responds in Hindi   shows real        Demo@1234. Add Cognito
  eligibility-engine   when user speaks    household status  auth to the Panchayat
  (so the first call   Hindi. Test English from DynamoDB.    route in the React
  isn\'t slow).        fallback.           Alerts panel      app.
  Monitor CloudWatch                       shows real        
  metrics.                                 SNS-triggered     
                                           alerts.           

  Add Lambda error     Test Polly audio in Final UI polish   Rehearse all 3 demo
  handling: wrap all   the actual React    pass: loading     scenarios 3 times
  Lambdas in           frontend (not just  skeletons         each. Time each one.
  try-catch, return    Postman). Ensure    everywhere, page  They must each be
  structured error     audio plays on      transitions,      under 3 minutes. Trim
  responses. Never     mobile browsers.    favicon, browser  the script if any runs
  return a 500 with a  Add a speaker icon  title per page,   long.
  raw error message.   button to trigger   404 page, mobile  
                       voice playback on   layout fixes.     
                       scheme cards.       This is the last  
                                           chance for visual 
                                           polish.           

  Tag all AWS          Final Lex testing:  Deploy latest     Write the demo script
  resources with       run through all     build to Amplify. document. Paste exact
  project tags:        edge cases --- user Test the live URL words to say for each
  Project=Sarathi,     gives unexpected    in incognito.     screen. Share with all
  Environment=prod.    answers, user types Test on mobile.   members. This is what
  This looks           in mixed            Verify            the demo video will
  professional in the  Hindi-English, user environment       follow.
  console if judges    changes their       variables are set 
  want to see it.      answer              correctly in      
                       mid-conversation.   Amplify console.  
                       Fix any crashes.                      
  ---------------------------------------------------------------------------------

+-----------------------------------------------------------------------+
| **🕕 End of Day 4 Sync**                                              |
|                                                                       |
| Minimum acceptable: All 3 demo scenarios work end-to-end on the live  |
| URL. Panchayat login works. No critical bugs remaining. Demo script   |
| exists and has been reviewed by all members.                          |
+-----------------------------------------------------------------------+

+---------+------------------------------------------------------------+
| **DAY   | **🎯 Day Goal:**                                           |
| 5**     |                                                            |
|         | Submit everything: GitHub repo, demo video, live URL. Team |
| Demo    | is done.                                                   |
| Video + |                                                            |
| Sub     |                                                            |
| mission |                                                            |
+---------+------------------------------------------------------------+

  ------------------------------------------------------------------------
  **Time**   **Task**                                **Who**
  ---------- --------------------------------------- ---------------------
  9--10 AM   Final bug bash --- everyone tests from  All members
             the live URL on a fresh browser. No     
             fixing new features, only critical bug  
             fixes.                                  

  10--11 AM  Record demo video. Member 4 narrates    Members 3 + 4
             following the demo script. Member 3     
             operates the live app on screen. Use    
             Loom, OBS, or QuickTime. Record 3-5     
             minutes.                                

  11 AM--12  Edit demo video --- cut dead air, add   Member 4
  PM         text overlays for service names, add    
             intro title card \'Sarathi --- AWS AI   
             for Bharat Hackathon\'. Export as MP4.  

  12--1 PM   Upload video to YouTube (unlisted).     Member 4
             Confirm share link works in incognito.  

  1--2 PM    Final GitHub cleanup: merge all feature Member 1
             branches to dev, merge dev to main,     
             delete stale branches, tag v1.0.        
             Confirm repo is public.                 

  2--3 PM    Write and finalize README: project      Member 4
             description, problem statement,         
             architecture diagram, AWS services      
             list, setup instructions, team names,   
             live URL, demo video link.              

  3--4 PM    Each member independently verifies: (1) All members
             GitHub link works, (2) Video link       
             plays, (3) Live URL loads, (4) App      
             works end-to-end on mobile. Flag any    
             last issues.                            

  4--5 PM    Submit the hackathon form. Double-check All members
  (buffer)   every field. Screenshot the             
             confirmation page.                      
  ------------------------------------------------------------------------

**Lambda Function Specifications**

Six Lambda functions power the entire Sarathi backend. Every function
should be written in Python 3.11. Below are the exact input/output
contracts Member 1 must implement.

**Lambda 1 --- eligibility-engine**

  -----------------------------------------------------------------------
  **Property**       **Detail**
  ------------------ ----------------------------------------------------
  Trigger            POST /eligibility via API Gateway

  Input              { \"age\": 55, \"state\": \"UP\", \"income\": 2000,
                     \"category\": \"SC\", \"isWidow\": true,
                     \"occupation\": \"none\", \"gender\": \"female\" }

  Logic              Scan Schemes table. For each scheme, check: age
                     range, income limit, category, gender, isWidow,
                     state restrictions. Return all matching schemes.

  Output             { \"citizenId\": \"generated-uuid\",
                     \"matchedSchemes\": \[ { \"schemeId\": \"pm-kisan\",
                     \"nameHindi\": \"\...\", \"annualBenefit\": 6000,
                     \"matchScore\": 0.95 } \], \"totalAnnualBenefit\":
                     64800 }

  Timeout            10 seconds

  Memory             256 MB
  -----------------------------------------------------------------------

**Lambda 2 --- digital-twin-calculator**

  -----------------------------------------------------------------------
  **Property**       **Detail**
  ------------------ ----------------------------------------------------
  Trigger            POST /twin via API Gateway

  Input              { \"citizenProfile\": {\...}, \"matchedSchemes\":
                     \[\...\] }

  Logic              Sequence schemes easiest-to-enroll first. Project
                     monthly income month by month for 36 months. Scheme
                     monthly impact = annualBenefit / 12. Return 3
                     pathways: best (all schemes), medium (top 5),
                     minimum (top 3).

  Output             { \"currentIncome\": 2000, \"povertyLine\": 8000,
                     \"pathways\": { \"best\": \[{ \"month\": 1,
                     \"income\": 2800, \"scheme\": \"PM Ujjwala\" },
                     \...36 entries\], \"medium\": \[\...\], \"minimum\":
                     \[\...\] }, \"monthsToPovertyExit\": { \"best\": 29,
                     \"medium\": 38, \"minimum\": null } }

  Timeout            10 seconds

  Memory             256 MB
  -----------------------------------------------------------------------

**Lambda 3 --- bedrock-explainer**

  -----------------------------------------------------------------------
  **Property**       **Detail**
  ------------------ ----------------------------------------------------
  Trigger            Called internally by eligibility-engine (not
                     directly exposed via API Gateway)

  Input              { \"scheme\": { \"nameHindi\": \"\...\",
                     \"annualBenefit\": 6000, \"eligibility\": {\...} } }

  Prompt Template    \"You are a helpful welfare advisor in India.
                     Explain this government scheme in 2 simple sentences
                     in Hindi that an illiterate rural villager can
                     understand. Scheme: {schemeJSON}. Do not use any
                     English words. Use very simple Hindi.\"

  Model              anthropic.claude-haiku-4-5 (cheapest and fastest)

  Output             { \"explanationHindi\": \"यह योजना किसानों को हर साल
                     ₹6,000 देती है\...\", \"audioUrl\":
                     \"https://s3\.../audio.mp3\" }

  Timeout            15 seconds

  Memory             512 MB
  -----------------------------------------------------------------------

**Lambda 4 --- panchayat-stats**

  -----------------------------------------------------------------------
  **Property**       **Detail**
  ------------------ ----------------------------------------------------
  Trigger            GET /panchayat/{panchayatId} via API Gateway
                     (requires Cognito auth)

  Input              Path parameter: panchayatId

  Logic              Query Citizens table by panchayatId index. Count by
                     status. Build alert list from households with
                     eligible-but-not-enrolled status.

  Output             { \"panchayatName\": \"Rampur Panchayat\",
                     \"totalHouseholds\": 487, \"enrolled\": 312,
                     \"eligibleNotEnrolled\": 87, \"zeroBenefits\": 34,
                     \"households\": \[\...\], \"alerts\": \[ { \"type\":
                     \"widow_pension\", \"count\": 8, \"urgency\":
                     \"high\" } \] }

  Timeout            10 seconds

  Memory             256 MB
  -----------------------------------------------------------------------

**Lambda 5 --- conflict-detector**

  -----------------------------------------------------------------------
  **Property**       **Detail**
  ------------------ ----------------------------------------------------
  Trigger            Called internally by eligibility-engine

  Input              { \"matchedSchemes\": \[\"pmegp\", \"nrlm-shg\",
                     \"mgnregs\"\] }

  Conflict Rules     PMEGP + NRLM SHG → mutually exclusive MGNREGS +
  (hardcode these)   PMEGP → income conflict Jan Dhan + Kisan Credit Card
                     → choose one based on occupation PM Kisan + Kisan
                     Credit Card → compatible (both allowed)

  Output             { \"conflicts\": \[{ \"scheme1\": \"pmegp\",
                     \"scheme2\": \"nrlm-shg\", \"reason\": \"Cannot
                     receive both entrepreneurship loans
                     simultaneously\", \"recommendedChoice\":
                     \"nrlm-shg\", \"reasoning\": \"Lower interest rate,
                     better for first-time borrowers\" }\],
                     \"optimalBundle\": \[\"nrlm-shg\", \"pmay\",
                     \"ujjwala\", \"mgnregs\"\], \"totalBundleValue\":
                     48600 }

  Timeout            5 seconds

  Memory             128 MB
  -----------------------------------------------------------------------

**DynamoDB Table Schemas**

**Table 1: SarathiSchemes**

  ---------------------------------------------------------------------------------------
  **Attribute**       **Type**   **Example Value**            **Notes**
  ------------------- ---------- ---------------------------- ---------------------------
  schemeId (PK)       String     \"pm-kisan\"                 Kebab-case, unique

  nameHindi           String     \"प्रधानमंत्री किसान सम्मान      
                                 निधि\"                       

  nameEnglish         String     \"PM-KISAN\"                 

  category            String     \"agriculture\"              One of 6 categories

  annualBenefit       Number     6000                         In rupees

  ministry            String     \"Ministry of Agriculture\"  

  eligibilityRules    Map        { \"maxIncome\": null,       Used by Lambda
                                 \"minAge\": 18, \"gender\":  
                                 \"any\" }                    

  documentsRequired   List       \[\"Aadhaar\", \"Land        
                                 Records\"\]                  

  applyUrl            String     \"https://pmkisan.gov.in\"   Real GOI URL
  ---------------------------------------------------------------------------------------

**Table 2: SarathiCitizens**

  -----------------------------------------------------------------------------------
  **Attribute**     **Type**   **Example Value**          **Notes**
  ----------------- ---------- -------------------------- ---------------------------
  citizenId (PK)    String     \"uuid-v4\"                Generated on first
                                                          eligibility check

  name              String     \"Kamla Devi\"             

  age               Number     55                         

  state             String     \"UP\"                     

  monthlyIncome     Number     2000                       

  category          String     \"SC\"                     

  isWidow           Boolean    true                       

  panchayatId       String     \"rampur-barabanki-up\"    Links to panchayat

  matchedSchemes    List       \[\"pm-ujjwala\",          Updated on each check
                               \"pmay\",                  
                               \"widow-pension\"\]        

  enrolledSchemes   List       \[\"pm-ujjwala\"\]         Schemes actually enrolled
                                                          in

  status            String     \"eligible\"               enrolled / eligible / none

  createdAt         String     \"2025-02-27T09:00:00Z\"   ISO timestamp
  -----------------------------------------------------------------------------------

**API Gateway Routes Reference**

  ------------------------------------------------------------------------------------------------
  **Method**   **Path**                   **Auth**   **Lambda**                **Used By**
  ------------ -------------------------- ---------- ------------------------- -------------------
  POST         /eligibility               None       eligibility-engine        Chat page after
                                          (public)                             intake

  POST         /twin                      None       digital-twin-calculator   Digital Twin page
                                          (public)                             

  GET          /scheme/{schemeId}         None       scheme-fetch              Scheme Detail page
                                          (public)                             

  GET          /panchayat/{panchayatId}   Cognito    panchayat-stats           Panchayat Dashboard
                                          JWT                                  

  POST         /citizen                   None       citizen-save              Chat page --- save
                                          (public)                             profile

  GET          /schemes                   None       schemes-list              Browse all schemes
                                          (public)                             page
  ------------------------------------------------------------------------------------------------

+-----------------------------------------------------------------------+
| **CORS Configuration**                                                |
|                                                                       |
| Add these headers to every API Gateway response:                      |
| Access-Control-Allow-Origin: \* (change to your Amplify domain before |
| submission) Access-Control-Allow-Headers: Content-Type, Authorization |
| Access-Control-Allow-Methods: GET, POST, OPTIONS Without CORS, the    |
| frontend will get blocked by the browser and nothing will work.       |
+-----------------------------------------------------------------------+

**Remote Collaboration Protocol**

Five days of remote work with four people across different locations
requires a precise operating model. Vague communication kills hackathon
teams. Follow this exactly.

**Daily Rhythm**

  -----------------------------------------------------------------------------------
  **Time**   **Format**       **Duration**   **Who Runs     **What Happens**
                                             It**           
  ---------- ---------------- -------------- -------------- -------------------------
  9:00 AM    Video call       15 min         Member 4       Each person says: Done
             (Google Meet /                                 yesterday / Doing today /
             Zoom)                                          Blocker. No long
                                                            explanations. If a
                                                            blocker can\'t be solved
                                                            in 2 minutes, it goes to
                                                            async.

  1:00 PM    Async ---        No call        Self-managed   Each person posts a
             WhatsApp/Slack                                 screenshot of their
                                                            current progress in the
                                                            team group. No response
                                                            required --- just
                                                            visibility.

  6:00 PM    Video call       20 min         Member 4       Each person demos what
                                                            they built today (share
                                                            screen). Merge any ready
                                                            PRs. Agree on tomorrow\'s
                                                            priorities.

  Anytime    GitHub PR        Async          Each member    Open a PR when a feature
                                                            is complete. Request
                                                            review from Member 4.
                                                            Never merge to main
                                                            without a review.
  -----------------------------------------------------------------------------------

**Communication Rules**

-   **One shared group: WhatsApp or Slack. Everyone responds within 2
    hours during work hours. No exceptions.**

-   If you are blocked for more than 90 minutes on anything, you post in
    the group immediately. Do not silently struggle.

-   If you need a decision from another member, tag them directly with a
    clear question and a deadline: \'@Member1 do we use DynamoDB Scan or
    Query for eligibility? Need answer by 3 PM.\'

-   No meeting for things that can be a message. No message for things
    that need a meeting.

-   All decisions that affect more than one member get documented in the
    shared Google Doc. Not just discussed --- written down.

**GitHub Branching Strategy**

  -----------------------------------------------------------------------------------
  **Branch**               **Purpose**      **Who Merges To **Rules**
                                            It**            
  ------------------------ ---------------- --------------- -------------------------
  main                     Production ---   Member 4 only   Only receives merges from
                           what judges see                  dev. Every merge = a
                                                            deployed version. Tagged
                                                            with version numbers.

  dev                      Integration      All members     All PRs go here first.
                           branch ---       (via PR)        Member 4 reviews. Only
                           tested features                  working code merges here.

  feature/m1-backend       Member 1\'s work Member 1        One branch per feature
                                            pushes, PR to   area. Commit often (at
                                            dev             least twice per day).

  feature/m2-ai            Member 2\'s work Member 2        
                                            pushes, PR to   
                                            dev             

  feature/m3-frontend      Member 3\'s work Member 3        
                                            pushes, PR to   
                                            dev             

  feature/m4-integration   Member 4\'s work Member 4        
                                            pushes, PR to   
                                            dev             
  -----------------------------------------------------------------------------------

-   Commit message format: \[M1\] Add eligibility Lambda function \|
    \[M3\] Wire CitizenContext to Chat page \| \[M4\] Fix CORS error on
    /eligibility endpoint

-   Never commit: .env files, AWS credentials, node_modules, or any file
    with API keys. Add all of these to .gitignore on Day 1.

-   Never force-push to main or dev.

**Shared Resources Setup (Do on Day 1)**

  -------------------------------------------------------------------------
  **Resource**   **Tool**     **Who Creates **What Goes In It**
                              It**          
  -------------- ------------ ------------- -------------------------------
  Team chat      WhatsApp     Anyone        All communication. Pin the
                 group or                   GitHub link, Amplify URL, and
                 Slack                      AWS console login link at the
                                            top.

  API contract   Google Docs  Member 4      Every API endpoint, request
  doc                                       format, response format. Both
                                            Member 1 and Member 3 must
                                            agree before any code is
                                            written.

  Bug tracker    GitHub       Member 4      Every bug found during testing.
                 Issues or                  Columns: Bug description, Found
                 Google Sheet               by, Assigned to, Priority
                                            (P0/P1/P2), Status.

  Postman        Postman      Member 4      Every API endpoint. Shared with
  workspace                                 all members. Use Postman
                                            environments for local vs. API
                                            Gateway URL.

  AWS            AWS Secrets  Member 1      No credentials in code. Every
  credentials    Manager                    Lambda reads secrets from
                                            Secrets Manager. Frontend reads
                                            from Amplify environment
                                            variables.

  Architecture   draw.io or   Member 4      Visual map of all AWS services
  diagram        Excalidraw                 and how they connect. Include
                                            in README and demo video.
  -------------------------------------------------------------------------

**Decision-Making Rules**

-   Technical decisions within your domain: you decide. No committee.

-   Technical decisions that cross domains (e.g., API contract changes,
    database schema changes): both members involved must agree. If no
    agreement in 10 minutes, Member 4 makes the call.

-   Scope decisions (cutting or adding features): requires a quick call
    with all 4 members. This is the only decision that needs everyone.

-   If a feature is taking twice as long as expected, cut it. A polished
    80% is worth more than a broken 100%.

**The 3 Demo Scenarios**

Member 4 owns these scripts. They must be written out word for word,
rehearsed before Day 5, and followed during the demo video recording.
Each scenario highlights a different product pillar.

**Scenario 1: Kamla Devi --- The Voice-First Citizen (Pillar:
Inclusivity)**

  -----------------------------------------------------------------------------
  **Step**   **What Happens on         **What You Say**
             Screen**                  
  ---------- ------------------------- ----------------------------------------
  1          Open app on mobile. Click Meet Kamla Devi. 55 years old, widow,
             \'Demo Mode: Kamla Devi\' lives in rural Uttar Pradesh. She cannot
                                       read. She has never used a smartphone.

  2          Conversation auto-plays:  Sarathi speaks to her in Hindi, collects
             6 questions in Hindi,     her profile --- no reading required.
             answers selected          Just her voice.

  3          8 scheme cards cascade    Sarathi found 8 government schemes she
             into Results Panel        qualifies for. She has been eligible for
                                       years. Nobody told her.

  4          Click PM Ujjwala card --- She doesn\'t need to read this. Sarathi
             Polly reads explanation   reads it to her.
             aloud                     

  5          Click \'Digital Twin देखें   This is not just about today. Sarathi
             →\'. Chart loads with her shows Kamla Devi the next 3 years ---
             3-year projection.        and the path out of poverty.

  6          Highlight the poverty     In 2 years and 5 months, Kamla Devi
             line crossing point on    crosses the poverty line. For the first
             the chart                 time in her life, there is a roadmap.
  -----------------------------------------------------------------------------

**Scenario 2: Ramu Prasad --- The Migrant Worker (Pillar: Portability)**

  -----------------------------------------------------------------------------
  **Step**   **What Happens on         **What You Say**
             Screen**                  
  ---------- ------------------------- ----------------------------------------
  1          Click \'Demo Mode: Ramu   Ramu is from Bihar. He moved to Mumbai
             Prasad\'. Chat auto-fills for construction work. When he crossed
             his profile.              the state border, his benefits
                                       disappeared.

  2          Results show Bihar        Sarathi doesn\'t just show him Bihar
             schemes and Maharashtra   schemes. It translates them --- finds
             equivalents side by side  the closest equivalent in Maharashtra.

  3          Conflict Resolver widget  Ramu was about to take two loans that
             lights up with a warning  conflict. Sarathi stopped him from
                                       making a ₹15,000 mistake.

  4          Optimal bundle shown: 4   The optimal combination. Maximum
             schemes, ₹42,000/year     benefit. Zero conflicts. This took 3
             total                     seconds.
  -----------------------------------------------------------------------------

**Scenario 3: Panchayat Secretary --- The Village View (Pillar:
Proactive Outreach)**

  -----------------------------------------------------------------------------
  **Step**   **What Happens on         **What You Say**
             Screen**                  
  ---------- ------------------------- ----------------------------------------
  1          Login to Panchayat        Now from the other side. This is the
             Dashboard with demo       Gram Panchayat secretary in Barabanki,
             credentials               Uttar Pradesh.

  2          Village map loads with    Every dot is a household. Green is
             green, orange, and red    receiving benefits. Orange is eligible
             dots                      but not enrolled. Red is receiving
                                       nothing at all.

  3          Zoom into orange cluster  87 households eligible but not enrolled.
             in Ward 3. Alert appears. Sarathi found them automatically. No
                                       manual checking required.

  4          Click alert: \'8 widows   8 widows in this village have been
             missing pension\'         eligible for widow pension for years.
                                       Sarathi found them in 3 seconds.

  5          Show proactive alert: \'5 Sarathi doesn\'t wait for problems. It
             girls turning 18 next     predicts them. These 5 girls haven\'t
             month --- scholarship     turned 18 yet --- but their documents
             applications needed\'     need to be ready now.

  6          Governance heatmap ---    And this is accountability. Every ward,
             Ward 3 is red for health  every scheme, every month. The Panchayat
             schemes                   can no longer say they didn\'t know.
  -----------------------------------------------------------------------------

**Final Submission Checklist**

Every item must be verified by a second person before the submission
form is submitted. No self-verification for critical items.

**GitHub Repository**

  --- ------------------------------------------------- ------------------
  ☐   Repository is public (or shared with judges)      **Member 1**

  --- ------------------------------------------------- ------------------

  --- ------------------------------------------------- ------------------
  ☐   All feature branches merged to main               **Member 1**

  --- ------------------------------------------------- ------------------

  --- ------------------------------------------------- ------------------
  ☐   Repository tagged v1.0                            **Member 1**

  --- ------------------------------------------------- ------------------

  --- ------------------------------------------------- ------------------
  ☐   No .env files, API keys, or credentials in any    **Member 4
      commit                                            verifies**

  --- ------------------------------------------------- ------------------

  --- ------------------------------------------------- ------------------
  ☐   README contains: project description, problem,    **Member 4**
      architecture diagram, AWS services, setup         
      instructions, team names, live URL, video link    

  --- ------------------------------------------------- ------------------

  --- ------------------------------------------------- ------------------
  ☐   DEMO.md contains step-by-step instructions to run **Member 4**
      each of the 3 demo scenarios                      

  --- ------------------------------------------------- ------------------

**Live URL**

  --- ------------------------------------------------- ------------------
  ☐   App loads from the Amplify URL in an incognito    **Member 3**
      Chrome window                                     

  --- ------------------------------------------------- ------------------

  --- ------------------------------------------------- ------------------
  ☐   App loads on a mobile browser (iOS Safari and     **Member 3**
      Android Chrome)                                   

  --- ------------------------------------------------- ------------------

  --- ------------------------------------------------- ------------------
  ☐   All 3 demo scenarios run end-to-end on the live   **Member 4**
      URL without errors                                

  --- ------------------------------------------------- ------------------

  --- ------------------------------------------------- ------------------
  ☐   Panchayat login works with demo credentials       **Member 4**

  --- ------------------------------------------------- ------------------

  --- ------------------------------------------------- ------------------
  ☐   No console errors in browser DevTools on the      **Member 3**
      landing page                                      

  --- ------------------------------------------------- ------------------

**Demo Video**

  --- ------------------------------------------------- ------------------
  ☐   Video is 3--5 minutes (not shorter, not longer)   **Member 4**

  --- ------------------------------------------------- ------------------

  --- ------------------------------------------------- ------------------
  ☐   Video shows all 3 demo scenarios with the live    **Member 4**
      app, not slides                                   

  --- ------------------------------------------------- ------------------

  --- ------------------------------------------------- ------------------
  ☐   AWS services are named on screen at some point    **Member 4**
      (either verbally or text overlay)                 

  --- ------------------------------------------------- ------------------

  --- ------------------------------------------------- ------------------
  ☐   Architecture diagram is shown for at least 10     **Member 4**
      seconds                                           

  --- ------------------------------------------------- ------------------

  --- ------------------------------------------------- ------------------
  ☐   Video is uploaded to YouTube as unlisted, link is **Member 4**
      shareable in incognito                            

  --- ------------------------------------------------- ------------------

  --- ------------------------------------------------- ------------------
  ☐   Audio is clear, no background noise, narration is **Member 4**
      in English                                        

  --- ------------------------------------------------- ------------------

**AWS Hygiene**

  --- ------------------------------------------------- ------------------
  ☐   Billing alerts are set at \$40, \$70, \$90        **Member 1**

  --- ------------------------------------------------- ------------------

  --- ------------------------------------------------- ------------------
  ☐   All Lambda functions are deployed to \'prod\'     **Member 1**
      stage                                             

  --- ------------------------------------------------- ------------------

  --- ------------------------------------------------- ------------------
  ☐   API Gateway is deployed (not just saved)          **Member 1**

  --- ------------------------------------------------- ------------------

  --- ------------------------------------------------- ------------------
  ☐   All DynamoDB tables have data --- no empty tables **Member 1**
      in a demo                                         

  --- ------------------------------------------------- ------------------

  --- ------------------------------------------------- ------------------
  ☐   No test resources left running (unused EC2,       **Member 1**
      Neptune, etc.)                                    

  --- ------------------------------------------------- ------------------

***\"हर पात्र नागरिक तक।\"***

*To every eligible citizen.*

Good luck, Team Sarathi.
