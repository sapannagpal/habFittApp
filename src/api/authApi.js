/**
 * HabFitt Auth API client.
 *
 * Uses a single Axios instance (apiClient) with two interceptors:
 *  1. Request interceptor  — injects Bearer access token from storage
 *  2. Response interceptor — on 401, silently refreshes tokens and retries
 *
 * Token refresh uses a raw axios instance (rawAxios) to bypass interceptors
 * and avoid infinite retry loops.
 *
 * Concurrent requests that receive a 401 during refresh are queued and
 * replayed once the new token arrives.
 */
import axios from 'axios';
import { API_BASE_URL, API_TIMEOUT_MS, CONSENT_VERSIONS } from '../config/apiConfig';
import { tokenStorage } from '../utils/tokenStorage';

// ─── Auth-expired callback ────────────────────────────────────────────────────
// Set by AuthContext to clear auth state when refresh fails.
let _onAuthExpired = null;
export const setAuthExpiredCallback = (cb) => {
  _onAuthExpired = cb;
};

// ─── Raw Axios (no interceptors) — used ONLY for token refresh ────────────────
const rawAxios = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT_MS,
  headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
});

// ─── Main API client ──────────────────────────────────────────────────────────
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT_MS,
  headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
});

// Request interceptor: inject stored access token
apiClient.interceptors.request.use(async (config) => {
  const tokens = await tokenStorage.getTokens();
  if (tokens?.accessToken) {
    config.headers.Authorization = `Bearer ${tokens.accessToken}`;
  }
  return config;
});

// Response interceptor: silent token refresh on 401
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

    // Only attempt refresh on 401, and only once per request
    if (error.response?.status !== 401 || originalRequest._retried) {
      return Promise.reject(error);
    }

    // If already refreshing, queue this request
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

// ─── Auth API methods ─────────────────────────────────────────────────────────
export const authApi = {
  /**
   * POST /auth/login
   * @param {string} email
   * @param {string} password
   * @param {string|null} deviceFingerprint
   * @returns {Promise<AxiosResponse<TokenResponse>>}
   */
  login: (email, password, deviceFingerprint = null) =>
    apiClient.post('/auth/login', {
      email,
      password,
      ...(deviceFingerprint && { device_fingerprint: deviceFingerprint }),
    }),

  /**
   * POST /auth/register
   * Patient and Caregiver self-registration only.
   * @param {{ firstName, lastName, email, phone, dateOfBirth, password, role }} data
   * @returns {Promise<AxiosResponse<RegisterResponse>>}
   */
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
        terms_of_service: {
          accepted: true,
          version: CONSENT_VERSIONS.TERMS_OF_SERVICE,
        },
        privacy_policy: {
          accepted: true,
          version: CONSENT_VERSIONS.PRIVACY_POLICY,
        },
      },
    }),

  /**
   * POST /auth/logout
   * Requires valid Bearer token (injected by request interceptor).
   * @param {boolean} logoutAllDevices
   * @returns {Promise<AxiosResponse<void>>}
   */
  logout: (logoutAllDevices = false) =>
    apiClient.post('/auth/logout', { logout_all_devices: logoutAllDevices }),

  /**
   * POST /auth/password/forgot
   * Initiates the forgot-password flow by sending a 6-digit reset code to the
   * supplied email address. The code expires after a short TTL (see expires_in).
   * @param {string} email  — must be a registered account email
   * @returns {Promise<AxiosResponse<{ message: string, expires_in: number }>>}
   */
  forgotPassword: (email) =>
    apiClient.post('/auth/password/forgot', { email }),

  /**
   * POST /auth/password/verify-code
   * Validates the 6-digit OTP that was sent to the user's email.
   * On success the server returns a short-lived reset_token used by resetPassword.
   * @param {string} email  — same email used in forgotPassword
   * @param {string} code   — 6-digit OTP entered by the user
   * @returns {Promise<AxiosResponse<{ reset_token: string, expires_in: number }>>}
   */
  verifyResetCode: (email, code) =>
    apiClient.post('/auth/password/verify-code', { email, code }),

  /**
   * POST /auth/password/reset
   * Completes the password reset using the token obtained from verifyResetCode.
   * @param {string} resetToken  — opaque token from verifyResetCode response
   * @param {string} newPassword — the user's chosen new password
   * @returns {Promise<AxiosResponse<{ message: string }>>}
   */
  resetPassword: (resetToken, newPassword) =>
    apiClient.post('/auth/password/reset', {
      reset_token: resetToken,
      new_password: newPassword,
    }),
};
