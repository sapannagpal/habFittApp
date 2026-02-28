/**
 * API configuration for HabFitt React Native app.
 *
 * iOS Simulator connects to localhost directly.
 * Android Emulator needs 10.0.2.2 (host loopback alias).
 * Update API_BASE_URL for production deployments.
 */
import { Platform } from 'react-native';

const DEV_HOST = Platform.OS === 'android' ? '10.0.2.2' : 'localhost';

export const API_BASE_URL = __DEV__
  ? `http://${DEV_HOST}:8080`
  : 'https://api.habfitt.com';

export const API_TIMEOUT_MS = 15_000;

/** Consent versions must match backend policy registry exactly */
export const CONSENT_VERSIONS = {
  TERMS_OF_SERVICE: '1.0',
  PRIVACY_POLICY: '1.0',
};
