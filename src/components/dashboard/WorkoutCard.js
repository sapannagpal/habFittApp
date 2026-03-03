/**
 * Main workout action card — shown for WORKOUT and COMPLETED states.
 * Displays workout name, duration, exercise progress, and start/completed CTA.
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import GradientButton from '../common/GradientButton';

// ─── Component ────────────────────────────────────────────────────────────────

export default function WorkoutCard({ workout, isCompleted, onStart }) {
  const name              = workout?.name ?? 'Today\'s Workout';
  const estimatedDuration = workout?.estimatedDuration ?? 0;
  const totalExercises    = workout?.totalExercises ?? 0;
  const completedExercises = workout?.completedExercises ?? 0;

  return (
    <View style={styles.card} testID="workout-card">
      {/* Top row: name + duration chip */}
      <View style={styles.topRow}>
        <Text style={styles.workoutName} numberOfLines={2}>{name}</Text>
        <View style={styles.durationChip}>
          <Text style={styles.durationText}>{estimatedDuration} min</Text>
        </View>
      </View>

      {/* Exercise count */}
      <Text style={styles.exerciseCount}>
        {completedExercises} / {totalExercises} exercises
      </Text>

      {/* CTA */}
      {isCompleted ? (
        <View style={styles.completedBadge}>
          <Ionicons name="checkmark-circle" size={18} color={colors.success} />
          <Text style={styles.completedText}>Completed</Text>
        </View>
      ) : (
        <GradientButton
          label="Start Workout"
          onPress={onStart}
          style={styles.startButton}
          testID="start-workout-button"
        />
      )}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.bgCard,
    borderRadius:    16,
    padding:         20,
    marginHorizontal: 16,
    marginVertical:  8,
    borderWidth:     1,
    borderColor:     colors.cardBorder,
  },
  topRow: {
    flexDirection:  'row',
    alignItems:     'flex-start',
    justifyContent: 'space-between',
    marginBottom:   8,
  },
  workoutName: {
    color:      colors.textPrimary,
    fontSize:   20,
    fontWeight: '700',
    flex:       1,
    marginRight: 12,
  },
  durationChip: {
    backgroundColor: 'rgba(255,107,0,0.15)',
    borderRadius:    20,
    paddingHorizontal: 10,
    paddingVertical:   4,
    borderWidth:     1,
    borderColor:     'rgba(255,107,0,0.3)',
  },
  durationText: {
    color:      colors.textAccent,
    fontSize:   12,
    fontWeight: '600',
  },
  exerciseCount: {
    color:        colors.textSecondary,
    fontSize:     14,
    marginBottom: 16,
  },
  completedBadge: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'center',
    gap:            6,
    height:         52,
    borderRadius:   14,
    backgroundColor: 'rgba(16,185,129,0.1)',
    borderWidth:    1,
    borderColor:    'rgba(16,185,129,0.3)',
  },
  completedText: {
    color:      colors.success,
    fontSize:   16,
    fontWeight: '600',
  },
  startButton: {
    marginTop: 0,
  },
});
