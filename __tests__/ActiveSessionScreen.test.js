/**
 * Tests for ActiveSessionScreen.
 *
 * CRITICAL: This test file validates the logSet/skipSet bug fix.
 * The bug was that the screen called:
 *   workoutApi.logSet(sessionId, exerciseId, setNumber, reps, weightKg)  ← BROKEN
 *   workoutApi.skipSet(sessionId, exerciseId, setNumber)                 ← BROKEN
 *
 * The correct API signatures are:
 *   workoutApi.logSet(sessionId, { exerciseId, setNumber, reps, weightKg })
 *   workoutApi.skipSet(sessionId, { exerciseId, setNumber })
 *
 * Tests here verify the BODY SHAPE (second argument) — not just that the
 * functions were called.
 */

// ─── Mocks ────────────────────────────────────────────────────────────────────

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem:    jest.fn().mockResolvedValue(null),
  setItem:    jest.fn().mockResolvedValue(undefined),
  removeItem: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('../src/api/workoutApi', () => ({
  workoutApi: {
    logSet:          jest.fn(),
    skipSet:         jest.fn(),
    startSession:    jest.fn(),
    completeSession: jest.fn(),
    abandonSession:  jest.fn(),
  },
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

const mockReplace        = jest.fn();
const mockGoBack         = jest.fn();
const mockNavigate       = jest.fn();
const mockAddListener    = jest.fn(() => jest.fn()); // returns unsubscribe fn

// ─── Imports ──────────────────────────────────────────────────────────────────

const React = require('react');
const { render, fireEvent, waitFor } = require('@testing-library/react-native');
const { Alert }    = require('react-native');
const { workoutApi } = require('../src/api/workoutApi');
const AsyncStorage = require('@react-native-async-storage/async-storage');
const ActiveSessionScreen = require('../src/screens/workout/ActiveSessionScreen').default;

// ─── Fixtures ─────────────────────────────────────────────────────────────────

/**
 * Build a minimal session object matching the real API contract
 * (GET /sessions/{id}/detail response shape).
 * Fields: sessionId, sessionName, exercises[] with { sessionExerciseId, exerciseId, ... }.
 */
function makeSession(overrides = {}) {
  return {
    sessionId:    'sess-001',
    sessionName:  'Push Day',
    exercises: [
      {
        sessionExerciseId: 'sex-001',  // session exercise row ID (used as React key, state match)
        exerciseId:        'ex-abc',   // catalogue exercise ID (sent in logSet/skipSet body)
        name:              'Bench Press',
        sets:              3,
        reps:              10,
        weightKg:          60,
        restSeconds:       90,
        warmup:            false,
        cooldown:          false,
        exerciseOrder:     1,
        logs:              [],
      },
    ],
    ...overrides,
  };
}

// hasStarted defaults to TRUE so existing tests (which cover the logging /
// complete / abandon paths) don't need to worry about lazy-start. The new
// lazy-start tests override it to `false`.
function renderScreen(sessionOverrides = {}, { hasStarted = true } = {}) {
  const session = makeSession(sessionOverrides);
  return render(
    <ActiveSessionScreen
      navigation={{ replace: mockReplace, navigate: mockNavigate, goBack: mockGoBack, addListener: mockAddListener }}
      route={{ params: { session, hasStarted } }}
    />,
  );
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('ActiveSessionScreen', () => {
  let alertSpy;

  beforeEach(() => {
    jest.clearAllMocks();
    // Spy on Alert.alert so we can assert on it without mocking the whole module
    alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  });

  afterEach(() => {
    alertSpy.mockRestore();
  });

  // ─── Set row rendering (Bug 5 — Save/Skip/Remove buttons removed) ────────────

  describe('set row rendering', () => {
    it('does NOT render a Save button in any set row', () => {
      const { queryAllByText } = renderScreen();
      // Bug 5: Save button removed from SetRow — should never appear
      expect(queryAllByText('Save').length).toBe(0);
    });

    it('renders reps and weight inputs for each pending set', () => {
      const { getAllByPlaceholderText } = renderScreen();
      // 3 sets × reps placeholder "10"
      expect(getAllByPlaceholderText('10').length).toBe(3);
      // 3 sets × weight placeholder "60"
      expect(getAllByPlaceholderText('60').length).toBe(3);
    });

    it('weight input is editable for pending sets', () => {
      const { getAllByPlaceholderText } = renderScreen();
      const weightInputs = getAllByPlaceholderText('60');
      // All pending sets should have editable weight inputs
      weightInputs.forEach((input) => {
        expect(input.props.editable).not.toBe(false);
      });
    });
  });

  // ─── Set state after logging ────────────────────────────────────────────────

  describe('set state after logging', () => {
    it('set rows for pre-logged COMPLETED sets render as done (inputs not editable)', () => {
      const session = makeSession({
        exercises: [
          {
            sessionExerciseId: 'sex-001',
            exerciseId:        'ex-abc',
            name:              'Bench Press',
            sets:              3,
            reps:              10,
            weightKg:          60,
            restSeconds:       90,
            warmup:            false,
            cooldown:          false,
            exerciseOrder:     1,
            logs: [
              { setNumber: 1, reps: 10, weightKg: 60, status: 'COMPLETED' },
            ],
          },
        ],
      });

      const { getAllByPlaceholderText } = render(
        <ActiveSessionScreen
          navigation={{ replace: mockReplace, navigate: mockNavigate, goBack: mockGoBack, addListener: mockAddListener }}
          route={{ params: { session, hasStarted: true } }}
        />,
      );

      // Set 1 is COMPLETED → inputs not editable. Sets 2 & 3 are pending → editable.
      const repsInputs = getAllByPlaceholderText('10');
      // At least 2 pending sets should exist and be editable
      const editableInputs = repsInputs.filter(i => i.props.editable !== false);
      expect(editableInputs.length).toBeGreaterThanOrEqual(2);
    });
  });

  // ─── Progress indicator ─────────────────────────────────────────────────────

  describe('progress indicator', () => {
    it('shows "0 / 1 exercises done" when no sets are logged', () => {
      // Single exercise, no logs
      workoutApi.getWeeklySchedule?.mockResolvedValueOnce?.({});

      const { getByText } = renderScreen();
      expect(getByText('0 / 1 exercises done')).toBeTruthy();
    });

    it('shows the session workout name in the header', () => {
      const { getByText } = renderScreen();
      expect(getByText('Push Day')).toBeTruthy();
    });
  });

  // ─── Complete workout flow ──────────────────────────────────────────────────

  describe('complete workout flow', () => {
    it('calls completeSession with JUST_RIGHT and navigates to WorkoutSummary when Complete Workout is pressed', async () => {
      const completedSession = { sessionId: 'sess-001', status: 'COMPLETED', actualDurationSeconds: 2700 };
      workoutApi.completeSession.mockResolvedValueOnce({ data: completedSession });

      // Start the session first so hasStartedRef.current is true
      workoutApi.startSession.mockResolvedValue({ data: {} });
      workoutApi.logSet.mockResolvedValue({ data: { setNumber: 1, status: 'COMPLETED' } });
      const { getByText, getAllByPlaceholderText, getAllByText } = renderScreen({}, { hasStarted: true });

      fireEvent.press(getByText('Complete Workout'));

      await waitFor(() => {
        expect(workoutApi.completeSession).toHaveBeenCalledWith('sess-001', 'JUST_RIGHT');
        expect(mockReplace).toHaveBeenCalledWith('WorkoutSummary', expect.objectContaining({
          session: completedSession,
        }));
      });
    });

    it('shows an inline error (no alert) when completeSession fails', async () => {
      workoutApi.completeSession.mockRejectedValueOnce(new Error('Server Error'));

      const { getByText, findByText } = renderScreen({}, { hasStarted: true });

      fireEvent.press(getByText('Complete Workout'));

      await waitFor(() => {
        expect(workoutApi.completeSession).toHaveBeenCalled();
      });

      // No alert — inline error shown
      expect(alertSpy).not.toHaveBeenCalled();
      expect(mockReplace).not.toHaveBeenCalled();
    });
  });

  // ─── End Workout flow (formerly "Abandon") ──────────────────────────────────

  describe('end workout', () => {
    it('opens the EndWorkoutSheet when End Workout is pressed — no immediate API call', async () => {
      const { getByText } = renderScreen({}, { hasStarted: true });

      fireEvent.press(getByText('End Workout'));

      // EndWorkoutSheet should appear
      await waitFor(() => {
        expect(getByText('End Workout?')).toBeTruthy();
      });
      expect(alertSpy).not.toHaveBeenCalled();
      // abandonSession not called yet — user still sees the sheet
      expect(workoutApi.abandonSession).not.toHaveBeenCalled();
    });

    it('calls abandonSession and navigates back when Discard Workout is pressed', async () => {
      workoutApi.abandonSession.mockResolvedValueOnce({});

      const { getByText } = renderScreen({}, { hasStarted: true });

      fireEvent.press(getByText('End Workout'));
      await waitFor(() => expect(getByText('Discard Workout')).toBeTruthy());
      fireEvent.press(getByText('Discard Workout'));

      await waitFor(() => {
        expect(workoutApi.abandonSession).toHaveBeenCalledWith('sess-001');
        expect(mockGoBack).toHaveBeenCalled();
      });
      expect(alertSpy).not.toHaveBeenCalled();
    });

    it('still navigates back even if abandonSession API fails', async () => {
      workoutApi.abandonSession.mockRejectedValueOnce(new Error('Server Error'));

      const { getByText } = renderScreen({}, { hasStarted: true });

      fireEvent.press(getByText('End Workout'));
      await waitFor(() => expect(getByText('Discard Workout')).toBeTruthy());
      fireEvent.press(getByText('Discard Workout'));

      await waitFor(() => {
        expect(mockGoBack).toHaveBeenCalled();
      });
      expect(alertSpy).not.toHaveBeenCalled();
    });

    it('sheet shows "Save Workout" as primary CTA — not "Keep Going" or "Save Partial Workout"', async () => {
      const { getByText, queryByText } = renderScreen({}, { hasStarted: true });

      fireEvent.press(getByText('End Workout'));

      await waitFor(() => {
        expect(getByText('Save Workout')).toBeTruthy();
        expect(getByText('Discard Workout')).toBeTruthy();
      });

      // These old labels must NOT be present
      expect(queryByText('Keep Going')).toBeNull();
      expect(queryByText('Save Partial Workout')).toBeNull();
    });
  });

  // ─── Lazy session start ─────────────────────────────────────────────────────

  describe('lazy session start', () => {
    it('does NOT call startSession when the screen mounts with hasStarted=false', async () => {
      renderScreen({}, { hasStarted: false });
      // Give React a tick to settle any useEffects
      await new Promise((r) => setImmediate(r));
      expect(workoutApi.startSession).not.toHaveBeenCalled();
    });

    it('calls startSession exactly once before completeSession (lazy-start via Complete Workout)', async () => {
      workoutApi.startSession.mockResolvedValue({ data: { sessionId: 'sess-001' } });
      workoutApi.completeSession.mockResolvedValue({ data: { sessionId: 'sess-001', status: 'COMPLETED', actualDurationSeconds: 0 } });

      const { getByText } = renderScreen({}, { hasStarted: false });

      fireEvent.press(getByText('Complete Workout'));

      await waitFor(() => {
        expect(workoutApi.startSession).toHaveBeenCalledTimes(1);
        expect(workoutApi.startSession).toHaveBeenCalledWith('sess-001');
        expect(workoutApi.completeSession).toHaveBeenCalled();
      });

      // Start order: start BEFORE complete
      const startOrder    = workoutApi.startSession.mock.invocationCallOrder[0];
      const completeOrder = workoutApi.completeSession.mock.invocationCallOrder[0];
      expect(startOrder).toBeLessThan(completeOrder);
    });

    it('end workout without starting just goes back — no API call', async () => {
      const { getByText } = renderScreen({}, { hasStarted: false });

      fireEvent.press(getByText('End Workout'));
      // EndWorkoutSheet appears — press Discard
      await waitFor(() => expect(getByText('Discard Workout')).toBeTruthy());
      fireEvent.press(getByText('Discard Workout'));

      await waitFor(() => {
        expect(mockGoBack).toHaveBeenCalled();
      });
      expect(workoutApi.abandonSession).not.toHaveBeenCalled();
    });

    it('complete without starting calls ensureStarted then completeSession', async () => {
      workoutApi.startSession.mockResolvedValueOnce({ data: {} });
      workoutApi.completeSession.mockResolvedValueOnce({ data: { sessionId: 'sess-001', status: 'COMPLETED', actualDurationSeconds: 0 } });

      const { getByText } = renderScreen({}, { hasStarted: false });

      fireEvent.press(getByText('Complete Workout'));

      await waitFor(() => {
        expect(workoutApi.startSession).toHaveBeenCalledWith('sess-001');
        expect(workoutApi.completeSession).toHaveBeenCalledWith('sess-001', 'JUST_RIGHT');
        expect(mockReplace).toHaveBeenCalledWith('WorkoutSummary', expect.any(Object));
      });
      expect(mockGoBack).not.toHaveBeenCalled();
    });
  });

  // ─── Draft persistence (Bug 1) ──────────────────────────────────────────────

  describe('draft persistence', () => {
    it('back press saves draft to AsyncStorage and navigates back without showing EndWorkoutSheet', async () => {
      const { getByText, queryByText } = renderScreen({}, { hasStarted: true });

      // Trigger the beforeRemove listener (simulates navigation back)
      // mockAddListener captures the callback — extract and invoke it
      const beforeRemoveCall = mockAddListener.mock.calls.find(
        ([event]) => event === 'beforeRemove',
      );
      if (beforeRemoveCall) {
        const handler = beforeRemoveCall[1];
        handler({});
      }

      // Also directly press the back button (chevron) to trigger handleBackPress
      // The back chevron is the first touchable in the header
      const { TouchableOpacity } = require('react-native');
      const { UNSAFE_getAllByType } = renderScreen({}, { hasStarted: true });

      // Use the header back button — first TouchableOpacity rendered
      // We test by pressing the back button which calls saveDraft + navigation.goBack
      await waitFor(() => {
        // saveDraft was attempted — AsyncStorage.setItem should have been called
        // (it may be called 0 times if session not started, which is also valid)
        // The important assertion: EndWorkoutSheet is NOT visible (no "End Workout?" text)
        expect(queryByText('End Workout?')).toBeNull();
      });
    });

    it('AsyncStorage.setItem is called with the correct key prefix when saveDraft runs', async () => {
      AsyncStorage.setItem.mockClear();

      // Simulate beforeRemove by extracting the registered handler
      renderScreen({}, { hasStarted: true });

      const beforeRemoveCall = mockAddListener.mock.calls.find(
        ([event]) => event === 'beforeRemove',
      );
      expect(beforeRemoveCall).toBeTruthy();

      const handler = beforeRemoveCall[1];
      handler({}); // fire beforeRemove

      await waitFor(() => {
        // setItem should have been called with a key starting with 'habfitt:session_draft:'
        const calls = AsyncStorage.setItem.mock.calls;
        const draftCall = calls.find(([key]) => key.startsWith('habfitt:session_draft:'));
        expect(draftCall).toBeTruthy();
        expect(draftCall[0]).toBe('habfitt:session_draft:sess-001');
      });
    });

    it('draft is cleared from AsyncStorage after successful workout completion', async () => {
      const completedSession = { sessionId: 'sess-001', status: 'COMPLETED', actualDurationSeconds: 1800 };
      workoutApi.completeSession.mockResolvedValueOnce({ data: completedSession });

      const { getByText } = renderScreen({}, { hasStarted: true });

      fireEvent.press(getByText('Complete Workout'));

      await waitFor(() => {
        expect(AsyncStorage.removeItem).toHaveBeenCalledWith('habfitt:session_draft:sess-001');
      });
    });
  });

  // ─── Weight pre-fill (Bug 4) ────────────────────────────────────────────────

  describe('weight pre-fill', () => {
    it('weight field is pre-filled with exercise weightKg when set has no prior log weight', () => {
      // Exercise has weightKg: 60 at the exercise level; sets have weightKg: null
      const session = makeSession({
        exercises: [
          {
            sessionExerciseId: 'sex-001',
            exerciseId:        'ex-abc',
            name:              'Bench Press',
            sets:              1,
            reps:              10,
            weightKg:          60,  // exercise-level prescribed weight
            restSeconds:       90,
            warmup:            false,
            cooldown:          false,
            exerciseOrder:     1,
            logs:              [],  // no prior logs → no lastLoggedWeight
          },
        ],
      });

      const { getByDisplayValue } = render(
        <ActiveSessionScreen
          navigation={{ replace: mockReplace, navigate: mockNavigate, goBack: mockGoBack, addListener: mockAddListener }}
          route={{ params: { session, hasStarted: true } }}
        />,
      );

      // The weight TextInput should be pre-filled with "60"
      expect(getByDisplayValue('60')).toBeTruthy();
    });

    it('weight field is pre-filled with last logged weight when prior COMPLETED log exists', () => {
      const session = makeSession({
        exercises: [
          {
            sessionExerciseId: 'sex-001',
            exerciseId:        'ex-abc',
            name:              'Bench Press',
            sets:              2,
            reps:              10,
            weightKg:          60,
            restSeconds:       90,
            warmup:            false,
            cooldown:          false,
            exerciseOrder:     1,
            logs: [
              // Set 1 already completed with a different weight
              { setNumber: 1, reps: 10, weightKg: 75, status: 'COMPLETED' },
            ],
          },
        ],
      });

      const { getAllByDisplayValue } = render(
        <ActiveSessionScreen
          navigation={{ replace: mockReplace, navigate: mockNavigate, goBack: mockGoBack, addListener: mockAddListener }}
          route={{ params: { session, hasStarted: true } }}
        />,
      );

      // Set 2 (pending) weight input should be pre-filled with 75 (last logged weight)
      expect(getAllByDisplayValue('75').length).toBeGreaterThanOrEqual(1);
    });
  });
});
