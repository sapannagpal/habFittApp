import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';

export default class ScreenErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    if (__DEV__) console.error('[ScreenErrorBoundary] caught:', error.message, info.componentStack);
  }

  reset() {
    this.setState({ hasError: false, error: null });
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    const { onGoBack } = this.props;
    return (
      <View style={styles.container}>
        <Ionicons name="alert-circle-outline" size={48} color={colors.textSecondary} />
        <Text style={styles.title}>Something went wrong</Text>
        <Text style={styles.subtitle}>An unexpected error occurred. Please try again.</Text>
        <TouchableOpacity style={styles.btn} onPress={() => this.reset()}>
          <Text style={styles.btnText}>Try Again</Text>
        </TouchableOpacity>
        {onGoBack && (
          <TouchableOpacity style={[styles.btn, styles.btnSecondary]} onPress={onGoBack}>
            <Text style={[styles.btnText, styles.btnTextSecondary]}>Go Back</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 16,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  btn: {
    backgroundColor: colors.bgCard,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    marginTop: 4,
  },
  btnText: {
    color: colors.textAccent,
    fontWeight: '600',
    fontSize: 15,
    textAlign: 'center',
  },
  btnSecondary: {
    backgroundColor: 'transparent',
    borderColor: colors.divider,
  },
  btnTextSecondary: {
    color: colors.textSecondary,
  },
});
