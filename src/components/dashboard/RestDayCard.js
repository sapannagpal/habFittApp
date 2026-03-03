/**
 * Rest day card — shown when dashboard state === "REST_DAY".
 * Encourages recovery with a calming visual and restAccent accent.
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';

// ─── Component ────────────────────────────────────────────────────────────────

export default function RestDayCard() {
  return (
    <View style={styles.card} testID="rest-day-card">
      <Ionicons name="moon" size={40} color={colors.restAccent} />
      <Text style={styles.title}>Rest Day</Text>
      <Text style={styles.body}>
        Recovery is part of the process.{'\n'}Your body grows when you rest.
      </Text>
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
    borderLeftWidth:  3,
    borderLeftColor:  colors.restAccent,
    borderWidth:      1,
    borderColor:      colors.cardBorder,
  },
  title: {
    color:      colors.textPrimary,
    fontSize:   22,
    fontWeight: '700',
    marginTop:  12,
  },
  body: {
    color:      colors.textSecondary,
    fontSize:   14,
    lineHeight: 22,
    textAlign:  'center',
    marginTop:  8,
  },
});
