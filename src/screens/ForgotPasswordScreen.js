/**
 * ForgotPasswordScreen — habFitt forgot-password entry point.
 * "Electric Momentum" dark theme — identical visual language to LoginScreen.
 *
 * Flow: user enters email → POST /auth/password/forgot → navigate to ResetCode
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { authApi } from '../api/authApi';
import { colors, gradientColors } from '../theme/colors';
import LogoMark from '../components/LogoMark';

// ─── Error extraction helper ──────────────────────────────────────────────────

function extractErrorMessage(error) {
  if (error.response?.data?.error?.message) return error.response.data.error.message;
  if (error.response?.data?.message) return error.response.data.message;
  if (!error.response) return 'Unable to reach server. Check your connection.';
  return 'Something went wrong. Please try again.';
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ForgotPasswordScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async () => {
    setError(null);
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) { setError('Email is required'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setError('Enter a valid email address');
      return;
    }
    setIsLoading(true);
    try {
      await authApi.forgotPassword(trimmed);
      navigation.navigate('ResetCode', { email: trimmed });
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar barStyle="light-content" backgroundColor={colors.bgPrimary} />

      {/* Ambient orange glow — top-centre */}
      <View style={styles.ambientGlow} pointerEvents="none" />

      {/* Back button — top-left, 44×44 tap target */}
      <TouchableOpacity
        style={styles.backBtn}
        onPress={() => navigation.goBack()}
        accessibilityLabel="Go back"
        testID="forgot-back-button"
      >
        <Ionicons name="chevron-back" size={24} color="#888480" />
      </TouchableOpacity>

      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ── Logo ── */}
        <View style={styles.logoWrap}>
          <LogoMark size="md" />
        </View>

        {/* ── Heading ── */}
        <View style={styles.headingBlock}>
          <Text style={styles.headingTitle}>Reset password.</Text>
          <Text style={styles.headingSubtitle}>
            Enter your email and we'll send you a reset code
          </Text>
        </View>

        {/* ── Form card ── */}
        <View style={styles.card}>

          {/* Email input */}
          <View style={[styles.inputWrapper, email.length > 0 && styles.inputWrapperActive]}>
            <Ionicons name="mail-outline" size={20} color="#666" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Email address"
              placeholderTextColor="#4A4A4A"
              value={email}
              onChangeText={(v) => { setEmail(v); setError(null); }}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              returnKeyType="done"
              onSubmitEditing={handleSubmit}
              testID="forgot-email-input"
            />
          </View>

          {/* Error banner */}
          {error ? (
            <View style={styles.errorBanner}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {/* Send Reset Code CTA */}
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={isLoading}
            activeOpacity={0.85}
            testID="forgot-submit-button"
          >
            <LinearGradient
              colors={isLoading ? ['#444', '#333'] : gradientColors}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.ctaBtn}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Text style={styles.ctaBtnText}>Send Reset Code</Text>
                  <View style={styles.arrowCircle}>
                    <Ionicons name="arrow-forward" size={18} color="#fff" />
                  </View>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>

        </View>

        {/* ── Sign In link ── */}
        <View style={styles.signInRow}>
          <Text style={styles.signInText}>Remember your password? </Text>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.signInLink}>Sign In →</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
  },

  // Ambient orange glow — absolute, top-centre
  ambientGlow: {
    position: 'absolute',
    top: -120,
    alignSelf: 'center',
    width: 340,
    height: 340,
    borderRadius: 170,
    backgroundColor: 'rgba(255,107,0,0.10)',
  },

  // Back button — top-left, 44×44 tap target
  backBtn: {
    position: 'absolute',
    top: 52,
    left: 20,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },

  scroll: {
    flexGrow: 1,
    paddingTop: 56,
    paddingHorizontal: 24,
    paddingBottom: 44,
  },

  // ── Logo ──
  logoWrap: {
    alignItems: 'center',
    marginBottom: 48,
  },

  // ── Heading ──
  headingBlock: {
    marginBottom: 28,
  },
  headingTitle: {
    fontSize: 34,
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  headingSubtitle: {
    fontSize: 15,
    color: colors.textSecondary,
    fontWeight: '400',
  },

  // ── Card ──
  card: {
    backgroundColor: colors.bgSecondary,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: 20,
    padding: 24,
    marginBottom: 28,
  },

  // ── Email input ──
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgCard,
    borderWidth: 1.5,
    borderColor: '#303030',
    borderRadius: 14,
    height: 56,
    paddingHorizontal: 16,
  },
  inputWrapperActive: {
    borderColor: 'rgba(255,107,0,0.5)',
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: colors.textPrimary,
    height: 56,
  },

  // ── Error banner ──
  errorBanner: {
    backgroundColor: 'rgba(232,64,0,0.12)',
    borderRadius: 10,
    padding: 12,
    marginTop: 14,
    borderLeftWidth: 3,
    borderLeftColor: colors.gradientEnd,
  },
  errorText: {
    color: colors.textAccent,
    fontSize: 13,
    lineHeight: 18,
  },

  // ── CTA button ──
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
    marginTop: 22,
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

  // ── Sign In link ──
  signInRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  signInText: {
    fontSize: 14,
    color: '#666',
  },
  signInLink: {
    fontSize: 14,
    color: colors.textAccent,
    fontWeight: '600',
  },
});
