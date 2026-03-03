/**
 * schemesDB.js
 * Re-exports the scheme data from mockSchemes for backward compatibility.
 * ChatPage.jsx imports { allSchemes } from this module.
 */
import { schemes, schemeMap } from './mockSchemes';

// ChatPage expects "allSchemes" — adapt field names for the eligibility engine
export const allSchemes = schemes.map((s) => ({
    ...s,
    name: s.nameEnglish,
    state: s.eligibility?.states || 'All',
    conditions: {
        ageMin: s.eligibility?.minAge ?? null,
        ageMax: s.eligibility?.maxAge ?? null,
        incomeMax: s.eligibility?.maxIncome ?? null,
        gender: s.eligibility?.gender === 'any' ? null : [s.eligibility?.gender],
        category: s.eligibility?.category || null,
        occupation: s.eligibility?.occupation || null,
        isWidow: s.eligibility?.isWidow ?? null,
        disability: s.eligibility?.hasDisability ?? null,
        persona: null,
        urban: undefined,
    },
}));

export { schemeMap };
