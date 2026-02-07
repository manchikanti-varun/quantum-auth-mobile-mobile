import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { DEFAULT_FOLDERS } from '../constants/config';
import { themeDark } from '../constants/themes';

export const AccountEditModal = ({ visible, account, onClose, onSave }) => {
  const { theme } = useTheme();
  const [notes, setNotes] = useState('');
  const [folder, setFolder] = useState('Personal');

  useEffect(() => {
    if (account) {
      setNotes(account.notes || '');
      setFolder(account.folder || 'Personal');
    }
  }, [account]);

  if (!account) return null;

  const handleSave = () => {
    onSave?.(account.id, { notes, folder });
    onClose?.();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onClose} />
        <View style={[styles.content, { backgroundColor: theme.colors.bgElevated }]}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: theme.colors.text }]}>Edit {account.issuer}</Text>
            <TouchableOpacity onPress={onClose} hitSlop={12}>
              <MaterialCommunityIcons name="close" size={24} color={theme.colors.textMuted} />
            </TouchableOpacity>
          </View>

          <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Folder</Text>
          <View style={styles.folderRow}>
            {DEFAULT_FOLDERS.map((f) => (
              <TouchableOpacity
                key={f}
                style={[styles.folderChip, folder === f && { backgroundColor: theme.colors.accent }]}
                onPress={() => setFolder(f)}
              >
                <Text style={[styles.folderChipText, { color: folder === f ? theme.colors.bg : theme.colors.textSecondary }]}>{f}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Notes</Text>
          <TextInput
            style={[styles.input, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, color: theme.colors.text }]}
            placeholder="Optional hint or purpose..."
            placeholderTextColor={theme.colors.textMuted}
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={3}
          />

          <TouchableOpacity
            style={[styles.saveButton, { backgroundColor: theme.colors.accent }]}
            onPress={handleSave}
          >
            <Text style={[styles.saveButtonText, { color: theme.colors.bg }]}>Save</Text>
          </TouchableOpacity>
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
    marginBottom: themeDark.spacing.xl,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: themeDark.spacing.sm,
  },
  folderRow: {
    flexDirection: 'row',
    gap: themeDark.spacing.sm,
    marginBottom: themeDark.spacing.xl,
  },
  folderChip: {
    paddingVertical: themeDark.spacing.sm,
    paddingHorizontal: themeDark.spacing.md,
    borderRadius: themeDark.radii.md,
  },
  folderChipText: {
    fontSize: 14,
    fontWeight: '600',
  },
  input: {
    borderRadius: themeDark.radii.md,
    paddingHorizontal: themeDark.spacing.lg,
    paddingVertical: themeDark.spacing.md,
    borderWidth: 1,
    fontSize: 16,
    minHeight: 80,
    marginBottom: themeDark.spacing.xl,
  },
  saveButton: {
    paddingVertical: themeDark.spacing.lg,
    borderRadius: themeDark.radii.md,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
});
