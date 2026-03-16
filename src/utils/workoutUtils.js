/**
 * HabFitt Workout Utilities
 * Pure helper functions — no React dependencies.
 */

// ─── formatTime ───────────────────────────────────────────────────────────────

/**
 * Formats total seconds into 'MM:SS' string.
 * Examples: 65 → '1:05', 3600 → '60:00', 30 → '0:30'
 *
 * @param {number} totalSeconds
 * @returns {string}
 */
export function formatTime(totalSeconds) {
  const safeSeconds = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(safeSeconds / 60);
  const seconds = safeSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

// ─── formatVolume ─────────────────────────────────────────────────────────────

/**
 * Converts a weight value from kg to the target unit and formats it.
 * Examples: formatVolume(100, 'kg') → '100 kg'
 *           formatVolume(100, 'lbs') → '220 lbs'
 *
 * @param {number} kg — weight in kilograms
 * @param {'kg'|'lbs'} unit — target display unit
 * @returns {string}
 */
export function formatVolume(kg, unit) {
  if (unit === 'lbs') {
    const lbs = Math.round(kg * 2.20462);
    return `${lbs} lbs`;
  }
  return `${Math.round(kg)} kg`;
}

// ─── formatDuration ───────────────────────────────────────────────────────────

/**
 * Converts seconds to a human-readable duration string.
 * Examples: 2700 → '45 min', 4500 → '1 hr 15 min', 60 → '1 min'
 *
 * @param {number} seconds
 * @returns {string}
 */
export function formatDuration(seconds) {
  const totalMinutes = Math.round(seconds / 60);
  if (totalMinutes < 60) {
    return `${totalMinutes} min`;
  }
  const hours = Math.floor(totalMinutes / 60);
  const remainingMinutes = totalMinutes % 60;
  if (remainingMinutes === 0) {
    return `${hours} hr`;
  }
  return `${hours} hr ${remainingMinutes} min`;
}

// ─── computeDashboardState ────────────────────────────────────────────────────

/**
 * Determines dashboard state based on the active plan and current week's sessions.
 *
 * @param {object|null} activePlan - FE plan object (from transformPlan)
 * @param {object[]} currentWeekSessions - PlanSession[] from GET /plans/{id}/weeks/{n}
 * @param {Date} today - current date
 * @returns {{ dashboardState: string, todaySession: object|null }}
 *
 * dashboardState values:
 *   'NO_PLAN'         — no active plan
 *   'WORKOUT_TODAY'   — session scheduled for today (by dayOfWeek match)
 *   'MISSED_SESSIONS' — a past session this week has status UPCOMING (was not done)
 *   'REST_DAY'        — no session today, no missed sessions
 */
export function computeDashboardState(activePlan, currentWeekSessions, today) {
  if (!activePlan || !currentWeekSessions || currentWeekSessions.length === 0) {
    return { dashboardState: 'NO_PLAN', todaySession: null };
  }

  // API dayOfWeek: 1=Mon,...,6=Sat. JS Date.getDay(): 0=Sun,1=Mon,...,6=Sat.
  // Map JS Sunday (0) to 7 so that all API days (1–6) are correctly treated as
  // "earlier in the week" when checking for missed sessions on a Sunday.
  const jsDow = today.getDay();
  const todayDow = jsDow === 0 ? 7 : jsDow;

  // Check if there's a session scheduled for today (Sunday can never match API days 1–6)
  const todaySession = currentWeekSessions.find(s => s.dayOfWeek === todayDow) ?? null;

  if (todaySession) {
    return { dashboardState: 'WORKOUT_TODAY', todaySession };
  }

  // No session today — check for missed sessions (UPCOMING status on a past day this week)
  const hasMissed = currentWeekSessions.some(
    s => s.dayOfWeek < todayDow && s.status === 'UPCOMING',
  );

  if (hasMissed) {
    return { dashboardState: 'MISSED_SESSIONS', todaySession: null };
  }

  return { dashboardState: 'REST_DAY', todaySession: null };
}
