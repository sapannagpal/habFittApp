/**
 * GradientBadge — Orange gradient pill badge with optional icon.
 *
 * Props:
 *   label   {string}   — display text
 *   icon    {string}   — optional Ionicons icon name, shown before label
 *   small   {boolean}  — reduces padding and font size for compact contexts
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';

export function GradientBadge({ label, icon, small = false }) {
  return (
    <LinearGradient
      colors={[colors.gradientStart, colors.gradientEnd]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={[
        styles.badge,
        small ? styles.badgeSmall : styles.badgeLarge,
      ]}
    >
      {icon ? (
        <Ionicons
          name={icon}
          size={small ? 10 : 12}
          color={colors.textPrimary}
          style={styles.icon}
        />
      ) : null}
      <Text style={[styles.label, small ? styles.labelSmall : styles.labelLarge]}>
        {label}
      </Text>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  badgeLarge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  badgeSmall: {
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  icon: {
    marginRight: 4,
  },
  label: {
    fontWeight: '700',
    color: colors.textPrimary,
  },
  labelLarge: {
    fontSize: 12,
  },
  labelSmall: {
    fontSize: 10,
  },
});
