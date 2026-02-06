import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../constants/theme';

export const AuthModal = ({ visible, onClose, onLogin, onRegister, loading, pendingMfa, onCancelPendingMfa, onLoginWithOtp }) => {
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
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
      await onLogin(email, password);
    } else {
      await onRegister(email, password, displayName);
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
    >
      <View style={styles.overlay}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardView}
        >
          <View style={styles.content}>
            <View style={styles.header}>
              <Text style={styles.title}>QSafe</Text>
              {!showWaiting && (
                <TouchableOpacity
                  onPress={onClose}
                  style={styles.closeButton}
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                >
                  <Text style={styles.close}>×</Text>
                </TouchableOpacity>
              )}
            </View>

            {showWaiting ? (
              <View style={styles.waitingBlock}>
                {!showOtpInput ? (
                  <>
                    <ActivityIndicator size="large" color={theme.colors.accent} style={styles.waitingSpinner} />
                    <Text style={styles.waitingTitle}>Waiting for approval</Text>
                    <Text style={styles.waitingSubtitle}>
                      Open QSafe on your other device and tap Approve or Deny. If it’s offline, use the 6-digit backup code below.
                    </Text>
                    <TouchableOpacity
                      style={styles.useOtpButton}
                      onPress={() => setShowOtpInput(true)}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.useOtpButtonText}>Use 6-digit code instead</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.cancelWaitingButton}
                      onPress={onCancelPendingMfa}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.cancelWaitingText}>Cancel</Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  <>
                    <Text style={styles.waitingTitle}>Backup code</Text>
                    <Text style={styles.waitingSubtitle}>
                      Enter the 6-digit code from your authenticator app (the one you saved when you registered).
                    </Text>
                    <TextInput
                      style={styles.otpInput}
                      placeholder="000000"
                      placeholderTextColor={theme.colors.textMuted}
                      value={otpCode}
                      onChangeText={(t) => setOtpCode(t.replace(/\D/g, '').slice(0, 6))}
                      keyboardType="number-pad"
                      maxLength={6}
                    />
                    <TouchableOpacity
                      style={styles.submitOtpButton}
                      onPress={() => onLoginWithOtp?.(pendingMfa.challengeId, pendingMfa.deviceId, otpCode)}
                      disabled={loading || otpCode.length !== 6}
                      activeOpacity={0.85}
                    >
                      <LinearGradient
                        colors={theme.gradients.accent}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.submitOtpButtonInner}
                      >
                        {loading ? (
                          <ActivityIndicator color={theme.colors.bg} />
                        ) : (
                          <Text style={styles.primaryButtonText}>Submit code</Text>
                        )}
                      </LinearGradient>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.cancelWaitingButton}
                      onPress={() => { setShowOtpInput(false); setOtpCode(''); }}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.cancelWaitingText}>Back</Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            ) : (
              <>
            <View style={styles.switchRow}>
              <TouchableOpacity
                style={styles.switchButton}
                onPress={() => setMode('login')}
                activeOpacity={0.8}
              >
                {mode === 'login' ? (
                  <LinearGradient
                    colors={theme.gradients.accent}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.switchButtonInner}
                  >
                    <Text style={styles.switchButtonTextActive}>Login</Text>
                  </LinearGradient>
                ) : (
                  <View style={styles.switchButtonInner}>
                    <Text style={styles.switchButtonText}>Login</Text>
                  </View>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.switchButton}
                onPress={() => setMode('register')}
                activeOpacity={0.8}
              >
                {mode === 'register' ? (
                  <LinearGradient
                    colors={theme.gradients.accent}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.switchButtonInner}
                  >
                    <Text style={styles.switchButtonTextActive}>Register</Text>
                  </LinearGradient>
                ) : (
                  <View style={styles.switchButtonInner}>
                    <Text style={styles.switchButtonText}>Register</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>

            <View style={styles.form}>
              {mode === 'register' && (
                <>
                  <Text style={styles.label}>Display name</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Your name"
                    placeholderTextColor={theme.colors.textMuted}
                    autoCapitalize="words"
                    value={displayName}
                    onChangeText={setDisplayName}
                  />
                </>
              )}

              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                placeholder="you@example.com"
                placeholderTextColor={theme.colors.textMuted}
                autoCapitalize="none"
                keyboardType="email-address"
                value={email}
                onChangeText={setEmail}
              />

              <Text style={styles.label}>Password</Text>
              <TextInput
                style={styles.input}
                placeholder="••••••••"
                placeholderTextColor={theme.colors.textMuted}
                secureTextEntry
                value={password}
                onChangeText={setPassword}
              />

              <TouchableOpacity
                style={styles.primaryButtonWrapper}
                onPress={handleSubmit}
                disabled={loading}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={theme.gradients.accent}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.primaryButton}
                >
                  {loading ? (
                    <ActivityIndicator color={theme.colors.bg} />
                  ) : (
                    <Text style={styles.primaryButtonText}>
                      {mode === 'register' ? 'Create account' : 'Login'}
                    </Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
              </>
            )}
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(5, 7, 13, 0.9)',
    justifyContent: 'flex-end',
  },
  keyboardView: {
    width: '100%',
  },
  content: {
    backgroundColor: theme.colors.bgElevated,
    borderTopLeftRadius: theme.radii.xl,
    borderTopRightRadius: theme.radii.xl,
    padding: theme.spacing.lg,
    paddingBottom: 48,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: theme.colors.border,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  title: {
    ...theme.typography.h1,
    color: theme.colors.text,
  },
  closeButton: {
    padding: theme.spacing.xs,
  },
  close: {
    fontSize: 28,
    color: theme.colors.textMuted,
    fontWeight: '300',
  },
  switchRow: {
    flexDirection: 'row',
    backgroundColor: theme.colors.bgCard,
    borderRadius: theme.radii.md,
    padding: 4,
    marginBottom: theme.spacing.xl,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  switchButton: {
    flex: 1,
    borderRadius: theme.radii.sm,
    overflow: 'hidden',
  },
  switchButtonInner: {
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  switchButtonText: {
    color: theme.colors.textMuted,
    fontWeight: '600',
    fontSize: 15,
    paddingVertical: theme.spacing.md,
    textAlign: 'center',
  },
  switchButtonTextActive: {
    color: theme.colors.bg,
    fontWeight: '700',
    fontSize: 15,
  },
  form: {
    marginTop: theme.spacing.xs,
  },
  label: {
    color: theme.colors.textSecondary,
    fontSize: 14,
    marginBottom: theme.spacing.sm,
    marginTop: theme.spacing.md,
    fontWeight: '500',
  },
  input: {
    backgroundColor: theme.colors.bgCard,
    borderRadius: theme.radii.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    color: theme.colors.text,
    borderWidth: 1,
    borderColor: theme.colors.border,
    fontSize: 16,
  },
  primaryButtonWrapper: {
    marginTop: theme.spacing.xl,
    borderRadius: theme.radii.md,
    overflow: 'hidden',
  },
  primaryButton: {
    paddingVertical: theme.spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: theme.colors.bg,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  waitingBlock: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xl,
  },
  waitingSpinner: {
    marginBottom: theme.spacing.lg,
  },
  waitingTitle: {
    ...theme.typography.h2,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
  waitingSubtitle: {
    ...theme.typography.bodySm,
    color: theme.colors.textMuted,
    textAlign: 'center',
    marginBottom: theme.spacing.xl,
    paddingHorizontal: theme.spacing.md,
  },
  useOtpButton: {
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.xl,
    borderRadius: theme.radii.md,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.accent,
    marginBottom: theme.spacing.sm,
  },
  useOtpButtonText: {
    color: theme.colors.accent,
    fontWeight: '600',
    fontSize: 16,
  },
  otpInput: {
    backgroundColor: theme.colors.bgCard,
    borderRadius: theme.radii.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    color: theme.colors.text,
    borderWidth: 1,
    borderColor: theme.colors.border,
    fontSize: 24,
    letterSpacing: 8,
    textAlign: 'center',
    marginBottom: theme.spacing.md,
    minWidth: 160,
  },
  submitOtpButton: {
    borderRadius: theme.radii.md,
    overflow: 'hidden',
    marginBottom: theme.spacing.sm,
    minWidth: 160,
  },
  submitOtpButtonInner: {
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelWaitingButton: {
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.xl,
    borderRadius: theme.radii.md,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  cancelWaitingText: {
    color: theme.colors.textSecondary,
    fontWeight: '600',
    fontSize: 16,
  },
});
