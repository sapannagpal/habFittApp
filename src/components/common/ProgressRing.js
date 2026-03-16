/**
 * ProgressRing — Pure React Native circular progress ring.
 *
 * Uses the two-half-circle rotation technique to render an arc without SVG.
 *
 * Props:
 *   progress     {number}  — 0.0 to 1.0
 *   size         {number}  — outer diameter in dp
 *   strokeWidth  {number}  — ring thickness in dp
 *   color        {string}  — optional ring color (defaults to gradientMid orange)
 */
import React from 'react';
import { View } from 'react-native';
import { colors } from '../../theme/colors';

export function ProgressRing({ progress = 0, size = 120, strokeWidth = 10, color }) {
  const ringColor = color || colors.gradientMid;
  const bgColor = colors.bgSecondary;

  // Clamp progress to [0, 1]
  const clampedProgress = Math.min(1, Math.max(0, progress));

  // Total arc in degrees
  const rotation = clampedProgress * 360;

  // Right half covers 0–180°, left half covers 180–360°
  const firstHalfAngle = Math.min(rotation, 180);
  const secondHalfAngle = Math.max(0, rotation - 180);

  const halfSize = size / 2;
  const innerSize = size - strokeWidth * 2;
  const innerRadius = innerSize / 2;

  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: halfSize,
        backgroundColor: bgColor,
      }}
    >
      {/* Background full-circle border (gray track) */}
      <View
        style={{
          position: 'absolute',
          width: size,
          height: size,
          borderRadius: halfSize,
          borderWidth: strokeWidth,
          borderColor: bgColor,
        }}
      />

      {/* Right half — visible when progress > 0% */}
      {firstHalfAngle > 0 && (
        <View
          style={{
            position: 'absolute',
            width: halfSize,
            height: size,
            overflow: 'hidden',
            left: halfSize,
          }}
        >
          <View
            style={{
              position: 'absolute',
              width: size,
              height: size,
              borderRadius: halfSize,
              borderWidth: strokeWidth,
              borderColor: ringColor,
              left: -halfSize,
              transform: [{ rotate: `${firstHalfAngle}deg` }],
            }}
          />
        </View>
      )}

      {/* Left half — visible when progress > 50% */}
      {secondHalfAngle > 0 && (
        <View
          style={{
            position: 'absolute',
            width: halfSize,
            height: size,
            overflow: 'hidden',
            left: 0,
          }}
        >
          <View
            style={{
              position: 'absolute',
              width: size,
              height: size,
              borderRadius: halfSize,
              borderWidth: strokeWidth,
              borderColor: ringColor,
              left: 0,
              transform: [{ rotate: `${secondHalfAngle}deg` }],
            }}
          />
        </View>
      )}

      {/* Inner circle overlay — punches out the centre to create the ring effect */}
      <View
        style={{
          position: 'absolute',
          top: strokeWidth,
          left: strokeWidth,
          width: innerSize,
          height: innerSize,
          borderRadius: innerRadius,
          backgroundColor: colors.bgPrimary,
          justifyContent: 'center',
          alignItems: 'center',
        }}
      />
    </View>
  );
}
