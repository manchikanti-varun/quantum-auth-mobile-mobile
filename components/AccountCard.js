/**
 * TOTP account card. Displays issuer, code, countdown; long-press to copy.
 * @module components/AccountCard
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import { ConfirmDialog } from './ui';
import { getIssuerIcon, getIssuerColor } from '../utils/issuerIcons';
import { spacing, radii } from '../constants/designTokens';

export const AccountCard = ({ account, code, secondsRemaining = 0, onRemove, onToggleFavorite, isFavorite, onCopy, onEdit, onMoveUp, onMoveDown, canMoveUp, canMoveDown }) => {
  const { theme } = useTheme();
  const { showToast } = useToast();
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);
  const iconName = account.customIcon || getIssuerIcon(account.issuer);
  const brandColors = getIssuerColor(account.issuer);
  const iconBg = brandColors?.bg || theme.colors.surface;
  const iconColor = brandColors?.icon || theme.colors.accent;

  const handleRemovePress = () => setShowRemoveConfirm(true);
  const handleRemoveConfirm = () => {
    onRemove?.(account.id);
    setShowRemoveConfirm(false);
  };

  return (
    <View style={[styles.cardWrapper, Platform.select({ ios: theme.shadow?.cardSoft, android: { elevation: 6 } })]}>
      <View style={[styles.card, { backgroundColor: theme.colors.bgCard, borderWidth: 1, borderColor: theme.colors.border }]}>
        <View style={styles.cardInner}>
          <View style={[styles.iconWrap, { backgroundColor: iconBg }]}>
            {iconName ? (
              <MaterialCommunityIcons name={iconName} size={28} color={iconColor} />
            ) : (
              <Text style={[styles.iconText, { color: iconColor }]}>
                {(account.issuer || '?').charAt(0).toUpperCase()}
              </Text>
            )}
          </View>
          <View style={styles.info}>
            <View style={styles.infoRow}>
              <Text style={[styles.issuer, { color: theme.colors.text }]}>{account.issuer}</Text>
              <View style={styles.infoActions}>
                {(onMoveUp || onMoveDown) && (
                  <View style={styles.reorderButtons}>
                    {onMoveUp && (
                      <TouchableOpacity
                        onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onMoveUp(); }}
                        hitSlop={6}
                        style={[styles.reorderBtn, !canMoveUp && styles.reorderBtnDisabled]}
                        disabled={!canMoveUp}
                      >
                        <MaterialCommunityIcons name="chevron-up" size={20} color={canMoveUp ? theme.colors.accent : theme.colors.textMuted} />
                      </TouchableOpacity>
                    )}
                    {onMoveDown && (
                      <TouchableOpacity
                        onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onMoveDown(); }}
                        hitSlop={6}
                        style={[styles.reorderBtn, !canMoveDown && styles.reorderBtnDisabled]}
                        disabled={!canMoveDown}
                      >
                        <MaterialCommunityIcons name="chevron-down" size={20} color={canMoveDown ? theme.colors.accent : theme.colors.textMuted} />
                      </TouchableOpacity>
                    )}
                  </View>
                )}
                {onToggleFavorite && (
                  <TouchableOpacity onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onToggleFavorite(account.id); }} hitSlop={10}>
                    <MaterialCommunityIcons name={isFavorite ? 'star' : 'star-outline'} size={22} color={isFavorite ? theme.colors.warning : theme.colors.textMuted} />
                  </TouchableOpacity>
                )}
                {onEdit && (
                  <TouchableOpacity style={styles.smallButton} onPress={() => onEdit(account)} hitSlop={6}>
                    <MaterialCommunityIcons name="pencil-outline" size={18} color={theme.colors.textMuted} />
                  </TouchableOpacity>
                )}
                {onRemove && (
                  <TouchableOpacity style={styles.smallButton} onPress={handleRemovePress} hitSlop={8}>
                    <MaterialCommunityIcons name="delete-outline" size={22} color={theme.colors.error} />
                  </TouchableOpacity>
                )}
              </View>
            </View>
            <Text style={[styles.label, { color: theme.colors.textSecondary }]} numberOfLines={1}>{account.label}</Text>
            {account.notes ? (
              <Text style={[styles.notes, { color: theme.colors.textMuted }]} numberOfLines={1}>{account.notes}</Text>
            ) : null}
          </View>
        </View>

        <TouchableOpacity
          onLongPress={async () => {
            const c = code && String(code).length === 6 ? String(code).replace(/\s/g, '') : '';
            if (c) {
              await Clipboard.setStringAsync(c);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              showToast('Copied!');
              onCopy?.();
            }
          }}
          activeOpacity={0.7}
          style={[styles.codeSection, { backgroundColor: theme.colors.surface }]}
          accessible
          accessibilityLabel="Long-press to copy code"
        >
          <Text style={[styles.code, { color: theme.colors.success }]}>
            {code && String(code).length === 6
              ? `${String(code).slice(0, 3)} ${String(code).slice(3, 6)}`
              : code || '— — — — — —'}
          </Text>
          <View style={styles.codeFooter}>
            <View style={[styles.countdownTrack, { backgroundColor: theme.colors.bgCard }]}>
              <View style={[styles.countdownFill, { width: `${Math.max(0, (secondsRemaining || 0) / 30) * 100}%`, backgroundColor: theme.colors.accent }]} />
            </View>
            {code && String(code).length === 6 && (
              <Text style={[styles.copyHint, { color: theme.colors.textMuted }]}>Long-press to copy</Text>
            )}
          </View>
        </TouchableOpacity>
      </View>
      <ConfirmDialog
        visible={showRemoveConfirm}
        title="Remove account"
        message={`Remove ${account.issuer}: ${account.label}?`}
        confirmText="Remove"
        cancelText="Cancel"
        destructive
        onConfirm={handleRemoveConfirm}
        onCancel={() => setShowRemoveConfirm(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  cardWrapper: {
    marginBottom: spacing.md,
  },
  card: {
    borderRadius: radii.lg,
    overflow: 'hidden',
  },
  cardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
  },
  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  iconText: {
    fontSize: 22,
    fontWeight: '700',
  },
  info: {
    flex: 1,
    minWidth: 0,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  issuer: {
    fontSize: 17,
    fontWeight: '600',
  },
  infoActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  reorderButtons: {
    flexDirection: 'column',
    marginRight: 2,
  },
  reorderBtn: {
    padding: 2,
  },
  reorderBtnDisabled: {
    opacity: 0.4,
  },
  smallButton: {
    padding: 4,
  },
  label: {
    fontSize: 14,
    opacity: 0.9,
  },
  notes: {
    fontSize: 12,
    marginTop: 2,
    fontStyle: 'italic',
    opacity: 0.8,
  },
  codeSection: {
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
  },
  code: {
    fontSize: 32,
    fontWeight: '700',
    letterSpacing: 8,
    fontFamily: 'monospace',
  },
  codeFooter: {
    marginTop: spacing.md,
    alignItems: 'center',
  },
  countdownTrack: {
    height: 4,
    width: 80,
    borderRadius: 2,
    overflow: 'hidden',
    position: 'relative',
  },
  countdownFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    borderRadius: 2,
  },
  copyHint: {
    fontSize: 12,
    marginTop: 6,
    fontWeight: '500',
  },
});
