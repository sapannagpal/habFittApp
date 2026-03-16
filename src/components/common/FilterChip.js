/**
 * FilterChip — Selectable pill-shaped filter tag.
 *
 * Props:
 *   label     {string}   — display text
 *   selected  {boolean}  — if true, shows gradient background + white text
 *   onPress   {function} — tap handler
 *   icon      {string}   — optional Ionicons icon name, shown before label
 */
import React from 'react';
import { TouchableOpacity, Text, View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';

export function FilterChip({ label, selected, onPress, icon }) {
  if (selected) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
        <LinearGradient
          colors={[colors.gradientStart, colors.gradientEnd]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.chip}
        >
          {icon ? (
            <Ionicons
              name={icon}
              size={13}
              color={colors.textPrimary}
              style={styles.icon}
            />
          ) : null}
          <Text style={styles.labelSelected}>{label}</Text>
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7} style={styles.chipUnselected}>
      {icon ? (
        <Ionicons
          name={icon}
          size={13}
          color={colors.textSecondary}
          style={styles.icon}
        />
      ) : null}
      <Text style={styles.labelUnselected}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  chipUnselected: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    backgroundColor: 'transparent',
  },
  icon: {
    marginRight: 4,
  },
  labelSelected: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  labelUnselected: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
});
