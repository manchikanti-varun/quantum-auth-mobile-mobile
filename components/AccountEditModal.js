/**
 * AccountEditModal – Edit folder, notes, icon for an account.
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
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useFolders } from '../hooks/useFolders';
import { ICON_PICKER_OPTIONS } from '../utils/issuerIcons';
import { themeDark } from '../constants/themes';

export const AccountEditModal = ({ visible, account, folders: foldersProp, onClose, onSave }) => {
  const { theme } = useTheme();
  const { folders: foldersFromHook, addFolder } = useFolders();
  const baseFolders = foldersProp?.length > 0 ? foldersProp : foldersFromHook;
  const folders = React.useMemo(() => {
    if (!account?.folder || baseFolders.includes(account.folder)) return baseFolders;
    return [account.folder, ...baseFolders];
  }, [baseFolders, account?.folder]);
  const [notes, setNotes] = useState('');
  const [folder, setFolder] = useState('Personal');
  const [newFolderName, setNewFolderName] = useState('');
  const [customIcon, setCustomIcon] = useState(null);

  useEffect(() => {
    if (account) {
      setNotes(account.notes || '');
      setFolder(account.folder || 'Personal');
      setCustomIcon(account.customIcon || null);
    }
  }, [account]);

  if (!account) return null;

  const handleSave = () => {
    onSave?.(account.id, { notes, folder, customIcon: customIcon || undefined });
    onClose?.();
  };

  const handleAddFolder = () => {
    const name = newFolderName.trim();
    if (name && !folders.includes(name)) {
      addFolder(name);
      setFolder(name);
      setNewFolderName('');
    }
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

          <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Icon</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.iconScroll}>
            {ICON_PICKER_OPTIONS.map((icon) => (
              <TouchableOpacity
                key={icon}
                style={[styles.iconChip, customIcon === icon && { backgroundColor: theme.colors.accent }]}
                onPress={() => setCustomIcon(customIcon === icon ? null : icon)}
              >
                <MaterialCommunityIcons
                  name={icon}
                  size={24}
                  color={customIcon === icon ? theme.colors.bg : theme.colors.textMuted}
                />
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Folder</Text>
          <View style={[styles.folderRow, { flexWrap: 'wrap' }]}>
            {folders.map((f) => (
              <TouchableOpacity
                key={f}
                style={[styles.folderChip, folder === f && { backgroundColor: theme.colors.accent }]}
                onPress={() => setFolder(f)}
              >
                <Text style={[styles.folderChipText, { color: folder === f ? theme.colors.bg : theme.colors.textSecondary }]}>{f}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.addFolderRow}>
            <TextInput
              style={[styles.folderInput, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, color: theme.colors.text }]}
              placeholder="New folder name..."
              placeholderTextColor={theme.colors.textMuted}
              value={newFolderName}
              onChangeText={setNewFolderName}
            />
            <TouchableOpacity
              style={[styles.addFolderBtn, { backgroundColor: theme.colors.accent }]}
              onPress={handleAddFolder}
            >
              <Text style={styles.addFolderBtnText}>Add</Text>
            </TouchableOpacity>
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
    marginBottom: themeDark.spacing.sm,
  },
  addFolderRow: {
    flexDirection: 'row',
    gap: themeDark.spacing.sm,
    marginBottom: themeDark.spacing.xl,
  },
  folderInput: {
    flex: 1,
    paddingHorizontal: themeDark.spacing.md,
    paddingVertical: themeDark.spacing.sm,
    borderRadius: themeDark.radii.md,
    borderWidth: 1,
    fontSize: 14,
  },
  addFolderBtn: {
    paddingHorizontal: themeDark.spacing.lg,
    paddingVertical: themeDark.spacing.sm,
    borderRadius: themeDark.radii.md,
    justifyContent: 'center',
  },
  addFolderBtnText: {
    color: themeDark.colors.bg,
    fontSize: 14,
    fontWeight: '600',
  },
  iconScroll: {
    marginBottom: themeDark.spacing.xl,
  },
  iconChip: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: themeDark.spacing.sm,
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
