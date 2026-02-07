import React from 'react';
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
import { useLayout } from '../hooks/useLayout';
import { theme } from '../constants/theme';

export const BiometricGate = ({ onUnlock, loading }) => {
  const { horizontalPadding, contentMaxWidth } = useLayout();

  return (
    <View style={[styles.container, { paddingHorizontal: horizontalPadding }]}>
      <View style={[styles.content, { maxWidth: contentMaxWidth }]}>
        <View style={styles.iconWrap}>
          <AppLogo size="lg" />
        </View>
        <Text style={styles.title}>QSafe</Text>
        <Text style={styles.subtitle}>
          {loading ? 'Verifying...' : 'Verify identity to continue'}
        </Text>

        <TouchableOpacity
          style={styles.buttonWrapper}
          onPress={onUnlock}
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
              <Text style={styles.buttonText}>Unlock</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>
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
    backgroundColor: theme.colors.surface,
    borderWidth: 2,
    borderColor: theme.colors.borderBright,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.lg,
  },
  title: {
    ...theme.typography.h1,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  subtitle: {
    ...theme.typography.bodySm,
    color: theme.colors.textMuted,
    textAlign: 'center',
    marginBottom: theme.spacing.xxl,
  },
  buttonWrapper: {
    width: '100%',
    borderRadius: theme.radii.md,
    overflow: 'hidden',
    ...Platform.select({
      ios: theme.shadow.glowSubtle,
      android: { elevation: 4 },
    }),
  },
  button: {
    paddingVertical: theme.spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: theme.colors.bg,
    fontSize: 16,
    fontWeight: '700',
  },
});
