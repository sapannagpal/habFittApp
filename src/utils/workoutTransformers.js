/**
 * workoutTransformers.js
 * Pure functions to transform API responses into FE shapes.
 */

/**
 * Transform WorkoutPlanResponse + preset → FE plan object.
 * @param {object} apiPlan - WorkoutPlanResponse from API
 * @param {object|null} preset - matching PlanPreset from planPresets.js
 */
export function transformPlan(apiPlan, preset) {
  return {
    id: String(apiPlan.id),
    name: preset?.name ?? apiPlan.programmeName,
    programmeName: apiPlan.programmeName,
    templateId: apiPlan.templateId,
    format: apiPlan.format,
    durationWeeks: apiPlan.totalWeeks,
    currentWeek: apiPlan.currentWeek,
    status: apiPlan.status,
    createdAt: apiPlan.createdAt,
    // Display metadata from preset (falls back to generic values if preset not found)
    difficulty: preset?.difficulty ?? 'Intermediate',
    description: preset?.description ?? '',
    sessionsPerWeek: preset?.sessionsPerWeek ?? 3,
    thumbnailColor: preset?.thumbnailColor ?? '#1A2A3A',
    estimatedMinutes: preset?.estimatedMinutes ?? 45,
  };
}

/**
 * Transform PlanWeek response → array of FE PlanSession objects.
 * Excludes the outer week wrapper — callers store sessions in currentWeekSessions.
 * @param {object} apiWeek - PlanWeek from GET /plans/{id}/weeks/{n}
 * @returns {object[]} FE PlanSession[]
 */
export function transformWeekSessions(apiWeek) {
  return (apiWeek?.sessions ?? []).map(transformPlanSession);
}

/**
 * Transform a single PlanSession from getWeek response → FE session shape.
 * NOTE: exercises are empty here — loaded lazily via getSessionDetail.
 * @param {object} apiSession
 */
export function transformPlanSession(apiSession) {
  return {
    id: String(apiSession.id),
    dayOfWeek: apiSession.dayOfWeek,        // 1=Mon, 2=Tue, ..., 6=Sat
    name: apiSession.sessionName,
    estimatedMinutes: apiSession.estimatedDurationMinutes ?? 45,
    exerciseCount: apiSession.exerciseCount ?? 0,
    status: apiSession.status ?? 'UPCOMING',
    completedAt: apiSession.completedAt ?? null,
    exercises: [],                           // populated by transformSessionDetail
    muscleGroups: [],
  };
}

/**
 * Transform SessionDetailResponse + exerciseCache → enriched FE session.
 * exerciseCache must be pre-populated for all exerciseIds in detail.exercises.
 * @param {object} detail - SessionDetailResponse
 * @param {object} cache - exerciseCache instance
 */
export function transformSessionDetail(detail, cache) {
  const exercises = (detail.exercises ?? []).map((ex) => ({
    id: String(ex.exerciseId),               // used as key in setLogs
    sessionExerciseId: String(ex.sessionExerciseId), // used for API logSet exerciseId param
    name: cache.get(String(ex.exerciseId)) ?? `Exercise ${ex.exerciseOrder}`,
    sets: ex.sets,
    reps: ex.reps,
    weightKg: ex.weightKg ?? 0,
    restSeconds: ex.restSeconds ?? 90,
    metricType: ex.metricType ?? 'WEIGHT_REPS',
    order: ex.exerciseOrder,
    isWarmup: ex.warmup ?? false,
    isCooldown: ex.cooldown ?? false,
    primaryMuscle: cache.getMuscle(String(ex.exerciseId)) ?? '',
    logs: ex.logs ?? [],
  }));

  const restValues = exercises.map(e => e.restSeconds).filter(Boolean);
  const defaultRest = restValues.length > 0 ? Math.min(...restValues) : 90;

  return {
    id: String(detail.sessionId),
    name: detail.sessionName,
    status: detail.status,
    startedAt: detail.startedAt,
    exercises,
    defaultRestSeconds: defaultRest,
    estimatedMinutes: Math.ceil(
      exercises.reduce((sum, e) => sum + e.sets * (e.restSeconds + 60), 0) / 60,
    ),
    exerciseCount: exercises.length,
    muscleGroups: [...new Set(exercises.map(e => e.primaryMuscle).filter(Boolean))],
  };
}

/**
 * Transform a Spring Page of SessionHistoryResponse → FE history shape.
 * @param {object} apiPage - Spring Page object
 * @param {string|null} planName - active plan name for display annotation
 */
export function transformHistoryPage(apiPage, planName) {
  const content = apiPage?.content ?? [];
  const items = content.map((entry) => ({
    id: String(entry.sessionId),
    date: entry.completedAt ?? entry.startedAt,
    name: entry.sessionName,
    durationSeconds: entry.actualDurationSeconds ?? 0,
    exerciseCount: entry.exerciseCount ?? 0,
    status: entry.status,
    feedback: entry.feedback ?? null,
    planName: planName ?? '',
    isPR: false,
  }));

  return {
    items,
    page: apiPage?.number ?? 0,
    totalPages: apiPage?.totalPages ?? 0,
    totalElements: apiPage?.totalElements ?? 0,
    hasMore: !(apiPage?.last ?? true),
  };
}
