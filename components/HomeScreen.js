import React, { useState, useMemo } from 'react';
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
import { AppLogo } from './AppLogo';
import { useLayout } from '../hooks/useLayout';
import { useTheme } from '../context/ThemeContext';
import { useFolders } from '../hooks/useFolders';
import { themeDark } from '../constants/themes';

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
  setLastUsed,
  folders: foldersProp,
}) => {
  const { theme } = useTheme();
  const { horizontalPadding, contentMaxWidth, safeBottom } = useLayout();
  const { folders: foldersFromHook } = useFolders();
  const folders = foldersProp && foldersProp.length > 0 ? foldersProp : foldersFromHook;
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('issuer');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [folderFilter, setFolderFilter] = useState('all');
  const [editingAccount, setEditingAccount] = useState(null);
  const [collapsedFolders, setCollapsedFolders] = useState({});
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
      if (sortBy === 'order') return (a.order ?? 0) - (b.order ?? 0);
      if (sortBy === 'issuer') return (a.issuer || '').localeCompare(b.issuer || '');
      if (sortBy === 'label') return (a.label || '').localeCompare(b.label || '');
      if (sortBy === 'lastUsed') return (b.lastUsed || 0) - (a.lastUsed || 0);
      return 0;
    });
    return sorted;
  }, [accounts, searchQuery, sortBy, showFavoritesOnly, folderFilter]);

  const accountsByFolder = useMemo(() => {
    const map = {};
    filteredAccounts.forEach((acc) => {
      const f = acc.folder || 'Personal';
      if (!map[f]) map[f] = [];
      map[f].push(acc);
    });
    return map;
  }, [filteredAccounts]);

  const toggleFolderCollapse = (f) => {
    setCollapsedFolders((prev) => ({ ...prev, [f]: !prev[f] }));
  };
  const paddingBottom = 120 + safeBottom;

  if (!token) {
    return (
      <View style={[styles.authPrompt, { paddingHorizontal: horizontalPadding }]}>
        <View style={styles.logoContainer}>
          <View style={[styles.logoRing, { borderColor: theme.colors.borderBright }]}>
            <AppLogo size="lg" />
          </View>
        </View>
        <Text style={[styles.authPromptTitle, { color: theme.colors.text }]}>QSafe</Text>
        <Text style={[styles.authPromptSubtitle, { color: theme.colors.textSecondary }]}>
          Quantum-Safe Authentication
        </Text>
        <Text style={[styles.authPromptTagline, { color: theme.colors.textMuted }]}>
          Post-quantum cryptography · TOTP · Push MFA
        </Text>
        <TouchableOpacity
          style={styles.authPromptButtonWrapper}
          onPress={onScanPress}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={theme.gradients.accent}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.authPromptButton}
          >
            <Text style={styles.authPromptButtonText}>Get Started</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    );
  }

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
      <View style={styles.header}>
        <View>
          <Text style={[styles.greeting, { color: theme.colors.textMuted }]}>
            Hello {user?.displayName || (user?.email ? user.email.split('@')[0] : '') || 'User'}
          </Text>
          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>My Accounts</Text>
          <Text style={[styles.headerSubtitle, { color: theme.colors.textSecondary }]}>
            {accounts.length} {accounts.length === 1 ? 'account' : 'accounts'}
          </Text>
        </View>
        <View style={styles.headerActions}>
          {onSettingsPress && (
            <TouchableOpacity
              style={[styles.iconButton, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
              onPress={onSettingsPress}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons name="cog" size={22} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[styles.logoutButton, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
            onPress={onLogout}
            activeOpacity={0.7}
          >
            <Text style={[styles.logoutButtonText, { color: theme.colors.textSecondary }]}>Logout</Text>
          </TouchableOpacity>
        </View>
      </View>

      {accounts.length > 0 && (
        <>
          <View style={[styles.searchWrap, { backgroundColor: theme.colors.bgCard, borderColor: theme.colors.border }]}>
            <MaterialCommunityIcons name="magnify" size={20} color={theme.colors.textMuted} style={styles.searchIcon} />
            <TextInput
              style={[styles.searchInput, { color: theme.colors.text }]}
              placeholder="Search accounts..."
              placeholderTextColor={theme.colors.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={8}>
                <MaterialCommunityIcons name="close-circle" size={20} color={theme.colors.textMuted} />
              </TouchableOpacity>
            )}
          </View>
          <View style={[styles.filtersRow, { borderColor: theme.colors.border }]}>
            <TouchableOpacity
              style={[styles.filterChip, showFavoritesOnly && { backgroundColor: theme.colors.accent }]}
              onPress={() => setShowFavoritesOnly(!showFavoritesOnly)}
            >
              <MaterialCommunityIcons name="star" size={16} color={showFavoritesOnly ? theme.colors.bg : theme.colors.textMuted} />
              <Text style={[styles.filterChipText, { color: showFavoritesOnly ? theme.colors.bg : theme.colors.textSecondary }]}>Favorites</Text>
            </TouchableOpacity>
            {folders.map((f) => (
              <TouchableOpacity
                key={f}
                style={[styles.filterChip, folderFilter === f && { backgroundColor: theme.colors.surface, borderColor: theme.colors.accent, borderWidth: 1 }]}
                onPress={() => setFolderFilter(folderFilter === f ? 'all' : f)}
              >
                <Text style={[styles.filterChipText, { color: folderFilter === f ? theme.colors.accent : theme.colors.textSecondary }]}>{f}</Text>
              </TouchableOpacity>
            ))}
            {['order', 'issuer', 'label', 'lastUsed'].map((opt) => (
              <TouchableOpacity
                key={opt}
                style={[styles.filterChip, sortBy === opt && { backgroundColor: theme.colors.surface, borderColor: theme.colors.accent }]}
                onPress={() => setSortBy(opt)}
              >
                <Text style={[styles.filterChipText, { color: sortBy === opt ? theme.colors.accent : theme.colors.textSecondary }]}>
                  {opt === 'lastUsed' ? 'Recent' : opt === 'order' ? 'Custom' : opt.charAt(0).toUpperCase() + opt.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </>
      )}

      {accounts.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={[styles.emptyIconWrap, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            <MaterialCommunityIcons name="qrcode-scan" size={32} color={theme.colors.accent} />
          </View>
          <Text style={[styles.emptyStateTitle, { color: theme.colors.text }]}>No accounts yet</Text>
          <Text style={[styles.emptyStateText, { color: theme.colors.textMuted }]}>
            Tap the QR button below to scan a code{'\n'}and add your first account
          </Text>
          <Text style={[styles.emptyStateHint, { color: theme.colors.textMuted }]}>
            Accounts are stored on this device. Add them on each device you use.
          </Text>
        </View>
      ) : (
        <View style={styles.accountsList}>
          {filteredAccounts.length === 0 ? (
            <Text style={[styles.searchEmpty, { color: theme.colors.textMuted }]}>No accounts match "{searchQuery}"</Text>
          ) : folderFilter === 'all' && Object.keys(accountsByFolder).length > 1 ? (
            Object.entries(accountsByFolder).map(([folderName, accs]) => {
              const isCollapsed = collapsedFolders[folderName];
              return (
                <View key={folderName} style={styles.folderGroup}>
                  <TouchableOpacity
                    style={[styles.folderGroupHeader, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
                    onPress={() => toggleFolderCollapse(folderName)}
                  >
                    <MaterialCommunityIcons
                      name={isCollapsed ? 'chevron-right' : 'chevron-down'}
                      size={20}
                      color={theme.colors.textMuted}
                    />
                    <Text style={[styles.folderGroupTitle, { color: theme.colors.text }]}>{folderName}</Text>
                    <Text style={[styles.folderGroupCount, { color: theme.colors.textMuted }]}>{accs.length}</Text>
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
        onClose={() => setEditingAccount(null)}
        onSave={(id, updates) => { updateAccount?.(id, updates); setEditingAccount(null); }}
      />
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
    paddingTop: themeDark.spacing.lg,
    paddingBottom: themeDark.spacing.xl,
  },
  greeting: {
    ...themeDark.typography.bodySm,
    marginBottom: 2,
  },
  headerTitle: {
    ...themeDark.typography.h1,
    marginBottom: 4,
  },
  headerSubtitle: {
    ...themeDark.typography.bodySm,
    letterSpacing: 0.5,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: themeDark.spacing.sm,
  },
  iconButton: {
    padding: themeDark.spacing.sm,
    borderRadius: themeDark.radii.full,
    borderWidth: 1,
  },
  logoutButton: {
    paddingHorizontal: themeDark.spacing.md,
    paddingVertical: themeDark.spacing.sm,
    borderRadius: themeDark.radii.full,
    borderWidth: 1,
  },
  logoutButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyIconWrap: {
    width: 72,
    height: 72,
    borderRadius: themeDark.radii.xl,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: themeDark.spacing.lg,
  },
  emptyStateTitle: {
    ...themeDark.typography.h2,
    marginBottom: themeDark.spacing.sm,
  },
  emptyStateText: {
    ...themeDark.typography.bodySm,
    textAlign: 'center',
    lineHeight: 22,
  },
  emptyStateHint: {
    ...themeDark.typography.caption,
    textAlign: 'center',
    marginTop: themeDark.spacing.md,
    opacity: 0.8,
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: themeDark.radii.md,
    borderWidth: 1,
    paddingHorizontal: themeDark.spacing.md,
    marginBottom: themeDark.spacing.sm,
  },
  filtersRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: themeDark.spacing.sm,
    marginBottom: themeDark.spacing.lg,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: themeDark.spacing.sm,
    paddingHorizontal: themeDark.spacing.md,
    borderRadius: themeDark.radii.full,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '600',
  },
  searchIcon: {
    marginRight: themeDark.spacing.sm,
  },
  searchInput: {
    flex: 1,
    paddingVertical: themeDark.spacing.md,
    fontSize: 16,
  },
  searchEmpty: {
    textAlign: 'center',
    paddingVertical: themeDark.spacing.xl,
    ...themeDark.typography.bodySm,
  },
  accountsList: {
    gap: themeDark.spacing.md,
  },
  folderGroup: {
    marginBottom: themeDark.spacing.md,
  },
  folderGroupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: themeDark.spacing.md,
    borderRadius: themeDark.radii.md,
    borderWidth: 1,
    marginBottom: themeDark.spacing.sm,
  },
  folderGroupTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: themeDark.spacing.sm,
    flex: 1,
  },
  folderGroupCount: {
    fontSize: 13,
  },
  authPrompt: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: themeDark.spacing.xl,
  },
  logoContainer: {
    marginBottom: themeDark.spacing.lg,
  },
  logoRing: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: themeDark.colors.surface,
    borderWidth: 2,
    borderColor: themeDark.colors.borderBright,
    alignItems: 'center',
    justifyContent: 'center',
  },
  authPromptTitle: {
    ...themeDark.typography.display,
    color: themeDark.colors.text,
    marginBottom: themeDark.spacing.sm,
  },
  authPromptSubtitle: {
    ...themeDark.typography.h2,
    color: themeDark.colors.textSecondary,
    textAlign: 'center',
    marginBottom: themeDark.spacing.xs,
  },
  authPromptTagline: {
    ...themeDark.typography.caption,
    color: themeDark.colors.textMuted,
    textAlign: 'center',
    marginBottom: themeDark.spacing.xxl,
    letterSpacing: 1,
  },
  authPromptButtonWrapper: {
    borderRadius: themeDark.radii.lg,
    overflow: 'hidden',
    ...Platform.select({
      ios: themeDark.shadow.glow,
      android: { elevation: 10 },
    }),
  },
  authPromptButton: {
    paddingHorizontal: themeDark.spacing.xxl,
    paddingVertical: themeDark.spacing.lg,
    borderRadius: themeDark.radii.lg,
    minWidth: 200,
    alignItems: 'center',
  },
  authPromptButtonText: {
    color: themeDark.colors.bg,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
