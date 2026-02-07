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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AppLogo } from './AppLogo';
import { useLayout } from '../hooks/useLayout';
import { themeDark } from '../constants/themes';
import { mfaApi } from '../services/api';

const maskIp = (ip) => {
  if (!ip || typeof ip !== 'string') return '—';
  const parts = ip.trim().split('.');
  if (parts.length === 4) return `${parts[0]}.***.***.${parts[3]}`;
  if (ip.includes(':')) return '***';
  return '***';
};

export const MfaModal = ({
  visible,
  challenge,
  onClose,
  onApprove,
  onDeny,
  onDenySuspicious,
  resolving,
}) => {
  const { horizontalPadding, contentMaxWidth } = useLayout();
  const [generatingCode, setGeneratingCode] = useState(false);
  if (!challenge) return null;

  const disabled = !!resolving;
  const ctx = challenge.context || {};

  const handleGenerateCode = async () => {
    if (!challenge?.challengeId) return;
    setGeneratingCode(true);
    try {
      const res = await mfaApi.generateCode(challenge.challengeId);
      const code = res.data?.code;
      if (code) {
        Alert.alert(
          'Login code',
          `Enter this code on the other device:\n\n${code}\n\nValid for 5 minutes.`,
          [{ text: 'OK' }]
        );
      }
    } catch (e) {
      Alert.alert('Error', e?.response?.data?.message || 'Could not generate code');
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
    >
      <View style={[styles.overlay, { padding: horizontalPadding }]}>
        <View style={[styles.content, { maxWidth: contentMaxWidth }]}>
          <View style={styles.iconWrap}>
            <AppLogo size="md" />
          </View>
          <Text style={styles.title}>Login Request</Text>
          <Text style={styles.subtitle}>
            Someone is trying to sign in. Approve to allow or deny to block.
          </Text>

          {(ctx.ip || ctx.timestamp || challenge.createdAt) && (
            <View style={styles.info}>
              {ctx.ip && (
                <>
                  <Text style={styles.infoLabel}>Location</Text>
                  <Text style={styles.infoValue}>{maskIp(ctx.ip)}</Text>
                </>
              )}
              {(ctx.timestamp || challenge.createdAt) && (
                <>
                  <Text style={styles.infoLabel}>Time</Text>
                  <Text style={styles.infoValue}>
                    {new Date(ctx.timestamp || challenge.createdAt).toLocaleString()}
                  </Text>
                </>
              )}
            </View>
          )}

          <TouchableOpacity
            style={[styles.generateCodeButton, { borderColor: themeDark.colors.accent }]}
            onPress={handleGenerateCode}
            disabled={disabled || generatingCode}
          >
            {generatingCode ? (
              <ActivityIndicator size="small" color={themeDark.colors.accent} />
            ) : (
              <>
                <MaterialCommunityIcons name="numeric" size={20} color={themeDark.colors.accent} style={styles.buttonIcon} />
                <Text style={[styles.generateCodeText, { color: themeDark.colors.accent }]}>
                  Generate code for other device
                </Text>
              </>
            )}
          </TouchableOpacity>

          <View style={styles.buttonRow}>
            <View style={styles.denyColumn}>
              <TouchableOpacity
                style={[styles.buttonDeny, disabled && styles.buttonDisabled]}
                onPress={onDeny}
                disabled={disabled}
                activeOpacity={0.8}
              >
                {resolving === 'deny' ? (
                  <ActivityIndicator size="small" color={themeDark.colors.error} />
                ) : (
                  <>
                    <MaterialCommunityIcons name="close-circle" size={22} color={themeDark.colors.error} style={styles.buttonIcon} />
                    <Text style={[styles.buttonText, { color: themeDark.colors.error }]}>Deny</Text>
                  </>
                )}
              </TouchableOpacity>
              {onDenySuspicious && (
                <TouchableOpacity
                  style={[styles.suspiciousLink, disabled && styles.buttonDisabled]}
                  onPress={() => onDenySuspicious()}
                  disabled={disabled}
                >
                  <MaterialCommunityIcons name="alert-octagon" size={16} color={themeDark.colors.warning} />
                  <Text style={styles.suspiciousText}>Mark suspicious</Text>
                </TouchableOpacity>
              )}
            </View>
            <TouchableOpacity
              style={[styles.buttonApproveWrapper, disabled && styles.buttonDisabled]}
              onPress={onApprove}
              disabled={disabled}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={[themeDark.colors.success, themeDark.colors.successDark]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.buttonApprove}
              >
                {resolving === 'approve' ? (
                  <ActivityIndicator size="small" color={themeDark.colors.bg} />
                ) : (
                  <>
                    <MaterialCommunityIcons name="check-circle" size={22} color={themeDark.colors.bg} style={styles.buttonIcon} />
                    <Text style={styles.buttonApproveText}>Approve</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(5, 7, 13, 0.92)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: themeDark.spacing.lg,
  },
  content: {
    backgroundColor: themeDark.colors.bgElevated,
    borderRadius: themeDark.radii.xxl,
    padding: themeDark.spacing.xl,
    width: '100%',
    borderWidth: 1,
    borderColor: themeDark.colors.border,
    alignItems: 'center',
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: themeDark.colors.surface,
    borderWidth: 1,
    borderColor: themeDark.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: themeDark.spacing.lg,
  },
  title: {
    ...themeDark.typography.h1,
    color: themeDark.colors.text,
    marginBottom: themeDark.spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    ...themeDark.typography.bodySm,
    color: themeDark.colors.textMuted,
    textAlign: 'center',
    marginBottom: themeDark.spacing.xl,
  },
  info: {
    backgroundColor: themeDark.colors.bgCard,
    borderRadius: themeDark.radii.md,
    padding: themeDark.spacing.md,
    marginBottom: themeDark.spacing.xl,
    width: '100%',
    borderWidth: 1,
    borderColor: themeDark.colors.border,
    gap: themeDark.spacing.sm,
  },
  denyColumn: {
    flex: 1,
    alignItems: 'center',
    gap: themeDark.spacing.xs,
  },
  suspiciousLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  suspiciousText: {
    fontSize: 12,
    color: themeDark.colors.warning,
    fontWeight: '600',
  },
  infoLabel: {
    ...themeDark.typography.caption,
    color: themeDark.colors.textMuted,
    marginBottom: 4,
  },
  infoValue: {
    ...themeDark.typography.body,
    color: themeDark.colors.text,
    ...themeDark.typography.mono,
  },
  generateCodeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: themeDark.spacing.md,
    paddingHorizontal: themeDark.spacing.lg,
    borderRadius: themeDark.radii.md,
    borderWidth: 2,
    marginBottom: themeDark.spacing.lg,
    width: '100%',
  },
  generateCodeText: {
    fontSize: 15,
    fontWeight: '600',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: themeDark.spacing.md,
    width: '100%',
  },
  buttonDeny: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: themeDark.spacing.lg,
    borderRadius: themeDark.radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: themeDark.colors.surface,
    borderWidth: 2,
    borderColor: themeDark.colors.error,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonIcon: {
    marginRight: themeDark.spacing.sm,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '700',
  },
  buttonApproveWrapper: {
    flex: 1,
    borderRadius: themeDark.radii.md,
    overflow: 'hidden',
  },
  buttonApprove: {
    flexDirection: 'row',
    paddingVertical: themeDark.spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonApproveText: {
    color: themeDark.colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
});
