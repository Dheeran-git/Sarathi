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
  timeout: 30000,
});

// AI endpoints that need longer timeouts (Bedrock calls can take 30-90s)
const AI_ENDPOINTS = ['/explain', '/agent', '/scheme/search-ai', '/scheme/compare',
  '/application/explain-status', '/application/pre-fill', '/document/verify-ai',
  '/document/analyze', '/grievance/analyze', '/admin/spotlight',
  '/panchayat/generate-campaign', '/panchayat/generate-report'];

// Request interceptor — send ID Token + profile-aware context enrichment
api.interceptors.request.use((config) => {
  const userType = localStorage.getItem('userType');

  // Use ONLY the token matching the current user type — never cascade to other pools
  let token = null;
  if (userType === 'panchayat') token = localStorage.getItem('panchayatIdToken');
  else if (userType === 'admin') token = localStorage.getItem('adminIdToken');
  else token = localStorage.getItem('idToken');

  if (token) config.headers['Authorization'] = token;

  // Increase timeout for AI-heavy endpoints
  const isAiEndpoint = AI_ENDPOINTS.some(ep => config.url?.includes(ep));
  if (isAiEndpoint) {
    config.timeout = 90000; // 90s for Bedrock calls
  }

  // Profile-aware interceptor: inject citizen context into AI endpoint requests
  const shouldInjectProfile = isAiEndpoint || ['/twin', '/conflicts'].some(ep => config.url?.includes(ep));

  if (shouldInjectProfile && config.method === 'post' && userType === 'citizen') {
    try {
      const storedProfile = localStorage.getItem('sarathi_citizen_profile');
      if (storedProfile && config.data) {
        const profile = JSON.parse(storedProfile);
        const data = typeof config.data === 'string' ? JSON.parse(config.data) : config.data;
        // Only inject if citizenProfile not already provided
        if (!data.citizenProfile || Object.keys(data.citizenProfile).length === 0) {
          data.citizenProfile = {
            name: profile.name,
            age: profile.age,
            gender: profile.gender,
            income: profile.income || profile.monthlyIncome,
            category: profile.category,
            state: profile.state,
            persona: profile.persona,
            isWidow: profile.isWidow,
            disability: profile.disability,
          };
          config.data = data;
        }
      }
    } catch { /* ignore parse errors */ }
  }

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

/** GET /panchayat/check-role — check if panchayatId + role combo is already taken */
export async function checkPanchayatRole(panchayatId, role) {
  if (!panchayatId || !role) return { available: true };
  return unwrapBody(await api.get(`/panchayat/check-role?panchayatId=${encodeURIComponent(panchayatId)}&role=${encodeURIComponent(role)}`));
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
  return unwrapBody(await api.post('/explain', {
    schemeId: scheme.schemeId || scheme.id,
    schemeName: scheme.nameEnglish || scheme.name || '',
    description: scheme.descriptionMd || scheme.briefDescription || '',
    citizenProfile: citizenProfile || {},
    language,
    audio: true,
  }));
}

/** GET /panchayat/{panchayatId}/insights — get AI insights for panchayat */
export async function getPanchayatInsights(panchayatId) {
  if (!panchayatId) throw new Error('panchayatId is required');
  return unwrapBody(await api.get(`/panchayat/${panchayatId}/insights`));
}

/** POST /document/upload-url — get pre-signed S3 PUT URL */
export async function getUploadUrl(documentType, fileName, citizenId) {
  return unwrapBody(await api.post('/document/upload-url', { documentType, fileName, citizenId }));
}

/** POST /document/analyze — analyze uploaded document */
export async function analyzeDocument(s3Key, documentType, citizenId) {
  return unwrapBody(await api.post('/document/analyze', { s3Key, documentType, citizenId }));
}

/** POST /notify */
export async function notifyPanchayat(notificationData) {
  return unwrapBody(await api.post('/notify', notificationData));
}

/** POST /lex */
export async function sendToLex(message, sessionId = 'default', locale = 'en_US') {
  return unwrapBody(await api.post('/lex', { message, sessionId, locale }));
}

/** POST /agent */
export async function invokeAgent(prompt, sessionId, citizenId, language = 'en') {
  return unwrapBody(await api.post('/agent', { message: prompt, sessionId, citizenId, language, includeFollowups: true }));
}

/* ── AI-Powered Endpoints (Phase 3+) ───────────────────────────────── */

/** POST /scheme/search-ai — natural language scheme search */
export async function searchSchemesAI(query, citizenProfile = null) {
  return unwrapBody(await api.post('/scheme/search-ai', { query, citizenProfile: citizenProfile || {} }));
}

/** POST /application/explain-status — AI status explanation */
export async function explainApplicationStatus(application) {
  return unwrapBody(await api.post('/application/explain-status', {
    applicationId: application.applicationId,
    status: application.status,
    schemeName: application.schemeName,
    createdAt: application.createdAt,
  }));
}

/** POST /document/verify-ai — AI verification feedback for document extraction */
export async function verifyDocumentAI(extractedFields, documentType, citizenProfile = null) {
  return unwrapBody(await api.post('/document/verify-ai', {
    extractedFields,
    documentType,
    citizenProfile: citizenProfile || {},
  }));
}

/** POST /application/pre-fill — AI pre-fill application form */
export async function preFillApplication(schemeId, citizenProfile, extractedDocs = {}) {
  return unwrapBody(await api.post('/application/pre-fill', {
    schemeId,
    citizenProfile: citizenProfile || {},
    extractedDocs,
  }));
}

/** POST /panchayat/{id}/generate-campaign — AI campaign content */
export async function generateCampaign(panchayatId, targetGroup = '', messageTheme = '') {
  return unwrapBody(await api.post(`/panchayat/${panchayatId}/generate-campaign`, { targetGroup, messageTheme }));
}

/** POST /panchayat/{id}/generate-report — AI performance report */
export async function generatePerformanceReport(panchayatId, grievanceCount = 0, applicationCount = 0) {
  return unwrapBody(await api.post(`/panchayat/${panchayatId}/generate-report`, { grievanceCount, applicationCount }));
}

/** POST /grievance/analyze — AI grievance classification */
export async function analyzeGrievance(grievanceText, category = '') {
  return unwrapBody(await api.post('/grievance/analyze', { grievanceText, category }));
}

/** POST /admin/spotlight — AI admin dashboard spotlight */
export async function getAdminSpotlight(panchayatStats = []) {
  return unwrapBody(await api.post('/admin/spotlight', { panchayatStats }));
}

/** POST /scheme/compare — AI scheme comparison */
export async function compareSchemes(schemeIds, citizenProfile = null) {
  return unwrapBody(await api.post('/scheme/compare', { schemeIds, citizenProfile: citizenProfile || {} }));
}

/* ── Phase 4+6: Advanced AI Endpoints ───────────────────────────── */

/** POST /twin with predictions — predictive digital twin */
export async function getDigitalTwinPredictive(data, citizenProfile = null) {
  return unwrapBody(await api.post('/twin', {
    ...data,
    citizenProfile: citizenProfile || {},
    includePredictions: true,
  }));
}

/** POST /conflicts with game theory optimization */
export async function detectConflictsOptimized(data, citizenProfile = null) {
  return unwrapBody(await api.post('/conflicts', {
    ...data,
    citizenProfile: citizenProfile || {},
    optimize: true,
  }));
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
