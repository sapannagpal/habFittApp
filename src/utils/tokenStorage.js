/**
 * Persistent token storage using AsyncStorage.
 *
 * Production upgrade path: swap AsyncStorage for expo-secure-store
 * for hardware-backed keychain/keystore storage (HIPAA best practice).
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  ACCESS_TOKEN: '@habfitt:access_token',
  REFRESH_TOKEN: '@habfitt:refresh_token',
  EXPIRES_AT: '@habfitt:token_expires_at',
  USER: '@habfitt:user',
};

export const tokenStorage = {
  async saveTokens(tokenResponse) {
    const expiresAt = Date.now() + tokenResponse.expires_in * 1000;
    await AsyncStorage.multiSet([
      [KEYS.ACCESS_TOKEN, tokenResponse.access_token],
      [KEYS.REFRESH_TOKEN, tokenResponse.refresh_token],
      [KEYS.EXPIRES_AT, String(expiresAt)],
      [KEYS.USER, JSON.stringify(tokenResponse.user)],
    ]);
  },

  async getTokens() {
    const [[, accessToken], [, refreshToken], [, expiresAt], [, userJson]] =
      await AsyncStorage.multiGet([
        KEYS.ACCESS_TOKEN,
        KEYS.REFRESH_TOKEN,
        KEYS.EXPIRES_AT,
        KEYS.USER,
      ]);

    if (!accessToken) return null;

    return {
      accessToken,
      refreshToken,
      expiresAt: Number(expiresAt),
      user: userJson ? JSON.parse(userJson) : null,
    };
  },

  async clearTokens() {
    await AsyncStorage.multiRemove(Object.values(KEYS));
  },

  async isTokenExpired() {
    const expiresAt = await AsyncStorage.getItem(KEYS.EXPIRES_AT);
    if (!expiresAt) return true;
    return Date.now() >= Number(expiresAt) - 30_000;
  },
};
