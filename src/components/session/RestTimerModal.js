/**
 * RestTimerModal — Full-screen rest timer between sets.
 * Counts down from defaultSeconds and auto-completes when it reaches zero.
 *
 * Props:
 *   visible          {boolean}         — controls modal visibility
 *   defaultSeconds   {number}          — countdown start value
 *   nextExercise     {Exercise|null}   — next exercise to preview (null if last)
 *   onSkip           {function}        — skip rest and continue
 *   onComplete       {function}        — called when countdown reaches zero
 */
import React, { useState, useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { ProgressRing } from '../common/ProgressRing';
import { SectionHeader } from '../common/SectionHeader';

export default function RestTimerModal({
  visible,
  defaultSeconds,
  nextExercise,
  onSkip,
  onComplete,
}) {
  const [secondsLeft, setSecondsLeft] = useState(defaultSeconds);
  const intervalRef = useRef(null);

  // Start or reset the countdown whenever the modal becomes visible
  useEffect(() => {
    if (visible) {
      setSecondsLeft(defaultSeconds);
      intervalRef.current = setInterval(() => {
        setSecondsLeft(prev => {
          if (prev <= 1) {
            clearInterval(intervalRef.current);
            // Call onComplete after this tick
            setTimeout(onComplete, 0);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      clearInterval(intervalRef.current);
    }

    return () => clearInterval(intervalRef.current);
  }, [visible]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleAdjust = (delta) => {
    setSecondsLeft(prev => Math.max(5, prev + delta));
  };

  const progress = defaultSeconds > 0 ? secondsLeft / defaultSeconds : 0;

  return (
    <Modal
      visible={visible}
      transparent={false}
      animationType="slide"
      statusBarTranslucent
    >
      <View style={styles.root}>
        <SafeAreaView style={styles.safeArea}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft} />
            <Text style={styles.headerTitle}>Rest</Text>
            <TouchableOpacity onPress={onSkip} style={styles.skipBtn}>
              <Text style={styles.skipText}>Skip</Text>
            </TouchableOpacity>
          </View>

          {/* Timer + ring */}
          <View style={styles.centerArea}>
            <View style={styles.ringContainer}>
              <ProgressRing
                progress={progress}
                size={200}
                strokeWidth={14}
              />
              {/* Overlay text */}
              <View style={styles.ringOverlay}>
                <Text style={styles.bigTimer}>{secondsLeft}</Text>
                <Text style={styles.secLabel}>sec</Text>
              </View>
            </View>

            {/* Adjust buttons */}
            <View style={styles.adjustRow}>
              <TouchableOpacity
                style={styles.adjustBtn}
                onPress={() => handleAdjust(-10)}
                activeOpacity={0.7}
              >
                <Text style={styles.adjustText}>-10</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.adjustBtn}
                onPress={() => handleAdjust(10)}
                activeOpacity={0.7}
              >
                <Text style={styles.adjustText}>+10</Text>
              </TouchableOpacity>
            </View>

            {/* Up next section */}
            <View style={styles.upNextSection}>
              <SectionHeader title="Up Next" />
              {nextExercise ? (
                <View style={styles.nextExerciseCard}>
                  <Ionicons
                    name="barbell-outline"
                    size={20}
                    color={colors.textAccent}
                  />
                  <View style={styles.nextExerciseInfo}>
                    <Text style={styles.nextExerciseName}>
                      {nextExercise.name}
                    </Text>
                    <Text style={styles.nextExerciseMeta}>
                      {nextExercise.sets} sets · {nextExercise.reps} reps
                    </Text>
                  </View>
                </View>
              ) : (
                <Text style={styles.lastExerciseText}>
                  Last exercise — finish strong!
                </Text>
              )}
            </View>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerLeft: {
    width: 50,
  },
  headerTitle: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    flex: 1,
  },
  skipBtn: {
    width: 50,
    alignItems: 'flex-end',
  },
  skipText: {
    color: colors.textAccent,
    fontSize: 15,
    fontWeight: '600',
  },
  centerArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  ringContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  ringOverlay: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bigTimer: {
    color: colors.textPrimary,
    fontSize: 64,
    fontWeight: '700',
    lineHeight: 72,
  },
  secLabel: {
    color: colors.textSecondary,
    fontSize: 16,
    marginTop: 4,
  },
  adjustRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 40,
  },
  adjustBtn: {
    backgroundColor: colors.bgCard,
    borderRadius: 20,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  adjustText: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
  upNextSection: {
    width: '100%',
  },
  nextExerciseCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgCard,
    borderRadius: 12,
    padding: 14,
    marginHorizontal: 16,
    gap: 12,
  },
  nextExerciseInfo: {
    flex: 1,
  },
  nextExerciseName: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '600',
  },
  nextExerciseMeta: {
    color: colors.textSecondary,
    fontSize: 13,
    marginTop: 2,
  },
  lastExerciseText: {
    color: colors.textAccent,
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
    marginHorizontal: 16,
    marginTop: 4,
  },
});
