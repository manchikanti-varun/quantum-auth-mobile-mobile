import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../constants/theme';

export const MfaModal = ({
  visible,
  challenge,
  onClose,
  onApprove,
  onDeny,
}) => {
  if (!challenge) return null;

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.content}>
          <View style={styles.iconWrap}>
            <Text style={styles.icon}>◆</Text>
          </View>
          <Text style={styles.title}>Login Request</Text>
          <Text style={styles.subtitle}>A login attempt was detected</Text>

          {challenge.context?.ip && (
            <View style={styles.info}>
              <Text style={styles.infoLabel}>IP Address</Text>
              <Text style={styles.infoValue}>{challenge.context.ip}</Text>
            </View>
          )}

          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={styles.buttonDeny}
              onPress={onDeny}
              activeOpacity={0.8}
            >
              <Text style={styles.buttonText}>Deny</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.buttonApproveWrapper}
              onPress={onApprove}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={[theme.colors.success, '#059669']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.buttonApprove}
              >
                <Text style={styles.buttonApproveText}>Approve</Text>
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
    padding: theme.spacing.lg,
  },
  content: {
    backgroundColor: theme.colors.bgElevated,
    borderRadius: theme.radii.xl,
    padding: theme.spacing.xl,
    width: '100%',
    maxWidth: 360,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.lg,
  },
  icon: {
    fontSize: 24,
    color: theme.colors.accent,
    fontWeight: '300',
  },
  title: {
    ...theme.typography.h1,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    ...theme.typography.bodySm,
    color: theme.colors.textMuted,
    textAlign: 'center',
    marginBottom: theme.spacing.xl,
  },
  info: {
    backgroundColor: theme.colors.bgCard,
    borderRadius: theme.radii.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.xl,
    width: '100%',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  infoLabel: {
    ...theme.typography.caption,
    color: theme.colors.textMuted,
    marginBottom: 4,
  },
  infoValue: {
    ...theme.typography.body,
    color: theme.colors.text,
    ...theme.typography.mono,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    width: '100%',
  },
  buttonDeny: {
    flex: 1,
    paddingVertical: theme.spacing.lg,
    borderRadius: theme.radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  buttonText: {
    color: theme.colors.textSecondary,
    fontSize: 16,
    fontWeight: '600',
  },
  buttonApproveWrapper: {
    flex: 1,
    borderRadius: theme.radii.md,
    overflow: 'hidden',
  },
  buttonApprove: {
    paddingVertical: theme.spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonApproveText: {
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
});
