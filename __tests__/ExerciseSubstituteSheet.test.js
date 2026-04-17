/**
 * Tests for ExerciseSubstituteSheet.
 */

jest.mock('../src/api/workoutApi', () => ({
  workoutApi: {
    getAlternatives: jest.fn(),
  },
}));

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
const { render, fireEvent, waitFor } = require('@testing-library/react-native');
const { workoutApi } = require('../src/api/workoutApi');
const ExerciseSubstituteSheet = require('../src/components/workout/ExerciseSubstituteSheet').default;

const ALTERNATIVES = [
  { id: 'ex-alt-1', name: 'Incline Press',  primaryMuscle: 'Chest',   equipment: 'Barbell' },
  { id: 'ex-alt-2', name: 'Cable Fly',      primaryMuscle: 'Chest',   equipment: 'Cable'   },
];

function renderSheet(props = {}) {
  return render(
    <ExerciseSubstituteSheet
      visible
      exerciseId="ex-001"
      exerciseName="Bench Press"
      sessionExerciseId="sex-001"
      onSubstitute={jest.fn()}
      onDismiss={jest.fn()}
      {...props}
    />,
  );
}

describe('ExerciseSubstituteSheet', () => {
  beforeEach(() => jest.clearAllMocks());

  it('calls getAlternatives when sheet becomes visible', async () => {
    workoutApi.getAlternatives.mockResolvedValueOnce({ data: [] });
    renderSheet();
    await waitFor(() => expect(workoutApi.getAlternatives).toHaveBeenCalledWith('ex-001'));
  });

  it('renders alternative exercises after fetch', async () => {
    workoutApi.getAlternatives.mockResolvedValueOnce({ data: ALTERNATIVES });
    const { findByText } = renderSheet();
    await findByText('Incline Press');
    await findByText('Cable Fly');
  });

  it('shows error when getAlternatives fails', async () => {
    workoutApi.getAlternatives.mockRejectedValueOnce(new Error('Network Error'));
    const { findByText } = renderSheet();
    await findByText(/Could not load alternatives/i);
  });

  it('shows empty state when no alternatives', async () => {
    workoutApi.getAlternatives.mockResolvedValueOnce({ data: [] });
    const { findByText } = renderSheet();
    await findByText(/No alternative exercises found/i);
  });

  it('calls onSubstitute with SESSION scope by default when alternative is tapped', async () => {
    workoutApi.getAlternatives.mockResolvedValueOnce({ data: ALTERNATIVES });
    const onSubstitute = jest.fn();
    const { findByText } = renderSheet({ onSubstitute });
    fireEvent.press(await findByText('Incline Press'));
    expect(onSubstitute).toHaveBeenCalledWith('sex-001', 'ex-alt-1', 'Incline Press', 'SESSION');
  });

  it('calls onSubstitute with PLAN scope when PLAN tab is selected', async () => {
    workoutApi.getAlternatives.mockResolvedValueOnce({ data: ALTERNATIVES });
    const onSubstitute = jest.fn();
    const { findByText, getByText } = renderSheet({ onSubstitute });
    await findByText('Incline Press');
    fireEvent.press(getByText('Entire Plan'));
    fireEvent.press(getByText('Incline Press'));
    expect(onSubstitute).toHaveBeenCalledWith('sex-001', 'ex-alt-1', 'Incline Press', 'PLAN');
  });

  it('calls onDismiss when Cancel is pressed', async () => {
    workoutApi.getAlternatives.mockResolvedValueOnce({ data: [] });
    const onDismiss = jest.fn();
    const { findByText } = renderSheet({ onDismiss });
    fireEvent.press(await findByText('Cancel'));
    expect(onDismiss).toHaveBeenCalled();
  });

  it('does not call getAlternatives when visible=false', () => {
    render(
      <ExerciseSubstituteSheet
        visible={false}
        exerciseId="ex-001"
        exerciseName="Bench Press"
        sessionExerciseId="sex-001"
        onSubstitute={jest.fn()}
        onDismiss={jest.fn()}
      />,
    );
    expect(workoutApi.getAlternatives).not.toHaveBeenCalled();
  });

  it('renders nothing when visible=false', () => {
    const { queryByText } = render(
      <ExerciseSubstituteSheet
        visible={false}
        exerciseId="ex-001"
        exerciseName="Bench Press"
        sessionExerciseId="sex-001"
        onSubstitute={jest.fn()}
        onDismiss={jest.fn()}
      />,
    );
    expect(queryByText('Cancel')).toBeNull();
  });
});
