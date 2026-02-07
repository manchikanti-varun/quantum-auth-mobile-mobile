import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../constants/theme';

export const AccountCard = ({ account, code, adjacent, secondsRemaining = 0, onRemove }) => {
  const handleRemove = () => {
    Alert.alert(
      'Remove account',
      `Remove ${account.issuer}: ${account.label}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => onRemove?.(account.id),
        },
      ],
    );
  };

  return (
    <View style={styles.cardWrapper}>
      <View style={styles.cardBorder}>
        <LinearGradient
          colors={[theme.colors.accent, theme.colors.violet]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.cardGradient}
        >
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.iconWrap}>
                <Text style={styles.iconText}>
                  {account.issuer.charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={styles.info}>
                <Text style={styles.issuer}>{account.issuer}</Text>
                <Text style={styles.label}>{account.label}</Text>
              </View>
              {onRemove && (
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={handleRemove}
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.removeButtonText}>×</Text>
                </TouchableOpacity>
              )}
            </View>
            <View style={styles.codeContainer}>
              <Text style={styles.code} selectable>
                {code && String(code).length === 6
                  ? `${String(code).slice(0, 3)} ${String(code).slice(3, 6)}`
                  : code || '— — — — — —'}
              </Text>
              <Text style={styles.countdown}>
                Refreshes in {secondsRemaining}s
              </Text>
              {adjacent && (adjacent.prev || adjacent.next) && (
                <Text style={styles.adjacentTip}>
                  If wrong, try: {adjacent.prev || '—'} or {adjacent.next || '—'}
                </Text>
              )}
              <Text style={styles.timeTip}>
                Set time automatically in device settings if codes keep failing
              </Text>
            </View>
          </View>
        </LinearGradient>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  cardWrapper: {
    ...Platform.select({
      ios: theme.shadow.card,
      android: { elevation: 8 },
    }),
  },
  cardBorder: {
    borderRadius: theme.radii.lg,
    overflow: 'hidden',
  },
  cardGradient: {
    padding: 2,
    borderRadius: theme.radii.lg,
  },
  card: {
    backgroundColor: theme.colors.bgCard,
    borderRadius: theme.radii.lg - 1,
    padding: theme.spacing.lg,
    borderWidth: 0,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: theme.radii.md,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md,
  },
  iconText: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.accent,
  },
  info: {
    flex: 1,
    minWidth: 0,
  },
  issuer: {
    ...theme.typography.body,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 2,
  },
  label: {
    ...theme.typography.bodySm,
    color: theme.colors.textMuted,
  },
  codeContainer: {
    alignItems: 'center',
    paddingTop: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  code: {
    fontSize: 36,
    fontWeight: '700',
    color: theme.colors.success,
    letterSpacing: 10,
    ...theme.typography.mono,
  },
  countdown: {
    fontSize: 12,
    color: theme.colors.textMuted,
    marginTop: theme.spacing.sm,
  },
  adjacentTip: {
    fontSize: 13,
    color: theme.colors.accent,
    marginTop: theme.spacing.sm,
    ...theme.typography.mono,
  },
  timeTip: {
    fontSize: 11,
    color: theme.colors.textMuted,
    marginTop: theme.spacing.xs,
    textAlign: 'center',
    paddingHorizontal: theme.spacing.sm,
  },
  removeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: theme.spacing.sm,
  },
  removeButtonText: {
    color: theme.colors.textMuted,
    fontSize: 22,
    fontWeight: '400',
    lineHeight: 24,
  },
});
