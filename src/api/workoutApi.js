/**
 * HabFitt Workout API client.
 * Targets hf-ms-workout on port 8084. NO /api/v1 prefix — all routes at root level.
 * Injects Bearer token from tokenStorage on every request.
 * On 401/403 → silently refreshes the access token once and retries the call.
 *              If refresh fails → fires _onAuthExpired (registered by AuthContext).
 */
import axios from 'axios';
import { WORKOUT_BASE_URL, API_TIMEOUT_MS } from '../config/apiConfig';
import { tokenStorage } from '../utils/tokenStorage';
import { refreshAccessToken } from './authApi';

// ─── Auth-Expired Callback ────────────────────────────────────────────────────

let _onAuthExpired = null;

export function setWorkoutAuthExpiredCallback(cb) {
  _onAuthExpired = cb;
}

// ─── Workout Client ───────────────────────────────────────────────────────────

const workoutClient = axios.create({
  baseURL: WORKOUT_BASE_URL,
  timeout: API_TIMEOUT_MS,
  headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
});

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

// On 401 or 403 (both used by hf-ms-workout for JWT failures — the service's
// JwtAuthenticationFilter silently rejects invalid tokens which results in 403
// from Spring Security, not 401), try a silent refresh once per request and
// replay the original call. If refresh itself fails → fire _onAuthExpired so
// the app logs out.
workoutClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error.response?.status;
    const originalRequest = error.config;
    if ((status === 401 || status === 403) && originalRequest && !originalRequest._retried) {
      originalRequest._retried = true;
      try {
        const newToken = await refreshAccessToken();
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return workoutClient(originalRequest);
      } catch {
        _onAuthExpired?.();
      }
    }
    return Promise.reject(error);
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
   * @returns {object} { id, programmeName, templateId, format, totalWeeks,
   *   currentWeek, status, createdAt }
   */
  generatePlan: (params) =>
    workoutClient.post('/plans/generate', params),

  /**
   * Get the user's currently active plan.
   * Returns 404 if no active plan exists.
   */
  getActivePlan: () =>
    workoutClient.get('/plans/active'),

  /**
   * Get a plan by ID.
   */
  getPlan: (planId) =>
    workoutClient.get(`/plans/${planId}`),

  /**
   * Get the weekly schedule for a plan.
   * weekNumber is a PATH param (e.g. /plans/123/weeks/1).
   */
  getWeeklySchedule: (planId, weekNumber) =>
    workoutClient.get(`/plans/${planId}/weeks/${weekNumber}`),

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
   * @returns {object} { sessionId, status, actualDurationSeconds }
   */
  completeSession: (sessionId, feedback) =>
    workoutClient.post(`/sessions/${sessionId}/complete`, { feedback }),

  /**
   * Abandon a session.
   * @param {string} sessionId
   * @param {string} [reason] - Optional reason string.
   * @returns {object} { sessionId, status }
   */
  abandonSession: (sessionId, reason) =>
    workoutClient.post(`/sessions/${sessionId}/abandon`, reason ? { reason } : {}),

  /**
   * Abandon the user's currently active plan.
   * @returns {object} { planId, status }
   */
  abandonActivePlan: () =>
    workoutClient.post('/plans/active/abandon'),

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
   * @returns {object} ExerciseLogResponse with SKIPPED status
   */
  skipSet: (sessionId, setEntry) =>
    workoutClient.post(`/sessions/${sessionId}/sets/skip`, setEntry),

  // ── Session History & Detail ─────────────────────────────────────────────────

  /**
   * Get paginated session history.
   * @param {number} page - Zero-based page index (default 0).
   * @param {number} size - Page size (default 10).
   * @returns Spring Page: { content: [...], totalElements, totalPages, ... }
   *   Each item: { sessionId, sessionName, status, feedback, startedAt,
   *   completedAt, actualDurationSeconds, exerciseCount }
   */
  getHistory: (page = 0, size = 10) =>
    workoutClient.get('/sessions/history', { params: { page, size } }),

  /**
   * Get full session detail including exercises and set logs.
   * @returns {object} { sessionId, sessionName, status, feedback, startedAt,
   *   completedAt, actualDurationSeconds, exercises: [{ sessionExerciseId,
   *   exerciseId, exerciseOrder, sets, reps, weightKg, restSeconds, metricType,
   *   warmup, cooldown, logs: [...] }] }
   */
  getSessionDetail: (sessionId) =>
    workoutClient.get(`/sessions/${sessionId}/detail`),

  // ── Exercises ────────────────────────────────────────────────────────────────

  /**
   * List all exercises.
   * @param {string} [format] - Optional filter by format (e.g. GYM, HOME).
   * @returns {Array} [{ id, name, format, primaryMuscle, secondaryMuscles,
   *   movementPattern, equipment, experienceLevel, metricType, active }]
   */
  getExercises: (format) =>
    workoutClient.get('/exercises', format ? { params: { format } } : undefined),

  /**
   * Get a single exercise by ID.
   */
  getExercise: (id) =>
    workoutClient.get(`/exercises/${id}`),

  /**
   * Get alternative exercises.
   * @param {string} id - Exercise ID to find alternatives for.
   * @param {object} [options] - { equipment, injuries, limit } (all optional).
   */
  getAlternatives: (id, { equipment, injuries, limit = 6 } = {}) => {
    const params = { limit };
    if (equipment) params.equipment = equipment;
    if (injuries) params.injuries = injuries;
    return workoutClient.get(`/exercises/${id}/alternatives`, { params });
  },

  /**
   * Swap an exercise within a session or across the whole plan.
   * @param {string} id - The exercise being replaced.
   * @param {string} sessionId - Query param identifying the active session.
   * @param {object} body - { targetExerciseId, scope } where scope is SESSION or PLAN.
   */
  swapExercise: (id, sessionId, body) =>
    workoutClient.post(`/exercises/${id}/swap`, body, { params: { sessionId } }),

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
   * @returns {object} { unit }
   */
  setWeightUnit: (unit) =>
    workoutClient.put('/users/preferences/weight-unit', { unit }),
};
