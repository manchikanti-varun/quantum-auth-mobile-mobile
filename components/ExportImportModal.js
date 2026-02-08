/**
 * Export accounts as JSON or import from pasted JSON.
 * @module components/ExportImportModal
 */
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
import { spacing, radii } from '../constants/designTokens';

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
      <View style={[styles.overlay, { backgroundColor: theme.colors.overlay }]}>
        <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onClose} />
        <View style={[styles.content, { backgroundColor: theme.colors.bgElevated }]}>
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={[styles.headerIconWrap, { backgroundColor: theme.colors.surface }]}>
                <MaterialCommunityIcons
                  name={mode === 'export' ? 'export' : 'import'}
                  size={24}
                  color={theme.colors.accent}
                />
              </View>
              <View>
                <Text style={[styles.title, { color: theme.colors.text }]}>
                  {mode === 'export' ? 'Export accounts' : 'Import accounts'}
                </Text>
                <Text style={[styles.headerSubtitle, { color: theme.colors.textMuted }]}>
                  {mode === 'export' ? 'Share or save your backup' : 'Restore from a backup file'}
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={12} style={[styles.closeButton, { backgroundColor: theme.colors.surface }]}>
              <MaterialCommunityIcons name="close" size={22} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            {mode === 'export' ? (
              <>
                <View style={[styles.hintRow, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
                  <MaterialCommunityIcons name="information-outline" size={20} color={theme.colors.accent} />
                  <Text style={[styles.hint, { color: theme.colors.textSecondary }]}>
                    Export creates a backup of all accounts. Share or save it somewhere safe. Do not share with others.
                  </Text>
                </View>
                <TouchableOpacity
                  style={[styles.primaryButton, { backgroundColor: theme.colors.accent }]}
                  onPress={handleExport}
                >
                  <Text style={[styles.primaryButtonText, { color: theme.colors.onAccent }]}>Export & Share</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <View style={[styles.hintRow, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
                  <MaterialCommunityIcons name="information-outline" size={20} color={theme.colors.accent} />
                  <Text style={[styles.hint, { color: theme.colors.textSecondary }]}>
                    Paste your QSafe backup (JSON) below.
                  </Text>
                </View>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, color: theme.colors.text }]}
                  placeholder='Paste your backup JSON here'
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
                  <Text style={[styles.primaryButtonText, { color: theme.colors.onAccent }]}>Import</Text>
                </TouchableOpacity>
              </>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  content: {
    maxHeight: '70%',
    borderTopLeftRadius: radii.xxl,
    borderTopRightRadius: radii.xxl,
    padding: spacing.xl,
    paddingBottom: spacing.xxl + 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  headerIconWrap: {
    width: 44,
    height: 44,
    borderRadius: radii.full,
    alignItems: 'center',
    justifyContent: 'center',
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
    width: 40,
    height: 40,
    borderRadius: radii.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    flexGrow: 1,
  },
  scrollContent: {
    paddingBottom: spacing.xl,
  },
  hintRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: spacing.md,
    borderRadius: radii.md,
    marginBottom: spacing.lg,
    borderWidth: 1,
    gap: spacing.md,
  },
  hint: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  input: {
    borderRadius: radii.md,
    padding: spacing.md,
    borderWidth: 1,
    fontSize: 14,
    fontFamily: 'monospace',
    minHeight: 120,
    marginBottom: spacing.xl,
  },
  primaryButton: {
    paddingVertical: spacing.lg,
    borderRadius: radii.md,
    alignItems: 'center',
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
});
