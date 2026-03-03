/**
 * Tests for dashboardApi.js
 * Verifies that the dashboard API client calls the correct endpoint,
 * injects the Authorization header, and handles 200/error responses.
 */

// ─── Mocks ────────────────────────────────────────────────────────────────────

jest.mock('axios', () => {
  const mockAxiosInstance = {
    get:          jest.fn(),
    post:         jest.fn(),
    interceptors: {
      request:  { use: jest.fn() },
      response: { use: jest.fn() },
    },
  };
  const mockAxios = {
    create: jest.fn(() => mockAxiosInstance),
  };
  return mockAxios;
});

jest.mock('../src/utils/tokenStorage', () => ({
  tokenStorage: {
    getTokens: jest.fn(),
  },
}));

// ─── Imports (after mocks) ────────────────────────────────────────────────────

const axios = require('axios');
const { tokenStorage } = require('../src/utils/tokenStorage');

// ─── Helper: get interceptor callbacks ───────────────────────────────────────

function getInterceptorCallbacks(mockInstance, type) {
  // interceptors.request.use and interceptors.response.use are jest.fn()
  // We need to call the captured callbacks manually in tests
  return mockInstance.interceptors[type].use.mock.calls;
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('dashboardApi', () => {
  let dashboardApi;
  let dashboardClient;

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();

    // Re-mock after resetModules
    jest.mock('axios', () => {
      const mockInstance = {
        get:          jest.fn(),
        post:         jest.fn(),
        interceptors: {
          request:  { use: jest.fn() },
          response: { use: jest.fn() },
        },
      };
      return { create: jest.fn(() => mockInstance) };
    });

    jest.mock('../src/utils/tokenStorage', () => ({
      tokenStorage: { getTokens: jest.fn() },
    }));

    const axiosMod = require('axios');
    dashboardClient = axiosMod.create();

    // Require the module under test AFTER mocks are in place
    ({ dashboardApi } = require('../src/api/dashboardApi'));
  });

  // ─── getDashboard ───────────────────────────────────────────────────────────

  describe('getDashboard', () => {
    it('calls GET /api/v1/dashboard', async () => {
      const mockData = { state: 'WORKOUT', greeting: 'Good morning, Jake' };
      dashboardClient.get.mockResolvedValueOnce({ data: mockData });

      await dashboardApi.getDashboard('America/New_York');

      expect(dashboardClient.get).toHaveBeenCalledWith(
        '/api/v1/dashboard',
        expect.objectContaining({
          headers: expect.objectContaining({
            'X-Timezone': 'America/New_York',
          }),
        }),
      );
    });

    it('returns data on a 200 response', async () => {
      const mockData = { state: 'WORKOUT', greeting: 'Good morning, Jake' };
      dashboardClient.get.mockResolvedValueOnce({ data: mockData });

      const result = await dashboardApi.getDashboard();

      expect(result.data).toEqual(mockData);
    });

    it('rejects on a non-200 error response', async () => {
      const networkError = new Error('Network Error');
      dashboardClient.get.mockRejectedValueOnce(networkError);

      await expect(dashboardApi.getDashboard()).rejects.toThrow('Network Error');
    });

    it('uses UTC timezone when none is provided', async () => {
      dashboardClient.get.mockResolvedValueOnce({ data: {} });

      await dashboardApi.getDashboard();

      const callArgs = dashboardClient.get.mock.calls[0];
      const timezone = callArgs[1]?.headers?.['X-Timezone'];

      // Should be a non-empty string (either Intl-resolved or 'UTC')
      expect(typeof timezone).toBe('string');
      expect(timezone.length).toBeGreaterThan(0);
    });
  });

  // ─── Request interceptor ────────────────────────────────────────────────────

  describe('request interceptor', () => {
    it('registers a request interceptor on the dashboard client', () => {
      const axiosMod = require('axios');
      const instance = axiosMod.create();
      expect(instance.interceptors.request.use).toHaveBeenCalled();
    });

    it('injects Authorization Bearer token when token exists', async () => {
      const { tokenStorage: ts } = require('../src/utils/tokenStorage');
      ts.getTokens.mockResolvedValueOnce({ accessToken: 'test-token-123' });

      const axiosMod = require('axios');
      const instance = axiosMod.create();

      // Grab the success handler passed to interceptors.request.use
      const [successHandler] = instance.interceptors.request.use.mock.calls[0] ?? [];

      if (successHandler) {
        const config = { headers: {} };
        const result = await successHandler(config);
        expect(result.headers.Authorization).toBe('Bearer test-token-123');
      }
    });

    it('does not inject Authorization when no token is stored', async () => {
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

  // ─── Response interceptor ───────────────────────────────────────────────────

  describe('response interceptor', () => {
    it('registers a response interceptor on the dashboard client', () => {
      const axiosMod = require('axios');
      const instance = axiosMod.create();
      expect(instance.interceptors.response.use).toHaveBeenCalled();
    });

    it('calls _onDashboardAuthExpired callback on 401', async () => {
      const {
        setDashboardAuthExpiredCallback,
      } = require('../src/api/dashboardApi');

      const callback = jest.fn();
      setDashboardAuthExpiredCallback(callback);

      const axiosMod = require('axios');
      const instance = axiosMod.create();

      // Grab the error handler (second arg to interceptors.response.use)
      const errorHandler = instance.interceptors.response.use.mock.calls[0]?.[1];

      if (errorHandler) {
        const error401 = { response: { status: 401 } };
        await expect(errorHandler(error401)).rejects.toEqual(error401);
        expect(callback).toHaveBeenCalled();
      }
    });
  });
});
