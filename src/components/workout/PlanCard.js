/**
 * PlanCard — Displays a workout plan in the catalogue list.
 *
 * Props:
 *   plan      {WorkoutPlan}  — plan object from WORKOUT_PLANS
 *   isActive  {boolean}      — whether this is the currently active plan
 *   onPress   {function}     — tap handler
 */
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { MetaBadge } from '../common/MetaBadge';
import { GradientBadge } from '../common/GradientBadge';

export default function PlanCard({ plan, isActive, onPress }) {
  return (
    <TouchableOpacity
      style={[styles.card, isActive && styles.cardActive]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      {/* Active indicator: left orange border strip */}
      {isActive && (
        <LinearGradient
          colors={[colors.gradientStart, colors.gradientEnd]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={styles.activeBorderStrip}
        />
      )}

      {/* Thumbnail area */}
      <View style={[styles.thumbnail, { backgroundColor: plan.thumbnailColor }]}>
        {/* Gradient overlay at bottom of thumbnail */}
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.55)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={styles.thumbnailOverlay}
        />

        {/* Plan name and tagline */}
        <View style={styles.thumbnailContent}>
          <Text style={styles.planName} numberOfLines={1}>{plan.name}</Text>
          {plan.tagline ? (
            <Text style={styles.planTagline} numberOfLines={1}>{plan.tagline}</Text>
          ) : null}
        </View>

        {/* Active badge (top-right) */}
        {isActive && (
          <View style={styles.activeBadgeContainer}>
            <GradientBadge label="Active" small />
          </View>
        )}
      </View>

      {/* Meta row */}
      <View style={styles.metaRow}>
        <View style={styles.metaItem}>
          <Ionicons name="time-outline" size={13} color={colors.textSecondary} />
          <Text style={styles.metaText}>{plan.durationWeeks}w</Text>
        </View>
        <View style={styles.metaItem}>
          <Ionicons name="flash-outline" size={13} color={colors.textSecondary} />
          <Text style={styles.metaText}>{plan.sessionsPerWeek}x/wk</Text>
        </View>
        <View style={styles.metaItem}>
          <Ionicons name="barbell-outline" size={13} color={colors.textSecondary} />
          <Text style={styles.metaText}>{plan.estimatedMinutesPerSession}min</Text>
        </View>
        <MetaBadge
          label={plan.difficulty}
          variant={plan.difficulty ? plan.difficulty.toLowerCase() : 'neutral'}
        />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.bgCard,
    borderRadius: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    overflow: 'hidden',
    flexDirection: 'column',
  },
  cardActive: {
    borderWidth: 0,
  },
  activeBorderStrip: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    zIndex: 10,
  },
  thumbnail: {
    height: 80,
    justifyContent: 'flex-end',
  },
  thumbnailOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  thumbnailContent: {
    paddingHorizontal: 14,
    paddingBottom: 10,
  },
  planName: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 22,
  },
  planTagline: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 13,
    marginTop: 2,
  },
  activeBadgeContainer: {
    position: 'absolute',
    top: 10,
    right: 10,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 12,
    flexWrap: 'wrap',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    color: colors.textSecondary,
    fontSize: 13,
  },
});
