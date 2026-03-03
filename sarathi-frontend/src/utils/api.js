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

// Request interceptor — send whichever token is active
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('panchayatAccessToken') || localStorage.getItem('accessToken');
  if (token) config.headers['Authorization'] = token;
  return config;
});

// 401 handler — redirect to correct login page
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      const isPanchayat = !!localStorage.getItem('panchayatAccessToken');
      localStorage.removeItem('panchayatAccessToken');
      localStorage.removeItem('panchayatIdToken');
      localStorage.removeItem('accessToken');
      localStorage.removeItem('idToken');
      window.location.href = isPanchayat ? '/panchayat/login' : '/citizen/login';
    }
    return Promise.reject(err);
  }
);

// B4: Unified body unwrapper — handles both proxied and direct Lambda responses
function unwrapBody(res) {
  const data = res.data;
  if (data && typeof data.body === 'string') {
    try { return JSON.parse(data.body); } catch { return data; }
  }
  return data;
}

/* ── Public API functions ─────────────────────────────────────────────── */

/** POST /eligibility */
export async function checkEligibility(profile) {
  return unwrapBody(await api.post('/eligibility', profile));
}

/** POST /twin */
export async function getDigitalTwin(data) {
  return unwrapBody(await api.post('/twin', data));
}

/** GET /scheme/{schemeId} */
export async function fetchScheme(schemeId) {
  return unwrapBody(await api.get(`/scheme/${schemeId}`));
}

/** GET /scheme/all */
export async function fetchAllSchemes() {
  const data = unwrapBody(await api.get('/scheme/all'));
  return Array.isArray(data) ? data : [];
}

/** GET /panchayat/{panchayatId} */
export async function getPanchayatStats(panchayatId = 'rampur-barabanki-up') {
  return unwrapBody(await api.get(`/panchayat/${panchayatId}`));
}

/** POST /conflicts */
export async function detectConflicts(data) {
  return unwrapBody(await api.post('/conflicts', data));
}

/** POST /citizen */
export async function saveCitizen(profile, cognitoUserId) {
  const payload = cognitoUserId ? { ...profile, cognitoUserId } : profile;
  return unwrapBody(await api.post('/citizen', payload));
}

/** GET /citizen/{userId} */
export async function getCitizenProfile(userId) {
  return unwrapBody(await api.get(`/citizen/${userId}`));
}

/** POST /apply — submit an application */
export async function submitApplication(payload) {
  return unwrapBody(await api.post('/apply', payload));
}

/** GET /applications/{userId} — list citizen's applications */
export async function getApplications(userId) {
  return unwrapBody(await api.get(`/applications/${userId}`));
}

/** PATCH /apply/{applicationId} — update application status */
export async function updateApplicationStatus(applicationId, status) {
  return unwrapBody(await api.patch(`/apply/${applicationId}`, { status }));
}

/* ── AI / Polly services ──────────────────────────────────────────────── */

/** POST /explain */
export async function explainScheme(scheme) {
  return unwrapBody(await api.post('/explain', { scheme }));
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
  return unwrapBody(await api.post('/notify', notificationData));
}

/** POST /lex */
export async function sendToLex(message, sessionId = 'default', locale = 'en_US') {
  return unwrapBody(await api.post('/lex', { message, sessionId, locale }));
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
