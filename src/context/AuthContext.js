/**
 * AuthContext — global authentication state for the HabFitt app.
 *
 * Responsibilities:
 *  - Bootstrap: reads stored tokens on app startup, sets initial auth state
 *  - Actions: login(), register(), logout()
 *  - Error surface: exposes last error message for screens to display
 *  - Session expiry: registers callback with authApi, dashboardApi, and workoutApi
 *    to receive "session expired" events and trigger logout
 *
 * Usage:
 *   const { isAuthenticated, user, login, logout, isLoading, isBootstrapping, error } = useAuth();
 */
import React, {
  createContext,
  useContext,
  useEffect,
  useReducer,
  useCallback,
} from 'react';
import { authApi, setAuthExpiredCallback } from '../api/authApi';
import { setDashboardAuthExpiredCallback } from '../api/dashboardApi';
import { setWorkoutAuthExpiredCallback } from '../api/workoutApi';
import { tokenStorage } from '../utils/tokenStorage';
import { exerciseCache } from '../utils/exerciseCache';

const AuthContext = createContext(null);

// ─── State shape ───────────────────────────────────────────────────────────────
const initialState = {
  user: null,              // { id, role, first_name, mfa_enabled } from TokenResponse
  isAuthenticated: false,
  isBootstrapping: true,   // true only during the initial token-read on app startup
  isLoading: true,         // true while bootstrapping or during API calls
  error: null,             // last error message string
};

// ─── Reducer ───────────────────────────────────────────────────────────────────
function authReducer(state, action) {
  switch (action.type) {
    case 'LOADING':
      return { ...state, isLoading: true, error: null };
    case 'AUTH_SUCCESS':
      return {
        ...state,
        user: action.payload,
        isAuthenticated: true,
        isBootstrapping: false,
        isLoading: false,
        error: null,
      };
    case 'AUTH_LOGOUT':
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isBootstrapping: false,
        isLoading: false,
        error: null,
      };
    case 'AUTH_ERROR':
      return { ...state, isBootstrapping: false, isLoading: false, error: action.payload };
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    default:
      return state;
  }
}

// ─── Provider ──────────────────────────────────────────────────────────────────
export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Bootstrap: check for existing session on app startup
  useEffect(() => {
    (async () => {
      try {
        const tokens = await tokenStorage.getTokens();
        if (tokens?.user) {
          dispatch({ type: 'AUTH_SUCCESS', payload: tokens.user });
        } else {
          dispatch({ type: 'AUTH_LOGOUT' });
        }
      } catch {
        dispatch({ type: 'AUTH_LOGOUT' });
      }
    })();
  }, []);

  // Register token-refresh-failure callbacks so all API interceptors can signal logout
  const handleAuthExpired = useCallback(() => {
    dispatch({ type: 'AUTH_LOGOUT' });
  }, []);

  useEffect(() => {
    setAuthExpiredCallback(handleAuthExpired);
    setDashboardAuthExpiredCallback(handleAuthExpired);
    setWorkoutAuthExpiredCallback(handleAuthExpired);
  }, [handleAuthExpired]);

  // ─── Actions ────────────────────────────────────────────────────────────────

  const login = useCallback(async (email, password) => {
    dispatch({ type: 'LOADING' });
    try {
      const { data } = await authApi.login(email, password);
      await tokenStorage.saveTokens(data);
      dispatch({ type: 'AUTH_SUCCESS', payload: data.user });
      return data;
    } catch (err) {
      dispatch({ type: 'AUTH_ERROR', payload: extractErrorMessage(err) });
      throw err;
    }
  }, []);

  const register = useCallback(async (formData) => {
    dispatch({ type: 'LOADING' });
    try {
      const { data } = await authApi.register(formData);
      // Registration does NOT authenticate — account is PENDING_VERIFICATION
      dispatch({ type: 'AUTH_LOGOUT' });
      return data;
    } catch (err) {
      dispatch({ type: 'AUTH_ERROR', payload: extractErrorMessage(err) });
      throw err;
    }
  }, []);

  const logout = useCallback(async (logoutAllDevices = false) => {
    try {
      await authApi.logout(logoutAllDevices);
    } catch {
      // Always clear local state, even if the API call fails
    } finally {
      await tokenStorage.clearTokens();
      exerciseCache.clear();
      dispatch({ type: 'AUTH_LOGOUT' });
    }
  }, []);

  const clearError = useCallback(() => {
    dispatch({ type: 'CLEAR_ERROR' });
  }, []);

  return (
    <AuthContext.Provider
      value={{ ...state, login, register, logout, clearError }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ─── Hook ──────────────────────────────────────────────────────────────────────
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}

// ─── Helpers ───────────────────────────────────────────────────────────────────
function extractErrorMessage(error) {
  // Backend ErrorResponse shape: { error: { code, message } }
  if (error.response?.data?.error?.message) {
    return error.response.data.error.message;
  }
  if (error.response?.data?.message) {
    return error.response.data.message;
  }
  if (!error.response) {
    return 'Unable to reach server. Check your connection.';
  }
  return 'Something went wrong. Please try again.';
}
