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
  const token = localStorage.getItem('panchayatIdToken') || localStorage.getItem('idToken');
  if (token) config.headers['Authorization'] = token;
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
      localStorage.removeItem('accessToken');
      localStorage.removeItem('idToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('userType');
      localStorage.removeItem('userEmail');
      window.location.href = userType === 'panchayat' ? '/panchayat/login' : '/citizen/login';
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

/** POST /notify */
export async function notifyPanchayat(notificationData) {
  return unwrapBody(await api.post('/notify', notificationData));
}

/** POST /lex */
export async function sendToLex(message, sessionId = 'default', locale = 'en_US') {
  return unwrapBody(await api.post('/lex', { message, sessionId, locale }));
}

export default api;
