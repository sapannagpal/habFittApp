import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { useAuth } from '../context/AuthContext';

export default function DashboardScreen() {
  const { user, logout, isLoading } = useAuth();

  const handleLogout = () => {
    Alert.alert('Sign Out', 'How would you like to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'This Device', onPress: () => logout(false) },
      { text: 'All Devices', style: 'destructive', onPress: () => logout(true) },
    ]);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{(user?.first_name?.[0] ?? 'U').toUpperCase()}</Text>
        </View>
        <Text style={styles.greeting}>Hello, {user?.first_name ?? 'User'}</Text>
        <Text style={styles.role}>{formatRole(user?.role)}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Account Details</Text>
        <InfoRow label="Name" value={user?.first_name ?? '—'} />
        <InfoRow label="Role" value={formatRole(user?.role)} />
        <InfoRow label="MFA Status" value={user?.mfa_enabled ? 'Enabled ✓' : 'Not enabled'} valueStyle={user?.mfa_enabled ? styles.valueGreen : styles.valueAmber} />
        <InfoRow label="User ID" value={user?.id ? `${user.id.slice(0, 8)}…` : '—'} />
      </View>

      {!user?.mfa_enabled && (
        <View style={styles.mfaAlert}>
          <Text style={styles.mfaAlertTitle}>Secure your account</Text>
          <Text style={styles.mfaAlertBody}>Enable two-factor authentication to protect your health data.</Text>
          <TouchableOpacity style={styles.mfaAlertBtn}>
            <Text style={styles.mfaAlertBtnText}>Enable MFA</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Quick Actions</Text>
        <TouchableOpacity style={styles.actionRow}><Text style={styles.actionLabel}>My Health Data</Text><Text style={styles.chevron}>›</Text></TouchableOpacity>
        <View style={styles.separator} />
        <TouchableOpacity style={styles.actionRow}><Text style={styles.actionLabel}>Appointments</Text><Text style={styles.chevron}>›</Text></TouchableOpacity>
        <View style={styles.separator} />
        <TouchableOpacity style={styles.actionRow}><Text style={styles.actionLabel}>Settings</Text><Text style={styles.chevron}>›</Text></TouchableOpacity>
      </View>

      <TouchableOpacity style={[styles.logoutBtn, isLoading && styles.logoutBtnDisabled]} onPress={handleLogout} disabled={isLoading} testID="dashboard-logout-button">
        {isLoading ? <ActivityIndicator color="#E53935" /> : <Text style={styles.logoutText}>Sign Out</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
}

function InfoRow({ label, value, valueStyle }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={[styles.infoValue, valueStyle]}>{value}</Text>
    </View>
  );
}

function formatRole(role) {
  if (!role) return 'User';
  return role.charAt(0) + role.slice(1).toLowerCase();
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 20, paddingTop: 32, backgroundColor: '#f5f5f5' },
  header: { alignItems: 'center', marginBottom: 24 },
  avatar: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#4A90E2', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  avatarText: { fontSize: 30, color: '#fff', fontWeight: '700' },
  greeting: { fontSize: 24, fontWeight: 'bold', color: '#222' },
  role: { fontSize: 14, color: '#888', marginTop: 2 },
  card: { backgroundColor: '#fff', borderRadius: 14, padding: 20, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#333', marginBottom: 12 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 9, borderBottomWidth: 1, borderBottomColor: '#f2f2f2' },
  infoLabel: { fontSize: 14, color: '#888' },
  infoValue: { fontSize: 14, color: '#333', fontWeight: '500' },
  valueGreen: { color: '#2E7D32' },
  valueAmber: { color: '#E65100' },
  mfaAlert: { backgroundColor: '#FFF8E1', borderRadius: 12, padding: 16, marginBottom: 16, borderLeftWidth: 3, borderLeftColor: '#FFA000' },
  mfaAlertTitle: { fontSize: 15, fontWeight: '700', color: '#E65100', marginBottom: 4 },
  mfaAlertBody: { fontSize: 13, color: '#795548', lineHeight: 18 },
  mfaAlertBtn: { marginTop: 10, backgroundColor: '#FF8F00', borderRadius: 8, padding: 10, alignSelf: 'flex-start' },
  mfaAlertBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  actionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12 },
  actionLabel: { fontSize: 15, color: '#333' },
  chevron: { fontSize: 20, color: '#bbb' },
  separator: { height: 1, backgroundColor: '#f2f2f2' },
  logoutBtn: { backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#E53935', borderRadius: 10, padding: 16, alignItems: 'center', marginTop: 4, marginBottom: 32 },
  logoutBtnDisabled: { opacity: 0.5 },
  logoutText: { color: '#E53935', fontSize: 16, fontWeight: '700' },
});
