/**
 * HabFitt Auth API client.
 *
 * Axios instance with:
 *  1. Request interceptor  — injects Bearer access token
 *  2. Response interceptor — on 401, silently refreshes + retries
 *
 * Uses rawAxios for token refresh to avoid infinite retry loops.
 * Queues concurrent 401s during refresh and replays after.
 */
import axios from 'axios';
import { API_BASE_URL, API_TIMEOUT_MS, CONSENT_VERSIONS } from '../config/apiConfig';
import { tokenStorage } from '../utils/tokenStorage';

let _onAuthExpired = null;
export const setAuthExpiredCallback = (cb) => { _onAuthExpired = cb; };

const rawAxios = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT_MS,
  headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
});

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT_MS,
  headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
});

apiClient.interceptors.request.use(async (config) => {
  const tokens = await tokenStorage.getTokens();
  if (tokens?.accessToken) {
    config.headers.Authorization = `Bearer ${tokens.accessToken}`;
  }
  return config;
});

let isRefreshing = false;
let refreshQueue = [];

const drainQueue = (accessToken, error) => {
  refreshQueue.forEach(({ resolve, reject }) =>
    error ? reject(error) : resolve(accessToken)
  );
  refreshQueue = [];
};

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status !== 401 || originalRequest._retried) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        refreshQueue.push({
          resolve: (newToken) => {
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            originalRequest._retried = true;
            resolve(apiClient(originalRequest));
          },
          reject,
        });
      });
    }

    originalRequest._retried = true;
    isRefreshing = true;

    try {
      const tokens = await tokenStorage.getTokens();
      if (!tokens?.refreshToken) throw new Error('No refresh token available');

      const { data } = await rawAxios.post('/auth/token/refresh', {
        refresh_token: tokens.refreshToken,
      });

      await tokenStorage.saveTokens(data);
      isRefreshing = false;
      drainQueue(data.access_token, null);

      originalRequest.headers.Authorization = `Bearer ${data.access_token}`;
      return apiClient(originalRequest);
    } catch (refreshError) {
      isRefreshing = false;
      drainQueue(null, refreshError);
      await tokenStorage.clearTokens();
      _onAuthExpired?.();
      return Promise.reject(refreshError);
    }
  }
);

export const authApi = {
  login: (email, password, deviceFingerprint = null) =>
    apiClient.post('/auth/login', {
      email,
      password,
      ...(deviceFingerprint && { device_fingerprint: deviceFingerprint }),
    }),

  register: (data) =>
    apiClient.post('/auth/register', {
      first_name: data.firstName,
      last_name: data.lastName,
      email: data.email,
      phone: data.phone,
      date_of_birth: data.dateOfBirth,
      password: data.password,
      role: data.role,
      consents: {
        terms_of_service: { accepted: true, version: CONSENT_VERSIONS.TERMS_OF_SERVICE },
        privacy_policy: { accepted: true, version: CONSENT_VERSIONS.PRIVACY_POLICY },
      },
    }),

  logout: (logoutAllDevices = false) =>
    apiClient.post('/auth/logout', { logout_all_devices: logoutAllDevices }),
};
