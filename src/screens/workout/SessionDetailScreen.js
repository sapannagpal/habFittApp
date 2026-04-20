/**
 * Session Detail — shows full detail of a completed workout session.
 * Route params: { sessionId, sessionName }
 */
import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, ActivityIndicator, StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { workoutApi } from '../../api/workoutApi';

export default function SessionDetailScreen({ route, navigation }) {
  const { sessionId, sessionName } = route.params;
  const [session, setSession]   = useState(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await workoutApi.getSessionDetail(sessionId);
        if (!cancelled) setSession(data);
      } catch (e) {
        if (!cancelled) setError('Could not load session details. Please try again.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [sessionId, retryKey]);

  const durationMin = session?.actualDurationSeconds
    ? Math.round(session.actualDurationSeconds / 60) : null;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {sessionName ?? 'Session Detail'}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      {loading && (
        <View style={styles.center}>
          <ActivityIndicator color={colors.textAccent} />
        </View>
      )}

      {error && !loading && (
        <View style={styles.center}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryBtn}
            onPress={() => { setError(null); setLoading(true); setRetryKey(k => k + 1); }}
          >
            <Text style={styles.retryText}>Try Again</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backLink}>
            <Text style={styles.backLinkText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      )}

      {session && !loading && (
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {/* Meta row */}
          <View style={styles.metaRow}>
            <View style={styles.metaChip}>
              <Ionicons name="checkmark-circle" size={14} color={colors.success} />
              <Text style={styles.metaText}>{session.status}</Text>
            </View>
            {durationMin != null && (
              <View style={styles.metaChip}>
                <Ionicons name="time-outline" size={14} color={colors.textSecondary} />
                <Text style={styles.metaText}>{durationMin} min</Text>
              </View>
            )}
          </View>

          {/* Exercise list */}
          {(session.exercises ?? []).map((ex) => (
            <View key={ex.sessionExerciseId ?? ex.exerciseId} style={styles.exCard}>
              <Text style={styles.exName}>{ex.name ?? 'Exercise'}</Text>
              {(ex.logs ?? []).map((log) => (
                <View key={log.setNumber} style={styles.logRow}>
                  <Text style={styles.setNum}>Set {log.setNumber}</Text>
                  <Text style={styles.logDetail}>
                    {log.status === 'SKIPPED'
                      ? 'Skipped'
                      : `${log.reps ?? '—'} reps${log.weightKg ? ` @ ${log.weightKg} kg` : ''}`}
                  </Text>
                  <Ionicons
                    name={log.status === 'COMPLETED' ? 'checkmark-circle' : 'remove-circle-outline'}
                    size={16}
                    color={log.status === 'COMPLETED' ? colors.success : colors.textSecondary}
                  />
                </View>
              ))}
            </View>
          ))}
          <View style={{ height: 40 }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgPrimary },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  backBtn: { padding: 4, width: 40 },
  headerTitle: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  errorText: { color: colors.error, fontSize: 15, textAlign: 'center', marginBottom: 16 },
  retryBtn: {
    backgroundColor: colors.bgCard,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    marginBottom: 8,
  },
  retryText: { color: colors.textAccent, fontWeight: '600', fontSize: 15 },
  backLink: { padding: 12 },
  backLinkText: { color: colors.textAccent, fontSize: 15, fontWeight: '600' },
  scroll: { padding: 16, gap: 12 },
  metaRow: { flexDirection: 'row', gap: 8, marginBottom: 4 },
  metaChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: colors.bgCard, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6,
    borderWidth: 1, borderColor: colors.cardBorder,
  },
  metaText: { color: colors.textSecondary, fontSize: 13 },
  exCard: {
    backgroundColor: colors.bgCard, borderRadius: 14, borderWidth: 1,
    borderColor: colors.cardBorder, overflow: 'hidden',
  },
  exName: {
    color: colors.textPrimary, fontSize: 15, fontWeight: '700',
    padding: 12, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: colors.divider,
  },
  logRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 12, paddingVertical: 8,
    borderBottomWidth: 1, borderBottomColor: colors.divider,
  },
  setNum: { color: colors.textSecondary, fontSize: 12, fontWeight: '600', width: 40 },
  logDetail: { flex: 1, color: colors.textPrimary, fontSize: 14 },
});
