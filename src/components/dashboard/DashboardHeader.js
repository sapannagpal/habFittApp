/**
 * Top header bar: streak flame badge (left) + habFITT logo text (center) + avatar initial (right).
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';

// ─── Component ────────────────────────────────────────────────────────────────

export default function DashboardHeader({ streak, userInitial }) {
  return (
    <View style={styles.container}>
      {/* Left: flame streak badge */}
      <View style={styles.streakBadge}>
        <Ionicons name="flame" size={20} color={colors.textAccent} />
        <Text style={styles.streakNumber}>{streak ?? 0}</Text>
      </View>

      {/* Center: wordmark */}
      <Text style={styles.wordmark}>
        <Text style={styles.wordmarkHab}>hab</Text>
        <Text style={styles.wordmarkFitt}>FITT</Text>
      </Text>

      {/* Right: user initial avatar */}
      <View style={styles.avatar}>
        <Text style={styles.avatarInitial}>{userInitial ?? 'U'}</Text>
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.bgPrimary,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  streakNumber: {
    color: colors.textAccent,
    fontSize: 16,
    fontWeight: '700',
  },
  wordmark: {
    fontSize: 18,
    fontWeight: '800',
    fontStyle: 'italic',
  },
  wordmarkHab: {
    color: colors.textPrimary,
  },
  wordmarkFitt: {
    color: colors.textAccent,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.bgCard,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
});
