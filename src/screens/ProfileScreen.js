/**
 * Profile tab — shows user info and logout.
 * Handles device-specific and all-device logout with confirmation Alert.
 */
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { useAuth } from '../context/AuthContext';
import { useWeightUnit } from '../hooks/useWeightUnit';

// ─── InfoRow ──────────────────────────────────────────────────────────────────

function InfoRow({ label, value }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value ?? '—'}</Text>
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function ProfileScreen() {
  const navigation = useNavigation();
  const { user, logout, isLoading } = useAuth();
  const { weightUnit } = useWeightUnit();

  function handleLogout() {
    Alert.alert(
      'Log Out',
      'How would you like to log out?',
      [
        {
          text: 'This Device',
          onPress: () => logout(false),
        },
        {
          text: 'All Devices',
          style: 'destructive',
          onPress: () => logout(true),
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ],
      { cancelable: true },
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Avatar */}
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <Text style={styles.avatarInitial}>
              {user?.first_name?.[0]?.toUpperCase() ?? 'U'}
            </Text>
          </View>
          <Text style={styles.userName}>{user?.first_name ?? 'User'}</Text>
          <Text style={styles.userRole}>{user?.role ?? ''}</Text>
        </View>

        {/* Info Card */}
        <View style={styles.card}>
          <InfoRow label="Name"  value={user?.first_name} />
          <View style={styles.divider} />
          <InfoRow label="Role"  value={user?.role} />
          <View style={styles.divider} />
          <InfoRow label="ID"    value={user?.id} />
        </View>

        {/* Settings */}
        <TouchableOpacity
          style={styles.settingRow}
          onPress={() => navigation.navigate('WeightUnit')}
          activeOpacity={0.8}
        >
          <View style={styles.settingLeft}>
            <Ionicons name="scale-outline" size={20} color={colors.textAccent} />
            <Text style={styles.settingLabel}>Weight Unit</Text>
          </View>
          <View style={styles.settingRight}>
            <Text style={styles.settingValue}>
              {weightUnit === 'kg' ? 'kg' : 'lbs'}
            </Text>
            <Ionicons
              name="chevron-forward-outline"
              size={16}
              color={colors.textSecondary}
            />
          </View>
        </TouchableOpacity>

        {/* Logout */}
        <TouchableOpacity
          style={[styles.logoutButton, isLoading && styles.logoutButtonDisabled]}
          onPress={handleLogout}
          disabled={isLoading}
          testID="logout-button"
        >
          {isLoading ? (
            <ActivityIndicator color={colors.error} size="small" />
          ) : (
            <>
              <Ionicons name="log-out-outline" size={18} color={colors.error} style={styles.logoutIcon} />
              <Text style={styles.logoutText}>Log Out</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
  },
  scroll: {
    padding: 16,
    paddingBottom: 32,
  },
  avatarContainer: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.bgCard,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.textAccent,
  },
  avatarInitial: {
    color: colors.textPrimary,
    fontSize: 28,
    fontWeight: '700',
  },
  userName: {
    color: colors.textPrimary,
    fontSize: 20,
    fontWeight: '700',
    marginTop: 12,
  },
  userRole: {
    color: colors.textSecondary,
    fontSize: 14,
    marginTop: 4,
    textTransform: 'capitalize',
  },
  card: {
    backgroundColor: colors.bgCard,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: 16,
    marginBottom: 24,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  infoLabel: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  infoValue: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
    flexShrink: 1,
    textAlign: 'right',
    marginLeft: 12,
  },
  divider: {
    height: 1,
    backgroundColor: colors.divider,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.error,
    borderRadius: 14,
    height: 52,
    backgroundColor: colors.bgPrimary,
  },
  logoutButtonDisabled: {
    opacity: 0.5,
  },
  logoutIcon: {
    marginRight: 8,
  },
  logoutText: {
    color: colors.error,
    fontSize: 16,
    fontWeight: '600',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.bgCard,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  settingLabel: {
    color: colors.textPrimary,
    fontSize: 15,
  },
  settingRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  settingValue: {
    color: colors.textSecondary,
    fontSize: 14,
  },
});
