/**
 * Folders management modal. Add, rename, remove; updates accounts on rename/remove.
 * @module components/FoldersModal
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
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../context/ThemeContext';
import { spacing, radii } from '../constants/designTokens';

export const FoldersModal = ({
  visible,
  onClose,
  folders,
  accounts,
  addFolder,
  renameFolder,
  removeFolder,
  updateAccount,
  refreshFolders,
}) => {
  const { theme } = useTheme();
  const [newFolderName, setNewFolderName] = useState('');
  const [editingFolder, setEditingFolder] = useState(null);
  const [editName, setEditName] = useState('');

  useEffect(() => {
    if (visible) refreshFolders?.();
  }, [visible]);

  const getAccountCount = (folderName) =>
    accounts.filter((a) => (a.folder || 'Personal') === folderName).length;

  const handleAddFolder = () => {
    const name = newFolderName.trim();
    if (!name) return;
    if (folders.includes(name)) {
      Alert.alert('Exists', `Folder "${name}" already exists.`);
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    addFolder(name);
    setNewFolderName('');
  };

  const handleStartRename = (folder) => {
    setEditingFolder(folder);
    setEditName(folder);
  };

  const handleSaveRename = () => {
    const name = editName.trim();
    if (!name || name === editingFolder) {
      setEditingFolder(null);
      return;
    }
    if (folders.includes(name) && name !== editingFolder) {
      Alert.alert('Exists', `Folder "${name}" already exists.`);
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    renameFolder(editingFolder, name);
    accounts.forEach((acc) => {
      if ((acc.folder || 'Personal') === editingFolder) {
        updateAccount?.(acc.id, { folder: name });
      }
    });
    setEditingFolder(null);
    setEditName('');
  };

  const handleRemoveFolder = (folderName) => {
    const count = getAccountCount(folderName);
    if (count === 0) {
      removeFolder(folderName);
      refreshFolders?.();
      return;
    }
    const otherFolders = folders.filter((f) => f !== folderName);
    if (otherFolders.length === 0) {
      Alert.alert('Cannot remove', 'Move accounts to another folder first.');
      return;
    }
    const moveTo = otherFolders[0];
    Alert.alert(
      `Remove "${folderName}"?`,
      `${count} account(s) will be moved to ${moveTo}. Continue?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            accounts.forEach((acc) => {
              if ((acc.folder || 'Personal') === folderName) {
                updateAccount?.(acc.id, { folder: moveTo });
              }
            });
            removeFolder(folderName);
            refreshFolders?.();
          },
        },
      ]
    );
  };

  if (!visible) return null;

  return (
    <Modal visible animationType="slide" transparent onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={[styles.overlay, { backgroundColor: theme.colors.overlay }]}>
          <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onClose} />
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.keyboardAvoid}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
          >
            <View style={[styles.content, { backgroundColor: theme.colors.bgElevated }]}>
              <View style={styles.header}>
                <View style={styles.headerLeft}>
                  <View style={[styles.headerIconWrap, { backgroundColor: theme.colors.surface }]}>
                    <MaterialCommunityIcons name="folder-multiple" size={24} color={theme.colors.accent} />
                  </View>
                  <View>
                    <Text style={[styles.title, { color: theme.colors.text }]}>Manage folders</Text>
                    <Text style={[styles.subtitle, { color: theme.colors.textMuted }]}>
                      Organize your accounts
                    </Text>
                  </View>
                </View>
                <TouchableOpacity onPress={onClose} hitSlop={12} style={[styles.closeBtn, { backgroundColor: theme.colors.surface }]}>
                  <MaterialCommunityIcons name="close" size={22} color={theme.colors.textSecondary} />
                </TouchableOpacity>
              </View>

              <View style={[styles.addSection, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
                <Text style={[styles.sectionLabel, { color: theme.colors.textSecondary }]}>Add folder</Text>
                <View style={styles.addRow}>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.colors.bgElevated, borderColor: theme.colors.border, color: theme.colors.text }]}
                  placeholder="Folder name..."
                  placeholderTextColor={theme.colors.textMuted}
                  value={newFolderName}
                  onChangeText={setNewFolderName}
                  onSubmitEditing={handleAddFolder}
                />
                <TouchableOpacity
                  style={[styles.addBtn, { backgroundColor: theme.colors.accent }]}
                  onPress={handleAddFolder}
                >
                  <Text style={[styles.addBtnText, { color: theme.colors.onAccent }]}>Add</Text>
                </TouchableOpacity>
                </View>
              </View>

              <Text style={[styles.sectionLabel, styles.listLabel, { color: theme.colors.textSecondary }]}>
                All folders
              </Text>
              <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
            {folders.map((f) => (
              <View
                key={f}
                style={[styles.folderRow, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
              >
                {editingFolder === f ? (
                  <View style={styles.editRow}>
                    <TextInput
                      style={[styles.editInput, { backgroundColor: theme.colors.bgElevated, borderColor: theme.colors.border, color: theme.colors.text }]}
                      value={editName}
                      onChangeText={setEditName}
                      autoFocus
                    />
                    <TouchableOpacity style={[styles.iconBtn, { backgroundColor: theme.colors.success }]} onPress={handleSaveRename}>
                      <MaterialCommunityIcons name="check" size={20} color={theme.colors.text} />
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.iconBtn, { backgroundColor: theme.colors.surface }]} onPress={() => { setEditingFolder(null); setEditName(''); }}>
                      <MaterialCommunityIcons name="close" size={20} color={theme.colors.textMuted} />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <>
                    <View style={styles.folderInfo}>
                      <MaterialCommunityIcons
                        name="folder-outline"
                        size={22}
                        color={theme.colors.accent}
                      />
                      <Text style={[styles.folderName, { color: theme.colors.text }]}>{f}</Text>
                      <View style={[styles.countBadge, { backgroundColor: theme.colors.bgCard }]}>
                        <Text style={[styles.countText, { color: theme.colors.textMuted }]}>
                          {getAccountCount(f)}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.rowActions}>
                        <TouchableOpacity onPress={() => handleStartRename(f)} style={styles.iconBtn} hitSlop={8}>
                          <MaterialCommunityIcons name="pencil" size={20} color={theme.colors.textMuted} />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => handleRemoveFolder(f)} style={styles.iconBtn} hitSlop={8}>
                          <MaterialCommunityIcons name="delete-outline" size={22} color={theme.colors.error} />
                        </TouchableOpacity>
                      </View>
                  </>
                )}
              </View>
            ))}
          </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-start',
  },
  keyboardAvoid: {
    width: '100%',
  },
  content: {
    borderBottomLeftRadius: radii.xxl,
    borderBottomRightRadius: radii.xxl,
    padding: spacing.xl,
    paddingBottom: spacing.xxl + 8,
    maxHeight: '85%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  headerIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addSection: {
    padding: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    marginBottom: spacing.lg,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  listLabel: {
    marginBottom: spacing.sm,
  },
  addRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  input: {
    flex: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.md,
    borderWidth: 1,
    fontSize: 16,
  },
  addBtn: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radii.md,
    justifyContent: 'center',
  },
  addBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
  list: {
    maxHeight: 320,
  },
  folderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    marginBottom: spacing.sm,
  },
  folderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  folderName: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  countBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radii.sm,
  },
  countText: {
    fontSize: 12,
    fontWeight: '600',
  },
  rowActions: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  iconBtn: {
    padding: spacing.sm,
    borderRadius: radii.sm,
  },
  editRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  editInput: {
    flex: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.md,
    borderWidth: 1,
    fontSize: 16,
  },
});
