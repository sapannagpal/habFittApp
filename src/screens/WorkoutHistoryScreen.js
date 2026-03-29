/**
 * WorkoutHistoryScreen — Shows all completed workout sessions grouped by month.
 * Fetches from hf_ms_workout /sessions/history with pagination.
 */
import React, { useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';
import useWorkoutHistory from '../hooks/useWorkoutHistory';
import HistoryStatsBanner from '../components/history/HistoryStatsBanner';
import MonthSection from '../components/history/MonthSection';

export default function WorkoutHistoryScreen() {
  const insets = useSafeAreaInsets();
  const { items, isLoading, error, hasMore, isLoadingMore, loadMore } = useWorkoutHistory();

  const { totalWorkouts, thisMonthCount, groupedArray } = useMemo(() => {
    const now = new Date();
    const total = items.length;
    const thisMonth = items.filter(e => {
      const d = new Date(e.date);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length;

    const grouped = {};
    items.forEach(entry => {
      const d = new Date(entry.date);
      const key = d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(entry);
    });

    const arr = Object.entries(grouped)
      .sort((a, b) => new Date(b[1][0].date) - new Date(a[1][0].date))
      .map(([month, entries]) => ({
        month,
        entries: entries.sort((a, b) => new Date(b.date) - new Date(a.date)),
      }));

    return { totalWorkouts: total, thisMonthCount: thisMonth, groupedArray: arr };
  }, [items]);

  if (isLoading) {
    return (
      <View style={[styles.root, styles.centered, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={colors.textAccent} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.root, styles.centered, { paddingTop: insets.top }]}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <Text style={styles.title}>Workout History</Text>

      <FlatList
        data={groupedArray}
        keyExtractor={(item) => item.month}
        renderItem={({ item }) => (
          <View style={styles.monthSection}>
            <MonthSection monthLabel={item.month} entries={item.entries} />
          </View>
        )}
        ListHeaderComponent={
          <HistoryStatsBanner
            totalWorkouts={totalWorkouts}
            thisMonthCount={thisMonthCount}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No workout history yet. Complete your first session!</Text>
          </View>
        }
        ListFooterComponent={
          isLoadingMore ? (
            <ActivityIndicator
              size="small"
              color={colors.textAccent}
              style={styles.footerLoader}
            />
          ) : null
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.3}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bgPrimary },
  centered: { alignItems: 'center', justifyContent: 'center' },
  title: {
    color: colors.textPrimary,
    fontSize: 24,
    fontWeight: '700',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  content: { paddingBottom: 24 },
  monthSection: { paddingHorizontal: 16 },
  emptyContainer: { alignItems: 'center', paddingTop: 60, paddingHorizontal: 32 },
  emptyText: { color: colors.textSecondary, fontSize: 15, textAlign: 'center', lineHeight: 22 },
  errorText: { color: '#FF4444', fontSize: 15, textAlign: 'center', paddingHorizontal: 24 },
  footerLoader: { marginVertical: 16 },
});
