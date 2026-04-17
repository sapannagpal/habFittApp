/**
 * Active Session — workout execution screen.
 * Shows exercises in order. User taps each set to log reps + weight.
 *
 * API changes vs hf-ms-workout 8083:
 *  - logSet: field names are now `reps`/`weightKg` (not actualReps/actualWeightKg)
 *  - skipSet: sends body { exerciseId, setNumber } to POST /sessions/{id}/sets/skip
 *  - completeSession: requires body { feedback } — user selects before completing
 *  - Exercise fields: sets/reps/weightKg/metricType/warmup/cooldown
 *    (no prescribedSets/prescribedReps/prescribedWeightKg/wasSwapped)
 *  - Log fields: reps/weightKg/status/setNumber/durationSeconds
 *    (no actualReps/actualWeightKg)
 *  - Exercise name lives at exercise.name (fallback label if absent)
 */
import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, gradientColors } from '../../theme/colors';
import { workoutApi } from '../../api/workoutApi';
import ExerciseSubstituteSheet from '../../components/workout/ExerciseSubstituteSheet';

// ─── Feedback options ─────────────────────────────────────────────────────────

const FEEDBACK_OPTIONS = [
  { value: 'TOO_EASY',   label: 'Too Easy',    icon: 'happy-outline' },
  { value: 'JUST_RIGHT', label: 'Just Right',  icon: 'thumbs-up-outline' },
  { value: 'TOO_HARD',   label: 'Too Hard',    icon: 'sad-outline' },
];

// ─── Feedback Modal ───────────────────────────────────────────────────────────

function FeedbackModal({ visible, onSelect, onDismiss }) {
  const [selected, setSelected] = useState('JUST_RIGHT');

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onDismiss}
    >
      <View style={modalStyles.backdrop}>
        <View style={modalStyles.sheet}>
          <Text style={modalStyles.title}>How was that session?</Text>
          <Text style={modalStyles.sub}>Your feedback helps adjust future workouts.</Text>

          <View style={modalStyles.optionList}>
            {FEEDBACK_OPTIONS.map((opt) => {
              const isSelected = selected === opt.value;
              return (
                <TouchableOpacity
                  key={opt.value}
                  style={[modalStyles.option, isSelected && modalStyles.optionSelected]}
                  onPress={() => setSelected(opt.value)}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={opt.icon}
                    size={22}
                    color={isSelected ? colors.textAccent : colors.textSecondary}
                  />
                  <Text style={[modalStyles.optionLabel, isSelected && modalStyles.optionLabelSelected]}>
                    {opt.label}
                  </Text>
                  {isSelected && (
                    <Ionicons name="checkmark-circle" size={18} color={colors.textAccent} style={modalStyles.check} />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          <TouchableOpacity
            onPress={() => onSelect(selected)}
            activeOpacity={0.85}
            style={modalStyles.ctaWrapper}
          >
            <LinearGradient
              colors={gradientColors}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={modalStyles.ctaButton}
            >
              <Ionicons name="checkmark-done" size={18} color="#fff" />
              <Text style={modalStyles.ctaText}>Complete Workout</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity onPress={onDismiss} style={modalStyles.cancelBtn}>
            <Text style={modalStyles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const modalStyles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.bgCard,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
    gap: 16,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
  },
  sub: {
    color: colors.textSecondary,
    fontSize: 13,
    textAlign: 'center',
    marginTop: -6,
  },
  optionList: {
    gap: 10,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    backgroundColor: colors.bgSecondary,
  },
  optionSelected: {
    borderColor: `${colors.textAccent}60`,
    backgroundColor: `${colors.textAccent}10`,
  },
  optionLabel: {
    flex: 1,
    color: colors.textSecondary,
    fontSize: 15,
    fontWeight: '500',
  },
  optionLabelSelected: {
    color: colors.textPrimary,
    fontWeight: '600',
  },
  check: {
    marginLeft: 'auto',
  },
  ctaWrapper: {
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: 4,
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
  cancelBtn: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  cancelText: {
    color: colors.textSecondary,
    fontSize: 14,
  },
});

// ─── Set Row ──────────────────────────────────────────────────────────────────

function SetRow({ set, exerciseId, sessionExerciseId, sessionId, ensureStarted, prescribedReps, prescribedWeight, onLogged }) {
  // Initialise from the new field names: reps / weightKg
  const [reps, setReps]     = useState(set.reps != null ? String(set.reps) : '');
  const [weight, setWeight] = useState(set.weightKg != null ? String(set.weightKg) : '');
  const [saving, setSaving] = useState(false);

  const isDone = set.status === 'COMPLETED' || set.status === 'SKIPPED';

  const handleLog = async () => {
    if (!reps || saving) return;
    setSaving(true);
    try {
      // Lazy-start: first log triggers POST /sessions/{id}/start
      await ensureStarted();
      // logSet(sessionId, { exerciseId, setNumber, reps, weightKg })
      const { data } = await workoutApi.logSet(sessionId, {
        exerciseId: exerciseId,
        setNumber:  set.setNumber,
        reps:       parseInt(reps, 10),
        weightKg:   weight ? parseFloat(weight) : null,
      });
      onLogged(data);
    } catch (e) {
      if (__DEV__) console.warn('[ActiveSession] logSet failed:', e.response?.status, e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleSkip = async () => {
    if (saving) return;
    setSaving(true);
    try {
      await ensureStarted();
      await workoutApi.skipSet(sessionId, {
        exerciseId: exerciseId,
        setNumber:  set.setNumber,
      });
      onLogged({ ...set, status: 'SKIPPED' });
    } catch (e) {
      if (__DEV__) console.warn('[ActiveSession] skipSet failed:', e.response?.status, e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={[styles.setRow, isDone && styles.setRowDone]}>
      {/* Set number */}
      <View style={[styles.setNumBox, isDone && styles.setNumBoxDone]}>
        {isDone ? (
          <Ionicons
            name={set.status === 'SKIPPED' ? 'remove' : 'checkmark'}
            size={14}
            color={set.status === 'SKIPPED' ? colors.textSecondary : colors.success}
          />
        ) : (
          <Text style={styles.setNum}>{set.setNumber}</Text>
        )}
      </View>

      {/* Inputs */}
      <View style={styles.setInputs}>
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>
            Reps {prescribedReps ? `(${prescribedReps})` : ''}
          </Text>
          <TextInput
            style={[styles.input, isDone && styles.inputDone]}
            value={reps}
            onChangeText={setReps}
            keyboardType="number-pad"
            placeholder={prescribedReps ? String(prescribedReps) : '—'}
            placeholderTextColor={colors.textSecondary}
            editable={!isDone}
          />
        </View>
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>
            kg {prescribedWeight ? `(${prescribedWeight})` : ''}
          </Text>
          <TextInput
            style={[styles.input, isDone && styles.inputDone]}
            value={weight}
            onChangeText={setWeight}
            keyboardType="decimal-pad"
            placeholder={prescribedWeight ? String(prescribedWeight) : '—'}
            placeholderTextColor={colors.textSecondary}
            editable={!isDone}
          />
        </View>
      </View>

      {/* Actions */}
      {!isDone && (
        <View style={styles.setActions}>
          {saving ? (
            <ActivityIndicator size="small" color={colors.textAccent} />
          ) : (
            <>
              <TouchableOpacity style={styles.logBtn} onPress={handleLog} disabled={!reps}>
                <Text style={[styles.logBtnText, !reps && styles.logBtnDisabled]}>Log</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleSkip} style={styles.skipBtn}>
                <Ionicons name="remove-circle-outline" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </>
          )}
        </View>
      )}
    </View>
  );
}

// ─── Exercise Card ────────────────────────────────────────────────────────────

function ExerciseCard({ exercise, sessionId, ensureStarted, onSetLogged, onSwapPress }) {
  // API contract (from GET /sessions/{id}/detail):
  //   exerciseId         — catalogue reference ID (used in logSet/skipSet payloads)
  //   sessionExerciseId  — this session's exercise row ID (used as React key + state match)
  const prescribedSets   = exercise.sets ?? 0;
  const prescribedReps   = exercise.reps ?? null;
  const prescribedWeight = exercise.weightKg ?? null;

  const completedSets = exercise.logs?.filter(
    (l) => l.status === 'COMPLETED' || l.status === 'SKIPPED',
  ).length ?? 0;
  const allDone = completedSets >= prescribedSets;

  // Build set list from logs + fill remaining prescribed sets
  const setList = [];
  for (let i = 1; i <= prescribedSets; i++) {
    const existing = exercise.logs?.find((l) => l.setNumber === i);
    setList.push(
      existing ?? {
        setNumber: i,
        reps:      null,
        weightKg:  null,
        status:    'PENDING',
      },
    );
  }

  // Build a readable meta line from available fields
  const metaParts = [];
  if (prescribedSets)   metaParts.push(`${prescribedSets} sets`);
  if (prescribedReps)   metaParts.push(`× ${prescribedReps} reps`);
  if (prescribedWeight) metaParts.push(`@ ${prescribedWeight} kg`);
  if (exercise.restSeconds) metaParts.push(`${exercise.restSeconds}s rest`);

  // Warmup / cooldown badges
  const isWarmup  = exercise.warmup;
  const isCooldown = exercise.cooldown;

  return (
    <View style={styles.exerciseCard}>
      <View style={styles.exerciseHeader}>
        <View style={styles.exerciseTitleRow}>
          {/* name is the exercise label from the API response */}
          <Text style={styles.exerciseName}>
            {exercise.name ?? `Exercise ${exercise.exerciseOrder ?? ''}`}
          </Text>
          {allDone && (
            <Ionicons name="checkmark-circle" size={18} color={colors.success} />
          )}
          {!allDone && (
            <TouchableOpacity
              onPress={() => onSwapPress?.(exercise)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={styles.swapBtn}
            >
              <Ionicons name="swap-horizontal" size={18} color={colors.textAccent} />
            </TouchableOpacity>
          )}
        </View>
        {metaParts.length > 0 && (
          <Text style={styles.exerciseMeta}>{metaParts.join('  ·  ')}</Text>
        )}
        <View style={styles.badgeRow}>
          {isWarmup && (
            <View style={[styles.badge, styles.badgeWarmup]}>
              <Text style={styles.badgeText}>Warm-up</Text>
            </View>
          )}
          {isCooldown && (
            <View style={[styles.badge, styles.badgeCooldown]}>
              <Text style={styles.badgeText}>Cool-down</Text>
            </View>
          )}
        </View>
      </View>

      {setList.map((set) => (
        <SetRow
          key={set.setNumber}
          set={set}
          exerciseId={exercise.exerciseId}
          sessionExerciseId={exercise.sessionExerciseId}
          sessionId={sessionId}
          ensureStarted={ensureStarted}
          prescribedReps={prescribedReps}
          prescribedWeight={prescribedWeight}
          onLogged={(logged) => onSetLogged(exercise.sessionExerciseId, set.setNumber, logged)}
        />
      ))}
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function ActiveSessionScreen({ route, navigation }) {
  const { session: initialSession, hasStarted: initialHasStarted = false } = route.params;
  const [session, setSession]         = useState(initialSession);
  const [completing, setCompleting]   = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);

  const [substituteTarget, setSubstituteTarget] = useState(null);
  // { sessionExerciseId, exerciseId, exerciseName }
  const [inlineError, setInlineError] = useState(null);

  // Lazy-start state. We only POST /sessions/{id}/start on the FIRST log/skip —
  // not on screen mount — so the user can open a day for preview and back out
  // without creating any backend state.
  //   hasStartedRef: authoritative (read synchronously to avoid race with multiple taps)
  //   hasStarted:    mirror state for render (e.g. to enable/disable Complete CTA)
  const hasStartedRef   = useRef(initialHasStarted);
  const startPromiseRef = useRef(null);
  const [hasStarted, setHasStarted] = useState(initialHasStarted);

  useEffect(() => {
    if (!inlineError) return;
    const t = setTimeout(() => setInlineError(null), 4000);
    return () => clearTimeout(t);
  }, [inlineError]);

  const ensureStarted = useCallback(async () => {
    if (hasStartedRef.current) return;
    if (!startPromiseRef.current) {
      startPromiseRef.current = workoutApi.startSession(initialSession.sessionId)
        .then(() => {
          hasStartedRef.current = true;
          setHasStarted(true);
        })
        .catch((err) => {
          startPromiseRef.current = null; // allow retry on next log attempt
          throw err;
        });
    }
    return startPromiseRef.current;
  }, [initialSession.sessionId]);

  const handleSetLogged = useCallback((sessionExerciseId, setNumber, loggedSet) => {
    setSession((prev) => ({
      ...prev,
      exercises: prev.exercises.map((ex) => {
        if (ex.sessionExerciseId !== sessionExerciseId) return ex;
        const logs = (ex.logs ?? []).filter((l) => l.setNumber !== setNumber);
        return { ...ex, logs: [...logs, loggedSet] };
      }),
    }));
  }, []);

  const handleSubstitute = useCallback(
    async (sesExId, newExId, newExName, scope) => {
      const snapshot = session;
      setSession(prev => ({
        ...prev,
        exercises: (prev.exercises ?? []).map(ex =>
          ex.sessionExerciseId !== sesExId
            ? ex
            : { ...ex, exerciseId: newExId, name: newExName, logs: [] },
        ),
      }));
      setSubstituteTarget(null);
      try {
        await workoutApi.substituteExercise(session.sessionId, sesExId, {
          newExerciseId: newExId,
          scope,
        });
      } catch {
        setSession(snapshot);
        setInlineError('Substitution failed. Please try again.');
      }
    },
    [session],
  );

  const completedExercises = session.exercises?.filter((ex) => {
    const prescribedSets = ex.sets ?? 0;
    const done = ex.logs?.filter(
      (l) => l.status === 'COMPLETED' || l.status === 'SKIPPED',
    ).length ?? 0;
    return done >= prescribedSets;
  }).length ?? 0;
  const totalExercises = session.exercises?.length ?? 0;

  // User taps Complete → show feedback sheet first
  const handleCompletePress = () => {
    setShowFeedback(true);
  };

  // After feedback chosen → call API with feedback payload
  const handleFeedbackSelected = async (feedback) => {
    setShowFeedback(false);
    // If the session was never started (no sets logged), there's nothing to
    // complete on the backend — just go back.
    if (!hasStartedRef.current) {
      navigation.goBack();
      return;
    }
    setCompleting(true);
    try {
      // New: completeSession(sessionId, feedback) — sends { feedback } in body
      const { data: completed } = await workoutApi.completeSession(session.sessionId, feedback);
      navigation.replace('WorkoutSummary', { session: completed, feedback });
    } catch (e) {
      if (__DEV__) console.warn('[ActiveSession] complete failed:', e.response?.status, e.message);
    } finally {
      setCompleting(false);
    }
  };

  const handleAbandon = async () => {
    // Only abandon on the backend if the session was actually started.
    // If the user just tapped into a day and bailed, there's no backend state.
    if (!hasStartedRef.current) {
      navigation.goBack();
      return;
    }
    try {
      await workoutApi.abandonSession(session.sessionId);
    } catch (e) {
      if (__DEV__) console.warn('[ActiveSession] abandon failed:', e.response?.status, e.message);
    } finally {
      navigation.goBack();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={styles.sessionName} numberOfLines={1}>
              {session.sessionName ?? 'Workout'}
            </Text>
            <Text style={styles.sessionProgress}>
              {completedExercises} / {totalExercises} exercises done
            </Text>
          </View>
          <TouchableOpacity onPress={handleAbandon} style={styles.abandonBtn}>
            <Text style={styles.abandonText}>Abandon</Text>
          </TouchableOpacity>
        </View>

        {/* Progress bar */}
        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressFill,
              {
                width: totalExercises
                  ? `${(completedExercises / totalExercises) * 100}%`
                  : '0%',
              },
            ]}
          />
        </View>

        {/* Inline error banner */}
        {inlineError && (
          <View style={styles.inlineErrorBanner}>
            <Ionicons name="warning-outline" size={16} color="#FF3B30" />
            <Text style={styles.inlineErrorText}>{inlineError}</Text>
          </View>
        )}

        {/* Exercises */}
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {session.exercises?.map((ex) => (
            <ExerciseCard
              key={ex.sessionExerciseId}
              exercise={ex}
              sessionId={session.sessionId}
              ensureStarted={ensureStarted}
              onSetLogged={handleSetLogged}
              onSwapPress={(exercise) => setSubstituteTarget({
                sessionExerciseId: exercise.sessionExerciseId,
                exerciseId: exercise.exerciseId,
                exerciseName: exercise.name,
              })}
            />
          ))}
          <View style={{ height: 100 }} />
        </ScrollView>

        {/* Complete CTA */}
        <View style={styles.ctaContainer}>
          <TouchableOpacity
            onPress={handleCompletePress}
            disabled={completing}
            style={styles.ctaWrapper}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={gradientColors}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.ctaButton}
            >
              {completing ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name="checkmark-done" size={20} color="#fff" />
                  <Text style={styles.ctaText}>Complete Workout</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleAbandon}
            disabled={completing}
            style={styles.cancelButton}
            activeOpacity={0.7}
          >
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* Feedback sheet — shown before completing */}
      <FeedbackModal
        visible={showFeedback}
        onSelect={handleFeedbackSelected}
        onDismiss={() => setShowFeedback(false)}
      />

      {/* Exercise substitute sheet */}
      <ExerciseSubstituteSheet
        visible={substituteTarget != null}
        exerciseId={substituteTarget?.exerciseId}
        exerciseName={substituteTarget?.exerciseName}
        sessionExerciseId={substituteTarget?.sessionExerciseId}
        onSubstitute={handleSubstitute}
        onDismiss={() => setSubstituteTarget(null)}
      />
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
  },
  headerText: {
    flex: 1,
    marginRight: 12,
  },
  sessionName: {
    color: colors.textPrimary,
    fontSize: 20,
    fontWeight: '700',
  },
  sessionProgress: {
    color: colors.textSecondary,
    fontSize: 13,
    marginTop: 2,
  },
  abandonBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: `${colors.error}50`,
  },
  abandonText: {
    color: colors.error,
    fontSize: 13,
    fontWeight: '600',
  },
  progressTrack: {
    height: 3,
    backgroundColor: colors.divider,
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.textAccent,
    borderRadius: 2,
  },
  scroll: {
    padding: 16,
    gap: 14,
  },
  // Exercise card
  exerciseCard: {
    backgroundColor: colors.bgCard,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    overflow: 'hidden',
  },
  exerciseHeader: {
    padding: 14,
    paddingBottom: 10,
    gap: 4,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  exerciseTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  exerciseName: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  exerciseMeta: {
    color: colors.textSecondary,
    fontSize: 12,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
    marginTop: 2,
  },
  badge: {
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  badgeWarmup: {
    backgroundColor: `${colors.restAccent}25`,
  },
  badgeCooldown: {
    backgroundColor: `${colors.success}20`,
  },
  badgeText: {
    color: colors.textSecondary,
    fontSize: 10,
    fontWeight: '600',
  },
  swapBtn: { padding: 4 },
  // Set row
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    paddingHorizontal: 14,
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  setRowDone: {
    backgroundColor: `${colors.success}08`,
  },
  setNumBox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: colors.bgSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.divider,
  },
  setNumBoxDone: {
    backgroundColor: `${colors.success}20`,
    borderColor: `${colors.success}40`,
  },
  setNum: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '700',
  },
  setInputs: {
    flex: 1,
    flexDirection: 'row',
    gap: 8,
  },
  inputGroup: {
    flex: 1,
    gap: 2,
  },
  inputLabel: {
    color: colors.textSecondary,
    fontSize: 10,
  },
  input: {
    backgroundColor: colors.bgSecondary,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 6,
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
    borderWidth: 1,
    borderColor: colors.divider,
  },
  inputDone: {
    opacity: 0.5,
  },
  setActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  logBtn: {
    backgroundColor: colors.textAccent,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  logBtnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  logBtnDisabled: {
    opacity: 0.4,
  },
  skipBtn: {
    padding: 2,
  },
  // Inline error
  inlineErrorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FF3B3015',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginHorizontal: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#FF3B3030',
  },
  inlineErrorText: {
    color: '#FF3B30',
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
  },
  // CTA
  ctaContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    paddingBottom: 32,
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
  },
  ctaText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
  },
  cancelButton: {
    marginTop: 10,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: {
    color: colors.textSecondary,
    fontSize: 15,
    fontWeight: '600',
  },
});
