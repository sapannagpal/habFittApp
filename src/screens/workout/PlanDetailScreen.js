/**
 * Plan Overview — repurposed from the old "Plan Detail" template viewer.
 * There are no longer template catalogues to browse; this screen now shows
 * the user's active plan summary from GET /plans/active.
 *
 * Navigation into this screen from any old route still works cleanly.
 * If there's no active plan, we redirect back to PlanCatalogue.
 */
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, gradientColors } from '../../theme/colors';
import { workoutApi } from '../../api/workoutApi';
import { useWorkout } from '../../context/WorkoutContext';

// ─── Info Row ─────────────────────────────────────────────────────────────────

function InfoRow({ icon, label, value }) {
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoLeft}>
        <Ionicons name={icon} size={18} color={colors.textAccent} />
        <Text style={styles.infoLabel}>{label}</Text>
      </View>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

// ─── Stat Box ─────────────────────────────────────────────────────────────────

function StatBox({ value, label }) {
  return (
    <View style={styles.statBox}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function PlanDetailScreen({ navigation }) {
  const { clearActivePlan } = useWorkout();
  const [plan, setPlan]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const [abandoning, setAbandoning] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await workoutApi.getActivePlan();
        if (!cancelled) {
          if (data?.id) {
            setPlan(data);
          } else {
            // No active plan — redirect to generate flow
            navigation.replace('PlanCatalogue');
          }
        }
      } catch (e) {
        if (cancelled) return;
        if (e.response?.status === 404) {
          navigation.replace('PlanCatalogue');
        } else {
          setError('Could not load plan details. Please try again.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [navigation]);

  const handleGoToSchedule = () => {
    if (!plan) return;
    navigation.navigate('WeeklySchedule', { planId: plan.id, plan });
  };

  const handleAbandon = async () => {
    setAbandoning(true);
    try {
      await workoutApi.abandonActivePlan();
      clearActivePlan();
      navigation.replace('PlanCatalogue');
    } catch (e) {
      if (__DEV__) console.warn('[PlanDetail] abandonPlan failed:', e.response?.status, e.message);
      setError('Could not abandon plan. Please try again.');
    } finally {
      setAbandoning(false);
    }
  };

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.textAccent} />
        </View>
      </SafeAreaView>
    );
  }

  // ── Error ──────────────────────────────────────────────────────────────────
  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.center}>
          <Ionicons name="alert-circle-outline" size={40} color={colors.textSecondary} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => navigation.replace('PlanDetail')}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // plan is guaranteed non-null here (null case redirects above)
  const progressPct = plan.totalWeeks
    ? Math.round(((plan.currentWeek - 1) / plan.totalWeeks) * 100)
    : 0;

  const startedDate = plan.createdAt
    ? new Date(plan.createdAt).toLocaleDateString(undefined, {
        year: 'numeric', month: 'short', day: 'numeric',
      })
    : '—';

  const statusLabel = plan.status
    ? plan.status.charAt(0) + plan.status.slice(1).toLowerCase()
    : '—';

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.container}>
      {/* Back */}
      <TouchableOpacity
        style={styles.backBtn}
        onPress={() => navigation.goBack()}
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
      >
        <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
      </TouchableOpacity>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
        <View style={styles.hero}>
          <Text style={styles.planName}>{plan.programmeName ?? 'My Plan'}</Text>
          <Text style={styles.planFormat}>
            {plan.format?.replace(/_/g, ' ') ?? ''}
          </Text>
        </View>

        {/* Progress */}
        <View style={styles.progressCard}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressLabel}>Week Progress</Text>
            <Text style={styles.progressValue}>
              Week {plan.currentWeek ?? 1} of {plan.totalWeeks ?? '—'}
            </Text>
          </View>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${progressPct}%` }]} />
          </View>
          <Text style={styles.progressPct}>{progressPct}% complete</Text>
        </View>

        {/* Stats grid */}
        <View style={styles.statsGrid}>
          <StatBox value={plan.totalWeeks ?? '—'} label="Total Weeks" />
          <StatBox value={plan.currentWeek ?? 1} label="Current Week" />
          <StatBox value={statusLabel} label="Status" />
        </View>

        {/* Details */}
        <View style={styles.detailsCard}>
          <InfoRow
            icon="calendar-outline"
            label="Started"
            value={startedDate}
          />
          <View style={styles.divider} />
          <InfoRow
            icon="id-card-outline"
            label="Plan ID"
            value={String(plan.id ?? '—').slice(0, 8) + '…'}
          />
        </View>

        {/* Danger zone */}
        <TouchableOpacity
          style={styles.abandonBtn}
          onPress={handleAbandon}
          disabled={abandoning}
          activeOpacity={0.7}
        >
          {abandoning ? (
            <ActivityIndicator size="small" color={colors.error} />
          ) : (
            <>
              <Ionicons name="trash-outline" size={16} color={colors.error} />
              <Text style={styles.abandonText}>Abandon this Plan</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>

      {/* View Schedule CTA */}
      <View style={styles.ctaContainer}>
        <TouchableOpacity
          onPress={handleGoToSchedule}
          activeOpacity={0.85}
          style={styles.ctaWrapper}
        >
          <LinearGradient
            colors={gradientColors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.ctaButton}
          >
            <Ionicons name="calendar-outline" size={18} color="#fff" />
            <Text style={styles.ctaText}>View Weekly Schedule</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 16,
  },
  backBtn: {
    padding: 16,
    paddingBottom: 4,
  },
  scroll: {
    padding: 20,
    paddingTop: 4,
    paddingBottom: 120,
    gap: 20,
  },
  hero: {
    gap: 6,
  },
  planName: {
    color: colors.textPrimary,
    fontSize: 28,
    fontWeight: '800',
    lineHeight: 34,
  },
  planFormat: {
    color: colors.textAccent,
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  // Progress
  progressCard: {
    backgroundColor: colors.bgCard,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    gap: 10,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressLabel: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  progressValue: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: '700',
  },
  progressTrack: {
    height: 6,
    backgroundColor: colors.divider,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.textAccent,
    borderRadius: 3,
  },
  progressPct: {
    color: colors.textSecondary,
    fontSize: 12,
    textAlign: 'right',
  },
  // Stats
  statsGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  statBox: {
    flex: 1,
    backgroundColor: colors.bgCard,
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.cardBorder,
    gap: 4,
  },
  statValue: {
    color: colors.textPrimary,
    fontSize: 20,
    fontWeight: '800',
  },
  statLabel: {
    color: colors.textSecondary,
    fontSize: 11,
    marginTop: 2,
    textAlign: 'center',
  },
  // Details
  detailsCard: {
    backgroundColor: colors.bgCard,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    gap: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  infoLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  infoLabel: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  infoValue: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'right',
    flex: 1,
    marginLeft: 12,
  },
  divider: {
    height: 1,
    backgroundColor: colors.divider,
  },
  // Abandon
  abandonBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: `${colors.error}30`,
    backgroundColor: `${colors.error}08`,
  },
  abandonText: {
    color: colors.error,
    fontSize: 14,
    fontWeight: '600',
  },
  // Error
  errorText: {
    color: colors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
  },
  retryBtn: {
    backgroundColor: colors.bgCard,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  retryText: {
    color: colors.textAccent,
    fontWeight: '600',
    fontSize: 15,
  },
  // CTA
  ctaContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    paddingBottom: 36,
    backgroundColor: colors.bgPrimary,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  ctaWrapper: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 16,
  },
  ctaText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
  },
});
