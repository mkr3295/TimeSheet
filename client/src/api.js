const BASE = '/api';

function getToken() {
  return localStorage.getItem('punch_token');
}

async function request(path, { method = 'GET', body, auth = true } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (auth) {
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (res.status === 204) return null;

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || 'Something went wrong. Try again.');
  }
  return data;
}

export const api = {
  register: (payload) => request('/auth/register', { method: 'POST', body: payload, auth: false }),
  login: (payload) => request('/auth/login', { method: 'POST', body: payload, auth: false }),
  me: () => request('/auth/me'),

  status: () => request('/entries/status'),
  clockIn: () => request('/entries/clock-in', { method: 'POST' }),
  clockOut: (note) => request('/entries/clock-out', { method: 'POST', body: { note } }),

  list: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/entries${qs ? `?${qs}` : ''}`);
  },
  create: (payload) => request('/entries', { method: 'POST', body: payload }),
  update: (id, payload) => request(`/entries/${id}`, { method: 'PUT', body: payload }),
  remove: (id) => request(`/entries/${id}`, { method: 'DELETE' }),
  summary: () => request('/entries/summary'),
};

export { getToken };
