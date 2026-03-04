/**
 * Tests for useDashboard hook — specifically the dashboardReducer function.
 * Verifies all action types produce the correct state transitions.
 */

// ─── Mocks ────────────────────────────────────────────────────────────────────

jest.mock('../src/api/dashboardApi', () => ({
  dashboardApi: {
    getDashboard: jest.fn(),
  },
}));

jest.mock('../src/utils/tokenStorage', () => ({
  tokenStorage: {
    getTokens: jest.fn().mockResolvedValue({ accessToken: null }),
  },
}));

jest.mock('../src/config/apiConfig', () => ({
  DASHBOARD_BASE_URL: 'http://localhost:8082',
  API_TIMEOUT_MS:     15000,
}));

// ─── Imports ──────────────────────────────────────────────────────────────────

const { dashboardReducer } = require('../src/hooks/useDashboard');

// ─── Initial State ────────────────────────────────────────────────────────────

const initialState = {
  data:         null,
  isLoading:    false,
  isRefreshing: false,
  error:        null,
};

// ─── Test Suite ───────────────────────────────────────────────────────────────

describe('dashboardReducer', () => {
  // ─── FETCH_START ────────────────────────────────────────────────────────────

  describe('FETCH_START', () => {
    it('sets isLoading to true and clears error', () => {
      const prevState = { ...initialState, error: 'previous error' };
      const next = dashboardReducer(prevState, { type: 'FETCH_START' });

      expect(next.isLoading).toBe(true);
      expect(next.error).toBeNull();
    });

    it('does not change data or isRefreshing', () => {
      const prevState = { ...initialState, data: { state: 'WORKOUT' }, isRefreshing: false };
      const next = dashboardReducer(prevState, { type: 'FETCH_START' });

      expect(next.data).toEqual({ state: 'WORKOUT' });
      expect(next.isRefreshing).toBe(false);
    });
  });

  // ─── FETCH_SUCCESS ──────────────────────────────────────────────────────────

  describe('FETCH_SUCCESS', () => {
    it('sets data from payload and clears isLoading and error', () => {
      const prevState = { ...initialState, isLoading: true };
      const payload = { state: 'WORKOUT', greeting: 'Good morning' };
      const next = dashboardReducer(prevState, { type: 'FETCH_SUCCESS', payload });

      expect(next.data).toEqual(payload);
      expect(next.isLoading).toBe(false);
      expect(next.error).toBeNull();
    });
  });

  // ─── FETCH_ERROR ────────────────────────────────────────────────────────────

  describe('FETCH_ERROR', () => {
    it('sets error from payload and clears isLoading', () => {
      const prevState = { ...initialState, isLoading: true };
      const next = dashboardReducer(prevState, { type: 'FETCH_ERROR', payload: 'Network Error' });

      expect(next.error).toBe('Network Error');
      expect(next.isLoading).toBe(false);
    });

    it('does not overwrite existing data', () => {
      const prevState = { ...initialState, data: { state: 'WORKOUT' }, isLoading: true };
      const next = dashboardReducer(prevState, { type: 'FETCH_ERROR', payload: 'Server Error' });

      expect(next.data).toEqual({ state: 'WORKOUT' });
    });
  });

  // ─── REFRESH_START ──────────────────────────────────────────────────────────

  describe('REFRESH_START', () => {
    it('sets isRefreshing to true and clears error', () => {
      const prevState = { ...initialState, error: 'old error' };
      const next = dashboardReducer(prevState, { type: 'REFRESH_START' });

      expect(next.isRefreshing).toBe(true);
      expect(next.error).toBeNull();
    });

    it('does not change isLoading', () => {
      const next = dashboardReducer(initialState, { type: 'REFRESH_START' });
      expect(next.isLoading).toBe(false);
    });
  });

  // ─── REFRESH_SUCCESS ────────────────────────────────────────────────────────

  describe('REFRESH_SUCCESS', () => {
    it('updates data and clears isRefreshing', () => {
      const prevState = { ...initialState, isRefreshing: true, data: { state: 'WORKOUT' } };
      const newData = { state: 'REST_DAY' };
      const next = dashboardReducer(prevState, { type: 'REFRESH_SUCCESS', payload: newData });

      expect(next.data).toEqual(newData);
      expect(next.isRefreshing).toBe(false);
    });
  });

  // ─── REFRESH_ERROR ──────────────────────────────────────────────────────────

  describe('REFRESH_ERROR', () => {
    it('sets error and clears isRefreshing', () => {
      const prevState = { ...initialState, isRefreshing: true };
      const next = dashboardReducer(prevState, { type: 'REFRESH_ERROR', payload: 'Timeout' });

      expect(next.error).toBe('Timeout');
      expect(next.isRefreshing).toBe(false);
    });
  });

  // ─── Unknown action ─────────────────────────────────────────────────────────

  describe('unknown action', () => {
    it('returns state unchanged for an unrecognised action type', () => {
      const next = dashboardReducer(initialState, { type: 'UNKNOWN_ACTION' });
      expect(next).toEqual(initialState);
    });
  });
});
