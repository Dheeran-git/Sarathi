// ─────────────────────────────────────────────────────────────────────────────
// Mock Panchayat Data — Rampur Panchayat, Barabanki, Uttar Pradesh
// ─────────────────────────────────────────────────────────────────────────────

const firstNames = [
  'Kamla', 'Sita', 'Geeta', 'Lakshmi', 'Radhiya', 'Savitri', 'Parvati', 'Suman', 'Rekha', 'Manju',
  'Ram', 'Shyam', 'Mohan', 'Raju', 'Rahim', 'Suresh', 'Dinesh', 'Vijay', 'Prakash', 'Amar',
  'Babu', 'Mangal', 'Kamal', 'Naresh', 'Mahesh', 'Yogesh', 'Ganesh', 'Mukesh', 'Ramesh', 'Sunil',
  'Phoolmati', 'Champa', 'Gudiya', 'Bimla', 'Kiran', 'Saroj', 'Asha', 'Prema', 'Shakuntala', 'Mamta',
];

const lastNames = [
  'Devi', 'Prasad', 'Sharma', 'Singh', 'Yadav', 'Gupta', 'Patel', 'Verma', 'Kumar', 'Sheikh',
  'Maurya', 'Pandey', 'Mishra', 'Tiwari', 'Chauhan', 'Thakur', 'Sonkar', 'Rajbhar', 'Nishad', 'Bind',
];

const wards = ['Ward 1', 'Ward 2', 'Ward 3', 'Ward 4', 'Ward 5', 'Ward 6'];

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
  panchayatName: 'Rampur Panchayat',
  panchayatNameEnglish: 'Rampur Panchayat',
  district: 'Barabanki',
  state: 'Uttar Pradesh',
  lastUpdated: '2 hours ago',
};

// ── Alert Cards ──────────────────────────────────────────────────────────────
export const alerts = [
  {
    id: 'a1',
    type: 'urgent',
    icon: '🔴',
    title: '8 elderly citizens missing pension',
    titleEnglish: '8 elderly citizens missing pension',
    description: '8 citizens in Ward 3 aged 60+ have not yet received old-age pension.',
    descriptionEnglish: '8 citizens in Ward 3 aged 60+ have not yet received old-age pension.',
    action: 'View List',
    actionEnglish: 'View List',
    time: '3 hours ago',
    timeEnglish: '3 hours ago',
  },
  {
    id: 'a2',
    type: 'warning',
    icon: '🟠',
    title: '5 girls turn 18 — prepare for scholarship',
    titleEnglish: '5 girls turn 18 — prepare for scholarship',
    description: '5 girls will turn 18 in the next 2 months. Prepare their scholarship documents now.',
    descriptionEnglish: '5 girls will turn 18 in the next 2 months. Prepare their scholarship documents now.',
    action: 'Doc Checklist',
    actionEnglish: 'Doc Checklist',
    time: '5 hours ago',
    timeEnglish: '5 hours ago',
  },
  {
    id: 'a3',
    type: 'info',
    icon: '🔵',
    title: 'New birth registered — mother eligible for PMMVY',
    titleEnglish: 'New birth registered — mother eligible for PMMVY',
    description: 'A son was born to Kalpana Devi. She is eligible for PM Matru Vandana (₹5,000).',
    descriptionEnglish: 'A son was born to Kalpana Devi. She is eligible for PM Matru Vandana (₹5,000).',
    action: 'Apply',
    actionEnglish: 'Apply',
    time: '1 day ago',
    timeEnglish: '1 day ago',
  },
  {
    id: 'a4',
    type: 'warning',
    icon: '🟠',
    title: '12 farmers missing PM-KISAN 3rd installment',
    titleEnglish: '12 farmers missing PM-KISAN 3rd installment',
    description: '12 farmer families in Ward 1 and 5 did not receive the 3rd installment of PM-KISAN. Verify bank details.',
    descriptionEnglish: '12 farmer families in Ward 1 and 5 did not receive the 3rd installment of PM-KISAN. Verify bank details.',
    action: 'View List',
    actionEnglish: 'View List',
    time: '1 day ago',
    timeEnglish: '1 day ago',
  },
  {
    id: 'a5',
    type: 'urgent',
    icon: '🔴',
    title: '3 widows pension accounts blocked',
    titleEnglish: '3 widows pension accounts blocked',
    description: 'Widow pension of 3 women stopped due to Aadhaar linking. Update KYC instantly.',
    descriptionEnglish: 'Widow pension of 3 women stopped due to Aadhaar linking. Update KYC instantly.',
    action: 'Update KYC',
    actionEnglish: 'Update KYC',
    time: '2 days ago',
    timeEnglish: '2 days ago',
  },
];

// ── Eligible But Not Enrolled Citizens Table ─────────────────────────────────
export const eligibleCitizens = [
  {
    id: 'EC-001',
    name: 'Kamla Devi',
    ward: 'Ward 2',
    age: 55,
    category: 'Widow',
    categoryEnglish: 'Widow',
    gender: 'female',
    missingSchemes: ['PM Ujjwala', 'Widow Pension', 'PMAY'],
    missingSchemesEnglish: ['PM Ujjwala', 'Widow Pension', 'PMAY'],
    estimatedBenefit: 36000,
    status: 'deprived',
    statusLabel: '🔴 Deprived',
    statusLabelEnglish: '🔴 Deprived',
  },
  {
    id: 'EC-002',
    name: 'Rahim Sheikh',
    ward: 'Ward 4',
    age: 62,
    category: 'BPL',
    categoryEnglish: 'BPL',
    gender: 'male',
    missingSchemes: ['Old-age Pension'],
    missingSchemesEnglish: ['Old-age Pension'],
    estimatedBenefit: 12000,
    status: 'partial',
    statusLabel: '🟠 Partial',
    statusLabelEnglish: '🟠 Partial',
  },
  {
    id: 'EC-003',
    name: 'Savitri Yadav',
    ward: 'Ward 1',
    age: 34,
    category: 'OBC',
    categoryEnglish: 'OBC',
    gender: 'female',
    missingSchemes: ['PM Ujjwala', 'PMMVY', 'Ayushman Bharat'],
    missingSchemesEnglish: ['PM Ujjwala', 'PMMVY', 'Ayushman Bharat'],
    estimatedBenefit: 28000,
    status: 'deprived',
    statusLabel: '🔴 Deprived',
    statusLabelEnglish: '🔴 Deprived',
  },
  {
    id: 'EC-004',
    name: 'Dinesh Kumar',
    ward: 'Ward 3',
    age: 45,
    category: 'SC',
    categoryEnglish: 'SC',
    gender: 'male',
    missingSchemes: ['PM-KISAN', 'MGNREGS'],
    missingSchemesEnglish: ['PM-KISAN', 'MGNREGS'],
    estimatedBenefit: 42000,
    status: 'partial',
    statusLabel: '🟠 Partial',
    statusLabelEnglish: '🟠 Partial',
  },
  {
    id: 'EC-005',
    name: 'Lakshmi Prasad',
    ward: 'Ward 5',
    age: 70,
    category: 'General',
    categoryEnglish: 'General',
    gender: 'male',
    missingSchemes: ['Old-age Pension', 'Ayushman Bharat', 'RVY'],
    missingSchemesEnglish: ['Old-age Pension', 'Ayushman Bharat', 'RVY'],
    estimatedBenefit: 35000,
    status: 'deprived',
    statusLabel: '🔴 Deprived',
    statusLabelEnglish: '🔴 Deprived',
  },
  {
    id: 'EC-006',
    name: 'Geeta Sharma',
    ward: 'Ward 2',
    age: 28,
    category: 'General',
    categoryEnglish: 'General',
    gender: 'female',
    missingSchemes: ['PM Ujjwala', 'Sukanya Samriddhi'],
    missingSchemesEnglish: ['PM Ujjwala', 'Sukanya Samriddhi'],
    estimatedBenefit: 18000,
    status: 'partial',
    statusLabel: '🟠 Partial',
    statusLabelEnglish: '🟠 Partial',
  },
  {
    id: 'EC-007',
    name: 'Mohan Singh',
    ward: 'Ward 6',
    age: 52,
    category: 'ST',
    categoryEnglish: 'ST',
    gender: 'male',
    missingSchemes: ['PM-KISAN', 'Ayushman Bharat', 'PMJJBY'],
    missingSchemesEnglish: ['PM-KISAN', 'Ayushman Bharat', 'PMJJBY'],
    estimatedBenefit: 30000,
    status: 'deprived',
    statusLabel: '🔴 Deprived',
    statusLabelEnglish: '🔴 Deprived',
  },
  {
    id: 'EC-008',
    name: 'Rekha Verma',
    ward: 'Ward 1',
    age: 48,
    category: 'OBC',
    categoryEnglish: 'OBC',
    gender: 'female',
    missingSchemes: ['PM Ujjwala', 'MGNREGS'],
    missingSchemesEnglish: ['PM Ujjwala', 'MGNREGS'],
    estimatedBenefit: 22000,
    status: 'partial',
    statusLabel: '🟠 Partial',
    statusLabelEnglish: '🟠 Partial',
  },
  {
    id: 'EC-009',
    name: 'Babu Ram',
    ward: 'Ward 3',
    age: 65,
    category: 'SC',
    categoryEnglish: 'SC',
    gender: 'male',
    missingSchemes: ['Old-age Pension', 'RVY'],
    missingSchemesEnglish: ['Old-age Pension', 'RVY'],
    estimatedBenefit: 27000,
    status: 'deprived',
    statusLabel: '🔴 Deprived',
    statusLabelEnglish: '🔴 Deprived',
  },
  {
    id: 'EC-010',
    name: 'Champa Devi',
    ward: 'Ward 4',
    age: 40,
    category: 'SC',
    categoryEnglish: 'SC',
    gender: 'female',
    missingSchemes: ['PM Ujjwala', 'PMAY', 'Ayushman Bharat'],
    missingSchemesEnglish: ['PM Ujjwala', 'PMAY', 'Ayushman Bharat'],
    estimatedBenefit: 40000,
    status: 'deprived',
    statusLabel: '🔴 Deprived',
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
