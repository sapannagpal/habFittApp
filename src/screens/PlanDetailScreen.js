/**
 * PlanDetailScreen — Browse a plan preset and start it.
 * Route params: { presetId: string }
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { getPresetById } from '../config/planPresets';
import { useWorkout } from '../context/WorkoutContext';
import PlanMetaRow from '../components/workout/PlanMetaRow';
import ReplacePlanSheet from '../components/workout/ReplacePlanSheet';
import GradientButton from '../components/common/GradientButton';
import { SectionHeader } from '../components/common/SectionHeader';

export default function PlanDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const { activePlan, isGenerating, planError, generatePlan, clearActivePlan } = useWorkout();

  const { presetId } = route.params || {};
  const preset = getPresetById(presetId);

  const [showReplaceSheet, setShowReplaceSheet] = useState(false);

  if (!preset) {
    return (
      <View style={[styles.root, { alignItems: 'center', justifyContent: 'center' }]}>
        <Text style={{ color: colors.textSecondary }}>Plan not found.</Text>
      </View>
    );
  }

  const isAlreadyActive = activePlan?.templateId === preset.templateId;

  const handleStartPlan = async () => {
    try {
      await generatePlan(preset);
      navigation.navigate('Home');
    } catch {
      // error is in planError state — shown in UI
    }
  };

  const handleReplacePlan = async () => {
    setShowReplaceSheet(false);
    clearActivePlan();
    await handleStartPlan();
  };

  const handleCtaPress = () => {
    if (activePlan && !isAlreadyActive) {
      setShowReplaceSheet(true);
    } else if (!activePlan) {
      handleStartPlan();
    }
  };

  const ctaLabel = activePlan && !isAlreadyActive
    ? 'Replace Current Plan'
    : 'Start This Plan';

  // Build a plan-like object for PlanMetaRow
  const planForMeta = {
    difficulty: preset.difficulty,
    durationWeeks: preset.totalWeeks,
    sessionsPerWeek: preset.sessionsPerWeek,
    estimatedMinutes: preset.estimatedMinutes,
  };

  return (
    <View style={styles.root}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
        <View style={[styles.hero, { backgroundColor: preset.thumbnailColor }]}>
          <LinearGradient
            colors={['rgba(0,0,0,0.0)', 'rgba(0,0,0,0.65)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={StyleSheet.absoluteFillObject}
          />
          <TouchableOpacity
            style={[styles.backBtn, { marginTop: insets.top }]}
            onPress={() => navigation.goBack()}
            activeOpacity={0.8}
          >
            <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.heroTitle} numberOfLines={2}>{preset.name}</Text>
        </View>

        {/* Meta badges row */}
        <PlanMetaRow plan={planForMeta} />

        {/* Description */}
        {preset.description ? (
          <Text style={styles.description}>{preset.description}</Text>
        ) : null}

        {/* Error */}
        {planError ? (
          <View style={styles.errorBanner}>
            <Ionicons name="alert-circle-outline" size={16} color={colors.error ?? '#FF4444'} />
            <Text style={styles.errorText}>{planError}</Text>
          </View>
        ) : null}

        {/* Weekly schedule section */}
        <SectionHeader title="Weekly Schedule" />

        {/* Static template sessions */}
        <View style={styles.sessionsList}>
          {preset.templateSessions.map((session, index) => (
            <View key={index} style={styles.templateSessionRow}>
              <View style={styles.dayLabelContainer}>
                <Text style={styles.dayLabel}>{session.dayLabel}</Text>
              </View>
              <View style={styles.sessionNameContainer}>
                <Ionicons name="barbell-outline" size={16} color={colors.textAccent} style={styles.sessionIcon} />
                <Text style={styles.sessionName}>{session.name}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Bottom spacer for fixed CTA */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Fixed bottom CTA */}
      {!isAlreadyActive && (
        <LinearGradient
          colors={['transparent', colors.bgPrimary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={[styles.ctaGradient, { paddingBottom: insets.bottom + 16 }]}
          pointerEvents="box-none"
        >
          {isGenerating ? (
            <View style={styles.generatingRow}>
              <ActivityIndicator size="small" color={colors.textAccent} />
              <Text style={styles.generatingText}>Building your plan...</Text>
            </View>
          ) : (
            <GradientButton label={ctaLabel} onPress={handleCtaPress} />
          )}
        </LinearGradient>
      )}

      {isAlreadyActive && (
        <LinearGradient
          colors={['transparent', colors.bgPrimary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={[styles.ctaGradient, { paddingBottom: insets.bottom + 16 }]}
          pointerEvents="box-none"
        >
          <View style={styles.activeCtaRow}>
            <Ionicons name="checkmark-circle" size={18} color={colors.success} />
            <Text style={styles.activeCtaText}>This is your active plan</Text>
          </View>
        </LinearGradient>
      )}

      {/* Replace plan bottom sheet */}
      <ReplacePlanSheet
        visible={showReplaceSheet}
        currentPlan={activePlan}
        newPlan={{ name: preset.name, difficulty: preset.difficulty }}
        onConfirm={handleReplacePlan}
        onCancel={() => setShowReplaceSheet(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bgPrimary },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 0 },
  hero: { height: 200, justifyContent: 'flex-end' },
  backBtn: {
    position: 'absolute',
    top: 0,
    left: 12,
    backgroundColor: 'rgba(0,0,0,0.35)',
    borderRadius: 20,
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTitle: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '700',
    paddingHorizontal: 16,
    paddingBottom: 16,
    lineHeight: 34,
  },
  description: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 22,
    marginHorizontal: 16,
    marginBottom: 4,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 16,
    marginTop: 8,
    padding: 12,
    backgroundColor: 'rgba(255,68,68,0.12)',
    borderRadius: 10,
  },
  errorText: { color: '#FF4444', fontSize: 13, flex: 1 },
  sessionsList: { paddingHorizontal: 16, marginTop: 8 },
  templateSessionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle ?? '#2A2A2A',
  },
  dayLabelContainer: { width: 100 },
  dayLabel: { color: colors.textSecondary, fontSize: 13, fontWeight: '500' },
  sessionNameContainer: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
  sessionIcon: {},
  sessionName: { color: colors.textPrimary, fontSize: 15, fontWeight: '600', flex: 1 },
  ctaGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 100,
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
  },
  generatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 18,
    backgroundColor: colors.bgCard,
    borderRadius: 14,
  },
  generatingText: { color: colors.textSecondary, fontSize: 15 },
  activeCtaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    backgroundColor: colors.bgCard,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: (colors.success ?? '#4CAF50') + '44',
  },
  activeCtaText: { color: colors.success ?? '#4CAF50', fontSize: 15, fontWeight: '600' },
});
