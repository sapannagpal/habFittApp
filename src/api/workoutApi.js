/**
 * HabFitt Workout API client.
 * Targets hf-ms-workout on port 8084. NO /api/v1 prefix — all routes at root level.
 * Injects Bearer token from tokenStorage on every request.
 * On 401/403 → attempts token refresh; queues concurrent requests during refresh.
 *              If refresh fails → fires _onWorkoutAuthExpired (registered by AuthContext).
 *
 * NOTE: hf-ms-workout returns 403 (not 401) for expired JWTs — Spring Security's
 * JwtAuthenticationFilter rejects invalid tokens before the 401 path fires.
 * Both status codes trigger the refresh flow.
 */
import axios from 'axios';
import { WORKOUT_BASE_URL, API_BASE_URL, API_TIMEOUT_MS } from '../config/apiConfig';
import { tokenStorage } from '../utils/tokenStorage';

// ─── Auth-Expired Callback ────────────────────────────────────────────────────

let _onWorkoutAuthExpired = null;

export function setWorkoutAuthExpiredCallback(cb) {
  _onWorkoutAuthExpired = cb;
}

// ─── Workout Client ───────────────────────────────────────────────────────────

const workoutClient = axios.create({
  baseURL: WORKOUT_BASE_URL,
  timeout: API_TIMEOUT_MS,
  headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
});

// Raw axios pointing at auth service — used ONLY for token refresh (no interceptors)
const rawAuthAxios = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT_MS,
  headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
});

// ─── Request Interceptor ──────────────────────────────────────────────────────

workoutClient.interceptors.request.use(
  async (config) => {
    const tokens = await tokenStorage.getTokens();
    if (tokens?.accessToken) {
      config.headers.Authorization = `Bearer ${tokens.accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// ─── Response Interceptor — queue-based refresh ───────────────────────────────
// Handles concurrent 401/403 responses: only one refresh fires; all other
// failing requests queue and replay once the new token arrives.

let isRefreshing = false;
let refreshQueue = [];

const drainQueue = (accessToken, error) => {
  refreshQueue.forEach(({ resolve, reject }) =>
    error ? reject(error) : resolve(accessToken),
  );
  refreshQueue = [];
};

workoutClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error.response?.status;
    const originalRequest = error.config;

    // Only intercept 401 / 403 — hf-ms-workout returns 403 for expired JWTs
    if ((status !== 401 && status !== 403) || originalRequest._retried) {
      return Promise.reject(error);
    }

    // Another refresh already in-flight — queue this request
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
  },
);

// ─── Exported API ─────────────────────────────────────────────────────────────

export const workoutApi = {

  // ── Plans ───────────────────────────────────────────────────────────────────

  /**
   * Generate a new AI workout plan.
   * @param {object} params - { fitnessGoal, experienceLevel, preferredFormat,
   *   availableEquipment, daysPerWeek, sessionDurationMinutes,
   *   injuryFlags, bodyWeightKg, totalWeeks }
   */
  generatePlan: (params) =>
    workoutClient.post('/plans/generate', params),

  /** Get the user's currently active plan. Returns 404 if none. */
  getActivePlan: () =>
    workoutClient.get('/plans/active'),

  /** Get a plan by ID. */
  getPlan: (planId) =>
    workoutClient.get(`/plans/${planId}`),

  /**
   * Get the weekly schedule for a plan.
   * weekNumber is a PATH param: GET /plans/{planId}/weeks/{weekNumber}
   */
  getWeeklySchedule: (planId, weekNumber) =>
    workoutClient.get(`/plans/${planId}/weeks/${weekNumber}`),

  /**
   * Abandon the user's currently active plan.
   * @returns {object} { planId, status }
   */
  abandonActivePlan: () =>
    workoutClient.post('/plans/active/abandon'),

  // ── Session Lifecycle ────────────────────────────────────────────────────────

  /**
   * Start a session. No request body required.
   * @returns {object} { sessionId, status, startedAt }
   */
  startSession: (sessionId) =>
    workoutClient.post(`/sessions/${sessionId}/start`),

  /**
   * Complete a session.
   * @param {string} sessionId
   * @param {string} feedback - TOO_EASY | JUST_RIGHT | TOO_HARD | PARTIAL
   */
  completeSession: (sessionId, feedback = null) =>
    workoutClient.post(`/sessions/${sessionId}/complete`, { feedback }),

  /**
   * Abandon a session.
   * @param {string} sessionId
   * @param {string} [reason] - Optional reason string.
   */
  abandonSession: (sessionId, reason) =>
    workoutClient.post(`/sessions/${sessionId}/abandon`, reason ? { reason } : {}),

  // ── Set Logging ──────────────────────────────────────────────────────────────

  /**
   * Log a completed set.
   * @param {string} sessionId
   * @param {object} setEntry - { exerciseId, setNumber, reps, weightKg, durationSeconds }
   * @returns {object} { log: ExerciseLogResponse, newPersonalRecords: [...] }
   */
  logSet: (sessionId, setEntry) =>
    workoutClient.post(`/sessions/${sessionId}/sets`, setEntry),

  /**
   * Skip a set.
   * @param {string} sessionId
   * @param {object} setEntry - { exerciseId, setNumber }
   */
  skipSet: (sessionId, setEntry) =>
    workoutClient.post(`/sessions/${sessionId}/sets/skip`, setEntry),

  // ── Session History & Detail ─────────────────────────────────────────────────

  /**
   * Get paginated session history.
   * @param {number} page - Zero-based page index (default 0).
   * @param {number} size - Page size (default 10).
   * @returns Spring Page: { content: [...], totalElements, totalPages, ... }
   */
  getHistory: (page = 0, size = 10) =>
    workoutClient.get('/sessions/history', { params: { page, size } }),

  /**
   * Get full session detail including exercises and set logs.
   * @returns {object} { sessionId, sessionName, status, exercises: [...] }
   */
  getSessionDetail: (sessionId) =>
    workoutClient.get(`/sessions/${sessionId}/detail`),

  // ── Exercises ────────────────────────────────────────────────────────────────

  /**
   * List all exercises.
   * @param {string} [format] - Optional filter by format (e.g. GYM, HOME).
   */
  getExercises: (format) =>
    workoutClient.get('/exercises', format ? { params: { format } } : undefined),

  /** Get a single exercise by ID. */
  getExercise: (id) =>
    workoutClient.get(`/exercises/${id}`),

  /**
   * Get alternative exercises for a given exercise ID.
   * @param {string} id - Exercise ID.
   * @param {object} [options] - { equipment, injuries, limit } (all optional).
   */
  getAlternatives: (id, { equipment, injuries, limit = 6 } = {}) => {
    const params = { limit };
    if (equipment) params.equipment = equipment;
    if (injuries) params.injuries = injuries;
    return workoutClient.get(`/exercises/${id}/alternatives`, { params });
  },

  /**
   * Swap an exercise within a session or across the whole plan (legacy endpoint).
   * @param {string} id - The exercise being replaced.
   * @param {string} sessionId - Query param identifying the active session.
   * @param {object} body - { targetExerciseId, scope } where scope is SESSION or PLAN.
   */
  swapExercise: (id, sessionId, body) =>
    workoutClient.post(`/exercises/${id}/swap`, body, { params: { sessionId } }),

  // ── WP-002 Flexibility Layer ─────────────────────────────────────────────────

  /**
   * Swap two days in the weekly schedule.
   * MOCK STUB — remove __DEV__ fallback when backend ships.
   * @param {string} planId
   * @param {number} dayOfWeek - Source day (1-7, ISO-8601)
   * @param {{ targetDay: number }} body
   */
  swapDay: async (planId, dayOfWeek, body) => {
    try {
      return await workoutClient.patch(`/plans/${planId}/days/${dayOfWeek}/swap`, body);
    } catch (e) {
      if (__DEV__) {
        await new Promise(r => setTimeout(r, 300));
        return { data: { sourceDay: dayOfWeek, targetDay: body.targetDay, modified: true } };
      }
      throw e;
    }
  },

  /**
   * Combine two workout days into one.
   * MOCK STUB — remove __DEV__ fallback when backend ships.
   * @param {string} planId
   * @param {{ sourceDay: number, targetDay: number }} body
   */
  combineDays: async (planId, body) => {
    try {
      return await workoutClient.post(`/plans/${planId}/days/combine`, body);
    } catch (e) {
      if (__DEV__) {
        await new Promise(r => setTimeout(r, 300));
        return { data: { sourceDay: body.sourceDay, targetDay: body.targetDay, combined: true, modified: true } };
      }
      throw e;
    }
  },

  /**
   * Substitute an exercise in a session.
   * MOCK STUB — remove __DEV__ fallback when backend ships.
   * @param {string} sessionId
   * @param {string} sessionExerciseId
   * @param {{ newExerciseId: string, scope: 'SESSION'|'PLAN' }} body
   */
  substituteExercise: async (sessionId, sessionExerciseId, body) => {
    try {
      return await workoutClient.patch(
        `/sessions/${sessionId}/exercises/${sessionExerciseId}/substitute`,
        body,
      );
    } catch (e) {
      if (__DEV__) {
        await new Promise(r => setTimeout(r, 300));
        return { data: { sessionExerciseId, newExerciseId: body.newExerciseId, scope: body.scope, substituted: true } };
      }
      throw e;
    }
  },

  // ── User Preferences ─────────────────────────────────────────────────────────

  /**
   * Get the user's preferred weight unit.
   * @returns {object} { unit } — KG or LBS
   */
  getWeightUnit: () =>
    workoutClient.get('/users/preferences/weight-unit'),

  /**
   * Set the user's preferred weight unit.
   * @param {string} unit - KG or LBS
   */
  setWeightUnit: (unit) =>
    workoutClient.put('/users/preferences/weight-unit', { unit }),
};
