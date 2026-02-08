/**
 * Unlock screen. Biometric or PIN when app is locked.
 * @module components/BiometricGate
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
import { spacing, radii } from '../constants/designTokens';

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
        <View style={[styles.iconWrap, { backgroundColor: theme.colors.bgCard }]}>
          <AppLogo size="lg" />
        </View>
        <Text style={[styles.title, { color: theme.colors.text }]}>Welcome back</Text>
        <Text style={[styles.tagline, { color: theme.colors.textMuted }]}>
          Unlock to access your codes
        </Text>

        {showPinPad || !hasBiometric ? (
          <>
            <Text style={[styles.pinHint, { color: theme.colors.textSecondary }]}>
              Enter your 6-digit PIN
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
              {loading ? 'Verifying...' : 'Tap to unlock with biometric'}
            </Text>
            <TouchableOpacity
              style={[styles.buttonWrapper, Platform.OS === 'ios' && theme.shadow?.glowSubtle]}
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
                  <ActivityIndicator color={theme.colors.onAccent} />
                ) : (
                  <>
                    <MaterialCommunityIcons name="fingerprint" size={24} color={theme.colors.onAccent} />
                    <Text style={[styles.buttonText, { color: theme.colors.onAccent }]}>Unlock</Text>
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
    width: 96,
    height: 96,
    borderRadius: radii.xxl,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  title: {
    ...themeDark.typography.h1,
    marginBottom: 2,
  },
  tagline: {
    ...themeDark.typography.caption,
    marginBottom: spacing.xxl,
    letterSpacing: 0.5,
  },
  pinHint: {
    ...themeDark.typography.bodySm,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  subtitle: {
    ...themeDark.typography.bodySm,
    textAlign: 'center',
    marginBottom: spacing.xxl,
  },
  buttonWrapper: {
    width: '100%',
    maxWidth: 280,
    borderRadius: radii.lg,
    overflow: 'hidden',
    ...Platform.select({ android: { elevation: 4 } }),
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xl,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '700',
  },
  usePinButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: spacing.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: radii.md,
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
    marginTop: spacing.lg,
  },
  useBiometricText: {
    fontSize: 15,
    fontWeight: '600',
  },
});
