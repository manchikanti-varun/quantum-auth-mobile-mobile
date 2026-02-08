/**
 * Edit account modal. Folder, notes, icon.
 * @module components/AccountEditModal
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
import { spacing, radii } from '../constants/designTokens';

export const AccountEditModal = ({ visible, account, folders: foldersProp, accounts = [], onClose, onSave }) => {
  const { theme } = useTheme();
  const { folders: foldersFromHook, addFolder } = useFolders();
  const baseFolders = foldersProp?.length > 0 ? foldersProp : foldersFromHook;
  const folders = React.useMemo(() => {
    if (!account?.folder || baseFolders.includes(account.folder)) return baseFolders;
    return [account.folder, ...baseFolders];
  }, [baseFolders, account?.folder]);
  const folderCounts = React.useMemo(() => {
    const counts = {};
    accounts.forEach((acc) => {
      const f = acc.folder || 'Personal';
      counts[f] = (counts[f] || 0) + 1;
    });
    return counts;
  }, [accounts]);
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
      <View style={[styles.overlay, { backgroundColor: theme.colors.overlay }]}>
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
                  color={customIcon === icon ? theme.colors.onAccent : theme.colors.textMuted}
                />
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Folder</Text>
          <View style={[styles.folderRow, { flexWrap: 'wrap' }]}>
            {folders.map((f) => {
              const count = folderCounts[f] ?? 0;
              return (
                <TouchableOpacity
                  key={f}
                  style={[styles.folderChip, folder === f && { backgroundColor: theme.colors.accent }]}
                  onPress={() => setFolder(f)}
                >
                  <MaterialCommunityIcons
                    name="folder-outline"
                    size={16}
                    color={folder === f ? theme.colors.onAccent : theme.colors.textMuted}
                    style={styles.folderChipIcon}
                  />
                  <Text style={[styles.folderChipText, { color: folder === f ? theme.colors.onAccent : theme.colors.textSecondary }]}>{f}</Text>
                  <Text style={[styles.folderChipCount, { color: folder === f ? theme.colors.onAccent : theme.colors.textMuted }]}>{count}</Text>
                </TouchableOpacity>
              );
            })}
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
              <Text style={[styles.addFolderBtnText, { color: theme.colors.onAccent }]}>Add</Text>
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
            <Text style={[styles.saveButtonText, { color: theme.colors.onAccent }]}>Save</Text>
          </TouchableOpacity>
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
    borderTopLeftRadius: radii.xxl,
    borderTopRightRadius: radii.xxl,
    padding: spacing.xl,
    paddingBottom: spacing.xxl + 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  folderRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  addFolderRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  folderInput: {
    flex: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.md,
    borderWidth: 1,
    fontSize: 14,
  },
  addFolderBtn: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radii.md,
    justifyContent: 'center',
  },
  addFolderBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
  iconScroll: {
    marginBottom: spacing.xl,
  },
  iconChip: {
    width: 48,
    height: 48,
    borderRadius: radii.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  folderChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radii.md,
  },
  folderChipIcon: {
    marginRight: 2,
  },
  folderChipText: {
    fontSize: 14,
    fontWeight: '600',
  },
  folderChipCount: {
    fontSize: 12,
  },
  input: {
    borderRadius: radii.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderWidth: 1,
    fontSize: 16,
    minHeight: 80,
    marginBottom: spacing.xl,
  },
  saveButton: {
    paddingVertical: spacing.lg,
    borderRadius: radii.md,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
});
