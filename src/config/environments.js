/**
 * HabFitt environment configurations.
 *
 * Each environment defines base URLs for every backend service.
 * The active environment is selected by APP_ENV (set in app.config.js → extra).
 *
 * Dev   → local machine (iOS: localhost, Android: 10.0.2.2)
 * UAT   → staging cloud (replace with actual AWS hostnames before UAT deploy)
 * Prod  → production cloud (standard HTTPS, no ports)
 *
 * NOTE: Auth and Workout share the same Spring Boot service (port 8080).
 *       Dashboard is a separate service (port 8082).
 */
import { Platform } from 'react-native';
import Constants from 'expo-constants';

// In dev mode, derive the API host from where Expo/Metro is running.
// This handles both: `expo start` (LAN mode, uses machine IP) and
// `expo start --local` (localhost mode). Falls back to 'localhost' for
// non-Expo environments (unit tests, CI).
const getDevHost = () => {
  if (Platform.OS === 'android') return '10.0.2.2';

  // SDK 49–54 (Expo Go): debuggerHost is "192.168.1.10:8081" (LAN mode)
  // or "localhost:8081" (--local mode). Try multiple paths for SDK compat.
  const debuggerHost =
    Constants.expoGoConfig?.debuggerHost              // SDK 49–54 Expo Go (primary)
    ?? Constants.manifest2?.extra?.expoClient?.hostUri // SDK 49–50 alternate
    ?? Constants.expoConfig?.hostUri                   // SDK 46–48
    ?? Constants.manifest?.debuggerHost;               // SDK ≤45 legacy

  if (debuggerHost) {
    return debuggerHost.split(':')[0]; // strip port, keep host/IP only
  }
  return 'localhost';
};

const DEV_HOST = getDevHost();

if (__DEV__) {
  console.log('[HabFitt env] expoGoConfig.debuggerHost =', Constants.expoGoConfig?.debuggerHost);
  console.log('[HabFitt env] expoConfig.hostUri =', Constants.expoConfig?.hostUri);
  console.log('[HabFitt env] Resolved DEV_HOST =', DEV_HOST);
}

const AUTH_AND_WORKOUT_DEV_PORT = 8080;
const DASHBOARD_DEV_PORT = 8082;

const environments = {
  dev: {
    AUTH_BASE_URL:      `http://${DEV_HOST}:${AUTH_AND_WORKOUT_DEV_PORT}`,
    DASHBOARD_BASE_URL: `http://${DEV_HOST}:${DASHBOARD_DEV_PORT}`,
    WORKOUT_BASE_URL:   `http://${DEV_HOST}:8084`,
    API_TIMEOUT_MS:     15000,
  },

  uat: {
    AUTH_BASE_URL:      'https://api-uat.habfitt.com',
    DASHBOARD_BASE_URL: 'https://dashboard-uat.habfitt.com',
    WORKOUT_BASE_URL:   'https://api-uat.habfitt.com',
    API_TIMEOUT_MS:     20000,
  },

  prod: {
    AUTH_BASE_URL:      'https://api.habfitt.com',
    DASHBOARD_BASE_URL: 'https://dashboard.habfitt.com',
    WORKOUT_BASE_URL:   'https://api.habfitt.com',
    API_TIMEOUT_MS:     20000,
  },
};

export default environments;
