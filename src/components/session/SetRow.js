/**
 * SetRow — A single row in the sets table during an active session.
 *
 * Props:
 *   setIndex          {number}            — 0-based set index
 *   defaultReps       {string}            — default reps string e.g. '8-12' or '10'
 *   defaultWeightKg   {number}            — default weight in kg
 *   weightUnit        {string}            — 'kg' or 'lbs'
 *   logEntry          {SetLogEntry|null}  — existing log for this set (if any)
 *   onComplete        {function}          — (setIndex, reps, weight) => void
 */
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';

export default function SetRow({
  setIndex,
  defaultReps,
  defaultWeightKg,
  weightUnit,
  logEntry,
  onComplete,
}) {
  // Parse the upper bound of a rep range like '8-12' → '12', or use as-is
  const defaultRepsVal = defaultReps.includes('-')
    ? defaultReps.split('-')[1]
    : defaultReps;

  const [reps, setReps] = useState(
    logEntry?.reps?.toString() || defaultRepsVal,
  );
  const [weight, setWeight] = useState(
    logEntry?.weightKg?.toString() || defaultWeightKg.toString(),
  );

  const isCompleted = logEntry?.isCompleted || false;

  return (
    <View style={[styles.row, isCompleted && styles.completedRow]}>
      {/* Set number */}
      <Text style={styles.setNum}>{setIndex + 1}</Text>

      {/* Previous best — placeholder dash */}
      <Text style={styles.prev}>—</Text>

      {/* Reps input */}
      <TextInput
        style={[styles.input, styles.repsInput]}
        value={reps}
        onChangeText={setReps}
        keyboardType="numeric"
        editable={!isCompleted}
        selectTextOnFocus
      />

      {/* Weight input + unit */}
      <View style={styles.weightGroup}>
        <TextInput
          style={[styles.input, styles.weightInput]}
          value={weight}
          onChangeText={setWeight}
          keyboardType="decimal-pad"
          editable={!isCompleted}
          selectTextOnFocus
        />
        <Text style={styles.unit}>{weightUnit}</Text>
      </View>

      {/* Complete toggle */}
      <TouchableOpacity
        onPress={() => !isCompleted && onComplete(setIndex, reps, weight)}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Ionicons
          name={isCompleted ? 'checkmark-circle' : 'radio-button-off-outline'}
          size={28}
          color={isCompleted ? colors.success : colors.textSecondary}
        />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  completedRow: {
    backgroundColor: 'rgba(255,107,0,0.07)',
  },
  setNum: {
    color: colors.textSecondary,
    fontSize: 14,
    width: 28,
  },
  prev: {
    color: colors.textSecondary,
    fontSize: 13,
    width: 60,
    textAlign: 'center',
  },
  input: {
    backgroundColor: colors.bgSecondary,
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 8,
    color: colors.textPrimary,
    fontSize: 15,
    textAlign: 'center',
  },
  repsInput: {
    width: 58,
  },
  weightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
    justifyContent: 'center',
  },
  weightInput: {
    width: 64,
  },
  unit: {
    color: colors.textSecondary,
    fontSize: 12,
  },
});
