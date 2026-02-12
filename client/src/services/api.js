import axios from 'axios';

function normalizeBaseUrl(value) {
  const raw = String(value || '').trim();
  if (!raw) return '';
  return raw.replace(/\/+$/, '');
}

function looksLikeLocalhost(value) {
  return /^(https?:\/\/)?(localhost|127\.0\.0\.1)(:\d+)?(\/|$)/i.test(String(value || '').trim());
}

const envBaseUrl = normalizeBaseUrl(import.meta.env.VITE_API_BASE_URL);
const devBaseUrl = envBaseUrl || 'http://localhost:5000';

// Production default is same-origin (''). If you're deploying frontend and backend separately,
// set VITE_API_BASE_URL to your backend URL (NOT localhost).
const prodBaseUrl = envBaseUrl && !looksLikeLocalhost(envBaseUrl) ? envBaseUrl : '';

const api = axios.create({
  baseURL: import.meta.env.PROD ? prodBaseUrl : devBaseUrl,
});

export function getApiBaseUrl() {
  return api.defaults.baseURL || '';
}

export function setAuthToken(token) {
  if (token) {
    const rawToken = String(token).replace(/^Bearer\s+/i, '');
    const value = `Bearer ${rawToken}`;
    api.defaults.headers.common['Authorization'] = value;
    api.defaults.headers.common['authorization'] = value;
  } else {
    delete api.defaults.headers.common['Authorization'];
    delete api.defaults.headers.common['authorization'];
  }
}

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    const rawToken = String(token).replace(/^Bearer\s+/i, '');
    const value = `Bearer ${rawToken}`;

    // Axios may use plain object headers or AxiosHeaders; normalize to be safe.
    if (config.headers && typeof config.headers.set === 'function') {
      config.headers.set('Authorization', value);
    } else {
      // eslint-disable-next-line no-param-reassign
      config.headers = config.headers || {};
      config.headers.Authorization = value;
      config.headers.authorization = value;
    }
  }
  return config;
});

export default api;
