/**
 * HabFitt Dashboard Mock Data
 * Default state: NO_PLAN — user has not selected a workout plan yet.
 */

export const MOCK_DASHBOARD_DATA = {
  state: 'NO_PLAN',
  greeting: 'Good morning',
  today: null,
  streak: { current: 0, longest: 5 },
  weeklyAdherence: [
    { dayLabel: 'M', status: 'COMPLETED' },
    { dayLabel: 'T', status: 'REST' },
    { dayLabel: 'W', status: 'COMPLETED' },
    { dayLabel: 'T', status: 'REST' },
    { dayLabel: 'F', status: 'MISSED' },
    { dayLabel: 'S', status: 'REST' },
    { dayLabel: 'S', status: 'TODAY' },
  ],
  stats: { workoutsThisWeek: 2, totalWorkouts: 15, daysRemaining: null },
  coachNote: 'Pick a plan and build your first habit today.',
};
