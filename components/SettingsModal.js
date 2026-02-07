import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../context/ThemeContext';
import { PinPad } from './PinPad';
import { hashPin } from '../utils/pinHash';
import { themeDark } from '../constants/themes';

const THEME_OPTIONS = [
  { id: 'light', icon: 'white-balance-sunny', label: 'Light' },
  { id: 'dark', icon: 'moon-waning-crescent', label: 'Dark' },
  { id: 'system', icon: 'cellphone', label: 'System' },
];

export const SettingsModal = ({ visible, onClose, appLock, onAppLockChange, onExportImport, appLockConfig, onPinSetup, onAutoLockChange, autoLockMinutes }) => {
  const { theme, preference, setThemePreference } = useTheme();
  const [showPinSetup, setShowPinSetup] = useState(false);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onClose} />
        <ScrollView style={[styles.scroll, { backgroundColor: theme.colors.bgElevated }]} contentContainerStyle={styles.content}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: theme.colors.text }]}>Settings</Text>
            <TouchableOpacity onPress={onClose} hitSlop={12}>
              <Text style={[styles.close, { color: theme.colors.textMuted }]}>×</Text>
            </TouchableOpacity>
          </View>

          <Text style={[styles.sectionLabel, { color: theme.colors.textSecondary }]}>Theme</Text>
          <View style={styles.optionsRow}>
            {THEME_OPTIONS.map((opt) => {
              const isSelected = preference === opt.id;
              return (
                <TouchableOpacity
                  key={opt.id}
                  style={[
                    styles.optionCircle,
                    { backgroundColor: isSelected ? theme.colors.accent : theme.colors.surface },
                  ]}
                  onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setThemePreference(opt.id); }}
                  activeOpacity={0.8}
                >
                  <MaterialCommunityIcons
                    name={opt.icon}
                    size={28}
                    color={isSelected ? theme.colors.bg : theme.colors.textSecondary}
                  />
                  <Text style={[styles.optionLabel, { color: isSelected ? theme.colors.bg : theme.colors.textSecondary }]}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {appLock !== undefined && (
            <>
              <Text style={[styles.sectionLabel, { color: theme.colors.textSecondary }]}>App Lock</Text>
              <View style={[styles.optionRow, { backgroundColor: theme.colors.surface }]}>
                <MaterialCommunityIcons name="fingerprint" size={24} color={theme.colors.textSecondary} />
                <Text style={[styles.optionRowText, { color: theme.colors.text }]}>Biometric on launch</Text>
                <TouchableOpacity
                  style={[styles.toggle, appLock && { backgroundColor: theme.colors.accent }]}
                  onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onAppLockChange?.(!appLock); }}
                >
                  <View style={[styles.toggleThumb, appLock && styles.toggleThumbOn]} />
                </TouchableOpacity>
              </View>
              {appLock && (
                <TouchableOpacity
                  style={[styles.optionRow, { backgroundColor: theme.colors.surface }]}
                  onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setShowPinSetup(true); }}
                >
                  <MaterialCommunityIcons name="numeric" size={24} color={theme.colors.accent} />
                  <Text style={[styles.optionRowText, { color: theme.colors.text }]}>
                    {appLockConfig?.pinHash ? 'Change PIN' : 'Set PIN fallback'}
                  </Text>
                  <MaterialCommunityIcons name="chevron-right" size={24} color={theme.colors.textMuted} />
                </TouchableOpacity>
              )}
              {onAutoLockChange != null && (
                <TouchableOpacity
                  style={[styles.optionRow, { backgroundColor: theme.colors.surface }]}
                  onPress={() => onAutoLockChange?.()}
                >
                  <MaterialCommunityIcons name="clock-outline" size={24} color={theme.colors.accent} />
                  <Text style={[styles.optionRowText, { color: theme.colors.text }]}>
                    Auto-lock: {autoLockMinutes === 0 ? 'Never' : `${autoLockMinutes} min`}
                  </Text>
                  <MaterialCommunityIcons name="chevron-right" size={24} color={theme.colors.textMuted} />
                </TouchableOpacity>
              )}
            </>
          )}

          {showPinSetup && (
            <View style={[styles.pinSetupOverlay, { backgroundColor: theme.colors.bgElevated }]}>
              <PinPad
                title="Set PIN (6 digits)"
                mode="setup"
                minLength={6}
                onComplete={async (pin) => {
                  const hashed = await hashPin(pin);
                  if (hashed) onPinSetup?.(hashed);
                  setShowPinSetup(false);
                }}
                onCancel={() => setShowPinSetup(false)}
              />
            </View>
          )}

          <Text style={[styles.sectionLabel, { color: theme.colors.textSecondary }]}>Backup & Recovery</Text>
          <TouchableOpacity
            style={[styles.optionRow, { backgroundColor: theme.colors.surface }]}
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onExportImport?.('export'); }}
          >
            <MaterialCommunityIcons name="export" size={24} color={theme.colors.accent} />
            <Text style={[styles.optionRowText, { color: theme.colors.text }]}>Export accounts</Text>
            <MaterialCommunityIcons name="chevron-right" size={24} color={theme.colors.textMuted} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.optionRow, { backgroundColor: theme.colors.surface }]}
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onExportImport?.('import'); }}
          >
            <MaterialCommunityIcons name="import" size={24} color={theme.colors.accent} />
            <Text style={[styles.optionRowText, { color: theme.colors.text }]}>Import accounts</Text>
            <MaterialCommunityIcons name="chevron-right" size={24} color={theme.colors.textMuted} />
          </TouchableOpacity>

          <Text style={[styles.sectionLabel, { color: theme.colors.textSecondary }]}>Activity</Text>
          <TouchableOpacity
            style={[styles.optionRow, { backgroundColor: theme.colors.surface }]}
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onExportImport?.('loginHistory'); }}
          >
            <MaterialCommunityIcons name="history" size={24} color={theme.colors.accent} />
            <Text style={[styles.optionRowText, { color: theme.colors.text }]}>Login history</Text>
            <MaterialCommunityIcons name="chevron-right" size={24} color={theme.colors.textMuted} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.optionRow, { backgroundColor: theme.colors.surface }]}
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onExportImport?.('mfaHistory'); }}
          >
            <MaterialCommunityIcons name="shield-check" size={24} color={theme.colors.accent} />
            <Text style={[styles.optionRowText, { color: theme.colors.text }]}>MFA history</Text>
            <MaterialCommunityIcons name="chevron-right" size={24} color={theme.colors.textMuted} />
          </TouchableOpacity>
        </ScrollView>
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
  scroll: {
    maxHeight: '90%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  content: {
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
    fontSize: 28,
    fontWeight: '700',
  },
  close: {
    fontSize: 28,
    fontWeight: '300',
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  optionCircle: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    borderRadius: 16,
    minHeight: 90,
  },
  optionLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 8,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    gap: 12,
  },
  optionRowText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
  },
  toggle: {
    width: 48,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(128,128,128,0.3)',
    justifyContent: 'center',
    padding: 2,
  },
  toggleThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#fff',
    alignSelf: 'flex-start',
  },
  toggleThumbOn: {
    alignSelf: 'flex-end',
  },
  pinSetupOverlay: {
    marginTop: themeDark.spacing.xl,
    padding: themeDark.spacing.xl,
    borderRadius: themeDark.radii.lg,
    borderWidth: 1,
    borderColor: themeDark.colors.border,
  },
});
