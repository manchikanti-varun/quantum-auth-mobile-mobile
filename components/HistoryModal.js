/**
 * HistoryModal – Login history or MFA history from backend.
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
import { themeDark } from '../constants/themes';

const formatDate = (iso) => {
  try {
    const d = new Date(iso);
    return d.toLocaleString();
  } catch (e) {
    return iso;
  }
};

const maskIp = (ip) => {
  if (!ip || typeof ip !== 'string') return '—';
  const parts = ip.trim().split('.');
  if (parts.length === 4) return `${parts[0]}.***.***.${parts[3]}`;
  if (ip.includes(':')) return '***'; // IPv6
  return '***';
};

export const HistoryModal = ({ visible, mode, onClose }) => {
  const { theme } = useTheme();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!visible || !mode) return;
    setLoading(true);
    setError(null);
    const fetch = mode === 'loginHistory' ? authApi.getLoginHistory : mfaApi.getHistory;
    fetch()
      .then((res) => setItems(res.data?.history || []))
      .catch((e) => setError(e?.response?.data?.message || 'Failed to load'))
      .finally(() => setLoading(false));
  }, [visible, mode]);

  if (!visible) return null;

  const title = mode === 'loginHistory' ? 'Login history' : 'MFA history';

  return (
    <Modal visible animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onClose} />
        <View style={[styles.content, { backgroundColor: theme.colors.bgElevated }]}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: theme.colors.text }]}>{title}</Text>
            <TouchableOpacity onPress={onClose} hitSlop={12}>
              <MaterialCommunityIcons name="close" size={24} color={theme.colors.textMuted} />
            </TouchableOpacity>
          </View>

          {loading ? (
            <ActivityIndicator size="large" color={theme.colors.accent} style={styles.spinner} />
          ) : error ? (
            <Text style={[styles.error, { color: theme.colors.error }]}>{error}</Text>
          ) : items.length === 0 ? (
            <Text style={[styles.empty, { color: theme.colors.textMuted }]}>No history yet</Text>
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
                    <Text style={[styles.rowSecondary, { color: theme.colors.textMuted }]}>
                      {item.ip ? `· ${maskIp(item.ip)}` : '· —'}
                    </Text>
                    <Text style={[styles.rowDate, { color: theme.colors.textMuted }]}>{formatDate(item.timestamp)}</Text>
                  </View>
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
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  content: {
    maxHeight: '70%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: themeDark.spacing.lg,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
  },
  spinner: {
    marginVertical: 40,
  },
  error: {
    textAlign: 'center',
    padding: 20,
  },
  empty: {
    textAlign: 'center',
    padding: 20,
  },
  list: {
    maxHeight: 400,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    gap: 12,
  },
  rowContent: {
    flex: 1,
  },
  rowPrimary: {
    fontSize: 15,
    fontWeight: '600',
  },
  rowSecondary: {
    fontSize: 13,
    marginTop: 2,
  },
  rowDate: {
    fontSize: 11,
    marginTop: 2,
  },
});
