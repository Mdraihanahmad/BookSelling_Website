import axios from 'axios';

const devBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

const api = axios.create({
  // In the single-project Vercel deployment, the API is same-origin in production.
  // Ignore VITE_API_BASE_URL in PROD to avoid misconfig (e.g., accidentally set to localhost).
  baseURL: import.meta.env.PROD ? '' : devBaseUrl,
});

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
