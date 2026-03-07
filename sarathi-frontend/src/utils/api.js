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

// Request interceptor — send ID Token (required by Cognito User Pool authorizer)
api.interceptors.request.use((config) => {
  const userType = localStorage.getItem('userType');

  let token = null;
  if (userType === 'panchayat') token = localStorage.getItem('panchayatIdToken');
  else if (userType === 'admin') token = localStorage.getItem('adminIdToken');
  else token = localStorage.getItem('idToken');

  const finalToken = token || localStorage.getItem('adminIdToken') || localStorage.getItem('panchayatIdToken') || localStorage.getItem('idToken');

  if (finalToken) config.headers['Authorization'] = finalToken;
  return config;
});

// 401 handler — only redirect on genuine auth expiry, not cross-pool token mismatch
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      const url = err.config?.url || '';
      const userType = localStorage.getItem('userType');

      // If a citizen API call fails but user is panchayat, just reject — don't wipe session
      if (url.includes('/citizen/') && userType === 'panchayat') {
        console.warn('[api] Citizen API 401 for panchayat user — skipping redirect');
        return Promise.reject(err);
      }
      // If a panchayat API call fails but user is citizen, just reject
      if (url.includes('/panchayat/') && userType === 'citizen') {
        console.warn('[api] Panchayat API 401 for citizen user — skipping redirect');
        return Promise.reject(err);
      }

      // Genuine auth failure — clear everything and redirect
      console.warn('[api] 401 — clearing tokens and redirecting');
      localStorage.removeItem('panchayatAccessToken');
      localStorage.removeItem('panchayatIdToken');
      localStorage.removeItem('panchayatRefreshToken');
      localStorage.removeItem('adminAccessToken');
      localStorage.removeItem('adminIdToken');
      localStorage.removeItem('adminRefreshToken');
      localStorage.removeItem('accessToken');
      localStorage.removeItem('idToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('userType');
      localStorage.removeItem('userEmail');
      if (userType === 'panchayat') window.location.href = '/panchayat/login';
      else if (userType === 'admin') window.location.href = '/admin/login';
      else window.location.href = '/citizen/login';
    }
    return Promise.reject(err);
  }
);

// B4: Unified body unwrapper — handles both proxied and direct Lambda responses
function unwrapBody(res) {
  const data = res.data;

  // If the Lambda returned a 200 response with a nested statusCode (Proxy integration wrapper)
  if (data && typeof data.statusCode === 'number' && data.statusCode >= 400) {
    const error = new Error(data.body ? (typeof data.body === 'string' ? JSON.parse(data.body).error || data.body : data.body.error) : 'API Error');
    error.response = { status: data.statusCode, data: data };
    throw error;
  }

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
export async function getPanchayatStats(panchayatId) {
  if (!panchayatId) throw new Error('panchayatId is required');
  return unwrapBody(await api.get(`/panchayat/${panchayatId}`));
}

/** GET /panchayat/search */
export async function searchPanchayats(state, district, block) {
  const params = new URLSearchParams();
  if (state) params.append('state', state);
  if (district) params.append('district', district);
  if (block) params.append('block', block);
  return unwrapBody(await api.get(`/panchayat/search?${params.toString()}`));
}

/** POST /panchayat/claim */
export async function claimPanchayat(payload) {
  return unwrapBody(await api.post('/panchayat/claim', payload));
}

/** GET /panchayat/{id}/profile */
export async function getPanchayatProfile(panchayatId) {
  if (!panchayatId) throw new Error('panchayatId is required');
  return unwrapBody(await api.get(`/panchayat/${panchayatId}/profile`));
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

/** GET /applications/{userId} — list applications (citizen or 'all' for admin) */
export async function getApplications(userId) {
  const endpoint = userId === 'all' ? '/applications/all' : `/applications/${userId}`;
  return unwrapBody(await api.get(endpoint));
}

/** GET /panchayat-applications/{panchayatId} — list applications for a specific panchayat */
export async function getPanchayatApplications(panchayatId) {
  if (!panchayatId) throw new Error('panchayatId is required');
  return unwrapBody(await api.get(`/panchayat-applications/${panchayatId}`));
}

/** POST /apply/{applicationId} — update application status (using POST for better compatibility) */
export async function updateApplicationStatus(applicationId, status) {
  return unwrapBody(await api.post(`/apply/${applicationId}`, { status }));
}

/** POST /scheme — create a new scheme (Admin) */
export async function createScheme(schemeData) {
  return unwrapBody(await api.post('/scheme', schemeData));
}

/** PUT /scheme/{id} — update an existing scheme (Admin) */
export async function updateScheme(schemeId, schemeData) {
  return unwrapBody(await api.put(`/scheme/${schemeId}`, schemeData));
}

/* ── AI / Polly services ──────────────────────────────────────────────── */

/** POST /explain */
export async function explainScheme(scheme, citizenProfile = null, language = 'en') {
  const body = {
    schemeId: scheme.schemeId || scheme.id,
    schemeName: scheme.nameEnglish || scheme.name,
    description: scheme.description || scheme.benefitType || '',
    audio: true,
    language,
  };
  if (citizenProfile) {
    body.citizenProfile = citizenProfile;
    body.citizenId = citizenProfile.citizenId || '';
  }
  return unwrapBody(await api.post('/explain', body));
}

/** POST /agent — invoke Bedrock Orchestrator Agent */
export async function invokeAgent(message, sessionId, citizenId, language = 'en') {
  return unwrapBody(await api.post('/agent', { message, sessionId, citizenId, language }, { timeout: 65000 }));
}

/** POST /document/upload-url — get pre-signed S3 PUT URL */
export async function getUploadUrl(documentType, fileName, citizenId) {
  return unwrapBody(await api.post('/document/upload-url', { documentType, fileName, citizenId }));
}

/** POST /document/analyze — analyze uploaded document */
export async function analyzeDocument(s3Key, documentType, citizenId) {
  return unwrapBody(await api.post('/document/analyze', { s3Key, documentType, citizenId }));
}

/** GET /panchayat/{panchayatId}/insights — get AI insights for panchayat */
export async function getPanchayatInsights(panchayatId) {
  if (!panchayatId) throw new Error('panchayatId is required');
  return unwrapBody(await api.get(`/panchayat/${panchayatId}/insights`));
}

/** POST /apply/workflow — trigger Step Functions application workflow */
export async function triggerApplicationWorkflow(applicationId, citizenId, schemeId, documents = []) {
  return unwrapBody(await api.post('/apply/workflow', { applicationId, citizenId, schemeId, documents }));
}

/** POST /notify */
export async function notifyPanchayat(notificationData) {
  return unwrapBody(await api.post('/notify', notificationData));
}

/** POST /lex */
export async function sendToLex(message, sessionId = 'default', locale = 'en_US') {
  return unwrapBody(await api.post('/lex', { message, sessionId, locale }));
}

/* ── Panchayat Data CRUD ──────────────────────────────────────────── */

/** GET /panchayat/{id}/campaigns */
export async function getPanchayatCampaigns(panchayatId) {
  if (!panchayatId) throw new Error('panchayatId is required');
  return unwrapBody(await api.get(`/panchayat/${panchayatId}/campaigns`));
}

/** POST /panchayat/{id}/campaigns */
export async function savePanchayatCampaigns(panchayatId, data) {
  return unwrapBody(await api.post(`/panchayat/${panchayatId}/campaigns`, { data }));
}

/** GET /panchayat/{id}/grievances */
export async function getPanchayatGrievances(panchayatId) {
  if (!panchayatId) throw new Error('panchayatId is required');
  return unwrapBody(await api.get(`/panchayat/${panchayatId}/grievances`));
}

/** POST /panchayat/{id}/grievances */
export async function savePanchayatGrievances(panchayatId, data) {
  return unwrapBody(await api.post(`/panchayat/${panchayatId}/grievances`, { data }));
}

/** GET /panchayat/{id}/calendar */
export async function getPanchayatCalendar(panchayatId) {
  if (!panchayatId) throw new Error('panchayatId is required');
  return unwrapBody(await api.get(`/panchayat/${panchayatId}/calendar`));
}

/** POST /panchayat/{id}/calendar */
export async function savePanchayatCalendar(panchayatId, data) {
  return unwrapBody(await api.post(`/panchayat/${panchayatId}/calendar`, { data }));
}

/** GET /panchayat/{id}/village-profile */
export async function getPanchayatVillageProfile(panchayatId) {
  if (!panchayatId) throw new Error('panchayatId is required');
  return unwrapBody(await api.get(`/panchayat/${panchayatId}/village-profile`));
}

/** POST /panchayat/{id}/village-profile */
export async function savePanchayatVillageProfile(panchayatId, data) {
  return unwrapBody(await api.post(`/panchayat/${panchayatId}/village-profile`, { data }));
}

/** GET /panchayat/{id}/analytics */
export async function getPanchayatAnalytics(panchayatId) {
  if (!panchayatId) throw new Error('panchayatId is required');
  return unwrapBody(await api.get(`/panchayat/${panchayatId}/analytics`));
}

/** POST /panchayat/{id}/analytics */
export async function savePanchayatAnalytics(panchayatId, data) {
  return unwrapBody(await api.post(`/panchayat/${panchayatId}/analytics`, { data }));
}

export default api;
