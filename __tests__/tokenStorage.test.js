import { tokenStorage } from '../src/utils/tokenStorage';
import AsyncStorage from '@react-native-async-storage/async-storage';

const MOCK = {
  access_token: 'eyJhbGciOiJSUzI1NiJ9.test.access',
  refresh_token: 'opaque-refresh-token-256bit',
  expires_in: 900,
  user: { id: '550e8400-e29b-41d4-a716-446655440000', role: 'PATIENT', first_name: 'Jane', mfa_enabled: false },
};

describe('tokenStorage', () => {
  beforeEach(async () => { await AsyncStorage.clear(); jest.clearAllMocks(); });

  describe('saveTokens + getTokens', () => {
    it('persists and retrieves access token', async () => {
      await tokenStorage.saveTokens(MOCK);
      const tokens = await tokenStorage.getTokens();
      expect(tokens.accessToken).toBe(MOCK.access_token);
    });
    it('persists and retrieves refresh token', async () => {
      await tokenStorage.saveTokens(MOCK);
      const tokens = await tokenStorage.getTokens();
      expect(tokens.refreshToken).toBe(MOCK.refresh_token);
    });
    it('persists and retrieves user object', async () => {
      await tokenStorage.saveTokens(MOCK);
      const tokens = await tokenStorage.getTokens();
      expect(tokens.user.id).toBe(MOCK.user.id);
      expect(tokens.user.role).toBe('PATIENT');
      expect(tokens.user.first_name).toBe('Jane');
    });
    it('calculates expiry timestamp from expires_in', async () => {
      const before = Date.now();
      await tokenStorage.saveTokens(MOCK);
      const tokens = await tokenStorage.getTokens();
      const expectedExpiry = before + 900 * 1000;
      expect(tokens.expiresAt).toBeGreaterThanOrEqual(expectedExpiry - 100);
      expect(tokens.expiresAt).toBeLessThanOrEqual(expectedExpiry + 1000);
    });
  });

  describe('getTokens — edge cases', () => {
    it('returns null when no tokens stored', async () => {
      expect(await tokenStorage.getTokens()).toBeNull();
    });
  });

  describe('clearTokens', () => {
    it('removes all stored token data', async () => {
      await tokenStorage.saveTokens(MOCK);
      await tokenStorage.clearTokens();
      expect(await tokenStorage.getTokens()).toBeNull();
    });
  });

  describe('isTokenExpired', () => {
    it('returns true when no expiry stored', async () => {
      expect(await tokenStorage.isTokenExpired()).toBe(true);
    });
    it('returns true for already-expired token', async () => {
      await tokenStorage.saveTokens({ ...MOCK, expires_in: -1 });
      expect(await tokenStorage.isTokenExpired()).toBe(true);
    });
    it('returns false for a fresh token', async () => {
      await tokenStorage.saveTokens({ ...MOCK, expires_in: 900 });
      expect(await tokenStorage.isTokenExpired()).toBe(false);
    });
    it('returns true within the 30-second buffer window', async () => {
      await tokenStorage.saveTokens({ ...MOCK, expires_in: 20 });
      expect(await tokenStorage.isTokenExpired()).toBe(true);
    });
  });
});
