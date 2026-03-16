/**
 * PlanCatalogueScreen — Browse and filter workout plan presets.
 * Shows preset cards immediately (no async loading needed).
 * Marks the active preset based on activePlan.templateId.
 */
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { PLAN_PRESETS } from '../config/planPresets';
import { useWorkout } from '../context/WorkoutContext';
import PlanCard from '../components/workout/PlanCard';
import FilterChipsRow from '../components/workout/FilterChipsRow';

const FILTERS = [
  { id: 'Beginner',     label: 'Beginner',     icon: 'leaf-outline' },
  { id: 'Intermediate', label: 'Intermediate', icon: 'fitness-outline' },
  { id: 'Advanced',     label: 'Advanced',     icon: 'flame-outline' },
];

export default function PlanCatalogueScreen() {
  const navigation = useNavigation();
  const { activePlan, isPlanLoading } = useWorkout();

  const [selectedFilter, setSelectedFilter] = useState(null);

  const filteredPresets = PLAN_PRESETS.filter(
    p => !selectedFilter || p.difficulty === selectedFilter,
  );

  const handlePresetPress = useCallback((presetId) => {
    navigation.navigate('PlanDetail', { presetId });
  }, [navigation]);

  const renderPlan = useCallback(({ item }) => (
    <PlanCard
      plan={item}
      isActive={item.templateId === activePlan?.templateId}
      onPress={() => handlePresetPress(item.id)}
    />
  ), [activePlan, handlePresetPress]);

  const keyExtractor = useCallback((item) => item.id, []);

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Workout Plans</Text>
        {isPlanLoading && (
          <ActivityIndicator size="small" color={colors.textAccent} />
        )}
      </View>

      {/* Filter chips */}
      <FilterChipsRow
        filters={FILTERS}
        selectedFilter={selectedFilter}
        onSelect={setSelectedFilter}
      />

      {/* Plan list */}
      <FlatList
        data={filteredPresets}
        renderItem={renderPlan}
        keyExtractor={keyExtractor}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No plans match your filter</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bgPrimary },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  headerTitle: { color: colors.textPrimary, fontSize: 24, fontWeight: '700' },
  listContent: { paddingTop: 8, paddingBottom: 24 },
  emptyContainer: { alignItems: 'center', paddingTop: 60, paddingHorizontal: 32 },
  emptyText: { color: colors.textSecondary, fontSize: 15, textAlign: 'center' },
});
