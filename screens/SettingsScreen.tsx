import React, { useMemo } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Alert, Switch, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../store/theme';
import { useAuth } from '../store/auth';
import { useProfile } from '../store/profile';
import { AppTheme } from '../constants/themes';

export default function SettingsScreen() {
  const { colors, isDark, toggleTheme } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const navigation = useNavigation();
  const { signOut } = useAuth();
  const { profile } = useProfile();

  function handleLogOut() {
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log Out', style: 'destructive',
        onPress: () => signOut(),
      },
    ]);
  }

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={{ width: 38 }} />
      </View>

      {/* Account card */}
      {profile && (
        <View style={styles.accountCard}>
          {profile.avatarUrl ? (
            <Image source={{ uri: profile.avatarUrl }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarInitial}>{profile.name.charAt(0).toUpperCase()}</Text>
            </View>
          )}
          <View style={styles.accountInfo}>
            <Text style={styles.accountName}>{profile.name}</Text>
            <Text style={styles.accountUsername}>@{profile.username}</Text>
          </View>
        </View>
      )}

      {/* Appearance */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>APPEARANCE</Text>
        <View style={styles.row}>
          <Ionicons name={isDark ? 'moon' : 'sunny'} size={20} color={colors.primary} style={styles.rowIcon} />
          <Text style={styles.rowLabel}>Dark Mode</Text>
          <Switch
            value={isDark}
            onValueChange={toggleTheme}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor={colors.surface}
          />
        </View>
      </View>

      {/* Account */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>ACCOUNT</Text>
        <TouchableOpacity style={[styles.row, styles.rowDestructive]} onPress={handleLogOut}>
          <Ionicons name="log-out-outline" size={20} color="#E53935" style={styles.rowIcon} />
          <Text style={styles.rowLabelDestructive}>Log Out</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

function makeStyles(colors: AppTheme) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background },
    header: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingHorizontal: 16, paddingVertical: 12,
    },
    backBtn: {
      width: 38, height: 38, borderRadius: 12,
      backgroundColor: colors.surface,
      justifyContent: 'center', alignItems: 'center',
    },
    headerTitle: { color: colors.text, fontSize: 17, fontWeight: '700' },
    accountCard: {
      flexDirection: 'row', alignItems: 'center', gap: 14,
      margin: 16, padding: 16,
      backgroundColor: colors.surface, borderRadius: 16,
    },
    avatar: { width: 56, height: 56, borderRadius: 28 },
    avatarPlaceholder: {
      width: 56, height: 56, borderRadius: 28,
      backgroundColor: colors.primaryDim,
      justifyContent: 'center', alignItems: 'center',
    },
    avatarInitial: { color: colors.primary, fontSize: 22, fontWeight: '700' },
    accountInfo: { gap: 3 },
    accountName: { color: colors.text, fontSize: 17, fontWeight: '700' },
    accountUsername: { color: colors.muted, fontSize: 14 },
    section: { marginHorizontal: 16, marginBottom: 24 },
    sectionLabel: {
      color: colors.muted, fontSize: 11, fontWeight: '700',
      letterSpacing: 0.8, marginBottom: 8, marginLeft: 4,
    },
    row: {
      flexDirection: 'row', alignItems: 'center',
      backgroundColor: colors.surface, borderRadius: 14,
      paddingHorizontal: 14, paddingVertical: 14,
    },
    rowDestructive: { marginTop: 0 },
    rowIcon: { marginRight: 12 },
    rowLabel: { flex: 1, color: colors.text, fontSize: 15 },
    rowLabelDestructive: { flex: 1, color: '#E53935', fontSize: 15 },
  });
}
