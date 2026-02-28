/**
 * LogoMark — habFitt brand logo rendered in React Native.
 *
 * Renders the H-lightning bolt mark as a styled View,
 * paired with the "HAB" + "FITT" wordmark in the correct brand treatment.
 *
 * Usage:
 *   <LogoMark size="md" />   // header size
 *   <LogoMark size="lg" />   // hero size
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, gradientColors } from '../theme/colors';

const SIZE_MAP = {
  sm: { mark: 28, font: 18, gap: 8 },
  md: { mark: 36, font: 22, gap: 10 },
  lg: { mark: 52, font: 30, gap: 12 },
};

export default function LogoMark({ size = 'md' }) {
  const s = SIZE_MAP[size] ?? SIZE_MAP.md;
  const boltSize = s.mark * 0.45;

  return (
    <View style={[styles.row, { gap: s.gap }]}>
      {/* H-mark: gradient square with lightning bolt cutout */}
      <LinearGradient
        colors={gradientColors}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={[
          styles.mark,
          { width: s.mark, height: s.mark, borderRadius: s.mark * 0.18 },
        ]}
      >
        <Text style={[styles.bolt, { fontSize: boltSize }]}>⚡</Text>
      </LinearGradient>

      {/* Wordmark: HAB (outlined) + FITT (solid orange) */}
      <View style={styles.wordmarkRow}>
        <Text style={[styles.hab, { fontSize: s.font }]}>HAB</Text>
        <Text style={[styles.fitt, { fontSize: s.font }]}>FITT</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mark: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  bolt: {
    lineHeight: undefined,
    includeFontPadding: false,
  },
  wordmarkRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  hab: {
    fontWeight: '800',
    fontStyle: 'italic',
    color: 'rgba(255,255,255,0.75)',
    letterSpacing: 1,
  },
  fitt: {
    fontWeight: '800',
    fontStyle: 'italic',
    color: colors.textAccent,
    letterSpacing: 1,
  },
});
