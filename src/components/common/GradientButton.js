/**
 * Primary CTA button with orange gradient.
 * Uses expo-linear-gradient for the brand gradient fill.
 */
import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { gradientColors } from '../../theme/colors';

// ─── Component ────────────────────────────────────────────────────────────────

export default function GradientButton({ onPress, label, disabled, style, testID }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled ?? false}
      style={[styles.wrapper, disabled && styles.disabled, style]}
      activeOpacity={0.85}
      testID={testID}
    >
      <LinearGradient
        colors={gradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.gradient}
      >
        <Text style={styles.label}>{label}</Text>
      </LinearGradient>
    </TouchableOpacity>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  wrapper: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  disabled: {
    opacity: 0.5,
  },
  gradient: {
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  label: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
