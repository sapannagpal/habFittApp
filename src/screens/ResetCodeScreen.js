/**
 * ResetCodeScreen — habFitt OTP verification step.
 * "Electric Momentum" dark theme.
 *
 * Accepts a 6-digit code sent to the user's email.
 * On success → navigate to ResetPassword with the server-issued reset_token.
 * Supports resend with a 60-second cooldown timer.
 */
import React, { useState, useEffect, useRef } from 'react';
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

export default function ResetCodeScreen({ navigation, route }) {
  const { email } = route.params;

  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [cooldown, setCooldown] = useState(60);
  const [attemptsExhausted, setAttemptsExhausted] = useState(false);
  const [resendTrigger, setResendTrigger] = useState(0);

  const inputRef = useRef(null);

  // ── Cooldown timer — restarts whenever resendTrigger changes ──
  useEffect(() => {
    const interval = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) { clearInterval(interval); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [resendTrigger]);

  // ── Focus hidden input on mount ──
  useEffect(() => {
    const timeout = setTimeout(() => inputRef.current?.focus(), 300);
    return () => clearTimeout(timeout);
  }, []);

  // ─── Handlers ────────────────────────────────────────────────────────────────

  const handleCodeChange = (text) => {
    const digits = text.replace(/\D/g, '').slice(0, 6);
    setCode(digits);
    setError(null);
    if (digits.length === 6) handleVerify(digits);
  };

  const handleVerify = async (codeToVerify) => {
    if (isLoading) return;
    const c = codeToVerify || code;
    if (c.length !== 6) { setError('Please enter the complete 6-digit code'); return; }
    setIsLoading(true);
    setError(null);
    try {
      const { data } = await authApi.verifyResetCode(email, c);
      navigation.navigate('ResetPassword', { email, resetToken: data.reset_token });
    } catch (err) {
      setError(extractErrorMessage(err));
      if (err.response?.status === 429) setAttemptsExhausted(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0) return;
    setError(null);
    setCode('');
    setAttemptsExhausted(false);
    try {
      await authApi.forgotPassword(email);
      setCooldown(60);
      setResendTrigger((prev) => prev + 1);
    } catch (err) {
      setError(extractErrorMessage(err));
    }
  };

  // ─── Render ──────────────────────────────────────────────────────────────────

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
        testID="reset-code-back-button"
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
          <Text style={styles.headingTitle}>Enter reset code.</Text>
          <Text style={styles.headingSubtitle}>
            We sent a 6-digit code to{' '}
            <Text style={styles.emailHighlight}>{email}</Text>
          </Text>
        </View>

        {/* ── Form card ── */}
        <View style={styles.card}>

          {/* Hidden TextInput — keyboard driver */}
          <TextInput
            ref={inputRef}
            style={styles.hiddenInput}
            keyboardType="number-pad"
            maxLength={6}
            value={code}
            onChangeText={handleCodeChange}
            testID="reset-code-hidden-input"
          />

          {/* OTP visual boxes */}
          <TouchableOpacity
            activeOpacity={1}
            onPress={() => inputRef.current?.focus()}
            style={styles.otpRow}
          >
            {Array.from({ length: 6 }).map((_, i) => (
              <View
                key={i}
                style={[
                  styles.otpBox,
                  code.length === i
                    ? styles.otpBoxActive
                    : code[i]
                    ? styles.otpBoxFilled
                    : null,
                ]}
              >
                <Text style={styles.otpDigit}>{code[i] || ''}</Text>
              </View>
            ))}
          </TouchableOpacity>

          {/* Error banner */}
          {error ? (
            <View style={styles.errorBanner}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {/* Resend row */}
          <View style={styles.resendRow}>
            <Text style={styles.resendLabel}>Didn't receive a code? </Text>
            <TouchableOpacity
              onPress={handleResend}
              disabled={cooldown > 0}
              testID="reset-resend-button"
            >
              <Text
                style={[
                  styles.resendLink,
                  cooldown > 0 && styles.resendLinkDisabled,
                ]}
              >
                {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Verify Code CTA */}
          <TouchableOpacity
            onPress={() => handleVerify()}
            disabled={isLoading || attemptsExhausted}
            activeOpacity={0.85}
            testID="reset-code-submit-button"
          >
            <LinearGradient
              colors={isLoading || attemptsExhausted ? ['#444', '#333'] : gradientColors}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.ctaBtn}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Text style={styles.ctaBtnText}>Verify Code</Text>
                  <View style={styles.arrowCircle}>
                    <Ionicons name="arrow-forward" size={18} color="#fff" />
                  </View>
                </>
              )}
            </LinearGradient>
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

  ambientGlow: {
    position: 'absolute',
    top: -120,
    alignSelf: 'center',
    width: 340,
    height: 340,
    borderRadius: 170,
    backgroundColor: 'rgba(255,107,0,0.10)',
  },

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

  logoWrap: {
    alignItems: 'center',
    marginBottom: 48,
  },

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
  emailHighlight: {
    color: colors.textPrimary,
    fontWeight: '500',
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

  // ── Hidden input ──
  hiddenInput: {
    position: 'absolute',
    width: 1,
    height: 1,
    opacity: 0,
  },

  // ── OTP boxes ──
  otpRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 24,
  },
  otpBox: {
    width: 48,
    height: 56,
    backgroundColor: colors.bgCard,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#303030',
    alignItems: 'center',
    justifyContent: 'center',
  },
  otpBoxActive: {
    borderColor: 'rgba(255,107,0,0.7)',
  },
  otpBoxFilled: {
    borderColor: 'rgba(255,107,0,0.4)',
  },
  otpDigit: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.textPrimary,
  },

  // ── Error banner ──
  errorBanner: {
    backgroundColor: 'rgba(232,64,0,0.12)',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    borderLeftWidth: 3,
    borderLeftColor: colors.gradientEnd,
  },
  errorText: {
    color: colors.textAccent,
    fontSize: 13,
    lineHeight: 18,
  },

  // ── Resend row ──
  resendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 22,
  },
  resendLabel: {
    color: '#666',
    fontSize: 14,
  },
  resendLink: {
    color: colors.textAccent,
    fontWeight: '600',
    fontSize: 14,
  },
  resendLinkDisabled: {
    color: '#666',
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
