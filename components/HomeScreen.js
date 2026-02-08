/**
 * Main screen. Greeting, account list, search, filters, collapsible folders.
 * @module components/HomeScreen
 */
import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Platform,
  TextInput,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AccountCard } from './AccountCard';
import { AccountEditModal } from './AccountEditModal';
import { ConfirmDialog } from './ui';
import { AppLogo } from './AppLogo';
import { useLayout } from '../hooks/useLayout';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import { useFolders } from '../hooks/useFolders';
import { themeDark } from '../constants/themes';
import { spacing, radii } from '../constants/designTokens';
export const HomeScreen = ({
  token,
  user,
  accounts,
  totpCodes,
  totpAdjacent = {},
  totpSecondsRemaining = 0,
  onLogout,
  onScanPress,
  onRemoveAccount,
  onSettingsPress,
  onToggleFavorite,
  updateAccount,
  updateAccountsBatch,
  setLastUsed,
  reorderAccounts,
  folders: foldersProp,
  addFolder,
  removeFolder,
  refreshFolders: refreshFoldersProp,
}) => {
  const { theme } = useTheme();
  const { showToast } = useToast();
  const { horizontalPadding, contentMaxWidth, safeBottom } = useLayout();
  const { folders: foldersFromHook, refreshFolders: refreshFoldersFromHook } = useFolders(token, user?.uid);
  const refreshFolders = refreshFoldersProp || refreshFoldersFromHook;
  const folders = useMemo(() => {
    const base = foldersProp && foldersProp.length > 0 ? foldersProp : foldersFromHook;
    const accountFolders = [...new Set(accounts.map((a) => a.folder || 'Personal'))];
    return [...new Set([...base, ...accountFolders])];
  }, [foldersProp, foldersFromHook, accounts]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('issuer');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [folderFilter, setFolderFilter] = useState('all');
  const [editingAccount, setEditingAccount] = useState(null);
  const [collapsedFolders, setCollapsedFolders] = useState({});
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [pendingOrder, setPendingOrder] = useState(null);
  const [folderDeleteConfirm, setFolderDeleteConfirm] = useState(null);

  const fullSortedByOrder = useMemo(
    () => [...accounts].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
    [accounts]
  );

  const effectiveOrder = pendingOrder ?? fullSortedByOrder;

  const filteredAccounts = useMemo(() => {
    let list = accounts;
    if (showFavoritesOnly) list = list.filter((a) => a.favorite);
    if (folderFilter !== 'all') list = list.filter((a) => (a.folder || 'Personal') === folderFilter);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (a) =>
          (a.issuer || '').toLowerCase().includes(q) ||
          (a.label || '').toLowerCase().includes(q) ||
          (a.notes || '').toLowerCase().includes(q)
      );
    }
    const sorted = [...list].sort((a, b) => {
      if (sortBy === 'order') {
        const orderA = effectiveOrder.findIndex((x) => x.id === a.id);
        const orderB = effectiveOrder.findIndex((x) => x.id === b.id);
        return (orderA === -1 ? 999 : orderA) - (orderB === -1 ? 999 : orderB);
      }
      if (sortBy === 'issuer') return (a.issuer || '').localeCompare(b.issuer || '');
      if (sortBy === 'label') return (a.label || '').localeCompare(b.label || '');
      if (sortBy === 'lastUsed') return (b.lastUsed || 0) - (a.lastUsed || 0);
      return 0;
    });
    return sorted;
  }, [accounts, searchQuery, sortBy, showFavoritesOnly, folderFilter, effectiveOrder]);

  const accountsByFolder = useMemo(() => {
    const map = {};
    filteredAccounts.forEach((acc) => {
      const f = acc.folder || 'Personal';
      if (!map[f]) map[f] = [];
      map[f].push(acc);
    });
    return map;
  }, [filteredAccounts]);

  const folderEntriesSorted = useMemo(() => {
    const entries = Object.entries(accountsByFolder);
    return [...entries].sort(([fa], [fb]) => {
      const ia = folders.indexOf(fa);
      const ib = folders.indexOf(fb);
      return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib);
    });
  }, [accountsByFolder, folders]);

  const folderCounts = useMemo(() => {
    const counts = {};
    accounts.forEach((acc) => {
      const f = acc.folder || 'Personal';
      counts[f] = (counts[f] || 0) + 1;
    });
    return counts;
  }, [accounts]);

  const handleMoveAccount = (accountId, direction) => {
    if (!reorderAccounts) return;
    const idx = effectiveOrder.findIndex((a) => a.id === accountId);
    if (idx < 0) return;
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= effectiveOrder.length) return;
    const next = [...effectiveOrder];
    [next[idx], next[swapIdx]] = [next[swapIdx], next[idx]];
    setPendingOrder(next);
  };

  const handleSaveOrder = () => {
    if (pendingOrder && reorderAccounts) {
      reorderAccounts(pendingOrder);
      setPendingOrder(null);
      showToast?.('Order saved');
    }
  };

  const getReorderProps = (acc) => {
    if (sortBy !== 'order' || !reorderAccounts) return {};
    const idx = effectiveOrder.findIndex((a) => a.id === acc.id);
    if (idx < 0) return {};
    return {
      onMoveUp: () => handleMoveAccount(acc.id, 'up'),
      onMoveDown: () => handleMoveAccount(acc.id, 'down'),
      canMoveUp: idx > 0,
      canMoveDown: idx < effectiveOrder.length - 1,
    };
  };

  useEffect(() => {
    if (sortBy !== 'order') setPendingOrder(null);
  }, [sortBy]);

  const toggleFolderCollapse = (f) => {
    setCollapsedFolders((prev) => ({ ...prev, [f]: !prev[f] }));
  };

  const paddingBottom = 120 + safeBottom;

  if (!token) {
    return (
      <View style={[styles.authPrompt, { paddingHorizontal: horizontalPadding }]}>
        <View style={[styles.logoRing, { backgroundColor: theme.colors.bgCard, borderWidth: 2, borderColor: theme.colors.accentGlow || 'rgba(56, 189, 248, 0.3)' }]}>
          <AppLogo size="lg" />
        </View>
        <Text style={[styles.authPromptTitle, { color: theme.colors.text }]}>QSafe</Text>
        <Text style={[styles.authPromptSubtitle, { color: theme.colors.textSecondary }]}>
          Your secure authenticator
        </Text>
        <Text style={[styles.authPromptTagline, { color: theme.colors.textMuted }]}>
          Store 2FA codes, approve logins on new devices, and keep your accounts secure
        </Text>
        <View style={[styles.authPromptCta, { backgroundColor: theme.colors.bgCard }]}>
          <MaterialCommunityIcons name="shield-check" size={20} color={theme.colors.accent} />
          <Text style={[styles.authPromptCtaText, { color: theme.colors.textSecondary }]}>One app for all your codes</Text>
        </View>
        <TouchableOpacity style={[styles.authPromptButtonWrapper, Platform.select({ ios: theme.shadow.glow, android: { elevation: 10 } })]} onPress={onScanPress} activeOpacity={0.85}>
          <LinearGradient colors={theme.gradients.accent} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.authPromptButton}>
            <MaterialCommunityIcons name="login" size={22} color={theme.colors.onAccent} />
            <Text style={[styles.authPromptButtonText, { color: theme.colors.onAccent }]}>Sign in to get started</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    );
  }

  const formatDisplayName = (name) => {
    if (!name || typeof name !== 'string') return '';
    let trimmed = name.trim();
    if (!trimmed) return '';
    if (trimmed.includes('@')) trimmed = trimmed.split('@')[0] || trimmed;
    return trimmed
      .replace(/[._]/g, ' ')
      .split(/\s+/)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(' ');
  };
  const rawName = user?.displayName || (user?.email ? user.email.split('@')[0] : '') || '';
  const displayName = formatDisplayName(rawName) || 'User';
  const initials = displayName.split(' ').filter(Boolean).map((n) => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.content,
        {
          paddingHorizontal: horizontalPadding,
          paddingBottom,
          maxWidth: contentMaxWidth + horizontalPadding * 2,
          alignSelf: 'center',
          width: '100%',
        },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <View style={[styles.header, { backgroundColor: theme.colors.bgCard }]}>
        <View style={styles.headerLeft}>
          <View style={[styles.avatar, { backgroundColor: theme.colors.surface }]}>
            <Text style={[styles.avatarText, { color: theme.colors.accent }]}>{initials}</Text>
          </View>
          <View style={styles.headerTextWrap}>
            <Text style={[styles.greeting, { color: theme.colors.textMuted }]}>Welcome back</Text>
            <Text style={[styles.headerTitle, { color: theme.colors.text }]} numberOfLines={2} ellipsizeMode="tail">{displayName}</Text>
            <Text style={[styles.headerSubtitle, { color: theme.colors.textSecondary }]}>
              {accounts.length} {accounts.length === 1 ? 'account' : 'accounts'} secured
            </Text>
          </View>
        </View>
        <View style={styles.headerActions}>
          {onSettingsPress && (
            <TouchableOpacity
              style={[styles.iconButton, { backgroundColor: theme.colors.surface }]}
              onPress={onSettingsPress}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons name="cog-outline" size={22} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[styles.iconButton, { backgroundColor: theme.colors.surface }]}
            onPress={onLogout}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons name="logout" size={20} color={theme.colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>

      {token && (
        <>
          <View style={[styles.searchWrap, { backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border }]}>
            <MaterialCommunityIcons name="magnify" size={22} color={theme.colors.textMuted} style={styles.searchIcon} />
            <TextInput
              style={[styles.searchInput, { color: theme.colors.text }]}
              placeholder="Search accounts..."
              placeholderTextColor={theme.colors.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={8}>
                <MaterialCommunityIcons name="close-circle" size={22} color={theme.colors.textMuted} />
              </TouchableOpacity>
            )}
          </View>
          <View style={styles.filtersWrap}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersScroll} contentContainerStyle={styles.filtersScrollContent}>
              <TouchableOpacity
                style={[styles.filterChip, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }, showFavoritesOnly && { backgroundColor: theme.colors.accent, borderColor: theme.colors.accent }]}
                onPress={() => setShowFavoritesOnly(!showFavoritesOnly)}
              >
                <MaterialCommunityIcons name="star" size={15} color={showFavoritesOnly ? theme.colors.onAccent : theme.colors.textMuted} />
                <Text style={[styles.filterChipText, { color: showFavoritesOnly ? theme.colors.onAccent : theme.colors.textSecondary }]}>Favorites</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.filterChip, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }, folderFilter === 'all' && { backgroundColor: theme.colors.accent, borderColor: theme.colors.accent }]}
                onPress={() => { setFolderFilter('all'); }}
              >
                <MaterialCommunityIcons name="format-list-bulleted" size={15} color={folderFilter === 'all' ? theme.colors.onAccent : theme.colors.textMuted} />
                <Text style={[styles.filterChipText, { color: folderFilter === 'all' ? theme.colors.onAccent : theme.colors.textSecondary }]}>All</Text>
              </TouchableOpacity>
              {folders.map((f) => {
                const count = folderCounts[f] ?? 0;
                const isActive = folderFilter === f;
                const isCustomFolder = true;
                const handleFolderLongPress = () => {
                  if (!isCustomFolder || !removeFolder) return;
                  const moveCount = count;
                  if (moveCount === 0) {
                    removeFolder(f);
                    if (folderFilter === f) setFolderFilter('all');
                    refreshFolders?.();
                    return;
                  }
                  const otherFolders = folders.filter((x) => x !== f);
                  if (otherFolders.length === 0) {
                    showToast?.('Move accounts to another folder first');
                    return;
                  }
                  const moveTo = otherFolders[0];
                  setFolderDeleteConfirm({ folder: f, moveTo, count: moveCount });
                };
                return (
                  <TouchableOpacity
                    key={f}
                    style={[styles.filterChip, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }, isActive && { backgroundColor: theme.colors.accent, borderColor: theme.colors.accent }]}
                    onPress={() => setFolderFilter(isActive ? 'all' : f)}
                    onLongPress={handleFolderLongPress}
                  >
                    <MaterialCommunityIcons name="folder-outline" size={15} color={isActive ? theme.colors.onAccent : theme.colors.textMuted} />
                    <Text style={[styles.filterChipText, { color: isActive ? theme.colors.onAccent : theme.colors.textSecondary }]}>{f}</Text>
                    <Text style={[styles.filterChipCount, { color: isActive ? theme.colors.onAccent : theme.colors.textMuted }]}>{count}</Text>
                  </TouchableOpacity>
                );
              })}
              {addFolder && (
                <TouchableOpacity
                  style={[styles.filterChip, styles.createChip, { backgroundColor: theme.colors.surface, borderColor: theme.colors.accent }]}
                  onPress={() => setShowCreateFolder(true)}
                >
                  <MaterialCommunityIcons name="plus" size={16} color={theme.colors.accent} />
                  <Text style={[styles.filterChipText, { color: theme.colors.accent }]}>Create</Text>
                </TouchableOpacity>
              )}
            </ScrollView>
            {showCreateFolder && addFolder && (
              <View style={[styles.createFolderRow, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
                <TextInput
                  style={[styles.createFolderInput, { backgroundColor: theme.colors.bgElevated, borderColor: theme.colors.border, color: theme.colors.text }]}
                  placeholder="Folder name..."
                  placeholderTextColor={theme.colors.textMuted}
                  value={newFolderName}
                  onChangeText={setNewFolderName}
                  autoFocus
                  onSubmitEditing={() => {
                    const name = newFolderName.trim();
                    if (name && !folders.includes(name)) {
                      addFolder(name);
                      setFolderFilter(name);
                      setNewFolderName('');
                      setShowCreateFolder(false);
                    }
                  }}
                />
                <TouchableOpacity
                  style={[styles.createFolderBtn, { backgroundColor: theme.colors.accent }]}
                  onPress={() => {
                    const name = newFolderName.trim();
                    if (name && !folders.includes(name)) {
                      addFolder(name);
                      setFolderFilter(name);
                      setNewFolderName('');
                      setShowCreateFolder(false);
                    } else if (name && folders.includes(name)) {
                      showToast?.(`Folder "${name}" already exists`);
                    }
                  }}
                >
                  <Text style={[styles.createFolderBtnText, { color: theme.colors.onAccent }]}>Add</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.createFolderBtn, { backgroundColor: theme.colors.surface }]}
                  onPress={() => { setShowCreateFolder(false); setNewFolderName(''); }}
                >
                  <MaterialCommunityIcons name="close" size={20} color={theme.colors.textMuted} />
                </TouchableOpacity>
              </View>
            )}
            <Text style={[styles.filterSectionLabel, { color: theme.colors.textMuted }]}>Sort by</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersScroll} contentContainerStyle={styles.filtersScrollContent}>
              {[
                { key: 'order', label: 'Custom', icon: 'format-list-numbered' },
                { key: 'issuer', label: 'Issuer', icon: 'sort-alphabetical-variant' },
                { key: 'label', label: 'Label', icon: 'tag-outline' },
                { key: 'lastUsed', label: 'Recent', icon: 'clock-outline' },
              ].map(({ key, label, icon }) => {
                const isActive = sortBy === key;
                return (
                  <TouchableOpacity
                    key={key}
                    style={[styles.filterChip, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }, isActive && { backgroundColor: theme.colors.accent, borderColor: theme.colors.accent }]}
                    onPress={() => setSortBy(key)}
                  >
                    <MaterialCommunityIcons name={icon} size={14} color={isActive ? theme.colors.onAccent : theme.colors.textMuted} />
                    <Text style={[styles.filterChipText, { color: isActive ? theme.colors.onAccent : theme.colors.textSecondary }]}>{label}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
            {sortBy === 'order' && pendingOrder && reorderAccounts && (
              <TouchableOpacity
                style={[styles.saveOrderBtn, { backgroundColor: theme.colors.accent }]}
                onPress={handleSaveOrder}
                activeOpacity={0.8}
              >
                <MaterialCommunityIcons name="content-save" size={18} color={theme.colors.onAccent} />
                <Text style={[styles.saveOrderBtnText, { color: theme.colors.onAccent }]}>Save order</Text>
              </TouchableOpacity>
            )}
          </View>
        </>
      )}

      {accounts.length === 0 ? (
        <View style={styles.emptyState}>
          <MaterialCommunityIcons name="shield-plus-outline" size={40} color={theme.colors.textMuted} style={styles.emptyIcon} />
          <Text style={[styles.emptyStateText, { color: theme.colors.textMuted }]}>
            Tap the scanner to add your first account
          </Text>
        </View>
      ) : (
        <View style={styles.accountsList}>
          {filteredAccounts.length === 0 ? (
            <Text style={[styles.searchEmpty, { color: theme.colors.textMuted }]}>No accounts match "{searchQuery}"</Text>
          ) : folderFilter === 'all' && folderEntriesSorted.length > 1 ? (
            folderEntriesSorted.map(([folderName, accs]) => {
              const isCollapsed = collapsedFolders[folderName];
              return (
                <View key={folderName} style={styles.folderGroup}>
                  <TouchableOpacity
                    style={[styles.folderGroupHeader, { backgroundColor: theme.colors.surface }]}
                    onPress={() => toggleFolderCollapse(folderName)}
                  >
                    <MaterialCommunityIcons name={isCollapsed ? 'chevron-right' : 'chevron-down'} size={20} color={theme.colors.textSecondary} />
                    <Text style={[styles.folderGroupTitle, { color: theme.colors.text }]}>{folderName}</Text>
                    <View style={[styles.folderBadge, { backgroundColor: theme.colors.bgCard }]}>
                      <Text style={[styles.folderGroupCount, { color: theme.colors.textSecondary }]}>{accs.length}</Text>
                    </View>
                  </TouchableOpacity>
                  {!isCollapsed && accs.map((acc, index) => {
                    const codeKey = acc.id || `fallback-${acc.issuer}-${acc.label}-${index}`;
                    return (
                      <AccountCard
                        key={acc.id || codeKey}
                        account={acc}
                        code={totpCodes[codeKey]}
                        secondsRemaining={totpSecondsRemaining}
                        onRemove={onRemoveAccount}
                        onToggleFavorite={onToggleFavorite}
                        isFavorite={!!acc.favorite}
                        onCopy={() => setLastUsed?.(acc.id)}
                        onEdit={updateAccount ? (a) => setEditingAccount(a) : undefined}
                        {...getReorderProps(acc)}
                      />
                    );
                  })}
                </View>
              );
            })
          ) : (
            filteredAccounts.map((acc, index) => {
              const codeKey = acc.id || `fallback-${acc.issuer}-${acc.label}-${index}`;
              return (
                <AccountCard
                  key={acc.id || codeKey}
                  account={acc}
                  code={totpCodes[codeKey]}
                  secondsRemaining={totpSecondsRemaining}
                  onRemove={onRemoveAccount}
                  onToggleFavorite={onToggleFavorite}
                  isFavorite={!!acc.favorite}
                  onCopy={() => setLastUsed?.(acc.id)}
                  onEdit={updateAccount ? (a) => setEditingAccount(a) : undefined}
                  {...getReorderProps(acc)}
                />
              );
            })
          )}
        </View>
      )}

      <AccountEditModal
        visible={!!editingAccount}
        account={editingAccount}
        folders={folders}
        accounts={accounts}
        addFolder={addFolder}
        onClose={() => { setEditingAccount(null); refreshFolders?.(); }}
        onSave={(id, updates) => { updateAccount?.(id, updates); setEditingAccount(null); refreshFolders?.(); }}
      />

      {folderDeleteConfirm && (
        <ConfirmDialog
          visible
          title={`Delete "${folderDeleteConfirm.folder}"?`}
          message={`${folderDeleteConfirm.count} account(s) will be moved to ${folderDeleteConfirm.moveTo}. Continue?`}
          confirmText="Delete"
          cancelText="Cancel"
          destructive
          onConfirm={async () => {
            const toMove = accounts.filter((acc) => (acc.folder || 'Personal') === folderDeleteConfirm.folder);
            if (toMove.length > 0) {
              await updateAccountsBatch?.(toMove.map((acc) => ({ id: acc.id, updates: { folder: folderDeleteConfirm.moveTo } })));
            }
            removeFolder(folderDeleteConfirm.folder);
            if (folderFilter === folderDeleteConfirm.folder) setFolderFilter('all');
            refreshFolders?.();
            setFolderDeleteConfirm(null);
          }}
          onCancel={() => setFolderDeleteConfirm(null)}
        />
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    borderRadius: radii.lg,
    marginBottom: spacing.lg,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    minWidth: 0,
  },
  headerTextWrap: {
    flex: 1,
    minWidth: 0,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '700',
  },
  greeting: {
    fontSize: 13,
    marginBottom: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 14,
    opacity: 0.85,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyState: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    paddingHorizontal: spacing.lg,
  },
  emptyIcon: {
    marginBottom: spacing.md,
    opacity: 0.6,
  },
  emptyStateText: {
    fontSize: 15,
    textAlign: 'center',
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radii.lg,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
    minHeight: 52,
  },
  filtersWrap: {
    marginBottom: spacing.lg,
  },
  filtersScroll: {
    marginBottom: spacing.sm,
  },
  filtersScrollContent: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingVertical: 4,
  },
  filterSectionLabel: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.xs,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radii.full,
    borderWidth: 1,
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '600',
  },
  folderChipIcon: {
    marginRight: 2,
  },
  filterChipCount: {
    fontSize: 12,
    marginLeft: 2,
  },
  createChip: {
    borderStyle: 'dashed',
  },
  saveOrderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radii.md,
    marginTop: spacing.sm,
  },
  saveOrderBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
  createFolderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.sm,
    borderRadius: radii.md,
    borderWidth: 1,
    marginTop: spacing.sm,
  },
  createFolderInput: {
    flex: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.md,
    borderWidth: 1,
    fontSize: 16,
  },
  createFolderBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.md,
    justifyContent: 'center',
  },
  createFolderBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
  searchIcon: {
    marginRight: spacing.sm,
  },
  searchInput: {
    flex: 1,
    paddingVertical: spacing.md,
    fontSize: 16,
  },
  searchEmpty: {
    textAlign: 'center',
    paddingVertical: spacing.xl,
    fontSize: 14,
  },
  accountsList: {
    gap: spacing.md,
  },
  folderGroup: {
    marginBottom: spacing.md,
  },
  folderGroupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: radii.md,
    marginBottom: spacing.sm,
  },
  folderGroupTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: spacing.sm,
    flex: 1,
  },
  folderBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  folderGroupCount: {
    fontSize: 13,
    fontWeight: '600',
  },
  authPrompt: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  logoRing: {
    width: 100,
    height: 100,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  authPromptTitle: {
    ...themeDark.typography.display,
    marginBottom: spacing.sm,
  },
  authPromptSubtitle: {
    ...themeDark.typography.h2,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  authPromptTagline: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: spacing.lg,
    letterSpacing: 0.5,
  },
  authPromptCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: radii.lg,
    marginBottom: spacing.xl,
  },
  authPromptCtaText: {
    fontSize: 15,
    fontWeight: '600',
  },
  authPromptButtonWrapper: {
    borderRadius: radii.lg,
    overflow: 'hidden',
  },
  authPromptButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.lg,
    borderRadius: radii.lg,
    minWidth: 200,
  },
  authPromptButtonText: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
