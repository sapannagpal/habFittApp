/**
 * SwapDaySheet — bottom-sheet modal for swapping two days.
 * User picks the target day; the source is passed via props.
 * Direct action on tap (no confirm button).
 */
import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';

const DAY_SHORT = {
  1: 'MON', 2: 'TUE', 3: 'WED', 4: 'THU', 5: 'FRI', 6: 'SAT', 7: 'SUN',
  MONDAY: 'MON', TUESDAY: 'TUE', WEDNESDAY: 'WED', THURSDAY: 'THU',
  FRIDAY: 'FRI', SATURDAY: 'SAT', SUNDAY: 'SUN',
};

const numDay = (d) =>
  typeof d === 'number' ? d : ({ MONDAY:1,TUESDAY:2,WEDNESDAY:3,THURSDAY:4,FRIDAY:5,SATURDAY:6,SUNDAY:7 }[d] ?? 0);

export default function SwapDaySheet({ visible, sourceDay, days, onSwap, onDismiss }) {
  const targets = (days ?? []).filter(d => {
    const n = numDay(d.dayOfWeek);
    return n !== sourceDay && !d.restDay;
  });

  return (
    <Modal visible={!!visible} transparent animationType="slide" onRequestClose={onDismiss}>
      <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onDismiss} />
      <View style={styles.sheet}>
        <View style={styles.handle} />
        <Text style={styles.title}>
          Swap {sourceDay ? DAY_SHORT[sourceDay] : ''} with…
        </Text>
        <ScrollView>
          {targets.map((day) => {
            const n = numDay(day.dayOfWeek);
            const isDone = day.status === 'COMPLETED';
            return (
              <TouchableOpacity
                key={n}
                style={[styles.row, isDone && styles.rowDisabled]}
                onPress={() => !isDone && onSwap(sourceDay, n)}
                disabled={isDone}
                accessibilityLabel={`Swap with ${DAY_SHORT[n] ?? n}`}
              >
                <View style={styles.rowLeft}>
                  <Text style={styles.dayShort}>{DAY_SHORT[n] ?? String(n)}</Text>
                  <Text style={[styles.dayName, isDone && styles.dayNameDisabled]}>
                    {day.workoutName ?? 'Workout'}
                  </Text>
                </View>
                {!isDone && <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />}
                {isDone && <Text style={styles.doneLabel}>Done</Text>}
              </TouchableOpacity>
            );
          })}
          {targets.length === 0 && (
            <Text style={styles.emptyText}>No days available to swap with.</Text>
          )}
        </ScrollView>
        <TouchableOpacity style={styles.cancelBtn} onPress={onDismiss}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  sheet: {
    backgroundColor: colors.bgCard,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 32,
    maxHeight: '60%',
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: colors.divider,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 16,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 17,
    fontWeight: '700',
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  rowDisabled: {
    opacity: 0.4,
  },
  rowLeft: {
    gap: 2,
  },
  dayShort: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
  },
  dayName: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '500',
  },
  dayNameDisabled: {
    color: colors.textSecondary,
  },
  doneLabel: {
    color: colors.textSecondary,
    fontSize: 12,
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    padding: 24,
  },
  cancelBtn: {
    alignItems: 'center',
    paddingVertical: 16,
    marginHorizontal: 20,
    marginTop: 8,
    borderRadius: 12,
    backgroundColor: `${colors.textSecondary}15`,
  },
  cancelText: {
    color: colors.textSecondary,
    fontSize: 15,
    fontWeight: '600',
  },
});
