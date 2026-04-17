/**
 * CombineDaySheet — bottom-sheet modal for combining two workout days.
 * Source day's exercises will be merged INTO the target day.
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

export default function CombineDaySheet({ visible, sourceDay, days, onCombine, onDismiss }) {
  const targets = (days ?? []).filter(d => {
    const n = numDay(d.dayOfWeek);
    return n !== sourceDay && !d.restDay && d.status !== 'COMPLETED';
  });

  return (
    <Modal visible={!!visible} transparent animationType="slide" onRequestClose={onDismiss}>
      <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onDismiss} />
      <View style={styles.sheet}>
        <View style={styles.handle} />
        <Text style={styles.title}>
          Combine {sourceDay ? DAY_SHORT[sourceDay] : ''} into…
        </Text>
        <Text style={styles.subtitle}>
          All exercises from {sourceDay ? DAY_SHORT[sourceDay] : 'this day'} will be added to the target day.
        </Text>
        <ScrollView>
          {targets.map((day) => {
            const n = numDay(day.dayOfWeek);
            return (
              <TouchableOpacity
                key={n}
                style={styles.row}
                onPress={() => onCombine(sourceDay, n)}
                accessibilityLabel={`Combine into ${DAY_SHORT[n] ?? n}`}
              >
                <View style={styles.rowLeft}>
                  <Text style={styles.dayShort}>{DAY_SHORT[n] ?? String(n)}</Text>
                  <Text style={styles.dayName}>{day.workoutName ?? 'Workout'}</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
              </TouchableOpacity>
            );
          })}
          {targets.length === 0 && (
            <Text style={styles.emptyText}>No days available to combine with.</Text>
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
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
  sheet: {
    backgroundColor: colors.bgCard,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 32,
    maxHeight: '60%',
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
    paddingHorizontal: 20, marginBottom: 4,
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 13,
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: colors.divider,
  },
  rowLeft: { gap: 2 },
  dayShort: {
    color: colors.textSecondary,
    fontSize: 11, fontWeight: '700', letterSpacing: 1,
  },
  dayName: { color: colors.textPrimary, fontSize: 15, fontWeight: '500' },
  emptyText: { color: colors.textSecondary, fontSize: 14, textAlign: 'center', padding: 24 },
  cancelBtn: {
    alignItems: 'center',
    paddingVertical: 16,
    marginHorizontal: 20, marginTop: 8,
    borderRadius: 12,
    backgroundColor: `${colors.textSecondary}15`,
  },
  cancelText: { color: colors.textSecondary, fontSize: 15, fontWeight: '600' },
});
