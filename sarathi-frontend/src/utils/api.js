import axios from 'axios';

/**
 * API utility — Always uses the live API Gateway.
 * VITE_API_BASE_URL must be set in .env to the API Gateway invoke URL.
 */
const BASE_URL = import.meta.env.VITE_API_BASE_URL;

if (!BASE_URL) {
  console.warn('[Sarathi] VITE_API_BASE_URL is not set — API calls will fail.');
}

const api = axios.create({
  baseURL: BASE_URL || '',
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

/* ── Public API functions ─────────────────────────────────────────────── */

/**
 * Check eligibility — POST /eligibility
 * @param {Object} profile — { age, gender, monthlyIncome, isWidow, occupation, category }
 * @returns {{ matchedSchemes, totalAnnualBenefit, schemesCount }}
 */
export async function checkEligibility(profile) {
  const res = await api.post('/eligibility', profile);
  return typeof res.data.body === 'string' ? JSON.parse(res.data.body) : res.data;
}

/**
 * Get digital twin projections — POST /twin
 * @param {{ monthlyIncome, matchedSchemes }} data
 * @returns {{ pathways: { best, medium, minimum }, monthsToPovertyExit }}
 */
export async function getDigitalTwin(data) {
  const res = await api.post('/twin', data);
  return typeof res.data.body === 'string' ? JSON.parse(res.data.body) : res.data;
}

/**
 * Fetch single scheme — GET /scheme/{schemeId}
 * @param {string} schemeId
 * @returns {Object} scheme details
 */
export async function fetchScheme(schemeId) {
  const res = await api.get(`/scheme/${schemeId}`);
  return typeof res.data.body === 'string' ? JSON.parse(res.data.body) : res.data;
}

/**
 * Fetch all schemes — GET /schemes (calls eligibility with broad params)
 * @returns {Array} all scheme objects
 */
export async function fetchAllSchemes() {
  const res = await api.post('/eligibility', {
    age: 1, gender: 'any', monthlyIncome: 999999, category: 'General'
  });
  const data = typeof res.data.body === 'string' ? JSON.parse(res.data.body) : res.data;
  return data.matchedSchemes || [];
}

/**
 * Get panchayat stats — GET /panchayat/{panchayatId}
 * @param {string} panchayatId
 * @returns {{ totalHouseholds, enrolled, eligibleNotEnrolled, zeroBenefits, alerts, households }}
 */
export async function getPanchayatStats(panchayatId = 'rampur-barabanki-up') {
  const res = await api.get(`/panchayat/${panchayatId}`);
  return typeof res.data.body === 'string' ? JSON.parse(res.data.body) : res.data;
}

/**
 * Detect scheme conflicts — POST /conflicts
 * @param {{ matchedSchemes }} data
 * @returns {{ conflicts, optimalBundle, totalOptimalValue }}
 */
export async function detectConflicts(data) {
  const res = await api.post('/conflicts', data);
  return typeof res.data.body === 'string' ? JSON.parse(res.data.body) : res.data;
}

/**
 * Save citizen profile — POST /citizen
 * @param {Object} profile — citizen data to save
 * @returns {{ citizenId, status }}
 */
export async function saveCitizen(profile) {
  const res = await api.post('/citizen', profile);
  return typeof res.data.body === 'string' ? JSON.parse(res.data.body) : res.data;
}

export default api;
