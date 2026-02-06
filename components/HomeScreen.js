import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { AccountCard } from './AccountCard';
import { theme } from '../constants/theme';

export const HomeScreen = ({
  token,
  accounts,
  totpCodes,
  totpAdjacent = {},
  totpSecondsRemaining = 0,
  onLogout,
  onScanPress,
  onRemoveAccount,
}) => {
  if (!token) {
    return (
      <View style={styles.authPrompt}>
        <View style={styles.logoContainer}>
          <Text style={styles.logo}>Q</Text>
        </View>
        <Text style={styles.authPromptTitle}>QSafe</Text>
        <Text style={styles.authPromptSubtitle}>
          Quantum-Safe Authentication
        </Text>
        <Text style={styles.authPromptTagline}>
          Post-quantum cryptography · TOTP · Push MFA
        </Text>
        <TouchableOpacity
          style={styles.authPromptButtonWrapper}
          onPress={onScanPress}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={theme.gradients.accent}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.authPromptButton}
          >
            <Text style={styles.authPromptButtonText}>Get Started</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>My Accounts</Text>
          <Text style={styles.headerSubtitle}>
            {accounts.length} {accounts.length === 1 ? 'account' : 'accounts'}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={onLogout}
          activeOpacity={0.7}
        >
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {accounts.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={styles.emptyIconWrap}>
            <Text style={styles.emptyStateIcon}>◇</Text>
          </View>
          <Text style={styles.emptyStateTitle}>No accounts yet</Text>
          <Text style={styles.emptyStateText}>
            Tap the + button to scan a QR code{'\n'}and add your first account
          </Text>
        </View>
      ) : (
        <View style={styles.accountsList}>
          {accounts.map((acc, index) => {
            const codeKey = acc.id || `fallback-${acc.issuer}-${acc.label}-${index}`;
            return (
              <AccountCard
                key={acc.id || codeKey}
                account={acc}
                code={totpCodes[codeKey]}
                adjacent={totpAdjacent[codeKey]}
                secondsRemaining={totpSecondsRemaining}
                onRemove={onRemoveAccount}
              />
            );
          })}
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingBottom: 120,
    paddingHorizontal: theme.spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
  },
  headerTitle: {
    ...theme.typography.h1,
    color: theme.colors.text,
    marginBottom: 4,
  },
  headerSubtitle: {
    ...theme.typography.bodySm,
    color: theme.colors.textSecondary,
    letterSpacing: 0.5,
  },
  logoutButton: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.radii.full,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  logoutButtonText: {
    color: theme.colors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.lg,
  },
  emptyStateIcon: {
    fontSize: 32,
    color: theme.colors.accent,
    fontWeight: '300',
  },
  emptyStateTitle: {
    ...theme.typography.h2,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  emptyStateText: {
    ...theme.typography.bodySm,
    color: theme.colors.textMuted,
    textAlign: 'center',
    lineHeight: 22,
  },
  accountsList: {
    gap: theme.spacing.md,
  },
  authPrompt: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.xl,
  },
  logoContainer: {
    marginBottom: theme.spacing.lg,
  },
  logo: {
    fontSize: 64,
    fontWeight: '800',
    color: theme.colors.accent,
    letterSpacing: -2,
  },
  authPromptTitle: {
    ...theme.typography.display,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  authPromptSubtitle: {
    ...theme.typography.h2,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: theme.spacing.xs,
  },
  authPromptTagline: {
    ...theme.typography.caption,
    color: theme.colors.textMuted,
    textAlign: 'center',
    marginBottom: theme.spacing.xxl,
    letterSpacing: 1,
  },
  authPromptButtonWrapper: {
    borderRadius: theme.radii.lg,
    overflow: 'hidden',
    ...Platform.select({
      ios: theme.shadow.glow,
      android: { elevation: 8 },
    }),
  },
  authPromptButton: {
    paddingHorizontal: theme.spacing.xxl,
    paddingVertical: theme.spacing.lg,
    borderRadius: theme.radii.lg,
    minWidth: 200,
    alignItems: 'center',
  },
  authPromptButtonText: {
    color: theme.colors.bg,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
