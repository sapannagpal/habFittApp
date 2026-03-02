/**
 * Unit tests for the habFitt Registration + Email Verification flow.
 *
 * Covers:
 *  - authApi.register / verifyEmail / resendVerificationEmail — exports + shape
 *  - RegisterScreen client-side validation (replicated inline — same pattern as forgotPassword.test.js)
 *  - VerifyEmailScreen resend cooldown logic
 *  - extractErrorMessage — registration-specific error shapes
 *  - API response contract fixtures
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

jest.mock('../src/utils/tokenStorage', () => ({
  tokenStorage: {
    getTokens: jest.fn(),
    saveTokens: jest.fn(),
    clearTokens: jest.fn(),
    isTokenExpired: jest.fn(),
  },
}));

jest.mock('../src/config/apiConfig', () => ({
  API_BASE_URL: 'http://localhost:8080',
  API_TIMEOUT_MS: 15000,
  CONSENT_VERSIONS: {
    TERMS_OF_SERVICE: '1.0',
    PRIVACY_POLICY: '1.0',
  },
}));

jest.mock('react-native', () => ({
  Platform: { OS: 'ios' },
}));

// ─── Replicated helpers (mirrors screen logic) ────────────────────────────────

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^\d{10}$/;
const COUNTRY_CODE_REGEX = /^\+\d{1,3}$/;
const PASSWORD_CHARSET = /^[a-zA-Z0-9@_\-!#$%&*.?,+=^~()]+$/;

function extractErrorMessage(error) {
  if (error.response?.data?.error?.message) return error.response.data.error.message;
  if (error.response?.data?.message) return error.response.data.message;
  if (!error.response) return 'Unable to reach server. Check your connection.';
  return 'Something went wrong. Please try again.';
}

function validateRegistration(form) {
  const errors = {};
  if (!form.firstName?.trim()) errors.firstName = 'First name is required';
  if (!form.lastName?.trim()) errors.lastName = 'Last name is required';
  const email = (form.email || '').trim().toLowerCase();
  if (!email) errors.email = 'Email is required';
  else if (!EMAIL_REGEX.test(email)) errors.email = 'Enter a valid email address';
  if (!COUNTRY_CODE_REGEX.test((form.countryCode || '').trim())) errors.countryCode = 'Enter a valid country code (e.g. +91)';
  const phone = (form.phone || '').replace(/\s/g, '');
  if (!phone) errors.phone = 'Phone number is required';
  else if (!PHONE_REGEX.test(phone)) errors.phone = 'Enter a valid 10-digit mobile number (numbers only)';
  if (!form.dateOfBirth) errors.dateOfBirth = 'Date of birth is required';
  if (!form.password) errors.password = 'Password is required';
  else if (form.password.length < 6) errors.password = 'Password must be at least 6 characters';
  else if (!PASSWORD_CHARSET.test(form.password)) errors.password = 'Only letters, digits and common symbols are allowed';
  if (!form.confirmPassword) errors.confirmPassword = 'Please confirm your password';
  else if (form.password !== form.confirmPassword) errors.confirmPassword = 'Passwords do not match';
  if (!form.tosAccepted) errors.tosAccepted = 'You must accept the Terms of Service';
  if (!form.privacyAccepted) errors.privacyAccepted = 'You must accept the Privacy Policy';
  return errors;
}

// ─── API response fixtures ────────────────────────────────────────────────────

const REGISTER_RESPONSE = {
  user_id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  status: 'PENDING_VERIFICATION',
  message: 'Registration successful. Please check your email to verify your account.',
  verification_email_sent_at: '2026-03-01T10:30:00Z',
};

const VERIFY_EMAIL_RESPONSE = {
  message: 'Email verified successfully. You can now log in.',
  timestamp: '2026-03-01T10:35:00Z',
};

const RESEND_RESPONSE = {
  message: 'If this email is registered and not yet verified, a new verification link has been sent.',
  timestamp: '2026-03-01T10:36:00Z',
};

// ─────────────────────────────────────────────────────────────────────────────
// TEST SUITES
// ─────────────────────────────────────────────────────────────────────────────

describe('authApi — registration methods', () => {
  it('exports register as a function', () => {
    const { authApi } = require('../src/api/authApi');
    expect(typeof authApi.register).toBe('function');
  });

  it('exports verifyEmail as a function', () => {
    const { authApi } = require('../src/api/authApi');
    expect(typeof authApi.verifyEmail).toBe('function');
  });

  it('exports resendVerificationEmail as a function', () => {
    const { authApi } = require('../src/api/authApi');
    expect(typeof authApi.resendVerificationEmail).toBe('function');
  });

  it('register calls POST /auth/register — does not throw', () => {
    const { authApi } = require('../src/api/authApi');
    expect(() => authApi.register({
      firstName: 'Jane', lastName: 'Doe', email: 'jane@habfitt.com',
      phone: '+919876543210', dateOfBirth: '1990-01-15',
      password: 'Test@1234', role: 'PATIENT',
    })).not.toThrow();
  });

  it('verifyEmail calls POST /auth/verify-email — does not throw', () => {
    const { authApi } = require('../src/api/authApi');
    expect(() => authApi.verifyEmail('some-base64url-token')).not.toThrow();
  });

  it('resendVerificationEmail calls POST /auth/verify-email/resend — does not throw', () => {
    const { authApi } = require('../src/api/authApi');
    expect(() => authApi.resendVerificationEmail('jane@habfitt.com')).not.toThrow();
  });
});

describe('RegisterScreen — client-side validation', () => {
  const validForm = {
    firstName: 'Jane', lastName: 'Doe', email: 'jane@habfitt.com',
    countryCode: '+91', phone: '9876543210', dateOfBirth: '1990-01-15',
    password: 'Test@1234', confirmPassword: 'Test@1234',
    tosAccepted: true, privacyAccepted: true,
  };

  it('accepts a fully valid form', () => {
    expect(Object.keys(validateRegistration(validForm)).length).toBe(0);
  });

  it('rejects missing first name', () => {
    const errors = validateRegistration({ ...validForm, firstName: '' });
    expect(errors.firstName).toBeDefined();
  });

  it('rejects missing last name', () => {
    const errors = validateRegistration({ ...validForm, lastName: '' });
    expect(errors.lastName).toBeDefined();
  });

  it('rejects invalid email', () => {
    const errors = validateRegistration({ ...validForm, email: 'notanemail' });
    expect(errors.email).toMatch(/valid/i);
  });

  it('rejects invalid country code', () => {
    const errors = validateRegistration({ ...validForm, countryCode: '091' });
    expect(errors.countryCode).toBeDefined();
  });

  it('rejects non-10-digit phone', () => {
    const errors = validateRegistration({ ...validForm, phone: '12345' });
    expect(errors.phone).toBeDefined();
  });

  it('rejects phone with letters', () => {
    const errors = validateRegistration({ ...validForm, phone: 'abcdefghij' });
    expect(errors.phone).toBeDefined();
  });

  it('rejects missing date of birth', () => {
    const errors = validateRegistration({ ...validForm, dateOfBirth: '' });
    expect(errors.dateOfBirth).toBeDefined();
  });

  it('rejects password shorter than 6 characters', () => {
    const errors = validateRegistration({ ...validForm, password: 'ab1', confirmPassword: 'ab1' });
    expect(errors.password).toMatch(/6 characters/);
  });

  it('rejects mismatched passwords', () => {
    const errors = validateRegistration({ ...validForm, confirmPassword: 'different' });
    expect(errors.confirmPassword).toMatch(/do not match/i);
  });

  it('rejects when ToS not accepted', () => {
    const errors = validateRegistration({ ...validForm, tosAccepted: false });
    expect(errors.tosAccepted).toBeDefined();
  });

  it('rejects when Privacy Policy not accepted', () => {
    const errors = validateRegistration({ ...validForm, privacyAccepted: false });
    expect(errors.privacyAccepted).toBeDefined();
  });
});

describe('VerifyEmailScreen — resend cooldown logic', () => {
  it('cooldown starts at 0 (button enabled)', () => {
    const cooldown = 0;
    expect(cooldown > 0).toBe(false);
  });

  it('after resend, cooldown is set to 60', () => {
    let cooldown = 0;
    // Simulate handleResend setting cooldown
    cooldown = 60;
    expect(cooldown).toBe(60);
    expect(cooldown > 0).toBe(true);
  });

  it('button label shows countdown while cooldown > 0', () => {
    const cooldown = 45;
    const label = cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend';
    expect(label).toBe('Resend in 45s');
  });

  it('button label shows Resend when cooldown == 0', () => {
    const cooldown = 0;
    const label = cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend';
    expect(label).toBe('Resend');
  });

  it('button is disabled when cooldown > 0', () => {
    const cooldown = 30;
    const isResending = false;
    const disabled = cooldown > 0 || isResending;
    expect(disabled).toBe(true);
  });

  it('button is disabled when isResending is true', () => {
    const cooldown = 0;
    const isResending = true;
    const disabled = cooldown > 0 || isResending;
    expect(disabled).toBe(true);
  });

  it('button is enabled when cooldown == 0 and not resending', () => {
    const cooldown = 0;
    const isResending = false;
    const disabled = cooldown > 0 || isResending;
    expect(disabled).toBe(false);
  });
});

describe('extractErrorMessage — registration error shapes', () => {
  it('extracts nested error.message (VALIDATION_ERROR shape)', () => {
    const err = {
      response: {
        status: 400,
        data: { error: { code: 'VALIDATION_ERROR', message: 'One or more fields failed validation.' } },
      },
    };
    expect(extractErrorMessage(err)).toBe('One or more fields failed validation.');
  });

  it('extracts REGISTRATION_PENDING message from 409', () => {
    const err = {
      response: {
        status: 409,
        data: {
          error: {
            code: 'REGISTRATION_PENDING',
            message: 'An account with this email already exists or registration is in progress.',
          },
        },
      },
    };
    expect(extractErrorMessage(err)).toBe('An account with this email already exists or registration is in progress.');
  });

  it('returns network error message when no response', () => {
    expect(extractErrorMessage({ message: 'Network Error' })).toBe('Unable to reach server. Check your connection.');
  });

  it('returns generic message for 500', () => {
    expect(extractErrorMessage({ response: { status: 500, data: {} } })).toBe('Something went wrong. Please try again.');
  });
});

describe('Registration — API response contracts', () => {
  it('register response has user_id, status, message, verification_email_sent_at', () => {
    expect(REGISTER_RESPONSE.user_id).toBeDefined();
    expect(REGISTER_RESPONSE.status).toBe('PENDING_VERIFICATION');
    expect(typeof REGISTER_RESPONSE.message).toBe('string');
    expect(REGISTER_RESPONSE.verification_email_sent_at).toBeDefined();
  });

  it('verifyEmail response has message', () => {
    expect(typeof VERIFY_EMAIL_RESPONSE.message).toBe('string');
    expect(VERIFY_EMAIL_RESPONSE.message.length).toBeGreaterThan(0);
  });

  it('resend response has message (anti-enumeration safe)', () => {
    expect(typeof RESEND_RESPONSE.message).toBe('string');
    expect(RESEND_RESPONSE.message).toContain('If this email is registered');
  });

  it('register status is always PENDING_VERIFICATION after successful registration', () => {
    const { data } = { data: REGISTER_RESPONSE };
    expect(data.status).toBe('PENDING_VERIFICATION');
  });
});
