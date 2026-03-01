/**
 * PasswordResetSuccessScreen — habFitt terminal success screen.
 * "Electric Momentum" dark theme.
 *
 * Shown after a successful password reset. No back button — this is a
 * terminal node. "Back to Sign In" resets the navigation stack to
 * Welcome → Login, preventing the user from navigating back into the
 * reset flow via the hardware back button.
 */
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, gradientColors } from '../theme/colors';

// ─── Component ────────────────────────────────────────────────────────────────

export default function PasswordResetSuccessScreen({ navigation }) {
  const handleContinue = () => {
    navigation.reset({
      index: 1,
      routes: [{ name: 'Welcome' }, { name: 'Login' }],
    });
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bgPrimary} />

      {/* Ambient orange glow — top-centre */}
      <View style={styles.ambientGlow} pointerEvents="none" />

      {/* Checkmark circle */}
      <View style={styles.checkmarkWrap}>
        <LinearGradient
          colors={gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.checkmarkGradient}
        >
          <Ionicons name="checkmark" size={40} color="#fff" />
        </LinearGradient>
      </View>

      {/* Title */}
      <Text style={styles.title}>Password reset!</Text>

      {/* Subtitle */}
      <Text style={styles.subtitle}>
        Your password has been changed successfully.{'\n'}
        You can now sign in with your new password.
      </Text>

      {/* Back to Sign In CTA */}
      <TouchableOpacity
        onPress={handleContinue}
        activeOpacity={0.85}
        testID="success-continue-button"
        style={styles.ctaWrap}
      >
        <LinearGradient
          colors={gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.ctaBtn}
        >
          <Text style={styles.ctaBtnText}>Back to Sign In</Text>
          <View style={styles.arrowCircle}>
            <Ionicons name="arrow-forward" size={18} color="#fff" />
          </View>
        </LinearGradient>
      </TouchableOpacity>

    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },

  ambientGlow: {
    position: 'absolute',
    top: -120,
    alignSelf: 'center',
    width: 340,
    height: 340,
    borderRadius: 170,
    backgroundColor: 'rgba(255,107,0,0.10)',
  },

  // ── Checkmark circle ──
  checkmarkWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    overflow: 'hidden',
    marginBottom: 32,
  },
  checkmarkGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Text ──
  title: {
    fontSize: 34,
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: -0.5,
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 48,
  },

  // ── CTA ──
  ctaWrap: {
    width: '100%',
  },
  ctaBtn: {
    height: 56,
    borderRadius: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingLeft: 28,
    paddingRight: 12,
    shadowColor: '#FF6B00',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.38,
    shadowRadius: 16,
    elevation: 8,
    width: '100%',
  },
  ctaBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  arrowCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
