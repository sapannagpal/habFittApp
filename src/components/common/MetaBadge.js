/**
 * MetaBadge — Compact difficulty/category badge with variant-based coloring.
 *
 * Props:
 *   label    {string}                                              — display text (rendered uppercase)
 *   variant  {'beginner'|'intermediate'|'advanced'|'neutral'}     — controls background and text color
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../theme/colors';

const VARIANT_STYLES = {
  beginner: {
    backgroundColor: 'rgba(16,185,129,0.2)',
    color: '#10B981',
  },
  intermediate: {
    backgroundColor: 'rgba(251,191,36,0.2)',
    color: '#FBBF24',
  },
  advanced: {
    backgroundColor: 'rgba(239,68,68,0.2)',
    color: '#EF4444',
  },
  neutral: {
    backgroundColor: colors.bgCard,
    color: colors.textSecondary,
  },
};

export function MetaBadge({ label, variant = 'neutral' }) {
  const variantStyle = VARIANT_STYLES[variant] || VARIANT_STYLES.neutral;

  return (
    <View style={[styles.badge, { backgroundColor: variantStyle.backgroundColor }]}>
      <Text style={[styles.label, { color: variantStyle.color }]}>
        {label ? label.toUpperCase() : ''}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
