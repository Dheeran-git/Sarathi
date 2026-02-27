export const citizens = [
  {
    id: 'kamla-devi',
    name: 'कमला देवी',
    nameEnglish: 'Kamla Devi',
    age: 55,
    gender: 'female',
    state: 'उत्तर प्रदेश',
    stateEnglish: 'Uttar Pradesh',
    district: 'बाराबंकी',
    income: 24000, // annual
    monthlyIncome: 2000,
    category: 'SC',
    occupation: 'daily-wage',
    isWidow: true,
    hasDisability: false,
    familySize: 3,
    hasDaughters: true,
    isFarmer: false,
    hasLand: false,
    quote: 'मुझे पता ही नहीं था कि मुझे विधवा पेंशन मिल सकती है।',
    quoteEnglish: "I didn't even know I could get a widow's pension.",
    outcome: '🎯 सारथी ने 6 योजनाएं ढूंढी | ₹24,000 सालाना',
    outcomeEnglish: '🎯 Sarathi found 6 schemes | ₹24,000/year',
    eligibleSchemes: ['pm-ujjwala', 'widow-pension', 'pmay-g', 'ayushman-bharat', 'mgnregs', 'sbm'],
    ward: 'वार्ड 2',
  },
  {
    id: 'ramu-prasad',
    name: 'रामू प्रसाद',
    nameEnglish: 'Ramu Prasad',
    age: 38,
    gender: 'male',
    state: 'बिहार',
    stateEnglish: 'Bihar',
    district: 'पटना',
    income: 96000,
    monthlyIncome: 8000,
    category: 'OBC',
    occupation: 'migrant-worker',
    isWidow: false,
    hasDisability: false,
    familySize: 5,
    hasDaughters: true,
    isFarmer: false,
    hasLand: false,
    quote: 'मुंबई आया तो बिहार की सारी सुविधाएं बंद हो गईं।',
    quoteEnglish: 'Came to Mumbai, all Bihar benefits stopped.',
    outcome: '🔄 राज्यों के बीच लाभ हस्तांतरित। 0 दिन का अंतर।',
    outcomeEnglish: '🔄 Benefits carried across states. 0 days gap.',
    eligibleSchemes: ['ayushman-bharat', 'pmjjby', 'apy', 'pmjdy', 'bbbp', 'ssy', 'pmegp'],
    ward: 'वार्ड 4',
  },
  {
    id: 'sarpanch-meena',
    name: 'सरपंच मीना',
    nameEnglish: 'Sarpanch Meena',
    age: 42,
    gender: 'female',
    state: 'राजस्थान',
    stateEnglish: 'Rajasthan',
    district: 'जयपुर',
    income: 180000,
    monthlyIncome: 15000,
    category: 'General',
    occupation: 'panchayat-official',
    isWidow: false,
    hasDisability: false,
    familySize: 4,
    hasDaughters: true,
    isFarmer: true,
    hasLand: true,
    quote: 'हर घर को जांचना मुश्किल था। अब सारथी बताता है।',
    quoteEnglish: 'Checking every household was hard. Now Sarathi tells us.',
    outcome: '📊 87 परिवार 30 दिनों में जुड़े।',
    outcomeEnglish: '📊 87 households enrolled in 30 days.',
    eligibleSchemes: ['pm-kisan', 'pmjjby', 'apy', 'ayushman-bharat'],
    ward: 'वार्ड 1',
  },
];

// Default citizen for chat flow demo
export const defaultCitizen = citizens[0];

// Chat profile steps
export const profileSteps = [
  { key: 'name', labelHindi: 'नाम', labelEnglish: 'Name', icon: '👤' },
  { key: 'age', labelHindi: 'आयु', labelEnglish: 'Age', icon: '🎂' },
  { key: 'state', labelHindi: 'राज्य', labelEnglish: 'State', icon: '📍' },
  { key: 'income', labelHindi: 'आय', labelEnglish: 'Income', icon: '💰' },
  { key: 'category', labelHindi: 'वर्ग', labelEnglish: 'Category', icon: '🏷️' },
  { key: 'family', labelHindi: 'परिवार', labelEnglish: 'Family', icon: '👨‍👩‍👧‍👦' },
];

// Quick reply chips for chat
export const stateChips = ['उत्तर प्रदेश', 'बिहार', 'राजस्थान', 'मध्य प्रदेश', 'महाराष्ट्र', 'अन्य राज्य ▾'];
export const categoryChips = ['SC', 'ST', 'OBC', 'General'];
export const occupationChips = ['किसान', 'मजदूर', 'प्रवासी कामगार', 'बेरोजगार', 'स्वरोजगार', 'अन्य'];

// Pathway data for Digital Twin chart (Kamla Devi scenario)
export const pathwayData = {
  best: Array.from({ length: 36 }, (_, i) => {
    const month = i + 1;
    let income = 2000;
    let scheme = null;
    let schemeEn = null;
    if (month >= 1) { income += 800; scheme = month === 1 ? 'पीएम उज्ज्वला' : null; schemeEn = month === 1 ? 'PM Ujjwala' : null; }
    if (month >= 3) { income += 1000; scheme = month === 3 ? 'विधवा पेंशन' : scheme; schemeEn = month === 3 ? 'Widow Pension' : schemeEn; }
    if (month >= 6) { income += 500; scheme = month === 6 ? 'आयुष्मान भारत' : scheme; schemeEn = month === 6 ? 'Ayushman Bharat' : schemeEn; }
    if (month >= 12) { income += 3000; scheme = month === 12 ? 'मनरेगा' : scheme; schemeEn = month === 12 ? 'MGNREGS' : schemeEn; }
    if (month >= 18) { income += 1000; scheme = month === 18 ? 'पीएमएवाई-जी शुरू' : scheme; schemeEn = month === 18 ? 'PMAY-G Start' : schemeEn; }
    if (month >= 24) { income += 1200; scheme = month === 24 ? 'एसबीएम' : scheme; schemeEn = month === 24 ? 'SBM' : schemeEn; }
    if (month >= 30) { income += 800; scheme = month === 30 ? 'कौशल प्रशिक्षण' : scheme; schemeEn = month === 30 ? 'Skill Training' : schemeEn; }
    return { month, income, scheme, schemeEn };
  }),
  medium: Array.from({ length: 36 }, (_, i) => {
    const month = i + 1;
    let income = 2000;
    if (month >= 3) income += 800;
    if (month >= 6) income += 1000;
    if (month >= 15) income += 2000;
    if (month >= 24) income += 1000;
    return { month, income, scheme: null };
  }),
  minimum: Array.from({ length: 36 }, (_, i) => {
    const month = i + 1;
    let income = 2000;
    if (month >= 6) income += 500;
    if (month >= 18) income += 1000;
    if (month >= 30) income += 500;
    return { month, income, scheme: null };
  }),
};
