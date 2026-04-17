/**
 * SessionHeader — Fixed header shown during an active workout session.
 *
 * Props:
 *   sessionName     {string}    — name of the current session
 *   elapsedSeconds  {number}    — elapsed time in seconds
 *   onEndPress      {function}  — called when user taps "End"
 */
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors } from '../../theme/colors';
import { formatTime } from '../../utils/workoutUtils';

export default function SessionHeader({ sessionName, elapsedSeconds, onEndPress }) {
  return (
    <View style={styles.container}>
      <TouchableOpacity
        onPress={onEndPress}
        style={styles.endBtn}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Text style={styles.endText}>End</Text>
      </TouchableOpacity>
      <Text style={styles.sessionName} numberOfLines={1}>{sessionName}</Text>
      <Text style={styles.timer}>{formatTime(elapsedSeconds)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
    backgroundColor: colors.bgPrimary,
  },
  endBtn: {
    width: 50,
  },
  endText: {
    color: colors.error,
    fontSize: 15,
    fontWeight: '600',
  },
  sessionName: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
    marginHorizontal: 8,
  },
  timer: {
    color: colors.textAccent,
    fontSize: 15,
    fontWeight: '700',
    width: 50,
    textAlign: 'right',
  },
});
