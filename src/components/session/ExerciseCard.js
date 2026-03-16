/**
 * ExerciseCard — Displays exercise name, target muscles, and a placeholder illustration.
 *
 * Props:
 *   exercise  {Exercise}  — exercise object from the session
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';

export default function ExerciseCard({ exercise }) {
  const muscles = [
    exercise.primaryMuscle,
    ...(exercise.secondaryMuscles || []),
  ].slice(0, 3);

  return (
    <View style={styles.card}>
      {/* Exercise name */}
      <Text style={styles.name}>{exercise.name}</Text>

      {/* Muscle chips */}
      <View style={styles.muscleRow}>
        {muscles.map((m, i) => (
          <View key={i} style={styles.muscleChip}>
            <Text style={styles.muscleText}>{m}</Text>
          </View>
        ))}
      </View>

      {/* Placeholder illustration area */}
      <View style={styles.illustration}>
        <Ionicons name="body-outline" size={56} color={colors.bgSecondary} />
      </View>

      {/* Optional coach note */}
      {exercise.notes ? (
        <View style={styles.noteRow}>
          <Ionicons
            name="information-circle-outline"
            size={14}
            color={colors.textSecondary}
          />
          <Text style={styles.noteText}>{exercise.notes}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.bgCard,
    borderRadius: 16,
    marginHorizontal: 16,
    padding: 16,
    marginBottom: 12,
  },
  name: {
    color: colors.textPrimary,
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  muscleRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  muscleChip: {
    backgroundColor: 'rgba(255,107,0,0.12)',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  muscleText: {
    color: colors.textAccent,
    fontSize: 12,
    fontWeight: '600',
  },
  illustration: {
    height: 110,
    backgroundColor: colors.bgSecondary,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noteRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 4,
    marginTop: 10,
  },
  noteText: {
    color: colors.textSecondary,
    fontSize: 13,
    fontStyle: 'italic',
    flex: 1,
  },
});
