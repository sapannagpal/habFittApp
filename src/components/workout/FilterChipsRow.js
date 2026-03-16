/**
 * FilterChipsRow — Horizontal scrollable row of filter chips.
 *
 * Props:
 *   filters         {Array<{id, label, icon?}>}  — list of filter configs (excludes "All")
 *   selectedFilter  {string|null}                 — currently selected filter id, or null for "All"
 *   onSelect        {(id) => void}                — called with filter id, or null for "All"
 */
import React from 'react';
import { ScrollView, View, StyleSheet } from 'react-native';
import { FilterChip } from '../common/FilterChip';

export default function FilterChipsRow({ filters, selectedFilter, onSelect }) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.content}
      style={styles.scroll}
    >
      {/* "All" chip — always first */}
      <View style={styles.chipWrap}>
        <FilterChip
          label="All"
          selected={selectedFilter === null}
          onPress={() => onSelect(null)}
        />
      </View>

      {filters.map((filter) => (
        <View key={filter.id} style={styles.chipWrap}>
          <FilterChip
            label={filter.label}
            icon={filter.icon}
            selected={selectedFilter === filter.id}
            onPress={() => onSelect(filter.id)}
          />
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flexGrow: 0,
    flexShrink: 0,
    height: 52,
  },
  content: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  chipWrap: {
    marginRight: 8,
  },
});
