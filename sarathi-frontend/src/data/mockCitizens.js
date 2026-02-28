export const citizens = [
  {
    id: 'kamla-devi',
    name: 'Kamla Devi',
    nameEnglish: 'Kamla Devi',
    age: 55,
    gender: 'female',
    state: 'Uttar Pradesh',
    stateEnglish: 'Uttar Pradesh',
    district: 'Barabanki',
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
    quote: "I didn't even know I could get a widow's pension.",
    quoteEnglish: "I didn't even know I could get a widow's pension.",
    outcome: '🎯 Sarathi found 6 schemes | ₹24,000/year',
    outcomeEnglish: '🎯 Sarathi found 6 schemes | ₹24,000/year',
    eligibleSchemes: ['pm-ujjwala', 'widow-pension', 'pmay-g', 'ayushman-bharat', 'mgnregs', 'sbm'],
    ward: 'Ward 2',
  },
  {
    id: 'ramu-prasad',
    name: 'Ramu Prasad',
    nameEnglish: 'Ramu Prasad',
    age: 38,
    gender: 'male',
    state: 'Bihar',
    stateEnglish: 'Bihar',
    district: 'Patna',
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
    quote: 'Came to Mumbai, all Bihar benefits stopped.',
    quoteEnglish: 'Came to Mumbai, all Bihar benefits stopped.',
    outcome: '🔄 Benefits carried across states. 0 days gap.',
    outcomeEnglish: '🔄 Benefits carried across states. 0 days gap.',
    eligibleSchemes: ['ayushman-bharat', 'pmjjby', 'apy', 'pmjdy', 'bbbp', 'ssy', 'pmegp'],
    ward: 'Ward 4',
  },
  {
    id: 'sarpanch-meena',
    name: 'Sarpanch Meena',
    nameEnglish: 'Sarpanch Meena',
    age: 42,
    gender: 'female',
    state: 'Rajasthan',
    stateEnglish: 'Rajasthan',
    district: 'Jaipur',
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
    quote: 'Checking every household was hard. Now Sarathi tells us.',
    quoteEnglish: 'Checking every household was hard. Now Sarathi tells us.',
    outcome: '📊 87 households enrolled in 30 days.',
    outcomeEnglish: '📊 87 households enrolled in 30 days.',
    eligibleSchemes: ['pm-kisan', 'pmjjby', 'apy', 'ayushman-bharat'],
    ward: 'Ward 1',
  },
];

// Default citizen for chat flow demo
export const defaultCitizen = citizens[0];

// Chat profile steps
export const profileSteps = [
  { key: 'name', labelEnglish: 'Name', icon: '👤' },
  { key: 'age', labelEnglish: 'Age', icon: '🎂' },
  { key: 'state', labelEnglish: 'State', icon: '📍' },
  { key: 'income', labelEnglish: 'Income', icon: '💰' },
  { key: 'category', labelEnglish: 'Category', icon: '🏷️' },
  { key: 'family', labelEnglish: 'Family', icon: '👨‍👩‍👧‍👦' },
];

// Quick reply chips for chat
export const stateChips = ['Uttar Pradesh', 'Bihar', 'Rajasthan', 'Madhya Pradesh', 'Maharashtra', 'Other ▾'];
export const categoryChips = ['SC', 'ST', 'OBC', 'General'];
export const occupationChips = ['Farmer', 'Daily Wage', 'Migrant Worker', 'Unemployed', 'Self-employed', 'Other'];

// Pathway data for Digital Twin chart (Kamla Devi scenario)
export const pathwayData = {
  best: Array.from({ length: 36 }, (_, i) => {
    const month = i + 1;
    let income = 2000;
    let scheme = null;
    let schemeEn = null;
    if (month >= 1) { income += 800; scheme = month === 1 ? 'PM Ujjwala' : null; schemeEn = month === 1 ? 'PM Ujjwala' : null; }
    if (month >= 3) { income += 1000; scheme = month === 3 ? 'Widow Pension' : scheme; schemeEn = month === 3 ? 'Widow Pension' : schemeEn; }
    if (month >= 6) { income += 500; scheme = month === 6 ? 'Ayushman Bharat' : scheme; schemeEn = month === 6 ? 'Ayushman Bharat' : schemeEn; }
    if (month >= 12) { income += 3000; scheme = month === 12 ? 'MGNREGS' : scheme; schemeEn = month === 12 ? 'MGNREGS' : schemeEn; }
    if (month >= 18) { income += 1000; scheme = month === 18 ? 'PMAY-G Start' : scheme; schemeEn = month === 18 ? 'PMAY-G Start' : schemeEn; }
    if (month >= 24) { income += 1200; scheme = month === 24 ? 'SBM' : scheme; schemeEn = month === 24 ? 'SBM' : schemeEn; }
    if (month >= 30) { income += 800; scheme = month === 30 ? 'Skill Training' : scheme; schemeEn = month === 30 ? 'Skill Training' : schemeEn; }
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
