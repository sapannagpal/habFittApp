/**
 * Active Session — workout execution screen.
 * Shows exercises in order. User taps each set to log reps + weight.
 *
 * API changes vs hf-ms-workout 8083:
 *  - logSet: field names are now `reps`/`weightKg` (not actualReps/actualWeightKg)
 *  - skipSet: sends body { exerciseId, setNumber } to POST /sessions/{id}/sets/skip
 *  - completeSession: sends { feedback } — JUST_RIGHT for full complete, PARTIAL for save partial
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
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, gradientColors } from '../../theme/colors';
import { workoutApi } from '../../api/workoutApi';
import ExerciseSubstituteSheet from '../../components/workout/ExerciseSubstituteSheet';
import EndWorkoutSheet from '../../components/session/EndWorkoutSheet';
import RestTimerModal from '../../components/session/RestTimerModal';

// ─── Draft persistence constants ─────────────────────────────────────────────

const DRAFT_KEY_PREFIX = 'habfitt:session_draft:';
const DRAFT_TTL_MS = 24 * 60 * 60 * 1000;

// ─── Set Row ──────────────────────────────────────────────────────────────────

function SetRow({ set, exerciseId, sessionExerciseId, sessionId, ensureStarted, prescribedReps, prescribedWeight, onLogged, onError }) {
  // Initialise from: set.weightKg → prescribedWeight → ''
  const [reps, setReps]     = useState(set.reps != null ? String(set.reps) : '');
  const [weight, setWeight] = useState(
    set.weightKg != null
      ? String(set.weightKg)
      : prescribedWeight != null
        ? String(prescribedWeight)
        : '',
  );
  const [saving, setSaving] = useState(false);

  const isDone = set.status === 'COMPLETED' || set.status === 'SKIPPED';

  const handleLog = async () => {
    if (!exerciseId) {
      if (__DEV__) console.warn('[SetRow] exerciseId missing');
      return;
    }
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
      onError?.('Could not log set. Please try again.');
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
      onError?.('Could not skip set. Please try again.');
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

function ExerciseCard({ exercise, sessionId, ensureStarted, onSetLogged, onSwapPress, onSetError }) {
  // API contract (from GET /sessions/{id}/detail):
  //   exerciseId         — catalogue reference ID (used in logSet/skipSet payloads)
  //   sessionExerciseId  — this session's exercise row ID (used as React key + state match)
  const prescribedSets   = exercise.sets ?? 0;
  const prescribedReps   = exercise.reps ?? null;

  const completedSets = exercise.logs?.filter(
    (l) => l.status === 'COMPLETED' || l.status === 'SKIPPED',
  ).length ?? 0;
  const allDone = completedSets >= prescribedSets;

  // Derive the last logged weight from prior COMPLETED logs for this exercise
  const lastLoggedWeight = exercise.logs
    ?.filter(l => l.status === 'COMPLETED' && l.weightKg != null)
    ?.slice(-1)[0]?.weightKg ?? null;

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
  if (prescribedSets)           metaParts.push(`${prescribedSets} sets`);
  if (prescribedReps)           metaParts.push(`× ${prescribedReps} reps`);
  if (exercise.weightKg)        metaParts.push(`@ ${exercise.weightKg} kg`);
  if (exercise.restSeconds)     metaParts.push(`${exercise.restSeconds}s rest`);

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
          prescribedWeight={lastLoggedWeight ?? exercise.weightKg ?? null}
          onLogged={(logged) => onSetLogged(exercise.sessionExerciseId, set.setNumber, logged)}
          onError={onSetError}
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
  const [showEndSheet, setShowEndSheet] = useState(false);

  const [substituteTarget, setSubstituteTarget] = useState(null);
  // { sessionExerciseId, exerciseId, exerciseName }
  const [inlineError, setInlineError] = useState(null);

  // Rest timer state
  const [restTimer, setRestTimer] = useState({ visible: false, seconds: 60, nextExercise: null });

  // sessionRef always tracks the latest session value so callbacks outside
  // the state updater (e.g. handleSetLogged rest-timer logic) read fresh state.
  const sessionRef = useRef(session);
  useEffect(() => { sessionRef.current = session; }, [session]);

  // Lazy-start state. We only POST /sessions/{id}/start on the FIRST log/skip —
  // not on screen mount — so the user can open a day for preview and back out
  // without creating any backend state.
  //   hasStartedRef: authoritative (read synchronously to avoid race with multiple taps)
  //   hasStarted:    mirror state for render (e.g. to enable/disable Complete CTA)
  const hasStartedRef   = useRef(initialHasStarted);
  const startPromiseRef = useRef(null);
  const [hasStarted, setHasStarted] = useState(initialHasStarted);

  // Elapsed timer
  const sessionStartTimeRef = useRef(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // ─── Draft save ────────────────────────────────────────────────────────────

  const saveDraft = useCallback(async () => {
    if (!sessionRef.current?.sessionId) return;
    const draft = {
      sessionId:      sessionRef.current.sessionId,
      exercises:      sessionRef.current.exercises,
      elapsedSeconds: elapsedSeconds,
      hasStarted:     hasStartedRef.current ?? false,
      savedAt:        Date.now(),
    };
    try {
      await AsyncStorage.setItem(
        DRAFT_KEY_PREFIX + sessionRef.current.sessionId,
        JSON.stringify(draft),
      );
    } catch (e) {
      if (__DEV__) console.warn('[ActiveSession] saveDraft failed:', e.message);
    }
  }, [elapsedSeconds]); // elapsedSeconds is captured at call time via closure

  // ─── Draft restore on mount ────────────────────────────────────────────────

  useEffect(() => {
    const initialSessionId = route.params?.session?.sessionId;
    if (!initialSessionId) return;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(DRAFT_KEY_PREFIX + initialSessionId);
        if (!raw) return;
        const draft = JSON.parse(raw);
        if (Date.now() - draft.savedAt > DRAFT_TTL_MS) {
          await AsyncStorage.removeItem(DRAFT_KEY_PREFIX + initialSessionId);
          return;
        }
        if (draft.exercises?.length) {
          setSession(prev => ({ ...prev, exercises: draft.exercises }));
        }
        if (draft.elapsedSeconds > 0) {
          setElapsedSeconds(draft.elapsedSeconds);
          sessionStartTimeRef.current = Date.now() - draft.elapsedSeconds * 1000;
        }
        if (draft.hasStarted) {
          setHasStarted(true);
          hasStartedRef.current = true;
        }
      } catch (e) {
        if (__DEV__) console.warn('[ActiveSession] restoreDraft failed:', e.message);
      }
    })();
  }, []); // mount only

  // ─── beforeRemove — save draft, do NOT block navigation ───────────────────

  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', () => {
      saveDraft(); // fire and forget — do NOT call e.preventDefault()
    });
    return unsubscribe;
  }, [navigation, saveDraft]);

  // ─── Header back press ────────────────────────────────────────────────────

  const handleBackPress = useCallback(() => {
    saveDraft();
    navigation.goBack();
  }, [saveDraft, navigation]);

  useEffect(() => {
    if (!inlineError) return;
    const t = setTimeout(() => setInlineError(null), 4000);
    return () => clearTimeout(t);
  }, [inlineError]);

  // Start elapsed timer when session starts
  useEffect(() => {
    if (!hasStarted) return;
    if (!sessionStartTimeRef.current) {
      sessionStartTimeRef.current = Date.now();
    }
    const interval = setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - sessionStartTimeRef.current) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [hasStarted]);

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

    // Rest timer triggered here — outside the state updater — using sessionRef
    if (loggedSet.status === 'COMPLETED') {
      const currentSession = sessionRef.current;
      const exercise = currentSession.exercises?.find(
        (e) => e.sessionExerciseId === sessionExerciseId,
      );
      const restSeconds = exercise?.restSeconds ?? 0;
      if (restSeconds > 0) {
        const currentIdx = currentSession.exercises?.findIndex(
          (e) => e.sessionExerciseId === sessionExerciseId,
        ) ?? -1;
        const nextEx = currentIdx >= 0
          ? currentSession.exercises.slice(currentIdx + 1).find((e) => {
              const done = (e.logs ?? []).filter(
                (l) => l.status === 'COMPLETED' || l.status === 'SKIPPED',
              ).length;
              return done < (e.sets ?? 0);
            }) ?? null
          : null;
        setRestTimer({ visible: true, seconds: restSeconds, nextExercise: nextEx });
      }
    }
  }, []); // no deps — reads from sessionRef

  const handleSubstitute = useCallback(
    async (sesExId, newExId, newExName, scope) => {
      let snapshot;
      setSession(prev => {
        snapshot = prev;
        return {
          ...prev,
          exercises: (prev.exercises ?? []).map(ex =>
            ex.sessionExerciseId !== sesExId
              ? ex
              : { ...ex, exerciseId: newExId, name: newExName, logs: [] },
          ),
        };
      });
      setSubstituteTarget(null);
      try {
        await workoutApi.substituteExercise(session.sessionId, sesExId, {
          newExerciseId: newExId,
          scope,
        });
      } catch {
        if (snapshot !== undefined) setSession(snapshot);
        setInlineError('Substitution failed. Please try again.');
      }
    },
    [session.sessionId],
  );

  const completedExercises = session.exercises?.filter((ex) => {
    const prescribedSets = ex.sets ?? 0;
    const done = ex.logs?.filter(
      (l) => l.status === 'COMPLETED' || l.status === 'SKIPPED',
    ).length ?? 0;
    return done >= prescribedSets;
  }).length ?? 0;
  const totalExercises = session.exercises?.length ?? 0;

  // Total sets completed — passed to EndWorkoutSheet
  const totalSetsCompleted = session.exercises?.reduce((sum, ex) => {
    return sum + (ex.logs?.filter(l => l.status === 'COMPLETED' || l.status === 'SKIPPED').length ?? 0);
  }, 0) ?? 0;

  // Complete Workout — completes the session with JUST_RIGHT feedback
  const handleCompletePress = async () => {
    if (!hasStartedRef.current) {
      // Session never started — just go back
      navigation.goBack();
      return;
    }
    setCompleting(true);
    try {
      const { data: completed } = await workoutApi.completeSession(session.sessionId, 'JUST_RIGHT');
      AsyncStorage.removeItem(DRAFT_KEY_PREFIX + session.sessionId).catch(() => {});
      navigation.replace('WorkoutSummary', { session: completed, sessionData: session });
    } catch (e) {
      if (__DEV__) console.warn('[ActiveSession] complete failed:', e.response?.status, e.message);
      setInlineError('Could not complete workout. Please try again.');
    } finally {
      setCompleting(false);
    }
  };

  // End Workout button in header → open EndWorkoutSheet
  const handleEndWorkout = () => {
    setShowEndSheet(true);
  };

  // Save workout and navigate to summary
  const handleSavePartial = async () => {
    if (!hasStartedRef.current) {
      setShowEndSheet(false);
      navigation.goBack();
      return;
    }
    setCompleting(true);
    try {
      const { data: completed } = await workoutApi.completeSession(session.sessionId, 'PARTIAL');
      AsyncStorage.removeItem(DRAFT_KEY_PREFIX + session.sessionId).catch(() => {});
      navigation.replace('WorkoutSummary', { session: completed, sessionData: session });
    } catch (e) {
      if (__DEV__) console.warn('[ActiveSession] savePartial failed:', e.response?.status, e.message);
      setShowEndSheet(false);
      setInlineError('Could not save workout. Please try again.');
    } finally {
      setCompleting(false);
    }
  };

  // Discard — abandon the session entirely and go back
  const handleDiscard = async () => {
    if (!hasStartedRef.current) {
      setShowEndSheet(false);
      navigation.goBack();
      return;
    }
    try {
      await workoutApi.abandonSession(session.sessionId);
    } catch (e) {
      if (__DEV__) console.warn('[ActiveSession] discard failed:', e.response?.status, e.message);
    } finally {
      await AsyncStorage.removeItem(DRAFT_KEY_PREFIX + session.sessionId).catch(() => {});
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
          {/* Back button — saves draft and goes back */}
          <TouchableOpacity
            onPress={handleBackPress}
            style={styles.headerBackBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <View style={styles.headerText}>
            <Text style={styles.sessionName} numberOfLines={1}>
              {session.sessionName ?? 'Workout'}
            </Text>
            <Text style={styles.sessionProgress}>
              {completedExercises} / {totalExercises} exercises done
            </Text>
          </View>
          <TouchableOpacity onPress={handleEndWorkout} style={styles.endWorkoutBtn}>
            <Text style={styles.endWorkoutText}>End Workout</Text>
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
              onSetError={(msg) => setInlineError(msg)}
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
        </View>
      </KeyboardAvoidingView>

      {/* End workout sheet — shown when user taps End Workout */}
      <EndWorkoutSheet
        visible={showEndSheet}
        elapsedSeconds={elapsedSeconds}
        completedSets={totalSetsCompleted}
        onSavePartial={handleSavePartial}
        onDiscard={handleDiscard}
        onDismiss={() => setShowEndSheet(false)}
      />

      {/* Rest timer — shown after a completed set with restSeconds */}
      <RestTimerModal
        visible={restTimer.visible}
        defaultSeconds={restTimer.seconds}
        nextExercise={restTimer.nextExercise}
        onSkip={() => setRestTimer(r => ({ ...r, visible: false }))}
        onComplete={() => setRestTimer(r => ({ ...r, visible: false }))}
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
  headerBackBtn: {
    padding: 4,
    marginRight: 8,
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
  endWorkoutBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: `${colors.error}50`,
  },
  endWorkoutText: {
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
});
