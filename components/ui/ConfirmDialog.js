/**
 * Themed confirm dialog. Replaces native Alert for confirm/cancel flows.
 * @module components/ui/ConfirmDialog
 */
import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { spacing, radii } from '../../constants/designTokens';

export const ConfirmDialog = ({
  visible,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  destructive = false,
  onConfirm,
  onCancel,
}) => {
  const { theme } = useTheme();
  const accentColor = destructive ? theme.colors.error : theme.colors.accent;
  const confirmTextColor = destructive ? '#fff' : theme.colors.onAccent;

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onCancel}>
      <View style={[styles.overlay, { backgroundColor: theme.colors.overlay }]}>
        <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onCancel} />
        <View style={[styles.dialog, { backgroundColor: theme.colors.bgCard, borderColor: theme.colors.border }]}>
          <Text style={[styles.title, { color: theme.colors.text }]}>{title}</Text>
          <Text style={[styles.message, { color: theme.colors.textSecondary }]}>{message}</Text>
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.btn, styles.cancelBtn, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
              onPress={onCancel}
              activeOpacity={0.8}
            >
              <Text style={[styles.cancelText, { color: theme.colors.textSecondary }]}>{cancelText}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.btn, styles.confirmBtn, { backgroundColor: accentColor }]}
              onPress={onConfirm}
              activeOpacity={0.8}
            >
              <Text style={[styles.confirmText, { color: confirmTextColor }]}>{confirmText}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  dialog: {
    width: '100%',
    maxWidth: 320,
    borderRadius: radii.lg,
    padding: spacing.xl,
    borderWidth: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: spacing.sm,
  },
  message: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: spacing.lg,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.md,
    justifyContent: 'flex-end',
  },
  btn: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.md,
    minWidth: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtn: {
    borderWidth: 1,
  },
  confirmBtn: {},
  cancelText: {
    fontSize: 15,
    fontWeight: '600',
  },
  confirmText: {
    fontSize: 15,
    fontWeight: '600',
  },
});
