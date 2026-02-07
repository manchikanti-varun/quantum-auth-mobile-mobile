import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Platform,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { getIssuerIcon } from '../utils/issuerIcons';
import { themeDark } from '../constants/themes';

export const AccountCard = ({ account, code, secondsRemaining = 0, onRemove, onToggleFavorite, isFavorite, onCopy, onEdit }) => {
  const { theme } = useTheme();
  const iconName = account.customIcon || getIssuerIcon(account.issuer);
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
          <View style={[styles.card, { backgroundColor: theme.colors.bgCard }]}>
            <View style={styles.cardHeader}>
              <View style={[styles.iconWrap, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
                {iconName ? (
                  <MaterialCommunityIcons name={iconName} size={26} color={theme.colors.accent} />
                ) : (
                  <Text style={[styles.iconText, { color: theme.colors.accent }]}>
                    {account.issuer.charAt(0).toUpperCase()}
                  </Text>
                )}
              </View>
              <View style={styles.info}>
                <View style={styles.infoRow}>
                  <Text style={[styles.issuer, { color: theme.colors.text }]}>{account.issuer}</Text>
                  {onToggleFavorite && (
                    <TouchableOpacity onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onToggleFavorite(account.id); }} hitSlop={8}>
                      <MaterialCommunityIcons
                        name={isFavorite ? 'star' : 'star-outline'}
                        size={22}
                        color={isFavorite ? theme.colors.warning : theme.colors.textMuted}
                      />
                    </TouchableOpacity>
                  )}
                </View>
                <Text style={[styles.label, { color: theme.colors.textMuted }]} numberOfLines={1}>{account.label}</Text>
                {account.notes && (
                  <Text style={[styles.notes, { color: theme.colors.textMuted }]} numberOfLines={1}>{account.notes}</Text>
                )}
              </View>
              <View style={styles.headerActions}>
                {onEdit && (
                  <TouchableOpacity
                    style={[styles.editButton, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
                    onPress={() => onEdit(account)}
                    hitSlop={8}
                  >
                    <MaterialCommunityIcons name="pencil" size={18} color={theme.colors.textMuted} />
                  </TouchableOpacity>
                )}
                {onRemove && (
                  <TouchableOpacity
                    style={[styles.removeButton, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
                    onPress={handleRemove}
                    hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.removeButtonText, { color: theme.colors.textMuted }]}>×</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
            <View style={[styles.codeContainer, { borderTopColor: theme.colors.border }]}>
              <TouchableOpacity
                onPress={async () => {
                  const c = code && String(code).length === 6 ? String(code).replace(/\s/g, '') : '';
                  if (c) {
                    await Clipboard.setStringAsync(c);
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                    onCopy?.();
                  }
                }}
                activeOpacity={0.8}
                style={styles.codeRow}
              >
                <View style={styles.codeSpacerLeft} />
                <Text style={[styles.code, { color: theme.colors.success }]}>
                  {code && String(code).length === 6
                    ? `${String(code).slice(0, 3)} ${String(code).slice(3, 6)}`
                    : code || '— — — — — —'}
                </Text>
                <View style={styles.codeSpacerRight}>
                  {code && String(code).length === 6 && (
                    <MaterialCommunityIcons name="content-copy" size={20} color={theme.colors.textMuted} />
                  )}
                </View>
              </TouchableOpacity>
              <View style={[styles.countdownWrap, { backgroundColor: theme.colors.surface }]}>
                <View style={[styles.countdownBar, { width: `${Math.max(0, (secondsRemaining || 0) / 30) * 100}%`, backgroundColor: theme.colors.accent }]} />
                <Text style={[styles.countdownText, { color: theme.colors.textSecondary }]}>
                  {secondsRemaining}s
                </Text>
              </View>
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
      ios: themeDark.shadow.card,
      android: { elevation: 8 },
    }),
  },
  cardBorder: {
    borderRadius: themeDark.radii.lg,
    overflow: 'hidden',
  },
  cardGradient: {
    padding: 2,
    borderRadius: themeDark.radii.lg,
  },
  card: {
    borderRadius: 14,
    padding: 16,
    borderWidth: 0,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: themeDark.spacing.md,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: themeDark.radii.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: themeDark.spacing.md,
  },
  iconText: {
    fontSize: 20,
    fontWeight: '700',
  },
  info: {
    flex: 1,
    minWidth: 0,
    alignItems: 'flex-start',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  notes: {
    fontSize: 12,
    marginTop: 2,
    fontStyle: 'italic',
    alignSelf: 'stretch',
  },
  codeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  codeSpacerLeft: {
    flex: 1,
  },
  codeSpacerRight: {
    flex: 1,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  issuer: {
    ...themeDark.typography.body,
    fontWeight: '600',
    marginBottom: 2,
  },
  label: {
    ...themeDark.typography.bodySm,
    alignSelf: 'stretch',
  },
  codeContainer: {
    alignItems: 'center',
    paddingTop: themeDark.spacing.md,
    borderTopWidth: 1,
  },
  code: {
    fontSize: 36,
    fontWeight: '700',
    letterSpacing: 10,
    ...themeDark.typography.mono,
  },
  countdownWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: themeDark.spacing.md,
    height: 22,
    borderRadius: 11,
    overflow: 'hidden',
    width: 64,
    alignSelf: 'center',
  },
  countdownBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    borderRadius: 11,
  },
  countdownText: {
    fontSize: 11,
    fontWeight: '700',
    zIndex: 1,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: themeDark.spacing.xs,
  },
  editButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeButtonText: {
    fontSize: 22,
    fontWeight: '400',
    lineHeight: 24,
  },
});
