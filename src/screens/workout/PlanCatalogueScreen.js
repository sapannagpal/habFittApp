/**
 * Plan Catalogue — entry point to the workout flow.
 * On mount: checks for an active plan.
 *   - Active plan found → replaces with WeeklyScheduleScreen.
 *   - No active plan (404) → shows Generate Plan form.
 *
 * POST /plans/generate replaces the old template catalogue.
 * The user fills in fitness preferences and the service
 * generates a personalised plan immediately.
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  StyleSheet,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, gradientColors } from '../../theme/colors';
import { workoutApi } from '../../api/workoutApi';

// ─── Constants ────────────────────────────────────────────────────────────────

const FITNESS_GOALS = [
  { value: 'BUILD_MUSCLE',       label: 'Build Muscle' },
  { value: 'LOSE_FAT',           label: 'Lose Fat' },
  { value: 'IMPROVE_STRENGTH',   label: 'Improve Strength' },
  { value: 'ENDURANCE',          label: 'Endurance' },
  { value: 'FLEXIBILITY',        label: 'Flexibility' },
];

const EXPERIENCE_LEVELS = [
  { value: 'BEGINNER',     label: 'Beginner' },
  { value: 'INTERMEDIATE', label: 'Intermediate' },
  { value: 'ADVANCED',     label: 'Advanced' },
];

const SESSION_DURATIONS = [15, 30, 45, 60, 90, 120];

const DAYS_OPTIONS = [1, 2, 3, 4, 5, 6, 7];

const WORKOUT_FORMATS = [
  { value: 'STRENGTH', label: 'Strength' },
  { value: 'HIIT',     label: 'HIIT' },
  { value: 'YOGA',     label: 'Yoga' },
  { value: 'MOBILITY', label: 'Mobility' },
  { value: 'PILATES',  label: 'Pilates' },
];

// ─── Picker Row ───────────────────────────────────────────────────────────────
// A horizontal pill-selector used for goal, level, duration, and days/week.

function PillPicker({ options, value, onChange }) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={pillStyles.row}
    >
      {options.map((opt) => {
        const selected = opt.value === value;
        return (
          <TouchableOpacity
            key={opt.value}
            onPress={() => onChange(opt.value)}
            activeOpacity={0.7}
            style={[pillStyles.pill, selected && pillStyles.pillSelected]}
          >
            {selected ? (
              <LinearGradient
                colors={gradientColors}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={pillStyles.pillGradient}
              >
                <Text style={[pillStyles.pillText, pillStyles.pillTextSelected]}>
                  {opt.label}
                </Text>
              </LinearGradient>
            ) : (
              <Text style={pillStyles.pillText}>{opt.label}</Text>
            )}
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const pillStyles = StyleSheet.create({
  row: {
    paddingRight: 4,
    gap: 8,
    flexDirection: 'row',
  },
  pill: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    backgroundColor: colors.bgCard,
    overflow: 'hidden',
  },
  pillSelected: {
    borderColor: 'transparent',
  },
  pillGradient: {
    paddingHorizontal: 16,
    paddingVertical: 9,
  },
  pillText: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '500',
    paddingHorizontal: 16,
    paddingVertical: 9,
  },
  pillTextSelected: {
    color: '#fff',
    fontWeight: '700',
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
});

// ─── Form Field ───────────────────────────────────────────────────────────────

function FormField({ label, children, hint }) {
  return (
    <View style={fieldStyles.field}>
      <View style={fieldStyles.labelRow}>
        <Text style={fieldStyles.label}>{label}</Text>
        {hint ? <Text style={fieldStyles.hint}>{hint}</Text> : null}
      </View>
      {children}
    </View>
  );
}

const fieldStyles = StyleSheet.create({
  field: {
    gap: 10,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  label: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  hint: {
    color: colors.textSecondary,
    fontSize: 12,
  },
});

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function PlanCatalogueScreen({ navigation }) {
  // Bootstrap loading — checking for existing active plan
  const [bootstrapping, setBootstrapping] = useState(true);
  const [bootstrapError, setBootstrapError] = useState(null);

  // Form state
  const [goal, setGoal]           = useState('BUILD_MUSCLE');
  const [level, setLevel]         = useState('INTERMEDIATE');
  const [format, setFormat]       = useState('STRENGTH');
  const [daysPerWeek, setDays]    = useState(4);
  const [duration, setDuration]   = useState(45);
  const [bodyWeightKg, setWeight] = useState('');

  // Submission state
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError]     = useState(null);

  // ── Bootstrap: check for existing active plan ──────────────────────────────
  const checkActivePlan = useCallback(async () => {
    try {
      setBootstrapping(true);
      setBootstrapError(null);
      const { data: activePlan } = await workoutApi.getActivePlan();
      if (activePlan?.id) {
        navigation.replace('WeeklySchedule', { planId: activePlan.id, plan: activePlan });
        // Don't clear bootstrapping — screen is being replaced
        return;
      }
    } catch (e) {
      if (e.response?.status !== 404) {
        // Unexpected error — show retry
        setBootstrapError('Could not check for existing plans. Check your connection.');
      }
      // 404 = no active plan → fall through to show form
    } finally {
      setBootstrapping(false);
    }
  }, [navigation]);

  useEffect(() => {
    checkActivePlan();
  }, [checkActivePlan]);

  // ── Generate plan ──────────────────────────────────────────────────────────
  const handleGenerate = async () => {
    setGenerating(true);
    setGenError(null);
    try {
      const payload = {
        fitnessGoal: goal,
        experienceLevel: level,
        preferredFormat: format,
        daysPerWeek,
        sessionDurationMinutes: duration,
        bodyWeightKg: bodyWeightKg ? parseFloat(bodyWeightKg) : undefined,
      };
      const { data: plan } = await workoutApi.generatePlan(payload);
      navigation.replace('WeeklySchedule', { planId: plan.id, plan });
    } catch (e) {
      setGenError('Could not generate your plan. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  // ── Render: bootstrapping ──────────────────────────────────────────────────
  if (bootstrapping) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.textAccent} />
          <Text style={styles.loadingText}>Checking your plan…</Text>
        </View>
      </SafeAreaView>
    );
  }

  // ── Render: bootstrap error ────────────────────────────────────────────────
  if (bootstrapError) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <Ionicons name="alert-circle-outline" size={40} color={colors.textSecondary} />
          <Text style={styles.errorText}>{bootstrapError}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={checkActivePlan}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ── Render: generate plan form ─────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Build Your Plan</Text>
          <Text style={styles.headerSub}>
            Tell us about yourself and we'll generate a personalised programme.
          </Text>
        </View>

        {/* Form card */}
        <View style={styles.formCard}>
          {/* Fitness Goal */}
          <FormField label="Fitness Goal">
            <PillPicker
              options={FITNESS_GOALS}
              value={goal}
              onChange={setGoal}
            />
          </FormField>

          <View style={styles.divider} />

          {/* Experience Level */}
          <FormField label="Experience Level">
            <PillPicker
              options={EXPERIENCE_LEVELS}
              value={level}
              onChange={setLevel}
            />
          </FormField>

          <View style={styles.divider} />

          {/* Workout Format */}
          <FormField label="Workout Format">
            <PillPicker
              options={WORKOUT_FORMATS}
              value={format}
              onChange={setFormat}
            />
          </FormField>

          <View style={styles.divider} />

          {/* Days per week */}
          <FormField label="Days per Week" hint={`${daysPerWeek} day${daysPerWeek > 1 ? 's' : ''}`}>
            <PillPicker
              options={DAYS_OPTIONS.map((d) => ({ value: d, label: String(d) }))}
              value={daysPerWeek}
              onChange={setDays}
            />
          </FormField>

          <View style={styles.divider} />

          {/* Session duration */}
          <FormField label="Session Duration" hint={`${duration} min`}>
            <PillPicker
              options={SESSION_DURATIONS.map((m) => ({ value: m, label: `${m} min` }))}
              value={duration}
              onChange={setDuration}
            />
          </FormField>

          <View style={styles.divider} />

          {/* Body weight */}
          <FormField label="Body Weight (kg)" hint="Optional">
            <TextInput
              style={styles.weightInput}
              value={bodyWeightKg}
              onChangeText={setWeight}
              keyboardType="decimal-pad"
              placeholder="e.g. 75"
              placeholderTextColor={colors.textSecondary}
              returnKeyType="done"
            />
          </FormField>
        </View>

        {/* Inline error */}
        {genError ? (
          <View style={styles.errorRow}>
            <Ionicons name="alert-circle-outline" size={16} color={colors.error} />
            <Text style={styles.genErrorText}>{genError}</Text>
          </View>
        ) : null}

        {/* Spacer for fixed CTA */}
        <View style={{ height: 96 }} />
      </ScrollView>

      {/* Generate CTA */}
      <View style={styles.ctaContainer}>
        <TouchableOpacity
          onPress={handleGenerate}
          disabled={generating}
          activeOpacity={0.85}
          style={styles.ctaWrapper}
        >
          <LinearGradient
            colors={gradientColors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.ctaButton}
          >
            {generating ? (
              <>
                <ActivityIndicator color="#fff" size="small" />
                <Text style={styles.ctaText}>Generating…</Text>
              </>
            ) : (
              <>
                <Ionicons name="flash" size={18} color="#fff" />
                <Text style={styles.ctaText}>Generate My Plan</Text>
              </>
            )}
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
  loadingText: {
    color: colors.textSecondary,
    fontSize: 14,
    marginTop: 4,
  },
  scroll: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
    gap: 16,
  },
  header: {
    paddingHorizontal: 4,
    gap: 6,
  },
  headerTitle: {
    color: colors.textPrimary,
    fontSize: 26,
    fontWeight: '800',
  },
  headerSub: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 19,
  },
  formCard: {
    backgroundColor: colors.bgCard,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    gap: 20,
  },
  divider: {
    height: 1,
    backgroundColor: colors.divider,
  },
  weightInput: {
    backgroundColor: colors.bgSecondary,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 12 : 10,
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '500',
    borderWidth: 1,
    borderColor: colors.divider,
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 4,
  },
  errorText: {
    color: colors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
  },
  genErrorText: {
    color: colors.error,
    fontSize: 13,
    flex: 1,
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
    padding: 16,
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
