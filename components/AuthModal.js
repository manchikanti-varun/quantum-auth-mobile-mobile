/**
 * Login and register modal. MFA wait state, backup OTP, forgot password.
 * @module components/AuthModal
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
import { useTheme, ThemeContext } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import { themeLight } from '../constants/themes';
import { spacing, radii, typography } from '../constants/designTokens';
import { PASSWORD_REQUIREMENTS, SECURITY_CODE_HINT, validateSecurityCode } from '../utils/validation';

const KEYBOARD_VERTICAL_OFFSET_ANDROID = Platform.OS === 'android' ? (StatusBar?.currentHeight ?? 0) : 0;

export const AuthModal = ({ visible, onClose, onLogin, onRegister, loading, pendingMfa, onCancelPendingMfa, onLoginWithOtp }) => {
  const theme = themeLight;
  const { showToast } = useToast();
  const { horizontalPadding, safeBottom, safeTop } = useLayout();
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [rememberDevice, setRememberDevice] = useState(true);
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [securityCode, setSecurityCode] = useState('');
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotCode, setForgotCode] = useState('');
  const [forgotCodeMode, setForgotCodeMode] = useState('device'); // 'device' | 'security'
  const [forgotStep, setForgotStep] = useState(1); // 1: email+code, 2: password
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [recoveryOptionsLoading, setRecoveryOptionsLoading] = useState(false);

  useEffect(() => {
    if (pendingMfa) {
      setShowOtpInput(false);
      setOtpCode('');
    }
  }, [pendingMfa?.challengeId]);

  const handleSubmit = async () => {
    if (mode === 'register') {
      const scResult = validateSecurityCode(securityCode);
      if (!scResult.valid) {
        Alert.alert('Validation', scResult.message);
        return;
      }
    }
    let success = false;
    try {
      if (mode === 'login') {
        const res = await onLogin(email, password, rememberDevice);
        success = !!res;
      } else {
        const res = await onRegister(email, password, displayName, rememberDevice, securityCode);
        success = !!res;
      }
    } catch (_) {
      success = false;
    }
    if (success) {
      setEmail('');
      setPassword('');
      setDisplayName('');
      setSecurityCode('');
    } else {
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
    if (forgotCodeMode === 'security') {
      const scResult = validateSecurityCode(forgotCode);
      if (!scResult.valid) {
        Alert.alert('Validation', scResult.message);
        return;
      }
    } else if (forgotCode.length !== 6) {
      Alert.alert('Validation', 'Enter the 6-digit code.');
      return;
    }
    setForgotLoading(true);
    try {
      if (forgotCodeMode === 'security') {
        await authApi.forgotPasswordWithSecurityCode(email.trim().toLowerCase(), forgotCode, newPassword);
      } else {
        await authApi.forgotPassword(email.trim().toLowerCase(), forgotCode, newPassword);
      }
      setShowForgotPassword(false);
      setForgotCode('');
      setForgotCodeMode('device');
      setForgotStep(1);
      setNewPassword('');
      setConfirmPassword('');
      showToast('Password updated! Sign in with your new password.');
    } catch (e) {
      const msg = e?.response?.data?.message || 'Check your email and code, then try again.';
      const lockedUntil = e?.response?.data?.lockedUntil;
      if (lockedUntil) {
        Alert.alert('Account locked', `${msg}\n\nTry again after ${new Date(lockedUntil).toLocaleString()}.`);
      } else {
        Alert.alert('Could not reset password', msg);
      }
    } finally {
      setForgotLoading(false);
    }
  };

  const handleUseSecurityCode = async () => {
    if (!email.trim()) {
      Alert.alert('Enter email first', 'Enter your email above, then tap Use security code.');
      return;
    }
    setRecoveryOptionsLoading(true);
    try {
      const res = await authApi.checkRecoveryOptions(email.trim().toLowerCase());
      const { canUseSecurityCode, lockedUntil } = res.data || {};
      if (lockedUntil && new Date(lockedUntil) > new Date()) {
        Alert.alert('Account locked', `Try again after ${new Date(lockedUntil).toLocaleString()}.`);
        return;
      }
      if (!canUseSecurityCode) {
        Alert.alert('Not available', 'Security code recovery is not set up for this account. Use code from primary device.');
        return;
      }
      setForgotCodeMode('security');
      setForgotCode('');
      setForgotStep(1);
    } catch (e) {
      Alert.alert('Error', e?.response?.data?.message || 'Could not check recovery options.');
    } finally {
      setRecoveryOptionsLoading(false);
    }
  };

  const showWaiting = visible && !!pendingMfa;

  const authThemeValue = { theme: themeLight, isDark: false, preference: 'light', setThemePreference: () => {} };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <ThemeContext.Provider value={authThemeValue}>
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
                  hitSlop={8}
                >
                  <MaterialCommunityIcons name="close" size={22} color={theme.colors.textSecondary} />
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
                    <Text style={[styles.switchButtonText, mode === 'login' && styles.switchButtonTextActive, { color: mode === 'login' ? theme.colors.text : theme.colors.textSecondary }]}>
                      Sign in
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.switchButton, mode === 'register' && { backgroundColor: theme.colors.accent }]}
                    onPress={() => setMode('register')}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.switchButtonText, mode === 'register' && styles.switchButtonTextActive, { color: mode === 'register' ? theme.colors.text : theme.colors.textSecondary }]}>
                      Create account
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            )}

            <ScrollView
              style={styles.scrollView}
              contentContainerStyle={[styles.scrollContent, { paddingBottom: Math.max(safeBottom, 24) + 80 }]}
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
                          <ActivityIndicator color={theme.colors.text} />
                        ) : (
                          <Text style={[styles.primaryButtonText, { color: theme.colors.text }]}>Submit code</Text>
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
                          <TouchableOpacity onPress={() => { setShowForgotPassword(false); setForgotCode(''); setForgotCodeMode('device'); setForgotStep(1); setNewPassword(''); setConfirmPassword(''); }} hitSlop={8}>
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
                        <Text style={[styles.forgotSectionLabel, { color: theme.colors.textMuted }]}>Choose recovery method</Text>
                        <TouchableOpacity
                          style={[styles.forgotOptionCard, { backgroundColor: theme.colors.surface, borderColor: forgotCodeMode === 'device' ? theme.colors.accent : theme.colors.border }]}
                          onPress={() => { setForgotCodeMode('device'); setForgotCode(''); setForgotStep(1); }}
                          activeOpacity={0.7}
                        >
                          <MaterialCommunityIcons name="cellphone-check" size={22} color={theme.colors.accent} style={styles.forgotOptionIcon} />
                          <View style={styles.forgotOptionBody}>
                            <Text style={[styles.forgotOptionTitle, { color: theme.colors.text }]}>Code from primary device</Text>
                            <Text style={[styles.forgotOptionHint, { color: theme.colors.textSecondary }]}>
                              You have multiple devices. Open QSafe on your primary device (Device 1 – the first one you registered), go to Settings → Activity → Generate password reset code. Enter the 6-digit code here. Valid for 10 minutes.
                            </Text>
                          </View>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.forgotOptionCard, { backgroundColor: theme.colors.surface, borderColor: forgotCodeMode === 'security' ? theme.colors.accent : theme.colors.border }]}
                          onPress={handleUseSecurityCode}
                          disabled={recoveryOptionsLoading}
                          activeOpacity={0.7}
                        >
                          <MaterialCommunityIcons name="shield-account-outline" size={22} color={theme.colors.accent} style={styles.forgotOptionIcon} />
                          <View style={styles.forgotOptionBody}>
                            <Text style={[styles.forgotOptionTitle, { color: theme.colors.text }]}>
                              {recoveryOptionsLoading ? 'Checking...' : 'Security code'}
                            </Text>
                            <Text style={[styles.forgotOptionHint, { color: theme.colors.textSecondary }]}>
                              You only have one device or your primary device is the one with the problem. Enter the 4–6 digit security code you set at registration.
                            </Text>
                          </View>
                        </TouchableOpacity>
                        <Input
                          label={forgotCodeMode === 'security' ? 'Security code' : 'Code from primary device'}
                          icon="numeric"
                          placeholder={forgotCodeMode === 'security' ? '4–6 digit code you set at registration' : '6-digit code from Settings'}
                          value={forgotCode}
                          onChangeText={(t) => setForgotCode(t.replace(/\D/g, '').slice(0, 6))}
                          keyboardType="number-pad"
                          hint={forgotCodeMode === 'security' ? 'Your security code from when you created the account.' : 'Generate the code on your primary device, then enter it here.'}
                        />
                        {forgotStep === 1 ? (
                          <TouchableOpacity
                            style={[styles.primaryButtonWrapper, { backgroundColor: theme.colors.accent }]}
                            onPress={() => {
                              const valid = forgotCodeMode === 'security'
                                ? forgotCode.length >= 4 && forgotCode.length <= 6
                                : forgotCode.length === 6;
                              if (!valid) {
                                Alert.alert('Validation', forgotCodeMode === 'security' ? 'Enter your 4–6 digit security code.' : 'Enter the 6-digit code from your primary device.');
                                return;
                              }
                              setForgotStep(2);
                            }}
                            disabled={!email.trim() || (forgotCodeMode === 'security' ? forgotCode.length < 4 : forgotCode.length !== 6)}
                            activeOpacity={0.85}
                          >
                            <Text style={[styles.primaryButtonText, { color: theme.colors.text }]}>Continue</Text>
                          </TouchableOpacity>
                        ) : (
                          <>
                            <TouchableOpacity
                              style={[styles.forgotBackStep, { marginBottom: spacing.md }]}
                              onPress={() => setForgotStep(1)}
                              hitSlop={8}
                            >
                              <MaterialCommunityIcons name="arrow-left" size={20} color={theme.colors.accent} />
                              <Text style={[styles.forgotBackStepText, { color: theme.colors.accent }]}>Change code</Text>
                            </TouchableOpacity>
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
                              disabled={forgotLoading || !newPassword || !confirmPassword}
                              activeOpacity={0.85}
                            >
                              {forgotLoading ? (
                                <ActivityIndicator color={theme.colors.text} />
                              ) : (
                                <Text style={[styles.primaryButtonText, { color: theme.colors.text }]}>Reset password</Text>
                              )}
                            </TouchableOpacity>
                          </>
                        )}
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

                    {mode === 'register' && (
                      <Input
                        label="Security code (for recovery)"
                        icon="shield-account-outline"
                        placeholder="4–6 digits"
                        value={securityCode}
                        onChangeText={(t) => setSecurityCode(t.replace(/\D/g, '').slice(0, 6))}
                        keyboardType="number-pad"
                        hint={SECURITY_CODE_HINT}
                      />
                    )}

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
                      disabled={loading || (mode === 'register' && securityCode.length < 4)}
                      activeOpacity={0.85}
                    >
                      {loading ? (
                        <ActivityIndicator color={theme.colors.bg} />
                      ) : (
                        <Text style={[styles.primaryButtonText, { color: theme.colors.text }]}>
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
      </ThemeContext.Provider>
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
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
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
  forgotSectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
  },
  forgotOptionCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: spacing.md,
    borderRadius: radii.md,
    marginBottom: spacing.sm,
    borderWidth: 2,
  },
  forgotOptionIcon: {
    marginRight: spacing.md,
  },
  forgotOptionBody: {
    flex: 1,
  },
  forgotOptionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  forgotOptionHint: {
    fontSize: 13,
    lineHeight: 18,
    opacity: 0.9,
  },
  forgotBackStep: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  forgotBackStepText: {
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
