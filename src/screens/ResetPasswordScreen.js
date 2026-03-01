/**
 * ResetPasswordScreen — habFitt new-password entry step.
 * "Electric Momentum" dark theme.
 *
 * Accepts a new password + confirmation, then calls POST /auth/password/reset.
 * On success → navigate to PasswordResetSuccess (terminal).
 * On 401/410 (expired/invalid token) → bounce back to ForgotPassword start.
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

// ─── Constants ────────────────────────────────────────────────────────────────

const PASSWORD_CHARSET = /^[a-zA-Z0-9@_\-!#$%&*.?,+=^~()]+$/;

// ─── Error extraction helper ──────────────────────────────────────────────────

function extractErrorMessage(error) {
  if (error.response?.data?.error?.message) return error.response.data.error.message;
  if (error.response?.data?.message) return error.response.data.message;
  if (!error.response) return 'Unable to reach server. Check your connection.';
  return 'Something went wrong. Please try again.';
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ResetPasswordScreen({ navigation, route }) {
  const { email, resetToken } = route.params;

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});

  // ─── Validation ─────────────────────────────────────────────────────────────

  const validate = () => {
    const errors = {};
    if (!password) errors.password = 'Password is required';
    else if (password.length < 6) errors.password = 'Password must be at least 6 characters';
    else if (!PASSWORD_CHARSET.test(password)) errors.password = 'Only letters, digits and common symbols allowed';
    if (!confirmPassword) errors.confirmPassword = 'Please confirm your password';
    else if (password !== confirmPassword) errors.confirmPassword = 'Passwords do not match';
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // ─── Border helper ───────────────────────────────────────────────────────────

  const borderStyle = (field, hasValue) => {
    if (fieldErrors[field]) return { borderColor: 'rgba(232,64,0,0.7)' };
    if (hasValue) return { borderColor: 'rgba(255,107,0,0.5)' };
    return null;
  };

  // ─── Submit handler ──────────────────────────────────────────────────────────

  const handleReset = async () => {
    if (!validate()) return;
    setIsLoading(true);
    setError(null);
    try {
      await authApi.resetPassword(resetToken, password);
      navigation.navigate('PasswordResetSuccess');
    } catch (err) {
      const status = err.response?.status;
      if (status === 401 || status === 410) {
        navigation.navigate('ForgotPassword');
        return;
      }
      setError(extractErrorMessage(err));
    } finally {
      setIsLoading(false);
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
        testID="reset-password-back-button"
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
          <Text style={styles.headingTitle}>New password.</Text>
          <Text style={styles.headingSubtitle}>
            Create a strong password for your account
          </Text>
        </View>

        {/* ── Form card ── */}
        <View style={styles.card}>

          {/* Password input */}
          <View style={styles.inputGroup}>
            <View style={[styles.inputWrapper, borderStyle('password', password.length > 0)]}>
              <Ionicons name="lock-closed-outline" size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={[styles.input, styles.passwordInput]}
                placeholder="New password"
                placeholderTextColor="#4A4A4A"
                value={password}
                onChangeText={(v) => { setPassword(v); setFieldErrors((e) => ({ ...e, password: undefined })); }}
                secureTextEntry={!showPassword}
                returnKeyType="next"
                testID="reset-password-input"
              />
              <TouchableOpacity
                onPress={() => setShowPassword((v) => !v)}
                style={styles.eyeToggle}
                accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
              >
                <Ionicons
                  name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                  size={20}
                  color="#666"
                />
              </TouchableOpacity>
            </View>
            {fieldErrors.password ? (
              <Text style={styles.fieldError}>{fieldErrors.password}</Text>
            ) : (
              <Text style={styles.fieldHint}>
                Min 6 characters. Letters, digits and common symbols.
              </Text>
            )}
          </View>

          {/* Confirm Password input */}
          <View style={styles.inputGroup}>
            <View style={[styles.inputWrapper, borderStyle('confirmPassword', confirmPassword.length > 0)]}>
              <Ionicons name="lock-closed-outline" size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={[styles.input, styles.passwordInput]}
                placeholder="Confirm new password"
                placeholderTextColor="#4A4A4A"
                value={confirmPassword}
                onChangeText={(v) => { setConfirmPassword(v); setFieldErrors((e) => ({ ...e, confirmPassword: undefined })); }}
                secureTextEntry={!showConfirmPassword}
                returnKeyType="done"
                onSubmitEditing={handleReset}
                testID="reset-confirm-password-input"
              />
              <TouchableOpacity
                onPress={() => setShowConfirmPassword((v) => !v)}
                style={styles.eyeToggle}
                accessibilityLabel={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
              >
                <Ionicons
                  name={showConfirmPassword ? 'eye-outline' : 'eye-off-outline'}
                  size={20}
                  color="#666"
                />
              </TouchableOpacity>
            </View>
            {fieldErrors.confirmPassword ? (
              <Text style={styles.fieldError}>{fieldErrors.confirmPassword}</Text>
            ) : null}
          </View>

          {/* Error banner */}
          {error ? (
            <View style={styles.errorBanner}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {/* Reset Password CTA */}
          <TouchableOpacity
            onPress={handleReset}
            disabled={isLoading}
            activeOpacity={0.85}
            testID="reset-password-submit-button"
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
                  <Text style={styles.ctaBtnText}>Reset Password</Text>
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

  // ── Card ──
  card: {
    backgroundColor: colors.bgSecondary,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: 20,
    padding: 24,
    marginBottom: 28,
  },

  // ── Inputs ──
  inputGroup: {
    marginBottom: 16,
  },
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
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: colors.textPrimary,
    height: 56,
  },
  passwordInput: {
    paddingRight: 8,
  },
  eyeToggle: {
    padding: 4,
  },

  // ── Field-level feedback ──
  fieldError: {
    color: '#FF6B6B',
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
  fieldHint: {
    color: '#555',
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
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
    marginTop: 8,
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
