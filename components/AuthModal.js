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
import { useToast } from '../context/ToastContext';
import { themeLight } from '../constants/themes';
import { spacing, radii, typography } from '../constants/designTokens';
import { PASSWORD_REQUIREMENTS } from '../utils/validation';

const BK = '#0f172a'; // dark text on accent buttons

const KEYBOARD_VERTICAL_OFFSET_ANDROID = Platform.OS === 'android' ? (StatusBar?.currentHeight ?? 0) : 0;

export const AuthModal = ({ visible, onClose, onLogin, onRegister, loading, pendingMfa, onCancelPendingMfa, onLoginWithOtp }) => {
  const theme = themeLight; // white screen for all devices
  const { showToast } = useToast();
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
  const [forgotCodeFromDevice, setForgotCodeFromDevice] = useState(false);
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
    } else {
      // On error: keep email and display name visible; clear password only
      setPassword('');
    }
  };

  const handleForgotPasswordSubmit = async () => {
    if (newPassword !== confirmPassword) {
      Alert.alert('Passwords do not match', 'Please make sure both password fields are the same.');
      return;
    }
    const pwResult = require('../utils/validation').validatePassword(newPassword);
    if (!pwResult.valid) {
      Alert.alert('Password requirements', pwResult.message);
      return;
    }
    setForgotLoading(true);
    try {
      await authApi.forgotPassword(email.trim().toLowerCase(), forgotCode, newPassword);
      setShowForgotPassword(false);
      setForgotCode('');
      setForgotCodeFromDevice(false);
      setNewPassword('');
      setConfirmPassword('');
      showToast('Password updated! Sign in with your new password.');
    } catch (e) {
      const msg = e?.response?.data?.message || 'Check your email and code, then try again.';
      Alert.alert('Could not reset password', msg);
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
          <View style={[styles.content, { paddingHorizontal: horizontalPadding, paddingTop: Math.max(safeTop, 16) + 20, paddingBottom: Math.max(safeBottom, 24) + 28, backgroundColor: theme.colors.bgElevated }]}>
            <View style={styles.header}>
              <View style={styles.headerLeft}>
                <AppLogo size="sm" />
                <Text style={[styles.title, { color: theme.colors.text }]}>QSafe</Text>
              </View>
              {!showWaiting && (
                <TouchableOpacity
                  onPress={onClose}
                  style={[styles.closeButton, { backgroundColor: theme.colors.surface }]}
                  hitSlop={16}
                >
                  <MaterialCommunityIcons name="close" size={20} color={theme.colors.textMuted} />
                </TouchableOpacity>
              )}
            </View>

            {!showWaiting && !showForgotPassword && (
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
                    <Text style={[styles.switchButtonText, mode === 'login' && styles.switchButtonTextActive, { color: mode === 'login' ? BK : theme.colors.textSecondary }]}>
                      Sign in
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.switchButton, mode === 'register' && { backgroundColor: theme.colors.accent }]}
                    onPress={() => setMode('register')}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.switchButtonText, mode === 'register' && styles.switchButtonTextActive, { color: mode === 'register' ? BK : theme.colors.textSecondary }]}>
                      Create account
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
                          <ActivityIndicator color={BK} />
                        ) : (
                          <Text style={[styles.primaryButtonText, { color: BK }]}>Submit code</Text>
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
                        <View style={[styles.forgotBackRow, { marginBottom: spacing.lg }]}>
                          <TouchableOpacity onPress={() => { setShowForgotPassword(false); setForgotCode(''); setForgotCodeFromDevice(false); setNewPassword(''); setConfirmPassword(''); }} hitSlop={8}>
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
                          label={forgotCodeFromDevice ? 'Code from primary device' : 'Backup code'}
                          icon="numeric"
                          placeholder={forgotCodeFromDevice ? '6-digit code from Settings' : '6-digit code from authenticator'}
                          value={forgotCode}
                          onChangeText={(t) => setForgotCode(t.replace(/\D/g, '').slice(0, 6))}
                          keyboardType="number-pad"
                          hint={forgotCodeFromDevice ? 'On your primary device (Device 1): Settings → Activity → Generate password reset code. The code is valid for 10 minutes.' : 'Only have this device? Use the 6-digit code from the authenticator where you added the backup during registration (e.g. Google Authenticator on this phone). The code changes every 30 seconds.'}
                        />
                        <TouchableOpacity
                          style={styles.forgotCodeHelp}
                          onPress={() => setForgotCodeFromDevice((v) => !v)}
                          hitSlop={8}
                        >
                          <Text style={[styles.forgotCodeHelpText, { color: theme.colors.accent }]}>
                            {forgotCodeFromDevice ? 'Use backup code from authenticator instead' : "Don't have a backup code? Use code from primary device"}
                          </Text>
                        </TouchableOpacity>
                        {forgotCodeFromDevice && (
                          <TouchableOpacity
                            style={styles.forgotCodeHelp}
                            onPress={() => Alert.alert(
                              "Don't have your primary device?",
                              "You need either:\n\n• Backup code from the authenticator where you added it during registration (e.g. Google Authenticator on this phone), or\n• A one-time code from your primary device: Settings → Activity → Generate password reset code\n\nOnly one device? Use the backup code. If you didn't add the backup to another app, you may need to create a new account.",
                              [{ text: 'OK' }]
                            )}
                            hitSlop={8}
                          >
                            <Text style={[styles.forgotCodeHelpText, { color: theme.colors.textMuted, fontSize: 13 }]}>
                              Don't have access to your primary device?
                            </Text>
                          </TouchableOpacity>
                        )}
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
                            <ActivityIndicator color={BK} />
                          ) : (
                            <Text style={[styles.primaryButtonText, { color: BK }]}>Reset password</Text>
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
                        <Text style={[styles.primaryButtonText, { color: BK }]}>
                          {mode === 'register' ? 'Create account' : 'Sign in'}
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
    backgroundColor: themeLight.colors.bgElevated,
    justifyContent: 'flex-start',
  },
  keyboardView: {
    flex: 1,
    width: '100%',
  },
  content: {
    flex: 1,
    borderTopLeftRadius: radii.xxl,
    borderTopRightRadius: radii.xxl,
    overflow: 'hidden',
  },
  scrollView: {
    flex: 1,
    minHeight: 320,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: spacing.xl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  title: {
    ...typography.h1,
  },
  closeButton: {
    padding: spacing.sm,
    borderRadius: radii.sm,
  },
  welcomeText: {
    ...typography.bodySm,
    marginBottom: spacing.sm,
  },
  switchRow: {
    flexDirection: 'row',
    borderRadius: radii.lg,
    padding: 4,
    marginBottom: spacing.lg,
  },
  switchButton: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: radii.md,
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
    marginTop: spacing.sm,
  },
  rememberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.lg,
    paddingVertical: spacing.sm,
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
    marginTop: spacing.xl,
    gap: spacing.md,
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
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderRadius: radii.lg,
    borderWidth: 1,
    marginTop: spacing.lg,
  },
  socialButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  inputFirst: {
    marginTop: spacing.sm,
  },
  label: {
    fontSize: 14,
    marginBottom: spacing.sm,
    marginTop: spacing.md,
    fontWeight: '500',
  },
  input: {
    borderRadius: radii.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderWidth: 1,
    fontSize: 16,
    minHeight: 48,
  },
  primaryButtonWrapper: {
    marginTop: spacing.xl,
    paddingVertical: spacing.lg,
    borderRadius: radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
  waitingBlock: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  waitingIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  waitingSpinner: {
    marginBottom: spacing.lg,
  },
  waitingTitle: {
    ...typography.h2,
    color: themeLight.colors.text,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  waitingSubtitle: {
    ...typography.bodySm,
    color: themeLight.colors.textMuted,
    textAlign: 'center',
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  waitingHint: {
    ...typography.caption,
    textAlign: 'center',
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  waitingHintSmall: {
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 4,
    paddingHorizontal: spacing.md,
  },
  useOtpButton: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: radii.md,
    borderWidth: 2,
    marginBottom: spacing.sm,
    alignItems: 'center',
  },
  useOtpButtonText: {
    fontWeight: '600',
    fontSize: 16,
  },
  otpInput: {
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.lg,
    borderWidth: 1,
    fontSize: 24,
    letterSpacing: 8,
    textAlign: 'center',
    marginBottom: spacing.md,
    minWidth: 160,
  },
  submitOtpButton: {
    borderRadius: radii.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.sm,
    minWidth: 160,
    alignItems: 'center',
    justifyContent: 'center',
  },
  forgotLink: {
    alignSelf: 'flex-start',
    marginTop: spacing.sm,
  },
  forgotLinkText: {
    fontSize: 14,
    fontWeight: '600',
  },
  forgotCodeHelp: {
    alignSelf: 'flex-start',
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
  },
  forgotCodeHelpText: {
    fontSize: 14,
    fontWeight: '600',
  },
  forgotBackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  forgotTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  cancelWaitingButton: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: radii.md,
    borderWidth: 1,
    alignItems: 'center',
  },
  cancelWaitingText: {
    fontWeight: '600',
    fontSize: 16,
  },
});
