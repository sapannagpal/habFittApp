/**
 * Motivational coach insight card at the bottom of the dashboard.
 * Displays a contextual tip or encouragement from the backend.
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';

// ─── Component ────────────────────────────────────────────────────────────────

export default function CoachNoteCard({ note }) {
  return (
    <View style={styles.card}>
      <Ionicons
        name="bulb"
        size={24}
        color={colors.gradientMid}
        style={styles.icon}
      />
      <Text style={styles.note}>{note ?? ''}</Text>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  card: {
    flexDirection:    'row',
    marginHorizontal: 16,
    marginBottom:     16,
    backgroundColor:  colors.bgCard,
    borderRadius:     16,
    padding:          16,
    borderWidth:      1,
    borderColor:      colors.cardBorder,
    alignItems:       'flex-start',
  },
  icon: {
    marginRight: 12,
    alignSelf:   'flex-start',
  },
  note: {
    color:      colors.textSecondary,
    fontSize:   14,
    lineHeight: 21,
    flex:       1,
  },
});
