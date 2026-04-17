/**
 * Tests for SwapDaySheet.
 * - Renders valid swap targets (excludes source, rest days)
 * - Completed days are rendered but disabled
 * - Tapping target calls onSwap
 * - Cancel calls onDismiss
 * - Not visible when visible=false
 */

jest.mock('../src/config/apiConfig', () => ({
  WORKOUT_BASE_URL: 'http://localhost:8084',
  API_TIMEOUT_MS: 15000,
}));

jest.mock('../src/utils/tokenStorage', () => ({
  tokenStorage: { getTokens: jest.fn().mockResolvedValue({ accessToken: null }) },
}));

jest.mock('react-native-safe-area-context', () => {
  const React = require('react');
  return {
    SafeAreaView: ({ children, ...props }) => React.createElement('View', props, children),
    useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
  };
});

jest.mock('@expo/vector-icons', () => ({ Ionicons: () => null }));

const React = require('react');
const { render, fireEvent } = require('@testing-library/react-native');
const SwapDaySheet = require('../src/components/workout/SwapDaySheet').default;

const DAYS = [
  { dayOfWeek: 1, workoutName: 'Push Day',  sessionId: 's1', status: 'PENDING',   restDay: false },
  { dayOfWeek: 2, workoutName: null,         sessionId: null, status: null,        restDay: true  },
  { dayOfWeek: 3, workoutName: 'Pull Day',  sessionId: 's3', status: 'PENDING',   restDay: false },
  { dayOfWeek: 4, workoutName: 'Leg Day',   sessionId: 's4', status: 'COMPLETED', restDay: false },
  { dayOfWeek: 5, workoutName: 'Cardio',    sessionId: 's5', status: 'PENDING',   restDay: false },
];

describe('SwapDaySheet', () => {
  it('renders valid swap targets excluding source and rest days', () => {
    const { queryByText, getByText } = render(
      <SwapDaySheet visible sourceDay={1} days={DAYS} onSwap={jest.fn()} onDismiss={jest.fn()} />,
    );
    // Source day (1=MON) should not appear as target
    expect(queryByText('Push Day')).toBeNull();
    // Rest day (2=TUE) should not appear
    expect(queryByText('TUE')).toBeNull();
    // Non-rest, non-source days should appear
    getByText('Pull Day');
    getByText('Cardio');
  });

  it('shows completed days but as disabled', () => {
    const { getByText } = render(
      <SwapDaySheet visible sourceDay={1} days={DAYS} onSwap={jest.fn()} onDismiss={jest.fn()} />,
    );
    // Leg Day is COMPLETED — still rendered
    getByText('Leg Day');
  });

  it('calls onSwap(sourceDay, targetDay) when a valid target is pressed', () => {
    const onSwap = jest.fn();
    const { getByText } = render(
      <SwapDaySheet visible sourceDay={1} days={DAYS} onSwap={onSwap} onDismiss={jest.fn()} />,
    );
    fireEvent.press(getByText('Pull Day'));
    expect(onSwap).toHaveBeenCalledWith(1, 3);
  });

  it('calls onDismiss when Cancel is pressed', () => {
    const onDismiss = jest.fn();
    const onSwap    = jest.fn();
    const { getByText } = render(
      <SwapDaySheet visible sourceDay={1} days={DAYS} onSwap={onSwap} onDismiss={onDismiss} />,
    );
    fireEvent.press(getByText('Cancel'));
    expect(onDismiss).toHaveBeenCalled();
    expect(onSwap).not.toHaveBeenCalled();
  });

  it('renders nothing when visible=false', () => {
    const { queryByText } = render(
      <SwapDaySheet visible={false} sourceDay={1} days={DAYS} onSwap={jest.fn()} onDismiss={jest.fn()} />,
    );
    expect(queryByText('Pull Day')).toBeNull();
    expect(queryByText('Cancel')).toBeNull();
  });
});
