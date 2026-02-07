/**
 * ProfileModal – Email (read-only), change password form.
 */
import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../context/ThemeContext';
import { authApi } from '../services/api';
import { themeDark } from '../constants/themes';

export const ProfileModal = ({ visible, user, onClose, onPasswordChanged }) => {
  const { theme } = useTheme();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert('Required', 'Fill in all fields');
      return;
    }
    if (newPassword.length < 8) {
      Alert.alert('Invalid', 'New password must be at least 8 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Mismatch', 'New password and confirm do not match');
      return;
    }
    setLoading(true);
    try {
      await authApi.changePassword(currentPassword, newPassword);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Success', 'Password updated');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      onPasswordChanged?.();
      onClose?.();
    } catch (err) {
      const msg = err?.response?.data?.message || 'Failed to change password';
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onClose} />
        <View style={[styles.content, { backgroundColor: theme.colors.bgElevated }]}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: theme.colors.text }]}>Profile</Text>
            <TouchableOpacity onPress={onClose} hitSlop={12}>
              <Text style={[styles.close, { color: theme.colors.textMuted }]}>×</Text>
            </TouchableOpacity>
          </View>

          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.keyboardAvoid}
          >
            <ScrollView
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={true}
              contentContainerStyle={styles.scrollContent}
              style={styles.scrollView}
            >
              <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Email</Text>
              <View style={[styles.emailRow, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
                <MaterialCommunityIcons name="email-outline" size={20} color={theme.colors.textMuted} />
                <Text style={[styles.emailText, { color: theme.colors.text }]}>{user?.email || '—'}</Text>
              </View>

              <Text style={[styles.label, styles.labelSection, { color: theme.colors.textSecondary }]}>Change password</Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, color: theme.colors.text }]}
                placeholder="Current password"
                placeholderTextColor={theme.colors.textMuted}
                value={currentPassword}
                onChangeText={setCurrentPassword}
                secureTextEntry
                autoCapitalize="none"
              />
              <TextInput
                style={[styles.input, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, color: theme.colors.text }]}
                placeholder="New password (min 8 chars)"
                placeholderTextColor={theme.colors.textMuted}
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry
                autoCapitalize="none"
              />
              <TextInput
                style={[styles.input, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, color: theme.colors.text }]}
                placeholder="Confirm new password"
                placeholderTextColor={theme.colors.textMuted}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                autoCapitalize="none"
              />
              <TouchableOpacity
                style={[styles.button, { backgroundColor: theme.colors.accent }]}
                onPress={handleChangePassword}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color={theme.colors.bg} />
                ) : (
                  <Text style={[styles.buttonText, { color: theme.colors.bg }]}>Update password</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </KeyboardAvoidingView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-start',
  },
  content: {
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: themeDark.spacing.xl,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
  },
  close: {
    fontSize: 28,
    fontWeight: '300',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: themeDark.spacing.sm,
  },
  labelSection: {
    marginTop: themeDark.spacing.xl,
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  input: {
    borderRadius: themeDark.radii.md,
    paddingHorizontal: themeDark.spacing.lg,
    paddingVertical: themeDark.spacing.md,
    borderWidth: 1,
    fontSize: 16,
    marginBottom: themeDark.spacing.md,
  },
  emailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: themeDark.spacing.lg,
    paddingVertical: themeDark.spacing.md,
    borderRadius: themeDark.radii.md,
    borderWidth: 1,
    marginBottom: themeDark.spacing.md,
    gap: themeDark.spacing.sm,
  },
  emailText: {
    fontSize: 16,
    flex: 1,
  },
  button: {
    paddingVertical: themeDark.spacing.lg,
    borderRadius: themeDark.radii.md,
    alignItems: 'center',
    marginTop: themeDark.spacing.md,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '700',
  },
});
