import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../constants/theme';

export const BiometricGate = ({ onUnlock, loading }) => {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconWrap}>
          <Text style={styles.icon}>Q</Text>
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
    padding: theme.spacing.xl,
  },
  content: {
    alignItems: 'center',
    width: '100%',
    maxWidth: 280,
  },
  iconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.lg,
  },
  icon: {
    fontSize: 40,
    fontWeight: '800',
    color: theme.colors.accent,
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
