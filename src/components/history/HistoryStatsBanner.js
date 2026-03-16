/**
 * HistoryStatsBanner — Shows total workout count and this month's count.
 *
 * Props:
 *   totalWorkouts   {number}  — all-time completed workout count
 *   thisMonthCount  {number}  — workouts completed this calendar month
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';

export default function HistoryStatsBanner({ totalWorkouts, thisMonthCount }) {
  return (
    <View style={styles.row}>
      <View style={styles.tile}>
        <Ionicons name="barbell-outline" size={20} color={colors.textAccent} />
        <Text style={styles.value}>{totalWorkouts}</Text>
        <Text style={styles.label}>Total Workouts</Text>
      </View>
      <View style={styles.tile}>
        <Ionicons name="calendar-outline" size={20} color={colors.textAccent} />
        <Text style={styles.value}>{thisMonthCount}</Text>
        <Text style={styles.label}>This Month</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 8,
    marginHorizontal: 16,
    marginBottom: 8,
  },
  tile: {
    flex: 1,
    backgroundColor: colors.bgCard,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    gap: 4,
  },
  value: {
    color: colors.textPrimary,
    fontSize: 24,
    fontWeight: '700',
  },
  label: {
    color: colors.textSecondary,
    fontSize: 12,
  },
});
