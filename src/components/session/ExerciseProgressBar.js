/**
 * ExerciseProgressBar — Segmented progress bar showing exercise completion.
 *
 * Props:
 *   total    {number}  — total number of exercises in the session
 *   current  {number}  — 1-based index of the current exercise
 */
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, gradientColors } from '../../theme/colors';

export default function ExerciseProgressBar({ total, current }) {
  return (
    <View style={styles.container}>
      {Array.from({ length: total }, (_, i) => {
        const segIndex = i + 1;
        if (segIndex < current) {
          // Completed segment
          return <View key={i} style={[styles.segment, styles.completed]} />;
        }
        if (segIndex === current) {
          // Active segment — gradient fill
          return (
            <LinearGradient
              key={i}
              colors={gradientColors}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.segment}
            />
          );
        }
        // Remaining segment
        return <View key={i} style={[styles.segment, styles.remaining]} />;
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginVertical: 8,
    gap: 4,
  },
  segment: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },
  completed: {
    backgroundColor: colors.textAccent,
  },
  remaining: {
    backgroundColor: colors.bgCard,
  },
});
