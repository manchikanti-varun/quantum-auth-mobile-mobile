/**
 * App lock setup prompt. First-time PIN setup; fallback when biometric unavailable.
 * @module components/AppLockPromptModal
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
import { useTheme } from '../context/ThemeContext';
import { themeDark } from '../constants/themes';
import { spacing, radii } from '../constants/designTokens';

export const AppLockPromptModal = ({
  visible,
  hasBiometric,
  isMigration = false,
  onEnable,
  onSkip,
}) => {
  const { theme } = useTheme();
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
      <View style={[styles.overlay, { backgroundColor: theme.colors.overlay }]}>
        <View style={[styles.content, { backgroundColor: theme.colors.bgElevated }]}>
          <AppLogo size="md" />
          {showPinSetup ? (
            <>
              <Text style={[styles.title, { color: theme.colors.text }]}>
                {isMigration ? 'Set your PIN' : 'Create a PIN'}
              </Text>
              <Text style={[styles.subtitle, { color: theme.colors.textMuted }]}>
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
              <Text style={[styles.title, { color: theme.colors.text }]}>Keep your codes secure</Text>
              <Text style={[styles.subtitle, { color: theme.colors.textMuted }]}>
                Lock QSafe when you're not using it. You'll unlock with {hasBiometric ? 'fingerprint, face, or PIN' : 'PIN'} when you return.
              </Text>
              <View style={styles.buttons}>
                <TouchableOpacity
                  style={[styles.button, { backgroundColor: theme.colors.accent }]}
                  onPress={handleSetPin}
                  activeOpacity={0.85}
                >
                  <MaterialCommunityIcons name="numeric" size={22} color={theme.colors.onAccent} />
                  <Text style={[styles.buttonText, { color: theme.colors.onAccent }]}>Set PIN</Text>
                </TouchableOpacity>
                {!isMigration && (
                  <TouchableOpacity
                    style={[styles.button, { backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border }]}
                    onPress={onSkip}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.buttonText, { color: theme.colors.textSecondary }]}>Skip for now</Text>
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
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  content: {
    borderRadius: radii.xxl,
    padding: spacing.xl,
    width: '100%',
    maxWidth: 360,
    alignItems: 'center',
  },
  title: {
    ...themeDark.typography.h2,
    marginTop: spacing.lg,
    textAlign: 'center',
  },
  subtitle: {
    ...themeDark.typography.bodySm,
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
  buttonText: {
    fontSize: 16,
    fontWeight: '700',
  },
});
