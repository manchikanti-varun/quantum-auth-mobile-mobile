/**
 * BiometricGate – Unlock screen. Biometric or PIN fallback when app is locked.
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { AppLogo } from './AppLogo';
import { PinPad } from './PinPad';
import { useLayout } from '../hooks/useLayout';
import { themeDark } from '../constants/themes';

export const BiometricGate = ({ onUnlock, onPinUnlock, loading, hasPinFallback }) => {
  const { horizontalPadding, contentMaxWidth } = useLayout();
  const [showPinPad, setShowPinPad] = useState(false);

  const handleUnlockPress = async () => {
    if (!onUnlock) return;
    setShowPinPad(false);
    await onUnlock();
  };

  const handleBiometricFailed = () => {
    if (hasPinFallback) setShowPinPad(true);
  };

  return (
    <View style={[styles.container, { paddingHorizontal: horizontalPadding }]}>
      <View style={[styles.content, { maxWidth: contentMaxWidth }]}>
        <View style={styles.iconWrap}>
          <AppLogo size="lg" />
        </View>
        <Text style={styles.title}>QSafe</Text>

        {showPinPad ? (
          <>
            <PinPad
              title="Enter PIN"
              mode="verify"
              onComplete={(pin) => onPinUnlock?.(pin)}
              onCancel={hasPinFallback ? () => setShowPinPad(false) : undefined}
            />
            <TouchableOpacity
              onPress={() => setShowPinPad(false)}
              style={styles.useBiometric}
            >
              <Text style={styles.useBiometricText}>Use biometric instead</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Text style={styles.subtitle}>
              {loading ? 'Verifying...' : 'Verify identity to continue'}
            </Text>
            <TouchableOpacity
              style={styles.buttonWrapper}
              onPress={handleUnlockPress}
              disabled={loading}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={themeDark.gradients.accent}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.button}
              >
                {loading ? (
                  <ActivityIndicator color={themeDark.colors.bg} />
                ) : (
                  <Text style={styles.buttonText}>Unlock</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
            {hasPinFallback && (
              <TouchableOpacity onPress={() => setShowPinPad(true)} style={styles.usePin}>
                <Text style={styles.usePinText}>Use PIN instead</Text>
              </TouchableOpacity>
            )}
          </>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    width: '100%',
  },
  iconWrap: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: themeDark.colors.surface,
    borderWidth: 2,
    borderColor: themeDark.colors.borderBright,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: themeDark.spacing.lg,
  },
  title: {
    ...themeDark.typography.h1,
    color: themeDark.colors.text,
    marginBottom: themeDark.spacing.sm,
  },
  subtitle: {
    ...themeDark.typography.bodySm,
    color: themeDark.colors.textMuted,
    textAlign: 'center',
    marginBottom: themeDark.spacing.xxl,
  },
  buttonWrapper: {
    width: '100%',
    borderRadius: themeDark.radii.md,
    overflow: 'hidden',
    ...Platform.select({
      ios: themeDark.shadow.glowSubtle,
      android: { elevation: 4 },
    }),
  },
  button: {
    paddingVertical: themeDark.spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: themeDark.colors.bg,
    fontSize: 16,
    fontWeight: '700',
  },
  usePin: {
    marginTop: themeDark.spacing.lg,
  },
  usePinText: {
    color: themeDark.colors.accent,
    fontSize: 15,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  useBiometric: {
    marginTop: themeDark.spacing.lg,
  },
  useBiometricText: {
    color: themeDark.colors.accent,
    fontSize: 15,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});
