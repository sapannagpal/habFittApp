/**
 * PlanMetaRow — Horizontal scroll of plan metadata badges.
 *
 * Props:
 *   plan  {WorkoutPlan}  — plan object
 */
import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { MetaBadge } from '../common/MetaBadge';

export default function PlanMetaRow({ plan }) {
  const difficultyVariant = plan.difficulty ? plan.difficulty.toLowerCase() : 'neutral';

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.content}
      style={styles.scroll}
    >
      <View style={styles.badgeWrap}>
        <MetaBadge label={plan.difficulty} variant={difficultyVariant} />
      </View>
      <View style={styles.badgeWrap}>
        <MetaBadge label={`${plan.durationWeeks} weeks`} variant="neutral" />
      </View>
      <View style={styles.badgeWrap}>
        <MetaBadge label={`${plan.sessionsPerWeek}x / week`} variant="neutral" />
      </View>
      {plan.equipment && plan.equipment.length > 0 && (
        <View style={styles.badgeWrap}>
          <MetaBadge label={`${plan.equipment.length} Equipment`} variant="neutral" />
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flexGrow: 0,
  },
  content: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  badgeWrap: {
    marginRight: 8,
  },
});
