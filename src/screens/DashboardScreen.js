/**
 * HabFitt Daily Mission Dashboard — Post-login home screen.
 * Consumes GET /api/v1/dashboard from hf-ms-dashboard (port 8082).
 * Renders state-driven content: WORKOUT / REST_DAY / NO_PLAN / COMPLETED.
 */
import React, { useCallback } from 'react';
import {
  ScrollView,
  RefreshControl,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';
import { useDashboard } from '../hooks/useDashboard';
import { useAuth } from '../context/AuthContext';
import DashboardHeader      from '../components/dashboard/DashboardHeader';
import GreetingSection      from '../components/dashboard/GreetingSection';
import WorkoutCard          from '../components/dashboard/WorkoutCard';
import RestDayCard          from '../components/dashboard/RestDayCard';
import EmptyStateCard       from '../components/dashboard/EmptyStateCard';
import WeeklyAdherenceDots  from '../components/dashboard/WeeklyAdherenceDots';
import MiniStatsRow         from '../components/dashboard/MiniStatsRow';
import CoachNoteCard        from '../components/dashboard/CoachNoteCard';
import ShimmerBox           from '../components/common/ShimmerBox';

// ─── Loading Skeleton ─────────────────────────────────────────────────────────

function LoadingSkeleton() {
  return (
    <View style={styles.skeletonContainer} testID="loading-skeleton">
      <ShimmerBox height={24} width="60%" borderRadius={8} style={styles.shimmerItem} />
      <ShimmerBox height={16} width="40%" borderRadius={6} style={styles.shimmerItem} />
      <ShimmerBox height={160} borderRadius={16} style={styles.shimmerItem} />
      <ShimmerBox height={80}  borderRadius={16} style={styles.shimmerItem} />
      <ShimmerBox height={80}  borderRadius={12} style={styles.shimmerItem} />
    </View>
  );
}

// ─── Error View ───────────────────────────────────────────────────────────────

function ErrorView({ error, onRetry }) {
  return (
    <View style={styles.errorContainer} testID="error-view">
      <Text style={styles.errorText}>{error}</Text>
      <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
        <Text style={styles.retryText}>Retry</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── Main Card ────────────────────────────────────────────────────────────────

function MainCard({ state, today, onGoToWorkouts }) {
  if (state === 'REST_DAY') {
    return <RestDayCard />;
  }
  if (state === 'NO_PLAN') {
    return <EmptyStateCard onBrowsePlans={onGoToWorkouts} />;
  }
  // WORKOUT or COMPLETED
  return (
    <WorkoutCard
      workout={today?.workout}
      isCompleted={state === 'COMPLETED' || (today?.isCompleted ?? false)}
      onStart={onGoToWorkouts}
    />
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function DashboardScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { data, isLoading, isRefreshing, error, refresh } = useDashboard();

  const goToWorkouts = useCallback(
    () => navigation.navigate('Workouts'),
    [navigation],
  );

  const userInitial = user?.first_name?.[0]?.toUpperCase() ?? 'U';

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* Always-visible header — streak is 0 during loading */}
      <DashboardHeader
        streak={data?.streak?.current ?? 0}
        userInitial={userInitial}
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={refresh}
            tintColor={colors.textAccent}
          />
        }
      >
        {/* Loading state */}
        {isLoading && !data && <LoadingSkeleton />}

        {/* Error state */}
        {error && !data && <ErrorView error={error} onRetry={refresh} />}

        {/* Success state */}
        {data && (
          <>
            <GreetingSection greeting={data.greeting} />

            <MainCard
              state={data.state}
              today={data.today}
              onGoToWorkouts={goToWorkouts}
            />

            <WeeklyAdherenceDots weeklyAdherence={data.weeklyAdherence} />

            <MiniStatsRow stats={data.stats} />

            {data.coachNote ? (
              <CoachNoteCard note={data.coachNote} />
            ) : null}
          </>
        )}
      </ScrollView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex:            1,
    backgroundColor: colors.bgPrimary,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  skeletonContainer: {
    padding: 16,
    gap:     12,
  },
  shimmerItem: {
    width: '100%',
  },
  errorContainer: {
    flex:           1,
    alignItems:     'center',
    justifyContent: 'center',
    padding:        32,
    marginTop:      60,
  },
  errorText: {
    color:     colors.textSecondary,
    fontSize:  15,
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: colors.bgCard,
    borderRadius:    12,
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderWidth:     1,
    borderColor:     colors.cardBorder,
  },
  retryText: {
    color:      colors.textAccent,
    fontWeight: '600',
    fontSize:   15,
  },
});
