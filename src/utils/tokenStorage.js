/**
 * HabFitt token storage utility.
 *
 * Persists auth tokens and the user profile using AsyncStorage.
 * Normalises snake_case API response keys to camelCase on save.
 *
 * Provides a simple async API consumed by API interceptors and AuthContext.
 *
 * getTokens() returns:
 *   { accessToken, refreshToken, user }  — all may be null on first launch
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

// ─── Storage Keys ─────────────────────────────────────────────────────────────

const ACCESS_TOKEN_KEY  = '@habfitt:access_token';
const REFRESH_TOKEN_KEY = '@habfitt:refresh_token';
const USER_KEY          = '@habfitt:user';

// ─── tokenStorage ─────────────────────────────────────────────────────────────

export const tokenStorage = {
  /**
   * Returns { accessToken, refreshToken, user } — fields are null if not stored.
   */
  async getTokens() {
    const [accessToken, refreshToken, userJson] = await Promise.all([
      AsyncStorage.getItem(ACCESS_TOKEN_KEY),
      AsyncStorage.getItem(REFRESH_TOKEN_KEY),
      AsyncStorage.getItem(USER_KEY),
    ]);
    let user = null;
    try {
      user = userJson ? JSON.parse(userJson) : null;
    } catch {
      user = null;
    }
    return { accessToken, refreshToken, user };
  },

  /**
   * Persists tokens from an auth response object.
   * Accepts both camelCase and snake_case token fields.
   * @param {{ access_token?: string, accessToken?: string, refresh_token?: string, refreshToken?: string, user?: object }} data
   */
  async saveTokens(data) {
    const accessToken  = data.access_token  ?? data.accessToken  ?? null;
    const refreshToken = data.refresh_token ?? data.refreshToken ?? null;
    const user         = data.user ?? null;

    const writes = [];
    if (accessToken)  writes.push(AsyncStorage.setItem(ACCESS_TOKEN_KEY,  accessToken));
    if (refreshToken) writes.push(AsyncStorage.setItem(REFRESH_TOKEN_KEY, refreshToken));
    if (user)         writes.push(AsyncStorage.setItem(USER_KEY, JSON.stringify(user)));

    await Promise.all(writes);
  },

  /**
   * Removes all stored tokens and user data (logout / session expiry).
   */
  async clearTokens() {
    await Promise.all([
      AsyncStorage.removeItem(ACCESS_TOKEN_KEY),
      AsyncStorage.removeItem(REFRESH_TOKEN_KEY),
      AsyncStorage.removeItem(USER_KEY),
    ]);
  },
};
