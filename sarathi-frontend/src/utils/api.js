import axios from 'axios';
import { schemes } from '../data/mockSchemes';
import { citizens } from '../data/mockCitizens';

/**
 * API utility — Axios instance with mock-first fallback.
 * If VITE_API_BASE_URL is not set (local dev), uses mock data.
 *
 * Supports endpoints for:
 *   - /schemes, /citizens, /eligibility (Member 1 backend)
 *   - /explain, /lex, /notify (Member 2 AI services)
 */
const BASE_URL = import.meta.env.VITE_API_BASE_URL || '';
const USE_MOCK = !BASE_URL;

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
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

/* ── AI Service helpers (Member 2) ─────────────────────────────────── */

/**
 * Get a Hindi explanation + audio URL for a scheme via Bedrock + Polly.
 * @param {Object} scheme - The scheme object to explain
 * @returns {{ explanationHindi: string, audioUrl: string|null, schemeId: string }}
 */
export async function explainScheme(scheme) {
  return post('/explain', { scheme });
}

/**
 * Send a message to Lex bot and get a response.
 * @param {string} message - User message
 * @param {string} sessionId - Lex session ID
 * @returns {{ message: string, slots: Object }}
 */
export async function sendToLex(message, sessionId = 'default') {
  return post('/lex', { message, sessionId });
}

/**
 * Notify Panchayat about a newly eligible citizen via SNS.
 * @param {Object} notificationData - { citizenName, panchayatId, matchedSchemes, totalAnnualBenefit }
 */
export async function notifyPanchayat(notificationData) {
  return post('/notify', notificationData);
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
    // simulate matching
    return { eligible: schemes.slice(0, 6), totalBenefit: 64800 };
  }

  if (endpoint === '/voice') {
    return { transcript: 'मुझे पेंशन योजना चाहिए', confidence: 0.92 };
  }

  // ── Member 2 AI Service mocks ──────────────────────────────────
  if (endpoint === '/explain') {
    const scheme = data?.scheme || {};
    return {
      explanationHindi: scheme.benefitDescription ||
        'यह एक सरकारी योजना है जो आपके परिवार को लाभ दे सकती है। अधिक जानकारी के लिए अपने ग्राम पंचायत कार्यालय से संपर्क करें।',
      audioUrl: null, // No audio in mock mode — uses browser TTS fallback
      schemeId: scheme.id || 'unknown',
    };
  }

  if (endpoint === '/lex') {
    // Simulate Lex bot conversation
    const msg = data?.message?.toLowerCase() || '';
    if (msg.includes('योजना') || msg.includes('scheme') || msg.includes('find')) {
      return {
        message: 'नमस्ते! मैं सारथी हूँ। आपकी सरकारी योजनाएं ढूंढने में मदद करूंगा। आपका नाम बताइए?',
        sessionState: 'ElicitSlot',
        slotToElicit: 'citizenName',
      };
    }
    return {
      message: 'मुझे समझ नहीं आया। कृपया "योजनाएं ढूंढें" बोलिए।',
      sessionState: 'ElicitIntent',
    };
  }

  if (endpoint === '/notify') {
    return {
      messageId: 'mock-' + Date.now(),
      citizenName: data?.citizenName || 'Unknown',
      schemesNotified: data?.matchedSchemes?.length || 0,
    };
  }

  return { success: true };
}

export default api;

