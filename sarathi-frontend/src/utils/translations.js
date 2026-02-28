/**
 * Centralized translations for UI text (English only).
 * Usage: const t = useTranslations();  →  t('heroTitle')
 */

const translations = {
  // ── Landing Page ────────────────────────────────────────────────────────
  heroTag: '🇮🇳 AWS AI for Bharat',
  heroLine1: 'Government Schemes,',
  heroLine2: 'To Your Doorstep.',
  heroSubtitle: "India's first AI-powered welfare delivery engine. Built for the poorest, the illiterate, and the invisible.",
  ctaStart: 'Start Now',
  ctaPanchayat: 'Panchayat Dashboard',
  trustData: '🔒 Data Secure',
  trustLang: '🗣️ 22 Languages',
  trustSpeed: '⚡ Results in 3 Seconds',

  // Problem section
  problemTitle1: '700+ Schemes.',
  problemTitle2: 'Access to Only 2-3.',
  problemSubtitle: 'The average eligible Indian family misses out on ₹40,000+ in annual benefits they are legally entitled to. Sarathi changes this.',
  problemCard1Title: 'Unaware',
  problemCard1Desc: "Citizens don't know which schemes they qualify for. Information is scattered across 47 different government portals.",
  problemCard2Title: 'Complexity',
  problemCard2Desc: 'Overlapping, conflicting eligibility rules. Taking one benefit can unknowingly disqualify you from a bigger one.',
  problemCard3Title: 'Inaccessible',
  problemCard3Desc: "Portals assume literacy, internet access, and digital confidence — none of which 70% of beneficiaries have.",

  // How it works
  howTitle: 'How Does Sarathi Work?',
  step1Title: 'Speak, We Will Listen',
  step1Desc: 'Just speak. Sarathi understands 22 Indian languages. No reading or writing required. Your voice is your identity.',
  step2Title: 'Right Scheme, Right Time',
  step2Desc: 'AI finds the right scheme from hundreds based on your profile. No scheme left behind.',
  step3Title: 'The Path Out of Poverty',
  step3Desc: 'Digital Twin shows you how taking the right schemes over 3 years can help you cross the poverty line.',

  // Personas
  personaTitle: 'Who is Sarathi For?',

  // Footer
  footerTagline: 'To Every Eligible Citizen.',
  footerQuickLinks: 'Quick Links',
  footerAbout: 'About',
  footerBuilt: 'Built for AWS AI for Bharat Hackathon 2025',
  footerOpen: 'Open source. Built with ❤️ in India.',

  // ── Chat Page ───────────────────────────────────────────────────────────
  chatWelcome: 'Hello! I am Sarathi.',
  chatWelcomeDesc: "I'll tell you which government schemes you can get.",
  chatChip1: 'Find Schemes',
  chatChip2: "I'm a Farmer",
  chatChip3: 'Widow Pension',
  chatPlaceholder: 'Type here or press mic...',

  // ── Schemes Page ────────────────────────────────────────────────────────
  schemesTitle: 'Government Schemes',
  schemesSearchPlaceholder: 'Search scheme name or ministry...',
  schemesAll: 'All',

  // ── Twin Page ───────────────────────────────────────────────────────────
  twinTitle: 'Your Welfare Roadmap',
  twinSubtitle: 'In the next 3 years, you can rise above the poverty line.',
  twinChangeProfile: 'Change Profile',
  twinCurrentIncome: 'Current Income',
  twinAfter3Years: 'After 3 Years',
  twinTotalBenefit: 'Total Annual Benefit',
  twinActiveSchemes: 'Active Schemes',
  twinIncomeChart: 'Income Trajectory',
  twinSchemeSequence: 'Scheme Sequence',
  twinConflict: 'Conflict Warning & Optimal Bundle',

  // ── Panchayat Dashboard ─────────────────────────────────────────────────
  panchHome: 'Home',
  panchDashboard: 'Panchayat Dashboard',
  panchLastUpdated: 'Last Updated',
  panchDownload: 'Download Report',
  panchTotalHouseholds: 'Total Households',
  panchReceiving: 'Receiving Benefits',
  panchEligibleNot: 'Eligible But Unserved',
  panchZero: 'Zero Benefits',
  panchThisMonth: 'Added This Month',
  panchMapTitle: 'Village Map',
};

export default translations;

/**
 * Helper: use from any component.
 *   import translations from '../utils/translations';
 *   const t = (key) => translations[key] || key;
 */
export function t(key, _language) {
  return translations[key] || key;
}
