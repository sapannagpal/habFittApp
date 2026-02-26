import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator } from 'react-native';
import { useAuth } from '../context/AuthContext';

export default function LoginScreen({ navigation }) {
  const { login, isLoading, error, clearError } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password) return;
    clearError();
    try {
      await login(email.trim().toLowerCase(), password);
    } catch {}
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Text style={styles.logo}>habFitt</Text>
        <Text style={styles.title}>Welcome back</Text>
        <Text style={styles.subtitle}>Sign in to your account</Text>

        {error ? <View style={styles.errorBanner}><Text style={styles.errorText}>{error}</Text></View> : null}

        <Text style={styles.label}>Email</Text>
        <TextInput style={styles.input} placeholder="you@example.com" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" autoComplete="email" returnKeyType="next" editable={!isLoading} testID="login-email-input" />

        <Text style={styles.label}>Password</Text>
        <View style={styles.passwordRow}>
          <TextInput style={[styles.input, styles.passwordInput]} placeholder="Enter password" value={password} onChangeText={setPassword} secureTextEntry={!showPassword} returnKeyType="done" onSubmitEditing={handleLogin} editable={!isLoading} testID="login-password-input" />
          <TouchableOpacity style={styles.showBtn} onPress={() => setShowPassword(v => !v)}>
            <Text style={styles.showBtnText}>{showPassword ? 'Hide' : 'Show'}</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={[styles.button, isLoading && styles.buttonDisabled]} onPress={handleLogin} disabled={isLoading} testID="login-submit-button">
          {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Sign In</Text>}
        </TouchableOpacity>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Don't have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Register')}>
            <Text style={styles.link}>Sign Up</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  scroll: { flexGrow: 1, padding: 24, justifyContent: 'center' },
  logo: { fontSize: 38, fontWeight: '800', color: '#4A90E2', textAlign: 'center', marginBottom: 8, letterSpacing: -1 },
  title: { fontSize: 26, fontWeight: 'bold', color: '#222', textAlign: 'center', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#888', textAlign: 'center', marginBottom: 32 },
  errorBanner: { backgroundColor: '#FFEBEE', borderRadius: 8, padding: 12, marginBottom: 16, borderLeftWidth: 3, borderLeftColor: '#E53935' },
  errorText: { color: '#C62828', fontSize: 14, lineHeight: 20 },
  label: { fontSize: 13, fontWeight: '600', color: '#555', marginBottom: 6, marginTop: 16 },
  input: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#ddd', borderRadius: 10, padding: 14, fontSize: 16, color: '#333' },
  passwordRow: { position: 'relative' },
  passwordInput: { paddingRight: 64 },
  showBtn: { position: 'absolute', right: 14, top: 0, bottom: 0, justifyContent: 'center' },
  showBtnText: { color: '#4A90E2', fontWeight: '600', fontSize: 14 },
  button: { backgroundColor: '#4A90E2', borderRadius: 10, padding: 16, alignItems: 'center', marginTop: 28 },
  buttonDisabled: { backgroundColor: '#90C4F1' },
  buttonText: { color: '#fff', fontSize: 17, fontWeight: '700' },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 24 },
  footerText: { color: '#888', fontSize: 14 },
  link: { color: '#4A90E2', fontWeight: '600', fontSize: 14 },
});
