/**
 * MonthSection — Groups workout history cards under a month header.
 *
 * Props:
 *   monthLabel  {string}                  — e.g. "February 2026"
 *   entries     {WorkoutHistoryEntry[]}   — history entries for this month
 */
import React from 'react';
import { View } from 'react-native';
import { SectionHeader } from '../common/SectionHeader';
import HistoryCard from './HistoryCard';

export default function MonthSection({ monthLabel, entries }) {
  return (
    <View>
      <SectionHeader title={monthLabel} />
      {entries.map(entry => (
        <HistoryCard key={entry.id} entry={entry} />
      ))}
    </View>
  );
}
