/**
 * Row of 3 mini stat cards.
 * Displays: workouts this week, total workouts, days remaining in plan.
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../theme/colors';

// ─── StatCard ─────────────────────────────────────────────────────────────────

function StatCard({ value, label }) {
  return (
    <View style={styles.card}>
      <Text style={styles.value}>{value ?? '—'}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function MiniStatsRow({ stats }) {
  const workoutsThisWeek = stats?.workoutsThisWeek ?? '—';
  const totalWorkouts    = stats?.totalWorkouts    ?? '—';
  const daysRemaining    = stats?.daysRemaining    ?? null;

  return (
    <View style={styles.row}>
      <StatCard value={workoutsThisWeek} label="This Week" />
      <StatCard value={totalWorkouts}    label="Total" />
      <StatCard value={daysRemaining ?? '—'} label="Days Left" />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  row: {
    flexDirection:    'row',
    paddingHorizontal: 16,
    paddingVertical:   8,
    gap:               8,
  },
  card: {
    flex:            1,
    backgroundColor: colors.bgCard,
    borderRadius:    12,
    padding:         12,
    alignItems:      'center',
    borderWidth:     1,
    borderColor:     colors.cardBorder,
  },
  value: {
    color:      colors.textPrimary,
    fontSize:   22,
    fontWeight: '700',
  },
  label: {
    color:      colors.textSecondary,
    fontSize:   11,
    marginTop:  2,
    textAlign:  'center',
  },
});
