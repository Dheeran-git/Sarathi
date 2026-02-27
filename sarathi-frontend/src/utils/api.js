import axios from 'axios';
import { schemes } from '../data/mockSchemes';
import { citizens, pathwayData } from '../data/mockCitizens';

/**
 * API utility — Axios instance with mock-first fallback.
 * Set VITE_API_BASE_URL in .env to your API Gateway invoke URL:
 *   VITE_API_BASE_URL=https://abc123xyz.execute-api.ap-south-1.amazonaws.com/prod
 */
const BASE_URL = import.meta.env.VITE_API_BASE_URL || '';
const USE_MOCK = !BASE_URL;

const api = axios.create({
  baseURL: BASE_URL,
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
  if (USE_MOCK) {
    return { matchedSchemes: schemes.slice(0, 8), totalAnnualBenefit: 64800, schemesCount: 8 };
  }
  const res = await api.post('/eligibility', profile);
  return typeof res.data.body === 'string' ? JSON.parse(res.data.body) : res.data;
}

/**
 * Get digital twin projections — POST /twin
 * @param {{ monthlyIncome, matchedSchemes }} data
 * @returns {{ pathways: { best, medium, minimum }, monthsToPovertyExit }}
 */
export async function getDigitalTwin(data) {
  if (USE_MOCK) {
    return { currentMonthlyIncome: 2000, povertyLine: 8000, pathways: pathwayData };
  }
  const res = await api.post('/twin', data);
  return typeof res.data.body === 'string' ? JSON.parse(res.data.body) : res.data;
}

/**
 * Fetch single scheme — GET /scheme/{schemeId}
 * @param {string} schemeId
 * @returns {Object} scheme details
 */
export async function fetchScheme(schemeId) {
  if (USE_MOCK) {
    return schemes.find((s) => s.id === schemeId) || null;
  }
  const res = await api.get(`/scheme/${schemeId}`);
  return typeof res.data.body === 'string' ? JSON.parse(res.data.body) : res.data;
}

/**
 * Get panchayat stats — GET /panchayat/{panchayatId}
 * @param {string} panchayatId
 * @returns {{ totalHouseholds, enrolled, eligibleNotEnrolled, zeroBenefits, alerts }}
 */
export async function getPanchayatStats(panchayatId = 'rampur-barabanki-up') {
  if (USE_MOCK) {
    return null; // falls back to local mock data in the component
  }
  const res = await api.get(`/panchayat/${panchayatId}`);
  return typeof res.data.body === 'string' ? JSON.parse(res.data.body) : res.data;
}

/**
 * Detect scheme conflicts — POST /conflicts
 * @param {{ matchedSchemes }} data
 * @returns {{ conflicts, optimalBundle, totalOptimalValue }}
 */
export async function detectConflicts(data) {
  if (USE_MOCK) {
    return { conflicts: [], optimalBundle: data.matchedSchemes || [], totalOptimalValue: 64800, conflictsFound: 0 };
  }
  const res = await api.post('/conflicts', data);
  return typeof res.data.body === 'string' ? JSON.parse(res.data.body) : res.data;
}

/**
 * Save citizen profile — POST /citizen
 * @param {Object} profile — citizen data to save
 * @returns {{ citizenId, status }}
 */
export async function saveCitizen(profile) {
  if (USE_MOCK) {
    return { citizenId: 'mock-' + Date.now(), status: 'saved' };
  }
  const res = await api.post('/citizen', profile);
  return typeof res.data.body === 'string' ? JSON.parse(res.data.body) : res.data;
}

/* ── Legacy get/post for backward compatibility ───────────────────────── */

export async function get(endpoint) {
  if (USE_MOCK) {
    return getMockData(endpoint);
  }
  const response = await api.get(endpoint);
  return response.data;
}

export async function post(endpoint, data) {
  if (USE_MOCK) {
    return postMockData(endpoint, data);
  }
  const response = await api.post(endpoint, data);
  return response.data;
}

/* ── Mock data handlers ──────────────────────────────────────────────── */
function getMockData(endpoint) {
  if (endpoint.startsWith('/schemes')) {
    const id = endpoint.split('/')[2];
    if (id) return schemes.find((s) => s.id === id) || null;
    return schemes;
  }
  if (endpoint.startsWith('/citizens')) {
    return citizens;
  }
  return null;
}

function postMockData(endpoint, data) {
  if (endpoint === '/eligibility') {
    return { matchedSchemes: schemes.slice(0, 8), totalAnnualBenefit: 64800, schemesCount: 8 };
  }
  if (endpoint === '/voice') {
    return { transcript: 'मुझे पेंशन योजना चाहिए', confidence: 0.92 };
  }
  return { success: true };
}

export default api;
