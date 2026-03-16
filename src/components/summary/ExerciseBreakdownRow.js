/**
 * ExerciseBreakdownRow — A single exercise result row in the workout summary.
 *
 * Props:
 *   exercise  {object}  — exercise summary entry:
 *     { name, setsCompleted, bestSetReps, bestSetWeightKg, isPR }
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../theme/colors';
import { GradientBadge } from '../common/GradientBadge';

export default function ExerciseBreakdownRow({ exercise }) {
  return (
    <View style={styles.row}>
      <View style={styles.left}>
        <Text style={styles.name}>{exercise.name}</Text>
        <Text style={styles.sets}>{exercise.setsCompleted} sets</Text>
      </View>
      <View style={styles.right}>
        <Text style={styles.best}>
          {exercise.bestSetReps} × {exercise.bestSetWeightKg}kg
        </Text>
        {exercise.isPR ? <GradientBadge label="PR" small /> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  left: {},
  name: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '600',
  },
  sets: {
    color: colors.textSecondary,
    fontSize: 13,
    marginTop: 2,
  },
  right: {
    alignItems: 'flex-end',
    gap: 4,
  },
  best: {
    color: colors.textSecondary,
    fontSize: 13,
  },
});
