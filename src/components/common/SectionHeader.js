/**
 * SectionHeader — Uppercase section label with optional right-side element.
 *
 * Props:
 *   title         {string}    — section heading text (rendered uppercase)
 *   rightElement  {ReactNode} — optional element aligned to the right (e.g. a link or button)
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../theme/colors';

export function SectionHeader({ title, rightElement }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      {rightElement ? <View>{rightElement}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 24,
    marginBottom: 12,
  },
  title: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    color: colors.textSecondary,
  },
});
