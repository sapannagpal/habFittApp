/**
 * Animated shimmer skeleton placeholder.
 * Uses built-in Animated API (not reanimated — incompatible with Expo Go managed).
 * Pulses opacity between 0.3 and 0.7 in a loop.
 */
import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { colors } from '../../theme/colors';

// ─── Component ────────────────────────────────────────────────────────────────

export default function ShimmerBox({ width, height, borderRadius, style }) {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.7,
          duration: 750,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 750,
          useNativeDriver: true,
        }),
      ]),
    );
    pulse.start();
    return () => pulse.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        styles.shimmer,
        {
          width:        width ?? '100%',
          height:       height ?? 20,
          borderRadius: borderRadius ?? 8,
          opacity,
        },
        style,
      ]}
    />
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  shimmer: {
    backgroundColor: colors.bgCard,
  },
});
