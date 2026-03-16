/**
 * HistoryCard — A single workout history entry card.
 *
 * Props:
 *   entry  {WorkoutHistoryEntry}  — history entry from WORKOUT_HISTORY mock
 */
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { GradientBadge } from '../common/GradientBadge';
import { formatDuration } from '../../utils/workoutUtils';

export default function HistoryCard({ entry }) {
  const date = new Date(entry.date);
  const day = date.getDate();
  const month = date.toLocaleDateString('en-US', { month: 'short' });

  return (
    <TouchableOpacity style={styles.card} activeOpacity={0.8}>
      {/* Date column */}
      <View style={styles.dateCol}>
        <Text style={styles.day}>{day}</Text>
        <Text style={styles.month}>{month}</Text>
      </View>

      {/* Vertical divider */}
      <View style={styles.divider} />

      {/* Body */}
      <View style={styles.body}>
        {/* Title row with optional PR badge */}
        <View style={styles.titleRow}>
          <Text style={styles.sessionName} numberOfLines={1}>
            {entry.sessionName}
          </Text>
          {entry.hasPR ? <GradientBadge label="PR" small /> : null}
        </View>

        {/* Plan name */}
        <Text style={styles.planName}>{entry.planName}</Text>

        {/* Stats row */}
        <View style={styles.statsRow}>
          <Ionicons
            name="time-outline"
            size={13}
            color={colors.textSecondary}
          />
          <Text style={styles.stat}>{formatDuration(entry.durationSeconds)}</Text>
          <Ionicons
            name="barbell-outline"
            size={13}
            color={colors.textSecondary}
            style={styles.statIcon}
          />
          <Text style={styles.stat}>{entry.totalSets} sets</Text>
          <Ionicons
            name="flash-outline"
            size={13}
            color={colors.textSecondary}
            style={styles.statIcon}
          />
          <Text style={styles.stat}>{Math.round(entry.totalVolumeKg)}kg</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgCard,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
  },
  dateCol: {
    width: 40,
    alignItems: 'center',
  },
  day: {
    color: colors.textPrimary,
    fontSize: 20,
    fontWeight: '700',
  },
  month: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  divider: {
    width: 1,
    height: '100%',
    minHeight: 40,
    backgroundColor: colors.divider,
    marginHorizontal: 12,
  },
  body: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  sessionName: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
  },
  planName: {
    color: colors.textAccent,
    fontSize: 12,
    marginBottom: 6,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  stat: {
    color: colors.textSecondary,
    fontSize: 12,
    marginRight: 8,
  },
  statIcon: {
    marginRight: 2,
  },
});
