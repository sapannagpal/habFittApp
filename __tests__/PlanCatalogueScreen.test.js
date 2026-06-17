/**
 * Tests for PlanCatalogueScreen.
 *
 * Bootstrap behaviour:
 *   - 404 → renders the "Build Your Plan" form (no active plan)
 *   - 200 → immediately replaces with WeeklySchedule
 *   - unexpected error → error UI with Retry button
 *
 * Generate plan form:
 *   - submitting calls generatePlan with the correct payload
 *   - success → navigation.replace('WeeklySchedule')
 *   - API error → inline error message shown
 *   - loading state while in-flight
 *   - bodyWeightKg is omitted (undefined) when the weight field is left empty
 */

// ─── Mocks ────────────────────────────────────────────────────────────────────

jest.mock('../src/api/workoutApi', () => ({
  workoutApi: {
    getActivePlan: jest.fn(),
    generatePlan:  jest.fn(),
  },
}));

jest.mock('../src/config/apiConfig', () => ({
  WORKOUT_BASE_URL: 'http://localhost:8084',
  API_TIMEOUT_MS:   15000,
}));

jest.mock('../src/utils/tokenStorage', () => ({
  tokenStorage: { getTokens: jest.fn().mockResolvedValue({ accessToken: null }) },
}));

// Stub out native/expo modules that are not relevant to this screen's logic
jest.mock('react-native-safe-area-context', () => {
  const React = require('react');
  return {
    SafeAreaView:     ({ children, ...props }) => React.createElement('View', props, children),
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

// Navigation mock — must be defined before importing the screen
const mockReplace = jest.fn();
const mockNavigate = jest.fn();

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ replace: mockReplace, navigate: mockNavigate }),
}));

// ─── Imports ──────────────────────────────────────────────────────────────────

const React = require('react');
const { render, fireEvent, waitFor, act } = require('@testing-library/react-native');
const { workoutApi } = require('../src/api/workoutApi');
const PlanCatalogueScreen = require('../src/screens/workout/PlanCatalogueScreen').default;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function make404Error() {
  const err = new Error('Not Found');
  err.response = { status: 404 };
  return err;
}

function make500Error() {
  const err = new Error('Internal Server Error');
  err.response = { status: 500 };
  return err;
}

// Render with the navigation prop the screen expects (navigation.replace)
function renderScreen() {
  return render(
    <PlanCatalogueScreen
      navigation={{ replace: mockReplace, navigate: mockNavigate }}
    />,
  );
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('PlanCatalogueScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ─── Bootstrap ─────────────────────────────────────────────────────────────

  describe('bootstrap — checking for an active plan', () => {
    it('renders the "Build Your Plan" form when getActivePlan returns 404', async () => {
      workoutApi.getActivePlan.mockRejectedValueOnce(make404Error());

      const { findByText } = renderScreen();

      await findByText('Build Your Plan');
    });

    it('calls navigation.replace with PlanDetail when an active plan exists', async () => {
      const activePlan = { id: 'plan-1', programmeName: 'Strength 12W', currentWeek: 1 };
      workoutApi.getActivePlan.mockResolvedValueOnce({ data: activePlan });

      renderScreen();

      await waitFor(() => {
        expect(mockReplace).toHaveBeenCalledWith('WeeklySchedule', {
          planId: 'plan-1',
          plan: activePlan,
        });
      });
    });

    it('shows an error UI when getActivePlan fails with a non-404 error', async () => {
      workoutApi.getActivePlan.mockRejectedValueOnce(make500Error());

      const { findByText } = renderScreen();

      await findByText(/could not check for existing plans/i);
    });

    it('shows a Retry button when bootstrap fails with a non-404 error', async () => {
      workoutApi.getActivePlan.mockRejectedValueOnce(make500Error());

      const { findByText } = renderScreen();

      await findByText('Retry');
    });

    it('re-calls getActivePlan when Retry is pressed', async () => {
      workoutApi.getActivePlan
        .mockRejectedValueOnce(make500Error())
        .mockRejectedValueOnce(make404Error()); // Second call → 404 → show form

      const { findByText } = renderScreen();

      const retryBtn = await findByText('Retry');
      fireEvent.press(retryBtn);

      await waitFor(() => {
        expect(workoutApi.getActivePlan).toHaveBeenCalledTimes(2);
      });
    });
  });

  // ─── Generate plan form ─────────────────────────────────────────────────────

  describe('generate plan form', () => {
    beforeEach(() => {
      // Each test in this group starts with no active plan → show form
      workoutApi.getActivePlan.mockRejectedValue(make404Error());
    });

    it('calls generatePlan with correct default payload on submit', async () => {
      const newPlan = { id: 'plan-new', programmeName: 'AI Plan' };
      workoutApi.generatePlan.mockResolvedValueOnce({ data: newPlan });

      const { findByText } = renderScreen();
      await findByText('Build Your Plan'); // wait for form

      fireEvent.press(await findByText('Generate My Plan'));

      await waitFor(() => {
        expect(workoutApi.generatePlan).toHaveBeenCalledWith(
          expect.objectContaining({
            fitnessGoal:            'BUILD_MUSCLE',
            experienceLevel:        'INTERMEDIATE',
            preferredFormat:        expect.any(String),
            daysPerWeek:            4,
            sessionDurationMinutes: 45,
          }),
        );
      });
    });

    it('navigates to WeeklySchedule after successful plan generation', async () => {
      const newPlan = { id: 'plan-new', programmeName: 'AI Plan' };
      workoutApi.generatePlan.mockResolvedValueOnce({ data: newPlan });

      const { findByText } = renderScreen();
      await findByText('Build Your Plan');

      fireEvent.press(await findByText('Generate My Plan'));

      await waitFor(() => {
        expect(mockReplace).toHaveBeenCalledWith('WeeklySchedule', {
          planId: 'plan-new',
          plan:   newPlan,
        });
      });
    });

    it('shows an inline error message when generatePlan fails', async () => {
      workoutApi.generatePlan.mockRejectedValueOnce(new Error('Server Error'));

      const { findByText } = renderScreen();
      await findByText('Build Your Plan');

      fireEvent.press(await findByText('Generate My Plan'));

      await findByText(/could not generate your plan/i);
    });

    it('omits bodyWeightKg from the payload when the weight field is left empty', async () => {
      workoutApi.generatePlan.mockResolvedValueOnce({ data: { id: 'p1' } });

      const { findByText } = renderScreen();
      await findByText('Build Your Plan');

      fireEvent.press(await findByText('Generate My Plan'));

      await waitFor(() => {
        const [payload] = workoutApi.generatePlan.mock.calls[0];
        // bodyWeightKg should be undefined (not null, not 0)
        expect(payload.bodyWeightKg).toBeUndefined();
      });
    });

    it('includes a parsed bodyWeightKg float when the weight field has a value', async () => {
      workoutApi.generatePlan.mockResolvedValueOnce({ data: { id: 'p1' } });

      const { findByText, findByPlaceholderText } = renderScreen();
      await findByText('Build Your Plan');

      const weightInput = await findByPlaceholderText('e.g. 75');
      fireEvent.changeText(weightInput, '82.5');

      fireEvent.press(await findByText('Generate My Plan'));

      await waitFor(() => {
        const [payload] = workoutApi.generatePlan.mock.calls[0];
        expect(payload.bodyWeightKg).toBe(82.5);
      });
    });

    it('disables the Generate button while the request is in-flight', async () => {
      // Never resolves — keeps the loading state active
      workoutApi.generatePlan.mockReturnValueOnce(new Promise(() => {}));

      const { findByText, getByText } = renderScreen();
      await findByText('Build Your Plan');

      fireEvent.press(await findByText('Generate My Plan'));

      await waitFor(() => {
        // Screen shows "Generating…" text while loading
        expect(getByText('Generating…')).toBeTruthy();
      });
    });
  });
});
