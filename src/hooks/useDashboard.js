/**
 * useDashboard — custom hook for fetching and refreshing dashboard data.
 * Uses useReducer for predictable state transitions.
 * Exposes: data, isLoading, isRefreshing, error, refresh.
 */
import { useReducer, useCallback, useEffect } from 'react';
import { dashboardApi } from '../api/dashboardApi';

// ─── Initial State ────────────────────────────────────────────────────────────

const initialState = {
  data:         null,
  isLoading:    false,
  isRefreshing: false,
  error:        null,
};

// ─── Action Types ─────────────────────────────────────────────────────────────

const FETCH_START      = 'FETCH_START';
const FETCH_SUCCESS    = 'FETCH_SUCCESS';
const FETCH_ERROR      = 'FETCH_ERROR';
const REFRESH_START    = 'REFRESH_START';
const REFRESH_SUCCESS  = 'REFRESH_SUCCESS';
const REFRESH_ERROR    = 'REFRESH_ERROR';

// ─── Reducer ─────────────────────────────────────────────────────────────────

export function dashboardReducer(state, action) {
  switch (action.type) {
    case FETCH_START:
      return { ...state, isLoading: true, error: null };
    case FETCH_SUCCESS:
      return { ...state, isLoading: false, data: action.payload, error: null };
    case FETCH_ERROR:
      return { ...state, isLoading: false, error: action.payload };
    case REFRESH_START:
      return { ...state, isRefreshing: true, error: null };
    case REFRESH_SUCCESS:
      return { ...state, isRefreshing: false, data: action.payload };
    case REFRESH_ERROR:
      return { ...state, isRefreshing: false, error: action.payload };
    default:
      return state;
  }
}

// ─── Error Extraction ─────────────────────────────────────────────────────────

function extractErrorMessage(error) {
  return (
    error?.response?.data?.message ??
    error?.response?.data?.error ??
    error?.message ??
    'An unexpected error occurred'
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useDashboard() {
  const [state, dispatch] = useReducer(dashboardReducer, initialState);

  const load = useCallback(async () => {
    dispatch({ type: FETCH_START });
    try {
      const { data } = await dashboardApi.getDashboard();
      dispatch({ type: FETCH_SUCCESS, payload: data });
    } catch (error) {
      dispatch({ type: FETCH_ERROR, payload: extractErrorMessage(error) });
    }
  }, []);

  const refresh = useCallback(async () => {
    dispatch({ type: REFRESH_START });
    try {
      const { data } = await dashboardApi.getDashboard();
      dispatch({ type: REFRESH_SUCCESS, payload: data });
    } catch (error) {
      dispatch({ type: REFRESH_ERROR, payload: extractErrorMessage(error) });
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { ...state, refresh };
}
