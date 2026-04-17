/**
 * ExerciseSubstituteSheet — bottom-sheet for substituting an exercise.
 * Fetches alternatives on open, lets user pick scope (SESSION | PLAN), then substitutes.
 */
import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { workoutApi } from '../../api/workoutApi';

export default function ExerciseSubstituteSheet({
  visible,
  exerciseId,
  exerciseName,
  sessionExerciseId,
  onSubstitute,
  onDismiss,
}) {
  const [alternatives, setAlternatives] = useState([]);
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState(null);
  const [scope, setScope]               = useState('SESSION');

  useEffect(() => {
    if (!visible || !exerciseId) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    setAlternatives([]);
    workoutApi.getAlternatives(exerciseId)
      .then(({ data }) => {
        if (!cancelled) setAlternatives(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        if (!cancelled) setError('Could not load alternatives.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [visible, exerciseId]);

  return (
    <Modal visible={!!visible} transparent animationType="slide" onRequestClose={onDismiss}>
      <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onDismiss} />
      <View style={styles.sheet}>
        <View style={styles.handle} />
        <Text style={styles.title}>Replace {exerciseName ?? 'exercise'}</Text>

        {/* Scope toggle */}
        <View style={styles.scopeRow}>
          <TouchableOpacity
            style={[styles.scopeBtn, scope === 'SESSION' && styles.scopeBtnActive]}
            onPress={() => setScope('SESSION')}
          >
            <Text style={[styles.scopeText, scope === 'SESSION' && styles.scopeTextActive]}>
              This Session
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.scopeBtn, scope === 'PLAN' && styles.scopeBtnActive]}
            onPress={() => setScope('PLAN')}
          >
            <Text style={[styles.scopeText, scope === 'PLAN' && styles.scopeTextActive]}>
              Entire Plan
            </Text>
          </TouchableOpacity>
        </View>

        {/* Content */}
        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator color={colors.textAccent} />
          </View>
        ) : error ? (
          <View style={styles.center}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : alternatives.length === 0 ? (
          <View style={styles.center}>
            <Text style={styles.emptyText}>No alternative exercises found.</Text>
          </View>
        ) : (
          <ScrollView>
            {alternatives.map((alt) => (
              <TouchableOpacity
                key={alt.id}
                style={styles.row}
                onPress={() => onSubstitute(sessionExerciseId, alt.id, alt.name, scope)}
                accessibilityLabel={`Substitute with ${alt.name}`}
              >
                <View style={styles.rowContent}>
                  <Text style={styles.altName}>{alt.name}</Text>
                  <Text style={styles.altMeta}>
                    {[alt.primaryMuscle, alt.equipment].filter(Boolean).join(' · ')}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        <TouchableOpacity style={styles.cancelBtn} onPress={onDismiss}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
  sheet: {
    backgroundColor: colors.bgCard,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 32,
    maxHeight: '70%',
  },
  handle: {
    width: 40, height: 4,
    backgroundColor: colors.divider,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 10, marginBottom: 12,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 17, fontWeight: '700',
    paddingHorizontal: 20, marginBottom: 12,
  },
  scopeRow: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 12,
    borderRadius: 10,
    backgroundColor: `${colors.textSecondary}15`,
    padding: 3,
  },
  scopeBtn: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: 8,
    alignItems: 'center',
  },
  scopeBtnActive: {
    backgroundColor: colors.bgPrimary,
  },
  scopeText: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '500',
  },
  scopeTextActive: {
    color: colors.textPrimary,
    fontWeight: '700',
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  errorText: { color: colors.textSecondary, fontSize: 14 },
  emptyText: { color: colors.textSecondary, fontSize: 14 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: colors.divider,
  },
  rowContent: { flex: 1, marginRight: 8, gap: 2 },
  altName: { color: colors.textPrimary, fontSize: 15, fontWeight: '600' },
  altMeta: { color: colors.textSecondary, fontSize: 12 },
  cancelBtn: {
    alignItems: 'center',
    paddingVertical: 16,
    marginHorizontal: 20, marginTop: 8,
    borderRadius: 12,
    backgroundColor: `${colors.textSecondary}15`,
  },
  cancelText: { color: colors.textSecondary, fontSize: 15, fontWeight: '600' },
});
