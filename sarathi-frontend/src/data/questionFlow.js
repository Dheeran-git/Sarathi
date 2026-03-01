/**
 * questionFlow.js — Dynamic question flow engine for Sarathi
 *
 * Defines core questions, persona detection, and conditional branch questions.
 * Each question has: key, prompt (en), promptHi, type, options (for choice/boolean).
 * Branch questions have a `condition` function that receives the current profile
 * and returns true if the question should be asked.
 */

/* ── Phase 1: Core Profile Questions (asked to everyone) ─────────────── */
export const CORE_QUESTIONS = [
    {
        key: 'name',
        prompt: 'What is your full name?',
        promptHi: 'आपका पूरा नाम क्या है?',
        type: 'text',
    },
    {
        key: 'age',
        prompt: 'How old are you?',
        promptHi: 'आपकी उम्र क्या है?',
        type: 'number',
    },
    {
        key: 'gender',
        prompt: 'What is your gender?',
        promptHi: 'आपका लिंग क्या है?',
        type: 'choice',
        options: [
            { value: 'male', label: 'Male', labelHi: 'पुरुष' },
            { value: 'female', label: 'Female', labelHi: 'महिला' },
            { value: 'other', label: 'Other', labelHi: 'अन्य' },
        ],
    },
    {
        key: 'maritalStatus',
        prompt: 'What is your marital status?',
        promptHi: 'आपकी वैवाहिक स्थिति क्या है?',
        type: 'choice',
        options: [
            { value: 'unmarried', label: 'Unmarried', labelHi: 'अविवाहित' },
            { value: 'married', label: 'Married', labelHi: 'विवाहित' },
            { value: 'widowed', label: 'Widowed', labelHi: 'विधवा/विधुर' },
            { value: 'divorced', label: 'Divorced', labelHi: 'तलाकशुदा' },
        ],
    },
    {
        key: 'state',
        prompt: 'Which state do you live in?',
        promptHi: 'आप किस राज्य में रहते हैं?',
        type: 'text',
    },
    {
        key: 'urban',
        prompt: 'Do you live in an urban or rural area?',
        promptHi: 'आप शहरी या ग्रामीण क्षेत्र में रहते हैं?',
        type: 'choice',
        options: [
            { value: 'urban', label: 'Urban', labelHi: 'शहरी' },
            { value: 'rural', label: 'Rural', labelHi: 'ग्रामीण' },
        ],
    },
    {
        key: 'income',
        prompt: 'What is your annual household income (₹)?',
        promptHi: 'आपकी वार्षिक पारिवारिक आय कितनी है (₹)?',
        type: 'number',
    },
    {
        key: 'category',
        prompt: 'What is your caste category?',
        promptHi: 'आपकी जाति श्रेणी क्या है?',
        type: 'choice',
        options: [
            { value: 'General', label: 'General', labelHi: 'सामान्य' },
            { value: 'OBC', label: 'OBC', labelHi: 'ओबीसी' },
            { value: 'SC', label: 'SC', labelHi: 'अनुसूचित जाति' },
            { value: 'ST', label: 'ST', labelHi: 'अनुसूचित जनजाति' },
            { value: 'EWS', label: 'EWS', labelHi: 'ईडब्ल्यूएस' },
        ],
    },
    {
        key: 'disability',
        prompt: 'Do you have any disability?',
        promptHi: 'क्या आपको कोई विकलांगता है?',
        type: 'boolean',
    },
    {
        key: 'occupation',
        prompt: 'What is your occupation type?',
        promptHi: 'आपका व्यवसाय क्या है?',
        type: 'choice',
        options: [
            { value: 'farmer', label: 'Farmer', labelHi: 'किसान' },
            { value: 'daily_wage', label: 'Daily Wage', labelHi: 'दैनिक मजदूर' },
            { value: 'self_employed', label: 'Self Employed', labelHi: 'स्वरोजगार' },
            { value: 'salaried', label: 'Govt/Private Salaried', labelHi: 'वेतनभोगी' },
            { value: 'unemployed', label: 'Unemployed', labelHi: 'बेरोजगार' },
            { value: 'student', label: 'Student', labelHi: 'छात्र' },
            { value: 'homemaker', label: 'Homemaker', labelHi: 'गृहिणी' },
            { value: 'retired', label: 'Retired', labelHi: 'सेवानिवृत्त' },
        ],
    },
    {
        key: 'bplCard',
        prompt: 'What type of ration card do you have?',
        promptHi: 'आपके पास किस प्रकार का राशन कार्ड है?',
        type: 'choice',
        options: [
            { value: 'bpl', label: 'BPL (Below Poverty Line)', labelHi: 'बीपीएल' },
            { value: 'aay', label: 'AAY (Antyodaya)', labelHi: 'अंत्योदय' },
            { value: 'apl', label: 'APL (Above Poverty Line)', labelHi: 'एपीएल' },
            { value: 'none', label: 'No Ration Card', labelHi: 'कोई राशन कार्ड नहीं' },
        ],
    },
];

/* ── Phase 2: Persona Detection ──────────────────────────────────────── */
export const PERSONA_QUESTION = {
    key: 'persona',
    prompt: 'Which of these best describes your situation? (Select all that apply)',
    promptHi: 'इनमें से कौन सा आपकी स्थिति का सबसे अच्छा वर्णन करता है?',
    type: 'choice',
    options: [
        { value: 'farmer', label: '🌾 Farmer', labelHi: '🌾 किसान' },
        { value: 'student', label: '📚 Student', labelHi: '📚 छात्र' },
        { value: 'unemployed', label: '🔍 Unemployed / Job Seeker', labelHi: '🔍 बेरोजगार' },
        { value: 'business_owner', label: '🏪 Business / Self-Employed', labelHi: '🏪 व्यापारी / स्वरोजगार' },
        { value: 'senior', label: '👴 Senior Citizen (60+)', labelHi: '👴 वरिष्ठ नागरिक' },
        { value: 'homemaker', label: '🏠 Homemaker', labelHi: '🏠 गृहिणी' },
        { value: 'disabled', label: '♿ Person with Disability', labelHi: '♿ विकलांग व्यक्ति' },
        { value: 'pregnant', label: '🤰 Pregnant / Lactating', labelHi: '🤰 गर्भवती / स्तनपान' },
    ],
};

/* ── Phase 3: Conditional Branch Questions ───────────────────────────── */
export const BRANCH_QUESTIONS = {
    farmer: [
        {
            key: 'landOwned',
            prompt: 'Do you own agricultural land?',
            promptHi: 'क्या आपके पास कृषि भूमि है?',
            type: 'boolean',
        },
        {
            key: 'landSize',
            prompt: 'How much land do you own (in acres)?',
            promptHi: 'आपके पास कितनी जमीन है (एकड़ में)?',
            type: 'number',
            condition: (p) => p.landOwned === true,
        },
        {
            key: 'tenantFarmer',
            prompt: 'Are you a tenant farmer (farming on rented land)?',
            promptHi: 'क्या आप बटाईदार/किरायेदार किसान हैं?',
            type: 'boolean',
            condition: (p) => !p.landOwned,
        },
        {
            key: 'livestock',
            prompt: 'Do you own any livestock (cattle, poultry, etc.)?',
            promptHi: 'क्या आपके पास पशुधन है?',
            type: 'boolean',
        },
        {
            key: 'irrigatedLand',
            prompt: 'Is your farmland irrigated?',
            promptHi: 'क्या आपकी भूमि सिंचित है?',
            type: 'boolean',
            condition: (p) => p.landOwned === true,
        },
    ],

    student: [
        {
            key: 'classLevel',
            prompt: 'What class/level are you studying in?',
            promptHi: 'आप किस कक्षा में पढ़ रहे हैं?',
            type: 'choice',
            options: [
                { value: 'primary', label: 'Class 1-5', labelHi: 'कक्षा 1-5' },
                { value: 'middle', label: 'Class 6-8', labelHi: 'कक्षा 6-8' },
                { value: 'secondary', label: 'Class 9-12', labelHi: 'कक्षा 9-12' },
                { value: 'college', label: 'College / University', labelHi: 'कॉलेज / विश्वविद्यालय' },
            ],
        },
        {
            key: 'govtSchool',
            prompt: 'Are you studying in a government school/college?',
            promptHi: 'क्या आप सरकारी स्कूल/कॉलेज में पढ़ रहे हैं?',
            type: 'boolean',
        },
        {
            key: 'minority',
            prompt: 'Do you belong to a religious minority community?',
            promptHi: 'क्या आप धार्मिक अल्पसंख्यक समुदाय से हैं?',
            type: 'boolean',
        },
    ],

    unemployed: [
        {
            key: 'skillTrained',
            prompt: 'Have you received any vocational or skill training?',
            promptHi: 'क्या आपने कोई व्यावसायिक प्रशिक्षण लिया है?',
            type: 'boolean',
        },
        {
            key: 'interestedInTraining',
            prompt: 'Are you interested in free skill training?',
            promptHi: 'क्या आप मुफ्त कौशल प्रशिक्षण में रुचि रखते हैं?',
            type: 'boolean',
        },
        {
            key: 'educationLevel',
            prompt: 'What is your highest education level?',
            promptHi: 'आपकी सबसे ऊंची शिक्षा क्या है?',
            type: 'choice',
            options: [
                { value: 'none', label: 'No Formal Education', labelHi: 'कोई शिक्षा नहीं' },
                { value: 'primary', label: 'Primary (1-5)', labelHi: 'प्राथमिक' },
                { value: 'secondary', label: 'Secondary (6-12)', labelHi: 'माध्यमिक' },
                { value: 'graduate', label: 'Graduate', labelHi: 'स्नातक' },
                { value: 'postgrad', label: 'Post Graduate', labelHi: 'स्नातकोत्तर' },
            ],
        },
    ],

    business_owner: [
        {
            key: 'msmeRegistered',
            prompt: 'Is your business MSME/Udyam registered?',
            promptHi: 'क्या आपका व्यवसाय MSME/उद्यम पंजीकृत है?',
            type: 'boolean',
        },
        {
            key: 'businessTurnover',
            prompt: 'What is your approximate annual business turnover (₹)?',
            promptHi: 'आपका अनुमानित वार्षिक व्यापार कितना है (₹)?',
            type: 'number',
        },
        {
            key: 'loanNeeded',
            prompt: 'Do you need a business loan?',
            promptHi: 'क्या आपको व्यवसाय ऋण की आवश्यकता है?',
            type: 'boolean',
        },
    ],

    senior: [
        {
            key: 'pensionReceiving',
            prompt: 'Are you currently receiving any pension?',
            promptHi: 'क्या आप वर्तमान में कोई पेंशन प्राप्त कर रहे हैं?',
            type: 'boolean',
        },
    ],

    homemaker: [
        {
            key: 'shgMember',
            prompt: 'Are you a member of a Self Help Group (SHG)?',
            promptHi: 'क्या आप किसी स्वयं सहायता समूह की सदस्य हैं?',
            type: 'boolean',
        },
        {
            key: 'isWidow',
            prompt: 'Are you a widow?',
            promptHi: 'क्या आप विधवा हैं?',
            type: 'boolean',
            condition: (p) => p.gender === 'female',
        },
    ],

    disabled: [
        {
            key: 'disabilityPercent',
            prompt: 'What is your disability percentage?',
            promptHi: 'आपकी विकलांगता प्रतिशत कितनी है?',
            type: 'choice',
            options: [
                { value: '40-60', label: '40-60%', labelHi: '40-60%' },
                { value: '60-80', label: '60-80%', labelHi: '60-80%' },
                { value: '80+', label: '80%+', labelHi: '80%+' },
            ],
        },
        {
            key: 'disabilityType',
            prompt: 'What type of disability?',
            promptHi: 'किस प्रकार की विकलांगता?',
            type: 'choice',
            options: [
                { value: 'locomotor', label: 'Locomotor', labelHi: 'चलने-फिरने' },
                { value: 'visual', label: 'Visual', labelHi: 'दृष्टि' },
                { value: 'hearing', label: 'Hearing / Speech', labelHi: 'श्रवण / वाक्' },
                { value: 'intellectual', label: 'Intellectual', labelHi: 'बौद्धिक' },
                { value: 'multiple', label: 'Multiple', labelHi: 'एकाधिक' },
            ],
        },
        {
            key: 'disabilityCertificate',
            prompt: 'Do you have a disability certificate (UDID)?',
            promptHi: 'क्या आपके पास विकलांगता प्रमाण पत्र (UDID) है?',
            type: 'boolean',
        },
    ],

    pregnant: [
        {
            key: 'pregnant',
            prompt: 'Are you currently pregnant?',
            promptHi: 'क्या आप वर्तमान में गर्भवती हैं?',
            type: 'boolean',
        },
        {
            key: 'lactating',
            prompt: 'Are you a lactating mother?',
            promptHi: 'क्या आप स्तनपान कराने वाली माँ हैं?',
            type: 'boolean',
        },
    ],
};

/* ── Gender-based additional questions (asked if gender = female) ─────── */
export const FEMALE_BRANCH_QUESTIONS = [
    {
        key: 'isWidow',
        prompt: 'Are you a widow?',
        promptHi: 'क्या आप विधवा हैं?',
        type: 'boolean',
        condition: (p) => p.maritalStatus === 'widowed' || !p.maritalStatus,
    },
    {
        key: 'shgMember',
        prompt: 'Are you a member of a Self Help Group (SHG)?',
        promptHi: 'क्या आप किसी स्वयं सहायता समूह की सदस्य हैं?',
        type: 'boolean',
    },
];

/* ── Urban-specific questions ──────────────────────────────────────────── */
export const URBAN_BRANCH_QUESTIONS = [
    {
        key: 'ownHouse',
        prompt: 'Do you own a house?',
        promptHi: 'क्या आपका अपना मकान है?',
        type: 'boolean',
    },
    {
        key: 'streetVendor',
        prompt: 'Are you a street vendor?',
        promptHi: 'क्या आप फेरीवाले/रेहड़ीवाले हैं?',
        type: 'boolean',
    },
];

/* ── Rural-specific questions ──────────────────────────────────────────── */
export const RURAL_BRANCH_QUESTIONS = [
    {
        key: 'kutchaHouse',
        prompt: 'Do you live in a kutcha (temporary) house?',
        promptHi: 'क्या आप कच्चे मकान में रहते हैं?',
        type: 'boolean',
    },
    {
        key: 'mgnregaCard',
        prompt: 'Do you have a MGNREGA Job Card?',
        promptHi: 'क्या आपके पास मनरेगा जॉब कार्ड है?',
        type: 'boolean',
    },
];


/* ── Question Flow Engine ────────────────────────────────────────────── */

/**
 * Given a partial profile, compute the full ordered list of questions
 * that should be asked. Returns an array of question objects.
 */
export function buildQuestionFlow(profile = {}) {
    const questions = [...CORE_QUESTIONS];

    // Persona detection
    questions.push(PERSONA_QUESTION);

    // Persona-specific branches
    const persona = profile.persona || '';
    if (persona && BRANCH_QUESTIONS[persona]) {
        const branchQs = BRANCH_QUESTIONS[persona].filter(
            (q) => !q.condition || q.condition(profile)
        );
        questions.push(...branchQs);
    }

    // Gender-specific (female)
    if (profile.gender === 'female') {
        const femaleQs = FEMALE_BRANCH_QUESTIONS.filter(
            (q) => !q.condition || q.condition(profile)
        );
        questions.push(...femaleQs);
    }

    // Urban / Rural specific
    if (profile.urban === true) {
        questions.push(...URBAN_BRANCH_QUESTIONS);
    } else if (profile.urban === false) {
        questions.push(...RURAL_BRANCH_QUESTIONS);
    }

    return questions;
}

/**
 * Given the current profile state, determine which question to ask next.
 * Returns the next question object, or null if all questions are answered.
 */
export function getNextQuestion(profile = {}) {
    const allQuestions = buildQuestionFlow(profile);
    for (const q of allQuestions) {
        const val = profile[q.key];
        if (val === undefined || val === null || val === '') {
            return q;
        }
    }
    return null; // All answered
}

/**
 * Parse a user's text answer into the correct typed value for a question.
 */
export function parseAnswer(question, rawText) {
    const text = rawText.trim();
    switch (question.type) {
        case 'number':
            return parseInt(text.replace(/[^\d]/g, ''), 10) || 0;
        case 'boolean': {
            const lower = text.toLowerCase();
            return ['yes', 'हां', 'हाँ', 'ha', '1', 'true'].includes(lower);
        }
        case 'choice': {
            // Try exact match on value or label
            if (question.options) {
                const lower = text.toLowerCase();
                const match = question.options.find(
                    (o) =>
                        o.value.toLowerCase() === lower ||
                        o.label.toLowerCase() === lower ||
                        (o.labelHi && o.labelHi === text)
                );
                if (match) return match.value;
                // Special handling for urban/rural
                if (question.key === 'urban') {
                    return lower.includes('urban') || lower.includes('शहर') ? 'urban' : 'rural';
                }
            }
            return text;
        }
        default:
            return text;
    }
}

/**
 * Convert raw profile values to the format expected by the eligibility engine.
 */
export function profileToEligibilityPayload(profile) {
    return {
        age: profile.age || 0,
        gender: profile.gender || 'any',
        income: profile.income || 0,
        monthlyIncome: profile.income ? Math.round(profile.income / 12) : 0,
        category: profile.category || 'General',
        occupation: profile.occupation || 'any',
        isWidow: profile.isWidow || profile.maritalStatus === 'widowed' || false,
        disability: profile.disability || false,
        urban: profile.urban === 'urban' ? true : profile.urban === 'rural' ? false : profile.urban,
        landOwned: profile.landOwned || false,
        persona: profile.persona || '',
        pregnant: profile.pregnant || false,
        shgMember: profile.shgMember || false,
        state: profile.state || '',
        name: profile.name || '',
    };
}
