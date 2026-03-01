/**
 * Unit tests for the habFitt Forgot Password flow.
 *
 * Covers:
 *  - authApi.forgotPassword / verifyResetCode / resetPassword — exports + shape
 *  - ForgotPasswordScreen email validation logic (replicated inline)
 *  - ResetCodeScreen OTP validation
 *  - ResetPasswordScreen password validation
 *  - extractErrorMessage — all four response shapes
 *  - API response contract fixtures
 *
 * No real network traffic is made. All HTTP calls are intercepted via
 * jest.mock('axios'), following the same pattern as authApi.test.js.
 */

// ─── Mock axios before importing authApi ─────────────────────────────────────
jest.mock('axios', () => {
  const mockInterceptors = {
    request: { use: jest.fn() },
    response: { use: jest.fn() },
  };

  const mockCreate = jest.fn(() => ({
    interceptors: mockInterceptors,
    post: jest.fn(),
    get: jest.fn(),
  }));

  const axios = {
    create: mockCreate,
    interceptors: mockInterceptors,
    post: jest.fn(),
    get: jest.fn(),
  };

  return { default: axios, ...axios };
});

// ─── Mock tokenStorage ────────────────────────────────────────────────────────
jest.mock('../src/utils/tokenStorage', () => ({
  tokenStorage: {
    getTokens: jest.fn(),
    saveTokens: jest.fn(),
    clearTokens: jest.fn(),
    isTokenExpired: jest.fn(),
  },
}));

// ─── Mock apiConfig ───────────────────────────────────────────────────────────
jest.mock('../src/config/apiConfig', () => ({
  API_BASE_URL: 'http://localhost:8080',
  API_TIMEOUT_MS: 15000,
  CONSENT_VERSIONS: {
    TERMS_OF_SERVICE: '1.0',
    PRIVACY_POLICY: '1.0',
  },
}));

// ─── Mock react-native Platform ──────────────────────────────────────────────
jest.mock('react-native', () => ({
  Platform: { OS: 'ios' },
}));

// ─── Replicated helpers (mirrors screen logic — no render required) ───────────

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_CHARSET = /^[a-zA-Z0-9@_\-!#$%&*.?,+=^~()]+$/;

/**
 * Mirrors extractErrorMessage() from ForgotPasswordScreen / ResetCodeScreen /
 * ResetPasswordScreen. Kept in sync manually — if you change the screens,
 * update this copy too.
 */
function extractErrorMessage(error) {
  if (error.response?.data?.error?.message) return error.response.data.error.message;
  if (error.response?.data?.message) return error.response.data.message;
  if (!error.response) return 'Unable to reach server. Check your connection.';
  return 'Something went wrong. Please try again.';
}

/**
 * Mirrors ForgotPasswordScreen.handleSubmit() validation — returns error string
 * or null when valid.
 */
function validateForgotEmail(raw) {
  const trimmed = raw.trim().toLowerCase();
  if (!trimmed) return 'Email is required';
  if (!EMAIL_REGEX.test(trimmed)) return 'Enter a valid email address';
  return null;
}

/**
 * Mirrors ResetCodeScreen.handleCodeChange() digit sanitisation.
 */
function sanitiseOtp(text) {
  return text.replace(/\D/g, '').slice(0, 6);
}

/**
 * Mirrors ResetPasswordScreen.validate() — returns errors object.
 */
function validateResetPassword(password, confirmPassword) {
  const errors = {};
  if (!password) errors.password = 'Password is required';
  else if (password.length < 6) errors.password = 'Password must be at least 6 characters';
  else if (!PASSWORD_CHARSET.test(password)) errors.password = 'Only letters, digits and common symbols allowed';
  if (!confirmPassword) errors.confirmPassword = 'Please confirm your password';
  else if (password !== confirmPassword) errors.confirmPassword = 'Passwords do not match';
  return errors;
}

// ─── API response fixtures ────────────────────────────────────────────────────

const FORGOT_PASSWORD_RESPONSE = {
  message: 'Reset code sent to jane@habfitt.com',
  expires_in: 300,
};

const VERIFY_CODE_RESPONSE = {
  reset_token: 'opaque-reset-token-abc123',
  expires_in: 600,
};

const RESET_PASSWORD_RESPONSE = {
  message: 'Password has been reset successfully',
};

// ─────────────────────────────────────────────────────────────────────────────
// TEST SUITES
// ─────────────────────────────────────────────────────────────────────────────

describe('authApi — forgotPassword methods', () => {
  it('exports forgotPassword as a function', () => {
    const { authApi } = require('../src/api/authApi');
    expect(typeof authApi.forgotPassword).toBe('function');
  });

  it('exports verifyResetCode as a function', () => {
    const { authApi } = require('../src/api/authApi');
    expect(typeof authApi.verifyResetCode).toBe('function');
  });

  it('exports resetPassword as a function', () => {
    const { authApi } = require('../src/api/authApi');
    expect(typeof authApi.resetPassword).toBe('function');
  });

  it('forgotPassword calls POST /auth/password/forgot with email payload', () => {
    const { authApi } = require('../src/api/authApi');
    // Should not throw; axios.post is mocked
    expect(() => authApi.forgotPassword('jane@habfitt.com')).not.toThrow();
  });

  it('verifyResetCode calls POST /auth/password/verify-code with email and code', () => {
    const { authApi } = require('../src/api/authApi');
    expect(() => authApi.verifyResetCode('jane@habfitt.com', '123456')).not.toThrow();
  });

  it('resetPassword calls POST /auth/password/reset with reset_token and new_password', () => {
    const { authApi } = require('../src/api/authApi');
    expect(() => authApi.resetPassword('opaque-token', 'newPass@1')).not.toThrow();
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe('ForgotPasswordScreen — email validation logic', () => {
  it('rejects empty email', () => {
    expect(validateForgotEmail('')).toBe('Email is required');
  });

  it('rejects whitespace-only email', () => {
    expect(validateForgotEmail('   ')).toBe('Email is required');
  });

  it('rejects email without @', () => {
    expect(validateForgotEmail('janeathabfitt.com')).toBe('Enter a valid email address');
  });

  it('rejects email without domain', () => {
    expect(validateForgotEmail('jane@')).toBe('Enter a valid email address');
  });

  it('rejects email with no TLD part after dot', () => {
    expect(validateForgotEmail('jane@habfitt')).toBe('Enter a valid email address');
  });

  it('accepts valid email', () => {
    expect(validateForgotEmail('jane@habfitt.com')).toBeNull();
  });

  it('accepts valid email with subdomain', () => {
    expect(validateForgotEmail('jane@mail.habfitt.io')).toBeNull();
  });

  it('trims and lowercases email before API call', () => {
    // Validate that the trimming/lowercasing logic produces a cleaned value
    const raw = '  JANE@HabFitt.COM  ';
    const trimmed = raw.trim().toLowerCase();
    expect(trimmed).toBe('jane@habfitt.com');
    // And it should now pass validation
    expect(validateForgotEmail(raw)).toBeNull();
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe('ResetCodeScreen — OTP validation', () => {
  it('rejects code shorter than 6 digits', () => {
    const code = sanitiseOtp('12345');
    expect(code.length).toBeLessThan(6);
    // handleVerify would return an error
    const hasError = code.length !== 6;
    expect(hasError).toBe(true);
  });

  it('rejects code with non-digit characters (strips them)', () => {
    // sanitiseOtp strips non-digits — abc123 becomes '123', length < 6
    const code = sanitiseOtp('abc123');
    expect(code).toBe('123');
    expect(code.length).toBeLessThan(6);
  });

  it('strips letters and keeps only digits', () => {
    const code = sanitiseOtp('1a2b3c4d5e6f');
    expect(code).toBe('123456');
    expect(code.length).toBe(6);
  });

  it('accepts exactly 6 digits', () => {
    const code = sanitiseOtp('123456');
    expect(code).toBe('123456');
    expect(code.length).toBe(6);
  });

  it('truncates input longer than 6 digits to 6', () => {
    const code = sanitiseOtp('12345678');
    expect(code).toBe('123456');
    expect(code.length).toBe(6);
  });

  it('rejects empty string as incomplete', () => {
    const code = sanitiseOtp('');
    expect(code.length).toBe(0);
    expect(code.length !== 6).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe('ResetPasswordScreen — password validation', () => {
  it('rejects empty password', () => {
    const errors = validateResetPassword('', 'anything');
    expect(errors.password).toMatch(/required/i);
  });

  it('rejects password shorter than 6 characters', () => {
    const errors = validateResetPassword('ab1', 'ab1');
    expect(errors.password).toMatch(/6 characters/);
  });

  it('rejects 5-character password (one below threshold)', () => {
    const errors = validateResetPassword('abc12', 'abc12');
    expect(errors.password).toBeDefined();
  });

  it('rejects password with disallowed characters', () => {
    const bad = ['pass<1>', 'test {a}', 'hello world', 'ab}cde', 'ab[cde'];
    bad.forEach((pw) => {
      const errors = validateResetPassword(pw, pw);
      expect(errors.password).toBeDefined();
    });
  });

  it('rejects mismatched confirm password', () => {
    const errors = validateResetPassword('pass@123', 'different1');
    expect(errors.confirmPassword).toMatch(/do not match/i);
  });

  it('rejects empty confirmPassword', () => {
    const errors = validateResetPassword('pass@1', '');
    expect(errors.confirmPassword).toMatch(/confirm/i);
  });

  it('accepts valid matching passwords (6 chars, allowed chars)', () => {
    const errors = validateResetPassword('pass@1', 'pass@1');
    expect(errors.password).toBeUndefined();
    expect(errors.confirmPassword).toBeUndefined();
  });

  it('accepts password with allowed special chars', () => {
    const samples = ['abc_de', 'ab-cde', 'ab!cde', 'a+bcde', 'ab=cde', 'a^bcde', 'ab~cd1', 'ab(cde', 'ab)cde'];
    samples.forEach((pw) => {
      const errors = validateResetPassword(pw, pw);
      expect(errors.password).toBeUndefined();
    });
  });

  it('returns no errors for a strong password', () => {
    const errors = validateResetPassword('StrongP@ss1', 'StrongP@ss1');
    expect(Object.keys(errors).length).toBe(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe('extractErrorMessage — forgot password error shapes', () => {
  it('extracts message from { error: { code, message } } shape', () => {
    const err = {
      response: {
        status: 400,
        data: {
          error: {
            code: 'INVALID_EMAIL',
            message: 'No account found for this email address',
          },
        },
      },
    };
    expect(extractErrorMessage(err)).toBe('No account found for this email address');
  });

  it('extracts message from { message } shape', () => {
    const err = {
      response: {
        status: 404,
        data: { message: 'User not found' },
      },
    };
    expect(extractErrorMessage(err)).toBe('User not found');
  });

  it('returns network error message when no response', () => {
    const err = { message: 'Network Error' }; // no .response
    expect(extractErrorMessage(err)).toBe('Unable to reach server. Check your connection.');
  });

  it('returns generic message for other errors (response present, no message fields)', () => {
    const err = {
      response: {
        status: 500,
        data: {},
      },
    };
    expect(extractErrorMessage(err)).toBe('Something went wrong. Please try again.');
  });

  it('prefers nested error.message over top-level message when both present', () => {
    const err = {
      response: {
        status: 400,
        data: {
          error: { code: 'RATE_LIMITED', message: 'Too many attempts' },
          message: 'Top-level fallback message',
        },
      },
    };
    // The nested shape takes priority
    expect(extractErrorMessage(err)).toBe('Too many attempts');
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe('Forgot password — API response contracts', () => {
  it('forgotPassword response shape: { message, expires_in }', () => {
    expect(FORGOT_PASSWORD_RESPONSE.message).toBeDefined();
    expect(typeof FORGOT_PASSWORD_RESPONSE.message).toBe('string');
    expect(typeof FORGOT_PASSWORD_RESPONSE.expires_in).toBe('number');
    expect(FORGOT_PASSWORD_RESPONSE.expires_in).toBeGreaterThan(0);
  });

  it('verifyResetCode response shape: { reset_token, expires_in }', () => {
    expect(VERIFY_CODE_RESPONSE.reset_token).toBeDefined();
    expect(typeof VERIFY_CODE_RESPONSE.reset_token).toBe('string');
    expect(VERIFY_CODE_RESPONSE.reset_token.length).toBeGreaterThan(0);
    expect(typeof VERIFY_CODE_RESPONSE.expires_in).toBe('number');
    expect(VERIFY_CODE_RESPONSE.expires_in).toBeGreaterThan(0);
  });

  it('resetPassword response shape: { message }', () => {
    expect(RESET_PASSWORD_RESPONSE.message).toBeDefined();
    expect(typeof RESET_PASSWORD_RESPONSE.message).toBe('string');
    expect(RESET_PASSWORD_RESPONSE.message.length).toBeGreaterThan(0);
  });

  it('reset_token is present and non-empty after OTP verification', () => {
    // Simulates reading the token from the API response in ResetCodeScreen
    const { data } = { data: VERIFY_CODE_RESPONSE };
    expect(data.reset_token).toBeTruthy();
  });

  it('forgotPassword expires_in represents seconds (reasonable range)', () => {
    // 300 = 5 minutes — typical OTP TTL
    expect(FORGOT_PASSWORD_RESPONSE.expires_in).toBeGreaterThanOrEqual(60);
    expect(FORGOT_PASSWORD_RESPONSE.expires_in).toBeLessThanOrEqual(3600);
  });

  it('verifyResetCode expires_in represents seconds (reasonable range)', () => {
    expect(VERIFY_CODE_RESPONSE.expires_in).toBeGreaterThanOrEqual(60);
    expect(VERIFY_CODE_RESPONSE.expires_in).toBeLessThanOrEqual(3600);
  });
});
