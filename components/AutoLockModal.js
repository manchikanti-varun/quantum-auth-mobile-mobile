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

export const AutoLockModal = ({ visible, currentMinutes, onSelect, onClose }) => {
  const { theme } = useTheme();

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onClose} />
        <View style={[styles.content, { backgroundColor: theme.colors.bgElevated }]}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: theme.colors.text }]}>Auto-lock</Text>
            <TouchableOpacity onPress={onClose} hitSlop={12}>
              <Text style={[styles.close, { color: theme.colors.textMuted }]}>×</Text>
            </TouchableOpacity>
          </View>
          {AUTO_LOCK_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt.value}
              style={[styles.option, { backgroundColor: theme.colors.surface }]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onSelect?.(opt.value);
                onClose?.();
              }}
            >
              <Text style={[styles.optionText, { color: theme.colors.text }]}>{opt.label}</Text>
              {currentMinutes === opt.value && (
                <MaterialCommunityIcons name="check" size={24} color={theme.colors.accent} />
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
  title: {
    fontSize: 20,
    fontWeight: '700',
  },
  close: {
    fontSize: 28,
    fontWeight: '300',
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  optionText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
