/**
 * Weekly Schedule — shows the 7-day workout plan for the current week.
 * User can tap a scheduled day to start/continue that session.
 * Supports week navigation (prev/next).
 *
 * API: GET /plans/{planId}/weeks/{weekNumber}  (path param, not query param)
 * Active plan field: plan.programmeName (not templateName)
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { workoutApi } from '../../api/workoutApi';
import { useWorkout } from '../../context/WorkoutContext';
import SwapDaySheet    from '../../components/workout/SwapDaySheet';

// ─── Day constants ────────────────────────────────────────────────────────────

const DAY_SHORT = {
  // String keys (ISO day names)
  MONDAY:    'MON',
  TUESDAY:   'TUE',
  WEDNESDAY: 'WED',
  THURSDAY:  'THU',
  FRIDAY:    'FRI',
  SATURDAY:  'SAT',
  SUNDAY:    'SUN',
  // Numeric keys (ISO-8601: 1=Mon … 7=Sun) — backend returns numeric dayOfWeek
  1: 'MON', 2: 'TUE', 3: 'WED', 4: 'THU', 5: 'FRI', 6: 'SAT', 7: 'SUN',
};

// ─── numDay helper ────────────────────────────────────────────────────────────

const numDay = (d) =>
  typeof d === 'number' ? d
    : ({ MONDAY:1,TUESDAY:2,WEDNESDAY:3,THURSDAY:4,FRIDAY:5,SATURDAY:6,SUNDAY:7 }[d] ?? 0);

// Returns the ISO day of week for today: 1=Mon … 7=Sun
function todayIsoDay() {
  const d = new Date().getDay(); // 0=Sun … 6=Sat
  return d === 0 ? 7 : d;
}

const MONTH_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function getWeekDateRange(planStartDate, weekNumber) {
  const start = new Date(planStartDate);
  start.setDate(start.getDate() + (weekNumber - 1) * 7);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  const fmt = (d) => `${MONTH_SHORT[d.getMonth()]} ${d.getDate()}`;
  return `${fmt(start)} – ${fmt(end)}`;
}

const normaliseDays = (data) => {
  if (!data) return [];

  let raw = [];
  // Shape A: { days: [...] }
  if (Array.isArray(data.days)) {
    raw = data.days;
  } else if (Array.isArray(data.sessions)) {
    // Shape B: { sessions: [...] }
    raw = data.sessions.map((s) => ({
      dayOfWeek:   s.dayOfWeek,
      workoutName: s.workoutName ?? s.sessionName ?? null,
      sessionId:   s.id ?? s.sessionId,
      status:      s.status,
      restDay:     s.restDay ?? false,
      modified:    s.modified ?? false,
    }));
  }

  // Build a Map keyed by ISO day number (1=Mon…7=Sun)
  const dayMap = new Map();
  raw.forEach((day) => {
    const n = numDay(day.dayOfWeek);
    if (n >= 1 && n <= 7) dayMap.set(n, { ...day, dayOfWeek: n });
  });

  // Produce exactly 7 entries — fill gaps with rest-day stubs
  const result = [];
  for (let i = 1; i <= 7; i++) {
    result.push(
      dayMap.has(i)
        ? dayMap.get(i)
        : { dayOfWeek: i, restDay: true, sessionId: null, workoutName: null, status: null, modified: false },
    );
  }
  return result;
};

// ─── Day Card ─────────────────────────────────────────────────────────────────

function DayCard({ day, onPress, onLongPress, onMenuPress, isToday }) {
  const isRest   = day.restDay;
  const isDone   = day.status?.toUpperCase() === 'COMPLETED';
  const isActive = day.status === 'IN_PROGRESS';
  const canStart = !isRest && !isDone && day.sessionId;
  const short    = DAY_SHORT[day.dayOfWeek] ?? String(day.dayOfWeek ?? '').slice(0, 3);

  const showMenu = !isDone;

  let statusIcon = null;
  if (isDone)   statusIcon = <Ionicons name="checkmark-circle" size={20} color={colors.success} />;
  if (isActive) statusIcon = <Ionicons name="play-circle" size={20} color={colors.textAccent} />;
  if (isRest)   statusIcon = <Ionicons name="moon-outline" size={18} color={colors.restAccent} />;

  return (
    <TouchableOpacity
      style={[
        styles.dayCard,
        isDone   && styles.dayCardDone,
        isActive && styles.dayCardActive,
        isRest   && styles.dayCardRest,
        isToday  && styles.dayCardToday,
      ]}
      onPress={() => canStart && onPress(day)}
      onLongPress={() => canStart && onLongPress?.(day)}
      activeOpacity={canStart ? 0.7 : 1}
      disabled={!canStart}
    >
      <View style={styles.dayLeft}>
        <Text style={styles.dayShort}>{short}</Text>
        <Text style={[styles.dayName, isRest && styles.dayNameRest]}>
          {isRest ? 'Rest Day' : (day.workoutName ?? 'Workout')}
        </Text>
        {day.modified && (
          <View style={styles.modBadge}>
            <Text style={styles.modText}>Modified</Text>
          </View>
        )}
      </View>
      <View style={styles.dayRight}>
        {statusIcon}
        {showMenu && (
          <TouchableOpacity
            onPress={() => onMenuPress?.(day)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={styles.dayMenuBtn}
          >
            <Ionicons name="ellipsis-vertical" size={16} color={colors.textSecondary} />
          </TouchableOpacity>
        )}
        {canStart && (
          <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
        )}
      </View>
    </TouchableOpacity>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function WeeklyScheduleScreen({ route, navigation }) {
  const { clearActivePlan } = useWorkout();
  const { planId, plan } = route.params;

  // Start on the plan's current week if provided, otherwise week 1
  const initialWeek = plan?.currentWeek ?? 1;
  const totalWeeks  = plan?.totalWeeks ?? null;

  const [weekNumber, setWeekNumber] = useState(initialWeek);
  const [schedule, setSchedule]     = useState(null);

  const planStart = plan?.createdAt ? new Date(plan.createdAt) : null;
  const weekLabel = (planStart && !isNaN(planStart.getTime()))
    ? getWeekDateRange(planStart, weekNumber)
    : `Week ${weekNumber}`;
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError]           = useState(null);
  const [startingSession, setStartingSession] = useState(null);

  const [swapSource, setSwapSource]       = useState(null);
  const [inlineError, setInlineError]     = useState(null);
  const [showMenu, setShowMenu]           = useState(false);

  const load = useCallback(
    async (wk, isRefresh = false) => {
      try {
        isRefresh ? setRefreshing(true) : setLoading(true);
        setError(null);
        // Path param: GET /plans/{planId}/weeks/{weekNumber}
        const { data } = await workoutApi.getWeeklySchedule(planId, wk);
        setSchedule(data);
      } catch (e) {
        if (__DEV__) {
          console.warn(
            '[WeeklySchedule] load failed:',
            'status=', e.response?.status,
            'url=', e.config?.url,
            'message=', e.message,
            'data=', JSON.stringify(e.response?.data),
          );
        }
        setError('Could not load schedule. Pull down to retry.');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [planId],
  );

  useEffect(() => {
    load(weekNumber);
  }, [load, weekNumber]);

  useEffect(() => {
    if (!inlineError) return;
    const t = setTimeout(() => setInlineError(null), 4000);
    return () => clearTimeout(t);
  }, [inlineError]);

  const onRefresh = useCallback(() => load(weekNumber, true), [load, weekNumber]);

  // Open a session for preview. We do NOT call startSession here — that's
  // deferred to the first set log (lazy-start). This keeps tapping a day
  // cheap and side-effect-free: the user can back out without creating any
  // backend state. If the session is already IN_PROGRESS (e.g. resumed after
  // a crash), getSessionDetail still returns the full exercise list and the
  // ActiveSession screen will treat it as already-started via route params.
  const handleDayPress = useCallback(
    async (day) => {
      if (!day.sessionId) return;
      setStartingSession(day.sessionId);
      try {
        const { data: session } = await workoutApi.getSessionDetail(day.sessionId);
        const hasStarted = session.status === 'IN_PROGRESS';
        navigation.navigate('ActiveSession', { session, hasStarted });
      } catch (e) {
        if (__DEV__) console.warn('[WeeklySchedule] getSessionDetail failed:', e.response?.status, e.message);
        setError('Could not open session. Please try again.');
      } finally {
        setStartingSession(null);
      }
    },
    [navigation],
  );

  const handleSwap = useCallback(
    async (sourceDay, targetDay) => {
      // Capture the latest state atomically inside the updater — not from the
      // closure — so rapid taps never revert to a stale snapshot.
      let snapshot;
      setSchedule(prev => {
        snapshot = prev;
        const arr = [...normaliseDays(prev)];
        const sIdx = arr.findIndex(d => numDay(d.dayOfWeek) === sourceDay);
        const tIdx = arr.findIndex(d => numDay(d.dayOfWeek) === targetDay);
        if (sIdx >= 0 && tIdx >= 0) {
          const sc = { ...arr[sIdx] };
          const tc = { ...arr[tIdx] };
          arr[sIdx] = { ...tc, dayOfWeek: sc.dayOfWeek, modified: true };
          arr[tIdx] = { ...sc, dayOfWeek: tc.dayOfWeek, modified: true };
        }
        return { days: arr };
      });
      setSwapSource(null);
      try {
        await workoutApi.swapDay(planId, sourceDay, { targetDay });
      } catch {
        if (snapshot !== undefined) setSchedule(snapshot);
        setInlineError('Swap failed. Please try again.');
      }
    },
    [planId],
  );

  const changeWeek = (delta) => {
    const next = weekNumber + delta;
    if (next < 1) return;
    if (totalWeeks && next > totalWeeks) return;
    setWeekNumber(next);
  };

  const handleAbandonPlan = async () => {
    try {
      await workoutApi.abandonActivePlan();
      clearActivePlan();
      navigation.replace('PlanCatalogue');
    } catch (e) {
      if (__DEV__) console.warn('[WeeklySchedule] abandonPlan failed:', e.response?.status, e.message);
      setInlineError('Could not abandon plan. Please try again.');
    }
  };

  const days = normaliseDays(schedule);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { position: 'relative' }]}>
        {/* Back button */}
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerText}>
          {/* programmeName replaces the old templateName field */}
          <Text style={styles.planName} numberOfLines={1}>
            {plan?.programmeName ?? 'My Plan'}
          </Text>
          {totalWeeks ? (
            <Text style={styles.headerSub}>{totalWeeks} week programme</Text>
          ) : (
            <Text style={styles.headerSub}>Active Plan</Text>
          )}
        </View>
        <TouchableOpacity onPress={() => setShowMenu(m => !m)} style={styles.menuBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="ellipsis-vertical" size={20} color={colors.textSecondary} />
        </TouchableOpacity>
        {showMenu && (
          <View style={styles.dropdown}>
            <TouchableOpacity
              style={styles.dropdownItem}
              onPress={() => { setShowMenu(false); navigation.navigate('PlanDetail'); }}
            >
              <Ionicons name="document-text-outline" size={16} color={colors.textPrimary} />
              <Text style={styles.dropdownItemText}>Plan Details</Text>
            </TouchableOpacity>
            <View style={styles.dropdownDivider} />
            <TouchableOpacity
              style={styles.dropdownItem}
              onPress={() => { setShowMenu(false); handleAbandonPlan(); }}
            >
              <Ionicons name="trash-outline" size={16} color={colors.error} />
              <Text style={[styles.dropdownItemText, { color: colors.error }]}>Abandon Plan</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Week navigation */}
      <View style={styles.weekNav}>
        <TouchableOpacity
          onPress={() => changeWeek(-1)}
          disabled={weekNumber <= 1}
          style={[styles.weekBtn, weekNumber <= 1 && styles.weekBtnDisabled]}
        >
          <Ionicons
            name="chevron-back"
            size={20}
            color={weekNumber <= 1 ? colors.textSecondary : colors.textPrimary}
          />
        </TouchableOpacity>
        <Text style={styles.weekLabel}>{weekLabel}</Text>
        <TouchableOpacity
          onPress={() => changeWeek(1)}
          disabled={totalWeeks != null && weekNumber >= totalWeeks}
          style={[
            styles.weekBtn,
            totalWeeks != null && weekNumber >= totalWeeks && styles.weekBtnDisabled,
          ]}
        >
          <Ionicons
            name="chevron-forward"
            size={20}
            color={
              totalWeeks != null && weekNumber >= totalWeeks
                ? colors.textSecondary
                : colors.textPrimary
            }
          />
        </TouchableOpacity>
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.textAccent} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.textAccent}
            />
          }
          showsVerticalScrollIndicator={false}
          onScrollBeginDrag={() => setShowMenu(false)}
        >
          {inlineError && (
            <View style={styles.inlineErrorBanner}>
              <Ionicons name="warning-outline" size={16} color={colors.error ?? '#FF3B30'} />
              <Text style={styles.inlineErrorText}>{inlineError}</Text>
            </View>
          )}

          {error ? (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle-outline" size={32} color={colors.textSecondary} />
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity
                style={styles.retryBtn}
                onPress={() => load(weekNumber)}
              >
                <Text style={styles.retryText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : days.length === 0 ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>No sessions found for this week.</Text>
            </View>
          ) : (
            days.map((day, idx) => (
              <DayCard
                key={day.sessionId ?? `day-${day.dayOfWeek}-${idx}`}
                day={day}
                onPress={handleDayPress}
                onLongPress={(d) => setSwapSource(numDay(d.dayOfWeek))}
                onMenuPress={(d) => setSwapSource(numDay(d.dayOfWeek))}
                isToday={numDay(day.dayOfWeek) === todayIsoDay()}
              />
            ))
          )}

          {startingSession && (
            <View style={styles.startingOverlay}>
              <ActivityIndicator color={colors.textAccent} />
              <Text style={styles.startingText}>Starting session…</Text>
            </View>
          )}
        </ScrollView>
      )}

      <SwapDaySheet
        visible={swapSource != null}
        sourceDay={swapSource}
        days={days}
        onSwap={handleSwap}
        onDismiss={() => setSwapSource(null)}
      />
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 4,
  },
  headerText: {
    flex: 1,
    marginRight: 12,
  },
  backBtn: {
    padding: 4,
    marginRight: 4,
  },
  planName: {
    color: colors.textPrimary,
    fontSize: 22,
    fontWeight: '800',
  },
  headerSub: {
    color: colors.textSecondary,
    fontSize: 13,
    marginTop: 1,
  },
  weekNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
    marginBottom: 4,
  },
  weekBtn: {
    padding: 8,
  },
  weekBtnDisabled: {
    opacity: 0.3,
  },
  weekLabel: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '600',
    minWidth: 130,
    textAlign: 'center',
  },
  list: {
    padding: 16,
    gap: 10,
    paddingBottom: 32,
  },
  // Day cards
  dayCard: {
    backgroundColor: colors.bgCard,
    borderRadius: 14,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  dayCardDone: {
    borderColor: `${colors.success}40`,
    backgroundColor: `${colors.success}0A`,
  },
  dayCardActive: {
    borderColor: `${colors.textAccent}60`,
    backgroundColor: `${colors.textAccent}0A`,
  },
  dayCardRest: {
    borderColor: `${colors.restAccent}30`,
    backgroundColor: `${colors.restAccent}08`,
  },
  dayLeft: {
    flex: 1,
    gap: 3,
  },
  dayShort: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
  },
  dayName: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
  dayNameRest: {
    color: colors.restAccent,
  },
  dayRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dayMenuBtn: { padding: 4 },
  modBadge: {
    backgroundColor: `${colors.textAccent}20`,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    alignSelf: 'flex-start',
  },
  modText: {
    color: colors.textAccent,
    fontSize: 10,
    fontWeight: '600',
  },
  errorBox: {
    alignItems: 'center',
    padding: 32,
    gap: 12,
  },
  errorText: {
    color: colors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
  },
  startingOverlay: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    padding: 16,
  },
  startingText: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  inlineErrorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FF3B3015',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#FF3B3030',
  },
  inlineErrorText: {
    color: '#FF3B30',
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
  },
  dayCardToday: {
    borderLeftWidth: 3,
    borderLeftColor: colors.textAccent,
  },
  menuBtn: {
    padding: 4,
  },
  dropdown: {
    position: 'absolute',
    top: 48,
    right: 16,
    backgroundColor: colors.bgCard,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    zIndex: 100,
    minWidth: 180,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 13,
  },
  dropdownItemText: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '500',
  },
  dropdownDivider: {
    height: 1,
    backgroundColor: colors.divider,
    marginHorizontal: 8,
  },
  retryBtn: {
    backgroundColor: colors.bgCard,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    marginTop: 12,
  },
  retryText: {
    color: colors.textAccent,
    fontWeight: '600',
    fontSize: 15,
  },
});
