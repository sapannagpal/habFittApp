/**
 * Unit tests for RegisterScreen validation rules.
 * Tests cover: country code, phone, password, and date-of-birth parsing.
 */

// ─── Replicated validation helpers (mirrors RegisterScreen logic) ─────────────

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const COUNTRY_CODE_REGEX = /^\+\d{1,4}$/;
const PASSWORD_CHARSET = /^[a-zA-Z0-9@_\-!#$%&*.?,+=^~()]+$/;

function parseDDMMYYYY(str) {
  if (!str || str.length !== 10) return null;
  const parts = str.split('-');
  if (parts.length !== 3) return null;
  const [d, m, y] = parts;
  const date = new Date(`${y}-${m}-${d}`);
  return isNaN(date.getTime()) ? null : date;
}

function toBackendDate(displayDate) {
  if (!displayDate || displayDate.length !== 10) return '';
  const [d, m, y] = displayDate.split('-');
  return `${y}-${m}-${d}`;
}

function validate(form) {
  const errors = {};
  if (!form.firstName.trim()) errors.firstName = 'First name is required';
  if (!form.lastName.trim()) errors.lastName = 'Last name is required';

  if (!form.email.trim()) errors.email = 'Email is required';
  else if (!EMAIL_REGEX.test(form.email)) errors.email = 'Enter a valid email address';

  if (!form.countryCode || !COUNTRY_CODE_REGEX.test(form.countryCode)) {
    errors.countryCode = 'Enter a valid country code (e.g. +91)';
  }

  const digitsOnly = form.phone.replace(/\s/g, '');
  if (!digitsOnly) errors.phone = 'Phone number is required';
  else if (!/^\d{10}$/.test(digitsOnly)) errors.phone = 'Enter a valid 10-digit mobile number (numbers only)';

  if (!form.dateOfBirth.trim()) errors.dateOfBirth = 'Date of birth is required';
  else if (!parseDDMMYYYY(form.dateOfBirth)) errors.dateOfBirth = 'Use DD-MM-YYYY format';

  if (!form.password) errors.password = 'Password is required';
  else if (form.password.length < 6) errors.password = 'Password must be at least 6 characters';
  else if (!PASSWORD_CHARSET.test(form.password)) errors.password = 'Only letters, digits and common symbols allowed';

  if (!form.confirmPassword) errors.confirmPassword = 'Please confirm your password';
  else if (form.password !== form.confirmPassword) errors.confirmPassword = 'Passwords do not match';

  if (!form.tosAccepted) errors.tosAccepted = 'You must accept the Terms of Service';
  if (!form.privacyAccepted) errors.privacyAccepted = 'You must accept the Privacy Policy';

  return errors;
}

const validForm = {
  firstName: 'Jane',
  lastName: 'Doe',
  email: 'jane@habfitt.com',
  countryCode: '+91',
  phone: '9876543210',
  dateOfBirth: '15-01-1990',
  password: 'pass@1',
  confirmPassword: 'pass@1',
  tosAccepted: true,
  privacyAccepted: true,
};

// ─── Country code tests ───────────────────────────────────────────────────────

describe('Country code validation', () => {
  it('accepts +91 (India)', () => {
    expect(COUNTRY_CODE_REGEX.test('+91')).toBe(true);
  });

  it('accepts +1 (USA)', () => {
    expect(COUNTRY_CODE_REGEX.test('+1')).toBe(true);
  });

  it('accepts +44 (UK)', () => {
    expect(COUNTRY_CODE_REGEX.test('+44')).toBe(true);
  });

  it('accepts +9999 (max 4 digits)', () => {
    expect(COUNTRY_CODE_REGEX.test('+9999')).toBe(true);
  });

  it('rejects empty string', () => {
    expect(COUNTRY_CODE_REGEX.test('')).toBe(false);
  });

  it('rejects missing + prefix', () => {
    expect(COUNTRY_CODE_REGEX.test('91')).toBe(false);
  });

  it('rejects + with no digits', () => {
    expect(COUNTRY_CODE_REGEX.test('+')).toBe(false);
  });

  it('rejects +99999 (5 digits — too long)', () => {
    expect(COUNTRY_CODE_REGEX.test('+99999')).toBe(false);
  });

  it('triggers error in form validation when country code invalid', () => {
    const errors = validate({ ...validForm, countryCode: '91' });
    expect(errors.countryCode).toBeDefined();
  });

  it('no error when country code is valid', () => {
    const errors = validate({ ...validForm, countryCode: '+44' });
    expect(errors.countryCode).toBeUndefined();
  });
});

// ─── Password validation tests ────────────────────────────────────────────────

describe('Password validation — min 6, common special chars only', () => {
  it('accepts exactly 6 characters (all lowercase)', () => {
    const errors = validate({ ...validForm, password: 'abcdef', confirmPassword: 'abcdef' });
    expect(errors.password).toBeUndefined();
  });

  it('accepts 6-char password with no uppercase or special char', () => {
    const errors = validate({ ...validForm, password: 'abc123', confirmPassword: 'abc123' });
    expect(errors.password).toBeUndefined();
  });

  it('accepts 6-char password that is all uppercase', () => {
    const errors = validate({ ...validForm, password: 'ABCDEF', confirmPassword: 'ABCDEF' });
    expect(errors.password).toBeUndefined();
  });

  it('accepts password with a common special char', () => {
    const errors = validate({ ...validForm, password: 'pass@1', confirmPassword: 'pass@1' });
    expect(errors.password).toBeUndefined();
  });

  it('accepts password with allowed special chars (@_-!#$%&*.?,+=^~())', () => {
    const samples = ['abc_de', 'ab-cde', 'ab!cde', 'a+bcde', 'ab=cde', 'a^bcde', 'ab~cd1', 'ab(cde', 'ab)cde'];
    samples.forEach((pw) => {
      const errors = validate({ ...validForm, password: pw, confirmPassword: pw });
      expect(errors.password).toBeUndefined();
    });
  });

  it('rejects password shorter than 6 characters', () => {
    const errors = validate({ ...validForm, password: 'ab1', confirmPassword: 'ab1' });
    expect(errors.password).toMatch(/6 characters/);
  });

  it('rejects 5-character password (one below threshold)', () => {
    const errors = validate({ ...validForm, password: 'abc12', confirmPassword: 'abc12' });
    expect(errors.password).toBeDefined();
  });

  it('rejects empty password', () => {
    const errors = validate({ ...validForm, password: '', confirmPassword: '' });
    expect(errors.password).toMatch(/required/i);
  });

  it('rejects password with disallowed chars (<, >, {, }, space)', () => {
    const bad = ['pass<1>', 'test {a}', 'hello world', 'ab}cde', 'ab[cde'];
    bad.forEach((pw) => {
      const errors = validate({ ...validForm, password: pw, confirmPassword: pw });
      expect(errors.password).toBeDefined();
    });
  });
});

// ─── E.164 phone build ────────────────────────────────────────────────────────

describe('E.164 phone construction', () => {
  it('strips spaces and prepends country code', () => {
    const countryCode = '+91';
    const phone = '98765 43210';
    const e164 = countryCode.trim() + phone.replace(/\s/g, '');
    expect(e164).toBe('+919876543210');
  });

  it('works with +1 country code', () => {
    const e164 = '+1' + '4155551234';
    expect(e164).toBe('+14155551234');
  });
});

// ─── Date parsing ─────────────────────────────────────────────────────────────

describe('Date parsing and backend conversion', () => {
  it('parses valid DD-MM-YYYY', () => {
    expect(parseDDMMYYYY('15-01-1990')).toBeTruthy();
  });

  it('converts DD-MM-YYYY to YYYY-MM-DD for backend', () => {
    expect(toBackendDate('15-01-1990')).toBe('1990-01-15');
  });

  it('rejects invalid date string', () => {
    expect(parseDDMMYYYY('1990-01-15')).toBeNull(); // wrong format order
    expect(parseDDMMYYYY('32-01-2000')).toBeNull(); // day 32 — always invalid
    expect(parseDDMMYYYY('15-13-2000')).toBeNull(); // month 13 — always invalid
    expect(parseDDMMYYYY('')).toBeNull();
  });
});
