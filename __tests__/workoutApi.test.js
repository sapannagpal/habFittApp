/**
 * Tests for workoutApi.js
 * Verifies that each API method calls the correct endpoint with the correct
 * HTTP method, URL, and request body. Also verifies interceptor behaviour:
 * Bearer token injection and 401 → auth-expired callback.
 */

// ─── Mocks ────────────────────────────────────────────────────────────────────

jest.mock('axios', () => {
  const mockInstance = {
    get:          jest.fn(),
    post:         jest.fn(),
    put:          jest.fn(),
    interceptors: {
      request:  { use: jest.fn() },
      response: { use: jest.fn() },
    },
  };
  return { create: jest.fn(() => mockInstance) };
});

jest.mock('../src/utils/tokenStorage', () => ({
  tokenStorage: {
    getTokens:   jest.fn(),
    saveTokens:  jest.fn(),
    clearTokens: jest.fn(),
  },
}));

jest.mock('../src/config/apiConfig', () => ({
  WORKOUT_BASE_URL: 'http://localhost:8084',
  API_TIMEOUT_MS:   15000,
}));

// ─── Imports (after mocks) ────────────────────────────────────────────────────

const axios = require('axios');

// ─── Test suite ───────────────────────────────────────────────────────────────

describe('workoutApi', () => {
  let workoutApi;
  let workoutClient;

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();

    // Re-register mocks so the re-required module picks them up
    jest.mock('axios', () => {
      const mockInstance = {
        get:          jest.fn(),
        post:         jest.fn(),
        put:          jest.fn(),
        interceptors: {
          request:  { use: jest.fn() },
          response: { use: jest.fn() },
        },
      };
      return { create: jest.fn(() => mockInstance) };
    });

    jest.mock('../src/utils/tokenStorage', () => ({
      tokenStorage: {
        getTokens:   jest.fn(),
        saveTokens:  jest.fn(),
        clearTokens: jest.fn(),
      },
    }));

    jest.mock('../src/config/apiConfig', () => ({
      WORKOUT_BASE_URL: 'http://localhost:8084',
      API_TIMEOUT_MS:   15000,
    }));

    // Grab the mock axios instance created when the module is imported
    const axiosMod = require('axios');
    workoutClient  = axiosMod.create();

    // Require the module under test AFTER mocks are in place
    ({ workoutApi } = require('../src/api/workoutApi'));
  });

  // ─── Plans ─────────────────────────────────────────────────────────────────

  describe('getActivePlan', () => {
    it('calls GET /plans/active', async () => {
      workoutClient.get.mockResolvedValueOnce({ data: { id: 'plan-1' } });
      await workoutApi.getActivePlan();
      expect(workoutClient.get).toHaveBeenCalledWith('/plans/active');
    });

    it('returns the response data', async () => {
      const plan = { id: 'plan-1', programmeName: 'Strength 12W' };
      workoutClient.get.mockResolvedValueOnce({ data: plan });
      const result = await workoutApi.getActivePlan();
      expect(result.data).toEqual(plan);
    });

    it('rejects on error', async () => {
      workoutClient.get.mockRejectedValueOnce(new Error('Network Error'));
      await expect(workoutApi.getActivePlan()).rejects.toThrow('Network Error');
    });
  });

  describe('generatePlan', () => {
    it('calls POST /plans/generate with the full payload as the request body', async () => {
      const payload = {
        goal:                   'BUILD_MUSCLE',
        experienceLevel:        'INTERMEDIATE',
        daysPerWeek:            4,
        sessionDurationMinutes: 45,
        bodyWeightKg:           80,
      };
      workoutClient.post.mockResolvedValueOnce({ data: { id: 'plan-new' } });

      await workoutApi.generatePlan(payload);

      expect(workoutClient.post).toHaveBeenCalledWith('/plans/generate', payload);
    });

    it('returns the generated plan data', async () => {
      const plan = { id: 'plan-new', programmeName: 'AI Muscle 8W' };
      workoutClient.post.mockResolvedValueOnce({ data: plan });
      const result = await workoutApi.generatePlan({});
      expect(result.data).toEqual(plan);
    });
  });

  describe('getWeeklySchedule', () => {
    it('uses path params — GET /plans/{planId}/weeks/{weekNumber}', async () => {
      workoutClient.get.mockResolvedValueOnce({ data: { days: [] } });

      await workoutApi.getWeeklySchedule('plan-abc', 3);

      expect(workoutClient.get).toHaveBeenCalledWith('/plans/plan-abc/weeks/3');
    });

    it('does NOT pass weekNumber as a query param', async () => {
      workoutClient.get.mockResolvedValueOnce({ data: { days: [] } });

      await workoutApi.getWeeklySchedule('plan-abc', 2);

      // Ensure no second argument (params object) was passed
      const callArgs = workoutClient.get.mock.calls[0];
      expect(callArgs[1]).toBeUndefined();
    });
  });

  // ─── Session Lifecycle ──────────────────────────────────────────────────────

  describe('startSession', () => {
    it('calls POST /sessions/{sessionId}/start with no body', async () => {
      workoutClient.post.mockResolvedValueOnce({ data: { sessionId: 'sess-1', status: 'IN_PROGRESS' } });

      await workoutApi.startSession('sess-1');

      expect(workoutClient.post).toHaveBeenCalledWith('/sessions/sess-1/start');
    });
  });

  describe('completeSession', () => {
    it('calls POST /sessions/{sessionId}/complete with { feedback } body', async () => {
      workoutClient.post.mockResolvedValueOnce({ data: { sessionId: 'sess-1', status: 'COMPLETED' } });

      await workoutApi.completeSession('sess-1', 'JUST_RIGHT');

      expect(workoutClient.post).toHaveBeenCalledWith(
        '/sessions/sess-1/complete',
        { feedback: 'JUST_RIGHT' },
      );
    });
  });

  describe('abandonSession', () => {
    it('calls POST /sessions/{sessionId}/abandon with empty body when no reason given', async () => {
      workoutClient.post.mockResolvedValueOnce({ data: { sessionId: 'sess-1', status: 'ABANDONED' } });

      await workoutApi.abandonSession('sess-1');

      expect(workoutClient.post).toHaveBeenCalledWith('/sessions/sess-1/abandon', {});
    });

    it('includes { reason } in body when reason is provided', async () => {
      workoutClient.post.mockResolvedValueOnce({ data: {} });

      await workoutApi.abandonSession('sess-1', 'tired');

      expect(workoutClient.post).toHaveBeenCalledWith(
        '/sessions/sess-1/abandon',
        { reason: 'tired' },
      );
    });
  });

  // ─── Set Logging ────────────────────────────────────────────────────────────

  describe('logSet', () => {
    it('calls POST /sessions/{sessionId}/sets with the setEntry object as body', async () => {
      workoutClient.post.mockResolvedValueOnce({ data: { log: {}, newPersonalRecords: [] } });

      const setEntry = {
        exerciseId: 'ex-123',
        setNumber:  1,
        reps:       10,
        weightKg:   80,
      };
      await workoutApi.logSet('sess-1', setEntry);

      expect(workoutClient.post).toHaveBeenCalledWith('/sessions/sess-1/sets', setEntry);
    });

    it('passes weightKg: null when weight is not provided', async () => {
      workoutClient.post.mockResolvedValueOnce({ data: {} });

      const setEntry = { exerciseId: 'ex-123', setNumber: 2, reps: 12, weightKg: null };
      await workoutApi.logSet('sess-1', setEntry);

      const [, body] = workoutClient.post.mock.calls[0];
      expect(body.weightKg).toBeNull();
    });

    it('includes exerciseId and setNumber in the body — not positional args', async () => {
      workoutClient.post.mockResolvedValueOnce({ data: {} });

      const setEntry = { exerciseId: 'ex-456', setNumber: 3, reps: 8, weightKg: 60 };
      await workoutApi.logSet('sess-xyz', setEntry);

      // Verify the second argument to post() IS the setEntry object (not spread args)
      const [url, body] = workoutClient.post.mock.calls[0];
      expect(url).toBe('/sessions/sess-xyz/sets');
      expect(body).toEqual({ exerciseId: 'ex-456', setNumber: 3, reps: 8, weightKg: 60 });
    });
  });

  describe('skipSet', () => {
    it('calls POST /sessions/{sessionId}/sets/skip with the setEntry object as body', async () => {
      workoutClient.post.mockResolvedValueOnce({ data: { status: 'SKIPPED' } });

      const setEntry = { exerciseId: 'ex-789', setNumber: 2 };
      await workoutApi.skipSet('sess-1', setEntry);

      expect(workoutClient.post).toHaveBeenCalledWith(
        '/sessions/sess-1/sets/skip',
        setEntry,
      );
    });

    it('sends exerciseId and setNumber as body fields — not positional args', async () => {
      workoutClient.post.mockResolvedValueOnce({ data: {} });

      const setEntry = { exerciseId: 'ex-999', setNumber: 1 };
      await workoutApi.skipSet('sess-abc', setEntry);

      const [url, body] = workoutClient.post.mock.calls[0];
      expect(url).toBe('/sessions/sess-abc/sets/skip');
      expect(body).toEqual({ exerciseId: 'ex-999', setNumber: 1 });
      // Confirm it is NOT passing extra positional args
      expect(workoutClient.post.mock.calls[0].length).toBe(2);
    });
  });

  // ─── Request interceptor ────────────────────────────────────────────────────

  describe('request interceptor — Bearer token injection', () => {
    it('registers a request interceptor', () => {
      const axiosMod = require('axios');
      const instance = axiosMod.create();
      expect(instance.interceptors.request.use).toHaveBeenCalled();
    });

    it('injects Authorization header when a token is present', async () => {
      const { tokenStorage: ts } = require('../src/utils/tokenStorage');
      ts.getTokens.mockResolvedValueOnce({ accessToken: 'workout-token-abc' });

      const axiosMod = require('axios');
      const instance = axiosMod.create();

      const [successHandler] = instance.interceptors.request.use.mock.calls[0] ?? [];
      if (successHandler) {
        const config = { headers: {} };
        const result = await successHandler(config);
        expect(result.headers.Authorization).toBe('Bearer workout-token-abc');
      }
    });

    it('does not inject Authorization when token is absent', async () => {
      const { tokenStorage: ts } = require('../src/utils/tokenStorage');
      ts.getTokens.mockResolvedValueOnce({ accessToken: null });

      const axiosMod = require('axios');
      const instance = axiosMod.create();

      const [successHandler] = instance.interceptors.request.use.mock.calls[0] ?? [];
      if (successHandler) {
        const config = { headers: {} };
        const result = await successHandler(config);
        expect(result.headers.Authorization).toBeUndefined();
      }
    });
  });

  // ─── Response interceptor — token refresh + auth-expired callback ──────────

  describe('response interceptor — refresh + auth-expired callback', () => {
    it('registers a response interceptor', () => {
      const axiosMod = require('axios');
      const instance = axiosMod.create();
      expect(instance.interceptors.response.use).toHaveBeenCalled();
    });

    it('fires _onWorkoutAuthExpired only when refresh fails on 401/403', async () => {
      // The new interceptor uses rawAuthAxios.post internally (same mock instance as
      // workoutClient since axios.create() always returns the same mock). We make
      // workoutClient.post reject so the refresh call fails, then verify the callback fires.
      const { tokenStorage: ts } = require('../src/utils/tokenStorage');
      ts.getTokens.mockResolvedValueOnce({ refreshToken: 'old-refresh-token' });
      ts.clearTokens.mockResolvedValueOnce(undefined);

      const { setWorkoutAuthExpiredCallback } = require('../src/api/workoutApi');
      const callback = jest.fn();
      setWorkoutAuthExpiredCallback(callback);

      const axiosMod = require('axios');
      const instance = axiosMod.create();

      // rawAuthAxios.post (same mock instance) rejects — simulates refresh failure
      instance.post.mockRejectedValueOnce(new Error('refresh failed'));

      const errorHandler = instance.interceptors.response.use.mock.calls[0]?.[1];
      if (errorHandler) {
        const error401 = { response: { status: 401 }, config: {} };
        // Rejects with the refresh error (not the original 401 — that's the new behaviour)
        await expect(errorHandler(error401)).rejects.toThrow('refresh failed');
        await new Promise((r) => setImmediate(r));
        expect(callback).toHaveBeenCalled();
      }
    });

    it('does not fire the callback on non-401/403 errors', async () => {
      const { setWorkoutAuthExpiredCallback } = require('../src/api/workoutApi');
      const callback = jest.fn();
      setWorkoutAuthExpiredCallback(callback);

      const axiosMod = require('axios');
      const instance = axiosMod.create();

      const errorHandler = instance.interceptors.response.use.mock.calls[0]?.[1];
      if (errorHandler) {
        const error500 = { response: { status: 500 }, config: {} };
        await expect(errorHandler(error500)).rejects.toEqual(error500);
        expect(callback).not.toHaveBeenCalled();
      }
    });
  });
});
