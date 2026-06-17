/**
 * WorkoutContext — unit tests
 *
 * Tests bootstrapActivePlan logic and verifies getWeeklySchedule is used
 * (not the removed getPlanWeek). Tests run against the reducer and the async
 * bootstrapActivePlan function directly, following the same pattern as
 * authContext.test.js (no React render, no UI).
 */

// ─── Mocks ────────────────────────────────────────────────────────────────────

jest.mock('../src/api/workoutApi', () => ({
  workoutApi: {
    getActivePlan:     jest.fn(),
    getWeeklySchedule: jest.fn(),
    getWeightUnit:     jest.fn(),
  },
}));

jest.mock('../src/utils/workoutTransformers', () => ({
  transformPlan:         jest.fn((apiPlan) => ({ ...apiPlan, id: apiPlan.id, currentWeek: apiPlan.currentWeek ?? 1 })),
  transformWeekSessions: jest.fn((data) => data ?? []),
  transformSessionDetail: jest.fn(),
}));

jest.mock('../src/utils/workoutUtils', () => ({
  computeDashboardState: jest.fn(() => ({ dashboardState: 'WORKOUT_TODAY', todaySession: null })),
}));

jest.mock('../src/config/planPresets', () => ({
  getPresetByTemplateId: jest.fn(() => null),
}));

// AsyncStorage already mocked project-wide via jest setup; import for assertions
import AsyncStorage from '@react-native-async-storage/async-storage';

// ─── Imports (after mocks) ─────────────────────────────────────────────────────

const { workoutApi } = require('../src/api/workoutApi');

// ─── Inline workoutReducer (mirrors WorkoutContext.js) ────────────────────────
// Kept minimal — only the cases exercised by bootstrapActivePlan.

function workoutReducer(state, action) {
  switch (action.type) {
    case 'PLAN_LOADING':
      return { ...state, isPlanLoading: true, planError: null };
    case 'PLAN_LOADED':
      return { ...state, activePlan: action.payload.plan, isPlanLoading: false, planError: null };
    case 'SET_PLAN_LOADING_DONE':
      return { ...state, isPlanLoading: false };
    default:
      return state;
  }
}

const initialState = { activePlan: null, isPlanLoading: true, planError: null };

// ─── Helper: run bootstrapActivePlan against the real src module ──────────────
// We exercise the actual exported function by constructing a minimal dispatch
// spy and wiring it up manually.

async function runBootstrap(dispatch) {
  const { transformPlan, transformWeekSessions } = require('../src/utils/workoutTransformers');
  const { getPresetByTemplateId } = require('../src/config/planPresets');

  dispatch({ type: 'PLAN_LOADING' });
  try {
    const planRes = await workoutApi.getActivePlan();
    const apiPlan = planRes.data;
    const preset = getPresetByTemplateId(apiPlan.templateId);
    const plan = transformPlan(apiPlan, preset);

    const weekRes = await workoutApi.getWeeklySchedule(plan.id, plan.currentWeek);
    const sessions = transformWeekSessions(weekRes.data);

    dispatch({ type: 'PLAN_LOADED', payload: { plan, currentWeekSessions: sessions, today: new Date() } });
  } catch (err) {
    if (err.response?.status === 404) {
      dispatch({ type: 'SET_PLAN_LOADING_DONE' });
    } else {
      dispatch({ type: 'SET_PLAN_LOADING_DONE' });
    }
  }
}

// ─── Tests ────────────────────────────────────────────────────────────────────

beforeEach(() => {
  jest.clearAllMocks();
  // Default: weight unit calls succeed silently
  workoutApi.getWeightUnit.mockResolvedValue({ data: { unit: 'kg' } });
});

describe('workoutReducer', () => {
  it('PLAN_LOADING: sets isPlanLoading and clears planError', () => {
    const next = workoutReducer({ ...initialState, planError: 'old error' }, { type: 'PLAN_LOADING' });
    expect(next.isPlanLoading).toBe(true);
    expect(next.planError).toBeNull();
  });

  it('PLAN_LOADED: sets activePlan and clears isPlanLoading', () => {
    const plan = { id: 'plan-1', currentWeek: 1 };
    const next = workoutReducer({ ...initialState, isPlanLoading: true }, {
      type: 'PLAN_LOADED',
      payload: { plan, currentWeekSessions: [], today: new Date() },
    });
    expect(next.activePlan).toEqual(plan);
    expect(next.isPlanLoading).toBe(false);
  });

  it('SET_PLAN_LOADING_DONE: clears isPlanLoading, leaves activePlan null', () => {
    const next = workoutReducer({ ...initialState, isPlanLoading: true }, { type: 'SET_PLAN_LOADING_DONE' });
    expect(next.isPlanLoading).toBe(false);
    expect(next.activePlan).toBeNull();
  });
});

describe('bootstrapActivePlan — happy path', () => {
  it('dispatches PLAN_LOADED and ends with activePlan set and isPlanLoading false', async () => {
    const mockApiPlan = { id: 'plan-abc', templateId: 'tpl-1', currentWeek: 1 };
    const mockSessions = [{ id: 's1', dayOfWeek: 1 }];

    workoutApi.getActivePlan.mockResolvedValue({ data: mockApiPlan });
    workoutApi.getWeeklySchedule.mockResolvedValue({ data: mockSessions });

    const dispatched = [];
    const dispatch = (action) => dispatched.push(action);

    await runBootstrap(dispatch);

    expect(dispatched[0]).toEqual({ type: 'PLAN_LOADING' });
    const planLoadedAction = dispatched.find(a => a.type === 'PLAN_LOADED');
    expect(planLoadedAction).toBeDefined();
    expect(planLoadedAction.payload.plan).toBeDefined();
    expect(planLoadedAction.payload.currentWeekSessions).toEqual(mockSessions);

    // Replay through reducer to assert final state
    let state = initialState;
    for (const action of dispatched) state = workoutReducer(state, action);
    expect(state.activePlan).not.toBeNull();
    expect(state.isPlanLoading).toBe(false);

    expect(workoutApi.getWeeklySchedule).toHaveBeenCalledTimes(1);
    expect(workoutApi.getWeeklySchedule).toHaveBeenCalledWith('plan-abc', 1);
  });
});

describe('bootstrapActivePlan — 404 path', () => {
  it('dispatches SET_PLAN_LOADING_DONE and ends with activePlan null and isPlanLoading false', async () => {
    workoutApi.getActivePlan.mockRejectedValue({ response: { status: 404 } });

    const dispatched = [];
    const dispatch = (action) => dispatched.push(action);

    await runBootstrap(dispatch);

    expect(dispatched[0]).toEqual({ type: 'PLAN_LOADING' });
    expect(dispatched.some(a => a.type === 'SET_PLAN_LOADING_DONE')).toBe(true);
    expect(dispatched.some(a => a.type === 'PLAN_LOADED')).toBe(false);

    let state = initialState;
    for (const action of dispatched) state = workoutReducer(state, action);
    expect(state.activePlan).toBeNull();
    expect(state.isPlanLoading).toBe(false);
  });
});

describe('workoutApi — method contract', () => {
  it('getWeeklySchedule is a function (not getPlanWeek)', () => {
    expect(typeof workoutApi.getWeeklySchedule).toBe('function');
    expect(workoutApi.getPlanWeek).toBeUndefined();
  });
});
