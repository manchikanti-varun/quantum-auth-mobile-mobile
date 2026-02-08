/**
 * AutoLockModal – Pick auto-lock timeout (never, 1/5/15/30 min).
 */
import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../context/ThemeContext';
import { AUTO_LOCK_OPTIONS } from '../constants/config';
import { themeDark } from '../constants/themes';

export const AutoLockModal = ({ visible, currentMinutes, onSelect, onClose }) => {
  const { theme } = useTheme();

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onClose} />
        <View style={[styles.content, { backgroundColor: theme.colors.bgElevated }]}>
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <MaterialCommunityIcons name="clock-outline" size={24} color={theme.colors.accent} />
              <View>
                <Text style={[styles.title, { color: theme.colors.text }]}>Auto-lock</Text>
                <Text style={[styles.headerSubtitle, { color: theme.colors.textMuted }]}>Lock app after inactivity</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={12} style={[styles.closeButton, { backgroundColor: theme.colors.surface }]}>
              <MaterialCommunityIcons name="close" size={22} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          </View>
          <Text style={[styles.pickerHint, { color: theme.colors.textMuted }]}>Choose when to lock the app</Text>
          {AUTO_LOCK_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt.value}
              style={[
                styles.option,
                { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
                currentMinutes === opt.value && { borderColor: theme.colors.accent, borderWidth: 2 },
              ]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onSelect?.(opt.value);
                onClose?.();
              }}
            >
              <Text style={[styles.optionText, { color: theme.colors.text }]}>{opt.label}</Text>
              {currentMinutes === opt.value && (
                <MaterialCommunityIcons name="check-circle" size={24} color={theme.colors.accent} />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  content: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: themeDark.spacing.md,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
  },
  headerSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  closeButton: {
    padding: themeDark.spacing.sm,
    borderRadius: themeDark.radii.sm,
  },
  pickerHint: {
    fontSize: 14,
    marginBottom: themeDark.spacing.md,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
  },
  optionText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
