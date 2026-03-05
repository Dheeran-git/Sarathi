🎯 Goal
=======

Transform the profile page into a **modern, professional dashboard-style profile page** similar to:

*   LinkedIn profile layout
    
*   GitHub profile overview
    
*   Modern SaaS dashboards
    
*   Stripe / Notion style UI
    

Key improvements:

*   Proper **profile header**
    
*   **Profile completion progress**
    
*   **Card layout**
    
*   **Better spacing**
    
*   **Icons and sections**
    
*   **Edit interactions**
    






Redesign the Profile Page UI to look like a modern SaaS dashboard instead of a simple stacked form.

Goal: Make the profile page visually similar to high-quality applications like LinkedIn, GitHub, Stripe Dashboard, or Notion settings pages.

Design Requirements:

1.  Profile Header Section
    

*   Large profile banner area at the top
    
*   Circular avatar with initials or profile image
    
*   Display:
    
    *   Full Name
        
    *   Email
        
    *   Username
        
*   Include a "Profile Completion" progress bar
    
*   Add a "Edit Profile" primary button
    
*   Clean spacing and modern typography
    

1.  Card-Based LayoutReplace the current long vertical form with modern cards.
    

Sections should include:

A. Personal Information CardFields:

*   Full Name
    
*   Age
    
*   Gender
    
*   Occupation
    

B. Demographics CardFields:

*   State
    
*   Social Category
    
*   Area Type
    

C. Financial Details CardFields:

*   Annual Income
    

D. Location Card

*   Map preview
    
*   "Set Location" button
    
*   Show current coordinates or address
    

Each card should:

*   Have rounded corners
    
*   Soft shadow
    
*   Proper padding
    
*   Section icon
    
*   Edit button in top-right
    

1.  Layout StructureUse a responsive grid layout:
    

Desktop:Left column:

*   Personal Information
    
*   Demographics
    

Right column:

*   Location
    
*   Financial Details
    
*   Quick Links
    

Mobile:Cards should stack vertically.

1.  Visual Design SystemUse modern UI standards:
    

Spacing:

*   24px between sections
    
*   16px padding inside cards
    

Colors:

*   Neutral background (#F8F9FB)
    
*   White cards
    
*   Primary accent color for buttons
    

Typography:

*   Large section headings
    
*   Smaller muted labels
    
*   Strong hierarchy
    

Icons:Use clean modern icons (Lucide / Heroicons).

1.  Interactions
    

*   Hover elevation for cards
    
*   Smooth button transitions
    
*   Editable fields with modal or inline editing
    

1.  Profile Completion LogicShow completion percentage based on filled fields.
    

Example:0% → empty profile100% → all fields completed

1.  UI Improvements
    

*   Replace "Not set" with placeholders like "Add your age"
    
*   Add subtle icons next to each field
    
*   Improve alignment and spacing
    

Output:Provide the full improved UI layout with React components and Tailwind styling, following modern SaaS design standards.



🎨 Visual improvements you should enforce
=========================================

Tell Antigravity to include:

*   **glassmorphism or soft shadows**
    
*   **consistent card sizes**
    
*   **better whitespace**
    
*   **responsive grid**
    

⭐ Bonus (very powerful improvement)
===================================

Ask Claude to also add:

 Profile Stats Section   `

Example:

`Schemes Applied      5`
`Eligible Schemes     12`
`Saved Schemes        3`

Apps always show **user stats**.