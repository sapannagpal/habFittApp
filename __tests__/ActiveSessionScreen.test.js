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

const mockReplace  = jest.fn();
const mockGoBack   = jest.fn();
const mockNavigate = jest.fn();

// ─── Imports ──────────────────────────────────────────────────────────────────

const React = require('react');
const { render, fireEvent, waitFor } = require('@testing-library/react-native');
const { Alert }    = require('react-native');
const { workoutApi } = require('../src/api/workoutApi');
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
      navigation={{ replace: mockReplace, navigate: mockNavigate, goBack: mockGoBack }}
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

  // ─── logSet body shape — BUG FIX VALIDATION ────────────────────────────────

  describe('logSet — body shape validation (bug fix)', () => {
    it('calls logSet with (sessionId, {exerciseId, setNumber, reps, weightKg}) — object body, not positional args', async () => {
      workoutApi.logSet.mockResolvedValueOnce({
        data: { setNumber: 1, reps: 10, weightKg: 60, status: 'COMPLETED' },
      });

      const { getAllByPlaceholderText, getAllByText } = renderScreen();

      // Fill in reps field (placeholder = prescribed reps "10")
      const repsInputs = getAllByPlaceholderText('10');
      fireEvent.changeText(repsInputs[0], '10');

      // Fill in weight field (placeholder = prescribed weight "60")
      const weightInputs = getAllByPlaceholderText('60');
      fireEvent.changeText(weightInputs[0], '55');

      // Tap "Log" button
      const logButtons = getAllByText('Log');
      fireEvent.press(logButtons[0]);

      await waitFor(() => {
        expect(workoutApi.logSet).toHaveBeenCalledTimes(1);

        const [firstArg, secondArg] = workoutApi.logSet.mock.calls[0];

        // First arg: sessionId string
        expect(firstArg).toBe('sess-001');

        // Second arg MUST be an object — not a separate positional argument
        expect(typeof secondArg).toBe('object');
        expect(secondArg).not.toBeNull();

        // Body fields must use the correct names
        expect(secondArg).toEqual({
          exerciseId: 'ex-abc',   // catalogue exercise reference ID
          setNumber:  1,
          reps:       10,
          weightKg:   55,
        });

        // Verify there is NO third positional argument (the old broken signature had 5 args)
        expect(workoutApi.logSet.mock.calls[0].length).toBe(2);
      });
    });

    it('sends weightKg: null when the weight field is left empty', async () => {
      workoutApi.logSet.mockResolvedValueOnce({
        data: { setNumber: 1, reps: 8, weightKg: null, status: 'COMPLETED' },
      });

      const { getAllByPlaceholderText, getAllByText } = renderScreen();

      // Fill reps but leave weight blank
      const repsInputs = getAllByPlaceholderText('10');
      fireEvent.changeText(repsInputs[0], '8');
      // Do NOT fill the weight input

      fireEvent.press(getAllByText('Log')[0]);

      await waitFor(() => {
        const [, body] = workoutApi.logSet.mock.calls[0];
        expect(body.weightKg).toBeNull();
      });
    });

    it('sends reps as a parsed integer — not a string', async () => {
      workoutApi.logSet.mockResolvedValueOnce({
        data: { setNumber: 1, reps: 12, weightKg: null, status: 'COMPLETED' },
      });

      const { getAllByPlaceholderText, getAllByText } = renderScreen();

      const repsInputs = getAllByPlaceholderText('10');
      fireEvent.changeText(repsInputs[0], '12'); // string from TextInput

      fireEvent.press(getAllByText('Log')[0]);

      await waitFor(() => {
        const [, body] = workoutApi.logSet.mock.calls[0];
        expect(typeof body.reps).toBe('number');
        expect(body.reps).toBe(12);
      });
    });
  });

  // ─── skipSet body shape — BUG FIX VALIDATION ──────────────────────────────

  describe('skipSet — body shape validation (bug fix)', () => {
    it('calls skipSet with (sessionId, {exerciseId, setNumber}) — object body, not positional args', async () => {
      workoutApi.skipSet.mockResolvedValueOnce({
        data: { setNumber: 1, status: 'SKIPPED' },
      });

      // Render a session with exactly 1 set so the button count is predictable.
      const singleSetSession = makeSession({
        exercises: [
          {
            sessionExerciseId: 'sex-001',
            exerciseId:        'ex-abc',
            name:              'Bench Press',
            sets:              1,   // ← only 1 set
            reps:              10,
            weightKg:          60,
            restSeconds:       90,
            warmup:            false,
            cooldown:          false,
            exerciseOrder:     1,
            logs:              [],
          },
        ],
      });

      const { UNSAFE_getAllByType, getAllByText } = render(
        <ActiveSessionScreen
          navigation={{ replace: mockReplace, navigate: mockNavigate, goBack: mockGoBack }}
          route={{ params: { session: singleSetSession, hasStarted: true } }}
        />,
      );

      // With 1 pending set the rendered TouchableOpacity order is:
      //   [0] Abandon button (top-right header)
      //   [1] Log button  (inside SetRow actions)
      //   [2] Skip button (inside SetRow actions — no text child, contains null Ionicons)
      //   [3] Complete Workout CTA (bottom)
      // We find the Skip button as the one immediately after the Log button that has no text.
      const { TouchableOpacity } = require('react-native');
      const allTouchables = UNSAFE_getAllByType(TouchableOpacity);

      // Find Log button index — the first one with a Text child reading "Log"
      const logBtnIndex = allTouchables.findIndex((btn) => {
        const children = btn.props.children;
        // logBtn has a single Text child with "Log"
        if (!children) return false;
        const arr = Array.isArray(children) ? children : [children];
        return arr.some(
          (c) => c && c.props && (c.props.children === 'Log' || c.props.children?.[0] === 'Log'),
        );
      });

      // Skip button is immediately after the Log button
      expect(logBtnIndex).toBeGreaterThanOrEqual(0);
      const skipButton = allTouchables[logBtnIndex + 1];
      expect(skipButton).toBeTruthy();

      fireEvent.press(skipButton);

      await waitFor(() => {
        expect(workoutApi.skipSet).toHaveBeenCalledTimes(1);

        const [firstArg, secondArg] = workoutApi.skipSet.mock.calls[0];

        // First arg: sessionId string
        expect(firstArg).toBe('sess-001');

        // Second arg MUST be an object — not a separate positional argument
        expect(typeof secondArg).toBe('object');
        expect(secondArg).not.toBeNull();

        expect(secondArg).toEqual({
          exerciseId: 'ex-abc',
          setNumber:  1,
        });

        // Must NOT have a third positional arg (the old broken call had 3 positional args)
        expect(workoutApi.skipSet.mock.calls[0].length).toBe(2);
      });
    });
  });

  // ─── Set state after logging ────────────────────────────────────────────────

  describe('set state after logging', () => {
    it('marks the set row as done after a successful log', async () => {
      const loggedSet = { setNumber: 1, reps: 10, weightKg: 60, status: 'COMPLETED' };
      workoutApi.logSet.mockResolvedValueOnce({ data: loggedSet });

      const { getAllByPlaceholderText, getAllByText, queryAllByText } = renderScreen();

      const repsInputs = getAllByPlaceholderText('10');
      fireEvent.changeText(repsInputs[0], '10');

      fireEvent.press(getAllByText('Log')[0]);

      await waitFor(() => {
        // After logging, the "Log" button for set 1 should disappear (isDone = true)
        // The number of Log buttons should decrease from 3 to 2
        const remainingLogButtons = queryAllByText('Log');
        expect(remainingLogButtons.length).toBeLessThan(3);
      });
    });

    it('does NOT mark the set done when logSet fails (silent fail — no alert)', async () => {
      workoutApi.logSet.mockRejectedValueOnce(new Error('Server Error'));

      const { getAllByPlaceholderText, getAllByText } = renderScreen();

      const repsInputs = getAllByPlaceholderText('10');
      fireEvent.changeText(repsInputs[0], '10');

      fireEvent.press(getAllByText('Log')[0]);

      await waitFor(() => {
        expect(workoutApi.logSet).toHaveBeenCalled();
      });

      // All 3 Log buttons should still be present (set was not marked done)
      expect(getAllByText('Log').length).toBe(3);
      // And no alert was shown — actions must execute silently on failure
      expect(alertSpy).not.toHaveBeenCalled();
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
    it('shows the feedback modal when Complete Workout is pressed', async () => {
      const { getByText, findByText } = renderScreen();

      fireEvent.press(getByText('Complete Workout'));

      // Feedback modal title should appear
      await findByText('How was that session?');
    });

    it('calls completeSession with the chosen feedback and navigates to WorkoutSummary', async () => {
      const completedSession = { sessionId: 'sess-001', status: 'COMPLETED', actualDurationSeconds: 2700 };
      workoutApi.completeSession.mockResolvedValueOnce({ data: completedSession });

      const { getAllByText, findByText } = renderScreen();

      // Open feedback modal — press the screen-level CTA (index 0)
      fireEvent.press(getAllByText('Complete Workout')[0]);

      // Wait for the modal to appear and then press the modal's confirm button (index 1)
      await findByText('How was that session?');
      fireEvent.press(getAllByText('Complete Workout')[1]);

      await waitFor(() => {
        expect(workoutApi.completeSession).toHaveBeenCalledWith('sess-001', 'JUST_RIGHT');
        expect(mockReplace).toHaveBeenCalledWith('WorkoutSummary', {
          session:  completedSession,
          feedback: 'JUST_RIGHT',
        });
      });
    });

    it('stays on the screen (no alert) when completeSession fails', async () => {
      workoutApi.completeSession.mockRejectedValueOnce(new Error('Server Error'));

      const { getAllByText, findByText } = renderScreen();

      fireEvent.press(getAllByText('Complete Workout')[0]);
      await findByText('How was that session?');
      fireEvent.press(getAllByText('Complete Workout')[1]);

      await waitFor(() => {
        expect(workoutApi.completeSession).toHaveBeenCalled();
      });

      // No alert — silent fail. User stays on ActiveSession.
      expect(alertSpy).not.toHaveBeenCalled();
      expect(mockReplace).not.toHaveBeenCalled();
    });
  });

  // ─── Abandon workout ────────────────────────────────────────────────────────

  describe('abandon workout', () => {
    it('calls abandonSession and navigates back on a single press (no confirmation alert)', async () => {
      workoutApi.abandonSession.mockResolvedValueOnce({});

      const { getByText } = renderScreen();
      fireEvent.press(getByText('Abandon'));

      await waitFor(() => {
        expect(workoutApi.abandonSession).toHaveBeenCalledWith('sess-001');
        expect(mockGoBack).toHaveBeenCalled();
      });

      expect(alertSpy).not.toHaveBeenCalled();
    });

    it('still navigates back even if abandonSession API fails', async () => {
      workoutApi.abandonSession.mockRejectedValueOnce(new Error('Server Error'));

      const { getByText } = renderScreen();
      fireEvent.press(getByText('Abandon'));

      await waitFor(() => {
        expect(mockGoBack).toHaveBeenCalled();
      });

      expect(alertSpy).not.toHaveBeenCalled();
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

    it('calls startSession exactly once before the first logSet (lazy-start)', async () => {
      workoutApi.startSession.mockResolvedValue({ data: { sessionId: 'sess-001' } });
      workoutApi.logSet.mockResolvedValue({ data: { setNumber: 1, status: 'COMPLETED' } });

      const { getAllByPlaceholderText, getAllByText } = renderScreen({}, { hasStarted: false });

      const repsInputs = getAllByPlaceholderText('10');
      fireEvent.changeText(repsInputs[0], '10');
      fireEvent.press(getAllByText('Log')[0]);

      await waitFor(() => {
        expect(workoutApi.startSession).toHaveBeenCalledTimes(1);
        expect(workoutApi.startSession).toHaveBeenCalledWith('sess-001');
        expect(workoutApi.logSet).toHaveBeenCalled();
      });

      // Start order: start BEFORE log
      const startOrder = workoutApi.startSession.mock.invocationCallOrder[0];
      const logOrder   = workoutApi.logSet.mock.invocationCallOrder[0];
      expect(startOrder).toBeLessThan(logOrder);
    });

    it('abandon without starting just goes back — no API call', async () => {
      const { getByText } = renderScreen({}, { hasStarted: false });
      fireEvent.press(getByText('Cancel'));

      await waitFor(() => {
        expect(mockGoBack).toHaveBeenCalled();
      });
      expect(workoutApi.abandonSession).not.toHaveBeenCalled();
    });

    it('complete without starting just goes back — no API call', async () => {
      const { getAllByText, findByText } = renderScreen({}, { hasStarted: false });

      fireEvent.press(getAllByText('Complete Workout')[0]);
      await findByText('How was that session?');
      fireEvent.press(getAllByText('Complete Workout')[1]);

      await waitFor(() => {
        expect(mockGoBack).toHaveBeenCalled();
      });
      expect(workoutApi.completeSession).not.toHaveBeenCalled();
    });
  });
});
