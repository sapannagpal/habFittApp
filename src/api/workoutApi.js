/**
 * HabFitt Workout API client.
 * Points to hf-ms-workout microservice on port 8083.
 * Injects Bearer token from tokenStorage on every request.
 * On 401 → attempts token refresh first; only fires _onWorkoutAuthExpired if refresh fails.
 */
import axios from 'axios';
import { WORKOUT_BASE_URL, API_BASE_URL, API_TIMEOUT_MS } from '../config/apiConfig';
import { tokenStorage } from '../utils/tokenStorage';

let _onWorkoutAuthExpired = null;
export function setWorkoutAuthExpiredCallback(cb) { _onWorkoutAuthExpired = cb; }

// Raw axios pointing at auth service — used ONLY for token refresh (no interceptors)
const rawAuthAxios = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT_MS,
  headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
});

const workoutClient = axios.create({
  baseURL: WORKOUT_BASE_URL,
  timeout: API_TIMEOUT_MS,
  headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
});

// request interceptor: inject Bearer token
workoutClient.interceptors.request.use(async (config) => {
  const tokens = await tokenStorage.getTokens();
  if (tokens?.accessToken) config.headers.Authorization = `Bearer ${tokens.accessToken}`;
  return config;
}, (error) => Promise.reject(error));

// response interceptor: 401 → refresh → retry; if refresh fails → callback
let isRefreshing = false;
let refreshQueue = [];

const drainQueue = (accessToken, error) => {
  refreshQueue.forEach(({ resolve, reject }) =>
    error ? reject(error) : resolve(accessToken)
  );
  refreshQueue = [];
};

workoutClient.interceptors.response.use(
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
            resolve(workoutClient(originalRequest));
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

      const { data } = await rawAuthAxios.post('/auth/token/refresh', {
        refresh_token: tokens.refreshToken,
      });

      await tokenStorage.saveTokens(data);
      isRefreshing = false;
      drainQueue(data.access_token, null);

      originalRequest.headers.Authorization = `Bearer ${data.access_token}`;
      return workoutClient(originalRequest);
    } catch (refreshError) {
      isRefreshing = false;
      drainQueue(null, refreshError);
      await tokenStorage.clearTokens();
      _onWorkoutAuthExpired?.();
      return Promise.reject(refreshError);
    }
  }
);

export const workoutApi = {
  // Plans
  generatePlan: (params) => workoutClient.post('/plans/generate', params),
  getActivePlan: () => workoutClient.get('/plans/active'),
  getPlan: (planId) => workoutClient.get(`/plans/${planId}`),
  getPlanWeek: (planId, weekNumber) => workoutClient.get(`/plans/${planId}/weeks/${weekNumber}`),
  completePlanSession: (planId, sessionId, feedback = null) =>
    workoutClient.post(`/plans/${planId}/sessions/${sessionId}/complete`, { feedback }),

  // Sessions
  startSession: (sessionId) => workoutClient.post(`/sessions/${sessionId}/start`),
  getSessionDetail: (sessionId) => workoutClient.get(`/sessions/${sessionId}/detail`),
  logSet: (sessionId, params) => workoutClient.post(`/sessions/${sessionId}/sets`, params),
  skipSet: (sessionId, params) => workoutClient.post(`/sessions/${sessionId}/sets/skip`, params),
  completeSession: (sessionId, feedback = null) =>
    workoutClient.post(`/sessions/${sessionId}/complete`, { feedback }),
  abandonSession: (sessionId) => workoutClient.post(`/sessions/${sessionId}/abandon`),
  getSessionHistory: (page = 0, size = 20) =>
    workoutClient.get('/sessions/history', { params: { page, size } }),

  // Exercises
  getExercise: (exerciseId) => workoutClient.get(`/exercises/${exerciseId}`),

  // User preferences
  getWeightUnit: () => workoutClient.get('/users/preferences/weight-unit'),
  setWeightUnit: (unit) => workoutClient.put('/users/preferences/weight-unit', { unit: unit.toUpperCase() }),
};
