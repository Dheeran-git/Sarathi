# Sarathi — Frontend UI/UX Specification
### Version 1.0 | Hackathon Prototype | For use with Claude Code, Cursor, v0, Lovable

---

## TABLE OF CONTENTS

1. [Design Philosophy & Aesthetic Direction](#1-design-philosophy--aesthetic-direction)
2. [Design System — Tokens](#2-design-system--tokens)
3. [Typography System](#3-typography-system)
4. [Component Library](#4-component-library)
5. [App Architecture — Pages & Routes](#5-app-architecture--pages--routes)
6. [Page 1: Landing Page](#6-page-1-landing-page)
7. [Page 2: Citizen Chat Interface](#7-page-2-citizen-chat-interface)
8. [Page 3: Welfare Digital Twin Dashboard](#8-page-3-welfare-digital-twin-dashboard)
9. [Page 4: Panchayat Dashboard](#9-page-4-panchayat-dashboard)
10. [Page 5: Scheme Detail Page](#10-page-5-scheme-detail-page)
11. [Responsive Design Rules](#11-responsive-design-rules)
12. [Animations & Micro-interactions](#12-animations--micro-interactions)
13. [Accessibility Requirements](#13-accessibility-requirements)
14. [Tech Stack & Setup Instructions](#14-tech-stack--setup-instructions)
15. [Claude Code Prompts — Copy-Paste Ready](#15-claude-code-prompts--copy-paste-ready)

---

## 1. Design Philosophy & Aesthetic Direction

### The Concept: "Warm Intelligence"

Sarathi is not a cold government portal. It is not a flashy startup app either. It sits in a unique space: **deeply human and warm, but clearly intelligent and trustworthy**. The design must feel like a knowledgeable, kind elder from the village — not a robot, not a bureaucrat.

The visual language is inspired by:
- **Indian terracotta pottery** — earthy, warm, grounded
- **Government documents with a modern soul** — structured and credible, but approachable
- **Sunrise gradients** — hope, new beginnings, the promise of support

### Aesthetic Direction: "Earthy Warmth Meets Quiet Precision"

- **NOT**: Purple gradients on white (generic SaaS)
- **NOT**: Bootstrap blue government portal
- **NOT**: Dark hacker aesthetic
- **YES**: Warm saffron/terracotta accent on deep navy
- **YES**: Generous white space with intentional density in data areas
- **YES**: Calm, trustworthy, and warm — like a CSC center run by someone who actually cares

### The One Thing Judges Will Remember

When the Panchayat dashboard loads, there is a **live animated map of a village** with glowing dots for each household, color-coded by welfare status. Green = receiving benefits. Orange = eligible but not enrolled. Red = no benefits at all. This is the hero visual of the entire product. It should feel slightly cinematic — like watching a satellite view come to life.

### Design Principles

1. **Voice-first, visual-second** — Every screen has a voice/audio affordance visible. The UI acknowledges that the end user may not be the one looking at the screen (a Panchayat official may be operating the app on behalf of a citizen).
2. **Density when needed, space when not** — The landing page breathes. The dashboard is information-dense but never cluttered.
3. **Hindi-first copy** — All UI labels appear in both Hindi (Devanagari) and English. English is the subtitle. Hindi is the main label.
4. **Trust signals everywhere** — Government logos, scheme names from actual GOI portals, real rupee amounts. Nothing fake-looking.
5. **Progress is celebrated** — When a citizen qualifies for a new scheme or enrolls, there is a moment of delight — a small animation, a warm success state.

---

## 2. Design System — Tokens

### Color Palette

```css
:root {
  /* Primary Brand */
  --color-saffron: #E8740C;         /* Main CTA, active states, highlights */
  --color-saffron-light: #F9A54A;   /* Hover states, secondary accents */
  --color-saffron-pale: #FEF3E7;    /* Backgrounds for highlighted sections */

  /* Deep Navy — Primary Background & Text */
  --color-navy: #0F2240;            /* Main dark background, headers */
  --color-navy-mid: #1A3A5C;        /* Card backgrounds in dark sections */
  --color-navy-light: #2A5280;      /* Borders, dividers in dark sections */

  /* Neutrals */
  --color-white: #FFFFFF;
  --color-off-white: #F8F7F4;       /* Page background (slightly warm white) */
  --color-gray-100: #F2F0EC;
  --color-gray-200: #E5E2DA;
  --color-gray-300: #C8C3B8;
  --color-gray-500: #8A8578;
  --color-gray-700: #4A4740;
  --color-gray-900: #1C1A17;        /* Body text */

  /* Semantic Colors */
  --color-success: #1A7F4B;         /* Enrolled, eligible, positive */
  --color-success-light: #E8F5EE;
  --color-warning: #C87B00;         /* Eligible but not enrolled, attention */
  --color-warning-light: #FFF3DC;
  --color-danger: #C0392B;          /* Ineligible, errors, critical */
  --color-danger-light: #FDEDEC;
  --color-info: #1565A8;            /* Informational, neutral guidance */
  --color-info-light: #E8F0FB;

  /* Special — Village Map */
  --color-enrolled: #00C851;        /* Bright green dot — receiving benefits */
  --color-eligible: #FF8800;        /* Amber dot — eligible but not enrolled */
  --color-none: #E53935;            /* Red dot — zero benefits */
  --color-unknown: #78909C;         /* Gray dot — data not collected */
}
```

### Spacing Scale

```css
:root {
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 20px;
  --space-6: 24px;
  --space-8: 32px;
  --space-10: 40px;
  --space-12: 48px;
  --space-16: 64px;
  --space-20: 80px;
  --space-24: 96px;
}
```

### Border Radius

```css
:root {
  --radius-sm: 6px;
  --radius-md: 12px;
  --radius-lg: 20px;
  --radius-xl: 32px;
  --radius-full: 9999px;
}
```

### Shadows

```css
:root {
  --shadow-sm: 0 1px 3px rgba(15, 34, 64, 0.08);
  --shadow-md: 0 4px 16px rgba(15, 34, 64, 0.12);
  --shadow-lg: 0 8px 32px rgba(15, 34, 64, 0.16);
  --shadow-saffron: 0 4px 20px rgba(232, 116, 12, 0.30);
  --shadow-card: 0 2px 8px rgba(15, 34, 64, 0.08), 0 1px 2px rgba(15, 34, 64, 0.04);
}
```

---

## 3. Typography System

### Font Choices

**Display Font**: `Playfair Display` (Google Fonts)
- Used for: Hero headlines, section titles, the word "Sarathi" in the header
- Feel: Elegant, authoritative, slightly traditional — like a respected newspaper

**Body Font**: `DM Sans` (Google Fonts)
- Used for: All body text, UI labels, buttons, descriptions
- Feel: Friendly, legible, modern — approachable without being casual

**Devanagari Font**: `Noto Sans Devanagari` (Google Fonts)
- Used for: All Hindi text labels and UI copy
- Must be loaded alongside DM Sans — they pair well

**Monospace (for data)**: `JetBrains Mono` (Google Fonts)
- Used for: Rupee amounts, percentages, statistics in the dashboard
- Feel: Precise, technical — makes numbers feel trustworthy

### Font Loading (Add to index.html)

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700;800&family=DM+Sans:wght@300;400;500;600&family=Noto+Sans+Devanagari:wght@400;500;600&family=JetBrains+Mono:wght@400;600&display=swap" rel="stylesheet">
```

### Type Scale

```css
:root {
  /* Display — Playfair Display */
  --text-display-xl: 72px / 1.1 / -2px;   /* Hero headline */
  --text-display-lg: 52px / 1.15 / -1.5px; /* Section heroes */
  --text-display-md: 38px / 1.2 / -1px;    /* Page titles */
  --text-display-sm: 28px / 1.3 / -0.5px;  /* Card titles */

  /* Body — DM Sans */
  --text-body-xl: 20px / 1.6;   /* Large intro paragraphs */
  --text-body-lg: 18px / 1.6;   /* Body text */
  --text-body-md: 16px / 1.6;   /* Default body */
  --text-body-sm: 14px / 1.5;   /* Secondary text, captions */
  --text-body-xs: 12px / 1.4;   /* Labels, tags, fine print */

  /* Data — JetBrains Mono */
  --text-data-lg: 32px / 1.2;   /* Big stats */
  --text-data-md: 20px / 1.3;   /* Medium stats */
  --text-data-sm: 14px / 1.4;   /* Table data */
}
```

---

## 4. Component Library

Document each component that appears across multiple pages. Build these as reusable React components before building any page.

---

### 4.1 Navigation Bar (Navbar)

**Appearance:**
- Fixed to top of the screen, always visible
- Background: `--color-navy` with a very subtle bottom border of `--color-navy-light`
- Height: 64px on desktop, 56px on mobile
- Slightly frosted when scrolled (backdrop-filter: blur(12px); background: rgba(15, 34, 64, 0.92))

**Left side:**
- The word "सारथी" in Playfair Display 24px, `--color-saffron`
- Subtitle "Sarathi" in DM Sans 12px, `--color-gray-300`, below it
- These two are stacked vertically and act as the home link

**Center (desktop only):**
- Navigation links: "नागरिक" (Citizens), "पंचायत" (Panchayat), "योजनाएं" (Schemes), "हमारे बारे में" (About)
- Each link: DM Sans 15px, `--color-gray-300`, uppercase letter-spacing 0.5px
- Active link: `--color-saffron`, underline 2px solid saffron below it
- Hover: fade to `--color-white` in 200ms

**Right side:**
- Language toggle: A pill-shaped button — "हिं | EN" — clicking it toggles the UI language
  - Width: 80px, height: 32px, border: 1px solid `--color-navy-light`
  - The active language half is filled with `--color-saffron`
- "पंचायत लॉगिन" (Panchayat Login) button: outlined, `--color-saffron` border and text, 36px height
- "शुरू करें" (Get Started) button: filled `--color-saffron`, white text

**Mobile:**
- Hamburger icon (three lines → X animation) replaces center nav
- Drawer slides in from right, full height, `--color-navy` background
- All nav links listed vertically with 48px touch targets

---

### 4.2 Scheme Card

This is the most frequently shown component — it appears in search results, eligibility matches, and the Panchayat dashboard.

**Size:** Full width of its container, min-height 140px

**Structure (left to right):**
```
[ Colored left border 4px ] [ Scheme icon 48px ] [ Content area ] [ Rupee badge ]
```

**Left border color:** Based on scheme category:
- Agriculture: `#4CAF50` (green)
- Housing: `#FF9800` (amber)
- Health: `#F44336` (red)
- Education: `#2196F3` (blue)
- Women & Child: `#E91E63` (pink)
- Employment: `#9C27B0` (purple)

**Scheme Icon:** 48x48px rounded square. Background is a 10% tint of the category color. Icon is a simple SVG (wheat stalk for agriculture, house for housing, heart for health, graduation cap for education, etc.)

**Content area:**
- Top row: Scheme name in Hindi, DM Sans 16px bold, `--color-gray-900`
  - Below it: English name in DM Sans 13px, `--color-gray-500`
- Second row: "मंत्रालय: कृषि मंत्रालय" — Ministry name in 12px, `--color-gray-500`
- Third row: A row of 2-3 small eligibility tags (pill-shaped, 11px):
  - "✓ आयु: 18-60" (Age 18-60)
  - "✓ BPL परिवार" (BPL Family)
  - "✓ महिला" (Woman) if applicable

**Rupee badge (right side):**
- Vertically centered
- Amount in JetBrains Mono 22px bold, `--color-saffron`
- "प्रति वर्ष" (per year) in DM Sans 11px, `--color-gray-500` below
- Small "₹" prefix in 14px

**Bottom bar:**
- On hover: slides up a thin bar showing:
  - "विवरण देखें" (View Details) — text link, saffron
  - "आवेदन करें" (Apply Now) — filled saffron button, small

**States:**
- Default: white background, `--shadow-card`
- Hover: slight lift (`translateY(-2px)`), shadow increases to `--shadow-md`, 200ms ease
- Matched/Eligible: thin glowing outline `--color-success`, tiny "✓ योग्य" badge top-right
- Applied: "आवेदन किया" (Applied) badge, muted appearance

---

### 4.3 Stat Card

Used in the Panchayat Dashboard and the Digital Twin page for showing key numbers.

**Size:** Flexible width (set by grid), height ~120px

**Structure:**
```
[ Icon top-left ] ←————————————————→ [ Trend arrow top-right ]
[ Big Number — JetBrains Mono 36px bold ]
[ Label — DM Sans 13px gray ]
[ Thin progress bar at bottom — optional ]
```

**Variants:**
- **Primary:** White background, saffron icon
- **Dark:** `--color-navy` background, white text, saffron accent
- **Success:** `--color-success-light` background, success-colored icon
- **Warning:** `--color-warning-light` background, warning icon

**Trend arrow:**
- ↑ Green arrow + percentage if positive
- ↓ Red arrow + percentage if negative
- — Gray dash if no change

---

### 4.4 Voice Input Button

The centerpiece of the citizen experience. This is the big microphone button users press to speak.

**Size:** 80px × 80px circle on mobile, 96px × 96px on desktop

**Default state:**
- Background: `--color-saffron`
- Icon: Microphone SVG, white, 32px
- Shadow: `--shadow-saffron`

**Listening state (when user is speaking):**
- Background: `--color-danger` (recording = red, universal signal)
- Three concentric pulsing rings animate outward in saffron/orange, 1.5s loop
- Icon changes to a square "stop" icon
- Label below button changes from "बोलें" (Speak) to "सुन रहा हूँ..." (Listening...)

**Processing state:**
- Background: `--color-gray-200`
- Spinner animation on the microphone icon
- Label: "समझ रहा हूँ..." (Understanding...)

**Accessibility:** Must have aria-label="Voice input button", role="button", keyboard focusable

---

### 4.5 Chat Bubble

Used in the Citizen Chat Interface.

**Two variants: User bubble & Sarathi bubble**

**User bubble (right-aligned):**
- Background: `--color-saffron`
- Text: white, DM Sans 15px
- Border radius: 18px 18px 4px 18px (flat bottom-right corner)
- Max width: 70% of chat width
- Timestamp below: 11px, semi-transparent white

**Sarathi bubble (left-aligned):**
- Background: white, `--shadow-card`
- Left accent: 3px border-left, `--color-saffron`
- Text: `--color-gray-900`, DM Sans 15px
- Border radius: 4px 18px 18px 18px (flat top-left corner)
- Small "🤖 सारथी" label in 11px above the bubble on first message of a sequence
- Timestamp below: 11px, `--color-gray-500`

**Special Sarathi bubble — Scheme Result:**
- Contains one or more Scheme Cards embedded inside the bubble
- Has a header: "मुझे ये योजनाएं मिलीं:" (I found these schemes:)

**Special Sarathi bubble — Question:**
- Has a DM Sans 16px question
- Below it: 2-4 option buttons in a row (pill-shaped, outlined in saffron, tap to select)
- Example: "आप किस राज्य में रहते हैं?" with buttons: "उत्तर प्रदेश", "बिहार", "राजस्थान", "अन्य"

---

### 4.6 Progress Steps (Profile Collection)

Shown at the top of the chat interface while collecting the citizen's profile. Shows how far through the intake process they are.

**Appearance:**
- A horizontal stepper: 6 dots connected by a line
- Active step: filled saffron circle, number inside
- Completed step: filled navy circle, checkmark inside, saffron connecting line
- Upcoming step: outlined gray circle, number inside, gray line

**Steps:**
1. नाम (Name)
2. आयु (Age)
3. राज्य (State)
4. आय (Income)
5. वर्ग (Category)
6. परिवार (Family)

On mobile: show only the current step label, with "चरण 3 / 6" (Step 3 of 6) text.

---

### 4.7 Language Toggle

A reusable component that appears both in the navbar and within the chat interface.

**Appearance:** Pill-shaped toggle, 100px wide, 34px tall
- Left half: "हिं" (Hindi)
- Right half: "EN" (English)
- Active side: solid `--color-saffron` fill, white text
- Inactive side: transparent, `--color-gray-500` text
- Smooth sliding animation on toggle: 200ms ease

---

### 4.8 Loading Skeleton

Used while API responses are being fetched. Never show a blank white space — always show a skeleton.

**Appearance:**
- Gray rounded rectangles where content will appear
- A shimmer animation passes over them left to right in a 1.5s loop
- Shimmer is a gradient: `transparent → rgba(255,255,255,0.6) → transparent`

---

### 4.9 Empty State

Used when a search has no results or a dashboard section has no data.

**Appearance:**
- Centered in its container
- Illustration: A simple SVG line-drawing (not generic — use a terracotta pot or a village house)
- Title: 20px, `--color-gray-700`
- Subtitle: 15px, `--color-gray-500`
- Optional CTA button

---

### 4.10 Toast Notifications

Appear at top-right corner. Auto-dismiss after 4 seconds.

**Types:**
- **Success:** Green left border, checkmark icon, `--color-success-light` background
- **Error:** Red left border, X icon, `--color-danger-light` background
- **Info:** Blue left border, i icon, `--color-info-light` background

Each toast slides in from the right (translateX: 120% → 0) in 300ms ease-out.

---

## 5. App Architecture — Pages & Routes

```
/ .......................... Landing Page
/chat ...................... Citizen Chat Interface
/twin ...................... Welfare Digital Twin Dashboard
/panchayat ................. Panchayat Login + Dashboard
/schemes ................... All Schemes Browse Page
/schemes/:id ............... Individual Scheme Detail Page
/apply/:schemeId ........... Application Form (mock for prototype)
```

**React Router v6** is used for routing.

**Persistent across all routes:**
- Navbar (top)
- Language context (Hindi/English state shared across all pages)
- Toast notification system

---

## 6. Page 1: Landing Page

**Route:** `/`

**Purpose:** Introduce Sarathi compellingly. Convert visitors to either the citizen chat or Panchayat dashboard. Impress hackathon judges immediately.

---

### Section 1: Hero

**Layout:** Full viewport height (100vh). Two columns on desktop (50/50 split), stacked on mobile.

**Left column — Text:**
- Small tag at top: "🇮🇳 AWS AI for Bharat" — pill-shaped, saffron border, 12px, uppercase
- Main headline (Playfair Display):
  ```
  सरकारी योजनाएं,
  आपके द्वार तक।
  ```
  ("Government schemes, to your doorstep.")
  Size: 64px on desktop, 42px on mobile. Color: `--color-navy`.
  Line 2 "आपके द्वार तक" has an underline — but not a regular underline. A hand-drawn saffron brushstroke SVG underneath it.

- English subtitle below: "India's first AI-powered welfare delivery engine. Built for the poorest, the illiterate, and the invisible." — DM Sans 18px, `--color-gray-700`, max-width 480px

- Two CTA buttons side by side (with 16px gap):
  - Primary: "अभी शुरू करें" / "Start Now" — filled saffron, 52px height, 24px horizontal padding, 12px border-radius, white text DM Sans 16px semibold. Has a subtle right-arrow icon.
  - Secondary: "पंचायत डैशबोर्ड" / "Panchayat Dashboard" — outlined saffron, same size.

- Below buttons: Three trust pills in a row:
  - "🔒 डेटा सुरक्षित" (Data Secure)
  - "🗣️ 22 भाषाएं" (22 Languages)
  - "⚡ 3 सेकंड में परिणाम" (Results in 3 seconds)
  Each pill: 11px, `--color-gray-500`, outlined `--color-gray-200` border, 6px border-radius

**Right column — Illustration:**
- A carefully crafted SVG scene: a village landscape (simple line art, not cartoonish)
  - A small set of village houses
  - Above them: a glowing "Sarathi" symbol (the lotus / OM-style abstract icon in saffron)
  - Radiating lines from the center like a sun — connectivity
  - Floating scheme icons orbiting around it (small icons: house, wheat, heart, graduation cap)
  - Very subtle animation: the orbiting icons rotate slowly (one full rotation per 20 seconds)
- Background: soft saffron-pale gradient radial glow behind the illustration

**Background of the entire hero:**
- `--color-off-white`
- Very subtle dot grid texture (SVG background pattern, opacity 3%)

**Page load animation:**
- Left column text: fades in and slides up from 20px below, staggered per element (0ms, 150ms, 300ms, 450ms delays)
- Right illustration: fades in and scales from 0.95 to 1.0 over 600ms
- The orbiting icons: appear with a pop (scale 0 → 1.05 → 1.0) staggered

---

### Section 2: The Problem We Solve

**Layout:** Full-width, `--color-navy` background, white text. Centered.

**Title:** (Playfair Display, 42px, white)
```
700+ योजनाएं।
केवल 2-3 तक पहुंच।
```
("700+ schemes. Access to only 2-3.")

**Subtitle:** DM Sans 18px, `--color-gray-300`, max-width 600px, centered.
"The average eligible Indian family misses out on ₹40,000+ in annual benefits they are legally entitled to. Sarathi changes this."

**Three problem cards in a row (on desktop), stacked on mobile:**
Each card: `--color-navy-mid` background, 20px padding, `--radius-lg`, no border

Card 1 — 📋 "अनजान" (Unaware)
"Citizens don't know which schemes they qualify for. Information is scattered across 47 different government portals."

Card 2 — 🧾 "जटिलता" (Complexity)
"Overlapping, conflicting eligibility rules. Taking one benefit can unknowingly disqualify you from a bigger one."

Card 3 — 📵 "पहुंच नहीं" (Inaccessible)
"Portals assume literacy, internet access, and digital confidence — none of which 70% of beneficiaries have."

Numbers below each card (JetBrains Mono, 48px, saffron, bold):
- Card 1: "₹2.3L Cr" (annual unclaimed welfare)
- Card 2: "700+" (schemes with overlapping rules)
- Card 3: "30 Cr" (illiterate adults in India)

Counter animation: Numbers count up from 0 when the section scrolls into view.

---

### Section 3: How Sarathi Works

**Layout:** White background. Left-right alternating feature blocks.

**Title:** Playfair Display, 38px, `--color-navy`, centered.
"सारथी कैसे काम करता है?" (How does Sarathi work?)

**Three feature blocks (alternating: text left/image right, then text right/image left):**

**Block 1 — "बोलें, और हम सुनेंगे" (Speak, and we will listen)**
- Step number: Large "01" in Playfair Display 96px, 10% opacity navy — decorative
- Title: 28px, `--color-navy`
- Description: DM Sans 16px, `--color-gray-700`, 320px max-width
  "बस बोलिए। सारथी 22 भारतीय भाषाओं को समझता है। पढ़ना-लिखना जरूरी नहीं। आपकी आवाज़ ही आपकी पहचान है।"
  ("Just speak. Sarathi understands 22 Indian languages. No reading or writing required. Your voice is your identity.")
- Right side: Animated mockup of the chat interface (static screenshot with a subtle breathing animation)

**Block 2 — "सही योजना, सही समय पर" (Right scheme, right time)**
- Step "02"
- Title, description, left side: Scheme cards cascading in like a hand of playing cards being revealed

**Block 3 — "गरीबी से निकलने का रास्ता" (The path out of poverty)**
- Step "03"
- Title, description, right side: A simplified version of the Digital Twin chart showing income growing over 3 years

---

### Section 4: Three Personas (Who is Sarathi for?)

**Layout:** Three cards in a 3-column grid on desktop, carousel on mobile.

**Background:** `--color-saffron-pale`

**Title:** "सारथी किसके लिए है?" (Who is Sarathi for?)

**Card: Kamla Devi**
- Illustrated avatar: A warm, dignified illustration of a rural woman (line art, not a photo, not cartoonish)
- Name: "कमला देवी, उत्तर प्रदेश" — 55 वर्ष, विधवा (55 years, widow)
- Quote bubble: "मुझे पता ही नहीं था कि मुझे विधवा पेंशन मिल सकती है।" ("I didn't even know I could get a widow's pension.")
- Outcome tag: "🎯 सारथी ने 6 योजनाएं ढूंढी | ₹24,000 सालाना" (Sarathi found 6 schemes | ₹24,000/year)

**Card: Ramu Prasad**
- Rural migrant worker, Bihar → Mumbai
- Quote: "मुंबई आया तो बिहार की सारी सुविधाएं बंद हो गईं।" (Came to Mumbai, all Bihar benefits stopped.)
- Outcome: "🔄 Benefits carried across states. 0 days gap."

**Card: Sarpanch Meena**
- Gram Panchayat secretary, Rajasthan
- Quote: "हर घर को जांचना मुश्किल था। अब सारथी बताता है।" (Checking every household was hard. Now Sarathi tells us.)
- Outcome: "📊 87 households enrolled in 30 days."

---

### Section 5: AWS Technology Strip

**Layout:** Full-width, white, subtle gray border top and bottom.

**Title:** "Powered by Amazon Web Services" — small, centered, `--color-gray-500`, 13px uppercase

**Logo strip:** Horizontal row of AWS service logos with their names below:
Amazon Lex · Amazon Bedrock · Amazon Polly · AWS Lambda · Amazon DynamoDB · Amazon Amplify · Amazon SNS

Each logo: grayscale by default, saffron tint on hover, 80px width.

Subtle marquee scroll animation (infinite loop) on mobile.

---

### Section 6: Footer

**Background:** `--color-navy`

**Three columns:**
- Column 1: Logo + tagline "हर पात्र नागरिक तक।" (To every eligible citizen.) + social links (GitHub)
- Column 2: Quick links — नागरिक / पंचायत / योजनाएं / हमारे बारे में
- Column 3: "Built for AWS AI for Bharat Hackathon 2025" + team member names

**Bottom bar:** `--color-navy-mid` background. "Open source. Built with ❤️ in India." — centered, small.

---

## 7. Page 2: Citizen Chat Interface

**Route:** `/chat`

**Purpose:** The main citizen-facing experience. A conversational interface where citizens answer questions and receive scheme recommendations.

---

### Layout Structure

```
┌─────────────────────────────────────────────────────┐
│  NAVBAR (fixed, 64px)                               │
├─────────────────────────────────────────────────────┤
│  PROGRESS BAR (sticky, 56px) — Step 3 of 6         │
├───────────────────┬─────────────────────────────────┤
│                   │                                 │
│   RESULTS PANEL   │   CHAT PANEL                    │
│   (left, 38%)     │   (right, 62%)                  │
│   — hidden until  │   — always visible              │
│   first results   │                                 │
│                   │                                 │
├───────────────────┴─────────────────────────────────┤
│  INPUT BAR (fixed bottom, 80px)                     │
└─────────────────────────────────────────────────────┘
```

On mobile: Results panel becomes a slide-up drawer from the bottom. Chat is full width.

---

### Progress Bar (Sticky below Navbar)

- White background, 1px bottom border
- Horizontal step indicators (described in Component 4.6)
- Current step highlighted in saffron
- "चरण 3 / 6: राज्य चुनें" (Step 3 of 6: Select State) — label right of steps

---

### Chat Panel

**Background:** `--color-off-white`

**Scroll behavior:** Chat scrolls upward as new messages appear. Auto-scrolls to latest message.

**Opening state (before any input):**
- Centered welcome screen:
  - Animated Sarathi logo (gentle pulse)
  - "नमस्ते! मैं सारथी हूँ।" in Playfair Display 28px
  - "आपको कौन सी सरकारी योजनाएं मिल सकती हैं — यह मैं आपको बताऊंगा।" (I'll tell you which government schemes you can get.)
  - Three quick-start chips: "योजनाएं ढूंढें" (Find Schemes), "किसान हूँ" (I'm a farmer), "विधवा पेंशन" (Widow Pension)

**Message thread:**
- 20px padding on sides
- 16px gap between message groups
- Each Sarathi message group: Sarathi bubble(s) grouped together
- Each User message group: User bubble(s) grouped

**Quick reply chips:**
- When Sarathi asks a question with defined options, show chips below the bubble
- Chips: 36px tall, rounded pill, outlined saffron, saffron text
- On tap: fills saffron background, white text, immediately sends the response
- Example chips for state selection: 5 most common states as chips, plus "अन्य राज्य ▾" (Other state ▾)

---

### Input Bar (Fixed Bottom)

**Layout:**
```
[ 🎤 Voice Button ] [ Text input field ] [ ⌨️ Keyboard toggle ] [ ➤ Send ]
```

**Voice Button:** 56px circle, saffron fill, white mic icon (described in Component 4.4 but smaller here)

**Text input:**
- 48px height, `--radius-full`, border: 1px solid `--color-gray-200`
- Placeholder: "यहाँ लिखें या माइक दबाएं..." (Type here or press mic...)
- Expands to 3 lines max before scrolling

**Send button:** 48px circle, saffron, white arrow icon. Disabled (grayed) when empty.

**Above input bar — Voice feedback bar:**
- When recording: appears above input, full width, `--color-danger-light` background
- Animated waveform visualization (bars that pulse to voice amplitude)
- "बोल रहे हैं... | रुकने के लिए टैप करें" (Speaking... | Tap to stop)

---

### Results Panel (Left side)

Slides in from the left when the first scheme results arrive. Before that, this space is empty (chat takes full width).

**Header:**
- "आपके लिए योजनाएं" (Schemes for you) — 18px bold
- Scheme count badge: "8 योजनाएं मिलीं" (8 schemes found) — saffron pill
- Filter row: horizontal chips — "सभी" (All), "कृषि" (Agriculture), "स्वास्थ्य" (Health), etc.

**Scheme list:**
- Vertically stacked Scheme Cards (Component 4.2)
- Each card: clickable → opens Scheme Detail page
- Smooth entrance animation: cards cascade in from the right with 80ms stagger

**Bottom of results panel:**
- "Digital Twin देखें →" (View Digital Twin →) button — takes to `/twin` with this citizen's data pre-loaded
- "सब योजनाएं देखें" (View all schemes) — link to `/schemes`

---

### Real-time Typing Indicator

When Sarathi is "thinking":
- Three animated dots (•••) bounce in a Sarathi bubble
- Small label: "सारथी सोच रहा है..." (Sarathi is thinking...)
- Appears with 500ms delay (so it doesn't flash for fast responses)

---

## 8. Page 3: Welfare Digital Twin Dashboard

**Route:** `/twin`

**Purpose:** Show a citizen their personalized 3-year welfare trajectory — which schemes to take in which order to maximize income and exit poverty. This is the most data-rich page.

---

### Layout Structure

```
┌─────────────────────────────────────────────────────┐
│  NAVBAR                                             │
├─────────────────────────────────────────────────────┤
│  PAGE HEADER — "आपका कल्याण रोडमैप" (Welfare       │
│  Roadmap) + citizen summary pill                    │
├─────────────────────────────────────────────────────┤
│  STAT CARDS ROW (4 cards)                           │
├─────────────────────────────────────────────────────┤
│                                                     │
│  PATHWAY CHART (large, full width)                  │
│  3 line trajectories over 3 years                   │
│                                                     │
├───────────────────┬─────────────────────────────────┤
│  SCHEME TIMELINE  │  CONFLICT RESOLVER              │
│  (left, 55%)      │  (right, 45%)                   │
│                   │                                 │
└───────────────────┴─────────────────────────────────┘
```

---

### Page Header

**Background:** `--color-navy` with a warm radial gradient (subtle saffron glow bottom-center)

**Left:**
- Breadcrumb: "होम > चैट > आपका रोडमैप" (Home > Chat > Your Roadmap)
- Title: "आपका कल्याण रोडमैप" — Playfair Display 36px, white
- Subtitle: "अगले 3 वर्षों में आप गरीबी रेखा से ऊपर आ सकते हैं।" (In the next 3 years, you can rise above the poverty line.) — DM Sans 16px, `--color-gray-300`

**Right:**
- Citizen summary chip: "कमला देवी | 55 वर्ष | UP | BPL" — pill, navy-light background, white text
- "प्रोफाइल बदलें" (Change Profile) — small link

---

### Stat Cards Row

Four Stat Cards (Component 4.3) in a horizontal row:

1. **वर्तमान आय** (Current Income): "₹2,000 / माह" — warning (below poverty line)
2. **3 वर्ष बाद** (After 3 Years): "₹7,400 / माह" — success (above poverty line)
3. **कुल सालाना लाभ** (Total Annual Benefit): "₹64,800" — saffron
4. **सक्रिय योजनाएं** (Active Schemes): "8" — info

---

### Pathway Chart (The Hero Visual of this Page)

**Library:** Recharts `LineChart` or a custom SVG chart

**Size:** Full width, 380px height

**X-axis:** "वर्ष 1" (Year 1) → "वर्ष 2" → "वर्ष 3" — with quarterly markers as thin dotted vertical lines

**Y-axis:** Monthly income in ₹. Range: ₹0 to ₹12,000. Poverty line (₹8,000/month) shown as a horizontal dashed red line with label "गरीबी रेखा" (Poverty Line)

**Three pathway lines:**

Line 1 — "सर्वोत्तम मार्ग" (Best Path): Saffron, thick (3px), dot markers at each scheme enrollment point
Line 2 — "मध्यम मार्ग" (Middle Path): Navy, thinner (2px), dashed
Line 3 — "न्यूनतम मार्ग" (Minimum Path): Gray, thin (1.5px), dotted

**Chart background:**
- Light cream (`--color-gray-100`)
- The area under Line 1 has a subtle saffron fill (opacity 8%)
- The "Above poverty line" zone has a very faint success-green background

**Hover interaction:**
- Hovering over any point on the chart shows a tooltip:
  - Year and quarter
  - Monthly income at that point
  - Which new scheme was enrolled that quarter
  - Cumulative benefits received so far

**Scheme milestone markers:**
- At each point where a new scheme begins, a small icon of the scheme type appears on the line
- Clicking it highlights that scheme in the Scheme Timeline below

**Path selector tabs:**
- Three tabs above the chart: "सर्वोत्तम" | "मध्यम" | "न्यूनतम"
- Clicking a tab highlights that line and dims the others
- Below the chart: "आप सर्वोत्तम मार्ग पर हैं → 2.4 वर्षों में गरीबी रेखा पार करेंगे" (You're on the best path → will cross poverty line in 2.4 years)

---

### Scheme Timeline (Bottom Left)

A vertical timeline of schemes in chronological order of recommended enrollment.

**Header:** "योजना क्रम" (Scheme Sequence)

**Each timeline entry:**
```
[ Colored circle with year ] ←—line—→ [ Scheme card (compact) ] [ ₹ monthly impact ]
```

Example:
- Year 1, Month 1: PM Ujjwala → +₹800/month saved (gas subsidy)
- Year 1, Month 3: PM Awas Yojana → Housing approved (₹1.2L one-time)
- Year 2, Month 1: MGNREGS enrollment → +₹3,000/month
- Year 3, Month 1: Skill training scheme → +₹2,000/month (income increase)

**Visual:** The connecting line turns saffron for completed/current steps, gray for future.

---

### Conflict Resolver (Bottom Right)

**Header:** "टकराव चेतावनी" (Conflict Warning) — with a ⚠️ icon

**Background:** `--color-warning-light`

**Content:**
- Title: "ये 2 योजनाएं एक साथ नहीं लें" (Don't take these 2 schemes together)
- A visual of two scheme cards with a red "✗" between them
- Explanation: "PMEGP लोन लेने के बाद NRLM SHG लोन के लिए अयोग्य हो जाएंगे।" (After taking PMEGP loan, you'll be ineligible for NRLM SHG loan.)
- Recommendation: "सारथी की सलाह: पहले NRLM SHG लोन लें (ब्याज कम), फिर PMEGP" (Sarathi recommends: Take NRLM SHG loan first (lower interest), then PMEGP)

**Optimal bundle section below:**
- "इस combination से सबसे ज्यादा फायदा:" (This combination gives maximum benefit:)
- List of 4-5 scheme names with checkmarks and total annual value

---

## 9. Page 4: Panchayat Dashboard

**Route:** `/panchayat`

**Purpose:** For Panchayat officials to see their village's welfare status, identify unserved citizens, and manage outreach. This is the most complex and impressive page — it's where the judges' jaws should drop.

---

### Layout Structure

```
┌─────────────────────────────────────────────────────┐
│  NAVBAR (includes "लॉगआउट" button)                 │
├─────────────────────────────────────────────────────┤
│  PAGE HEADER — Panchayat name + district + stats    │
├───────────────────────────────────────────────────────┤
│  STAT CARDS ROW (5 cards)                           │
├───────────────────┬─────────────────────────────────┤
│  VILLAGE MAP      │  ALERTS PANEL                   │
│  (left, 55%)      │  (right, 45%)                   │
│                   │                                 │
│  Animated dot map │  Priority action items          │
│  of households    │                                 │
│                   │                                 │
├───────────────────┴─────────────────────────────────┤
│  CITIZEN TABLE (full width)                         │
│  Eligible but not enrolled list                     │
├─────────────────────────────────────────────────────┤
│  GOVERNANCE HEATMAP (full width)                    │
│  Scheme-wise performance across villages            │
└─────────────────────────────────────────────────────┘
```

---

### Page Header

**Background:** Gradient — `--color-navy` left → `--color-navy-mid` right

**Left:**
- Small breadcrumb
- Title: "रामपुर पंचायत डैशबोर्ड" — Playfair Display 32px, white
- Subtitle: "जिला: बाराबंकी | उत्तर प्रदेश | 487 परिवार" (District: Barabanki | UP | 487 households)

**Right:**
- Last updated: "अंतिम अपडेट: 2 घंटे पहले" (Last updated: 2 hours ago) — small, gray
- Refresh button: saffron icon button
- "रिपोर्ट डाउनलोड करें" (Download Report) — outlined button

---

### Stat Cards Row (5 cards, narrower)

1. **कुल परिवार** (Total Households): 487
2. **लाभान्वित** (Receiving Benefits): 312 (64%) — success
3. **पात्र लेकिन वंचित** (Eligible but not enrolled): 87 — warning, this is the action number
4. **शून्य लाभ** (Zero benefits): 34 — danger
5. **इस माह जुड़े** (Added this month): 23 — success with upward arrow

---

### Village Map (The Hero Visual)

**What it is:** A stylized "village layout" rendered as an SVG or Canvas visualization.

**How it looks:**
- Abstract overhead view of a village — grid of household "blocks"
- Each block is a small rounded square (~16px × 16px) representing one household
- Blocks are arranged in rough clusters (representing actual mohallas/wards)
- Between clusters: thin lines representing roads/paths

**Color coding:**
- Green (`--color-enrolled`): Receiving benefits — majority should be green
- Orange (`--color-eligible`): Eligible but not enrolled — these pulse gently
- Red (`--color-none`): Zero benefits — these pulse faster/more urgently
- Gray (`--color-unknown`): Data not yet collected

**Animations:**
- All dots fade in together on load with a gentle pop (scale 0 → 1, 600ms, staggered 5ms per dot)
- Orange and red dots pulse: scale 1.0 → 1.3 → 1.0, infinite, 2s loop, opacity varies
- When hovering a dot: zoomed tooltip appears showing household name, schemes enrolled/eligible for, and a "संपर्क करें" (Contact) button

**Controls:**
- Zoom in/out buttons
- Filter toggle: "सभी दिखाएं | केवल वंचित | केवल शून्य लाभ" (Show all | Only unserved | Only zero benefits)
- When filter is active, non-matching dots fade to 10% opacity

**Legend:** Bottom of the map, horizontal, showing the four colors and their meanings.

---

### Alerts Panel (Right side)

**Header:** "प्राथमिकता कार्य" (Priority Actions) — with a notification count badge

**Alert cards (stacked, scrollable):**

Each alert card:
- Left: colored urgency border (red = urgent, orange = soon, blue = info)
- Icon representing alert type
- Title: 15px bold
- Description: 13px gray
- "कार्रवाई करें" (Take Action) — saffron link/button
- Timestamp: "3 घंटे पहले" (3 hours ago)

**Example alerts:**

🔴 **"8 बुजुर्ग नागरिक पेंशन से वंचित"** (8 elderly citizens missing pension)
"वार्ड 3 में 8 नागरिक जो 60+ आयु के हैं, उन्हें अभी तक वृद्धावस्था पेंशन नहीं मिली।"
→ "सूची देखें" (View List)

🟠 **"5 बालिकाएं 18 वर्ष होंगी — छात्रवृत्ति के लिए तैयार करें"** (5 girls turn 18 — prepare for scholarship)
"अगले 2 महीनों में 5 बालिकाएं 18 वर्ष पूरी करेंगी। उनके छात्रवृत्ति दस्तावेज़ अभी तैयार करें।"
→ "दस्तावेज़ चेकलिस्ट" (Document Checklist)

🔵 **"नया जन्म पंजीकृत — माँ PM Matru Vandana के योग्य"** (New birth registered — mother eligible)
"कल्पना देवी के घर बेटे का जन्म हुआ। वे PM Matru Vandana (₹5,000) के लिए योग्य हैं।"
→ "आवेदन करें" (Apply)

---

### Citizen Table (Full Width)

**Header:** "पात्र लेकिन वंचित नागरिक" (Eligible but Not Enrolled Citizens) — 18px bold

**Controls row:**
- Search box: "नाम या ID से खोजें" (Search by name or ID)
- Filter dropdown: Scheme category
- Sort by: "कमी (₹)" (Benefit gap ₹) — largest gap first
- Export button: "CSV डाउनलोड" (Download CSV)

**Table columns:**

| नाम (Name) | वार्ड (Ward) | आयु/वर्ग (Age/Category) | वंचित योजनाएं (Missing Schemes) | अनुमानित वार्षिक लाभ (Estimated Annual Benefit) | स्थिति (Status) | कार्रवाई (Action) |
|---|---|---|---|---|---|---|
| कमला देवी | वार्ड 2 | 55, विधवा | PM Ujjwala, Vidhwa Pension, PMAY | ₹36,000 | 🔴 वंचित | [संपर्क करें] |
| रहीम शेख | वार्ड 4 | 62, BPL | वृद्धावस्था पेंशन | ₹12,000 | 🟠 आंशिक | [आवेदन करें] |

**Table styles:**
- Alternating row background (`--color-white` / `--color-gray-100`)
- Sticky header
- Row hover: `--color-saffron-pale` background
- "कार्रवाई" (Action) column: saffron CTA buttons
- Pagination: 20 rows per page, "पिछला | 1 2 3 | अगला" style

**Clicking a row:** Expands inline to show all eligible-but-not-enrolled schemes for that citizen, with one-click "इस नागरिक का Digital Twin देखें" (View Digital Twin for this citizen).

---

### Governance Heatmap (Full Width)

**What it is:** A grid showing performance across schemes and wards.

**X-axis:** Scheme names (abbreviated)
**Y-axis:** Ward numbers / Villages
**Each cell:** Colored square showing enrollment rate for that scheme in that ward.

**Color scale:**
- 0–20%: Dark red
- 21–50%: Orange
- 51–75%: Yellow
- 76–90%: Light green
- 91–100%: Dark green

**Hover tooltip:** "वार्ड 3 | PM-KISAN | 12 में से 4 पात्र नागरिक लाभान्वित (33%)"

**Controls:**
- Toggle: "पंजीकरण दर" (Enrollment Rate) | "रुपया लाभ" (Rupee Benefit) | "आवेदन सफलता" (Application Success)
- The heatmap re-renders with smooth color transitions on toggle

---

## 10. Page 5: Scheme Detail Page

**Route:** `/schemes/:id`

**Layout:** Two-column on desktop (content 60% / sidebar 40%), single column on mobile.

**Main content (left):**
- Scheme hero: Large colored banner (category color), scheme name in Playfair Display 32px white, ministry name, scheme logo/badge
- Tabbed content:
  - "पात्रता" (Eligibility) — list of eligibility criteria with ✓ and ✗ for current user
  - "लाभ" (Benefits) — what you get, how much, when
  - "आवेदन" (How to Apply) — step-by-step numbered instructions
  - "दस्तावेज़" (Documents Required) — checklist, checkboxes to track what you have

**Sidebar (right):**
- Your eligibility status widget: Big green "✅ आप योग्य हैं!" or red "❌ आप अभी योग्य नहीं"
- "आवेदन करें" (Apply Now) — big saffron button
- "Digital Twin में जोड़ें" (Add to Digital Twin) — outlined button
- Related schemes section: "ये भी देखें" (See also) — 2-3 compact scheme cards

---

## 11. Responsive Design Rules

### Breakpoints

```css
/* Mobile first approach */
/* xs: default (0px+) */
/* sm: 480px+ */
/* md: 768px+ */
/* lg: 1024px+ */
/* xl: 1280px+ */
/* 2xl: 1536px+ */
```

### Page-by-Page Rules

**Landing Page:**
- Hero: 2 columns (desktop) → stacked, illustration above text (mobile)
- Feature blocks: side-by-side (desktop) → stacked (mobile)
- Persona cards: 3-column grid (desktop) → horizontal scroll carousel (mobile)
- Hero headline: 64px (desktop) → 38px (mobile)

**Chat Interface:**
- Results panel: left 38% (desktop) → slide-up drawer from bottom (mobile)
- Input bar: always fixed bottom, full width on both
- Chat bubble max-width: 70% (desktop) → 85% (mobile)

**Digital Twin:**
- Pathway chart: full width (both) — reduce height to 260px on mobile
- Scheme timeline + conflict resolver: side by side (desktop) → stacked (mobile)

**Panchayat Dashboard:**
- All 5 stat cards in a row (desktop) → 2×2 + 1 grid (tablet) → vertical stack (mobile)
- Village map + alerts: side by side (desktop) → stacked, map first (mobile)
- Citizen table: full table (desktop) → simplified card view (mobile, hide less important columns)
- Heatmap: scrollable horizontally on mobile

### Touch Targets
All tappable elements: minimum 44px × 44px touch target on mobile, even if visually smaller.

---

## 12. Animations & Micro-interactions

### Page Transitions
- Route changes: Fade out current page (150ms) → fade in new page (200ms)
- Use React Router + CSS transitions, not heavy animation libraries

### Entrance Animations (on page load)

**Landing page hero:**
```css
/* Staggered entrance for hero elements */
.hero-tag      { animation: fadeSlideUp 400ms 0ms both ease-out; }
.hero-headline { animation: fadeSlideUp 500ms 100ms both ease-out; }
.hero-subtitle { animation: fadeSlideUp 400ms 250ms both ease-out; }
.hero-buttons  { animation: fadeSlideUp 400ms 350ms both ease-out; }
.hero-pills    { animation: fadeSlideUp 400ms 450ms both ease-out; }
.hero-visual   { animation: fadeIn 600ms 100ms both ease-out; }

@keyframes fadeSlideUp {
  from { opacity: 0; transform: translateY(20px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes fadeIn {
  from { opacity: 0; }
  to   { opacity: 1; }
}
```

**Scheme cards entering (in results panel):**
```css
/* Cascade in from right */
.scheme-card:nth-child(1) { animation: slideInRight 350ms 0ms both; }
.scheme-card:nth-child(2) { animation: slideInRight 350ms 80ms both; }
.scheme-card:nth-child(3) { animation: slideInRight 350ms 160ms both; }
/* etc. */

@keyframes slideInRight {
  from { opacity: 0; transform: translateX(30px); }
  to   { opacity: 1; transform: translateX(0); }
}
```

**Village map dots:**
```css
@keyframes dotAppear {
  from { opacity: 0; transform: scale(0); }
  to   { opacity: 1; transform: scale(1); }
}
/* Applied with JS: dot.style.animationDelay = index * 5 + 'ms' */
```

**Pulsing alerts (orange/red dots on map):**
```css
@keyframes urgentPulse {
  0%   { transform: scale(1);   opacity: 1; }
  50%  { transform: scale(1.4); opacity: 0.7; }
  100% { transform: scale(1);   opacity: 1; }
}
.dot-eligible { animation: urgentPulse 2s infinite ease-in-out; }
.dot-none     { animation: urgentPulse 1.2s infinite ease-in-out; }
```

### Scroll-triggered Animations
- Stats section number counter: starts counting when section enters viewport
- Use `IntersectionObserver` API
- Feature sections: slide in from opposite sides as they enter view

### Micro-interactions

**Button hover:** `transform: translateY(-1px)`, shadow increases, 150ms ease
**Button active/click:** `transform: translateY(0) scale(0.98)`, 100ms
**Scheme card hover:** `transform: translateY(-3px)`, shadow lifts, 200ms ease
**Quick reply chip tap:** immediate fill (no delay), then chat message appears 300ms later
**Language toggle switch:** smooth sliding indicator, 200ms ease

### Delight Moments

**When schemes are found:**
- Chat bubble enters with a slightly bouncy animation (spring physics)
- A tiny confetti burst (5-6 small colored particles) fires from the scheme count badge

**When a citizen is marked as enrolled:**
- The dot on the village map transitions from orange to green with a brief bright flash and scale-up

**When crossing the poverty line on the Digital Twin chart:**
- A subtle "🎉" emoji animates along the chart line at the crossing point
- A small toast appears: "बधाई! इस योजना के साथ आप गरीबी रेखा पार करेंगे"

---

## 13. Accessibility Requirements

These are non-negotiable. Failing accessibility is failing the core mission (serving people with disabilities).

### WCAG 2.1 AA Requirements

- All text: minimum 4.5:1 contrast ratio against background
- Large text (18px+ bold or 24px+): minimum 3:1 contrast ratio
- All interactive elements: visible focus outline (2px solid saffron, 2px offset)
- No information conveyed by color alone — always pair with icon or text

### Keyboard Navigation
- Tab order must be logical (top-to-bottom, left-to-right)
- All interactive elements reachable by keyboard
- Escape closes modals and drawers
- Arrow keys navigate within components (tabs, chips, dropdowns)

### Screen Reader Support
```html
<!-- Voice button must have clear aria -->
<button 
  aria-label="माइक से बोलें — voice input button" 
  aria-pressed="false" 
  role="button"
>

<!-- Scheme cards -->
<article aria-label="PM-KISAN योजना — ₹6,000 सालाना — आप योग्य हैं">

<!-- Live region for chat messages -->
<div aria-live="polite" aria-atomic="false" id="chat-messages">
```

### Hindi Text
- All Hindi in `lang="hi"` attribute for proper screen reader pronunciation
- English text in `lang="en"`
- Sufficient font size for Devanagari: minimum 15px (Devanagari is visually smaller than Latin at same px)

---

## 14. Tech Stack & Setup Instructions

### Core Stack

```
React 18 (with Vite — not Create React App, Vite is faster)
React Router v6 (routing)
Tailwind CSS (utility classes for rapid layout)
Recharts (charts and data visualization)
Framer Motion (animations — optional but recommended)
Axios (API calls to the backend)
```

### Install & Setup

```bash
# Create React + Vite project
npm create vite@latest sarathi-frontend -- --template react
cd sarathi-frontend

# Install dependencies
npm install react-router-dom recharts axios framer-motion

# Install Tailwind CSS
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p

# Install icon library
npm install lucide-react

# Start dev server
npm run dev
```

### Tailwind Config (tailwind.config.js)

```javascript
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        saffron: { DEFAULT: '#E8740C', light: '#F9A54A', pale: '#FEF3E7' },
        navy: { DEFAULT: '#0F2240', mid: '#1A3A5C', light: '#2A5280' },
      },
      fontFamily: {
        display: ['"Playfair Display"', 'serif'],
        body: ['"DM Sans"', 'sans-serif'],
        hindi: ['"Noto Sans Devanagari"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      borderRadius: {
        xl: '20px', '2xl': '32px',
      },
      boxShadow: {
        saffron: '0 4px 20px rgba(232, 116, 12, 0.30)',
        card: '0 2px 8px rgba(15, 34, 64, 0.08)',
      }
    }
  }
}
```

### Folder Structure

```
src/
├── components/
│   ├── ui/
│   │   ├── Navbar.jsx
│   │   ├── SchemeCard.jsx
│   │   ├── StatCard.jsx
│   │   ├── VoiceButton.jsx
│   │   ├── ChatBubble.jsx
│   │   ├── LanguageToggle.jsx
│   │   ├── LoadingSkeleton.jsx
│   │   ├── EmptyState.jsx
│   │   └── Toast.jsx
│   ├── chat/
│   │   ├── ChatPanel.jsx
│   │   ├── ResultsPanel.jsx
│   │   ├── InputBar.jsx
│   │   └── ProgressSteps.jsx
│   ├── twin/
│   │   ├── PathwayChart.jsx
│   │   ├── SchemeTimeline.jsx
│   │   └── ConflictResolver.jsx
│   └── panchayat/
│       ├── VillageMap.jsx
│       ├── AlertsPanel.jsx
│       ├── CitizenTable.jsx
│       └── GovernanceHeatmap.jsx
├── pages/
│   ├── LandingPage.jsx
│   ├── ChatPage.jsx
│   ├── TwinPage.jsx
│   ├── PanchayatDashboard.jsx
│   └── SchemeDetailPage.jsx
├── context/
│   ├── LanguageContext.jsx      ← Hindi/English toggle state
│   └── CitizenContext.jsx       ← Citizen profile state
├── data/
│   ├── mockSchemes.js           ← 15-20 real Indian schemes (mock)
│   ├── mockCitizens.js          ← 3 demo citizen personas
│   └── mockPanchayat.js         ← Village and household mock data
├── hooks/
│   ├── useVoiceInput.js         ← Voice recording logic
│   └── useEligibility.js        ← API call to eligibility engine
├── utils/
│   ├── api.js                   ← Axios instance with base URL
│   └── formatters.js            ← Rupee formatting, date formatting
├── styles/
│   └── global.css               ← CSS custom properties (design tokens)
└── App.jsx                      ← Router setup
```

### Mock Data Structure (for building before API is ready)

```javascript
// src/data/mockSchemes.js
export const schemes = [
  {
    id: "pm-kisan",
    nameHindi: "प्रधानमंत्री किसान सम्मान निधि",
    nameEnglish: "PM-KISAN",
    ministry: "Ministry of Agriculture",
    category: "agriculture",
    annualBenefit: 6000,
    benefitType: "Direct Bank Transfer",
    eligibility: {
      maxIncome: null,
      category: ["SC", "ST", "OBC", "General"],
      occupation: ["farmer"],
      minAge: 18,
      landOwnership: true,
    },
    description: "₹6,000 per year in three equal installments for small and marginal farmers.",
    applyUrl: "https://pmkisan.gov.in",
    documentsRequired: ["Aadhaar", "Bank Account", "Land Records"]
  },
  // ... 15-20 more
]
```

---

## 15. Claude Code Prompts — Copy-Paste Ready

Use these exact prompts when working with Claude Code, Cursor, or any AI coding tool. Each prompt is self-contained.

---

### Prompt 1: Project Setup

```
Create a new React 18 + Vite project called "sarathi-frontend". Install and configure:
- React Router v6
- Tailwind CSS with the following custom tokens in tailwind.config.js: colors (saffron: #E8740C, navy: #0F2240), fonts (Playfair Display, DM Sans, Noto Sans Devanagari, JetBrains Mono from Google Fonts)
- Recharts for data visualization
- Lucide React for icons
- Framer Motion for animations

Set up the folder structure with: components/ui, components/chat, components/twin, components/panchayat, pages, context, data, hooks, utils, styles.

Create App.jsx with React Router routes: / (LandingPage), /chat (ChatPage), /twin (TwinPage), /panchayat (PanchayatDashboard), /schemes (SchemesPage), /schemes/:id (SchemeDetailPage).

Create global.css with all CSS custom properties for the design system including colors, spacing, typography, shadows, and border radius.

Add Google Fonts link to index.html for Playfair Display, DM Sans, Noto Sans Devanagari, and JetBrains Mono.
```

---

### Prompt 2: Navbar Component

```
Create a Navbar.jsx component for the Sarathi welfare platform with these exact specs:

- Fixed to top, 64px height, z-index 50
- Background: #0F2240 (navy), frosted glass when scrolled (backdrop-filter blur + semi-transparent bg)
- Left: "सारथी" in Playfair Display 24px color #E8740C, with "Sarathi" subtitle in 12px gray — both as a home link (React Router Link to "/")
- Center (desktop): nav links — "नागरिक", "पंचायत", "योजनाएं", "हमारे बारे में" in DM Sans 14px, #C8C3B8, uppercase, letter-spacing 0.5px. Active route highlighted in #E8740C with 2px bottom border.
- Right: Language toggle pill (हिं/EN, 80px × 32px, saffron active side), "पंचायत लॉगिन" outlined button, "शुरू करें" filled saffron button
- Mobile: hamburger → X animated icon, full-height right drawer with all nav links, 48px touch targets
- Use LanguageContext for the language toggle state

Use Tailwind CSS classes only. No external component libraries. Make it fully responsive.
```

---

### Prompt 3: Scheme Card Component

```
Create a SchemeCard.jsx component in React + Tailwind CSS for displaying Indian government welfare schemes.

Props: { scheme, isEligible, isApplied }

The scheme object has: id, nameHindi, nameEnglish, ministry, category, annualBenefit, eligibility (array of criteria strings)

Visual spec:
- White background card, shadow, 12px border radius
- Left: 4px solid colored border based on category (agriculture=#4CAF50, housing=#FF9800, health=#F44336, education=#2196F3, women=#E91E63, employment=#9C27B0)
- Left: 48x48px rounded icon area (10% tint of category color) with an SVG icon for the category
- Center: Hindi name (16px bold #1C1A17), English name below (13px #8A8578), ministry name (12px gray), then 2-3 eligibility pill tags (11px, outlined, category color)
- Right: Annual benefit in JetBrains Mono 22px bold #E8740C, "प्रति वर्ष" below in 11px gray
- Top-right badge: "✓ योग्य" (green) if isEligible, "आवेदन किया" (gray) if isApplied
- Hover: translateY(-2px), stronger shadow, bottom action bar slides up showing "विवरण देखें" link and "आवेदन करें" button

isEligible=true adds a glowing green outline.
Add framer motion for the hover animation. Export as default.
```

---

### Prompt 4: Landing Page Hero Section

```
Create the Hero section of the Sarathi landing page (LandingPage.jsx) in React + Tailwind CSS + Framer Motion.

Two columns on desktop (50/50), stacked on mobile (illustration above text).

LEFT COLUMN:
- Small pill tag: "🇮🇳 AWS AI for Bharat" — outlined saffron, 12px uppercase
- Main headline in Playfair Display 64px (38px mobile): 
  Line 1: "सरकारी योजनाएं,"
  Line 2: "आपके द्वार तक।" — line 2 has an SVG brushstroke underline in saffron (#E8740C) positioned absolutely below the text
- Subtitle: "India's first AI-powered welfare delivery engine..." in DM Sans 18px, max-width 480px, #4A4740
- Two CTA buttons: Primary (filled saffron "अभी शुरू करें" with right-arrow) and Secondary (outlined saffron "पंचायत डैशबोर्ड"). Both 52px height, 12px border-radius.
- Three trust pills below buttons: "🔒 डेटा सुरक्षित", "🗣️ 22 भाषाएं", "⚡ 3 सेकंड में परिणाम" — 11px, gray, outlined

RIGHT COLUMN:
- SVG village illustration (create a simple SVG: 3-4 house shapes, a central glowing circle with radiating lines, 5-6 small welfare icons floating around it)
- The floating icons rotate slowly (20s full rotation)
- Soft saffron radial gradient glow behind the illustration

PAGE BACKGROUND: #F8F7F4 with SVG dot-grid pattern (opacity 3%)

ANIMATION: Staggered entrance — each left column element fades in and slides up 20px, with delays: 0ms, 150ms, 300ms, 450ms. Right illustration fades in over 600ms. Use Framer Motion.

Make the primary CTA button link to "/chat" using React Router.
```

---

### Prompt 5: Village Map Component

```
Create a VillageMap.jsx component in React that renders an animated household dot-map for a Panchayat dashboard.

Props: { households } 
households is an array of objects: { id, name, ward, status } where status is "enrolled" | "eligible" | "none" | "unknown"

Color mapping:
- "enrolled": #00C851 (green)
- "eligible": #FF8800 (orange) 
- "none": #E53935 (red)
- "unknown": #78909C (gray)

VISUAL LAYOUT:
- Render households as small rounded squares (16x16px) arranged in a grid-like cluster layout representing wards
- Add thin gray lines between ward clusters representing roads/paths
- Background: very light cream with subtle grid lines

ANIMATIONS:
- On mount: all dots appear with scale 0→1, staggered 5ms apart (use CSS animation-delay with JS)
- Orange dots: pulse animation (scale 1→1.4→1, 2s infinite)
- Red dots: faster urgent pulse (scale 1→1.4→1, 1.2s infinite)

INTERACTIONS:
- Hover on any dot: show tooltip with household name, ward, status, and schemes count
- Filter controls above the map: "सभी" | "योग्य लेकिन वंचित" | "शून्य लाभ" — chips that filter dots (non-matching fade to 10% opacity with 300ms transition)

LEGEND: Bottom of map, horizontal, 4 colored circles with labels.

Use only React and CSS (no external map libraries). The layout doesn't need to be geographically accurate — a stylized cluster grid is fine.
```

---

### Prompt 6: Pathway Chart (Digital Twin)

```
Create a PathwayChart.jsx component using Recharts for the Sarathi Welfare Digital Twin page.

It shows 3 income trajectory lines over 3 years (monthly income on Y axis, time on X axis).

DATA STRUCTURE (prop: pathways):
{
  best: [{ month: 1, income: 2000, scheme: "PM Ujjwala" }, ...36 entries],
  medium: [...36 entries],
  minimum: [...36 entries]
}

VISUAL SPEC:
- Full width, 380px height (260px on mobile)
- X-axis: "माह 1" to "माह 36", show only year labels ("वर्ष 1", "वर्ष 2", "वर्ष 3") with quarterly dotted vertical reference lines
- Y-axis: ₹ monthly income, range 0 to 12000, formatted as "₹4,000"
- Poverty line: horizontal dashed red line at ₹8,000 with label "गरीबी रेखा" (Poverty Line)
- Line 1 (best): #E8740C saffron, 3px width, dot markers at scheme-change points
- Line 2 (medium): #0F2240 navy, 2px, dashed  
- Line 3 (minimum): #8A8578 gray, 1.5px, dotted
- Area under best line: saffron at 8% opacity
- Zone above poverty line: success green at 4% opacity

ABOVE CHART: Three tabs — "सर्वोत्तम" | "मध्यम" | "न्यूनतम" — clicking highlights that line and dims others

BELOW CHART: Dynamic text — "सर्वोत्तम मार्ग पर: आप {X} वर्षों में गरीबी रेखा पार करेंगे"

TOOLTIP on hover: Show month, income, and which scheme was just enrolled that month.

SCHEME MILESTONE ICONS: At each data point where scheme changes, render a small colored circle with a category icon on the line.

Use Recharts ComposedChart with Line and Area. Export as default.
```

---

### Prompt 7: Mock Data File

```
Create src/data/mockSchemes.js with 18 real Indian government welfare schemes as a JavaScript export.

Each scheme object must have:
{
  id: string (kebab-case),
  nameHindi: string,
  nameEnglish: string,
  ministry: string (real ministry name),
  category: "agriculture" | "housing" | "health" | "education" | "women" | "employment",
  annualBenefit: number (annual value in rupees),
  benefitDescription: string (in Hindi, 1 sentence),
  eligibility: {
    maxIncome: number | null,
    minAge: number,
    maxAge: number | null,
    gender: "any" | "female" | "male",
    category: ["SC", "ST", "OBC", "General"] (which apply),
    occupation: string[] | null,
    states: string[] | null (null = all India),
    isWidow: boolean | null,
    hasDisability: boolean | null,
  },
  documentsRequired: string[],
  applyUrl: string (real gov URL),
}

Include these schemes: PM-KISAN, PMAY-G, Ayushman Bharat, PM Ujjwala Yojana, MGNREGS, Indira Gandhi National Widow Pension, National Scholarship Portal (NSP), Beti Bachao Beti Padhao, PM Matru Vandana Yojana, PMEGP, NRLM (Aajeevika), Pradhan Mantri Jeevan Jyoti Bima Yojana, Atal Pension Yojana, Swachh Bharat Mission, PM Jan Dhan Yojana, Sukanya Samridhi Yojana, NFBS (National Family Benefit Scheme), Rashtriya Vayoshri Yojana.

Use real benefit amounts and real eligibility criteria from actual government scheme documents.
```

---

### Prompt 8: Full App Integration

```
Wire up the complete Sarathi React app. In App.jsx:

1. Wrap the entire app in LanguageContext.Provider and CitizenContext.Provider
2. Set up React Router with routes: / → LandingPage, /chat → ChatPage, /twin → TwinPage, /panchayat → PanchayatDashboard, /schemes → SchemesPage, /schemes/:id → SchemeDetailPage
3. Render Navbar on all routes (outside Routes, inside Router)
4. Add a Toast container for notifications

In LanguageContext.jsx:
- State: language ("hi" | "en"), default "hi"
- Function: toggleLanguage
- Export: useLanguage hook

In CitizenContext.jsx:
- State: citizenProfile (name, age, state, income, category, gender, isWidow, hasDisability, occupation, familySize)
- State: eligibleSchemes (array of scheme IDs)
- Functions: updateProfile, setEligibleSchemes
- Export: useCitizen hook

In src/utils/api.js:
- Create Axios instance with baseURL from environment variable VITE_API_BASE_URL
- Default headers: Content-Type application/json
- Export: get, post helper functions
- If VITE_API_BASE_URL is not set (local dev), use mock data from /src/data/ instead of making real API calls

Make ChatPage use the CitizenContext to store collected profile and pass to twin page via context (not URL params).
```

---

*End of Specification — Version 1.0*

---

**How to use this document with AI coding tools:**
1. Start with Prompt 1 (project setup) in a fresh Claude Code or Cursor session
2. Run each subsequent prompt in order
3. After each prompt, test the output in the browser before moving to the next
4. Reference the Design System section (Section 2) whenever you need to add custom styling
5. The Mock Data prompt (Prompt 7) can be run at any time — it has no dependencies
