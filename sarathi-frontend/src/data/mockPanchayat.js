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

// ── Analytics Mock Data ─────────────────────────────────────────────────────
export const mockAnalytics = {
  schemeEnrollment: [
    { scheme: 'PM-KISAN', eligible: 120, enrolled: 85, gap: 35 },
    { scheme: 'PMAY-G', eligible: 95, enrolled: 42, gap: 53 },
    { scheme: 'Ayushman Bharat', eligible: 310, enrolled: 198, gap: 112 },
    { scheme: 'PM Ujjwala', eligible: 88, enrolled: 61, gap: 27 },
    { scheme: 'MGNREGS', eligible: 145, enrolled: 102, gap: 43 },
    { scheme: 'IGNWPS Pension', eligible: 35, enrolled: 22, gap: 13 },
    { scheme: 'NSP Scholarship', eligible: 28, enrolled: 15, gap: 13 },
    { scheme: 'PMEGP', eligible: 18, enrolled: 5, gap: 13 },
  ],
  categoryDistribution: [
    { name: 'Agriculture', value: 35, color: '#22c55e' },
    { name: 'Housing', value: 18, color: '#3b82f6' },
    { name: 'Health', value: 22, color: '#ef4444' },
    { name: 'Women & Child', value: 12, color: '#ec4899' },
    { name: 'Employment', value: 8, color: '#f59e0b' },
    { name: 'Education', value: 5, color: '#8b5cf6' },
  ],
  applicationTrend: [
    { month: 'Apr', applications: 12 },
    { month: 'May', applications: 18 },
    { month: 'Jun', applications: 22 },
    { month: 'Jul', applications: 15 },
    { month: 'Aug', applications: 28 },
    { month: 'Sep', applications: 35 },
    { month: 'Oct', applications: 42 },
    { month: 'Nov', applications: 38 },
    { month: 'Dec', applications: 31 },
    { month: 'Jan', applications: 45 },
    { month: 'Feb', applications: 52 },
    { month: 'Mar', applications: 48 },
  ],
  keyMetrics: {
    totalBenefitUnlocked: 1856000,
    totalBenefitPotential: 3240000,
    welfareGap: 1384000,
    avgSchemesPerCitizen: 2.3,
  },
};

// ── Campaigns Mock Data ─────────────────────────────────────────────────────
export const mockCampaigns = [
  {
    campaignId: 'CMP-001',
    targetCriteria: 'Widows without IGNWPS pension',
    recipientCount: 12,
    messageText: 'Dear citizen, you may be eligible for ₹12,000/year under Widow Pension. Visit your Panchayat office to apply.',
    language: 'english',
    sentAt: '2026-02-28T10:30:00Z',
    deliveredCount: 11,
    conversionCount: 4,
    status: 'completed',
  },
  {
    campaignId: 'CMP-002',
    targetCriteria: 'Farmers without PM-KISAN',
    recipientCount: 35,
    messageText: 'Dear farmer, PM-KISAN provides ₹6,000/year. Register at your Gram Panchayat with land documents.',
    language: 'english',
    sentAt: '2026-02-15T14:00:00Z',
    deliveredCount: 32,
    conversionCount: 8,
    status: 'completed',
  },
  {
    campaignId: 'CMP-003',
    targetCriteria: 'Elderly (60+) without pension',
    recipientCount: 8,
    messageText: 'Namaskar! Aap Old Age Pension ke liye eligible hain. Panchayat office mein aaye.',
    language: 'hindi',
    sentAt: '2026-03-01T09:00:00Z',
    deliveredCount: 7,
    conversionCount: 2,
    status: 'completed',
  },
];

// ── Grievances Mock Data ────────────────────────────────────────────────────
export const mockGrievances = [
  {
    grievanceId: 'GRV-001',
    citizenId: 'EC-001',
    citizenName: 'Kamla Devi',
    category: 'benefit_not_received',
    description: 'Widow pension not credited for last 3 months despite approved status.',
    status: 'open',
    assignedTo: 'panchayat',
    createdAt: '2026-03-01T08:00:00Z',
    slaDeadline: '2026-03-08T08:00:00Z',
    resolutionNote: '',
  },
  {
    grievanceId: 'GRV-002',
    citizenId: 'EC-004',
    citizenName: 'Dinesh Kumar',
    category: 'application_stuck',
    description: 'PM-KISAN application submitted 2 months ago, no update received.',
    status: 'in_progress',
    assignedTo: 'block',
    createdAt: '2026-02-20T10:00:00Z',
    slaDeadline: '2026-02-27T10:00:00Z',
    resolutionNote: 'Escalated to block office for bank detail verification.',
  },
  {
    grievanceId: 'GRV-003',
    citizenId: 'EC-007',
    citizenName: 'Mohan Singh',
    category: 'wrong_eligibility',
    description: 'Marked as ineligible for Ayushman Bharat despite meeting all criteria.',
    status: 'resolved',
    assignedTo: 'panchayat',
    createdAt: '2026-02-10T12:00:00Z',
    slaDeadline: '2026-02-17T12:00:00Z',
    resolvedAt: '2026-02-14T15:00:00Z',
    resolutionNote: 'Corrected category in system. Citizen now showing as eligible.',
  },
  {
    grievanceId: 'GRV-004',
    citizenId: 'EC-002',
    citizenName: 'Rahim Sheikh',
    category: 'benefit_not_received',
    description: 'MGNREGS wages not paid for January work done.',
    status: 'escalated',
    assignedTo: 'district',
    createdAt: '2026-02-05T09:00:00Z',
    slaDeadline: '2026-02-12T09:00:00Z',
    resolutionNote: 'SLA breached. Auto-escalated to district collector office.',
  },
];

// ── Calendar Events Mock Data ───────────────────────────────────────────────
export const mockCalendarEvents = [
  { id: 'cal-1', date: '2026-03-15', type: 'scheme_deadline', title: 'PM-KISAN April Installment Deadline', priority: 'high', schemeId: 'pm-kisan' },
  { id: 'cal-2', date: '2026-03-20', type: 'life_event', title: 'Priya Devi turns 18 — NSP Scholarship eligible', priority: 'medium', citizenId: 'EC-006' },
  { id: 'cal-3', date: '2026-03-25', type: 'campaign', title: 'PM Ujjwala awareness drive — Ward 2 & 4', priority: 'low' },
  { id: 'cal-4', date: '2026-04-01', type: 'life_event', title: '3 citizens turn 60 — IGNOAPS pension pre-register', priority: 'high' },
  { id: 'cal-5', date: '2026-04-10', type: 'scheme_deadline', title: 'PMAY-G application window closes', priority: 'high', schemeId: 'pmay-g' },
  { id: 'cal-6', date: '2026-04-15', type: 'audit', title: 'Block-level performance review — monthly report due', priority: 'medium' },
  { id: 'cal-7', date: '2026-03-10', type: 'life_event', title: 'Suman Devi — 7th month pregnancy — PMMVY installment due', priority: 'high', citizenId: 'EC-003' },
  { id: 'cal-8', date: '2026-03-28', type: 'campaign', title: 'Ayushman Bharat card distribution camp', priority: 'medium' },
];

// ── Village Profile Mock Data ───────────────────────────────────────────────
export const mockVillageProfile = {
  demographics: {
    totalPopulation: 487,
    maleCount: 258,
    femaleCount: 229,
    genderRatio: 887, // females per 1000 males
    ageGroups: [
      { range: '0-17', count: 98 },
      { range: '18-30', count: 112 },
      { range: '31-45', count: 105 },
      { range: '46-60', count: 92 },
      { range: '60+', count: 80 },
    ],
    categoryBreakdown: [
      { category: 'General', count: 145 },
      { category: 'OBC', count: 168 },
      { category: 'SC', count: 112 },
      { category: 'ST', count: 62 },
    ],
    bplHouseholds: 134,
  },
  economic: {
    incomeDistribution: [
      { range: '₹0 – ₹5K', count: 85 },
      { range: '₹5K – ₹10K', count: 142 },
      { range: '₹10K – ₹20K', count: 168 },
      { range: '₹20K+', count: 92 },
    ],
    occupations: [
      { name: 'Farmer', count: 165 },
      { name: 'Labourer', count: 98 },
      { name: 'Business', count: 45 },
      { name: 'Student', count: 82 },
      { name: 'Unemployed', count: 52 },
      { name: 'Senior/Retired', count: 45 },
    ],
    avgMonthlyIncome: 8500,
  },
  hamlets: [
    { name: 'Rampur Tola', citizenCount: 198, coverage: 72 },
    { name: 'Naya Gaon', citizenCount: 125, coverage: 58 },
    { name: 'Harijan Basti', citizenCount: 95, coverage: 45 },
    { name: 'Majra', citizenCount: 69, coverage: 62 },
  ],
  infrastructure: {
    hasAshaWorker: true,
    hasAnganwadi: true,
    hasBankBranch: false,
    hasPostOffice: true,
    internetConnectivity: 'Poor',
    nearestHospitalKm: 12,
    nearestBankKm: 5,
  },
};

