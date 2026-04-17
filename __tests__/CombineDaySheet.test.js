/**
 * Tests for CombineDaySheet.
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
const CombineDaySheet = require('../src/components/workout/CombineDaySheet').default;

const DAYS = [
  { dayOfWeek: 1, workoutName: 'Push Day',  sessionId: 's1', status: 'PENDING',   restDay: false },
  { dayOfWeek: 2, workoutName: null,         sessionId: null, status: null,        restDay: true  },
  { dayOfWeek: 3, workoutName: 'Pull Day',  sessionId: 's3', status: 'PENDING',   restDay: false },
  { dayOfWeek: 4, workoutName: 'Leg Day',   sessionId: 's4', status: 'COMPLETED', restDay: false },
  { dayOfWeek: 5, workoutName: 'Cardio',    sessionId: 's5', status: 'PENDING',   restDay: false },
];

describe('CombineDaySheet', () => {
  it('excludes source, rest, and completed days from targets', () => {
    const { queryByText, getByText } = render(
      <CombineDaySheet visible sourceDay={1} days={DAYS} onCombine={jest.fn()} onDismiss={jest.fn()} />,
    );
    expect(queryByText('Push Day')).toBeNull();  // source
    expect(queryByText('TUE')).toBeNull();        // rest
    expect(queryByText('Leg Day')).toBeNull();    // completed
    getByText('Pull Day');
    getByText('Cardio');
  });

  it('shows explanatory subtitle text', () => {
    const { getByText } = render(
      <CombineDaySheet visible sourceDay={1} days={DAYS} onCombine={jest.fn()} onDismiss={jest.fn()} />,
    );
    getByText(/All exercises from/i);
  });

  it('calls onCombine(sourceDay, targetDay) on target press', () => {
    const onCombine = jest.fn();
    const { getByText } = render(
      <CombineDaySheet visible sourceDay={1} days={DAYS} onCombine={onCombine} onDismiss={jest.fn()} />,
    );
    fireEvent.press(getByText('Pull Day'));
    expect(onCombine).toHaveBeenCalledWith(1, 3);
  });

  it('calls onDismiss on cancel', () => {
    const onDismiss = jest.fn();
    const { getByText } = render(
      <CombineDaySheet visible sourceDay={1} days={DAYS} onCombine={jest.fn()} onDismiss={onDismiss} />,
    );
    fireEvent.press(getByText('Cancel'));
    expect(onDismiss).toHaveBeenCalled();
  });

  it('renders nothing when visible=false', () => {
    const { queryByText } = render(
      <CombineDaySheet visible={false} sourceDay={1} days={DAYS} onCombine={jest.fn()} onDismiss={jest.fn()} />,
    );
    expect(queryByText('Cancel')).toBeNull();
  });
});
