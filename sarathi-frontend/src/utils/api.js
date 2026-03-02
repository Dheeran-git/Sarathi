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
 */
export async function checkEligibility(profile) {
  const res = await api.post('/eligibility', profile);
  return typeof res.data.body === 'string' ? JSON.parse(res.data.body) : res.data;
}

/**
 * Get digital twin projections — POST /twin
 */
export async function getDigitalTwin(data) {
  const res = await api.post('/twin', data);
  return typeof res.data.body === 'string' ? JSON.parse(res.data.body) : res.data;
}

/**
 * Fetch single scheme — GET /scheme/{schemeId}
 */
export async function fetchScheme(schemeId) {
  const res = await api.get(`/scheme/${schemeId}`);
  return typeof res.data.body === 'string' ? JSON.parse(res.data.body) : res.data;
}

/**
 * Fetch all schemes — GET /scheme/all
 */
export async function fetchAllSchemes() {
  const res = await api.get('/scheme/all');
  const data = typeof res.data.body === 'string' ? JSON.parse(res.data.body) : res.data;
  return Array.isArray(data) ? data : [];
}

/**
 * Get panchayat stats — GET /panchayat/{panchayatId}
 */
export async function getPanchayatStats(panchayatId = 'rampur-barabanki-up') {
  const res = await api.get(`/panchayat/${panchayatId}`);
  return typeof res.data.body === 'string' ? JSON.parse(res.data.body) : res.data;
}

/**
 * Detect scheme conflicts — POST /conflicts
 */
export async function detectConflicts(data) {
  const res = await api.post('/conflicts', data);
  return typeof res.data.body === 'string' ? JSON.parse(res.data.body) : res.data;
}

/**
 * Save citizen profile — POST /citizen
 * @param {Object} profile - Citizen profile object
 * @param {string} [cognitoUserId] - Cognito user ID to map profile to
 */
export async function saveCitizen(profile, cognitoUserId) {
  const payload = cognitoUserId ? { ...profile, cognitoUserId } : profile;
  const res = await api.post('/citizen', payload);
  return typeof res.data.body === 'string' ? JSON.parse(res.data.body) : res.data;
}

/**
 * Get citizen profile — GET /citizen/{userId}
 * @param {string} userId - Cognito user ID
 */
export async function getCitizenProfile(userId) {
  const res = await api.get(`/citizen/${userId}`);
  return typeof res.data.body === 'string' ? JSON.parse(res.data.body) : res.data;
}

/* ── AI / Lex services (Member 2) ─────────────────────────────────────── */

/**
 * Send a message to the Lex bot — POST /lex
 * @param {string} message - User message
 * @param {string} sessionId - Lex session ID
 * @param {string} locale - 'en_US' or 'hi_IN'
 */
export async function sendToLex(message, sessionId = 'default', locale = 'en_US') {
  const res = await api.post('/lex', { message, sessionId, locale });
  return typeof res.data.body === 'string' ? JSON.parse(res.data.body) : res.data;
}

/**
 * Get AI explanation + audio for a scheme via Bedrock + Polly — POST /explain
 * @param {Object} scheme - The scheme object to explain
 */
export async function explainScheme(scheme) {
  const res = await api.post('/explain', { scheme });
  return typeof res.data.body === 'string' ? JSON.parse(res.data.body) : res.data;
}

/**
 * Convert text to speech using Amazon Polly — POST /tts
 * @param {string} text - The text to synthesize
 * @param {string} language - 'en' or 'hi'
 */
export async function synthesizeSpeech(text, language = 'en') {
  const res = await api.post('/tts', { text, language });
  return typeof res.data.body === 'string' ? JSON.parse(res.data.body) : res.data;
}

/**
 * Notify Panchayat about a newly eligible citizen via SNS — POST /notify
 * @param {Object} notificationData - { citizenName, panchayatId, matchedSchemes, totalAnnualBenefit }
 */
export async function notifyPanchayat(notificationData) {
  const res = await api.post('/notify', notificationData);
  return typeof res.data.body === 'string' ? JSON.parse(res.data.body) : res.data;
}

/* ── Document Vault API ──────────────────────────────────────────────── */

export async function setupVault(citizenId, password) {
  const res = await api.post('/vault', { action: 'setup', citizenId, password });
  return typeof res.data.body === 'string' ? JSON.parse(res.data.body) : res.data;
}

export async function verifyVault(citizenId, password) {
  const res = await api.post('/vault', { action: 'verify', citizenId, password });
  return typeof res.data.body === 'string' ? JSON.parse(res.data.body) : res.data;
}

export async function listVaultDocuments(citizenId) {
  const res = await api.post('/vault', { action: 'list', citizenId });
  return typeof res.data.body === 'string' ? JSON.parse(res.data.body) : res.data;
}

export async function getUploadUrl(citizenId, docType, fileName, fileSize, fileType) {
  const res = await api.post('/vault', { action: 'upload', citizenId, docType, fileName, fileSize, fileType });
  return typeof res.data.body === 'string' ? JSON.parse(res.data.body) : res.data;
}

export async function checkVaultStatus(citizenId) {
  const res = await api.post('/vault', { action: 'status', citizenId });
  let data = res.data;
  if (data && typeof data.body === 'string') {
    try { data = JSON.parse(data.body); } catch (e) { }
  }
  return data;
}

export async function resetVaultPassword(citizenId) {
  const res = await api.post('/vault', { action: 'reset', citizenId });
  let data = res.data;
  if (data && typeof data.body === 'string') {
    try { data = JSON.parse(data.body); } catch (e) { }
  }
  return data;
}

export async function getDownloadUrl(citizenId, s3Key) {
  const res = await api.post('/vault', { action: 'download', citizenId, s3Key });
  let data = res.data;
  if (data && typeof data.body === 'string') {
    try { data = JSON.parse(data.body); } catch (e) { }
  }
  return data;
}

export async function deleteDocument(citizenId, docId, s3Key) {
  const res = await api.post('/vault', { action: 'delete', citizenId, docId, s3Key });
  let data = res.data;
  if (data && typeof data.body === 'string') {
    try { data = JSON.parse(data.body); } catch (e) { }
  }
  return data;
}

export default api;
