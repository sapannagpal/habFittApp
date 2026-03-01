/**
 * LoginScreen — habFitt sign-in screen.
 * "Electric Momentum" dark theme — matches /tmp/habfitt-login/index.html reference.
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
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, FontAwesome } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { colors, gradientColors } from '../theme/colors';
import LogoMark from '../components/LogoMark';

export default function LoginScreen({ navigation }) {
  const { login, isLoading, error, clearError } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Pulsing dot animation for social proof
  const pulseAnim = useRef(new Animated.Value(0.3)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 0.3, duration: 900, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulseAnim]);

  const handleLogin = async () => {
    if (!email.trim() || !password) return;
    clearError();
    try {
      await login(email.trim().toLowerCase(), password);
    } catch {
      // Error surfaced via context.error
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar barStyle="light-content" backgroundColor={colors.bgPrimary} />

      {/* Ambient orange glow — top-center */}
      <View style={styles.ambientGlow} pointerEvents="none" />

      {/* Close button — top-left, goes back to Welcome */}
      <TouchableOpacity
        style={styles.closeBtn}
        onPress={() => navigation.goBack()}
        accessibilityLabel="Close login"
        testID="login-close-button"
      >
        <Ionicons name="close" size={24} color="#888480" />
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
          <Text style={styles.headingTitle}>Welcome back.</Text>
          <Text style={styles.headingSubtitle}>Sign in to continue your journey</Text>
        </View>

        {/* ── Form card ── */}
        <View style={styles.card}>

          {/* Email input */}
          <View style={styles.inputGroup}>
            <View style={[styles.inputWrapper, email.length > 0 && styles.inputWrapperActive]}>
              <Ionicons name="mail-outline" size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Email address"
                placeholderTextColor="#4A4A4A"
                value={email}
                onChangeText={(v) => { setEmail(v); clearError(); }}
                autoCapitalize="none"
                keyboardType="email-address"
                autoComplete="email"
                returnKeyType="next"
                editable={!isLoading}
                testID="login-email-input"
              />
            </View>
          </View>

          {/* Password input */}
          <View style={styles.inputGroup}>
            <View style={[styles.inputWrapper, password.length > 0 && styles.inputWrapperActive]}>
              <Ionicons name="lock-closed-outline" size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={[styles.input, styles.passwordInput]}
                placeholder="Password"
                placeholderTextColor="#4A4A4A"
                value={password}
                onChangeText={(v) => { setPassword(v); clearError(); }}
                secureTextEntry={!showPassword}
                returnKeyType="done"
                onSubmitEditing={handleLogin}
                editable={!isLoading}
                testID="login-password-input"
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
          </View>

          {/* Error banner */}
          {error ? (
            <View style={styles.errorBanner}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {/* Forgot password */}
          <View style={styles.forgotRow}>
            <TouchableOpacity
              onPress={() => navigation.navigate('ForgotPassword')}
              testID="login-forgot-password"
            >
              <Text style={styles.forgotText}>Forgot password?</Text>
            </TouchableOpacity>
          </View>

          {/* Login CTA */}
          <TouchableOpacity
            onPress={handleLogin}
            disabled={isLoading}
            activeOpacity={0.85}
            testID="login-submit-button"
          >
            <LinearGradient
              colors={isLoading ? ['#444', '#333'] : gradientColors}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.loginBtn, isLoading && styles.loginBtnDisabled]}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Text style={styles.loginBtnText}>Log In</Text>
                  <View style={styles.arrowCircle}>
                    <Ionicons name="arrow-forward" size={18} color="#fff" />
                  </View>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>

        </View>

        {/* ── Divider ── */}
        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or continue with</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* ── Social buttons ── */}
        <View style={styles.socialRow}>
          <TouchableOpacity style={styles.socialBtn} activeOpacity={0.7}>
            <FontAwesome name="apple" size={18} color="#CCC" />
            <Text style={styles.socialBtnText}>Apple</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.socialBtn} activeOpacity={0.7}>
            <FontAwesome name="google" size={16} color="#CCC" />
            <Text style={styles.socialBtnText}>Google</Text>
          </TouchableOpacity>
        </View>

        {/* ── Register link ── */}
        <View style={styles.registerRow}>
          <Text style={styles.registerText}>Don't have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Register')}>
            <Text style={styles.registerLink}>Get Started →</Text>
          </TouchableOpacity>
        </View>

        {/* ── Social proof ── */}
        <View style={styles.socialProof}>
          <View style={styles.pulseDotWrapper}>
            <Animated.View style={[styles.pulseRing, { opacity: pulseAnim }]} />
            <View style={styles.pulseDot} />
          </View>
          <Text style={styles.socialProofText}>100+ professionals already inside</Text>
        </View>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

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

  // Close button — top-left, 44×44 tap target
  closeBtn: {
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

  // ── Inputs ──
  inputGroup: {
    marginBottom: 14,
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
  passwordInput: {
    paddingRight: 8,
  },
  eyeToggle: {
    padding: 4,
  },

  // ── Error ──
  errorBanner: {
    backgroundColor: 'rgba(232,64,0,0.12)',
    borderRadius: 10,
    padding: 12,
    marginBottom: 14,
    borderLeftWidth: 3,
    borderLeftColor: colors.gradientEnd,
  },
  errorText: {
    color: colors.textAccent,
    fontSize: 13,
    lineHeight: 18,
  },

  // ── Forgot password ──
  forgotRow: {
    alignItems: 'flex-end',
    marginTop: 4,
    marginBottom: 22,
  },
  forgotText: {
    fontSize: 13,
    color: colors.textAccent,
    fontWeight: '500',
  },

  // ── Login button ──
  loginBtn: {
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
  loginBtnDisabled: {
    opacity: 0.6,
    justifyContent: 'center',
  },
  loginBtnText: {
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

  // ── Divider ──
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#2A2A2A',
  },
  dividerText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#444',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },

  // ── Social buttons ──
  socialRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 32,
  },
  socialBtn: {
    flex: 1,
    height: 50,
    backgroundColor: colors.bgSecondary,
    borderWidth: 1.5,
    borderColor: '#2E2E2E',
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  socialBtnText: {
    color: '#CCCCCC',
    fontSize: 14,
    fontWeight: '600',
  },

  // ── Register link ──
  registerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
  },
  registerText: {
    fontSize: 14,
    color: '#666',
  },
  registerLink: {
    fontSize: 14,
    color: colors.textAccent,
    fontWeight: '600',
  },

  // ── Social proof ──
  socialProof: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  pulseDotWrapper: {
    width: 14,
    height: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulseRing: {
    position: 'absolute',
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: 'rgba(255,107,0,0.3)',
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.textAccent,
  },
  socialProofText: {
    fontSize: 12,
    color: '#444',
  },
});
