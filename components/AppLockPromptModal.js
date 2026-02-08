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
                {isMigration ? 'Set PIN to continue' : 'Set your PIN'}
              </Text>
              <Text style={styles.subtitle}>
                {isMigration
                  ? 'Please set a 6-digit PIN as backup. You can then use fingerprint or face, with PIN when needed.'
                  : hasBiometric
                    ? 'Set a 6-digit PIN. You\'ll use it as a backup when fingerprint or face isn\'t available.'
                    : 'Set a 6-digit PIN to lock the app when you\'re not using it.'}
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
              <Text style={styles.title}>Set up app lock?</Text>
              <Text style={styles.subtitle}>
                Lock QSafe when you're not using it. You'll need to unlock next time you open the app.
                {hasBiometric
                  ? ' Set a PIN first — you can then use fingerprint or face, with PIN as backup.'
                  : ' Set a PIN to secure your codes.'}
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
    backgroundColor: 'rgba(5, 7, 13, 0.92)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: themeDark.spacing.xl,
  },
  content: {
    backgroundColor: themeDark.colors.bgElevated,
    borderRadius: themeDark.radii.xxl,
    padding: themeDark.spacing.xl,
    width: '100%',
    maxWidth: 360,
    alignItems: 'center',
  },
  title: {
    ...themeDark.typography.h2,
    color: themeDark.colors.text,
    marginTop: themeDark.spacing.lg,
    textAlign: 'center',
  },
  subtitle: {
    ...themeDark.typography.bodySm,
    color: themeDark.colors.textMuted,
    textAlign: 'center',
    marginTop: themeDark.spacing.sm,
    marginBottom: themeDark.spacing.xl,
  },
  buttons: {
    width: '100%',
    gap: themeDark.spacing.md,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: themeDark.spacing.lg,
    borderRadius: themeDark.radii.lg,
    gap: themeDark.spacing.sm,
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
