/**
 * SessionCard — Displays a single workout session in the plan detail week schedule.
 *
 * Props:
 *   session     {WorkoutSession}  — session object
 *   isRestDay   {boolean}         — whether this is a rest day entry
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';

export default function SessionCard({ session, isRestDay }) {
  if (isRestDay || session.isRestDay) {
    return (
      <View style={styles.card}>
        <View style={styles.leftCol}>
          <Text style={styles.dayLabel}>{session.dayLabel}</Text>
        </View>
        <View style={styles.restContent}>
          <Ionicons name="moon-outline" size={16} color={colors.textSecondary} />
          <Text style={styles.restText}>Rest Day</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <View style={styles.leftCol}>
        <Text style={styles.dayLabel}>{session.dayLabel}</Text>
        <Text style={styles.sessionName} numberOfLines={2}>{session.name}</Text>
      </View>
      <View style={styles.rightCol}>
        <Text style={styles.duration}>{session.estimatedMinutes} min</Text>
        {session.muscleGroups && session.muscleGroups.length > 0 && (
          <View style={styles.muscleChips}>
            {session.muscleGroups.slice(0, 3).map((muscle) => (
              <View key={muscle} style={styles.muscleChip}>
                <Text style={styles.muscleChipText} numberOfLines={1}>{muscle}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.bgCard,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  leftCol: {
    flex: 1,
    marginRight: 12,
  },
  dayLabel: {
    color: colors.textAccent,
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sessionName: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '700',
  },
  restContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  restText: {
    color: colors.textSecondary,
    fontSize: 15,
    fontStyle: 'italic',
  },
  rightCol: {
    alignItems: 'flex-end',
    flexShrink: 0,
  },
  duration: {
    color: colors.textSecondary,
    fontSize: 13,
    marginBottom: 6,
  },
  muscleChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    justifyContent: 'flex-end',
  },
  muscleChip: {
    backgroundColor: 'rgba(255,107,0,0.1)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  muscleChipText: {
    color: colors.textAccent,
    fontSize: 11,
    fontWeight: '600',
  },
});
