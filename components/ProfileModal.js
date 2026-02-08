/**
 * Profile modal. User info, change password.
 * @module components/ProfileModal
 */
import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
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
import { Input, PasswordInput } from './ui';
import { authApi } from '../services/api';
import { validatePassword } from '../utils/validation';
import { themeDark } from '../constants/themes';
import { spacing, radii } from '../constants/designTokens';

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
    const pwResult = validatePassword(newPassword);
    if (!pwResult.valid) {
      Alert.alert('Invalid', pwResult.message);
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
      <View style={[styles.overlay, { backgroundColor: theme.colors.bgElevated }]}>
        <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onClose} />
        <View style={[styles.content, { backgroundColor: theme.colors.bgElevated }]}>
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={[styles.headerIconWrap, { backgroundColor: theme.colors.surface }]}>
                <MaterialCommunityIcons name="account-circle-outline" size={28} color={theme.colors.accent} />
              </View>
              <View>
                <Text style={[styles.title, { color: theme.colors.text }]}>Profile</Text>
                <Text style={[styles.headerSubtitle, { color: theme.colors.textMuted }]}>Manage your account</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={12} style={[styles.closeButton, { backgroundColor: theme.colors.surface }]}>
              <MaterialCommunityIcons name="close" size={22} color={theme.colors.textSecondary} />
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
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Account</Text>
              <View style={[styles.emailRow, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
                <MaterialCommunityIcons name="email-outline" size={20} color={theme.colors.textMuted} />
                <Text style={[styles.emailText, { color: theme.colors.text }]}>{user?.email || '—'}</Text>
              </View>

              <Text style={[styles.sectionTitle, styles.labelSection, { color: theme.colors.text }]}>Change password</Text>
              <Text style={[styles.sectionDesc, { color: theme.colors.textMuted }]}>
                Enter your current password, then choose a new one.
              </Text>
              <PasswordInput
                label="Current password"
                placeholder="Enter your current password"
                value={currentPassword}
                onChangeText={setCurrentPassword}
              />
              <PasswordInput
                label="New password"
                placeholder="Min 8 chars, upper, lower, number, symbol"
                value={newPassword}
                onChangeText={setNewPassword}
                hint="Use a strong password you don't use elsewhere"
              />
              <PasswordInput
                label="Confirm new password"
                placeholder="Re-enter your new password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
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
    justifyContent: 'flex-end',
  },
  content: {
    borderTopLeftRadius: radii.xxl,
    borderTopRightRadius: radii.xxl,
    padding: spacing.xl,
    paddingBottom: spacing.xxl + 8,
    maxHeight: '95%',
    minHeight: 520,
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
    width: 48,
    height: 48,
    borderRadius: radii.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
  },
  headerSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  closeButton: {
    padding: spacing.sm,
    borderRadius: radii.sm,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: spacing.sm,
  },
  sectionDesc: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: spacing.md,
  },
  labelSection: {
    marginTop: spacing.xl,
  },
  keyboardAvoid: {
    flex: 1,
    minHeight: 0,
  },
  scrollView: {
    flex: 1,
    minHeight: 0,
  },
  scrollContent: {
    paddingBottom: 40,
    flexGrow: 1,
  },
  input: {
    borderRadius: radii.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderWidth: 1,
    fontSize: 16,
    marginBottom: spacing.md,
  },
  emailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  emailText: {
    fontSize: 16,
    flex: 1,
  },
  button: {
    paddingVertical: spacing.lg,
    borderRadius: radii.md,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '700',
  },
});
