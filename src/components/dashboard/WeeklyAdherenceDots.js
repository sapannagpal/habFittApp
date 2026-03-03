/**
 * 7-dot weekly adherence tracker.
 * Renders one circle per day with colour-coded status:
 * COMPLETED (green), MISSED (red), SCHEDULED (empty), REST (muted dash).
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../theme/colors';

// ─── Status Config ────────────────────────────────────────────────────────────

const STATUS_CONFIG = {
  COMPLETED: {
    background: colors.success,
    symbol:     '✓',
    symbolColor: '#FFFFFF',
  },
  MISSED: {
    background: colors.error,
    symbol:     '✗',
    symbolColor: '#FFFFFF',
  },
  SCHEDULED: {
    background:  colors.bgCard,
    symbol:      '',
    symbolColor: 'transparent',
    bordered:    true,
  },
  REST: {
    background:  colors.bgSecondary,
    symbol:      '—',
    symbolColor: colors.textSecondary,
  },
  TODAY: {
    background:  colors.textAccent,
    symbol:      '',
    symbolColor: 'transparent',
    bordered:    false,
  },
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function WeeklyAdherenceDots({ weeklyAdherence }) {
  const days = weeklyAdherence ?? [];

  return (
    <View style={styles.container}>
      <Text style={styles.sectionLabel}>THIS WEEK</Text>
      <View style={styles.dotsRow}>
        {days.map((item, index) => {
          const config = STATUS_CONFIG[item.status] ?? STATUS_CONFIG.SCHEDULED;
          return (
            <View key={index} style={styles.dayColumn}>
              <View
                style={[
                  styles.dot,
                  { backgroundColor: config.background },
                  config.bordered && styles.dotBordered,
                ]}
              >
                {config.symbol ? (
                  <Text style={[styles.symbol, { color: config.symbolColor }]}>
                    {config.symbol}
                  </Text>
                ) : null}
              </View>
              <Text style={styles.dayLabel}>{item.dayShort}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical:   12,
  },
  sectionLabel: {
    color:          colors.textSecondary,
    fontSize:       12,
    letterSpacing:  1,
    marginBottom:   10,
  },
  dotsRow: {
    flexDirection:  'row',
    justifyContent: 'space-between',
  },
  dayColumn: {
    alignItems: 'center',
    flex:       1,
  },
  dot: {
    width:         32,
    height:        32,
    borderRadius:  16,
    alignItems:    'center',
    justifyContent: 'center',
  },
  dotBordered: {
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  symbol: {
    fontSize:   12,
    fontWeight: '700',
  },
  dayLabel: {
    color:     colors.textSecondary,
    fontSize:  11,
    marginTop: 4,
  },
});
