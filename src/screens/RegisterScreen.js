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
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useAuth } from '../context/AuthContext';

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
    countryCode: '+91', // editable country code prefix
    phone: '',          // digits and spaces only
    dateOfBirth: '',    // DD-MM-YYYY display format
    password: '',
    confirmPassword: '',
    tosAccepted: false,
    privacyAccepted: false,
  });

  const [fieldErrors, setFieldErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
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

    const PASSWORD_CHARSET = /^[a-zA-Z0-9@_\-!#$%&*.?,]+$/;
    if (!form.password) {
      errors.password = 'Password is required';
    } else if (form.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    } else if (!PASSWORD_CHARSET.test(form.password)) {
      errors.password = 'Only letters, digits and common symbols (@_-!#$%&*.?,) are allowed';
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

    // Build E.164 phone: strip spaces from local number, prepend editable country code
    const phoneE164 = form.countryCode.trim() + form.phone.replace(/\s/g, '');

    try {
      await register({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim().toLowerCase(),
        phone: phoneE164,
        dateOfBirth: toBackendDate(form.dateOfBirth),
        password: form.password,
        role: 'CUSTOMER',
      });
      navigation.navigate('VerifyEmail', {
        email: form.email.trim().toLowerCase(),
      });
    } catch {
      // Error displayed via context.error — form values are preserved
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>Create Account</Text>
        <Text style={styles.subtitle}>Join habFitt today</Text>

        {/* Server error banner — fields are NOT reset */}
        {error ? (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {/* Name row */}
        <View style={styles.row}>
          <View style={styles.half}>
            <Text style={styles.label}>First Name</Text>
            <TextInput
              style={[styles.input, fieldErrors.firstName && styles.inputError]}
              placeholder="John"
              value={form.firstName}
              onChangeText={(v) => update('firstName', v)}
              autoCapitalize="words"
              editable={!isLoading}
            />
            {fieldErrors.firstName ? (
              <Text style={styles.fieldError}>{fieldErrors.firstName}</Text>
            ) : null}
          </View>
          <View style={styles.halfRight}>
            <Text style={styles.label}>Last Name</Text>
            <TextInput
              style={[styles.input, fieldErrors.lastName && styles.inputError]}
              placeholder="Doe"
              value={form.lastName}
              onChangeText={(v) => update('lastName', v)}
              autoCapitalize="words"
              editable={!isLoading}
            />
            {fieldErrors.lastName ? (
              <Text style={styles.fieldError}>{fieldErrors.lastName}</Text>
            ) : null}
          </View>
        </View>

        {/* Email */}
        <Text style={styles.label}>Email</Text>
        <TextInput
          style={[styles.input, fieldErrors.email && styles.inputError]}
          placeholder="you@example.com"
          value={form.email}
          onChangeText={(v) => update('email', v)}
          autoCapitalize="none"
          keyboardType="email-address"
          editable={!isLoading}
        />
        {fieldErrors.email ? (
          <Text style={styles.fieldError}>{fieldErrors.email}</Text>
        ) : null}

        {/* Phone — editable country code + local number */}
        <Text style={styles.label}>Phone Number</Text>
        <View
          style={[
            styles.phoneRow,
            (fieldErrors.countryCode || fieldErrors.phone) && styles.phoneRowError,
          ]}
        >
          <TextInput
            style={styles.countryCodeInput}
            value={form.countryCode}
            onChangeText={handleCountryCodeChange}
            keyboardType="phone-pad"
            maxLength={5}
            editable={!isLoading}
            placeholder="+91"
          />
          <View style={styles.phoneRowDivider} />
          <TextInput
            style={styles.phoneInput}
            placeholder="98765 43210"
            value={form.phone}
            onChangeText={handlePhoneChange}
            keyboardType="number-pad"
            maxLength={13}
            editable={!isLoading}
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

        {/* Date of Birth — type or pick from calendar */}
        <Text style={styles.label}>Date of Birth</Text>
        <View style={[styles.dobRow, fieldErrors.dateOfBirth && styles.dobRowError]}>
          <TextInput
            style={styles.dobInput}
            placeholder="DD-MM-YYYY"
            value={form.dateOfBirth}
            onChangeText={handleDOBTextChange}
            keyboardType="numbers-and-punctuation"
            maxLength={10}
            editable={!isLoading}
          />
          <TouchableOpacity
            style={styles.calendarBtn}
            onPress={() => setShowDatePicker(true)}
            disabled={isLoading}
          >
            <Text style={styles.calendarIcon}>📅</Text>
          </TouchableOpacity>
        </View>
        {fieldErrors.dateOfBirth ? (
          <Text style={styles.fieldError}>{fieldErrors.dateOfBirth}</Text>
        ) : (
          <Text style={styles.hint}>Tap 📅 to pick or type directly</Text>
        )}

        {/* iOS Date Picker — bottom sheet modal */}
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
                />
              </View>
            </View>
          </Modal>
        )}

        {/* Android Date Picker — native calendar dialog */}
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

        {/* Password */}
        <Text style={styles.label}>Password</Text>
        <View style={styles.passwordRow}>
          <TextInput
            style={[
              styles.input,
              styles.passwordInput,
              fieldErrors.password && styles.inputError,
            ]}
            placeholder="Min 6 characters"
            value={form.password}
            onChangeText={(v) => update('password', v)}
            secureTextEntry={!showPassword}
            textContentType="none"
            autoComplete="off"
            editable={!isLoading}
          />
          <TouchableOpacity
            style={styles.showBtn}
            onPress={() => setShowPassword((v) => !v)}
          >
            <Text style={styles.showBtnText}>{showPassword ? 'Hide' : 'Show'}</Text>
          </TouchableOpacity>
        </View>
        {fieldErrors.password ? (
          <Text style={styles.fieldError}>{fieldErrors.password}</Text>
        ) : null}

        {/* Confirm Password */}
        <Text style={styles.label}>Confirm Password</Text>
        <TextInput
          style={[styles.input, fieldErrors.confirmPassword && styles.inputError]}
          placeholder="Repeat your password"
          value={form.confirmPassword}
          onChangeText={(v) => update('confirmPassword', v)}
          secureTextEntry={!showPassword}
          textContentType="none"
          autoComplete="off"
          editable={!isLoading}
        />
        {fieldErrors.confirmPassword ? (
          <Text style={styles.fieldError}>{fieldErrors.confirmPassword}</Text>
        ) : null}

        {/* Consents */}
        <View style={styles.consentRow}>
          <Switch
            value={form.tosAccepted}
            onValueChange={(v) => update('tosAccepted', v)}
            trackColor={{ false: '#ddd', true: '#4A90E2' }}
            disabled={isLoading}
          />
          <Text style={styles.consentText}>
            I accept the{' '}
            <Text style={styles.consentLink}>Terms of Service</Text> (v1.0)
          </Text>
        </View>
        {fieldErrors.tosAccepted ? (
          <Text style={styles.fieldError}>{fieldErrors.tosAccepted}</Text>
        ) : null}

        <View style={styles.consentRow}>
          <Switch
            value={form.privacyAccepted}
            onValueChange={(v) => update('privacyAccepted', v)}
            trackColor={{ false: '#ddd', true: '#4A90E2' }}
            disabled={isLoading}
          />
          <Text style={styles.consentText}>
            I accept the{' '}
            <Text style={styles.consentLink}>Privacy Policy</Text> (v1.0)
          </Text>
        </View>
        {fieldErrors.privacyAccepted ? (
          <Text style={styles.fieldError}>{fieldErrors.privacyAccepted}</Text>
        ) : null}

        {/* Submit */}
        <TouchableOpacity
          style={[styles.button, isLoading && styles.buttonDisabled]}
          onPress={handleRegister}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Create Account</Text>
          )}
        </TouchableOpacity>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={styles.link}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  scroll: { flexGrow: 1, padding: 24, paddingTop: 40, paddingBottom: 40 },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#222',
    textAlign: 'center',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    marginBottom: 24,
  },
  errorBanner: {
    backgroundColor: '#FFEBEE',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderLeftWidth: 3,
    borderLeftColor: '#E53935',
  },
  errorText: { color: '#C62828', fontSize: 14, lineHeight: 20 },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#555',
    marginBottom: 6,
    marginTop: 16,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 14,
    fontSize: 15,
    color: '#333',
  },
  inputError: { borderColor: '#E53935', borderWidth: 1.5 },
  fieldError: { color: '#E53935', fontSize: 12, marginTop: 4 },
  hint: { color: '#aaa', fontSize: 12, marginTop: 4 },
  row: { flexDirection: 'row', gap: 10 },
  half: { flex: 1 },
  halfRight: { flex: 1 },

  // Phone
  phoneRow: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    overflow: 'hidden',
    alignItems: 'center',
  },
  phoneRowError: { borderColor: '#E53935', borderWidth: 1.5 },
  countryCodeInput: {
    width: 64,
    paddingHorizontal: 12,
    paddingVertical: 14,
    fontSize: 15,
    fontWeight: '700',
    color: '#333',
    backgroundColor: '#f0f4f8',
    textAlign: 'center',
  },
  phoneRowDivider: {
    width: 1,
    alignSelf: 'stretch',
    backgroundColor: '#ddd',
  },
  phoneInput: { flex: 1, padding: 14, fontSize: 15, color: '#333' },

  // Date of birth
  dobRow: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    overflow: 'hidden',
    alignItems: 'center',
  },
  dobRowError: { borderColor: '#E53935', borderWidth: 1.5 },
  dobInput: { flex: 1, padding: 14, fontSize: 15, color: '#333' },
  calendarBtn: { paddingHorizontal: 14, paddingVertical: 10 },
  calendarIcon: { fontSize: 22 },

  // iOS date picker modal
  pickerOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  pickerContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingBottom: 24,
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  pickerDone: { color: '#4A90E2', fontWeight: '700', fontSize: 16, paddingHorizontal: 8 },

  // Password
  passwordRow: { position: 'relative' },
  passwordInput: { paddingRight: 64 },
  showBtn: {
    position: 'absolute',
    right: 14,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
  },
  showBtnText: { color: '#4A90E2', fontWeight: '600', fontSize: 14 },

  // Consents
  consentRow: { flexDirection: 'row', alignItems: 'center', marginTop: 16, gap: 10 },
  consentText: { flex: 1, fontSize: 14, color: '#555', lineHeight: 20 },
  consentLink: { color: '#4A90E2', fontWeight: '600' },

  // Submit
  button: {
    backgroundColor: '#4A90E2',
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 8,
  },
  buttonDisabled: { backgroundColor: '#90C4F1' },
  buttonText: { color: '#fff', fontSize: 17, fontWeight: '700' },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 16, marginBottom: 16 },
  footerText: { color: '#888', fontSize: 14 },
  link: { color: '#4A90E2', fontWeight: '600', fontSize: 14 },
});
