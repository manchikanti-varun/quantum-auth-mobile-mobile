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
import { Input, PasswordInput } from './ui';
import { authApi } from '../services/api';
import { useLayout } from '../hooks/useLayout';
import { useTheme } from '../context/ThemeContext';
import { themeDark } from '../constants/themes';
import { PASSWORD_REQUIREMENTS } from '../utils/validation';

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
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotCode, setForgotCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);

  useEffect(() => {
    if (pendingMfa) {
      setShowOtpInput(false);
      setOtpCode('');
    }
  }, [pendingMfa?.challengeId]);

  const handleSubmit = async () => {
    let success = false;
    try {
      if (mode === 'login') {
        const res = await onLogin(email, password, rememberDevice);
        success = !!res;
      } else {
        const res = await onRegister(email, password, displayName, rememberDevice);
        success = !!res;
      }
    } catch (_) {
      success = false;
    }
    if (success) {
      setEmail('');
      setPassword('');
      setDisplayName('');
    }
  };

  const handleForgotPasswordSubmit = async () => {
    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }
    const pwResult = require('../utils/validation').validatePassword(newPassword);
    if (!pwResult.valid) {
      Alert.alert('Validation', pwResult.message);
      return;
    }
    setForgotLoading(true);
    try {
      await authApi.forgotPassword(email.trim().toLowerCase(), forgotCode, newPassword);
      Alert.alert('Success', 'Password updated. You can now sign in.', [
        { text: 'OK', onPress: () => { setShowForgotPassword(false); setForgotCode(''); setNewPassword(''); setConfirmPassword(''); } },
      ]);
    } catch (e) {
      Alert.alert('Error', e?.response?.data?.message || 'Could not reset password. Check your email and backup code.');
    } finally {
      setForgotLoading(false);
    }
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
                      <View style={[styles.waitingIconWrap, { backgroundColor: theme.colors.surface }]}>
                        <MaterialCommunityIcons name="cellphone-check" size={40} color={theme.colors.accent} />
                      </View>
                      <ActivityIndicator size="large" color={theme.colors.accent} style={styles.waitingSpinner} />
                      <Text style={[styles.waitingTitle, { color: theme.colors.text }]}>Waiting for approval</Text>
                      <Text style={[styles.waitingSubtitle, { color: theme.colors.textMuted }]}>
                        Open QSafe on your other device and tap Approve or Deny
                      </Text>
                      <Text style={[styles.waitingHint, { color: theme.colors.textMuted }]}>
                        Don't have your other device? Use a backup code:
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
                      <View style={[styles.waitingIconWrap, { backgroundColor: theme.colors.surface }]}>
                        <MaterialCommunityIcons name="numeric" size={32} color={theme.colors.accent} />
                      </View>
                      <Text style={[styles.waitingTitle, { color: theme.colors.text }]}>Enter backup code</Text>
                      <Text style={[styles.waitingSubtitle, { color: theme.colors.textMuted }]}>
                        Enter the 6-digit code from your backup authenticator app
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
                    {showForgotPassword ? (
                      <>
                        <View style={[styles.forgotBackRow, { marginBottom: themeDark.spacing.lg }]}>
                          <TouchableOpacity onPress={() => { setShowForgotPassword(false); setForgotCode(''); setNewPassword(''); setConfirmPassword(''); }} hitSlop={8}>
                            <MaterialCommunityIcons name="arrow-left" size={22} color={theme.colors.accent} />
                          </TouchableOpacity>
                          <Text style={[styles.forgotTitle, { color: theme.colors.text }]}>Reset password</Text>
                        </View>
                        <Input
                          label="Email"
                          icon="email-outline"
                          placeholder="you@example.com"
                          value={email}
                          onChangeText={setEmail}
                          keyboardType="email-address"
                          autoCapitalize="none"
                          editable={!forgotLoading}
                        />
                        <Input
                          label="Backup code"
                          icon="numeric"
                          placeholder="6-digit code from authenticator"
                          value={forgotCode}
                          onChangeText={(t) => setForgotCode(t.replace(/\D/g, '').slice(0, 6))}
                          keyboardType="number-pad"
                          hint="Use the backup entry you added at registration"
                        />
                        <PasswordInput
                          label="New password"
                          placeholder="Create a new password"
                          value={newPassword}
                          onChangeText={setNewPassword}
                          hint={PASSWORD_REQUIREMENTS}
                        />
                        <PasswordInput
                          label="Confirm password"
                          placeholder="Re-enter new password"
                          value={confirmPassword}
                          onChangeText={setConfirmPassword}
                        />
                        <TouchableOpacity
                          style={[styles.primaryButtonWrapper, { backgroundColor: theme.colors.accent }]}
                          onPress={handleForgotPasswordSubmit}
                          disabled={forgotLoading || !email.trim() || forgotCode.length !== 6 || !newPassword || !confirmPassword}
                          activeOpacity={0.85}
                        >
                          {forgotLoading ? (
                            <ActivityIndicator color={theme.colors.bg} />
                          ) : (
                            <Text style={[styles.primaryButtonText, { color: theme.colors.bg }]}>Reset password</Text>
                          )}
                        </TouchableOpacity>
                      </>
                    ) : (
                      <>
                    {mode === 'register' && (
                      <Input
                        label="Display name"
                        icon="account-outline"
                        placeholder="e.g. John"
                        value={displayName}
                        onChangeText={setDisplayName}
                        autoCapitalize="words"
                        containerStyle={styles.inputFirst}
                      />
                    )}

                    <Input
                      label="Email"
                      icon="email-outline"
                      placeholder="you@example.com"
                      value={email}
                      onChangeText={setEmail}
                      keyboardType="email-address"
                      autoCapitalize="none"
                    />

                    <PasswordInput
                      label="Password"
                      placeholder={mode === 'login' ? 'Enter your password' : 'Create a strong password'}
                      value={password}
                      onChangeText={setPassword}
                      hint={mode === 'register' ? PASSWORD_REQUIREMENTS : undefined}
                    />

                    {mode === 'login' && (
                      <TouchableOpacity
                        style={styles.forgotLink}
                        onPress={() => setShowForgotPassword(true)}
                        hitSlop={8}
                      >
                        <Text style={[styles.forgotLinkText, { color: theme.colors.accent }]}>Forgot password?</Text>
                      </TouchableOpacity>
                    )}

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
                      <View style={styles.rememberTextWrap}>
                        <Text style={[styles.rememberText, { color: theme.colors.textSecondary }]}>
                          Keep me signed in
                        </Text>
                        <Text style={[styles.rememberHint, { color: theme.colors.textMuted }]}>
                          Don't ask for password on this device
                        </Text>
                      </View>
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
                      </>
                    )}
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
  rememberTextWrap: {
    flex: 1,
  },
  rememberText: {
    fontSize: 15,
    fontWeight: '600',
  },
  rememberHint: {
    fontSize: 12,
    marginTop: 2,
    opacity: 0.9,
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
  inputFirst: {
    marginTop: themeDark.spacing.sm,
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
  waitingIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: themeDark.spacing.md,
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
  forgotLink: {
    alignSelf: 'flex-start',
    marginTop: themeDark.spacing.sm,
  },
  forgotLinkText: {
    fontSize: 14,
    fontWeight: '600',
  },
  forgotBackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: themeDark.spacing.sm,
  },
  forgotTitle: {
    fontSize: 18,
    fontWeight: '700',
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
