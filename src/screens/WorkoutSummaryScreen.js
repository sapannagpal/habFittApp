/**
 * WorkoutSummaryScreen — Post-workout celebration and stats breakdown.
 *
 * Route params: { summary } — summary object returned by completeSession()
 *
 * Summary shape:
 *   { sessionName, durationSeconds, totalSets, totalVolumeKg, setLogs }
 */
import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';
import { useWorkout } from '../context/WorkoutContext';
import { formatDuration, formatVolume } from '../utils/workoutUtils';
import CelebrationRing from '../components/summary/CelebrationRing';
import SummaryStatCard from '../components/summary/SummaryStatCard';
import ExerciseBreakdownRow from '../components/summary/ExerciseBreakdownRow';
import { SectionHeader } from '../components/common/SectionHeader';
import GradientButton from '../components/common/GradientButton';

export default function WorkoutSummaryScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const { weightUnit } = useWorkout();

  const { summary } = route.params || {};

  // Guard: no summary data
  if (!summary) {
    return (
      <View
        style={[
          styles.root,
          { paddingTop: insets.top, alignItems: 'center', justifyContent: 'center' },
        ]}
      >
        <Text style={styles.loadingText}>No summary available.</Text>
        <TouchableOpacity
          style={styles.doneBtnFallback}
          onPress={() => navigation.navigate('Main')}
        >
          <Text style={styles.doneBtnFallbackText}>Go Home</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const {
    sessionName,
    planName,
    durationSeconds,
    totalSets,
    totalVolumeKg,
    newStreak = 1,
    exercises = [],
    setLogs = {},
  } = summary;

  // Build exercise list from setLogs if no explicit exercises array
  const exerciseList = exercises.length > 0
    ? exercises
    : Object.entries(setLogs).map(([exerciseId, logs]) => {
        const completedLogs = logs.filter(l => l.isCompleted);
        const bestLog = completedLogs.reduce(
          (best, l) => (l.weightKg > (best?.weightKg || 0) ? l : best),
          null,
        );
        return {
          exerciseId,
          name: exerciseId,
          setsCompleted: completedLogs.length,
          bestSetReps: bestLog?.reps || 0,
          bestSetWeightKg: bestLog?.weightKg || 0,
          isPR: false,
        };
      });

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headingText}>Workout Complete!</Text>
          {planName ? (
            <Text style={styles.planNameText}>{planName}</Text>
          ) : null}
          {sessionName ? (
            <Text style={styles.sessionNameText}>{sessionName}</Text>
          ) : null}
        </View>

        {/* Celebration ring */}
        <View style={styles.ringContainer}>
          <CelebrationRing icon="checkmark" />
        </View>

        {/* Streak row */}
        <Text style={styles.streakText}>
          {'\uD83D\uDD25'} {newStreak} Day Streak!
        </Text>

        {/* 2x2 Stats grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statsRow}>
            <SummaryStatCard
              icon="time-outline"
              value={formatDuration(durationSeconds)}
              label="Duration"
            />
            <SummaryStatCard
              icon="barbell-outline"
              value={String(totalSets)}
              label="Total Sets"
            />
          </View>
          <View style={styles.statsRow}>
            <SummaryStatCard
              icon="flash-outline"
              value={formatVolume(totalVolumeKg, weightUnit)}
              label="Volume"
            />
            <SummaryStatCard
              icon="checkmark-circle-outline"
              value={String(exerciseList.length)}
              label="Exercises"
            />
          </View>
        </View>

        {/* Exercise breakdown */}
        {exerciseList.length > 0 ? (
          <>
            <SectionHeader title="Exercise Breakdown" />
            <View style={styles.breakdownCard}>
              {exerciseList.map((ex, i) => (
                <ExerciseBreakdownRow
                  key={ex.exerciseId || i}
                  exercise={ex}
                />
              ))}
            </View>
          </>
        ) : null}
      </ScrollView>

      {/* Fixed bottom actions */}
      <View
        style={[
          styles.bottomActions,
          { bottom: insets.bottom + 16 },
        ]}
      >
        <GradientButton
          label="Done"
          onPress={() => navigation.navigate('Main')}
        />
        <TouchableOpacity style={styles.shareBtn}>
          <Text style={styles.shareText}>Share Workout</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 140,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 8,
  },
  headingText: {
    color: colors.textPrimary,
    fontSize: 24,
    fontWeight: '700',
  },
  planNameText: {
    color: colors.textAccent,
    fontSize: 13,
    marginTop: 4,
  },
  sessionNameText: {
    color: colors.textSecondary,
    fontSize: 13,
    marginTop: 2,
  },
  ringContainer: {
    alignSelf: 'center',
    marginVertical: 32,
  },
  streakText: {
    color: colors.textAccent,
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 24,
  },
  statsGrid: {
    marginHorizontal: 12,
    gap: 0,
  },
  statsRow: {
    flexDirection: 'row',
  },
  breakdownCard: {
    backgroundColor: colors.bgCard,
    borderRadius: 16,
    marginHorizontal: 16,
    overflow: 'hidden',
  },
  bottomActions: {
    position: 'absolute',
    left: 16,
    right: 16,
  },
  shareBtn: {
    alignItems: 'center',
    paddingVertical: 12,
    marginTop: 4,
  },
  shareText: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  loadingText: {
    color: colors.textSecondary,
    fontSize: 15,
  },
  doneBtnFallback: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: colors.bgCard,
    borderRadius: 12,
  },
  doneBtnFallbackText: {
    color: colors.textAccent,
    fontWeight: '600',
  },
});
