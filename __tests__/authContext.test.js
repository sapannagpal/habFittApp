function extractErrorMessage(error) {
  if (error.response?.data?.error?.message) return error.response.data.error.message;
  if (error.response?.data?.message) return error.response.data.message;
  if (!error.response) return 'Unable to reach server. Check your connection.';
  return 'Something went wrong. Please try again.';
}

describe('extractErrorMessage', () => {
  it('extracts nested error.message from backend ErrorResponse', () => {
    const error = { response: { data: { error: { code: 'AUTH_INVALID_CREDENTIALS', message: 'Invalid email or password' } } } };
    expect(extractErrorMessage(error)).toBe('Invalid email or password');
  });
  it('falls back to data.message', () => {
    const error = { response: { data: { message: 'Account is locked' } } };
    expect(extractErrorMessage(error)).toBe('Account is locked');
  });
  it('returns network error message when offline', () => {
    expect(extractErrorMessage({ message: 'Network Error' })).toBe('Unable to reach server. Check your connection.');
  });
  it('returns generic message for unknown errors', () => {
    expect(extractErrorMessage({ response: { data: {} } })).toBe('Something went wrong. Please try again.');
  });
});

function authReducer(state, action) {
  switch (action.type) {
    case 'LOADING': return { ...state, isLoading: true, error: null };
    case 'AUTH_SUCCESS': return { ...state, user: action.payload, isAuthenticated: true, isLoading: false, error: null };
    case 'AUTH_LOGOUT': return { ...state, user: null, isAuthenticated: false, isLoading: false, error: null };
    case 'AUTH_ERROR': return { ...state, isLoading: false, error: action.payload };
    case 'CLEAR_ERROR': return { ...state, error: null };
    default: return state;
  }
}

const base = { user: null, isAuthenticated: false, isLoading: false, error: null };

describe('authReducer', () => {
  it('LOADING: sets isLoading and clears error', () => {
    const next = authReducer({ ...base, error: 'previous' }, { type: 'LOADING' });
    expect(next.isLoading).toBe(true);
    expect(next.error).toBeNull();
  });
  it('AUTH_SUCCESS: sets user and isAuthenticated', () => {
    const user = { id: 'uuid', role: 'PATIENT', first_name: 'Jane', mfa_enabled: false };
    const next = authReducer({ ...base, isLoading: true }, { type: 'AUTH_SUCCESS', payload: user });
    expect(next.isAuthenticated).toBe(true);
    expect(next.user).toEqual(user);
    expect(next.isLoading).toBe(false);
    expect(next.error).toBeNull();
  });
  it('AUTH_LOGOUT: clears user and isAuthenticated', () => {
    const next = authReducer({ ...base, user: { id: 'x' }, isAuthenticated: true }, { type: 'AUTH_LOGOUT' });
    expect(next.isAuthenticated).toBe(false);
    expect(next.user).toBeNull();
  });
  it('AUTH_ERROR: sets error and clears isLoading', () => {
    const next = authReducer({ ...base, isLoading: true }, { type: 'AUTH_ERROR', payload: 'Invalid credentials' });
    expect(next.error).toBe('Invalid credentials');
    expect(next.isLoading).toBe(false);
  });
  it('CLEAR_ERROR: clears error only', () => {
    const next = authReducer({ ...base, error: 'some error', isAuthenticated: true }, { type: 'CLEAR_ERROR' });
    expect(next.error).toBeNull();
    expect(next.isAuthenticated).toBe(true);
  });
  it('unknown action returns state unchanged', () => {
    const next = authReducer(base, { type: 'UNKNOWN' });
    expect(next).toBe(base);
  });
});
