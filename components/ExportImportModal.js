/**
 * Export accounts as JSON or import from pasted JSON.
 * Encrypted export saves to device storage. Supports import from stored backups.
 * @module components/ExportImportModal
 */
import React, { useState, useEffect } from 'react';
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
  ActivityIndicator,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { spacing, radii } from '../constants/designTokens';
import { encryptBackup, decryptBackup, isEncryptedBackup } from '../utils/backupEncryption';
import { saveEncryptedBackup, listSavedBackups, loadEncryptedBackup } from '../services/backupStorage';

export const ExportImportModal = ({ visible, mode, onClose, onExport, onImport }) => {
  const { theme } = useTheme();
  const [importData, setImportData] = useState('');
  const [exportPassword, setExportPassword] = useState('');
  const [exportPasswordConfirm, setExportPasswordConfirm] = useState('');
  const [importPassword, setImportPassword] = useState('');
  const [savedBackups, setSavedBackups] = useState([]);
  const [importSource, setImportSource] = useState('paste'); // 'paste' | 'stored'
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!visible) {
      setImportData('');
      setExportPassword('');
      setExportPasswordConfirm('');
      setImportPassword('');
      setImportSource('paste');
    }
  }, [visible]);

  useEffect(() => {
    if (visible && mode === 'import') {
      listSavedBackups().then(setSavedBackups);
    }
  }, [visible, mode]);

  const handleSaveToDevice = async () => {
    const accountsJson = await onExport?.();
    if (!accountsJson) return;
    if (exportPassword.length < 6) {
      Alert.alert('Password required', 'Use at least 6 characters for the backup password.');
      return;
    }
    if (exportPassword !== exportPasswordConfirm) {
      Alert.alert('Passwords do not match', 'Please confirm the password.');
      return;
    }
    setSaving(true);
    try {
      const encrypted = encryptBackup(accountsJson, exportPassword);
      const { filename } = await saveEncryptedBackup(encrypted);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Saved', `Encrypted backup saved as ${filename}`, [{ text: 'OK', onPress: onClose }]);
    } catch (e) {
      Alert.alert('Error', e?.message || 'Failed to save backup');
    } finally {
      setSaving(false);
    }
  };

  const handleExportShare = async () => {
    const accountsJson = await onExport?.();
    if (!accountsJson) return;
    let data = accountsJson;
    if (exportPassword.length >= 6 && exportPassword === exportPasswordConfirm) {
      try {
        data = encryptBackup(accountsJson, exportPassword);
      } catch (e) {
        Alert.alert('Error', e?.message || 'Encryption failed');
        return;
      }
    }
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

  const importFromData = async (trimmed) => {
    let parsed;
    if (isEncryptedBackup(trimmed)) {
      if (!importPassword) {
        Alert.alert('Password required', 'This backup is encrypted. Enter the password used when exporting.');
        return;
      }
      const decrypted = decryptBackup(trimmed, importPassword);
      parsed = JSON.parse(decrypted);
    } else {
      parsed = JSON.parse(trimmed);
    }
    if (!Array.isArray(parsed)) throw new Error('Invalid format');
    const valid = parsed.every((a) => a.issuer && a.label && a.secret);
    if (!valid) throw new Error('Invalid account data');
    await onImport?.(parsed);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert('Imported', `${parsed.length} accounts imported.`);
    onClose?.();
  };

  const handleImport = async () => {
    const trimmed = importData.trim();
    if (!trimmed) return;
    try {
      await importFromData(trimmed);
    } catch (e) {
      if (e?.message?.includes('Wrong password')) {
        Alert.alert('Wrong password', 'The password is incorrect. Please try again.');
      } else {
        Alert.alert('Invalid data', 'Paste a valid QSafe backup (JSON or encrypted backup).');
      }
    }
  };

  const handleLoadFromStored = async (backupPath) => {
    if (!importPassword) {
      Alert.alert('Password required', 'Enter the password used when saving this backup.');
      return;
    }
    try {
      const encrypted = await loadEncryptedBackup(backupPath);
      await importFromData(encrypted);
    } catch (e) {
      if (e?.message?.includes('Wrong password')) {
        Alert.alert('Wrong password', 'The password is incorrect. Please try again.');
      } else {
        Alert.alert('Error', e?.message || 'Failed to load backup');
      }
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
                  <MaterialCommunityIcons name="lock" size={20} color={theme.colors.accent} />
                  <Text style={[styles.hint, { color: theme.colors.textSecondary }]}>
                    Encrypt your backup and save it to this device. You can restore it later from Import.
                  </Text>
                </View>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, color: theme.colors.text }]}
                  placeholder="Password (min 6 chars)"
                  placeholderTextColor={theme.colors.textMuted}
                  value={exportPassword}
                  onChangeText={setExportPassword}
                  secureTextEntry
                />
                <TextInput
                  style={[styles.input, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, color: theme.colors.text, marginTop: spacing.sm }]}
                  placeholder="Confirm password"
                  placeholderTextColor={theme.colors.textMuted}
                  value={exportPasswordConfirm}
                  onChangeText={setExportPasswordConfirm}
                  secureTextEntry
                />
                <TouchableOpacity
                  style={[styles.primaryButton, { backgroundColor: theme.colors.accent }]}
                  onPress={handleSaveToDevice}
                  disabled={saving}
                >
                  {saving ? (
                    <ActivityIndicator color={theme.colors.onAccent} />
                  ) : (
                    <Text style={[styles.primaryButtonText, { color: theme.colors.onAccent }]}>Encrypt & Save to device</Text>
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.secondaryButton, { borderColor: theme.colors.border }]}
                  onPress={handleExportShare}
                >
                  <Text style={[styles.secondaryButtonText, { color: theme.colors.text }]}>Export & Share</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <View style={[styles.hintRow, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
                  <MaterialCommunityIcons name="information-outline" size={20} color={theme.colors.accent} />
                  <Text style={[styles.hint, { color: theme.colors.textSecondary }]}>
                    Load from a saved backup on this device, or paste your backup below.
                  </Text>
                </View>
                {savedBackups.length > 0 && (
                  <>
                    <Text style={[styles.sectionLabel, { color: theme.colors.textMuted }]}>Saved backups on device</Text>
                    <Text style={[styles.caption, { color: theme.colors.textMuted }]}>Enter password, then tap a backup to restore.</Text>
                    <TextInput
                      style={[styles.input, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, color: theme.colors.text }]}
                      placeholder="Backup password"
                      placeholderTextColor={theme.colors.textMuted}
                      value={importPassword}
                      onChangeText={setImportPassword}
                      secureTextEntry
                    />
                    {savedBackups.map((b) => (
                      <TouchableOpacity
                        key={b.path}
                        style={[styles.backupRow, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
                        onPress={() => handleLoadFromStored(b.path)}
                      >
                        <MaterialCommunityIcons name="file-lock" size={22} color={theme.colors.accent} />
                        <Text style={[styles.backupFilename, { color: theme.colors.text }]} numberOfLines={1}>{b.filename}</Text>
                        <MaterialCommunityIcons name="chevron-right" size={20} color={theme.colors.textMuted} />
                      </TouchableOpacity>
                    ))}
                    <Text style={[styles.sectionLabel, { color: theme.colors.textMuted }]}>Or paste backup</Text>
                  </>
                )}
                {savedBackups.length === 0 && importData.trim() && isEncryptedBackup(importData.trim()) && (
                  <TextInput
                    style={[styles.input, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, color: theme.colors.text, marginBottom: spacing.sm }]}
                    placeholder="Enter backup password"
                    placeholderTextColor={theme.colors.textMuted}
                    value={importPassword}
                    onChangeText={setImportPassword}
                    secureTextEntry
                  />
                )}
                <TextInput
                  style={[styles.input, styles.importTextarea, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, color: theme.colors.text }]}
                  placeholder='Paste your backup JSON or encrypted data here'
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
                  <Text style={[styles.primaryButtonText, { color: theme.colors.onAccent }]}>Import from paste</Text>
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
  encryptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    marginBottom: spacing.md,
    gap: spacing.md,
  },
  encryptionLabel: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
  },
  input: {
    borderRadius: radii.md,
    padding: spacing.md,
    borderWidth: 1,
    fontSize: 14,
    minHeight: 48,
    marginBottom: spacing.md,
  },
  importTextarea: {
    fontFamily: 'monospace',
    minHeight: 120,
  },
  primaryButton: {
    paddingVertical: spacing.lg,
    borderRadius: radii.md,
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryButton: {
    paddingVertical: spacing.lg,
    borderRadius: radii.md,
    alignItems: 'center',
    borderWidth: 1,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  caption: {
    fontSize: 13,
    marginBottom: spacing.sm,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
  },
  backupRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    marginBottom: spacing.sm,
    gap: spacing.md,
  },
  backupFilename: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
  },
});
