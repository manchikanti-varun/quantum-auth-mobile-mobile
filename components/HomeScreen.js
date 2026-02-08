/**
 * Main screen. Greeting, account list, search, filters, collapsible folders.
 * @module components/HomeScreen
 */
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
  setLastUsed,
  folders: foldersProp,
}) => {
  const { theme } = useTheme();
  const { horizontalPadding, contentMaxWidth, safeBottom } = useLayout();
  const { folders: foldersFromHook, refreshFolders } = useFolders();
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

  const folderCounts = useMemo(() => {
    const counts = {};
    accounts.forEach((acc) => {
      const f = acc.folder || 'Personal';
      counts[f] = (counts[f] || 0) + 1;
    });
    return counts;
  }, [accounts]);

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
      <View style={[styles.header, { backgroundColor: theme.colors.bgCard, borderWidth: 1, borderColor: theme.colors.border }, Platform.OS === 'ios' && theme.shadow?.cardSoft, Platform.OS === 'android' && { elevation: 4 }]}>
        <View style={styles.headerLeft}>
          <LinearGradient colors={theme.gradients.accent} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.avatar}>
            <Text style={[styles.avatarText, { color: theme.colors.onAccent }]}>{initials}</Text>
          </LinearGradient>
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

      {accounts.length > 0 && (
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
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersScroll}>
            <View style={[styles.filtersRow, { backgroundColor: 'transparent' }]}>
              <TouchableOpacity
                style={[styles.filterChip, { backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border }, showFavoritesOnly && { backgroundColor: theme.colors.accent, borderColor: theme.colors.accent }]}
                onPress={() => setShowFavoritesOnly(!showFavoritesOnly)}
              >
                <MaterialCommunityIcons name="star" size={16} color={showFavoritesOnly ? theme.colors.onAccent : theme.colors.textMuted} />
                <Text style={[styles.filterChipText, { color: showFavoritesOnly ? theme.colors.onAccent : theme.colors.textSecondary }]}>Favorites</Text>
              </TouchableOpacity>
              {folders.map((f) => {
                const count = folderCounts[f] ?? 0;
                const isActive = folderFilter === f;
                return (
                  <TouchableOpacity
                    key={f}
                    style={[styles.filterChip, { backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border }, isActive && { backgroundColor: theme.colors.accent, borderColor: theme.colors.accent }]}
                    onPress={() => setFolderFilter(isActive ? 'all' : f)}
                  >
                    <MaterialCommunityIcons name="folder-outline" size={14} color={isActive ? theme.colors.onAccent : theme.colors.textMuted} />
                    <Text style={[styles.filterChipText, { color: isActive ? theme.colors.onAccent : theme.colors.textSecondary }]}>{f}</Text>
                    <Text style={[styles.filterChipCount, { color: isActive ? theme.colors.onAccent : theme.colors.textMuted }]}>{count}</Text>
                  </TouchableOpacity>
                );
              })}
              {['order', 'issuer', 'label', 'lastUsed'].map((opt) => {
                const isActive = sortBy === opt;
                return (
                  <TouchableOpacity
                    key={opt}
                    style={[styles.filterChip, { backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border }, isActive && { backgroundColor: theme.colors.accent, borderColor: theme.colors.accent }]}
                    onPress={() => setSortBy(opt)}
                  >
                    <Text style={[styles.filterChipText, { color: isActive ? theme.colors.onAccent : theme.colors.textSecondary }]}>
                      {opt === 'lastUsed' ? 'Recent' : opt === 'order' ? 'Custom' : opt.charAt(0).toUpperCase() + opt.slice(1)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>
        </>
      )}

      {accounts.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={[styles.emptyIconWrap, { backgroundColor: theme.colors.bgCard, borderWidth: 2, borderColor: theme.colors.border }]}>
            <MaterialCommunityIcons name="shield-plus-outline" size={52} color={theme.colors.accent} />
          </View>
          <Text style={[styles.emptyStateTitle, { color: theme.colors.text }]}>Add your first account</Text>
          <Text style={[styles.emptyStateText, { color: theme.colors.textSecondary }]}>
            Tap the + button below to scan a QR code from your service’s security settings
          </Text>
          <Text style={[styles.emptyStateHint, { color: theme.colors.textMuted }]}>
            Works with Google, GitHub, Microsoft, and any app that supports 2FA
          </Text>
          <View style={[styles.emptyTips, { backgroundColor: theme.colors.surface }]}>
            <MaterialCommunityIcons name="lightbulb-on-outline" size={20} color={theme.colors.accent} />
            <Text style={[styles.emptyTipText, { color: theme.colors.textSecondary }]}>
              Look for “Two-factor authentication” or “2FA” in your account settings
            </Text>
          </View>
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
        accounts={accounts}
        onClose={() => { setEditingAccount(null); refreshFolders?.(); }}
        onSave={(id, updates) => { updateAccount?.(id, updates); setEditingAccount(null); refreshFolders?.(); }}
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
    borderRadius: radii.md,
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
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: spacing.lg,
  },
  emptyIconWrap: {
    width: 96,
    height: 96,
    borderRadius: radii.xxl,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  emptyStateTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: spacing.sm,
  },
  emptyStateHint: {
    fontSize: 14,
    textAlign: 'center',
    opacity: 0.85,
  },
  emptyTips: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.lg,
    borderRadius: radii.md,
    marginTop: spacing.xl,
    maxWidth: 320,
  },
  emptyTipText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radii.lg,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
    minHeight: 52,
  },
  filtersScroll: {
    marginBottom: spacing.lg,
    marginHorizontal: -2,
  },
  filtersRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingVertical: 4,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radii.full,
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
    borderRadius: radii.xxl,
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
