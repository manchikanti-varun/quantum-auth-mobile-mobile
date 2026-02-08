/**
 * AppLockPromptModal – First-time setup: always set PIN first (even with biometric).
 * PIN is required as fallback when biometric fails or isn't available.
 */
import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AppLogo } from './AppLogo';
import { PinPad } from './PinPad';
import { hashPin } from '../utils/pinHash';
import { themeDark } from '../constants/themes';
import { spacing, radii } from '../constants/designTokens';

export const AppLockPromptModal = ({
  visible,
  hasBiometric,
  isMigration = false,
  onEnable,
  onSkip,
}) => {
  const [showPinSetup, setShowPinSetup] = useState(isMigration);

  useEffect(() => {
    if (visible && isMigration) setShowPinSetup(true);
  }, [visible, isMigration]);

  const handleSetPin = () => {
    setShowPinSetup(true);
  };

  const handlePinComplete = async (pin) => {
    const hashed = await hashPin(pin);
    if (hashed) {
      onEnable?.({ enabled: true, pinHash: hashed });
      setShowPinSetup(false);
    }
  };

  if (!visible) return null;

  return (
    <Modal visible animationType="fade" transparent>
      <View style={styles.overlay}>
        <View style={styles.content}>
          <AppLogo size="md" />
          {showPinSetup ? (
            <>
              <Text style={styles.title}>
                {isMigration ? 'Set your PIN' : 'Create a PIN'}
              </Text>
              <Text style={styles.subtitle}>
                {isMigration
                  ? 'Use a 6-digit PIN as backup. You can unlock with fingerprint or face, and PIN when needed.'
                  : hasBiometric
                    ? 'Create a 6-digit PIN as backup. Use it when fingerprint or face isn\'t available.'
                    : 'Create a 6-digit PIN to keep your codes secure when the app is closed.'}
              </Text>
              <PinPad
                title="Set PIN (6 digits)"
                mode="setup"
                minLength={6}
                onComplete={handlePinComplete}
                onCancel={isMigration ? undefined : () => setShowPinSetup(false)}
              />
            </>
          ) : (
            <>
              <Text style={styles.title}>Keep your codes secure</Text>
              <Text style={styles.subtitle}>
                Lock QSafe when you're not using it. You'll unlock with {hasBiometric ? 'fingerprint, face, or PIN' : 'PIN'} when you return.
              </Text>
              <View style={styles.buttons}>
                <TouchableOpacity
                  style={[styles.button, styles.buttonPrimary]}
                  onPress={handleSetPin}
                  activeOpacity={0.85}
                >
                  <MaterialCommunityIcons name="numeric" size={22} color={themeDark.colors.bg} />
                  <Text style={[styles.buttonText, { color: themeDark.colors.bg }]}>Set PIN</Text>
                </TouchableOpacity>
                {!isMigration && (
                  <TouchableOpacity
                    style={[styles.button, styles.buttonSecondary]}
                    onPress={onSkip}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.buttonText, { color: themeDark.colors.textSecondary }]}>Skip for now</Text>
                  </TouchableOpacity>
                )}
              </View>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  content: {
    backgroundColor: themeDark.colors.bgElevated,
    borderRadius: radii.xxl,
    padding: spacing.xl,
    width: '100%',
    maxWidth: 360,
    alignItems: 'center',
  },
  title: {
    ...themeDark.typography.h2,
    color: themeDark.colors.text,
    marginTop: spacing.lg,
    textAlign: 'center',
  },
  subtitle: {
    ...themeDark.typography.bodySm,
    color: themeDark.colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.xl,
  },
  buttons: {
    width: '100%',
    gap: spacing.md,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.lg,
    borderRadius: radii.lg,
    gap: spacing.sm,
  },
  buttonPrimary: {
    backgroundColor: themeDark.colors.accent,
  },
  buttonSecondary: {
    backgroundColor: themeDark.colors.surface,
    borderWidth: 1,
    borderColor: themeDark.colors.border,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '700',
  },
});
