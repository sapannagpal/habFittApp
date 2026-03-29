/**
 * EndWorkoutSheet — Bottom sheet asking the user to confirm ending the session early.
 *
 * Props:
 *   visible         {boolean}   — controls sheet visibility
 *   elapsedSeconds  {number}    — session duration so far in seconds
 *   completedSets   {number}    — number of sets completed so far
 *   onFinishEarly   {function}  — user confirms ending early
 *   onKeepGoing     {function}  — user dismisses and continues
 */
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { BottomSheet } from '../common/BottomSheet';
import GradientButton from '../common/GradientButton';
import { colors } from '../../theme/colors';
import { formatTime } from '../../utils/workoutUtils';

export default function EndWorkoutSheet({
  visible,
  elapsedSeconds,
  completedSets,
  onFinishEarly,
  onKeepGoing,
}) {
  return (
    <BottomSheet visible={visible} onDismiss={onKeepGoing}>
      <View style={styles.content}>
        <Text style={styles.title}>End Workout?</Text>

        {/* Stats summary */}
        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{formatTime(elapsedSeconds)}</Text>
            <Text style={styles.statLabel}>Duration</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{completedSets}</Text>
            <Text style={styles.statLabel}>Sets Done</Text>
          </View>
        </View>

        {/* Keep going — primary CTA */}
        <GradientButton
          label="Keep Going"
          onPress={onKeepGoing}
          style={styles.btn}
        />

        {/* Finish early — destructive secondary action */}
        <TouchableOpacity style={styles.finishBtn} onPress={onFinishEarly}>
          <Text style={styles.finishText}>Finish Early</Text>
        </TouchableOpacity>
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 24,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 20,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  stat: {
    flex: 1,
    backgroundColor: colors.bgSecondary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  statValue: {
    color: colors.textPrimary,
    fontSize: 22,
    fontWeight: '700',
  },
  statLabel: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 4,
  },
  btn: {
    marginBottom: 12,
  },
  finishBtn: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  finishText: {
    color: colors.error,
    fontSize: 15,
    fontWeight: '600',
  },
});
