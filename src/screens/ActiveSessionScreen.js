/**
 * ActiveSessionScreen — The main workout execution screen.
 * Route params: { sessionId: string }
 *
 * On mount: calls startSession(sessionId) which is async —
 * it POSTs to /sessions/{id}/start, fetches session detail,
 * populates exerciseCache, then stores the enriched session in WorkoutContext.
 */
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';
import { useWorkout } from '../context/WorkoutContext';
import { useSessionTimer } from '../hooks/useSessionTimer';
import SessionHeader from '../components/session/SessionHeader';
import ExerciseProgressBar from '../components/session/ExerciseProgressBar';
import ExerciseCard from '../components/session/ExerciseCard';
import SetsTable from '../components/session/SetsTable';
import EndWorkoutSheet from '../components/session/EndWorkoutSheet';
import RestTimerModal from '../components/session/RestTimerModal';
import GradientButton from '../components/common/GradientButton';

export default function ActiveSessionScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();

  const { sessionId } = route.params || {};

  const {
    activeSession,
    isSessionLoading,
    setLogs,
    weightUnit,
    startSession,
    logSet,
    completeSession,
  } = useWorkout();

  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [showEndSheet, setShowEndSheet] = useState(false);
  const [showRestTimer, setShowRestTimer] = useState(false);
  const [sessionStarted, setSessionStarted] = useState(false);
  const [startError, setStartError] = useState(null);

  // Start session on mount — async: calls API, fetches exercises, populates context
  useEffect(() => {
    if (!sessionId) return;
    startSession(sessionId)
      .then(() => setSessionStarted(true))
      .catch(() => setStartError('Failed to start session. Please try again.'));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Elapsed timer — counts up once session has started
  const { seconds } = useSessionTimer(sessionStarted);

  // Current exercise
  const exercise = activeSession?.exercises?.[currentExerciseIndex];
  const exerciseSetLogs = exercise ? (setLogs[exercise.id] || []) : [];

  // Computed values derived from logs
  const completedSets = exerciseSetLogs.filter(s => s.isCompleted).length;
  const allSetsCompleted = exercise ? completedSets >= exercise.sets : false;
  const isLastExercise = activeSession
    ? currentExerciseIndex === activeSession.exercises.length - 1
    : false;

  const totalCompletedSets = useMemo(
    () => Object.values(setLogs).flat().filter(s => s.isCompleted).length,
    [setLogs],
  );

  // Handle a set being marked complete
  const handleSetComplete = useCallback((setIndex, reps, weight) => {
    if (!exercise) return;
    const setEntry = {
      setIndex,
      reps: parseInt(reps, 10) || 0,
      weightKg: parseFloat(weight) || 0,
      isCompleted: true,
      completedAt: Date.now(),
    };
    // logSet takes: exerciseId (local state key), sessionExerciseId (API param), setEntry
    logSet(exercise.id, exercise.sessionExerciseId, setEntry);
    // Show rest timer between sets (not after the final set of an exercise)
    if (setIndex < exercise.sets - 1) {
      setShowRestTimer(true);
    }
  }, [exercise, logSet]);

  // Finish the workout and navigate to summary
  const handleFinishWorkout = useCallback(async () => {
    const summary = await completeSession();
    navigation.replace('WorkoutSummary', { summary });
  }, [completeSession, navigation]);

  // Loading state — waiting for async startSession to complete
  if (isSessionLoading || (!activeSession && !startError)) {
    return (
      <View style={[styles.root, styles.centered, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={colors.textAccent} />
        <Text style={styles.loadingText}>Loading session...</Text>
      </View>
    );
  }

  // Error state
  if (startError) {
    return (
      <View style={[styles.root, styles.centered, { paddingTop: insets.top }]}>
        <Text style={styles.errorText}>{startError}</Text>
      </View>
    );
  }

  if (!activeSession || !exercise) {
    return (
      <View style={[styles.root, styles.centered, { paddingTop: insets.top }]}>
        <Text style={styles.loadingText}>Loading session...</Text>
      </View>
    );
  }

  const totalExercises = activeSession.exercises.length;
  const nextExercise = activeSession.exercises[currentExerciseIndex + 1] || null;

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* Fixed header */}
      <SessionHeader
        sessionName={activeSession.name}
        elapsedSeconds={seconds}
        onEndPress={() => setShowEndSheet(true)}
      />

      {/* Exercise progress segmented bar */}
      <ExerciseProgressBar
        total={totalExercises}
        current={currentExerciseIndex + 1}
      />

      {/* Scrollable content */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 120 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Exercise info card */}
        <ExerciseCard exercise={exercise} />

        {/* Sets table */}
        <SetsTable
          exercise={exercise}
          setLogs={exerciseSetLogs}
          weightUnit={weightUnit}
          onCompleteSet={handleSetComplete}
        />

        {/* Action area */}
        <View style={styles.actionArea}>
          {allSetsCompleted && isLastExercise ? (
            <GradientButton
              label="Finish Workout"
              onPress={handleFinishWorkout}
            />
          ) : allSetsCompleted ? (
            <GradientButton
              label="Next Exercise"
              onPress={() => setCurrentExerciseIndex(i => i + 1)}
            />
          ) : (
            <Text style={styles.hintText}>
              Complete all sets to continue
            </Text>
          )}
        </View>
      </ScrollView>

      {/* End workout confirmation sheet */}
      <EndWorkoutSheet
        visible={showEndSheet}
        elapsedSeconds={seconds}
        completedSets={totalCompletedSets}
        onFinishEarly={() => {
          setShowEndSheet(false);
          handleFinishWorkout();
        }}
        onKeepGoing={() => setShowEndSheet(false)}
      />

      {/* Rest timer between sets */}
      <RestTimerModal
        visible={showRestTimer}
        defaultSeconds={activeSession?.defaultRestSeconds || 90}
        nextExercise={nextExercise}
        onSkip={() => setShowRestTimer(false)}
        onComplete={() => setShowRestTimer(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bgPrimary },
  centered: { alignItems: 'center', justifyContent: 'center' },
  loadingText: { color: colors.textSecondary, fontSize: 15, marginTop: 12 },
  errorText: { color: '#FF4444', fontSize: 15, textAlign: 'center', paddingHorizontal: 24 },
  scroll: { flex: 1 },
  scrollContent: { paddingTop: 8 },
  actionArea: { marginHorizontal: 16, marginTop: 8 },
  hintText: {
    color: colors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 16,
  },
});
