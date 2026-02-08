/**
 * Login and MFA history modal. Fetches from backend.
 * @module components/HistoryModal
 */
import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { authApi, mfaApi } from '../services/api';
import { spacing, radii } from '../constants/designTokens';

const formatDate = (iso) => {
  try {
    const d = new Date(iso);
    return d.toLocaleString();
  } catch (e) {
    return iso;
  }
};

export const HistoryModal = ({ visible, mode, deviceId, onClose }) => {
  const { theme } = useTheme();
  const [items, setItems] = useState([]);
  const [firstDeviceId, setFirstDeviceId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const fetchHistory = () => {
    if (!visible || !mode) return;
    setLoading(true);
    setError(null);
    const fetch = mode === 'loginHistory' ? () => authApi.getLoginHistory(deviceId) : mfaApi.getHistory;
    fetch()
      .then((res) => {
        setItems(res.data?.history || []);
        setFirstDeviceId(res.data?.firstDeviceId ?? null);
      })
      .catch((e) => setError(e?.response?.data?.message || e?.message || 'Failed to load'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!visible || !mode) return;
    fetchHistory();
  }, [visible, mode]);

  const canDeleteEntry = (item) => {
    if (mode !== 'loginHistory' || !deviceId || !item.deviceId) return false;
    if (item.deviceId === deviceId) return false; // own device
    if (firstDeviceId && item.deviceId === firstDeviceId && deviceId !== firstDeviceId) return false; // first device, we're not on it
    return true;
  };

  const handleDelete = async (item) => {
    if (!canDeleteEntry(item)) return;
    setDeletingId(item.id);
    try {
      await authApi.deleteLoginHistoryEntry(item.id, deviceId);
      setItems((prev) => prev.filter((i) => i.id !== item.id));
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to delete');
    } finally {
      setDeletingId(null);
    }
  };

  if (!visible) return null;

  const title = mode === 'loginHistory' ? 'Login history' : 'MFA history';

  return (
    <Modal visible animationType="slide" transparent onRequestClose={onClose}>
      <View style={[styles.overlay, { backgroundColor: theme.colors.overlay }]}>
        <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onClose} />
        <View style={[styles.content, { backgroundColor: theme.colors.bgElevated }]}>
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={[styles.headerIconWrap, { backgroundColor: theme.colors.surface }]}>
                <MaterialCommunityIcons
                  name={mode === 'loginHistory' ? 'history' : 'shield-check'}
                  size={24}
                  color={theme.colors.accent}
                />
              </View>
              <View>
                <Text style={[styles.title, { color: theme.colors.text }]}>{title}</Text>
                <Text style={[styles.headerSubtitle, { color: theme.colors.textMuted }]}>
                  {mode === 'loginHistory' ? 'Sessions on your devices' : 'Approve/deny requests'}
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={12} style={[styles.closeButton, { backgroundColor: theme.colors.surface }]}>
              <MaterialCommunityIcons name="close" size={22} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={styles.centerContent}>
              <ActivityIndicator size="large" color={theme.colors.accent} />
              <Text style={[styles.loadingText, { color: theme.colors.textMuted }]}>Loading...</Text>
            </View>
          ) : error ? (
            <View style={styles.centerContent}>
              <MaterialCommunityIcons name="alert-circle-outline" size={48} color={theme.colors.error} />
              <Text style={[styles.error, { color: theme.colors.error }]}>{error}</Text>
            </View>
          ) : items.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={[styles.emptyIconWrap, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
                <MaterialCommunityIcons
                  name={mode === 'loginHistory' ? 'cellphone-link-off' : 'shield-off-outline'}
                  size={40}
                  color={theme.colors.textMuted}
                />
              </View>
              <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>No history yet</Text>
              <Text style={[styles.emptyText, { color: theme.colors.textMuted }]}>
                {mode === 'loginHistory'
                  ? 'Login sessions will appear here when you sign in on new devices.'
                  : 'Approve or deny requests will show up here.'}
              </Text>
            </View>
          ) : (
            <ScrollView style={styles.list}>
              {items.map((item, i) => (
                <View key={item.id || i} style={[styles.row, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
                  <MaterialCommunityIcons
                    name={mode === 'loginHistory' ? 'login' : item.decision === 'approved' ? 'check-circle' : 'close-circle'}
                    size={20}
                    color={mode === 'loginHistory' ? theme.colors.accent : item.decision === 'approved' ? theme.colors.success : theme.colors.error}
                  />
                  <View style={styles.rowContent}>
                    <Text style={[styles.rowPrimary, { color: theme.colors.text }]}>
                      {mode === 'loginHistory' ? (item.method || 'login') : item.decision}
                    </Text>
                    <Text style={[styles.rowDate, { color: theme.colors.textMuted }]}>{formatDate(item.timestamp)}</Text>
                  </View>
                  {mode === 'loginHistory' && canDeleteEntry(item) && (
                    <TouchableOpacity
                      onPress={() => handleDelete(item)}
                      disabled={deletingId === item.id}
                      hitSlop={12}
                      style={styles.deleteBtn}
                      accessible
                      accessibilityLabel="Revoke device and sign out"
                    >
                      {deletingId === item.id ? (
                        <ActivityIndicator size="small" color={theme.colors.error} />
                      ) : (
                        <MaterialCommunityIcons name="delete-outline" size={22} color={theme.colors.error} />
                      )}
                    </TouchableOpacity>
                  )}
                </View>
              ))}
            </ScrollView>
          )}
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
    borderRadius: 12,
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
  centerContent: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl,
    gap: spacing.md,
  },
  loadingText: {
    fontSize: 14,
  },
  error: {
    textAlign: 'center',
    fontSize: 15,
    paddingHorizontal: 24,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  emptyIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    marginBottom: spacing.lg,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: spacing.sm,
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 14,
    lineHeight: 20,
  },
  list: {
    maxHeight: 400,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: radii.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    gap: spacing.md,
  },
  rowContent: {
    flex: 1,
  },
  deleteBtn: {
    padding: spacing.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rowPrimary: {
    fontSize: 15,
    fontWeight: '600',
  },
  rowDate: {
    fontSize: 11,
    marginTop: 2,
  },
});
