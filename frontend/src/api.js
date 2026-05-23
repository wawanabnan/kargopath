/**
 * api.js — Centralized API client
 * Base URL points to Django backend at localhost:8000
 */

const BASE_URL = 'http://localhost:8000/api/v1';

// ── Token helpers ─────────────────────────────────────────────────────────────
export const getAccessToken  = () => localStorage.getItem('access_token');
export const getRefreshToken = () => localStorage.getItem('refresh_token');
export const getUser         = () => {
  try { return JSON.parse(localStorage.getItem('user') || 'null'); }
  catch { return null; }
};
export const getTenant       = () => {
  try { return JSON.parse(localStorage.getItem('tenant') || 'null'); }
  catch { return null; }
};

export const saveAuth = ({ access, refresh, user, tenant }) => {
  localStorage.setItem('access_token',  access);
  localStorage.setItem('refresh_token', refresh);
  localStorage.setItem('user',          JSON.stringify(user));
  if (tenant) localStorage.setItem('tenant', JSON.stringify(tenant));
};

export const clearAuth = () => {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('user');
  localStorage.removeItem('tenant');
};

// ── Core fetch wrapper ────────────────────────────────────────────────────────
async function request(endpoint, options = {}) {
  const token = getAccessToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  // Try token refresh on 401
  if (response.status === 401 && getRefreshToken()) {
    const refreshed = await fetch(`${BASE_URL}/auth/token/refresh/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh: getRefreshToken() }),
    });
    if (refreshed.ok) {
      const data = await refreshed.json();
      localStorage.setItem('access_token', data.access);
      // Retry original request
      return request(endpoint, options);
    } else {
      clearAuth();
      window.location.href = '/login';
      return;
    }
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
    throw error;
  }

  // 204 No Content
  if (response.status === 204) return null;
  return response.json();
}

// ── Auth API ──────────────────────────────────────────────────────────────────
export const authAPI = {
  register: (data) => request('/auth/register/', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  login: (email, password) => request('/auth/login/', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  }),

  getProfile: () => request('/auth/profile/'),

  updateProfile: (data) => request('/auth/profile/', {
    method: 'PATCH',
    body: JSON.stringify(data),
  }),
};

// ── KYC API ───────────────────────────────────────────────────────────────────
export const kycAPI = {
  getStatus: () => request('/auth/kyc-status/'),

  getProfile: () => request('/auth/profile/kyc/'),

  updateProfile: (data) => request('/auth/profile/kyc/', {
    method: 'PATCH',
    body: JSON.stringify(data),
  }),
};

// ── Quotation Requests API ────────────────────────────────────────────────────
export const quotationRequestAPI = {
  submit: (data) => request('/quotations/requests/', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  list: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/quotations/requests/${qs ? '?' + qs : ''}`);
  },

  detail: (id) => request(`/quotations/requests/${id}/`),

  updateStatus: (id, status) => request(`/quotations/requests/${id}/update_status/`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  }),

  // Draft flow — for lead generation (public user fills form, submits after login)
  saveDraft: (data) => request('/quotations/requests/save-draft/', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  submitDraft: (draftKey) => request('/quotations/requests/submit-draft/', {
    method: 'POST',
    body: JSON.stringify({ draft_key: draftKey }),
  }),
};

// ── Quotations API ────────────────────────────────────────────────────────────
export const quotationAPI = {
  list: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/quotations/${qs ? '?' + qs : ''}`);
  },

  detail: (id) => request(`/quotations/${id}/`),

  create: (data) => request('/quotations/', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  accept: (id) => request(`/quotations/${id}/accept/`, { method: 'POST' }),

  reject: (id, reason) => request(`/quotations/${id}/reject/`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  }),

  sendToClient: (id) => request(`/quotations/${id}/send_to_client/`, { method: 'POST' }),

  // Line items
  addItem: (quotationId, item) => request(`/quotations/${quotationId}/items/`, {
    method: 'POST',
    body: JSON.stringify(item),
  }),

  listItems: (quotationId) => request(`/quotations/${quotationId}/items/`),

  deleteItem: (quotationId, itemId) => request(`/quotations/${quotationId}/items/${itemId}/`, {
    method: 'DELETE',
  }),
};

// ── Shipments API ─────────────────────────────────────────────────────────────
export const shipmentAPI = {
  list: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/shipments/${qs ? '?' + qs : ''}`);
  },

  detail: (id) => request(`/shipments/${id}/`),

  addMilestone: (id, data) => request(`/shipments/${id}/milestones/`, {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  addDocument: (id, data) => request(`/shipments/${id}/documents/`, {
    method: 'POST',
    body: JSON.stringify(data),
  }),
};

export default request;
