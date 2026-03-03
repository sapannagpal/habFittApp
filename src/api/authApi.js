/**
 * HabFitt Auth API client.
 * Points to hf-ms-auth microservice on port 8080.
 * Injects Bearer token on every request and handles token refresh on 401.
 */
import axios from 'axios';
import { API_BASE_URL, API_TIMEOUT_MS } from '../config/apiConfig';
import { tokenStorage } from '../utils/tokenStorage';

// ─── Auth-Expired Callback ────────────────────────────────────────────────────

let _onAuthExpired = null;

export function setAuthExpiredCallback(cb) {
  _onAuthExpired = cb;
}

// ─── Raw Axios (bypasses interceptors — used for token refresh) ───────────────

export const rawAxios = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT_MS,
  headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
});

// ─── Main Auth Client ─────────────────────────────────────────────────────────

const authClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT_MS,
  headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
});

// Request interceptor: inject Bearer token
authClient.interceptors.request.use(
  async (config) => {
    const { accessToken } = await tokenStorage.getTokens();
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Response interceptor: on 401 → refresh token → retry once
authClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const { refreshToken } = await tokenStorage.getTokens();
        const { data } = await rawAxios.post('/api/v1/auth/refresh', { refreshToken });
        await tokenStorage.saveTokens(data);
        originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
        return authClient(originalRequest);
      } catch (_refreshError) {
        await tokenStorage.clearTokens();
        _onAuthExpired?.();
        return Promise.reject(error);
      }
    }
    return Promise.reject(error);
  },
);

// ─── Exported API ─────────────────────────────────────────────────────────────

export const authApi = {
  login: (credentials) =>
    authClient.post('/api/v1/auth/login', credentials),

  register: (payload) =>
    authClient.post('/api/v1/auth/register', payload),

  logout: (allDevices = false) =>
    authClient.post('/api/v1/auth/logout', { allDevices }),

  getMe: () =>
    authClient.get('/api/v1/auth/me'),
};
