import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

export default function VerifyEmailScreen({ route, navigation }) {
  const { email } = route.params ?? {};

  return (
    <View style={styles.container}>
      <Text style={styles.icon}>📬</Text>
      <Text style={styles.title}>Check your inbox</Text>
      <Text style={styles.subtitle}>We sent a verification link to{"\n"}<Text style={styles.email}>{email ?? 'your email address'}</Text></Text>
      <Text style={styles.instructions}>Click the link in the email to activate your account.{"\n\n"}Didn't receive it? Check your spam folder or wait a few minutes.</Text>
      <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('Login')} testID="verify-go-to-login">
        <Text style={styles.buttonText}>Go to Sign In</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5', justifyContent: 'center', alignItems: 'center', padding: 32 },
  icon: { fontSize: 72, marginBottom: 24 },
  title: { fontSize: 26, fontWeight: 'bold', color: '#222', textAlign: 'center', marginBottom: 12 },
  subtitle: { fontSize: 16, color: '#555', textAlign: 'center', marginBottom: 16, lineHeight: 26 },
  email: { fontWeight: '700', color: '#4A90E2' },
  instructions: { fontSize: 14, color: '#888', textAlign: 'center', lineHeight: 22, marginBottom: 36 },
  button: { backgroundColor: '#4A90E2', borderRadius: 10, paddingVertical: 14, paddingHorizontal: 40 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
