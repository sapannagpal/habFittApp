/**
 * VerifyEmailScreen — habFitt email verification waiting room.
 * "Electric Momentum" dark theme.
 *
 * Shown after registration. User is told to check their email and tap
 * the verification link. Supports opening the mail app, skipping to Login,
 * and resend with 60-second cooldown timer.
 */
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  StatusBar,
  Linking,
  Alert,
  SafeAreaView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { authApi } from '../api/authApi';
import { colors, gradientColors } from '../theme/colors';

// ─── Error extraction helper ──────────────────────────────────────────────────

function extractErrorMessage(error) {
  if (error.response?.data?.error?.message) return error.response.data.error.message;
  if (error.response?.data?.message) return error.response.data.message;
  if (!error.response) return 'Unable to reach server. Check your connection.';
  return 'Something went wrong. Please try again.';
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function VerifyEmailScreen({ navigation, route }) {
  const { email } = route.params ?? {};
  const insets = useSafeAreaInsets();

  const [cooldown, setCooldown] = useState(0);
  const [isResending, setIsResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [error, setError] = useState(null);
  const [resendTrigger, setResendTrigger] = useState(0);

  // ── Cooldown timer — restarts whenever resendTrigger changes ──
  useEffect(() => {
    if (cooldown <= 0) return;
    const interval = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) { clearInterval(interval); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [resendTrigger]);

  // ─── Handlers ──────────────────────────────────────────────────────────────

  const handleResend = async () => {
    if (!email) return;
    if (cooldown > 0 || isResending) return;
    setError(null);
    setResendSuccess(false);
    setIsResending(true);
    try {
      await authApi.resendVerificationEmail(email);
      setResendSuccess(true);
      setCooldown(60);
      setResendTrigger((prev) => prev + 1);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setIsResending(false);
    }
  };

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#141414" />

      {/* Back button */}
      <TouchableOpacity
        style={[styles.backButton, { top: insets.top + 8 }]}
        onPress={() => navigation.goBack()}
        activeOpacity={0.8}
      >
        <Ionicons name="chevron-back" size={20} color="#CCCCCC" />
      </TouchableOpacity>

      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >

        {/* ── Envelope illustration ── */}
        <View style={styles.illustrationWrap}>
          <View style={styles.outerRing}>
            <View style={styles.innerRing}>
              <View style={styles.envelopeCard}>
                <Ionicons name="mail-outline" size={36} color="#FF6B00" />
              </View>
            </View>
          </View>
        </View>

        {/* ── Title ── */}
        <Text style={styles.title}>Check your inbox.</Text>

        {/* ── Subtitle ── */}
        <Text style={styles.subtitle}>
          {'We sent a verification link to '}
          <Text style={styles.emailHighlight}>{email ?? 'your email'}</Text>
          {'. Tap it to verify your account.'}
        </Text>

        {/* ── Primary CTA — Open Email App ── */}
        <TouchableOpacity
          onPress={async () => {
            try {
              const supported = await Linking.canOpenURL('mailto:');
              if (supported) {
                await Linking.openURL('mailto:');
              } else {
                Alert.alert(
                  'No email app found',
                  'Please open your email app manually to find the verification link.',
                  [{ text: 'OK' }]
                );
              }
            } catch {
              Alert.alert(
                'Unable to open email app',
                'Please open your email app manually to find the verification link.',
                [{ text: 'OK' }]
              );
            }
          }}
          activeOpacity={0.85}
          style={{ alignSelf: 'stretch' }}
        >
          <LinearGradient
            colors={gradientColors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.primaryBtn}
          >
            <Text style={styles.primaryBtnText}>Open Email App</Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* ── Secondary CTA — Continue without verifying ── */}
        <TouchableOpacity
          style={styles.secondaryBtn}
          onPress={() => navigation.navigate('Login')}
          activeOpacity={0.8}
          testID="verify-go-to-login"
        >
          <Text style={styles.secondaryBtnText}>Continue without verifying</Text>
        </TouchableOpacity>

        {/* ── Spam tip card ── */}
        <View style={styles.spamCard}>
          <Ionicons
            name="information-circle-outline"
            size={18}
            color="#888480"
            style={styles.spamIcon}
          />
          <Text style={styles.spamText}>
            {"Can't find it? Check your spam folder — it can end up there sometimes."}
          </Text>
        </View>

        {/* ── Success banner ── */}
        {resendSuccess ? (
          <View style={styles.successBanner}>
            <Ionicons name="checkmark-circle" size={16} color="#4CAF50" style={{ marginRight: 6 }} />
            <Text style={styles.successText}>Verification email resent. Check your inbox.</Text>
          </View>
        ) : null}

        {/* ── Error banner ── */}
        {error ? (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {/* ── Resend row ── */}
        <View style={styles.resendRow}>
          <Text style={styles.resendLabel}>{"Didn't receive the email?"}</Text>
          <TouchableOpacity
            onPress={handleResend}
            disabled={!email || cooldown > 0 || isResending}
            testID="verify-resend-button"
          >
            {isResending ? (
              <ActivityIndicator size="small" color="#FF6B00" />
            ) : (
              <Text
                style={[
                  styles.resendLink,
                  (cooldown > 0 || isResending) && styles.resendLinkDisabled,
                ]}
              >
                {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend verification email'}
              </Text>
            )}
          </TouchableOpacity>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
  },

  // Back button — absolute top-left (top offset applied dynamically via insets)
  backButton: {
    position: 'absolute',
    left: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.bgSecondary,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },

  scroll: {
    flexGrow: 1,
    paddingTop: 120,
    paddingHorizontal: 24,
    paddingBottom: 44,
  },

  // ── Illustration ──
  illustrationWrap: {
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 32,
  },
  outerRing: {
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: 'rgba(255,107,0,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  innerRing: {
    width: 104,
    height: 104,
    borderRadius: 52,
    backgroundColor: 'rgba(255,107,0,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  envelopeCard: {
    width: 80,
    height: 80,
    borderRadius: 22,
    backgroundColor: colors.bgSecondary,
    borderWidth: 1,
    borderColor: 'rgba(255,107,0,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Text ──
  title: {
    fontSize: 30,
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: -0.4,
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 36,
  },
  emailHighlight: {
    color: colors.textAccent,
    fontWeight: '600',
  },

  // ── Primary button ──
  primaryBtn: {
    width: '100%',
    height: 56,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  primaryBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },

  // ── Secondary button ──
  secondaryBtn: {
    width: '100%',
    height: 50,
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: colors.cardBorder,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
  },
  secondaryBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textSecondary,
  },

  // ── Spam tip card ──
  spamCard: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.bgSecondary,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 12,
    marginBottom: 28,
  },
  spamIcon: {
    marginRight: 10,
    marginTop: 1,
  },
  spamText: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
    flex: 1,
  },

  // ── Success banner ──
  successBanner: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(76,175,80,0.10)',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    borderLeftWidth: 3,
    borderLeftColor: '#4CAF50',
  },
  successText: {
    color: '#4CAF50',
    fontSize: 13,
    flex: 1,
  },

  // ── Error banner ──
  errorBanner: {
    width: '100%',
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
    flexWrap: 'wrap',
    gap: 4,
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
});
