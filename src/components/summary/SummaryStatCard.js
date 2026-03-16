/**
 * SummaryStatCard — Single stat tile shown in the workout summary grid.
 *
 * Props:
 *   icon   {string}  — Ionicons icon name
 *   value  {string}  — formatted stat value
 *   label  {string}  — stat description label
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';

export default function SummaryStatCard({ icon, value, label }) {
  return (
    <View style={styles.card}>
      <Ionicons name={icon} size={24} color={colors.textAccent} />
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: colors.bgCard,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    margin: 4,
  },
  value: {
    color: colors.textPrimary,
    fontSize: 22,
    fontWeight: '700',
    marginTop: 6,
  },
  label: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 4,
  },
});
