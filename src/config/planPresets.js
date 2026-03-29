/**
 * Plan presets — FE catalogue config.
 * templateId matches the BE PlanGenerationService TEMPLATE_TRAINING_DAYS keys.
 * templateSessions provides static display data for PlanDetailScreen.
 *
 * preferredFormat MUST always be 'STRENGTH' — it is the only registered strategy
 * in the backend (StrengthPlanStrategy). The actual template (FULL_BODY_3X,
 * UPPER_LOWER, etc.) is auto-selected by the strategy based on experienceLevel,
 * daysPerWeek, and availableEquipment.
 *
 * Template selection logic (StrengthPlanStrategy):
 *   equipment == null || empty || only BODYWEIGHT  → BODYWEIGHT_FUNDAMENTALS
 *   INTERMEDIATE/ADVANCED && days >= 6             → PUSH_PULL_LEGS
 *   INTERMEDIATE/ADVANCED && days >= 4             → UPPER_LOWER
 *   BEGINNER && days >= 4                          → LINEAR_PROGRESSION
 *   else (BEGINNER, 3 days, has weights)           → FULL_BODY_3X
 */

export const PLAN_PRESETS = [
  {
    id: 'beginner-fullbody-3x',
    templateId: 'FULL_BODY_3X',
    name: 'Beginner Full Body',
    description: '3 days/week whole-body training. Build foundational strength and muscle with balanced compound movements.',
    difficulty: 'Beginner',
    sessionsPerWeek: 3,
    estimatedMinutes: 45,
    thumbnailColor: '#1A3A5C',
    // GeneratePlanRequest fields
    fitnessGoal: 'STRENGTH',
    experienceLevel: 'BEGINNER',
    preferredFormat: 'STRENGTH',
    availableEquipment: ['DUMBBELL', 'BODYWEIGHT', 'BENCH'],
    daysPerWeek: 3,
    sessionDurationMinutes: 45,
    injuryFlags: [],
    bodyWeightKg: 70.0,
    totalWeeks: 8,
    // Static display for PlanDetailScreen
    templateSessions: [
      { dayLabel: 'Monday', name: 'Full Body A' },
      { dayLabel: 'Wednesday', name: 'Full Body B' },
      { dayLabel: 'Friday', name: 'Full Body C' },
    ],
  },
  {
    id: 'beginner-bodyweight-3x',
    templateId: 'BODYWEIGHT_FUNDAMENTALS',
    name: 'Bodyweight Basics',
    description: 'No equipment needed. Build strength and body control using only your bodyweight — perfect for home workouts.',
    difficulty: 'Beginner',
    sessionsPerWeek: 3,
    estimatedMinutes: 40,
    thumbnailColor: '#2D5016',
    fitnessGoal: 'GENERAL_FITNESS',
    experienceLevel: 'BEGINNER',
    preferredFormat: 'STRENGTH',
    availableEquipment: ['BODYWEIGHT'],
    daysPerWeek: 3,
    sessionDurationMinutes: 40,
    injuryFlags: [],
    bodyWeightKg: 70.0,
    totalWeeks: 8,
    templateSessions: [
      { dayLabel: 'Monday', name: 'Full Body A' },
      { dayLabel: 'Wednesday', name: 'Full Body B' },
      { dayLabel: 'Friday', name: 'Full Body C' },
    ],
  },
  {
    id: 'intermediate-upper-lower-4x',
    templateId: 'UPPER_LOWER',
    name: 'Upper/Lower Split',
    description: '4 days/week upper/lower split. Hit each muscle group twice per week for accelerated hypertrophy and strength gains.',
    difficulty: 'Intermediate',
    sessionsPerWeek: 4,
    estimatedMinutes: 55,
    thumbnailColor: '#4A1A5C',
    fitnessGoal: 'HYPERTROPHY',
    experienceLevel: 'INTERMEDIATE',
    preferredFormat: 'STRENGTH',
    availableEquipment: ['BARBELL', 'DUMBBELL', 'CABLE_MACHINE', 'BENCH', 'SQUAT_RACK'],
    daysPerWeek: 4,
    sessionDurationMinutes: 55,
    injuryFlags: [],
    bodyWeightKg: 75.0,
    totalWeeks: 8,
    templateSessions: [
      { dayLabel: 'Monday', name: 'Upper A' },
      { dayLabel: 'Tuesday', name: 'Lower A' },
      { dayLabel: 'Thursday', name: 'Upper B' },
      { dayLabel: 'Friday', name: 'Lower B' },
    ],
  },
  {
    id: 'intermediate-ppl-6x',
    templateId: 'PUSH_PULL_LEGS',
    name: 'Push Pull Legs',
    description: '6 days/week Push/Pull/Legs. Maximum volume for serious muscle building. Best for intermediate lifters ready to commit.',
    difficulty: 'Intermediate',
    sessionsPerWeek: 6,
    estimatedMinutes: 60,
    thumbnailColor: '#5C2A1A',
    fitnessGoal: 'HYPERTROPHY',
    experienceLevel: 'INTERMEDIATE',
    preferredFormat: 'STRENGTH',
    availableEquipment: ['BARBELL', 'DUMBBELL', 'CABLE_MACHINE', 'BENCH', 'SQUAT_RACK', 'MACHINE'],
    daysPerWeek: 6,
    sessionDurationMinutes: 60,
    injuryFlags: [],
    bodyWeightKg: 75.0,
    totalWeeks: 8,
    templateSessions: [
      { dayLabel: 'Monday', name: 'Push A' },
      { dayLabel: 'Tuesday', name: 'Pull A' },
      { dayLabel: 'Wednesday', name: 'Legs A' },
      { dayLabel: 'Thursday', name: 'Push B' },
      { dayLabel: 'Friday', name: 'Pull B' },
      { dayLabel: 'Saturday', name: 'Legs B' },
    ],
  },
  {
    id: 'advanced-linear-4x',
    templateId: 'LINEAR_PROGRESSION',
    name: 'Linear Progression',
    description: '4 days/week structured training for intermediate lifters ready to progress every session.',
    difficulty: 'Intermediate',
    sessionsPerWeek: 4,
    estimatedMinutes: 75,
    thumbnailColor: '#1A1A3A',
    fitnessGoal: 'STRENGTH',
    experienceLevel: 'BEGINNER',
    preferredFormat: 'STRENGTH',
    availableEquipment: ['BARBELL', 'DUMBBELL', 'CABLE_MACHINE', 'BENCH', 'SQUAT_RACK', 'MACHINE', 'KETTLEBELL'],
    daysPerWeek: 4,
    sessionDurationMinutes: 75,
    injuryFlags: [],
    bodyWeightKg: 80.0,
    totalWeeks: 12,
    templateSessions: [
      { dayLabel: 'Monday', name: 'Session A' },
      { dayLabel: 'Tuesday', name: 'Session B' },
      { dayLabel: 'Thursday', name: 'Session C' },
      { dayLabel: 'Friday', name: 'Session D' },
    ],
  },
];

/** Find a preset by its id */
export function getPresetById(presetId) {
  return PLAN_PRESETS.find(p => p.id === presetId) ?? null;
}

/** Find a preset by its templateId (for matching active plan from API) */
export function getPresetByTemplateId(templateId) {
  return PLAN_PRESETS.find(p => p.templateId === templateId) ?? null;
}
