/**
 * RegisterScreen — habFitt sign-up screen.
 * "Electric Momentum" dark theme — mirrors LoginScreen design language.
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
  Switch,
  Modal,
  StatusBar,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { colors, gradientColors } from '../theme/colors';
import LogoMark from '../components/LogoMark';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// DD-MM-YYYY → Date object
function parseDDMMYYYY(str) {
  if (!str || str.length !== 10) return null;
  const parts = str.split('-');
  if (parts.length !== 3) return null;
  const [d, m, y] = parts;
  const date = new Date(`${y}-${m}-${d}`);
  return isNaN(date.getTime()) ? null : date;
}

// Date object → DD-MM-YYYY display
function formatDisplay(date) {
  const d = String(date.getDate()).padStart(2, '0');
  const m = String(date.getMonth() + 1).padStart(2, '0');
  return `${d}-${m}-${date.getFullYear()}`;
}

// DD-MM-YYYY → YYYY-MM-DD for backend
function toBackendDate(displayDate) {
  if (!displayDate || displayDate.length !== 10) return '';
  const [d, m, y] = displayDate.split('-');
  return `${y}-${m}-${d}`;
}

export default function RegisterScreen({ navigation }) {
  const { register, isLoading, error, clearError } = useAuth();

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    countryCode: '+91',
    phone: '',
    dateOfBirth: '',
    password: '',
    confirmPassword: '',
    tosAccepted: false,
    privacyAccepted: false,
  });

  const [fieldErrors, setFieldErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [pickerDate, setPickerDate] = useState(new Date(1990, 0, 1));

  const update = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (fieldErrors[field]) {
      setFieldErrors((prev) => ({ ...prev, [field]: null }));
    }
    clearError();
  };

  // Country code: must start with +, followed by 1-4 digits
  const handleCountryCodeChange = (text) => {
    let val = text;
    if (!val.startsWith('+')) val = '+' + val.replace(/\D/g, '');
    else val = '+' + val.slice(1).replace(/\D/g, '');
    if (val.length <= 5) update('countryCode', val);
  };

  // Allow only digits and spaces in phone input
  const handlePhoneChange = (text) => {
    const filtered = text.replace(/[^0-9 ]/g, '');
    update('phone', filtered);
  };

  // Calendar picker confirmed
  const handleDatePickerChange = (event, selectedDate) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    if (selectedDate) {
      setPickerDate(selectedDate);
      update('dateOfBirth', formatDisplay(selectedDate));
    }
  };

  // Manual text entry — sync picker if valid
  const handleDOBTextChange = (text) => {
    update('dateOfBirth', text);
    const parsed = parseDDMMYYYY(text);
    if (parsed) setPickerDate(parsed);
  };

  const validate = () => {
    const errors = {};

    if (!form.firstName.trim()) errors.firstName = 'First name is required';
    if (!form.lastName.trim()) errors.lastName = 'Last name is required';

    if (!form.email.trim()) {
      errors.email = 'Email is required';
    } else if (!EMAIL_REGEX.test(form.email)) {
      errors.email = 'Enter a valid email address';
    }

    if (!form.countryCode || !/^\+\d{1,4}$/.test(form.countryCode)) {
      errors.countryCode = 'Enter a valid country code (e.g. +91)';
    }

    const digitsOnly = form.phone.replace(/\s/g, '');
    if (!digitsOnly) {
      errors.phone = 'Phone number is required';
    } else if (!/^\d{10}$/.test(digitsOnly)) {
      errors.phone = 'Enter a valid 10-digit mobile number (numbers only)';
    }

    if (!form.dateOfBirth.trim()) {
      errors.dateOfBirth = 'Date of birth is required';
    } else if (!parseDDMMYYYY(form.dateOfBirth)) {
      errors.dateOfBirth = 'Use DD-MM-YYYY format — e.g. 15-01-1990';
    }

    const PASSWORD_CHARSET = /^[a-zA-Z0-9@_\-!#$%&*.?,+=^~()]+$/;
    if (!form.password) {
      errors.password = 'Password is required';
    } else if (form.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    } else if (!PASSWORD_CHARSET.test(form.password)) {
      errors.password = 'Only letters, digits and common symbols (@_-!#$%&*.?,+=^~()) are allowed';
    }

    if (!form.confirmPassword) {
      errors.confirmPassword = 'Please confirm your password';
    } else if (form.password !== form.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    if (!form.tosAccepted) errors.tosAccepted = 'You must accept the Terms of Service';
    if (!form.privacyAccepted) errors.privacyAccepted = 'You must accept the Privacy Policy';

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleRegister = async () => {
    if (!validate()) return;
    const phoneE164 = form.countryCode.trim() + form.phone.replace(/\s/g, '');
    try {
      await register({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim().toLowerCase(),
        phone: phoneE164,
        dateOfBirth: toBackendDate(form.dateOfBirth),
        password: form.password,
        role: 'PATIENT',
      });
      navigation.navigate('VerifyEmail', {
        email: form.email.trim().toLowerCase(),
      });
    } catch {
      // Error displayed via context.error — form values are preserved
    }
  };

  // Returns active/error/null border override for an inputWrapper
  const borderStyle = (field, hasValue) => {
    if (fieldErrors[field]) return styles.inputWrapperError;
    if (hasValue) return styles.inputWrapperActive;
    return null;
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar barStyle="light-content" backgroundColor={colors.bgPrimary} />

      {/* Ambient orange glow — top-centre */}
      <View style={styles.ambientGlow} pointerEvents="none" />

      {/* Back button — top-left, mirrors LoginScreen close button */}
      <TouchableOpacity
        style={styles.backBtn}
        onPress={() => navigation.goBack()}
        accessibilityLabel="Go back"
        testID="register-back-button"
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
          <Text style={styles.headingTitle}>Create account.</Text>
          <Text style={styles.headingSubtitle}>Your health journey starts here</Text>
        </View>

        {/* ── Form card ── */}
        <View style={styles.card}>

          {/* Server error banner */}
          {error ? (
            <View style={styles.errorBanner}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {/* ── Name row — two halves ── */}
          <View style={styles.nameRow}>
            <View style={styles.nameHalf}>
              <View style={[styles.inputWrapper, borderStyle('firstName', form.firstName.length > 0)]}>
                <Ionicons name="person-outline" size={18} color="#666" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="First name"
                  placeholderTextColor="#4A4A4A"
                  value={form.firstName}
                  onChangeText={(v) => update('firstName', v)}
                  autoCapitalize="words"
                  editable={!isLoading}
                  testID="register-first-name"
                />
              </View>
              {fieldErrors.firstName ? (
                <Text style={styles.fieldError}>{fieldErrors.firstName}</Text>
              ) : null}
            </View>

            <View style={styles.nameHalf}>
              <View style={[styles.inputWrapper, borderStyle('lastName', form.lastName.length > 0)]}>
                <Ionicons name="person-outline" size={18} color="#666" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Last name"
                  placeholderTextColor="#4A4A4A"
                  value={form.lastName}
                  onChangeText={(v) => update('lastName', v)}
                  autoCapitalize="words"
                  editable={!isLoading}
                  testID="register-last-name"
                />
              </View>
              {fieldErrors.lastName ? (
                <Text style={styles.fieldError}>{fieldErrors.lastName}</Text>
              ) : null}
            </View>
          </View>

          {/* ── Email ── */}
          <View style={styles.inputGroup}>
            <View style={[styles.inputWrapper, borderStyle('email', form.email.length > 0)]}>
              <Ionicons name="mail-outline" size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Email address"
                placeholderTextColor="#4A4A4A"
                value={form.email}
                onChangeText={(v) => update('email', v)}
                autoCapitalize="none"
                keyboardType="email-address"
                autoComplete="email"
                editable={!isLoading}
                testID="register-email"
              />
            </View>
            {fieldErrors.email ? (
              <Text style={styles.fieldError}>{fieldErrors.email}</Text>
            ) : null}
          </View>

          {/* ── Phone — country code + local number ── */}
          <View style={styles.inputGroup}>
            <View style={[
              styles.inputWrapper,
              (fieldErrors.countryCode || fieldErrors.phone)
                ? styles.inputWrapperError
                : (form.countryCode.length > 1 || form.phone.length > 0)
                  ? styles.inputWrapperActive
                  : null,
            ]}>
              <Ionicons name="call-outline" size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.countryCodeInput}
                value={form.countryCode}
                onChangeText={handleCountryCodeChange}
                keyboardType="phone-pad"
                maxLength={5}
                editable={!isLoading}
                placeholderTextColor="#4A4A4A"
              />
              <View style={styles.phoneDivider} />
              <TextInput
                style={[styles.input, styles.phoneNumberInput]}
                placeholder="98765 43210"
                placeholderTextColor="#4A4A4A"
                value={form.phone}
                onChangeText={handlePhoneChange}
                keyboardType="number-pad"
                maxLength={13}
                editable={!isLoading}
                testID="register-phone"
              />
            </View>
            {fieldErrors.countryCode ? (
              <Text style={styles.fieldError}>{fieldErrors.countryCode}</Text>
            ) : null}
            {fieldErrors.phone ? (
              <Text style={styles.fieldError}>{fieldErrors.phone}</Text>
            ) : !fieldErrors.countryCode ? (
              <Text style={styles.hint}>Country code + 10-digit mobile number</Text>
            ) : null}
          </View>

          {/* ── Date of Birth ── */}
          <View style={styles.inputGroup}>
            <View style={[styles.inputWrapper, borderStyle('dateOfBirth', form.dateOfBirth.length > 0)]}>
              <Ionicons name="calendar-outline" size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="DD-MM-YYYY"
                placeholderTextColor="#4A4A4A"
                value={form.dateOfBirth}
                onChangeText={handleDOBTextChange}
                keyboardType="numbers-and-punctuation"
                maxLength={10}
                editable={!isLoading}
                testID="register-dob"
              />
              <TouchableOpacity
                style={styles.eyeToggle}
                onPress={() => setShowDatePicker(true)}
                disabled={isLoading}
                accessibilityLabel="Open date picker"
              >
                <Ionicons name="chevron-down-outline" size={20} color="#666" />
              </TouchableOpacity>
            </View>
            {fieldErrors.dateOfBirth ? (
              <Text style={styles.fieldError}>{fieldErrors.dateOfBirth}</Text>
            ) : (
              <Text style={styles.hint}>Type or tap ∨ to pick from calendar</Text>
            )}
          </View>

          {/* iOS date picker — dark bottom-sheet modal */}
          {Platform.OS === 'ios' && (
            <Modal
              transparent
              animationType="slide"
              visible={showDatePicker}
              onRequestClose={() => setShowDatePicker(false)}
            >
              <View style={styles.pickerOverlay}>
                <View style={styles.pickerContainer}>
                  <View style={styles.pickerHeader}>
                    <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                      <Text style={styles.pickerDone}>Done</Text>
                    </TouchableOpacity>
                  </View>
                  <DateTimePicker
                    value={pickerDate}
                    mode="date"
                    display="spinner"
                    onChange={handleDatePickerChange}
                    maximumDate={new Date()}
                    minimumDate={new Date(1900, 0, 1)}
                    themeVariant="dark"
                  />
                </View>
              </View>
            </Modal>
          )}

          {/* Android date picker — native calendar dialog */}
          {showDatePicker && Platform.OS === 'android' && (
            <DateTimePicker
              value={pickerDate}
              mode="date"
              display="calendar"
              onChange={handleDatePickerChange}
              maximumDate={new Date()}
              minimumDate={new Date(1900, 0, 1)}
            />
          )}

          {/* ── Password ── */}
          <View style={styles.inputGroup}>
            <View style={[styles.inputWrapper, borderStyle('password', form.password.length > 0)]}>
              <Ionicons name="lock-closed-outline" size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={[styles.input, styles.passwordInput]}
                placeholder="Min 6 characters"
                placeholderTextColor="#4A4A4A"
                value={form.password}
                onChangeText={(v) => update('password', v)}
                secureTextEntry={!showPassword}
                textContentType="none"
                autoComplete="off"
                editable={!isLoading}
                testID="register-password"
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
            ) : null}
          </View>

          {/* ── Confirm Password ── */}
          <View style={styles.inputGroup}>
            <View style={[styles.inputWrapper, borderStyle('confirmPassword', form.confirmPassword.length > 0)]}>
              <Ionicons name="lock-closed-outline" size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={[styles.input, styles.passwordInput]}
                placeholder="Repeat your password"
                placeholderTextColor="#4A4A4A"
                value={form.confirmPassword}
                onChangeText={(v) => update('confirmPassword', v)}
                secureTextEntry={!showConfirmPassword}
                textContentType="none"
                autoComplete="off"
                editable={!isLoading}
                testID="register-confirm-password"
              />
              <TouchableOpacity
                onPress={() => setShowConfirmPassword((v) => !v)}
                style={styles.eyeToggle}
                accessibilityLabel={showConfirmPassword ? 'Hide password' : 'Show password'}
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

          {/* ── Consent divider ── */}
          <View style={styles.consentDivider} />

          {/* Terms of Service */}
          <View style={styles.consentRow}>
            <Switch
              value={form.tosAccepted}
              onValueChange={(v) => update('tosAccepted', v)}
              trackColor={{ false: '#303030', true: 'rgba(255,107,0,0.55)' }}
              thumbColor={form.tosAccepted ? colors.textAccent : '#666'}
              disabled={isLoading}
            />
            <Text style={styles.consentText}>
              I accept the{' '}
              <Text style={styles.consentLink}>Terms of Service</Text> (v1.0)
            </Text>
          </View>
          {fieldErrors.tosAccepted ? (
            <Text style={[styles.fieldError, { marginBottom: 8 }]}>{fieldErrors.tosAccepted}</Text>
          ) : null}

          {/* Privacy Policy */}
          <View style={styles.consentRow}>
            <Switch
              value={form.privacyAccepted}
              onValueChange={(v) => update('privacyAccepted', v)}
              trackColor={{ false: '#303030', true: 'rgba(255,107,0,0.55)' }}
              thumbColor={form.privacyAccepted ? colors.textAccent : '#666'}
              disabled={isLoading}
            />
            <Text style={styles.consentText}>
              I accept the{' '}
              <Text style={styles.consentLink}>Privacy Policy</Text> (v1.0)
            </Text>
          </View>
          {fieldErrors.privacyAccepted ? (
            <Text style={[styles.fieldError, { marginBottom: 4 }]}>{fieldErrors.privacyAccepted}</Text>
          ) : null}

          {/* ── Create Account CTA ── */}
          <TouchableOpacity
            onPress={handleRegister}
            disabled={isLoading}
            activeOpacity={0.85}
            style={styles.ctaWrap}
            testID="register-submit-button"
          >
            <LinearGradient
              colors={isLoading ? ['#444', '#333'] : gradientColors}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.submitBtn, isLoading && styles.submitBtnDisabled]}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Text style={styles.submitBtnText}>Create Account</Text>
                  <View style={styles.arrowCircle}>
                    <Ionicons name="arrow-forward" size={18} color="#fff" />
                  </View>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>

        </View>

        {/* ── Sign In link ── */}
        <View style={styles.signinRow}>
          <Text style={styles.signinText}>Already have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={styles.signinLink}>Sign In →</Text>
          </TouchableOpacity>
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
    marginBottom: 32,
  },

  // ── Heading ──
  headingBlock: {
    marginBottom: 24,
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

  // ── Name row ──
  nameRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 0,
  },
  nameHalf: {
    flex: 1,
    marginBottom: 14,
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
  inputWrapperError: {
    borderColor: 'rgba(232,64,0,0.7)',
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

  // Phone
  countryCodeInput: {
    width: 44,
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
    height: 56,
  },
  phoneDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#404040',
    marginHorizontal: 10,
  },
  phoneNumberInput: {
    marginLeft: 0,
  },

  // Field-level error + hint
  fieldError: {
    color: '#FF6B6B',
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
  hint: {
    color: '#555',
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },

  // ── Date picker modal (dark) ──
  pickerOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.65)',
  },
  pickerContainer: {
    backgroundColor: colors.bgSecondary,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 34,
    borderTopWidth: 1,
    borderTopColor: colors.cardBorder,
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A2A',
  },
  pickerDone: {
    color: colors.textAccent,
    fontWeight: '700',
    fontSize: 16,
    paddingHorizontal: 8,
  },

  // ── Consents ──
  consentDivider: {
    height: 1,
    backgroundColor: '#2A2A2A',
    marginBottom: 18,
  },
  consentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 10,
  },
  consentText: {
    flex: 1,
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  consentLink: {
    color: colors.textAccent,
    fontWeight: '600',
  },

  // ── CTA button ──
  ctaWrap: {
    marginTop: 20,
  },
  submitBtn: {
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
  submitBtnDisabled: {
    opacity: 0.6,
    justifyContent: 'center',
  },
  submitBtnText: {
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
  signinRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  signinText: {
    fontSize: 14,
    color: '#666',
  },
  signinLink: {
    fontSize: 14,
    color: colors.textAccent,
    fontWeight: '600',
  },
});
