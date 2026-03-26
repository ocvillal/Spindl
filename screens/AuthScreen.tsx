import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, SafeAreaView, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
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
                <Ionicons name="mail-outline" size={18} color={Colors.muted} />
                <TextInput
                  style={styles.input}
                  placeholder="you@example.com"
                  placeholderTextColor={Colors.muted}
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
                <Ionicons name="lock-closed-outline" size={18} color={Colors.muted} />
                <TextInput
                  style={styles.input}
                  placeholder={mode === 'signUp' ? 'Min 8 chars, 1 uppercase, 1 number' : 'Your password'}
                  placeholderTextColor={Colors.muted}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoComplete={mode === 'signIn' ? 'current-password' : 'new-password'}
                  textContentType={mode === 'signIn' ? 'password' : 'newPassword'}
                />
                <TouchableOpacity onPress={() => setShowPassword((v) => !v)} hitSlop={8}>
                  <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={18} color={Colors.muted} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Confirm password (sign up only) */}
            {mode === 'signUp' && (
              <View style={styles.field}>
                <Text style={styles.label}>Confirm Password</Text>
                <View style={styles.inputWrap}>
                  <Ionicons name="lock-closed-outline" size={18} color={Colors.muted} />
                  <TextInput
                    style={styles.input}
                    placeholder="Re-enter password"
                    placeholderTextColor={Colors.muted}
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
                <ActivityIndicator color={Colors.background} />
              ) : (
                <Text style={styles.submitText}>
                  {mode === 'signIn' ? 'Sign In' : 'Create Account'}
                </Text>
              )}
            </TouchableOpacity>

            {/* Security note */}
            <View style={styles.securityNote}>
              <Ionicons name="shield-checkmark-outline" size={13} color={Colors.muted} />
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

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  flex: { flex: 1 },
  content: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 40 },

  logoWrap: { alignItems: 'center', marginBottom: 36 },
  appName: { color: Colors.primary, fontSize: 42, fontWeight: '800', letterSpacing: -1 },
  tagline: { color: Colors.muted, fontSize: 14, marginTop: 4 },

  card: {
    backgroundColor: Colors.surface,
    borderRadius: 20, padding: 20,
    borderWidth: 1, borderColor: Colors.border,
    gap: 16,
  },

  toggle: {
    flexDirection: 'row', backgroundColor: Colors.background,
    borderRadius: 12, padding: 3,
    borderWidth: 1, borderColor: Colors.border,
  },
  toggleBtn: { flex: 1, paddingVertical: 9, alignItems: 'center', borderRadius: 10 },
  toggleBtnActive: { backgroundColor: Colors.primaryDim },
  toggleText: { color: Colors.muted, fontSize: 14, fontWeight: '600' },
  toggleTextActive: { color: Colors.primary, fontWeight: '700' },

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
  label: { color: Colors.text, fontSize: 13, fontWeight: '700' },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: Colors.background, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 12,
    borderWidth: 1, borderColor: Colors.border,
  },
  input: { flex: 1, color: Colors.text, fontSize: 14 },

  submitBtn: {
    backgroundColor: Colors.primary, borderRadius: 14,
    paddingVertical: 14, alignItems: 'center', marginTop: 4,
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitText: { color: Colors.background, fontWeight: '800', fontSize: 15 },

  securityNote: { flexDirection: 'row', alignItems: 'center', gap: 6, justifyContent: 'center' },
  securityText: { color: Colors.muted, fontSize: 11, flex: 1 },
});
