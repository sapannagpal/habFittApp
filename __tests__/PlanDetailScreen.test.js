/**
 * PlanDetailScreen tests — abandon plan flow.
 *
 * Covers:
 *   1. Successful abandon: calls abandonActivePlan, clears WorkoutContext,
 *      and replaces navigation to PlanCatalogue.
 *   2. Failed abandon: does NOT call clearActivePlan when the API throws.
 *   3. Failed abandon: shows an inline error message.
 */

// ─── Module-level mock functions (must be declared before jest.mock) ──────────

const mockClearActivePlan = jest.fn();
const mockReplace         = jest.fn();
const mockGoBack          = jest.fn();

// ─── Mocks ────────────────────────────────────────────────────────────────────

jest.mock('../src/api/workoutApi', () => ({
  workoutApi: {
    getActivePlan:     jest.fn(),
    abandonActivePlan: jest.fn(),
  },
}));

jest.mock('../src/context/WorkoutContext', () => ({
  useWorkout: () => ({
    clearActivePlan: mockClearActivePlan,
  }),
}));

jest.mock('../src/config/apiConfig', () => ({
  WORKOUT_BASE_URL: 'http://localhost:8084',
  API_TIMEOUT_MS:   15000,
}));

jest.mock('../src/utils/tokenStorage', () => ({
  tokenStorage: { getTokens: jest.fn().mockResolvedValue({ accessToken: null }) },
}));

jest.mock('react-native-safe-area-context', () => {
  const React = require('react');
  return {
    SafeAreaView:      ({ children, ...props }) => React.createElement('View', props, children),
    useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
  };
});

jest.mock('expo-linear-gradient', () => {
  const React = require('react');
  return {
    LinearGradient: ({ children, ...props }) => React.createElement('View', props, children),
  };
});

jest.mock('@expo/vector-icons', () => ({
  Ionicons: () => null,
}));

// ─── Imports ──────────────────────────────────────────────────────────────────

const React = require('react');
const { render, fireEvent, waitFor } = require('@testing-library/react-native');
const { workoutApi } = require('../src/api/workoutApi');
const PlanDetailScreen = require('../src/screens/workout/PlanDetailScreen').default;

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** A minimal active plan object matching the fields PlanDetailScreen reads. */
function makeMockPlan(overrides = {}) {
  return {
    id:            'plan-abc-123',
    programmeName: 'Strength Builder 12W',
    format:        'GYM_BARBELL',
    totalWeeks:    12,
    currentWeek:   3,
    status:        'ACTIVE',
    createdAt:     '2026-01-15T10:00:00.000Z',
    ...overrides,
  };
}

function make500Error() {
  const err = new Error('Internal Server Error');
  err.response = { status: 500 };
  return err;
}

/**
 * Render PlanDetailScreen with a navigation prop that exposes the mocks.
 * getActivePlan must already be configured before calling this.
 */
function renderScreen() {
  return render(
    <PlanDetailScreen
      navigation={{
        replace:  mockReplace,
        goBack:   mockGoBack,
        navigate: jest.fn(),
        popToTop: jest.fn(),
      }}
    />,
  );
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('PlanDetailScreen — abandon plan', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('calls abandonActivePlan, clears WorkoutContext, and replaces to PlanCatalogue on success', async () => {
    workoutApi.getActivePlan.mockResolvedValueOnce({ data: makeMockPlan() });
    workoutApi.abandonActivePlan.mockResolvedValueOnce({ status: 204 });

    const { findByText } = renderScreen();

    // Wait for the plan to load so the Abandon button is rendered
    const abandonBtn = await findByText('Abandon this Plan');
    fireEvent.press(abandonBtn);

    await waitFor(() => {
      // 1. API called exactly once
      expect(workoutApi.abandonActivePlan).toHaveBeenCalledTimes(1);
      // 2. Context cleared before navigation
      expect(mockClearActivePlan).toHaveBeenCalledTimes(1);
      // 3. Navigated to PlanCatalogue via replace (not popToTop)
      expect(mockReplace).toHaveBeenCalledWith('PlanCatalogue');
    });
  });

  it('does NOT call clearActivePlan if abandonActivePlan API fails', async () => {
    workoutApi.getActivePlan.mockResolvedValueOnce({ data: makeMockPlan() });
    workoutApi.abandonActivePlan.mockRejectedValueOnce(make500Error());

    const { findByText } = renderScreen();

    const abandonBtn = await findByText('Abandon this Plan');
    fireEvent.press(abandonBtn);

    await waitFor(() => {
      expect(workoutApi.abandonActivePlan).toHaveBeenCalledTimes(1);
    });

    // clearActivePlan must NOT have been called
    expect(mockClearActivePlan).not.toHaveBeenCalled();
    // Navigation must NOT have fired
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it('shows inline error when abandon fails', async () => {
    workoutApi.getActivePlan.mockResolvedValueOnce({ data: makeMockPlan() });
    workoutApi.abandonActivePlan.mockRejectedValueOnce(make500Error());

    const { findByText } = renderScreen();

    const abandonBtn = await findByText('Abandon this Plan');
    fireEvent.press(abandonBtn);

    // The error message set by setError(...) in the catch block
    await findByText('Could not abandon plan. Please try again.');
  });
});
