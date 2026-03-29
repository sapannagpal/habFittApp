/**
 * ReplacePlanSheet — Bottom sheet confirmation when switching active workout plans.
 *
 * Props:
 *   visible      {boolean}          — controls sheet visibility
 *   currentPlan  {WorkoutPlan|null} — the currently active plan
 *   newPlan      {WorkoutPlan|null} — the plan the user wants to switch to
 *   onConfirm    {function}         — called when user confirms the switch
 *   onCancel     {function}         — called when user cancels
 */
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { BottomSheet } from '../common/BottomSheet';
import GradientButton from '../common/GradientButton';
import { MetaBadge } from '../common/MetaBadge';
import { colors } from '../../theme/colors';

export default function ReplacePlanSheet({
  visible,
  currentPlan,
  newPlan,
  onConfirm,
  onCancel,
}) {
  if (!currentPlan || !newPlan) return null;

  return (
    <BottomSheet visible={visible} onDismiss={onCancel}>
      <View style={styles.content}>
        {/* Title */}
        <Text style={styles.title}>Switch Plans?</Text>

        {/* Warning */}
        <Text style={styles.warning}>
          You'll lose your current progress in{' '}
          <Text style={styles.warningPlanName}>{currentPlan.name}</Text>.
        </Text>

        {/* Plan comparison */}
        <View style={styles.comparison}>
          {/* Current plan */}
          <View style={styles.planRow}>
            <Text style={styles.planRowLabel}>Current</Text>
            <View style={styles.planRowRight}>
              <Text style={styles.planRowName} numberOfLines={1}>{currentPlan.name}</Text>
              <MetaBadge
                label={currentPlan.difficulty}
                variant={currentPlan.difficulty ? currentPlan.difficulty.toLowerCase() : 'neutral'}
              />
            </View>
          </View>

          {/* Arrow */}
          <Text style={styles.arrow}>Replace with</Text>

          {/* New plan */}
          <View style={styles.planRow}>
            <Text style={styles.planRowLabel}>New</Text>
            <View style={styles.planRowRight}>
              <Text style={styles.planRowName} numberOfLines={1}>{newPlan.name}</Text>
              <MetaBadge
                label={newPlan.difficulty}
                variant={newPlan.difficulty ? newPlan.difficulty.toLowerCase() : 'neutral'}
              />
            </View>
          </View>
        </View>

        {/* CTA buttons */}
        <GradientButton
          label={`Start ${newPlan.name}`}
          onPress={onConfirm}
          style={styles.confirmBtn}
        />

        <TouchableOpacity
          style={styles.cancelBtn}
          onPress={onCancel}
          activeOpacity={0.7}
        >
          <Text style={styles.cancelBtnText}>
            Keep {currentPlan.name}
          </Text>
        </TouchableOpacity>
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 20,
    paddingBottom: 32,
    paddingTop: 8,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  warning: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 20,
  },
  warningPlanName: {
    color: colors.textPrimary,
    fontWeight: '600',
  },
  comparison: {
    backgroundColor: colors.bgSecondary,
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
    gap: 10,
  },
  planRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  planRowLabel: {
    color: colors.textSecondary,
    fontSize: 13,
    width: 52,
  },
  planRowRight: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  planRowName: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
    flexShrink: 1,
  },
  arrow: {
    color: colors.textSecondary,
    fontSize: 13,
    textAlign: 'center',
    fontStyle: 'italic',
    paddingVertical: 2,
  },
  confirmBtn: {
    marginBottom: 12,
  },
  cancelBtn: {
    alignItems: 'center',
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: 14,
  },
  cancelBtnText: {
    color: colors.textSecondary,
    fontSize: 15,
    fontWeight: '600',
  },
});
