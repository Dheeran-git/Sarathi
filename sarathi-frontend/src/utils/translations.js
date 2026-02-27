/**
 * Centralized translations for Hindi/English UI text.
 * Usage: const t = useTranslations();  →  t('heroTitle')
 */

const translations = {
  // ── Landing Page ────────────────────────────────────────────────────────
  heroTag: { hi: '🇮🇳 AWS AI for Bharat', en: '🇮🇳 AWS AI for Bharat' },
  heroLine1: { hi: 'सरकारी योजनाएं,', en: 'Government Schemes,' },
  heroLine2: { hi: 'आपके द्वार तक।', en: 'To Your Doorstep.' },
  heroSubtitle: {
    hi: 'भारत का पहला AI-संचालित कल्याण वितरण इंजन। सबसे गरीब, अनपढ़ और अदृश्य लोगों के लिए।',
    en: "India's first AI-powered welfare delivery engine. Built for the poorest, the illiterate, and the invisible.",
  },
  ctaStart: { hi: 'अभी शुरू करें', en: 'Start Now' },
  ctaPanchayat: { hi: 'पंचायत डैशबोर्ड', en: 'Panchayat Dashboard' },
  trustData: { hi: '🔒 डेटा सुरक्षित', en: '🔒 Data Secure' },
  trustLang: { hi: '🗣️ २२ भाषाएं', en: '🗣️ 22 Languages' },
  trustSpeed: { hi: '⚡ ३ सेकंड में परिणाम', en: '⚡ Results in 3 Seconds' },

  // Problem section
  problemTitle1: { hi: '७००+ योजनाएं।', en: '700+ Schemes.' },
  problemTitle2: { hi: 'केवल २-३ तक पहुंच।', en: 'Access to Only 2-3.' },
  problemSubtitle: {
    hi: 'औसत पात्र भारतीय परिवार हर साल ₹४०,०००+ के वार्षिक लाभों से वंचित रह जाता है जिनका वे कानूनी रूप से हकदार हैं। सारथी इसे बदलता है।',
    en: 'The average eligible Indian family misses out on ₹40,000+ in annual benefits they are legally entitled to. Sarathi changes this.',
  },
  problemCard1Title: { hi: 'अनजान', en: 'Unaware' },
  problemCard1Desc: {
    hi: 'नागरिकों को नहीं पता कि वे किन योजनाओं के लिए पात्र हैं। जानकारी ४७ विभिन्न सरकारी पोर्टलों पर बिखरी हुई है।',
    en: "Citizens don't know which schemes they qualify for. Information is scattered across 47 different government portals.",
  },
  problemCard2Title: { hi: 'जटिलता', en: 'Complexity' },
  problemCard2Desc: {
    hi: 'ओवरलैपिंग, विरोधाभासी पात्रता नियम। एक लाभ लेने से अनजाने में आप बड़े लाभ से अयोग्य हो सकते हैं।',
    en: 'Overlapping, conflicting eligibility rules. Taking one benefit can unknowingly disqualify you from a bigger one.',
  },
  problemCard3Title: { hi: 'पहुंच नहीं', en: 'Inaccessible' },
  problemCard3Desc: {
    hi: 'पोर्टल साक्षरता, इंटरनेट एक्सेस और डिजिटल आत्मविश्वास मानते हैं — जो ७०% लाभार्थियों के पास नहीं है।',
    en: "Portals assume literacy, internet access, and digital confidence — none of which 70% of beneficiaries have.",
  },

  // How it works
  howTitle: { hi: 'सारथी कैसे काम करता है?', en: 'How Does Sarathi Work?' },
  step1Title: { hi: 'बोलें, और हम सुनेंगे', en: 'Speak, We Will Listen' },
  step1Desc: {
    hi: 'बस बोलिए। सारथी २२ भारतीय भाषाओं को समझता है। पढ़ना-लिखना जरूरी नहीं। आपकी आवाज़ ही आपकी पहचान है।',
    en: 'Just speak. Sarathi understands 22 Indian languages. No reading or writing required. Your voice is your identity.',
  },
  step2Title: { hi: 'सही योजना, सही समय पर', en: 'Right Scheme, Right Time' },
  step2Desc: {
    hi: 'AI आपकी प्रोफाइल के आधार पर सैकड़ों योजनाओं में से सही योजना ढूंढता है। कोई भी योजना छूटे नहीं।',
    en: 'AI finds the right scheme from hundreds based on your profile. No scheme left behind.',
  },
  step3Title: { hi: 'गरीबी से निकलने का रास्ता', en: 'The Path Out of Poverty' },
  step3Desc: {
    hi: 'डिजिटल ट्विन आपको दिखाता है कि ३ वर्षों में सही योजनाएं लेकर आप कैसे गरीबी रेखा पार कर सकते हैं।',
    en: 'Digital Twin shows you how taking the right schemes over 3 years can help you cross the poverty line.',
  },

  // Personas
  personaTitle: { hi: 'सारथी किसके लिए है?', en: 'Who is Sarathi For?' },

  // Footer
  footerTagline: { hi: 'हर पात्र नागरिक तक।', en: 'To Every Eligible Citizen.' },
  footerQuickLinks: { hi: 'त्वरित लिंक', en: 'Quick Links' },
  footerAbout: { hi: 'About', en: 'About' },
  footerBuilt: { hi: 'Built for AWS AI for Bharat Hackathon 2025', en: 'Built for AWS AI for Bharat Hackathon 2025' },
  footerOpen: { hi: 'Open source. Built with ❤️ in India.', en: 'Open source. Built with ❤️ in India.' },

  // ── Chat Page ───────────────────────────────────────────────────────────
  chatWelcome: { hi: 'नमस्ते! मैं सारथी हूँ।', en: 'Hello! I am Sarathi.' },
  chatWelcomeDesc: {
    hi: 'आपको कौन सी सरकारी योजनाएं मिल सकती हैं — यह मैं आपको बताऊंगा।',
    en: "I'll tell you which government schemes you can get.",
  },
  chatChip1: { hi: 'योजनाएं ढूंढें', en: 'Find Schemes' },
  chatChip2: { hi: 'किसान हूँ', en: "I'm a Farmer" },
  chatChip3: { hi: 'विधवा पेंशन', en: 'Widow Pension' },
  chatPlaceholder: { hi: 'यहाँ लिखें या माइक दबाएं...', en: 'Type here or press mic...' },

  // ── Schemes Page ────────────────────────────────────────────────────────
  schemesTitle: { hi: 'सरकारी योजनाएं', en: 'Government Schemes' },
  schemesSearchPlaceholder: { hi: 'योजना का नाम या मंत्रालय खोजें...', en: 'Search scheme name or ministry...' },
  schemesAll: { hi: 'सभी', en: 'All' },

  // ── Twin Page ───────────────────────────────────────────────────────────
  twinTitle: { hi: 'आपका कल्याण रोडमैप', en: 'Your Welfare Roadmap' },
  twinSubtitle: {
    hi: 'अगले 3 वर्षों में आप गरीबी रेखा से ऊपर आ सकते हैं।',
    en: 'In the next 3 years, you can rise above the poverty line.',
  },
  twinChangeProfile: { hi: 'प्रोफाइल बदलें', en: 'Change Profile' },
  twinCurrentIncome: { hi: 'वर्तमान आय', en: 'Current Income' },
  twinAfter3Years: { hi: '3 वर्ष बाद', en: 'After 3 Years' },
  twinTotalBenefit: { hi: 'कुल सालाना लाभ', en: 'Total Annual Benefit' },
  twinActiveSchemes: { hi: 'सक्रिय योजनाएं', en: 'Active Schemes' },
  twinIncomeChart: { hi: 'आय प्रक्षेपवक्र', en: 'Income Trajectory' },
  twinSchemeSequence: { hi: 'योजना क्रम', en: 'Scheme Sequence' },
  twinConflict: { hi: 'टकराव चेतावनी & सर्वोत्तम बंडल', en: 'Conflict Warning & Optimal Bundle' },

  // ── Panchayat Dashboard ─────────────────────────────────────────────────
  panchHome: { hi: 'होम', en: 'Home' },
  panchDashboard: { hi: 'पंचायत डैशबोर्ड', en: 'Panchayat Dashboard' },
  panchLastUpdated: { hi: 'अंतिम अपडेट', en: 'Last Updated' },
  panchDownload: { hi: 'रिपोर्ट डाउनलोड', en: 'Download Report' },
  panchTotalHouseholds: { hi: 'कुल परिवार', en: 'Total Households' },
  panchReceiving: { hi: 'लाभान्वित', en: 'Receiving Benefits' },
  panchEligibleNot: { hi: 'पात्र लेकिन वंचित', en: 'Eligible But Unserved' },
  panchZero: { hi: 'शून्य लाभ', en: 'Zero Benefits' },
  panchThisMonth: { hi: 'इस माह जुड़े', en: 'Added This Month' },
  panchMapTitle: { hi: 'गांव का नक्शा', en: 'Village Map' },
};

export default translations;

/**
 * Helper: use from any component.
 *   import { useLanguage } from '../context/LanguageContext';
 *   import translations from '../utils/translations';
 *   const { language } = useLanguage();
 *   const t = (key) => translations[key]?.[language] || translations[key]?.hi || key;
 */
export function t(key, language) {
  return translations[key]?.[language] || translations[key]?.hi || key;
}
