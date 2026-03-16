/**
 * WeekTabSelector — Horizontal scrollable week tabs for PlanDetailScreen.
 *
 * Props:
 *   totalWeeks    {number}              — total number of weeks in the plan
 *   selectedWeek  {number}              — 1-based currently selected week
 *   onSelect      {(week: number) => void} — called when a tab is tapped
 */
import React from 'react';
import { ScrollView, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../../theme/colors';

export default function WeekTabSelector({ totalWeeks, selectedWeek, onSelect }) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.content}
      style={styles.scroll}
    >
      {Array.from({ length: totalWeeks }, (_, i) => i + 1).map((week) => {
        const isSelected = week === selectedWeek;
        return (
          <View key={week} style={styles.tabWrap}>
            {isSelected ? (
              <TouchableOpacity onPress={() => onSelect(week)} activeOpacity={0.85}>
                <LinearGradient
                  colors={[colors.gradientStart, colors.gradientEnd]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.tabSelected}
                >
                  <Text style={styles.tabTextSelected}>Week {week}</Text>
                </LinearGradient>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.tabUnselected}
                onPress={() => onSelect(week)}
                activeOpacity={0.7}
              >
                <Text style={styles.tabTextUnselected}>Week {week}</Text>
              </TouchableOpacity>
            )}
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flexGrow: 0,
  },
  content: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  tabWrap: {
    marginRight: 8,
  },
  tabSelected: {
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  tabUnselected: {
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: 'transparent',
  },
  tabTextSelected: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  tabTextUnselected: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
});
