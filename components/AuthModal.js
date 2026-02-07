/**
 * AuthModal – Login / register form. MFA wait state + backup OTP entry.
 */
import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  Alert,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AppLogo } from './AppLogo';
import { useLayout } from '../hooks/useLayout';
import { useTheme } from '../context/ThemeContext';
import { themeDark } from '../constants/themes';

const KEYBOARD_VERTICAL_OFFSET_ANDROID = Platform.OS === 'android' ? (StatusBar?.currentHeight ?? 0) : 0;

export const AuthModal = ({ visible, onClose, onLogin, onRegister, loading, pendingMfa, onCancelPendingMfa, onLoginWithOtp }) => {
  const { theme } = useTheme();
  const { horizontalPadding, safeBottom, safeTop } = useLayout();
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [rememberDevice, setRememberDevice] = useState(true);
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [otpCode, setOtpCode] = useState('');

  useEffect(() => {
    if (pendingMfa) {
      setShowOtpInput(false);
      setOtpCode('');
    }
  }, [pendingMfa?.challengeId]);

  const handleSubmit = async () => {
    if (mode === 'login') {
      await onLogin(email, password, rememberDevice);
    } else {
      await onRegister(email, password, displayName, rememberDevice);
    }
    setEmail('');
    setPassword('');
    setDisplayName('');
  };

  const showWaiting = visible && !!pendingMfa;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
          style={styles.keyboardView}
          keyboardVerticalOffset={KEYBOARD_VERTICAL_OFFSET_ANDROID}
        >
          <View style={[styles.content, { paddingHorizontal: horizontalPadding, paddingTop: Math.max(safeTop, 16) + 16, paddingBottom: Math.max(safeBottom, 24) + 24, backgroundColor: theme.colors.bgElevated, borderColor: theme.colors.border }]}>
            <View style={styles.header}>
              <View style={styles.headerLeft}>
                <AppLogo size="sm" />
                <Text style={[styles.title, { color: theme.colors.text }]}>QSafe</Text>
              </View>
              {!showWaiting && (
                <TouchableOpacity
                  onPress={onClose}
                  style={[styles.closeButton, { backgroundColor: theme.colors.surface }]}
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                >
                  <MaterialCommunityIcons name="close" size={22} color={theme.colors.textSecondary} />
                </TouchableOpacity>
              )}
            </View>

            {!showWaiting && (
              <>
                <Text style={[styles.welcomeText, { color: theme.colors.textSecondary }]}>
                  {mode === 'login' ? 'Welcome back' : 'Create your account'}
                </Text>
                <View style={[styles.switchRow, { backgroundColor: theme.colors.surface }]}>
                  <TouchableOpacity
                    style={[styles.switchButton, mode === 'login' && { backgroundColor: theme.colors.accent }]}
                    onPress={() => setMode('login')}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.switchButtonText, mode === 'login' && styles.switchButtonTextActive, { color: mode === 'login' ? theme.colors.bg : theme.colors.textSecondary }]}>
                      Login
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.switchButton, mode === 'register' && { backgroundColor: theme.colors.accent }]}
                    onPress={() => setMode('register')}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.switchButtonText, mode === 'register' && styles.switchButtonTextActive, { color: mode === 'register' ? theme.colors.bg : theme.colors.textSecondary }]}>
                      Register
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            )}

            <ScrollView
              style={styles.scrollView}
              contentContainerStyle={styles.scrollContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={true}
            >
              {showWaiting ? (
                <View style={styles.waitingBlock}>
                  {!showOtpInput ? (
                    <>
                      <ActivityIndicator size="large" color={theme.colors.accent} style={styles.waitingSpinner} />
                      <Text style={styles.waitingTitle}>Waiting for approval</Text>
                      <Text style={styles.waitingSubtitle}>
                        Open QSafe on your other device and tap Approve or Deny. This usually takes a few seconds.
                      </Text>
                      <Text style={[styles.waitingHint, { color: theme.colors.textMuted }]}>
                        Can't approve on other device? Use OTP instead:
                      </Text>
                      <Text style={[styles.waitingHintSmall, { color: theme.colors.textMuted }]}>
                        • One-time code from Device 1 (tap "Generate code" on approve screen)
                      </Text>
                      <Text style={[styles.waitingHintSmall, { color: theme.colors.textMuted }]}>
                        • Or TOTP from backup (QR you added at registration)
                      </Text>
                      <TouchableOpacity
                        style={[styles.useOtpButton, { borderColor: theme.colors.accent }]}
                        onPress={() => setShowOtpInput(true)}
                        activeOpacity={0.8}
                      >
                        <Text style={[styles.useOtpButtonText, { color: theme.colors.accent }]}>Enter OTP code</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.cancelWaitingButton, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
                        onPress={onCancelPendingMfa}
                        activeOpacity={0.8}
                      >
                        <Text style={[styles.cancelWaitingText, { color: theme.colors.textSecondary }]}>Cancel</Text>
                      </TouchableOpacity>
                    </>
                  ) : (
                    <>
                      <Text style={styles.waitingTitle}>Enter OTP code</Text>
                      <Text style={styles.waitingSubtitle}>
                        Use either: (1) 6-digit code from Device 1 ("Generate code" on approve screen), or (2) TOTP from your backup authenticator (QR added at registration).
                      </Text>
                      <TextInput
                        style={[styles.otpInput, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, color: theme.colors.text }]}
                        placeholder="000000"
                        placeholderTextColor={theme.colors.textMuted}
                        value={otpCode}
                        onChangeText={(t) => setOtpCode(t.replace(/\D/g, '').slice(0, 6))}
                        keyboardType="number-pad"
                        maxLength={6}
                      />
                      <TouchableOpacity
                        style={[styles.submitOtpButton, { backgroundColor: theme.colors.accent }]}
                        onPress={() => onLoginWithOtp?.(pendingMfa.challengeId, pendingMfa.deviceId, otpCode, rememberDevice)}
                        disabled={loading || otpCode.length !== 6}
                        activeOpacity={0.85}
                      >
                        {loading ? (
                          <ActivityIndicator color={theme.colors.bg} />
                        ) : (
                          <Text style={[styles.primaryButtonText, { color: theme.colors.bg }]}>Submit code</Text>
                        )}
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.cancelWaitingButton, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
                        onPress={() => { setShowOtpInput(false); setOtpCode(''); }}
                        activeOpacity={0.8}
                      >
                        <Text style={[styles.cancelWaitingText, { color: theme.colors.textSecondary }]}>Back</Text>
                      </TouchableOpacity>
                    </>
                  )}
                </View>
              ) : (
                <View style={styles.form}>
                    {mode === 'register' && (
                      <>
                        <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Display name</Text>
                        <TextInput
                          style={[styles.input, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, color: theme.colors.text }]}
                          placeholder="Your name"
                          placeholderTextColor={theme.colors.textMuted}
                          autoCapitalize="words"
                          value={displayName}
                          onChangeText={setDisplayName}
                        />
                      </>
                    )}

                    <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Email</Text>
                    <TextInput
                      style={[styles.input, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, color: theme.colors.text }]}
                      placeholder="you@example.com"
                      placeholderTextColor={theme.colors.textMuted}
                      autoCapitalize="none"
                      keyboardType="email-address"
                      value={email}
                      onChangeText={setEmail}
                    />

                    <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Password{mode === 'register' ? ' (min 8 chars)' : ''}</Text>
                    <TextInput
                      style={[styles.input, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, color: theme.colors.text }]}
                      placeholder={mode === 'register' ? 'Min 8 characters' : '••••••••'}
                      placeholderTextColor={theme.colors.textMuted}
                      secureTextEntry
                      value={password}
                      onChangeText={setPassword}
                    />

                    <TouchableOpacity
                      style={[styles.rememberRow, { borderColor: theme.colors.border }]}
                      onPress={() => setRememberDevice((v) => !v)}
                      activeOpacity={0.8}
                    >
                      <MaterialCommunityIcons
                        name={rememberDevice ? 'checkbox-marked' : 'checkbox-blank-outline'}
                        size={24}
                        color={rememberDevice ? theme.colors.accent : theme.colors.textMuted}
                      />
                      <Text style={[styles.rememberText, { color: theme.colors.textSecondary }]}>
                        Remember this device
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.primaryButtonWrapper, { backgroundColor: theme.colors.accent }]}
                      onPress={handleSubmit}
                      disabled={loading}
                      activeOpacity={0.85}
                    >
                      {loading ? (
                        <ActivityIndicator color={theme.colors.bg} />
                      ) : (
                        <Text style={[styles.primaryButtonText, { color: theme.colors.bg }]}>
                          {mode === 'register' ? 'Create account' : 'Login'}
                        </Text>
                      )}
                    </TouchableOpacity>

                    <View style={[styles.dividerRow, { borderColor: theme.colors.border }]}>
                      <View style={[styles.dividerLine, { backgroundColor: theme.colors.border }]} />
                      <Text style={[styles.dividerText, { color: theme.colors.textMuted }]}>or</Text>
                      <View style={[styles.dividerLine, { backgroundColor: theme.colors.border }]} />
                    </View>
                    <TouchableOpacity
                      style={[styles.socialButton, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
                      onPress={() => Alert.alert('Coming soon', 'Sign in with Google will be available in a future update.')}
                      activeOpacity={0.8}
                    >
                      <MaterialCommunityIcons name="google" size={22} color={theme.colors.textMuted} />
                      <Text style={[styles.socialButtonText, { color: theme.colors.textMuted }]}>Sign in with Google — Coming soon</Text>
                    </TouchableOpacity>
                  </View>
              )}
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(5, 7, 13, 0.92)',
    justifyContent: 'flex-start',
  },
  keyboardView: {
    flex: 1,
    width: '100%',
  },
  content: {
    flex: 1,
    borderBottomLeftRadius: themeDark.radii.xxl,
    borderBottomRightRadius: themeDark.radii.xxl,
    borderWidth: 1,
    borderTopWidth: 0,
  },
  scrollView: {
    flex: 1,
    minHeight: 320,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: themeDark.spacing.xl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: themeDark.spacing.lg,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: themeDark.spacing.sm,
  },
  title: {
    ...themeDark.typography.h1,
  },
  closeButton: {
    padding: themeDark.spacing.sm,
    borderRadius: themeDark.radii.sm,
  },
  welcomeText: {
    ...themeDark.typography.bodySm,
    marginBottom: themeDark.spacing.sm,
  },
  switchRow: {
    flexDirection: 'row',
    borderRadius: themeDark.radii.lg,
    padding: 4,
    marginBottom: themeDark.spacing.lg,
  },
  switchButton: {
    flex: 1,
    paddingVertical: themeDark.spacing.md,
    borderRadius: themeDark.radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  switchButtonText: {
    fontWeight: '600',
    fontSize: 15,
  },
  switchButtonTextActive: {
    fontWeight: '700',
  },
  form: {
    marginTop: themeDark.spacing.sm,
  },
  rememberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: themeDark.spacing.sm,
    marginTop: themeDark.spacing.lg,
    paddingVertical: themeDark.spacing.sm,
  },
  rememberText: {
    fontSize: 15,
    fontWeight: '500',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: themeDark.spacing.xl,
    gap: themeDark.spacing.md,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    fontSize: 13,
    fontWeight: '500',
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: themeDark.spacing.sm,
    paddingVertical: themeDark.spacing.md,
    borderRadius: themeDark.radii.lg,
    borderWidth: 1,
    marginTop: themeDark.spacing.lg,
  },
  socialButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  label: {
    fontSize: 14,
    marginBottom: themeDark.spacing.sm,
    marginTop: themeDark.spacing.md,
    fontWeight: '500',
  },
  input: {
    borderRadius: themeDark.radii.md,
    paddingHorizontal: themeDark.spacing.lg,
    paddingVertical: themeDark.spacing.md,
    borderWidth: 1,
    fontSize: 16,
    minHeight: 48,
  },
  primaryButtonWrapper: {
    marginTop: themeDark.spacing.xl,
    paddingVertical: themeDark.spacing.lg,
    borderRadius: themeDark.radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
  waitingBlock: {
    alignItems: 'center',
    paddingVertical: themeDark.spacing.xl,
  },
  waitingSpinner: {
    marginBottom: themeDark.spacing.lg,
  },
  waitingTitle: {
    ...themeDark.typography.h2,
    color: themeDark.colors.text,
    marginBottom: themeDark.spacing.sm,
    textAlign: 'center',
  },
  waitingSubtitle: {
    ...themeDark.typography.bodySm,
    color: themeDark.colors.textMuted,
    textAlign: 'center',
    marginBottom: themeDark.spacing.sm,
    paddingHorizontal: themeDark.spacing.md,
  },
  waitingHint: {
    ...themeDark.typography.caption,
    textAlign: 'center',
    marginBottom: themeDark.spacing.sm,
    paddingHorizontal: themeDark.spacing.md,
  },
  waitingHintSmall: {
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 4,
    paddingHorizontal: themeDark.spacing.md,
  },
  useOtpButton: {
    paddingVertical: themeDark.spacing.md,
    paddingHorizontal: themeDark.spacing.xl,
    borderRadius: themeDark.radii.md,
    borderWidth: 2,
    marginBottom: themeDark.spacing.sm,
    alignItems: 'center',
  },
  useOtpButtonText: {
    fontWeight: '600',
    fontSize: 16,
  },
  otpInput: {
    borderRadius: themeDark.radii.md,
    paddingHorizontal: themeDark.spacing.md,
    paddingVertical: themeDark.spacing.lg,
    borderWidth: 1,
    fontSize: 24,
    letterSpacing: 8,
    textAlign: 'center',
    marginBottom: themeDark.spacing.md,
    minWidth: 160,
  },
  submitOtpButton: {
    borderRadius: themeDark.radii.md,
    paddingVertical: themeDark.spacing.md,
    paddingHorizontal: themeDark.spacing.xl,
    marginBottom: themeDark.spacing.sm,
    minWidth: 160,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelWaitingButton: {
    paddingVertical: themeDark.spacing.md,
    paddingHorizontal: themeDark.spacing.xl,
    borderRadius: themeDark.radii.md,
    borderWidth: 1,
    alignItems: 'center',
  },
  cancelWaitingText: {
    fontWeight: '600',
    fontSize: 16,
  },
});
