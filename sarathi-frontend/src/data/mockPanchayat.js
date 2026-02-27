// ─────────────────────────────────────────────────────────────────────────────
// Mock Panchayat Data — Rampur Panchayat, Barabanki, Uttar Pradesh
// ─────────────────────────────────────────────────────────────────────────────

const firstNames = [
  'कमला', 'सीता', 'गीता', 'लक्ष्मी', 'रधिया', 'सावित्री', 'पार्वती', 'सुमन', 'रेखा', 'मंजू',
  'राम', 'श्याम', 'मोहन', 'राजू', 'रहीम', 'सुरेश', 'दिनेश', 'विजय', 'प्रकाश', 'अमर',
  'बाबू', 'मंगल', 'कमल', 'नरेश', 'महेश', 'योगेश', 'गणेश', 'मुकेश', 'रमेश', 'सुनील',
  'फूलमती', 'चम्पा', 'गुड़िया', 'बिमला', 'किरण', 'सरोज', 'आशा', 'प्रेमा', 'शकुंतला', 'ममता',
];

const lastNames = [
  'देवी', 'प्रसाद', 'शर्मा', 'सिंह', 'यादव', 'गुप्ता', 'पटेल', 'वर्मा', 'कुमार', 'शेख',
  'मौर्य', 'पांडे', 'मिश्रा', 'तिवारी', 'चौहान', 'ठाकुर', 'सोनकर', 'राजभर', 'निषाद', 'बिंद',
];

const wards = ['वार्ड 1', 'वार्ड 2', 'वार्ड 3', 'वार्ड 4', 'वार्ड 5', 'वार्ड 6'];

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Seed a pseudo-random generator for reproducibility
let seed = 42;
function seededRandom() {
  seed = (seed * 16807) % 2147483647;
  return (seed - 1) / 2147483646;
}

// Generate 487 households with realistic distribution
// ~64% enrolled (312), ~18% eligible (87), ~7% none (34), ~11% unknown (54)
function generateHouseholds(count = 487) {
  const result = [];
  for (let i = 0; i < count; i++) {
    const r = seededRandom();
    let status;
    if (r < 0.64) status = 'enrolled';
    else if (r < 0.82) status = 'eligible';
    else if (r < 0.89) status = 'none';
    else status = 'unknown';

    const firstName = firstNames[Math.floor(seededRandom() * firstNames.length)];
    const lastName = lastNames[Math.floor(seededRandom() * lastNames.length)];
    const ward = wards[Math.floor(seededRandom() * wards.length)];
    const age = Math.floor(seededRandom() * 60) + 18;
    const schemesCount = status === 'enrolled' ? Math.floor(seededRandom() * 5) + 1
      : status === 'eligible' ? 0
      : 0;

    result.push({
      id: `HH-${String(i + 1).padStart(4, '0')}`,
      name: `${firstName} ${lastName}`,
      ward,
      age,
      status,
      schemesCount,
      category: pickRandom(['SC', 'ST', 'OBC', 'General']),
      gender: seededRandom() > 0.5 ? 'male' : 'female',
    });
  }
  return result;
}

export const households = generateHouseholds();

// ── Dashboard Stats ──────────────────────────────────────────────────────────
export const panchayatStats = {
  totalHouseholds: 487,
  receiving: 312,
  receivingPercent: 64,
  eligibleNotEnrolled: 87,
  zeroBenefits: 34,
  addedThisMonth: 23,
  panchayatName: 'रामपुर पंचायत',
  panchayatNameEnglish: 'Rampur Panchayat',
  district: 'बाराबंकी',
  state: 'उत्तर प्रदेश',
  lastUpdated: '2 घंटे पहले',
};

// ── Alert Cards ──────────────────────────────────────────────────────────────
export const alerts = [
  {
    id: 'a1',
    type: 'urgent',
    icon: '🔴',
    title: '८ बुजुर्ग नागरिक पेंशन से वंचित',
    titleEnglish: '8 elderly citizens missing pension',
    description: 'वार्ड ३ में ८ नागरिक जो ६०+ आयु के हैं, उन्हें अभी तक वृद्धावस्था पेंशन नहीं मिली।',
    descriptionEnglish: '8 citizens in Ward 3 aged 60+ have not yet received old-age pension.',
    action: 'सूची देखें',
    actionEnglish: 'View List',
    time: '३ घंटे पहले',
    timeEnglish: '3 hours ago',
  },
  {
    id: 'a2',
    type: 'warning',
    icon: '🟠',
    title: '५ बालिकाएं १८ वर्ष होंगी — छात्रवृत्ति के लिए तैयार करें',
    titleEnglish: '5 girls turn 18 — prepare for scholarship',
    description: 'अगले २ महीनों में ५ बालिकाएं १८ वर्ष पूरी करेंगी। उनके छात्रवृत्ति दस्तावेज़ अभी तैयार करें।',
    descriptionEnglish: '5 girls will turn 18 in the next 2 months. Prepare their scholarship documents now.',
    action: 'दस्तावेज़ चेकलिस्ट',
    actionEnglish: 'Doc Checklist',
    time: '५ घंटे पहले',
    timeEnglish: '5 hours ago',
  },
  {
    id: 'a3',
    type: 'info',
    icon: '🔵',
    title: 'नया जन्म पंजीकृत — माँ पीएम मातृ वंदना के योग्य',
    titleEnglish: 'New birth registered — mother eligible for PMMVY',
    description: 'कल्पना देवी के घर बेटे का जन्म हुआ। वे पीएम मातृ वंदना (₹५,०००) के लिए योग्य हैं।',
    descriptionEnglish: 'A son was born to Kalpana Devi. She is eligible for PM Matru Vandana (₹5,000).',
    action: 'आवेदन करें',
    actionEnglish: 'Apply',
    time: '१ दिन पहले',
    timeEnglish: '1 day ago',
  },
  {
    id: 'a4',
    type: 'warning',
    icon: '🟠',
    title: '१२ किसान पीएम-किसान की ३री किश्त से वंचित',
    titleEnglish: '12 farmers missing PM-KISAN 3rd installment',
    description: 'वार्ड १ और ५ में १२ किसान परिवारों को पीएम-किसान की तीसरी किश्त नहीं मिली। बैंक विवरण सत्यापित करें।',
    descriptionEnglish: '12 farmer families in Ward 1 and 5 did not receive the 3rd installment of PM-KISAN. Verify bank details.',
    action: 'सूची देखें',
    actionEnglish: 'View List',
    time: '१ दिन पहले',
    timeEnglish: '1 day ago',
  },
  {
    id: 'a5',
    type: 'urgent',
    icon: '🔴',
    title: '३ विधवा महिलाओं का पेंशन खाता बंद',
    titleEnglish: '3 widows pension accounts blocked',
    description: 'आधार लिंकिंग के कारण ३ महिलाओं की विधवा पेंशन रुकी है। तत्काल KYC अपडेट करें।',
    descriptionEnglish: 'Widow pension of 3 women stopped due to Aadhaar linking. Update KYC instantly.',
    action: 'KYC अपडेट',
    actionEnglish: 'Update KYC',
    time: '२ दिन पहले',
    timeEnglish: '2 days ago',
  },
];

// ── Eligible But Not Enrolled Citizens Table ─────────────────────────────────
export const eligibleCitizens = [
  {
    id: 'EC-001',
    name: 'कमला देवी',
    ward: 'वार्ड 2',
    age: 55,
    category: 'विधवा',
    categoryEnglish: 'Widow',
    gender: 'female',
    missingSchemes: ['पीएम उज्ज्वला', 'विधवा पेंशन', 'पीएम आवास योजना'],
    missingSchemesEnglish: ['PM Ujjwala', 'Widow Pension', 'PMAY'],
    estimatedBenefit: 36000,
    status: 'deprived',
    statusLabel: '🔴 वंचित',
    statusLabelEnglish: '🔴 Deprived',
  },
  {
    id: 'EC-002',
    name: 'रहीम शेख',
    ward: 'वार्ड 4',
    age: 62,
    category: 'बीपीएल',
    categoryEnglish: 'BPL',
    gender: 'male',
    missingSchemes: ['वृद्धावस्था पेंशन'],
    missingSchemesEnglish: ['Old-age Pension'],
    estimatedBenefit: 12000,
    status: 'partial',
    statusLabel: '🟠 आंशिक',
    statusLabelEnglish: '🟠 Partial',
  },
  {
    id: 'EC-003',
    name: 'सावित्री यादव',
    ward: 'वार्ड 1',
    age: 34,
    category: 'ओबीसी',
    categoryEnglish: 'OBC',
    gender: 'female',
    missingSchemes: ['पीएम उज्ज्वला', 'पीएम मातृ वंदना', 'आयुष्मान भारत'],
    missingSchemesEnglish: ['PM Ujjwala', 'PMMVY', 'Ayushman Bharat'],
    estimatedBenefit: 28000,
    status: 'deprived',
    statusLabel: '🔴 वंचित',
    statusLabelEnglish: '🔴 Deprived',
  },
  {
    id: 'EC-004',
    name: 'दिनेश कुमार',
    ward: 'वार्ड 3',
    age: 45,
    category: 'एससी',
    categoryEnglish: 'SC',
    gender: 'male',
    missingSchemes: ['पीएम-किसान', 'मनरेगा'],
    missingSchemesEnglish: ['PM-KISAN', 'MGNREGS'],
    estimatedBenefit: 42000,
    status: 'partial',
    statusLabel: '🟠 आंशिक',
    statusLabelEnglish: '🟠 Partial',
  },
  {
    id: 'EC-005',
    name: 'लक्ष्मी प्रसाद',
    ward: 'वार्ड 5',
    age: 70,
    category: 'सामान्य',
    categoryEnglish: 'General',
    gender: 'male',
    missingSchemes: ['वृद्धावस्था पेंशन', 'आयुष्मान भारत', 'राष्ट्रीय वयोश्री योजना'],
    missingSchemesEnglish: ['Old-age Pension', 'Ayushman Bharat', 'RVY'],
    estimatedBenefit: 35000,
    status: 'deprived',
    statusLabel: '🔴 वंचित',
    statusLabelEnglish: '🔴 Deprived',
  },
  {
    id: 'EC-006',
    name: 'गीता शर्मा',
    ward: 'वार्ड 2',
    age: 28,
    category: 'सामान्य',
    categoryEnglish: 'General',
    gender: 'female',
    missingSchemes: ['पीएम उज्ज्वला', 'सुकन्या समृद्धि'],
    missingSchemesEnglish: ['PM Ujjwala', 'Sukanya Samriddhi'],
    estimatedBenefit: 18000,
    status: 'partial',
    statusLabel: '🟠 आंशिक',
    statusLabelEnglish: '🟠 Partial',
  },
  {
    id: 'EC-007',
    name: 'मोहन सिंह',
    ward: 'वार्ड 6',
    age: 52,
    category: 'एसटी',
    categoryEnglish: 'ST',
    gender: 'male',
    missingSchemes: ['पीएम-किसान', 'आयुष्मान भारत', 'पीएम जीवन ज्योति बीमा'],
    missingSchemesEnglish: ['PM-KISAN', 'Ayushman Bharat', 'PMJJBY'],
    estimatedBenefit: 30000,
    status: 'deprived',
    statusLabel: '🔴 वंचित',
    statusLabelEnglish: '🔴 Deprived',
  },
  {
    id: 'EC-008',
    name: 'रेखा वर्मा',
    ward: 'वार्ड 1',
    age: 48,
    category: 'ओबीसी',
    categoryEnglish: 'OBC',
    gender: 'female',
    missingSchemes: ['पीएम उज्ज्वला', 'मनरेगा'],
    missingSchemesEnglish: ['PM Ujjwala', 'MGNREGS'],
    estimatedBenefit: 22000,
    status: 'partial',
    statusLabel: '🟠 आंशिक',
    statusLabelEnglish: '🟠 Partial',
  },
  {
    id: 'EC-009',
    name: 'बाबू राम',
    ward: 'वार्ड 3',
    age: 65,
    category: 'एससी',
    categoryEnglish: 'SC',
    gender: 'male',
    missingSchemes: ['वृद्धावस्था पेंशन', 'राष्ट्रीय वयोश्री योजना'],
    missingSchemesEnglish: ['Old-age Pension', 'RVY'],
    estimatedBenefit: 27000,
    status: 'deprived',
    statusLabel: '🔴 वंचित',
    statusLabelEnglish: '🔴 Deprived',
  },
  {
    id: 'EC-010',
    name: 'चम्पा देवी',
    ward: 'वार्ड 4',
    age: 40,
    category: 'एससी',
    categoryEnglish: 'SC',
    gender: 'female',
    missingSchemes: ['पीएम उज्ज्वला', 'पीएम आवास योजना', 'आयुष्मान भारत'],
    missingSchemesEnglish: ['PM Ujjwala', 'PMAY', 'Ayushman Bharat'],
    estimatedBenefit: 40000,
    status: 'deprived',
    statusLabel: '🔴 वंचित',
    statusLabelEnglish: '🔴 Deprived',
  },
];

// ── Governance Heatmap Data ─────────────────────────────────────────────────
const schemeNames = ['PM-KISAN', 'PMAY', 'Ayushman', 'Ujjwala', 'MGNREGS', 'Pension', 'PMJDY', 'NSP'];

export const heatmapData = wards.map((ward) => ({
  ward,
  schemes: schemeNames.map((scheme) => ({
    scheme,
    enrollment: Math.floor(seededRandom() * 100),
    eligible: Math.floor(seededRandom() * 30) + 5,
    enrolled: Math.floor(seededRandom() * 25) + 2,
  })),
}));

export const heatmapSchemes = schemeNames;
