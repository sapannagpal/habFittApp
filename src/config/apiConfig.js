/**
 * HabFitt API configuration.
 * Centralises base URLs and shared constants for all API clients.
 */
import { Platform } from 'react-native';

const DEV_HOST = Platform.OS === 'android' ? '10.0.2.2' : 'localhost';

export const API_BASE_URL = __DEV__ ? `http://${DEV_HOST}:8080` : 'https://api.habfitt.com';

export const DASHBOARD_BASE_URL = __DEV__ ? `http://${DEV_HOST}:8082` : 'https://dashboard.habfitt.com';

export const API_TIMEOUT_MS = 15_000;

export const CONSENT_VERSIONS = { TERMS_OF_SERVICE: '1.0', PRIVACY_POLICY: '1.0' };
