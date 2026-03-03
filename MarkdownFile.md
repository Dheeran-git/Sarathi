| SARATHIMember 3 — Frontend Completion LeadFull 5-Day Execution Plan |
| --- |

# Your Role at a Glance

| Title | Frontend Completion Lead |
| --- | --- |
| Strengths | React, UI/UX |
| Branch | feature/m3-frontend → PR to dev → Member 4 reviews → merges to main |
| Commit Format | [M3] Wire CitizenContext to Chat page |
| Your AWS Touch | AWS Amplify only (hosting + deployment). You do NOT touch any other AWS service. |
| Core ResponsibilityEverything the user sees and interacts with is yours. From state management, to API integration, to demo personas, to the final UI polish — the app's look and feel on demo day is your responsibility. |
| --- |
| DAY 1 — Foundation — Deploy, Context, Chat State Machine |
| --- |

## 1\. Deploy to AWS Amplify Immediately

*   Go to AWS Amplify console and connect your GitHub repo
*   Set build command: npm run build
*   Set publish directory: dist
*   Hit deploy — even if the app is static/empty, get the live URL today
*   Share the live URL in the team chat the moment it is available

## 2\. Build Global State

*   Create CitizenContext.jsx — holds the citizen profile data across all pages
*   Create LanguageContext.jsx — holds the selected language (Hindi / English)
*   Wrap App.jsx in both providers
*   Verify: navigate between pages and confirm context does not reset

## 3\. Build the Chat Page State Machine (Part 1)

*   Create conversationScript.js with all 6 steps: name, age, state, income, category, situation
*   Implement the state machine: show question → wait for answer → show next question → update CitizenContext

End of Day 1 minimum: Amplify URL is live and shared. CitizenContext and LanguageContext are working. Chat page shows at least the first question.

| DAY 2 — Core Engine — Complete Chat Flow + Wire Digital Twin |
| --- |

## 1\. Complete the Chat Page State Machine (Part 2)

*   Finish all 6 intake steps in the Chat page
*   Each answer must update CitizenContext correctly
*   After step 6, the flow should auto-advance to eligibility matching

## 2\. Wire the Local Eligibility Matcher

*   After step 6 completes, call matchSchemes(citizenProfile, mockSchemes) using local mockSchemes.js
*   Display real scheme result cards in the Results Panel — no API needed yet
*   Scheme cards should show: name, annual benefit, match score

## 3\. Wire the Digital Twin Page

*   Connect Digital Twin page to CitizenContext
*   Chart header should display the citizen's name from context
*   Timeline should list their actual matched schemes in correct order

End of Day 2 minimum: Chat page shows real matched schemes (even from local mock data). Digital Twin page reads from CitizenContext.

| DAY 3 — Integration — Real APIs + Demo Personas + Performance |
| --- |

## 1\. Replace Mock Data with Real API Calls

*   Wait for Member 4 to confirm each endpoint from Member 1 is live
*   Replace mockSchemes.js calls with real Axios calls to the API Gateway URL
*   Use environment variable: VITE\_API\_BASE\_URL (set this in Amplify console)
*   Keep mock data as a silent fallback — if API is down, fall back without showing an error

## 2\. Add API Error Handling + Loading States

*   Wrap every API call in try/catch
*   On failure: silently fall back to mock data (do not show error screen during demo)
*   Add loading skeleton states on every page while data is being fetched

## 3\. Add the 3 Demo Personas (Demo Mode Bar)

*   Add a visible 'Demo Mode' bar in the Chat page with 3 clickable buttons
*   Kamla Devi — 55 years, widow, UP, BPL
*   Ramu Prasad — 30 years, migrant, Bihar, income 8000
*   Meena Ji — Panchayat secretary, Rajasthan
*   Clicking a persona: auto-fills CitizenContext with their data AND plays back the conversation with a typewriter/auto-play effect

## 4\. Performance Check

*   Open browser DevTools → Network tab
*   Measure API response times for every endpoint
*   Flag anything over 2 seconds to Members 1 and 2 in the team chat

End of Day 3 minimum: Frontend makes real API calls for at least the eligibility endpoint. Demo Mode bar works for all 3 personas. This is the most critical sync of the sprint.

| DAY 4 — Polish — Dashboard, UI Finish, Mobile Testing |
| --- |

## 1\. Wire Panchayat Dashboard to Real API

*   Connect dashboard to the real panchayat-stats API endpoint
*   Village map must show real household status from DynamoDB
*   Alerts panel must show real SNS-triggered alerts

## 2\. Full UI Polish Pass (Final Chance)

*   Loading skeletons on every data-loading section
*   Page transitions between routes
*   Favicon — add it now
*   Browser tab title per page (e.g. 'Sarathi - Chat', 'Sarathi - Results')
*   404 page for undefined routes
*   Mobile layout fixes — every page must look correct on a phone screen

## 3\. Deploy + Verify on Live URL

*   Deploy the latest build to Amplify
*   Open the live URL in a fresh incognito Chrome window — verify it loads cleanly
*   Test on mobile (iOS Safari and Android Chrome)
*   Confirm all environment variables are correctly set in Amplify console

End of Day 4 minimum: All 3 demo scenarios work end-to-end on the live URL. No critical visual bugs. App loads perfectly on mobile.

| DAY 5 — Demo Video + Final Submission |
| --- |

## Morning Bug Bash (9–10 AM — with team)

*   Test everything from the live URL on a fresh browser
*   No new features today — only fix critical bugs

## Record Demo Video (10–11 AM — with Member 4)

*   Member 4 narrates following the demo script
*   You operate the live app on screen — smooth, no hesitation
*   Use Loom, OBS, or QuickTime to record
*   Target: 3 to 5 minutes

## Your Final Submission Checklist

| Task | Done When |
| --- | --- |
| App loads from Amplify URL in incognito Chrome | Second person verifies |
| App loads on mobile — iOS Safari and Android Chrome | Member 4 verifies |
| All 3 demo scenarios run end-to-end on live URL without errors | Member 4 verifies |
| No console errors in browser DevTools on the landing page | You verify |
| Panchayat login works with demo credentials | Member 4 verifies |

# Key Things to Always Remember

| You own ZERO AWS services except AmplifyEvery other AWS service (Lambda, DynamoDB, API Gateway, Lex, Bedrock, Polly, Cognito, SNS) is owned by Members 1 and 2. Your only AWS interaction is Amplify deployment. |
| --- |
| Mock data is your safety netNever let the demo break because the backend is slow or down. Always fall back to mock data silently. The user should never see an error screen during a demo. |
| --- |
| Day 3 is your most critical dayThis is when frontend meets backend. Stay on top of the team chat. The moment Member 4 confirms an endpoint is ready, wire it up immediately. Speed matters. |
| --- |
| Coordinate with Member 4 constantlyMember 4 tests your API integrations and tells you when each endpoint from Member 1 is ready. They also own the demo script — follow it exactly during the recording. |
| --- |
| Do not break the live URLThe live Amplify URL is what judges will see. Every time you push to main, the URL updates. Always test in incognito after every Amplify deployment. |
| --- |
| "Every eligible citizen deserves to know."Good luck, Member 3. The app's soul is yours. |
| --- |