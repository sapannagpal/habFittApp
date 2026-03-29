/**
 * SetsTable — Renders the complete sets table for a single exercise.
 *
 * Props:
 *   exercise        {Exercise}        — exercise object with sets/reps/defaultWeightKg
 *   setLogs         {SetLogEntry[]}   — array of log entries for this exercise
 *   weightUnit      {string}          — 'kg' or 'lbs'
 *   onCompleteSet   {function}        — (setIndex, reps, weight) => void
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../theme/colors';
import SetRow from './SetRow';

export default function SetsTable({ exercise, setLogs, weightUnit, onCompleteSet }) {
  return (
    <View style={styles.container}>
      {/* Column headers */}
      <View style={[styles.row, styles.headerRow]}>
        <Text style={[styles.headerCell, { width: 28 }]}>Set</Text>
        <Text style={[styles.headerCell, { width: 60, textAlign: 'center' }]}>Prev</Text>
        <Text style={[styles.headerCell, { width: 58, textAlign: 'center' }]}>Reps</Text>
        <Text style={[styles.headerCell, { flex: 1, textAlign: 'center' }]}>Weight</Text>
        <Text style={[styles.headerCell, { width: 36 }]}>{''}</Text>
      </View>

      <View style={styles.divider} />

      {/* Set rows */}
      {Array.from({ length: exercise.sets }, (_, i) => (
        <SetRow
          key={i}
          setIndex={i}
          defaultReps={exercise.reps}
          defaultWeightKg={exercise.defaultWeightKg}
          weightUnit={weightUnit}
          logEntry={setLogs?.[i] || null}
          onComplete={onCompleteSet}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.bgCard,
    borderRadius: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  headerRow: {
    paddingVertical: 10,
  },
  headerCell: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  divider: {
    height: 1,
    backgroundColor: colors.divider,
    marginHorizontal: 16,
  },
});
