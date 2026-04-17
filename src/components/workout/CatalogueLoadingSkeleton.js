/**
 * CatalogueLoadingSkeleton — Shows 3 shimmer skeleton plan cards while catalogue is loading.
 */
import React from 'react';
import { View, StyleSheet } from 'react-native';
import ShimmerBox from '../common/ShimmerBox';
import { colors } from '../../theme/colors';

export default function CatalogueLoadingSkeleton() {
  return (
    <View style={styles.container}>
      {[1, 2, 3].map(i => (
        <View key={i} style={styles.card}>
          <ShimmerBox height={80} borderRadius={0} />
          <View style={styles.meta}>
            <ShimmerBox height={14} width="60%" borderRadius={6} />
            <ShimmerBox height={14} width="40%" borderRadius={6} />
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 8,
  },
  card: {
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: colors.bgCard,
  },
  meta: {
    padding: 12,
    gap: 8,
  },
});
