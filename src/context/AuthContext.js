import React, { createContext, useContext, useEffect, useReducer, useCallback } from 'react';
import { authApi, setAuthExpiredCallback } from '../api/authApi';
import { tokenStorage } from '../utils/tokenStorage';

const AuthContext = createContext(null);

const initialState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
};

function authReducer(state, action) {
  switch (action.type) {
    case 'LOADING':
      return { ...state, isLoading: true, error: null };
    case 'AUTH_SUCCESS':
      return { ...state, user: action.payload, isAuthenticated: true, isLoading: false, error: null };
    case 'AUTH_LOGOUT':
      return { ...state, user: null, isAuthenticated: false, isLoading: false, error: null };
    case 'AUTH_ERROR':
      return { ...state, isLoading: false, error: action.payload };
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    default:
      return state;
  }
}

export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

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

  const handleAuthExpired = useCallback(() => {
    dispatch({ type: 'AUTH_LOGOUT' });
  }, []);

  useEffect(() => {
    setAuthExpiredCallback(handleAuthExpired);
  }, [handleAuthExpired]);

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
      // Always clear local state
    } finally {
      await tokenStorage.clearTokens();
      dispatch({ type: 'AUTH_LOGOUT' });
    }
  }, []);

  const clearError = useCallback(() => {
    dispatch({ type: 'CLEAR_ERROR' });
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, login, register, logout, clearError }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}

function extractErrorMessage(error) {
  if (error.response?.data?.error?.message) return error.response.data.error.message;
  if (error.response?.data?.message) return error.response.data.message;
  if (!error.response) return 'Unable to reach server. Check your connection.';
  return 'Something went wrong. Please try again.';
}
