/**
 * API configuration for HabFitt React Native app.
 *
 * iOS Simulator connects to localhost directly.
 * Android Emulator needs 10.0.2.2 (host loopback alias).
 * Update API_BASE_URL for production deployments.
 */
import { Platform } from 'react-native';

const DEV_HOST = Platform.OS === 'android' ? '10.0.2.2' : 'localhost';

// All dev service ports in one place — change here when ports change
const DEV_PORTS = {
  auth:      8080,
  dashboard: 8082,
  coaching:  8083,
  workout:   8084,
};

export const API_BASE_URL = __DEV__
  ? `http://${DEV_HOST}:${DEV_PORTS.auth}`
  : 'https://api.habfitt.com';

export const DASHBOARD_BASE_URL = __DEV__
  ? `http://${DEV_HOST}:${DEV_PORTS.dashboard}`
  : 'https://dashboard.habfitt.com';

export const WORKOUT_BASE_URL = __DEV__
  ? `http://${DEV_HOST}:${DEV_PORTS.workout}`
  : 'https://workout.habfitt.com';

export const API_TIMEOUT_MS = 15_000;

/** Consent versions must match backend policy registry exactly */
export const CONSENT_VERSIONS = {
  TERMS_OF_SERVICE: '1.0',
  PRIVACY_POLICY: '1.0',
};
