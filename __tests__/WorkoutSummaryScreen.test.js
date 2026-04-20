/**
 * Tests for WorkoutSummaryScreen.
 *
 * Covers:
 *   - Duration display: actualDurationSeconds → "N min"
 *   - Fallback: uses durationSeconds when actualDurationSeconds is absent
 *   - No duration fields → duration stat not rendered
 *   - Feedback pill: TOO_EASY / JUST_RIGHT / TOO_HARD → correct labels
 *   - No feedback (null) → feedback section not shown
 *   - CTA: pressing "Back to Schedule" calls navigation.popToTop()
 */

// ─── Mocks ────────────────────────────────────────────────────────────────────

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

const mockPopToTop = jest.fn();

// ─── Imports ──────────────────────────────────────────────────────────────────

const React = require('react');
const { render, fireEvent } = require('@testing-library/react-native');
const WorkoutSummaryScreen = require('../src/screens/workout/WorkoutSummaryScreen').default;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function renderScreen(session, feedback = null) {
  return render(
    <WorkoutSummaryScreen
      navigation={{ popToTop: mockPopToTop }}
      route={{ params: { session, feedback } }}
    />,
  );
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('WorkoutSummaryScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ─── Duration display ───────────────────────────────────────────────────────

  describe('duration display', () => {
    it('converts actualDurationSeconds to minutes and renders it', () => {
      const session = {
        sessionId:             'sess-1',
        status:                'COMPLETED',
        actualDurationSeconds: 2700, // 45 minutes
      };

      const { getByText } = renderScreen(session);

      // The StatCard renders value="45" and label="Minutes"
      expect(getByText('45')).toBeTruthy();
      expect(getByText('Minutes')).toBeTruthy();
    });

    it('rounds duration to the nearest minute', () => {
      const session = {
        sessionId:             'sess-1',
        status:                'COMPLETED',
        actualDurationSeconds: 2740, // 45.67 min → rounds to 46
      };

      const { getByText } = renderScreen(session);

      expect(getByText('46')).toBeTruthy();
    });

    it('falls back to durationSeconds when actualDurationSeconds is absent', () => {
      const session = {
        sessionId:       'sess-1',
        status:          'COMPLETED',
        durationSeconds: 1800, // 30 minutes — fallback field
      };

      const { getByText } = renderScreen(session);

      expect(getByText('30')).toBeTruthy();
      expect(getByText('Minutes')).toBeTruthy();
    });

    it('does not render the duration stat card when no duration fields are present', () => {
      const session = {
        sessionId: 'sess-1',
        status:    'COMPLETED',
        // neither actualDurationSeconds nor durationSeconds
      };

      const { queryByText } = renderScreen(session);

      expect(queryByText('Minutes')).toBeNull();
    });
  });

  // ─── Feedback pill ──────────────────────────────────────────────────────────

  describe('feedback pill', () => {
    it('shows "Too Easy" label when feedback is TOO_EASY', () => {
      const session = { sessionId: 'sess-1', status: 'COMPLETED' };

      const { getByText } = renderScreen(session, 'TOO_EASY');

      expect(getByText('Too Easy')).toBeTruthy();
    });

    it('shows "Just Right" label when feedback is JUST_RIGHT', () => {
      const session = { sessionId: 'sess-1', status: 'COMPLETED' };

      const { getByText } = renderScreen(session, 'JUST_RIGHT');

      expect(getByText('Just Right')).toBeTruthy();
    });

    it('shows "Too Hard" label when feedback is TOO_HARD', () => {
      const session = { sessionId: 'sess-1', status: 'COMPLETED' };

      const { getByText } = renderScreen(session, 'TOO_HARD');

      expect(getByText('Too Hard')).toBeTruthy();
    });

    it('also shows the "Session Feedback" section heading when feedback is present', () => {
      const session = { sessionId: 'sess-1', status: 'COMPLETED' };

      const { getByText } = renderScreen(session, 'JUST_RIGHT');

      expect(getByText('Session Feedback')).toBeTruthy();
    });

    it('does not render the feedback card when feedback is null', () => {
      const session = { sessionId: 'sess-1', status: 'COMPLETED' };

      const { queryByText } = renderScreen(session, null);

      expect(queryByText('Session Feedback')).toBeNull();
      expect(queryByText('Too Easy')).toBeNull();
      expect(queryByText('Just Right')).toBeNull();
      expect(queryByText('Too Hard')).toBeNull();
    });

    it('does not render the feedback card when feedback is undefined', () => {
      const session = { sessionId: 'sess-1', status: 'COMPLETED' };

      // Pass no feedback argument (undefined)
      const { queryByText } = render(
        <WorkoutSummaryScreen
          navigation={{ popToTop: mockPopToTop }}
          route={{ params: { session } }}
        />,
      );

      expect(queryByText('Session Feedback')).toBeNull();
    });

    it('does not crash for an unknown feedback value', () => {
      const session = { sessionId: 'sess-1', status: 'COMPLETED' };
      const { queryByText } = renderScreen(session, 'UNKNOWN_VALUE');
      expect(queryByText('Session Feedback')).toBeNull();
    });
  });

  // ─── Success messaging ──────────────────────────────────────────────────────

  describe('success messaging', () => {
    it('renders the "Workout Complete!" title', () => {
      const session = { sessionId: 'sess-1', status: 'COMPLETED' };

      const { getByText } = renderScreen(session);

      expect(getByText('Workout Complete!')).toBeTruthy();
    });

    it('renders the stats grid', () => {
      const session = { sessionId: 'sess-1', status: 'COMPLETED' };
      const { getByText } = renderScreen(session);
      // Stats grid is present — sets count defaults to 0 when no sessionData
      expect(getByText('Sets')).toBeTruthy();
    });
  });

  // ─── CTA button ─────────────────────────────────────────────────────────────

  describe('CTA — Back to Schedule', () => {
    it('calls navigation.popToTop() when the CTA button is pressed', () => {
      const session = { sessionId: 'sess-1', status: 'COMPLETED' };

      const { getByText } = renderScreen(session);

      fireEvent.press(getByText('Back to Schedule'));

      expect(mockPopToTop).toHaveBeenCalledTimes(1);
    });
  });
});
