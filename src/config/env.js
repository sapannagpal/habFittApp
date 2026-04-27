/**
 * Active environment resolver.
 *
 * Reads APP_ENV from Expo's extra config (set in app.config.js).
 * Falls back to 'dev' so plain `npx expo start` always works.
 *
 * Usage:
 *   import env from './env';
 *   env.AUTH_BASE_URL  → 'http://localhost:8080'  (in dev)
 */
import Constants from 'expo-constants';
import environments from './environments';

const APP_ENV = Constants.expoConfig?.extra?.APP_ENV ?? 'dev';

if (!environments[APP_ENV]) {
  console.warn(`[env] Unknown APP_ENV="${APP_ENV}", falling back to "dev"`);
}

const env = environments[APP_ENV] ?? environments.dev;

export default env;

/** Convenience export — which environment is active */
export const activeEnv = APP_ENV;
