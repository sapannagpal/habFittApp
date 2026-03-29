/**
 * WorkoutContext — global workout state for the HabFitt app.
 *
 * Responsibilities:
 *  - Bootstrap: fetch active plan from hf_ms_workout on app startup (after auth)
 *  - Plan management: generatePlan(preset), clearActivePlan()
 *  - Session management: async startSession(sessionId), logSet, completeSession
 *  - Weight unit: synced from API; AsyncStorage as fallback
 *  - Dashboard state: computed from currentWeekSessions + today's date
 */
import React, {
  createContext,
  useContext,
  useEffect,
  useReducer,
  useCallback,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { workoutApi } from '../api/workoutApi';
import { exerciseCache } from '../utils/exerciseCache';
import {
  transformPlan,
  transformWeekSessions,
  transformSessionDetail,
} from '../utils/workoutTransformers';
import { getPresetByTemplateId } from '../config/planPresets';
import { computeDashboardState } from '../utils/workoutUtils';

const WEIGHT_UNIT_KEY = '@habfitt:weight_unit';

const WorkoutContext = createContext(null);

// ─── State shape ───────────────────────────────────────────────────────────────

const initialState = {
  activePlan: null,              // Transformed WorkoutPlan | null
  currentWeekSessions: [],       // PlanSession[] from GET /plans/{id}/weeks/{currentWeek}
  isPlanLoading: true,           // true during bootstrap or generate
  planError: null,               // error message string | null
  isGenerating: false,           // true while POST /plans/generate is in flight
  activeSession: null,           // Enriched WorkoutSession | null
  isSessionLoading: false,       // true while async startSession is in flight
  sessionStartedAt: null,        // timestamp from Date.now()
  setLogs: {},                   // { [exerciseId: string]: SetLogEntry[] }
  weightUnit: 'kg',
  dashboardState: 'NO_PLAN',
  todaySession: null,            // PlanSession | null
};

// ─── Reducer ───────────────────────────────────────────────────────────────────

function workoutReducer(state, action) {
  switch (action.type) {

    case 'PLAN_LOADING':
      return { ...state, isPlanLoading: true, planError: null };

    case 'PLAN_LOADED': {
      const { plan, currentWeekSessions, today } = action.payload;
      const { dashboardState, todaySession } = computeDashboardState(
        plan, currentWeekSessions, today,
      );
      return {
        ...state,
        activePlan: plan,
        currentWeekSessions,
        dashboardState,
        todaySession,
        isPlanLoading: false,
        planError: null,
        isGenerating: false,
        // Clear any stale session state when plan changes
        activeSession: null,
        isSessionLoading: false,
        sessionStartedAt: null,
        setLogs: {},
      };
    }

    case 'PLAN_ERROR':
      return { ...state, isPlanLoading: false, isGenerating: false, planError: action.payload };

    case 'SET_PLAN_LOADING_DONE':
      return { ...state, isPlanLoading: false };

    case 'PLAN_CLEARED':
      return {
        ...state,
        activePlan: null,
        currentWeekSessions: [],
        dashboardState: 'NO_PLAN',
        todaySession: null,
        isPlanLoading: false,
        planError: null,
        isGenerating: false,
        activeSession: null,
        isSessionLoading: false,
        sessionStartedAt: null,
        setLogs: {},
      };

    case 'SET_GENERATING':
      return { ...state, isGenerating: action.payload, planError: null };

    case 'SESSION_LOADING':
      return { ...state, isSessionLoading: true };

    case 'START_SESSION': {
      const { session, sessionStartedAt } = action.payload;
      return {
        ...state,
        activeSession: session,
        isSessionLoading: false,
        sessionStartedAt,
        setLogs: {},
      };
    }

    case 'SESSION_LOAD_ERROR':
      return { ...state, isSessionLoading: false };

    case 'LOG_SET': {
      const { exerciseId, setEntry } = action.payload;
      const existing = state.setLogs[exerciseId] || [];
      return {
        ...state,
        setLogs: {
          ...state.setLogs,
          [exerciseId]: [...existing, setEntry],
        },
      };
    }

    case 'UPDATE_SET': {
      const { exerciseId, setIndex, patch } = action.payload;
      const existing = state.setLogs[exerciseId] || [];
      const updated = existing.map((entry, idx) =>
        idx === setIndex ? { ...entry, ...patch } : entry,
      );
      return {
        ...state,
        setLogs: { ...state.setLogs, [exerciseId]: updated },
      };
    }

    case 'COMPLETE_SESSION':
      return {
        ...state,
        activeSession: null,
        isSessionLoading: false,
        sessionStartedAt: null,
        setLogs: {},
        dashboardState: 'COMPLETED_TODAY',
      };

    case 'SET_WEIGHT_UNIT':
    case 'LOAD_WEIGHT_UNIT':
      return { ...state, weightUnit: action.payload };

    default:
      return state;
  }
}

// ─── Provider ──────────────────────────────────────────────────────────────────

export function WorkoutProvider({ children }) {
  const [state, dispatch] = useReducer(workoutReducer, initialState);

  // ─── Bootstrap ────────────────────────────────────────────────────────────────

  // Called by WorkoutBootstrapper in App.js after successful auth.
  const bootstrapActivePlan = useCallback(async () => {
    dispatch({ type: 'PLAN_LOADING' });
    try {
      // Fetch active plan
      const planRes = await workoutApi.getActivePlan();
      const apiPlan = planRes.data;
      const preset = getPresetByTemplateId(apiPlan.templateId);
      const plan = transformPlan(apiPlan, preset);

      // Fetch current week's sessions
      const weekRes = await workoutApi.getPlanWeek(plan.id, plan.currentWeek);
      const sessions = transformWeekSessions(weekRes.data);

      dispatch({
        type: 'PLAN_LOADED',
        payload: { plan, currentWeekSessions: sessions, today: new Date() },
      });
    } catch (err) {
      if (err.response?.status === 404) {
        // No active plan — this is a valid state
        dispatch({ type: 'SET_PLAN_LOADING_DONE' });
      } else {
        // Don't block the dashboard on plan errors (network issue, etc.)
        dispatch({ type: 'SET_PLAN_LOADING_DONE' });
      }
    }

    // Load weight unit: try local first, then API (best-effort)
    try {
      const stored = await AsyncStorage.getItem(WEIGHT_UNIT_KEY);
      if (stored === 'kg' || stored === 'lbs') {
        dispatch({ type: 'LOAD_WEIGHT_UNIT', payload: stored });
      }
    } catch { /* ignore */ }

    try {
      const { data } = await workoutApi.getWeightUnit();
      const normalizedUnit = data?.unit?.toLowerCase();
      if (normalizedUnit === 'kg' || normalizedUnit === 'lbs') {
        dispatch({ type: 'LOAD_WEIGHT_UNIT', payload: normalizedUnit });
        await AsyncStorage.setItem(WEIGHT_UNIT_KEY, normalizedUnit).catch(() => {});
      }
    } catch { /* ignore — use local default */ }
  }, []);

  // ─── Actions ─────────────────────────────────────────────────────────────────

  /**
   * Generate a new plan from a preset. Calls POST /plans/generate.
   * @param {object} preset - PlanPreset from planPresets.js
   */
  const generatePlan = useCallback(async (preset) => {
    dispatch({ type: 'SET_GENERATING', payload: true });
    try {
      const generateRes = await workoutApi.generatePlan({
        fitnessGoal: preset.fitnessGoal,
        experienceLevel: preset.experienceLevel,
        preferredFormat: preset.preferredFormat,
        availableEquipment: preset.availableEquipment,
        daysPerWeek: preset.daysPerWeek,
        sessionDurationMinutes: preset.sessionDurationMinutes,
        injuryFlags: preset.injuryFlags,
        bodyWeightKg: preset.bodyWeightKg,
        totalWeeks: preset.totalWeeks,
      });

      const apiPlan = generateRes.data;
      const plan = transformPlan(apiPlan, preset);

      const weekRes = await workoutApi.getPlanWeek(plan.id, plan.currentWeek);
      const sessions = transformWeekSessions(weekRes.data);

      dispatch({
        type: 'PLAN_LOADED',
        payload: { plan, currentWeekSessions: sessions, today: new Date() },
      });
    } catch (err) {
      const msg = err.response?.data?.message ?? 'Failed to generate plan. Please try again.';
      dispatch({ type: 'PLAN_ERROR', payload: msg });
      throw err;
    }
  }, []);

  /**
   * Clear the active plan.
   */
  const clearActivePlan = useCallback(() => {
    dispatch({ type: 'PLAN_CLEARED' });
  }, []);

  /**
   * Start a workout session asynchronously.
   * Calls POST /sessions/{id}/start, GET /sessions/{id}/detail, enriches with exercise names.
   * @param {string} sessionId - UUID of the PlanSession to start
   */
  const startSession = useCallback(async (sessionId) => {
    dispatch({ type: 'SESSION_LOADING' });
    try {
      // 1. Start session in backend
      await workoutApi.startSession(sessionId);

      // 2. Fetch full session detail (includes exercises with exerciseIds)
      const detailRes = await workoutApi.getSessionDetail(sessionId);
      const detail = detailRes.data;

      // 3. Ensure all exercise names are cached
      const exerciseIds = (detail.exercises ?? []).map(ex => String(ex.exerciseId));
      await exerciseCache.ensureAll(exerciseIds, (id) => workoutApi.getExercise(id));

      // 4. Transform to FE session shape
      const session = transformSessionDetail(detail, exerciseCache);

      dispatch({
        type: 'START_SESSION',
        payload: { session, sessionStartedAt: Date.now() },
      });
    } catch (err) {
      dispatch({ type: 'SESSION_LOAD_ERROR' });
      throw err;
    }
  }, []);

  /**
   * Log a completed set. Optimistic update + fire-and-forget API call.
   * @param {string} exerciseId - used as setLogs key
   * @param {string} sessionExerciseId - used as the exerciseId param in the API LogSetRequest
   * @param {{ setIndex: number, reps: number, weightKg: number, isCompleted: boolean, completedAt: number }} setEntry
   */
  const logSet = useCallback((exerciseId, sessionExerciseId, setEntry) => {
    // Optimistic local update first
    dispatch({ type: 'LOG_SET', payload: { exerciseId, setEntry } });

    // Fire-and-forget API call — use current state via functional ref pattern
    const currentSession = state.activeSession;
    if (currentSession?.id) {
      workoutApi.logSet(currentSession.id, {
        exerciseId: exerciseId,
        setNumber: setEntry.setIndex + 1,
        reps: setEntry.reps ?? 0,
        weightKg: setEntry.weightKg ?? 0,
      }).catch(() => { /* silently ignore — local state is source of truth */ });
    }
  }, [state.activeSession]);

  /**
   * Patches an existing set log entry.
   */
  const updateSet = useCallback((exerciseId, setIndex, patch) => {
    dispatch({ type: 'UPDATE_SET', payload: { exerciseId, setIndex, patch } });
  }, []);

  /**
   * Complete the session: build summary, await API, dispatch.
   * Throws if the API call fails so the UI can surface an error.
   * @returns {object} summary for WorkoutSummaryScreen
   */
  const completeSession = useCallback(async () => {
    const { activeSession, sessionStartedAt, setLogs } = state;

    const durationSeconds = sessionStartedAt
      ? Math.floor((Date.now() - sessionStartedAt) / 1000)
      : 0;

    let totalSets = 0;
    let totalVolumeKg = 0;

    Object.values(setLogs).forEach((entries) => {
      entries.forEach((entry) => {
        if (entry.isCompleted) {
          totalSets += 1;
          totalVolumeKg += (entry.weightKg || 0) * (entry.reps || 0);
        }
      });
    });

    const exercises = (activeSession?.exercises || []).map((ex) => {
      const logs = setLogs[ex.id] || [];
      const completedLogs = logs.filter(l => l.isCompleted);
      const bestLog = completedLogs.reduce(
        (best, l) => (l.weightKg > (best?.weightKg || 0) ? l : best),
        null,
      );
      return {
        exerciseId: ex.id,
        name: ex.name,
        setsCompleted: completedLogs.length,
        bestSetReps: bestLog?.reps || 0,
        bestSetWeightKg: bestLog?.weightKg || 0,
        isPR: false,
      };
    });

    const summary = {
      sessionName: activeSession?.name ?? '',
      durationSeconds,
      totalSets,
      totalVolumeKg,
      exercises,
      setLogs: { ...setLogs },
    };

    // Await completion — throws on failure so the caller (ActiveSessionScreen) can show an error
    if (activeSession?.id) {
      await workoutApi.completeSession(activeSession.id);
    }

    dispatch({ type: 'COMPLETE_SESSION' });
    return summary;
  }, [state]);

  /**
   * Update weight unit — calls API and persists to AsyncStorage.
   * @param {'kg'|'lbs'} unit
   */
  const setWeightUnit = useCallback(async (unit) => {
    dispatch({ type: 'SET_WEIGHT_UNIT', payload: unit });
    workoutApi.setWeightUnit(unit).catch(() => {});
    try { await AsyncStorage.setItem(WEIGHT_UNIT_KEY, unit); } catch { /* ignore */ }
  }, []);

  const contextValue = {
    // State
    activePlan: state.activePlan,
    currentWeekSessions: state.currentWeekSessions,
    isPlanLoading: state.isPlanLoading,
    planError: state.planError,
    isGenerating: state.isGenerating,
    activeSession: state.activeSession,
    isSessionLoading: state.isSessionLoading,
    sessionStartedAt: state.sessionStartedAt,
    setLogs: state.setLogs,
    weightUnit: state.weightUnit,
    dashboardState: state.dashboardState,
    todaySession: state.todaySession,
    // Actions
    bootstrapActivePlan,
    generatePlan,
    clearActivePlan,
    startSession,
    logSet,
    updateSet,
    completeSession,
    setWeightUnit,
  };

  return (
    <WorkoutContext.Provider value={contextValue}>
      {children}
    </WorkoutContext.Provider>
  );
}

// ─── Hook ──────────────────────────────────────────────────────────────────────

export function useWorkout() {
  const ctx = useContext(WorkoutContext);
  if (!ctx) throw new Error('useWorkout must be used inside <WorkoutProvider>');
  return ctx;
}
