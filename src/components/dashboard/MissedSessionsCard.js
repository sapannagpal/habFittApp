/**
 * MissedSessionsCard — Shown on dashboard when the user has missed recent workout sessions.
 *
 * Props:
 *   onGetBackOnTrack  {function}  — called when user taps the CTA
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import GradientButton from '../common/GradientButton';

export default function MissedSessionsCard({ onGetBackOnTrack }) {
  return (
    <View style={styles.card}>
      {/* Warning icon */}
      <Ionicons
        name="warning-outline"
        size={32}
        color={colors.textAccent}
        style={styles.icon}
      />

      {/* Title */}
      <Text style={styles.title}>You've missed some sessions</Text>

      {/* Subtitle */}
      <Text style={styles.subtitle}>
        Life happens. Let's get back on track today.
      </Text>

      {/* CTA */}
      <GradientButton
        label="Get Back On Track"
        onPress={onGetBackOnTrack}
        style={styles.ctaBtn}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.bgCard,
    borderRadius: 20,
    marginHorizontal: 16,
    padding: 20,
    alignItems: 'flex-start',
  },
  icon: {
    marginBottom: 12,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
    lineHeight: 24,
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 20,
  },
  ctaBtn: {
    alignSelf: 'stretch',
  },
});
