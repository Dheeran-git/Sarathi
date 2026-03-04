/**
 * questionFlow.js
 *
 * Drives the conversational eligibility flow in ChatPage.
 * Exports:
 *   CORE_QUESTIONS, PERSONA_QUESTION,
 *   BRANCH_QUESTIONS, FEMALE_BRANCH_QUESTIONS,
 *   URBAN_BRANCH_QUESTIONS, RURAL_BRANCH_QUESTIONS,
 *   getNextQuestion, parseAnswer, profileToEligibilityPayload
 */

/* ── Core demographic questions (always asked) ────────────────────────── */
export const CORE_QUESTIONS = [
    {
        key: 'name',
        type: 'text',
        prompt: 'What is your full name?',
        promptHi: 'आपका पूरा नाम क्या है?',
    },
    {
        key: 'age',
        type: 'number',
        prompt: 'How old are you?',
        promptHi: 'आपकी उम्र कितनी है?',
    },
    {
        key: 'gender',
        type: 'choice',
        prompt: 'What is your gender?',
        promptHi: 'आपका लिंग क्या है?',
        options: [
            { value: 'male', label: 'Male', labelHi: 'पुरुष' },
            { value: 'female', label: 'Female', labelHi: 'महिला' },
            { value: 'other', label: 'Other', labelHi: 'अन्य' },
        ],
    },
    {
        key: 'state',
        type: 'text',
        prompt: 'Which state do you live in?',
        promptHi: 'आप किस राज्य में रहते हैं?',
    },
    {
        key: 'income',
        type: 'number',
        prompt: 'What is your approximate annual household income (in ₹)?',
        promptHi: 'आपकी वार्षिक घरेलू आय लगभग कितनी है (₹ में)?',
    },
    {
        key: 'category',
        type: 'choice',
        prompt: 'What is your social category?',
        promptHi: 'आपकी सामाजिक श्रेणी क्या है?',
        options: [
            { value: 'General', label: 'General', labelHi: 'सामान्य' },
            { value: 'OBC', label: 'OBC', labelHi: 'ओबीसी' },
            { value: 'SC', label: 'SC', labelHi: 'अनुसूचित जाति' },
            { value: 'ST', label: 'ST', labelHi: 'अनुसूचित जनजाति' },
        ],
    },
    {
        key: 'urban',
        type: 'choice',
        prompt: 'Do you live in an urban or rural area?',
        promptHi: 'आप शहरी क्षेत्र में रहते हैं या ग्रामीण क्षेत्र में?',
        options: [
            { value: 'urban', label: 'Urban', labelHi: 'शहरी' },
            { value: 'rural', label: 'Rural', labelHi: 'ग्रामीण' },
        ],
    },
];

/* ── Persona / Occupation question ────────────────────────────────────── */
export const PERSONA_QUESTION = {
    key: 'persona',
    type: 'choice',
    prompt: 'Which category best describes your occupation?',
    promptHi: 'आपका पेशा किस श्रेणी में आता है?',
    options: [
        { value: 'farmer', label: 'Farmer', labelHi: 'किसान' },
        { value: 'labourer', label: 'Daily-wage Labourer', labelHi: 'दिहाड़ी मजदूर' },
        { value: 'student', label: 'Student', labelHi: 'विद्यार्थी' },
        { value: 'homemaker', label: 'Homemaker', labelHi: 'गृहिणी' },
        { value: 'self-employed', label: 'Self-employed / Small Business', labelHi: 'स्वरोजगार / छोटा व्यवसाय' },
        { value: 'salaried', label: 'Salaried / Govt Employee', labelHi: 'वेतनभोगी / सरकारी कर्मचारी' },
        { value: 'unemployed', label: 'Unemployed', labelHi: 'बेरोजगार' },
        { value: 'senior', label: 'Senior Citizen / Retired', labelHi: 'वरिष्ठ नागरिक / सेवानिवृत्त' },
    ],
};

/* ── Branch questions by persona ──────────────────────────────────────── */
export const BRANCH_QUESTIONS = {
    farmer: [
        {
            key: 'landOwned',
            type: 'boolean',
            prompt: 'Do you own agricultural land?',
            promptHi: 'क्या आपके पास कृषि भूमि है?',
        },
        {
            key: 'shgMember',
            type: 'boolean',
            prompt: 'Are you a member of any Self-Help Group (SHG)?',
            promptHi: 'क्या आप किसी स्वयं सहायता समूह (SHG) के सदस्य हैं?',
        },
    ],
    labourer: [
        {
            key: 'hasJobCard',
            type: 'boolean',
            prompt: 'Do you have a MGNREGS Job Card?',
            promptHi: 'क्या आपके पास मनरेगा जॉब कार्ड है?',
        },
    ],
    student: [
        {
            key: 'educationLevel',
            type: 'choice',
            prompt: 'What is your current education level?',
            promptHi: 'आपकी वर्तमान शिक्षा का स्तर क्या है?',
            options: [
                { value: 'school', label: 'School (up to 12th)', labelHi: 'स्कूल (12वीं तक)' },
                { value: 'college', label: 'College / University', labelHi: 'कॉलेज / विश्वविद्यालय' },
                { value: 'vocational', label: 'Vocational / ITI', labelHi: 'व्यावसायिक / आईटीआई' },
            ],
        },
    ],
    homemaker: [],
    'self-employed': [
        {
            key: 'hasEnterprise',
            type: 'boolean',
            prompt: 'Do you already run a small business or enterprise?',
            promptHi: 'क्या आप पहले से कोई छोटा व्यवसाय चलाते हैं?',
        },
    ],
    salaried: [],
    unemployed: [
        {
            key: 'seekingWork',
            type: 'boolean',
            prompt: 'Are you actively looking for work?',
            promptHi: 'क्या आप सक्रिय रूप से काम की तलाश में हैं?',
        },
    ],
    senior: [
        {
            key: 'disability',
            type: 'boolean',
            prompt: 'Do you have any disability?',
            promptHi: 'क्या आपको कोई विकलांगता है?',
        },
    ],
};

/* ── Female-only branch questions ─────────────────────────────────────── */
export const FEMALE_BRANCH_QUESTIONS = [
    {
        key: 'isWidow',
        type: 'boolean',
        prompt: 'Are you a widow?',
        promptHi: 'क्या आप विधवा हैं?',
    },
    {
        key: 'pregnant',
        type: 'boolean',
        prompt: 'Are you currently pregnant or a new mother?',
        promptHi: 'क्या आप वर्तमान में गर्भवती हैं या नई माँ हैं?',
    },
];

/* ── Urban-only branch questions ──────────────────────────────────────── */
export const URBAN_BRANCH_QUESTIONS = [
    {
        key: 'hasRationCard',
        type: 'boolean',
        prompt: 'Do you have a ration card?',
        promptHi: 'क्या आपके पास राशन कार्ड है?',
    },
];

/* ── Rural-only branch questions ──────────────────────────────────────── */
export const RURAL_BRANCH_QUESTIONS = [
    {
        key: 'hasRationCard',
        type: 'boolean',
        prompt: 'Do you have a ration card?',
        promptHi: 'क्या आपके पास राशन कार्ड है?',
    },
    {
        key: 'shgMember',
        type: 'boolean',
        prompt: 'Are you a member of a Self-Help Group (SHG)?',
        promptHi: 'क्या आप किसी स्वयं सहायता समूह (SHG) के सदस्य हैं?',
        condition: (profile) => profile.persona !== 'farmer', // farmers already asked
    },
];

/* ── getNextQuestion: determines the next unanswered question ─────────── */
export function getNextQuestion(profile) {
    // 1. Core questions
    for (const q of CORE_QUESTIONS) {
        if (profile[q.key] === undefined || profile[q.key] === null || profile[q.key] === '') {
            return q;
        }
    }

    // 2. Persona question
    if (!profile.persona) {
        return PERSONA_QUESTION;
    }

    // 3. Persona-specific branch questions
    const branchQs = BRANCH_QUESTIONS[profile.persona] || [];
    for (const q of branchQs) {
        if (q.condition && !q.condition(profile)) continue;
        if (profile[q.key] === undefined || profile[q.key] === null || profile[q.key] === '') {
            return q;
        }
    }

    // 4. Female branch questions
    if (profile.gender === 'female') {
        for (const q of FEMALE_BRANCH_QUESTIONS) {
            if (q.condition && !q.condition(profile)) continue;
            if (profile[q.key] === undefined || profile[q.key] === null || profile[q.key] === '') {
                return q;
            }
        }
    }

    // 5. Urban / Rural branch questions
    const locationQs =
        profile.urban === true
            ? URBAN_BRANCH_QUESTIONS
            : profile.urban === false
                ? RURAL_BRANCH_QUESTIONS
                : [];
    for (const q of locationQs) {
        if (q.condition && !q.condition(profile)) continue;
        if (profile[q.key] === undefined || profile[q.key] === null || profile[q.key] === '') {
            return q;
        }
    }

    // All done
    return null;
}

/* ── parseAnswer: convert raw user text into the correct value type ──── */
export function parseAnswer(question, rawText) {
    const text = rawText.trim();

    if (question.type === 'number') {
        const num = parseInt(text.replace(/[₹,\s]/g, ''), 10);
        return isNaN(num) ? text : num;
    }

    if (question.type === 'boolean') {
        const lower = text.toLowerCase();
        const yesWords = ['yes', 'y', 'ha', 'haan', 'haa', 'han', 'हाँ', 'हां', 'हा', 'ji', 'जी'];
        const noWords = ['no', 'n', 'nahi', 'naa', 'nahin', 'नहीं', 'ना', 'नही'];
        if (yesWords.includes(lower)) return true;
        if (noWords.includes(lower)) return false;
        return text; // invalid — caller checks
    }

    if (question.type === 'choice' && question.options) {
        const lower = text.toLowerCase();

        // Exact match on value
        const exact = question.options.find(
            (o) => o.value.toLowerCase() === lower
        );
        if (exact) return exact.value;

        // Partial match on label or labelHi
        const partial = question.options.find(
            (o) =>
                o.label.toLowerCase().includes(lower) ||
                lower.includes(o.label.toLowerCase()) ||
                (o.labelHi && (o.labelHi.includes(text) || text.includes(o.labelHi)))
        );
        if (partial) return partial.value;

        // Numeric index (e.g. user types "1", "2")
        const idx = parseInt(text, 10);
        if (!isNaN(idx) && idx >= 1 && idx <= question.options.length) {
            return question.options[idx - 1].value;
        }

        return text; // unrecognized — caller handles
    }

    return text;
}

/* ── profileToEligibilityPayload: map local profile → API payload ────── */
export function profileToEligibilityPayload(profile) {
    return {
        name: profile.name || '',
        age: profile.age || 0,
        gender: profile.gender || 'any',
        state: profile.state || '',
        income: profile.income || 0,
        category: profile.category || 'General',
        urban: profile.urban === true ? 'urban' : profile.urban === false ? 'rural' : 'unknown',
        persona: profile.persona || '',
        occupation: profile.persona || '',
        landOwned: profile.landOwned || false,
        shgMember: profile.shgMember || false,
        isWidow: profile.isWidow || false,
        disability: profile.disability || false,
        pregnant: profile.pregnant || false,
        hasRationCard: profile.hasRationCard || false,
        hasJobCard: profile.hasJobCard || false,
        educationLevel: profile.educationLevel || '',
        hasEnterprise: profile.hasEnterprise || false,
        seekingWork: profile.seekingWork || false,
    };
}
