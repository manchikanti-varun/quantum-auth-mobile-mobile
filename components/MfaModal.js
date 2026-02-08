/**
 * MfaModal – Approve/deny login request. Generate code for Device 2. Shows masked location, time.
 */
import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AppLogo } from './AppLogo';
import { useLayout } from '../hooks/useLayout';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import { mfaApi } from '../services/api';
import { spacing, radii } from '../constants/designTokens';

export const MfaModal = ({
  visible,
  challenge,
  onClose,
  onApprove,
  onDeny,
  onDenySuspicious,
  resolving,
}) => {
  const { theme } = useTheme();
  const { showToast } = useToast();
  const { horizontalPadding, contentMaxWidth } = useLayout();
  const [generatingCode, setGeneratingCode] = useState(false);
  if (!challenge) return null;

  const disabled = !!resolving;
  const ctx = challenge.context || {};
  const minsLeft = Math.max(0, Math.ceil((new Date(challenge.expiresAt || 0) - Date.now()) / 60000));

  const handleGenerateCode = async () => {
    if (!challenge?.challengeId) return;
    setGeneratingCode(true);
    try {
      const res = await mfaApi.generateCode(challenge.challengeId);
      const code = res.data?.code;
      if (code) {
        await Clipboard.setStringAsync(code);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        showToast('Code copied! Enter on other device');
      }
    } catch (e) {
      Alert.alert('Could not generate code', e?.response?.data?.message || 'Please try again.');
    } finally {
      setGeneratingCode(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={[styles.overlay, { padding: horizontalPadding }]}>
        <View style={[styles.content, { maxWidth: contentMaxWidth, backgroundColor: theme.colors.bgElevated, borderColor: theme.colors.border }]}>
          <View style={[styles.headerBadge, { backgroundColor: theme.colors.surface }]}>
            <MaterialCommunityIcons name="shield-check" size={28} color={theme.colors.accent} />
            <Text style={[styles.badgeText, { color: theme.colors.accent }]}>Login verification</Text>
          </View>

          <Text style={[styles.title, { color: theme.colors.text }]}>Approve sign in?</Text>
          <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
            A new device is trying to sign in to your account. Tap Approve to allow or Deny to block.
          </Text>

          {((ctx.timestamp || challenge.createdAt) || challenge.expiresAt) && (
            <View style={[styles.infoCard, { backgroundColor: theme.colors.bgCard, borderColor: theme.colors.border }]}>
              <View style={styles.infoRow}>
                {(ctx.timestamp || challenge.createdAt) && (
                  <View style={styles.infoItem}>
                    <MaterialCommunityIcons name="clock-outline" size={18} color={theme.colors.textMuted} />
                    <Text style={[styles.infoValue, { color: theme.colors.text }]}>
                      {new Date(ctx.timestamp || challenge.createdAt).toLocaleString()}
                    </Text>
                  </View>
                )}
              </View>
              {challenge.expiresAt && (
                <View style={[styles.expiryBadge, { backgroundColor: theme.colors.surface }]}>
                  <MaterialCommunityIcons name="timer-outline" size={16} color={theme.colors.textMuted} />
                  <Text style={[styles.expiryText, { color: theme.colors.textMuted }]}>
                    Expires in {minsLeft} min
                  </Text>
                </View>
              )}
            </View>
          )}

          <View style={styles.primaryButtons}>
            <TouchableOpacity
              style={[styles.buttonApproveWrapper, disabled && styles.buttonDisabled]}
              onPress={onApprove}
              disabled={disabled}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={[theme.colors.success, theme.colors.successDark || theme.colors.success]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.buttonApprove}
              >
                {resolving === 'approve' ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <MaterialCommunityIcons name="check-circle" size={24} color={theme.colors.bg} style={styles.buttonIcon} />
                    <Text style={styles.buttonApproveText}>Approve</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.buttonDeny, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }, disabled && styles.buttonDisabled]}
              onPress={onDeny}
              disabled={disabled}
              activeOpacity={0.8}
            >
              {resolving === 'deny' ? (
                <ActivityIndicator size="small" color={theme.colors.error} />
              ) : (
                <>
                  <MaterialCommunityIcons name="close-circle-outline" size={24} color={theme.colors.error} style={styles.buttonIcon} />
                  <Text style={[styles.buttonDenyText, { color: theme.colors.error }]}>Deny</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {onDenySuspicious && (
            <TouchableOpacity
              style={[styles.suspiciousLink, disabled && styles.buttonDisabled]}
              onPress={() => onDenySuspicious()}
              disabled={disabled}
            >
              <MaterialCommunityIcons name="alert-octagon-outline" size={18} color={theme.colors.warning} />
              <Text style={[styles.suspiciousText, { color: theme.colors.warning }]}>Mark as suspicious</Text>
            </TouchableOpacity>
          )}

          <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />

          <TouchableOpacity
            style={[styles.generateCodeButton, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
            onPress={handleGenerateCode}
            disabled={disabled || generatingCode}
          >
            {generatingCode ? (
              <ActivityIndicator size="small" color={theme.colors.accent} />
            ) : (
              <>
                <MaterialCommunityIcons name="numeric" size={20} color={theme.colors.accent} style={styles.buttonIcon} />
                <Text style={[styles.generateCodeText, { color: theme.colors.accent }]}>
                  Generate code for other device
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  content: {
    borderRadius: radii.xxl,
    padding: spacing.xl + 4,
    width: '100%',
    borderWidth: 1,
    alignItems: 'center',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.25, shadowRadius: 24 },
      android: { elevation: 12 },
    }),
  },
  headerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radii.md,
    marginBottom: spacing.xl,
  },
  badgeText: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: spacing.xl,
    paddingHorizontal: 8,
  },
  infoCard: {
    width: '100%',
    borderRadius: radii.lg,
    padding: spacing.md,
    marginBottom: spacing.xl,
    borderWidth: 1,
  },
  infoRow: {
    gap: 12,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 15,
    fontWeight: '500',
  },
  expiryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    marginTop: spacing.md,
    paddingVertical: 6,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.sm,
  },
  expiryText: {
    fontSize: 13,
    fontWeight: '500',
  },
  primaryButtons: {
    width: '100%',
    flexDirection: 'column',
    gap: spacing.md,
    marginBottom: 8,
  },
  buttonApproveWrapper: {
    width: '100%',
    borderRadius: radii.lg,
    overflow: 'hidden',
  },
  buttonApprove: {
    flexDirection: 'row',
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonApproveText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
  },
  buttonDeny: {
    flexDirection: 'row',
    paddingVertical: spacing.md,
    borderRadius: radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    width: '100%',
  },
  buttonDenyText: {
    fontSize: 17,
    fontWeight: '700',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonIcon: {
    marginRight: 10,
  },
  suspiciousLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xl,
    paddingVertical: 8,
  },
  suspiciousText: {
    fontSize: 14,
    fontWeight: '600',
  },
  divider: {
    width: '100%',
    height: 1,
    marginBottom: spacing.xl,
  },
  generateCodeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md - 2,
    paddingHorizontal: spacing.xl,
    borderRadius: radii.md,
    borderWidth: 1,
    width: '100%',
  },
  generateCodeText: {
    fontSize: 15,
    fontWeight: '600',
  },
});
