/**
 * Tests for dashboard UI components.
 * Verifies rendering of key content for each component in isolation.
 */
import React from 'react';
import { render } from '@testing-library/react-native';

// ─── Mocks ────────────────────────────────────────────────────────────────────

jest.mock('expo-linear-gradient', () => ({
  LinearGradient: 'LinearGradient',
}));

jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
}));

jest.mock('../src/utils/tokenStorage', () => ({
  tokenStorage: {
    getTokens: jest.fn().mockResolvedValue({ accessToken: null }),
  },
}));

// ─── Imports ──────────────────────────────────────────────────────────────────

import WorkoutCard         from '../src/components/dashboard/WorkoutCard';
import RestDayCard         from '../src/components/dashboard/RestDayCard';
import EmptyStateCard      from '../src/components/dashboard/EmptyStateCard';
import CoachNoteCard       from '../src/components/dashboard/CoachNoteCard';
import WeeklyAdherenceDots from '../src/components/dashboard/WeeklyAdherenceDots';
import MiniStatsRow        from '../src/components/dashboard/MiniStatsRow';

// ─── WorkoutCard ──────────────────────────────────────────────────────────────

describe('WorkoutCard', () => {
  const workout = {
    name:               'Upper Body Strength',
    estimatedDuration:  45,
    totalExercises:     8,
    completedExercises: 0,
  };

  it('renders the workout name', () => {
    const { getByText } = render(
      <WorkoutCard workout={workout} isCompleted={false} onStart={jest.fn()} />,
    );
    expect(getByText('Upper Body Strength')).toBeTruthy();
  });

  it('renders the duration chip', () => {
    const { getByText } = render(
      <WorkoutCard workout={workout} isCompleted={false} onStart={jest.fn()} />,
    );
    expect(getByText('45 min')).toBeTruthy();
  });

  it('renders "Start Workout" button when not completed', () => {
    const { getByText } = render(
      <WorkoutCard workout={workout} isCompleted={false} onStart={jest.fn()} />,
    );
    expect(getByText('Start Workout')).toBeTruthy();
  });

  it('does NOT render "Start Workout" button when completed', () => {
    const { queryByText } = render(
      <WorkoutCard workout={workout} isCompleted={true} onStart={jest.fn()} />,
    );
    expect(queryByText('Start Workout')).toBeNull();
  });

  it('renders "Completed" badge when isCompleted is true', () => {
    const { getByText } = render(
      <WorkoutCard workout={workout} isCompleted={true} onStart={jest.fn()} />,
    );
    expect(getByText('Completed')).toBeTruthy();
  });

  it('renders exercise count', () => {
    const { getByText } = render(
      <WorkoutCard workout={workout} isCompleted={false} onStart={jest.fn()} />,
    );
    expect(getByText('0 / 8 exercises')).toBeTruthy();
  });
});

// ─── RestDayCard ──────────────────────────────────────────────────────────────

describe('RestDayCard', () => {
  it('renders "Rest Day" title', () => {
    const { getByText } = render(<RestDayCard />);
    expect(getByText('Rest Day')).toBeTruthy();
  });

  it('renders recovery message', () => {
    const { getByText } = render(<RestDayCard />);
    expect(
      getByText(/Recovery is part of the process/i),
    ).toBeTruthy();
  });
});

// ─── EmptyStateCard ───────────────────────────────────────────────────────────

describe('EmptyStateCard', () => {
  it('renders "No Active Plan" title', () => {
    const { getByText } = render(
      <EmptyStateCard onBrowsePlans={jest.fn()} />,
    );
    expect(getByText('No Active Plan')).toBeTruthy();
  });

  it('renders "Browse Plans" button', () => {
    const { getByText } = render(
      <EmptyStateCard onBrowsePlans={jest.fn()} />,
    );
    expect(getByText('Browse Plans')).toBeTruthy();
  });

  it('renders the descriptive subtitle', () => {
    const { getByText } = render(
      <EmptyStateCard onBrowsePlans={jest.fn()} />,
    );
    expect(
      getByText(/Pick a workout plan/i),
    ).toBeTruthy();
  });
});

// ─── CoachNoteCard ────────────────────────────────────────────────────────────

describe('CoachNoteCard', () => {
  it('renders the note text', () => {
    const note = "You're 3 sessions away from your streak personal best.";
    const { getByText } = render(<CoachNoteCard note={note} />);
    expect(getByText(note)).toBeTruthy();
  });

  it('renders empty string when no note provided', () => {
    const { queryByText } = render(<CoachNoteCard />);
    // No crash — renders without note text
    expect(queryByText(/something random/)).toBeNull();
  });
});

// ─── WeeklyAdherenceDots ──────────────────────────────────────────────────────

describe('WeeklyAdherenceDots', () => {
  const weeklyAdherence = [
    { dayShort: 'Mon', status: 'COMPLETED' },
    { dayShort: 'Tue', status: 'COMPLETED' },
    { dayShort: 'Wed', status: 'MISSED' },
    { dayShort: 'Thu', status: 'COMPLETED' },
    { dayShort: 'Fri', status: 'SCHEDULED' },
    { dayShort: 'Sat', status: 'REST' },
    { dayShort: 'Sun', status: 'REST' },
  ];

  it('renders all 7 day labels', () => {
    const { getByText } = render(
      <WeeklyAdherenceDots weeklyAdherence={weeklyAdherence} />,
    );
    expect(getByText('Mon')).toBeTruthy();
    expect(getByText('Tue')).toBeTruthy();
    expect(getByText('Wed')).toBeTruthy();
    expect(getByText('Thu')).toBeTruthy();
    expect(getByText('Fri')).toBeTruthy();
    expect(getByText('Sat')).toBeTruthy();
    expect(getByText('Sun')).toBeTruthy();
  });

  it('renders "THIS WEEK" section label', () => {
    const { getByText } = render(
      <WeeklyAdherenceDots weeklyAdherence={weeklyAdherence} />,
    );
    expect(getByText('THIS WEEK')).toBeTruthy();
  });

  it('renders without crashing when passed empty array', () => {
    const { getByText } = render(
      <WeeklyAdherenceDots weeklyAdherence={[]} />,
    );
    expect(getByText('THIS WEEK')).toBeTruthy();
  });
});

// ─── MiniStatsRow ─────────────────────────────────────────────────────────────

describe('MiniStatsRow', () => {
  const stats = {
    workoutsThisWeek: 3,
    totalWorkouts:    47,
    daysRemaining:    21,
  };

  it('renders all three stat values', () => {
    const { getByText } = render(<MiniStatsRow stats={stats} />);
    expect(getByText('3')).toBeTruthy();
    expect(getByText('47')).toBeTruthy();
    expect(getByText('21')).toBeTruthy();
  });

  it('renders all three stat labels', () => {
    const { getByText } = render(<MiniStatsRow stats={stats} />);
    expect(getByText('This Week')).toBeTruthy();
    expect(getByText('Total')).toBeTruthy();
    expect(getByText('Days Left')).toBeTruthy();
  });

  it('renders "—" for null daysRemaining', () => {
    const { getAllByText } = render(
      <MiniStatsRow stats={{ ...stats, daysRemaining: null }} />,
    );
    // "—" appears at least once (daysRemaining cell)
    expect(getAllByText('—').length).toBeGreaterThanOrEqual(1);
  });
});
