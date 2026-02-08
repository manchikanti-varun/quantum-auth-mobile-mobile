/**
 * Themed alert dialog (single OK button). Replaces native Alert for info/error alerts.
 * @module components/ui/AlertDialog
 */
import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { spacing, radii } from '../../constants/designTokens';

export const AlertDialog = ({ visible, title, message, onOk }) => {
  const { theme } = useTheme();

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onOk}>
      <View style={[styles.overlay, { backgroundColor: theme.colors.overlay }]}>
        <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onOk} />
        <View style={[styles.dialog, { backgroundColor: theme.colors.bgCard, borderColor: theme.colors.border }]}>
          <Text style={[styles.title, { color: theme.colors.text }]}>{title}</Text>
          <Text style={[styles.message, { color: theme.colors.textSecondary }]}>{message}</Text>
          <TouchableOpacity
            style={[styles.okBtn, { backgroundColor: theme.colors.accent }]}
            onPress={onOk}
            activeOpacity={0.8}
          >
            <Text style={[styles.okText, { color: theme.colors.onAccent }]}>OK</Text>
          </TouchableOpacity>
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
  okBtn: {
    paddingVertical: spacing.md,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  okText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
