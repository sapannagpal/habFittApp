/**
 * Personalized greeting and today's date.
 * Displays the API-provided greeting string and the current date formatted as "Weekday, Month Day".
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../theme/colors';

// ─── Date Formatter ───────────────────────────────────────────────────────────

function formatTodayDate() {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month:   'long',
    day:     'numeric',
  });
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function GreetingSection({ greeting }) {
  return (
    <View style={styles.container}>
      <Text style={styles.greeting}>{greeting ?? ''}</Text>
      <Text style={styles.date}>{formatTodayDate()}</Text>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  greeting: {
    color:      colors.textPrimary,
    fontSize:   26,
    fontWeight: '700',
  },
  date: {
    color:      colors.textSecondary,
    fontSize:   14,
    marginTop:  4,
  },
});
