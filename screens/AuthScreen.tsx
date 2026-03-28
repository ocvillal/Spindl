import React, { useState, useMemo } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, SafeAreaView, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../store/theme';
import { AppTheme } from '../constants/themes';
import { useAuth } from '../store/auth';

type Mode = 'signIn' | 'signUp';

function validatePassword(pw: string): string | null {
  if (pw.length < 8) return 'Password must be at least 8 characters';
  if (!/[A-Z]/.test(pw)) return 'Password must contain an uppercase letter';
  if (!/[0-9]/.test(pw)) return 'Password must contain a number';
  return null;
}

function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export default function AuthScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<Mode>('signIn');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  function switchMode(next: Mode) {
    setMode(next);
    setError(null);
    setSuccess(null);
    setPassword('');
    setConfirmPassword('');
  }

  async function handleSubmit() {
    setError(null);
    setSuccess(null);

    if (!validateEmail(email)) {
      setError('Enter a valid email address');
      return;
    }

    if (mode === 'signUp') {
      const pwError = validatePassword(password);
      if (pwError) { setError(pwError); return; }
      if (password !== confirmPassword) { setError('Passwords do not match'); return; }
    }

    setLoading(true);
    const err = mode === 'signIn'
      ? await signIn(email.trim(), password)
      : await signUp(email.trim(), password);
    setLoading(false);

    if (err) {
      // Normalise common Supabase error messages
      if (err.toLowerCase().includes('invalid login')) {
        setError('Incorrect email or password');
      } else if (err.toLowerCase().includes('already registered')) {
        setError('An account with this email already exists');
      } else {
        setError(err);
      }
    } else if (mode === 'signUp') {
      setSuccess('Account created! Check your email to confirm, then sign in.');
      switchMode('signIn');
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

          {/* Logo */}
          <View style={styles.logoWrap}>
            <Text style={styles.appName}>spindl</Text>
            <Text style={styles.tagline}>your music, your story</Text>
          </View>

          {/* Card */}
          <View style={styles.card}>
            {/* Mode toggle */}
            <View style={styles.toggle}>
              {(['signIn', 'signUp'] as Mode[]).map((m) => (
                <TouchableOpacity
                  key={m}
                  style={[styles.toggleBtn, mode === m && styles.toggleBtnActive]}
                  onPress={() => switchMode(m)}
                >
                  <Text style={[styles.toggleText, mode === m && styles.toggleTextActive]}>
                    {m === 'signIn' ? 'Sign In' : 'Create Account'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Error / Success banners */}
            {error && (
              <View style={styles.errorBanner}>
                <Ionicons name="alert-circle" size={16} color="#B33A3A" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}
            {success && (
              <View style={styles.successBanner}>
                <Ionicons name="checkmark-circle" size={16} color="#3A7A3A" />
                <Text style={styles.successText}>{success}</Text>
              </View>
            )}

            {/* Email */}
            <View style={styles.field}>
              <Text style={styles.label}>Email</Text>
              <View style={styles.inputWrap}>
                <Ionicons name="mail-outline" size={18} color={colors.muted} />
                <TextInput
                  style={styles.input}
                  placeholder="you@example.com"
                  placeholderTextColor={colors.muted}
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  autoComplete="email"
                  textContentType="emailAddress"
                />
              </View>
            </View>

            {/* Password */}
            <View style={styles.field}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.inputWrap}>
                <Ionicons name="lock-closed-outline" size={18} color={colors.muted} />
                <TextInput
                  style={styles.input}
                  placeholder={mode === 'signUp' ? 'Min 8 chars, 1 uppercase, 1 number' : 'Your password'}
                  placeholderTextColor={colors.muted}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoComplete={mode === 'signIn' ? 'current-password' : 'new-password'}
                  textContentType={mode === 'signIn' ? 'password' : 'newPassword'}
                />
                <TouchableOpacity onPress={() => setShowPassword((v) => !v)} hitSlop={8}>
                  <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={18} color={colors.muted} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Confirm password (sign up only) */}
            {mode === 'signUp' && (
              <View style={styles.field}>
                <Text style={styles.label}>Confirm Password</Text>
                <View style={styles.inputWrap}>
                  <Ionicons name="lock-closed-outline" size={18} color={colors.muted} />
                  <TextInput
                    style={styles.input}
                    placeholder="Re-enter password"
                    placeholderTextColor={colors.muted}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    textContentType="newPassword"
                  />
                </View>
              </View>
            )}

            {/* Submit */}
            <TouchableOpacity
              style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
              onPress={handleSubmit}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color={colors.background} />
              ) : (
                <Text style={styles.submitText}>
                  {mode === 'signIn' ? 'Sign In' : 'Create Account'}
                </Text>
              )}
            </TouchableOpacity>

            {/* Security note */}
            <View style={styles.securityNote}>
              <Ionicons name="shield-checkmark-outline" size={13} color={colors.muted} />
              <Text style={styles.securityText}>
                Passwords are hashed. Your data is private and encrypted.
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function makeStyles(colors: AppTheme) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background },
    flex: { flex: 1 },
    content: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 40 },

    logoWrap: { alignItems: 'center', marginBottom: 36 },
    appName: { color: colors.primary, fontSize: 42, fontWeight: '800', letterSpacing: -1 },
    tagline: { color: colors.muted, fontSize: 14, marginTop: 4 },

    card: {
      backgroundColor: colors.surface,
      borderRadius: 20, padding: 20,
      borderWidth: 1, borderColor: colors.border,
      gap: 16,
    },

    toggle: {
      flexDirection: 'row', backgroundColor: colors.background,
      borderRadius: 12, padding: 3,
      borderWidth: 1, borderColor: colors.border,
    },
    toggleBtn: { flex: 1, paddingVertical: 9, alignItems: 'center', borderRadius: 10 },
    toggleBtnActive: { backgroundColor: colors.primaryDim },
    toggleText: { color: colors.muted, fontSize: 14, fontWeight: '600' },
    toggleTextActive: { color: colors.primary, fontWeight: '700' },

    errorBanner: {
      flexDirection: 'row', alignItems: 'center', gap: 8,
      backgroundColor: '#FDE8E8', borderRadius: 10, padding: 12,
      borderWidth: 1, borderColor: '#F5C6C6',
    },
    errorText: { color: '#B33A3A', fontSize: 13, flex: 1 },
    successBanner: {
      flexDirection: 'row', alignItems: 'center', gap: 8,
      backgroundColor: '#E8F5E8', borderRadius: 10, padding: 12,
      borderWidth: 1, borderColor: '#C6E6C6',
    },
    successText: { color: '#3A7A3A', fontSize: 13, flex: 1 },

    field: { gap: 6 },
    label: { color: colors.text, fontSize: 13, fontWeight: '700' },
    inputWrap: {
      flexDirection: 'row', alignItems: 'center', gap: 10,
      backgroundColor: colors.background, borderRadius: 12,
      paddingHorizontal: 14, paddingVertical: 12,
      borderWidth: 1, borderColor: colors.border,
    },
    input: { flex: 1, color: colors.text, fontSize: 14 },

    submitBtn: {
      backgroundColor: colors.primary, borderRadius: 14,
      paddingVertical: 14, alignItems: 'center', marginTop: 4,
    },
    submitBtnDisabled: { opacity: 0.6 },
    submitText: { color: colors.background, fontWeight: '800', fontSize: 15 },

    securityNote: { flexDirection: 'row', alignItems: 'center', gap: 6, justifyContent: 'center' },
    securityText: { color: colors.muted, fontSize: 11, flex: 1 },
  });
}
