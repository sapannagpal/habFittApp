/**
 * HabFitt Dashboard API client.
 * Points to hf-ms-dashboard microservice on port 8082.
 * Injects Bearer token from tokenStorage on every request.
 * On 401 → fires _onDashboardAuthExpired callback (does not retry — auth service handles refresh).
 */
import axios from 'axios';
import { DASHBOARD_BASE_URL, API_TIMEOUT_MS } from '../config/apiConfig';
import { tokenStorage } from '../utils/tokenStorage';

// ─── Auth-Expired Callback ────────────────────────────────────────────────────

let _onDashboardAuthExpired = null;

export function setDashboardAuthExpiredCallback(cb) {
  _onDashboardAuthExpired = cb;
}

// ─── Dashboard Client ─────────────────────────────────────────────────────────

const dashboardClient = axios.create({
  baseURL: DASHBOARD_BASE_URL,
  timeout: API_TIMEOUT_MS,
  headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
});

// Request interceptor: inject Bearer token
dashboardClient.interceptors.request.use(
  async (config) => {
    const tokens = await tokenStorage.getTokens();
    if (tokens?.accessToken) {
      config.headers.Authorization = `Bearer ${tokens.accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Response interceptor: on 401 → fire callback, do NOT retry
dashboardClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      _onDashboardAuthExpired?.();
    }
    return Promise.reject(error);
  },
);

// ─── Exported API ─────────────────────────────────────────────────────────────

export const dashboardApi = {
  /**
   * Fetch the dashboard data for the current user.
   * @param {string} [timezone] — IANA timezone string, e.g. "America/New_York"
   */
  getDashboard: (timezone) =>
    dashboardClient.get('/api/v1/dashboard', {
      headers: {
        'X-Timezone': timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone ?? 'UTC',
      },
    }),
};
