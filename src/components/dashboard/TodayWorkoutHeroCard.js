/**
 * TodayWorkoutHeroCard — Rich workout card shown on dashboard when an active plan
 * has a workout scheduled for today.
 *
 * Props:
 *   session   {WorkoutSession}  — today's workout session
 *   planName  {string}          — name of the active plan
 *   onStart   {function}        — called when user taps "Start Workout"
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import GradientButton from '../common/GradientButton';

export default function TodayWorkoutHeroCard({ session, planName, onStart }) {
  return (
    <View style={styles.card}>
      {/* Top accent strip */}
      <LinearGradient
        colors={[colors.gradientStart, colors.gradientEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.topStrip}
      />

      <View style={styles.body}>
        {/* Plan label */}
        <Text style={styles.planLabel} numberOfLines={1}>
          {planName.toUpperCase()}
        </Text>

        {/* Session name */}
        <Text style={styles.sessionName} numberOfLines={2}>
          {session.name}
        </Text>

        {/* Meta row */}
        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Ionicons name="time-outline" size={14} color={colors.textSecondary} />
            <Text style={styles.metaText}>{session.estimatedMinutes} min</Text>
          </View>
          <View style={styles.metaDot} />
          <View style={styles.metaItem}>
            <Ionicons name="barbell-outline" size={14} color={colors.textSecondary} />
            <Text style={styles.metaText}>
              {session.exercises ? session.exercises.length : 0} exercises
            </Text>
          </View>
        </View>

        {/* CTA */}
        <GradientButton
          label="Start Workout"
          onPress={onStart}
          style={styles.ctaBtn}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.bgCard,
    borderRadius: 20,
    marginHorizontal: 16,
    overflow: 'hidden',
  },
  topStrip: {
    height: 4,
  },
  body: {
    padding: 20,
  },
  planLabel: {
    color: colors.textAccent,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.5,
    marginBottom: 6,
  },
  sessionName: {
    color: colors.textPrimary,
    fontSize: 22,
    fontWeight: '700',
    lineHeight: 28,
    marginBottom: 12,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  metaDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: colors.textSecondary,
    marginHorizontal: 10,
  },
  metaText: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  ctaBtn: {
    // inherits full-width from parent
  },
});
