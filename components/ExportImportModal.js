import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Share,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { themeDark } from '../constants/themes';

export const ExportImportModal = ({ visible, mode, onClose, onExport, onImport }) => {
  const { theme } = useTheme();
  const [importData, setImportData] = useState('');

  const handleExport = async () => {
    const data = await onExport?.();
    if (!data) return;
    try {
      await Share.share({
        message: data,
        title: 'QSafe Backup',
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e) {
      await Clipboard.setStringAsync(data);
      Alert.alert('Copied', 'Backup copied to clipboard. Save it somewhere safe.');
    }
    onClose?.();
  };

  const handleImport = async () => {
    try {
      const parsed = JSON.parse(importData.trim());
      if (!Array.isArray(parsed)) throw new Error('Invalid format');
      const valid = parsed.every((a) => a.issuer && a.label && a.secret);
      if (!valid) throw new Error('Invalid account data');
      await onImport?.(parsed);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Imported', `${parsed.length} accounts imported.`);
      onClose?.();
    } catch (e) {
      Alert.alert('Invalid data', 'Paste a valid QSafe backup (JSON array of accounts).');
    }
  };

  if (!visible) return null;

  return (
    <Modal visible animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onClose} />
        <View style={[styles.content, { backgroundColor: theme.colors.bgElevated }]}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: theme.colors.text }]}>
              {mode === 'export' ? 'Export accounts' : 'Import accounts'}
            </Text>
            <TouchableOpacity onPress={onClose} hitSlop={12}>
              <MaterialCommunityIcons name="close" size={24} color={theme.colors.textMuted} />
            </TouchableOpacity>
          </View>

          {mode === 'export' ? (
            <>
              <Text style={[styles.hint, { color: theme.colors.textSecondary }]}>
                Export creates a backup of all accounts. Share or save it somewhere safe. Do not share with others.
              </Text>
              <TouchableOpacity
                style={[styles.primaryButton, { backgroundColor: theme.colors.accent }]}
                onPress={handleExport}
              >
                <Text style={[styles.primaryButtonText, { color: theme.colors.bg }]}>Export & Share</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={[styles.hint, { color: theme.colors.textSecondary }]}>
                Paste your QSafe backup (JSON) below.
              </Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, color: theme.colors.text }]}
                placeholder='[{"issuer":"Google","label":"...","secret":"..."}]'
                placeholderTextColor={theme.colors.textMuted}
                value={importData}
                onChangeText={setImportData}
                multiline
                numberOfLines={8}
              />
              <TouchableOpacity
                style={[styles.primaryButton, { backgroundColor: theme.colors.accent }]}
                onPress={handleImport}
                disabled={!importData.trim()}
              >
                <Text style={[styles.primaryButtonText, { color: theme.colors.bg }]}>Import</Text>
              </TouchableOpacity>
            </>
          )}
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
    marginBottom: themeDark.spacing.lg,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
  },
  hint: {
    fontSize: 14,
    marginBottom: themeDark.spacing.xl,
    lineHeight: 20,
  },
  input: {
    borderRadius: themeDark.radii.md,
    padding: themeDark.spacing.md,
    borderWidth: 1,
    fontSize: 14,
    fontFamily: 'monospace',
    minHeight: 120,
    marginBottom: themeDark.spacing.xl,
  },
  primaryButton: {
    paddingVertical: themeDark.spacing.lg,
    borderRadius: themeDark.radii.md,
    alignItems: 'center',
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
});
