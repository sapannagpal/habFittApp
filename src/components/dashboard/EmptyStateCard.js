/**
 * No active plan card — shown when dashboard state === "NO_PLAN".
 * Prompts user to browse the workout plan catalogue.
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import GradientButton from '../common/GradientButton';

// ─── Component ────────────────────────────────────────────────────────────────

export default function EmptyStateCard({ onBrowsePlans }) {
  return (
    <View style={styles.card} testID="empty-state-card">
      <Ionicons name="fitness" size={48} color={colors.textSecondary} />
      <Text style={styles.title}>No Active Plan</Text>
      <Text style={styles.body}>
        Pick a workout plan to see your daily mission here.
      </Text>
      <GradientButton
        label="Browse Plans"
        onPress={onBrowsePlans}
        style={styles.button}
        testID="browse-plans-button"
      />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  card: {
    backgroundColor:  colors.bgCard,
    borderRadius:     16,
    padding:          24,
    marginHorizontal: 16,
    marginVertical:   8,
    alignItems:       'center',
    borderWidth:      1,
    borderColor:      colors.cardBorder,
  },
  title: {
    color:      colors.textPrimary,
    fontSize:   20,
    fontWeight: '700',
    marginTop:  12,
  },
  body: {
    color:      colors.textSecondary,
    fontSize:   14,
    textAlign:  'center',
    marginTop:  8,
  },
  button: {
    marginTop:   20,
    alignSelf:   'stretch',
  },
});
