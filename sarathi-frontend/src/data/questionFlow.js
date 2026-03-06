/**
 * questionFlow.js
 * Drives the conversational eligibility flow in ChatPage.
 * Massively expanded to capture detailed hierarchical data matching scheme tags.
 */

/* ── Core demographic questions (always asked) ────────────────────────── */
export const CORE_QUESTIONS = [
    { key: 'name', type: 'text', prompt: 'What is your full name?', promptHi: 'आपका पूरा नाम क्या है?' },
    { key: 'age', type: 'number', prompt: 'How old are you?', promptHi: 'आपकी उम्र कितनी है?' },
    {
        key: 'gender', type: 'choice', prompt: 'What is your gender?', promptHi: 'आपका लिंग क्या है?',
        options: [
            { value: 'male', label: 'Male', labelHi: 'पुरुष' },
            { value: 'female', label: 'Female', labelHi: 'महिला' },
            { value: 'other', label: 'Other', labelHi: 'अन्य' },
        ],
    },
    { key: 'income', type: 'number', prompt: 'What is your approximate annual household income (in ₹)?', promptHi: 'आपकी वार्षिक घरेलू आय लगभग कितनी है (₹ में)?' },
    {
        key: 'category', type: 'choice', prompt: 'What is your social category?', promptHi: 'आपकी सामाजिक श्रेणी क्या है?',
        options: [
            { value: 'General', label: 'General', labelHi: 'सामान्य' },
            { value: 'OBC', label: 'OBC', labelHi: 'ओबीसी' },
            { value: 'SC', label: 'SC', labelHi: 'अनुसूचित जाति' },
            { value: 'ST', label: 'ST', labelHi: 'अनुसूचित जनजाति' },
        ],
    },
    {
        key: 'minority', type: 'boolean', prompt: 'Do you belong to a minority community (e.g. Muslim, Christian, Sikh, Buddhist, Parsi, Jain)?', promptHi: 'क्या आप अल्पसंख्यक वर्ग (जैसे मुस्लिम, ईसाई, सिख, बौद्ध, पारसी, जैन) से हैं?'
    },
    {
        key: 'maritalStatus', type: 'choice', prompt: 'What is your marital status?', promptHi: 'आपकी वैवाहिक स्थिति क्या है?',
        options: [
            { value: 'single', label: 'Single / Unmarried', labelHi: 'अविवाहित' },
            { value: 'married', label: 'Married', labelHi: 'विवाहित' },
            { value: 'widowed', label: 'Widowed', labelHi: 'विधवा/विधुर' },
            { value: 'divorced', label: 'Divorced', labelHi: 'तलाकशुदा' },
        ],
    },
    {
        key: 'urban', type: 'choice', prompt: 'Do you live in an urban or rural area?', promptHi: 'आप शहरी क्षेत्र में रहते हैं या ग्रामीण क्षेत्र में?',
        options: [
            { value: 'urban', label: 'Urban', labelHi: 'शहरी' },
            { value: 'rural', label: 'Rural', labelHi: 'ग्रामीण' },
        ],
    },
    {
        key: 'disability', type: 'boolean', prompt: 'Are you differently abled (Do you have a disability)?', promptHi: 'क्या आप दिव्यांग (विकलांग) हैं?'
    },
    {
        key: 'bplCard', type: 'choice', prompt: 'What type of Ration Card do you hold?', promptHi: 'आपके पास किस प्रकार का राशन कार्ड है?',
        options: [
            { value: 'BPL', label: 'BPL (Below Poverty Line)', labelHi: 'बीपीएल (गरीबी रेखा से नीचे)' },
            { value: 'AAY', label: 'AAY (Antyodaya Anna Yojana)', labelHi: 'एएवाई (अंत्योदय अन्न योजना)' },
            { value: 'APL', label: 'APL (Above Poverty Line) / None', labelHi: 'एपीएल / कोई नहीं' },
        ],
    }
];

/* ── Persona / Occupation question ────────────────────────────────────── */
export const PERSONA_QUESTION = {
    key: 'persona',
    type: 'choice',
    prompt: 'Which category best describes your primary occupation?',
    promptHi: 'आपका मुख्य पेशा किस श्रेणी में आता है?',
    options: [
        { value: 'farmer', label: 'Farmer / Agricultural Worker', labelHi: 'किसान / कृषि मजदूर' },
        { value: 'labourer', label: 'Daily-wage / Construction Labourer', labelHi: 'दिहाड़ी / निर्माण मजदूर' },
        { value: 'student', label: 'Student', labelHi: 'विद्यार्थी' },
        { value: 'homemaker', label: 'Homemaker', labelHi: 'गृहिणी' },
        { value: 'business', label: 'Self-employed / Business / Entrepreneur', labelHi: 'स्वरोजगार / व्यापारी' },
        { value: 'salaried', label: 'Salaried / Govt Employee', labelHi: 'वेतनभोगी / सरकारी कर्मचारी' },
        { value: 'artisan', label: 'Artisan / Weaver / Craftsman', labelHi: 'कारीगर / बुनकर' },
        { value: 'unemployed', label: 'Unemployed', labelHi: 'बेरोजगार' },
        { value: 'senior', label: 'Senior Citizen / Retired', labelHi: 'वरिष्ठ नागरिक / सेवानिवृत्त' },
    ],
};

/* ── Branch questions by persona ──────────────────────────────────────── */
export const BRANCH_QUESTIONS = {
    farmer: [
        { key: 'landOwned', type: 'boolean', prompt: 'Do you own agricultural land?', promptHi: 'क्या आपके पास अपनी कृषि भूमि है?' },
        { key: 'landSize', type: 'number', prompt: 'If yes, how many acres of land do you own? (Enter 0 if none)', promptHi: 'यदि हाँ, तो आपके पास कितने एकड़ जमीन है? (यदि नहीं है तो 0 लिखें)', condition: p => p.landOwned === true },
        { key: 'tenantFarmer', type: 'boolean', prompt: 'Are you a tenant farmer or sharecropper?', promptHi: 'क्या आप बटाईदार या पट्टेदार किसान हैं?' },
        { key: 'livestock', type: 'boolean', prompt: 'Do you rear livestock (cattle, poultry, goats)?', promptHi: 'क्या आप पशुपालन (गाय-भैंस, मुर्गी, बकरी) करते हैं?' },
        { key: 'shgMember', type: 'boolean', prompt: 'Are you a member of any Farmer Producer Organization (FPO) or SHG?', promptHi: 'क्या आप किसी किसान उत्पादक संगठन (FPO) या SHG के सदस्य हैं?' },
    ],
    labourer: [
        { key: 'mgnregaCard', type: 'boolean', prompt: 'Do you have a MGNREGS Job Card?', promptHi: 'क्या आपके पास मनरेगा जॉब कार्ड है?' },
        { key: 'streetVendor', type: 'boolean', prompt: 'Are you a street vendor (rehri/patri wale)?', promptHi: 'क्या आप रेहड़ी-पटरी वाले (स्ट्रीट वेंडर) हैं?' },
    ],
    student: [
        {
            key: 'classLevel', type: 'choice', prompt: 'What is your current education level?', promptHi: 'आप अभी किस कक्षा स्तर में पढ़ रहे हैं?',
            options: [
                { value: 'primary', label: 'Primary (Class 1-8)', labelHi: 'प्राथमिक (कक्षा 1-8)' },
                { value: 'secondary', label: 'Secondary (Class 9-12)', labelHi: 'माध्यमिक (कक्षा 9-12)' },
                { value: 'ug', label: 'Undergraduate (BA/BSc/BCom/BTech)', labelHi: 'स्नातक' },
                { value: 'pg', label: 'Postgraduate & above', labelHi: 'स्नातकोत्तर व उससे ऊपर' },
                { value: 'diploma', label: 'ITI / Diploma', labelHi: 'आईटीआई / डिप्लोमा' },
            ],
        },
        { key: 'govtSchool', type: 'boolean', prompt: 'Do you study in a Government/Aided school or college?', promptHi: 'क्या आप सरकारी या सहायता प्राप्त स्कूल/कॉलेज में पढ़ते हैं?' },
    ],
    homemaker: [],
    business: [
        { key: 'msmeRegistered', type: 'boolean', prompt: 'Is your business registered under MSME/Udyam?', promptHi: 'क्या आपका व्यवसाय MSME/उद्यम के तहत पंजीकृत है?' },
        { key: 'businessTurnover', type: 'number', prompt: 'What is your approximate annual business turnover (in ₹)?', promptHi: 'आपका वार्षिक व्यापार टर्नओवर लगभग कितना है (₹ में)?' },
        { key: 'loanNeeded', type: 'boolean', prompt: 'Are you looking for a government loan for your business?', promptHi: 'क्या आप अपने व्यवसाय के लिए सरकारी ऋण (लोन) लेना चाहते हैं?' },
    ],
    salaried: [],
    artisan: [
        { key: 'shgMember', type: 'boolean', prompt: 'Are you part of an Artisan Cluster or SHG?', promptHi: 'क्या आप किसी कारीगर क्लस्टर या SHG का हिस्सा हैं?' },
    ],
    unemployed: [
        { key: 'educationLevel', type: 'text', prompt: 'What is your highest educational qualification?', promptHi: 'आपकी उच्चतम शैक्षिक योग्यता क्या है?' },
        { key: 'skillTrained', type: 'boolean', prompt: 'Have you received any formal skill training or vocational education?', promptHi: 'क्या आपने कोई औपचारिक कौशल प्रशिक्षण (स्किल ट्रेनिंग) प्राप्त किया है?' },
        { key: 'interestedInTraining', type: 'boolean', prompt: 'Are you interested in free government skill development programs?', promptHi: 'क्या आप मुफ्त सरकारी कौशल विकास कार्यक्रमों में रुचि रखते हैं?' },
    ],
    senior: [
        { key: 'pensionReceiving', type: 'boolean', prompt: 'Are you currently receiving any government pension (Old Age, Widow, Disability)?', promptHi: 'क्या आपको वर्तमान में कोई सरकारी पेंशन (वृद्धावस्था, विधवा, विकलांगता) मिल रही है?' },
    ],
};

/* ── Female-specific branch questions ─────────────────────────────────── */
export const FEMALE_BRANCH_QUESTIONS = [
    { key: 'shgMember', type: 'boolean', prompt: 'Are you part of a women\'s Self-Help Group (SHG)?', promptHi: 'क्या आप महिला स्वयं सहायता समूह (SHG) का हिस्सा हैं?', condition: p => p.shgMember === undefined },
    { key: 'pregnant', type: 'boolean', prompt: 'Are you currently pregnant or expecting a child?', promptHi: 'क्या आप वर्तमान में गर्भवती हैं?' },
    { key: 'lactating', type: 'boolean', prompt: 'Are you a lactating mother (nursing a baby under 2 years)?', promptHi: 'क्या आप धात्री माता हैं (2 वर्ष से छोटे बच्चे की माँ)?', condition: p => p.pregnant === false },
];

/* ── Disability-specific questions ────────────────────────────────────── */
export const DISABILITY_BRANCH_QUESTIONS = [
    { key: 'disabilityPercent', type: 'number', prompt: 'What is your disability percentage (e.g. 40)?', promptHi: 'आपकी विकलांगता का प्रतिशत कितना है (जैसे 40)?' },
    { key: 'disabilityCertificate', type: 'boolean', prompt: 'Do you have a valid Disability Certificate / UDID card?', promptHi: 'क्या आपके पास वैध विकलांगता प्रमाण पत्र / UDID कार्ड है?' },
];

/* ── Asset / Housing questions ────────────────────────────────────────── */
export const HOUSING_BRANCH_QUESTIONS = [
    { key: 'ownHouse', type: 'boolean', prompt: 'Do you own a pacca (concrete) house?', promptHi: 'क्या आपके पास अपना पक्का मकान है?' },
    { key: 'kutchaHouse', type: 'boolean', prompt: 'Do you live in a kutcha (mud/thatch) house?', promptHi: 'क्या आप कच्चे मकान में रहते हैं?', condition: p => p.ownHouse === false },
];

/* ── Routing Logic ────────────────────────────────────────────────────── */
export function getNextQuestion(profile) {
    for (const q of CORE_QUESTIONS) {
        if (profile[q.key] === undefined || profile[q.key] === null || profile[q.key] === '') return q;
    }
    if (!profile.persona) return PERSONA_QUESTION;

    const branchQs = BRANCH_QUESTIONS[profile.persona] || [];
    for (const q of branchQs) {
        if (q.condition && !q.condition(profile)) continue;
        if (profile[q.key] === undefined || profile[q.key] === null || profile[q.key] === '') return q;
    }

    if (profile.gender === 'female' && profile.maritalStatus === 'widowed' && profile.isWidow === undefined) {
        profile.isWidow = true; // Auto-fill
    }

    if (profile.gender === 'female') {
        for (const q of FEMALE_BRANCH_QUESTIONS) {
            if (q.condition && !q.condition(profile)) continue;
            if (profile[q.key] === undefined || profile[q.key] === null || profile[q.key] === '') return q;
        }
    }

    if (profile.disability === true) {
        for (const q of DISABILITY_BRANCH_QUESTIONS) {
            if (q.condition && !q.condition(profile)) continue;
            if (profile[q.key] === undefined || profile[q.key] === null || profile[q.key] === '') return q;
        }
    }

    for (const q of HOUSING_BRANCH_QUESTIONS) {
        if (q.condition && !q.condition(profile)) continue;
        if (profile[q.key] === undefined || profile[q.key] === null || profile[q.key] === '') return q;
    }

    return null;
}

export function parseAnswer(question, rawText) {
    const text = String(rawText).trim();
    if (question.type === 'number') {
        const num = parseInt(text.replace(/[₹,\s]/g, ''), 10);
        return isNaN(num) ? text : num;
    }
    if (question.type === 'boolean') {
        const lower = text.toLowerCase();
        const yesWords = ['yes', 'y', 'ha', 'haan', 'haa', 'han', 'हाँ', 'हां', 'हा', 'ji', 'जी', 'true'];
        const noWords = ['no', 'n', 'nahi', 'naa', 'nahin', 'नहीं', 'ना', 'नही', 'false'];
        if (yesWords.includes(lower)) return true;
        if (noWords.includes(lower)) return false;
        return text;
    }
    if (question.type === 'choice' && question.options) {
        const lower = text.toLowerCase();
        const exact = question.options.find(o => o.value.toLowerCase() === lower);
        if (exact) return exact.value;
        const partial = question.options.find(o => o.label.toLowerCase().includes(lower) || lower.includes(o.label.toLowerCase()) || (o.labelHi && (o.labelHi.includes(text) || text.includes(o.labelHi))));
        if (partial) return partial.value;
        const idx = parseInt(text, 10);
        if (!isNaN(idx) && idx >= 1 && idx <= question.options.length) return question.options[idx - 1].value;
        return text;
    }
    return text;
}

export function profileToEligibilityPayload(profile) {
    return {
        ...profile,
        // Ensure some aliases are fulfilled for backend matching
        occupation: profile.persona || '',
        familySize: 3 // generic default as it was rarely asked accurately
    };
}
