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
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AppLogo } from './AppLogo';
import { PinPad } from './PinPad';
import { useLayout } from '../hooks/useLayout';
import { useTheme } from '../context/ThemeContext';
import { themeDark } from '../constants/themes';

export const BiometricGate = ({ onUnlock, onPinUnlock, loading, hasPinFallback, hasBiometric = true }) => {
  const { theme } = useTheme();
  const { horizontalPadding, contentMaxWidth } = useLayout();
  const [showPinPad, setShowPinPad] = useState(!hasBiometric);

  const handleUnlockPress = async () => {
    if (!onUnlock) return;
    setShowPinPad(false);
    await onUnlock();
  };

  return (
    <View style={[styles.container, { paddingHorizontal: horizontalPadding }]}>
      <View style={[styles.content, { maxWidth: contentMaxWidth }]}>
        <View style={[styles.iconWrap, { backgroundColor: theme.colors.surface, borderColor: theme.colors.borderBright }]}>
          <AppLogo size="lg" />
        </View>
        <Text style={[styles.title, { color: theme.colors.text }]}>QSafe</Text>
        <Text style={[styles.tagline, { color: theme.colors.textMuted }]}>Secure Authenticator</Text>

        {showPinPad || !hasBiometric ? (
          <>
            <Text style={[styles.pinHint, { color: theme.colors.textSecondary }]}>
              Enter your PIN to unlock
            </Text>
            <PinPad
              title="Enter PIN"
              mode="verify"
              minLength={6}
              onComplete={(pin) => onPinUnlock?.(pin)}
              onCancel={hasBiometric && hasPinFallback ? () => setShowPinPad(false) : undefined}
            />
            {hasBiometric && (
              <TouchableOpacity
                onPress={() => setShowPinPad(false)}
                style={styles.useBiometric}
              >
                <MaterialCommunityIcons name="fingerprint" size={20} color={theme.colors.accent} />
                <Text style={[styles.useBiometricText, { color: theme.colors.accent }]}>Use fingerprint / face instead</Text>
              </TouchableOpacity>
            )}
          </>
        ) : (
          <>
            <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
              {loading ? 'Verifying...' : 'Tap to unlock with your fingerprint or face'}
            </Text>
            <TouchableOpacity
              style={styles.buttonWrapper}
              onPress={handleUnlockPress}
              disabled={loading}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={theme.gradients.accent}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.button}
              >
                {loading ? (
                  <ActivityIndicator color={theme.colors.bg} />
                ) : (
                  <>
                    <MaterialCommunityIcons name="fingerprint" size={24} color={theme.colors.bg} />
                    <Text style={[styles.buttonText, { color: theme.colors.bg }]}>Unlock</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
            {hasPinFallback && (
              <TouchableOpacity
                onPress={() => setShowPinPad(true)}
                style={[styles.usePinButton, { borderColor: theme.colors.border }]}
                activeOpacity={0.8}
              >
                <MaterialCommunityIcons name="numeric" size={20} color={theme.colors.accent} />
                <Text style={[styles.usePinText, { color: theme.colors.accent }]}>Use PIN instead</Text>
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
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: themeDark.spacing.lg,
  },
  title: {
    ...themeDark.typography.h1,
    marginBottom: 2,
  },
  tagline: {
    ...themeDark.typography.caption,
    marginBottom: themeDark.spacing.xxl,
    letterSpacing: 0.5,
  },
  pinHint: {
    ...themeDark.typography.bodySm,
    textAlign: 'center',
    marginBottom: themeDark.spacing.md,
  },
  subtitle: {
    ...themeDark.typography.bodySm,
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: themeDark.spacing.sm,
    paddingVertical: themeDark.spacing.lg,
  },
  buttonText: {
    color: themeDark.colors.bg,
    fontSize: 16,
    fontWeight: '700',
  },
  usePinButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: themeDark.spacing.lg,
    paddingVertical: themeDark.spacing.md,
    paddingHorizontal: themeDark.spacing.xl,
    borderRadius: themeDark.radii.md,
    borderWidth: 2,
    width: '100%',
  },
  usePinText: {
    fontSize: 15,
    fontWeight: '600',
  },
  useBiometric: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: themeDark.spacing.lg,
  },
  useBiometricText: {
    fontSize: 15,
    fontWeight: '600',
  },
});
