import axios from 'axios';
import { schemes } from '../data/mockSchemes';
import { citizens } from '../data/mockCitizens';

/**
 * API utility — Axios instance with mock-first fallback.
 * If VITE_API_BASE_URL is not set (local dev), uses mock data.
 */
const BASE_URL = import.meta.env.VITE_API_BASE_URL || '';
const USE_MOCK = !BASE_URL;

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000,
});

/**
 * GET request — falls back to mock data if no API URL configured.
 */
export async function get(endpoint) {
  if (USE_MOCK) {
    return getMockData(endpoint);
  }
  const response = await api.get(endpoint);
  return response.data;
}

/**
 * POST request — falls back to mock handler if no API URL configured.
 */
export async function post(endpoint, data) {
  if (USE_MOCK) {
    return postMockData(endpoint, data);
  }
  const response = await api.post(endpoint, data);
  return response.data;
}

/* ── Mock data handlers ──────────────────────────────────────────────────── */
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
    // simulate matching
    return { eligible: schemes.slice(0, 6), totalBenefit: 64800 };
  }
  if (endpoint === '/voice') {
    return { transcript: 'मुझे पेंशन योजना चाहिए', confidence: 0.92 };
  }
  return { success: true };
}

export default api;
