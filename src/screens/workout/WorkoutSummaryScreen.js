/**
 * Workout Summary — shown after completing a session.
 *
 * API response from 8084 completeSession is now simplified:
 *   { sessionId, status, actualDurationSeconds }
 * There is no exercises/volume/totalSets data in this response.
 *
 * sessionData: the local session state from ActiveSessionScreen — used to
 * compute sets, volume, and exercise breakdown from client-side logs.
 *
 * CTA: Back to Schedule → popToTop (lands back on WeeklySchedule).
 */
import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, gradientColors } from '../../theme/colors';

// ─── Feedback label map ───────────────────────────────────────────────────────

const FEEDBACK_LABELS = {
  TOO_EASY:   { label: 'Too Easy',   icon: 'happy-outline',      color: colors.success },
  JUST_RIGHT: { label: 'Just Right', icon: 'thumbs-up-outline',  color: colors.textAccent },
  TOO_HARD:   { label: 'Too Hard',   icon: 'sad-outline',        color: colors.error },
  PARTIAL:    { label: 'Partial',    icon: 'remove-circle-outline', color: colors.textSecondary },
};

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({ icon, value, label }) {
  return (
    <View style={styles.statCard}>
      <Ionicons name={icon} size={22} color={colors.textAccent} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function WorkoutSummaryScreen({ route, navigation }) {
  // session: { sessionId, status, actualDurationSeconds }
  // feedback: optional value passed from legacy flow
  // sessionData: local session state — exercises + logs logged client-side
  const { session, feedback, sessionData, wasCompleted } = route.params ?? {};

  if (!session) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <Ionicons name="alert-circle-outline" size={40} color={colors.textSecondary} />
          <Text style={styles.errorText}>No summary data available.</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => navigation.popToTop()}>
            <Text style={styles.retryText}>Back to Schedule</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // actualDurationSeconds is the new field name
  const durationSec = session.actualDurationSeconds ?? session.durationSeconds ?? null;
  const durationMin = durationSec != null ? Math.round(durationSec / 60) : null;

  const feedbackMeta = feedback ? (FEEDBACK_LABELS[feedback] ?? null) : null;

  // Compute summary stats
  let totalSets, totalVolume, exercisesCompleted;

  if (wasCompleted) {
    // Complete Workout path: all exercises and sets are done
    // Use synthesized logs (with user-typed or prescribed reps/weight)
    const allLogs = sessionData?.exercises?.flatMap(ex => ex.logs ?? []) ?? [];
    totalSets = allLogs.length;
    totalVolume = allLogs.reduce((sum, l) => sum + ((l.reps ?? 0) * (l.weightKg ?? 0)), 0);
    exercisesCompleted = sessionData?.exercises?.length ?? 0;
  } else {
    // Partial save / legacy: count from actual logs
    const completedLogs = sessionData?.exercises?.flatMap(ex =>
      (ex.logs ?? []).filter(l => l.status === 'COMPLETED')
    ) ?? [];
    totalSets = completedLogs.length;
    totalVolume = completedLogs.reduce((sum, l) => {
      return sum + ((l.reps ?? 0) * (l.weightKg ?? 0));
    }, 0);
    exercisesCompleted = sessionData?.exercises?.filter(ex => {
      const done = (ex.logs ?? []).filter(l => l.status === 'COMPLETED' || l.status === 'SKIPPED').length;
      return done >= (ex.sets ?? 0);
    }).length ?? 0;
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header with back button */}
      <View style={styles.summaryHeader}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={styles.summaryBackBtn}
        >
          <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Trophy icon */}
        <View style={styles.heroSection}>
          <LinearGradient
            colors={gradientColors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.trophyCircle}
          >
            <Ionicons name="trophy" size={36} color="#fff" />
          </LinearGradient>
          <Text style={styles.title}>Workout Complete!</Text>
          <Text style={styles.subtitle}>Great work today</Text>
        </View>

        {/* Stats — 4-stat grid */}
        <View style={styles.statsGrid}>
          {durationMin != null && (
            <StatCard icon="time-outline" value={`${durationMin}`} label="Minutes" />
          )}
          <StatCard icon="layers-outline" value={`${totalSets}`} label="Sets" />
          {totalVolume > 0 && (
            <StatCard icon="barbell-outline" value={`${Math.round(totalVolume)}`} label="Vol (kg)" />
          )}
          <StatCard icon="body-outline" value={`${exercisesCompleted}`} label="Exercises" />
        </View>

        {/* Feedback pill */}
        {feedbackMeta && (
          <View style={[styles.feedbackCard, { borderColor: `${feedbackMeta.color}40` }]}>
            <Ionicons name={feedbackMeta.icon} size={20} color={feedbackMeta.color} />
            <View style={styles.feedbackText}>
              <Text style={styles.feedbackTitle}>Session Feedback</Text>
              <Text style={[styles.feedbackValue, { color: feedbackMeta.color }]}>
                {feedbackMeta.label}
              </Text>
            </View>
          </View>
        )}

        {/* Exercise breakdown */}
        {sessionData?.exercises && sessionData.exercises.length > 0 && (
          <View style={styles.exerciseBreakdown}>
            <Text style={styles.breakdownTitle}>Exercise Summary</Text>
            {sessionData.exercises.map((ex) => {
              const completedCount = wasCompleted
                ? (ex.sets ?? 0)
                : (ex.logs ?? []).filter(l => l.status === 'COMPLETED' || l.status === 'SKIPPED').length;
              return (
                <View key={ex.sessionExerciseId} style={styles.exRow}>
                  <View style={styles.exLeft}>
                    <Text style={styles.exName} numberOfLines={1}>{ex.name ?? 'Exercise'}</Text>
                    <Text style={styles.exMeta}>{completedCount} / {ex.sets ?? 0} sets</Text>
                  </View>
                  {completedCount >= (ex.sets ?? 0) && (
                    <Ionicons name="checkmark-circle" size={18} color={colors.success} />
                  )}
                </View>
              );
            })}
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* CTA */}
      <View style={styles.ctaContainer}>
        <TouchableOpacity
          onPress={() => navigation.popToTop()}
          activeOpacity={0.85}
          style={styles.ctaWrapper}
        >
          <LinearGradient
            colors={gradientColors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.ctaButton}
          >
            <Ionicons name="calendar-outline" size={18} color="#fff" />
            <Text style={styles.ctaText}>Back to Schedule</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
  },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 16 },
  errorText: { color: colors.textSecondary, fontSize: 14, textAlign: 'center' },
  retryBtn: { backgroundColor: colors.bgCard, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 28, borderWidth: 1, borderColor: colors.cardBorder },
  retryText: { color: colors.textAccent, fontWeight: '600', fontSize: 15 },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingTop: 4,
    paddingBottom: 0,
  },
  summaryBackBtn: {
    padding: 8,
  },
  scroll: {
    padding: 24,
    alignItems: 'center',
    gap: 24,
  },
  heroSection: {
    alignItems: 'center',
    gap: 10,
    marginTop: 20,
  },
  trophyCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: colors.textPrimary,
    fontSize: 26,
    fontWeight: '800',
    marginTop: 4,
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 15,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
    justifyContent: 'center',
    width: '100%',
  },
  statCard: {
    backgroundColor: colors.bgCard,
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
    gap: 6,
    minWidth: '22%',
    flex: 1,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  statValue: {
    color: colors.textPrimary,
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
  },
  statLabel: {
    color: colors.textSecondary,
    fontSize: 11,
    textAlign: 'center',
  },
  // Feedback card
  feedbackCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    width: '100%',
    backgroundColor: colors.bgCard,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
  },
  feedbackText: {
    gap: 2,
  },
  feedbackTitle: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  feedbackValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  // Exercise breakdown
  exerciseBreakdown: {
    width: '100%',
    backgroundColor: colors.bgCard,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    gap: 2,
  },
  breakdownTitle: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  exRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  exLeft: {
    flex: 1,
    gap: 2,
  },
  exName: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  exMeta: {
    color: colors.textSecondary,
    fontSize: 12,
  },
  // CTA
  ctaContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    paddingBottom: 36,
    backgroundColor: colors.bgPrimary,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  ctaWrapper: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 16,
  },
  ctaText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
  },
});
