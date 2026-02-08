/**
 * Settings modal. Profile, theme, app lock, folders, export/import, devices, activity.
 * @module components/SettingsModal
 */
import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  useWindowDimensions,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../context/ThemeContext';
import { useLayout } from '../hooks/useLayout';
import { PinPad } from './PinPad';
import { PasswordInput } from './ui';
import { hashPin } from '../utils/pinHash';
import { authApi, deviceApi } from '../services/api';
import { validatePassword } from '../utils/validation';
import { PASSWORD_REQUIREMENTS } from '../utils/validation';
import { spacing, radii } from '../constants/designTokens';
import { DEFAULT_FOLDERS } from '../constants/config';
import { AUTO_LOCK_OPTIONS } from '../constants/config';

const THEME_OPTIONS = [
  { id: 'light', icon: 'white-balance-sunny', label: 'Light' },
  { id: 'dark', icon: 'moon-waning-crescent', label: 'Dark' },
  { id: 'system', icon: 'cellphone', label: 'System' },
];

const SCREENS = {
  main: 'main',
  changePassword: 'changePassword',
  changePin: 'changePin',
  autoLock: 'autoLock',
  manageFolders: 'manageFolders',
  myDevices: 'myDevices',
};

export const SettingsModal = ({
  visible,
  onClose,
  user,
  appLock,
  onAppLockChange,
  onExportImport,
  appLockConfig,
  onPinSetup,
  onAutoLockSelect,
  autoLockMinutes,
  hasBiometric,
  onCheckMfa,
  folders: foldersProp = [],
  accounts = [],
  addFolder,
  renameFolder,
  removeFolder,
  updateAccount,
  refreshFolders,
  deviceId,
  onPreferencesChange,
}) => {
  const { theme, preference, setThemePreference } = useTheme();
  const { safeBottom } = useLayout();
  const { height: screenHeight } = useWindowDimensions();
  const [screen, setScreen] = useState(SCREENS.main);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwLoading, setPwLoading] = useState(false);

  const folders = Array.isArray(foldersProp) && foldersProp.length > 0 ? foldersProp : ['Personal', 'Work', 'Banking'];
  const [newFolderName, setNewFolderName] = useState('');
  const [editingFolder, setEditingFolder] = useState(null);
  const [editName, setEditName] = useState('');
  const [devices, setDevices] = useState([]);
  const [devicesLoading, setDevicesLoading] = useState(false);
  const [resetCodeInfo, setResetCodeInfo] = useState({ visible: false, code: null });

  const allowMultipleDevices = user?.preferences?.allowMultipleDevices ?? true;

  useEffect(() => {
    if (visible && screen === SCREENS.manageFolders) refreshFolders?.();
  }, [visible, screen]);

  useEffect(() => {
    if (visible && screen === SCREENS.myDevices && user?.uid) {
      setDevicesLoading(true);
      deviceApi.list()
        .then((res) => setDevices(res.data?.devices || []))
        .catch(() => setDevices([]))
        .finally(() => setDevicesLoading(false));
    }
  }, [visible, screen]);

  useEffect(() => {
    if (!visible) setScreen(SCREENS.main);
  }, [visible]);

  const goBack = () => setScreen(SCREENS.main);

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
    setPwLoading(true);
    try {
      await authApi.changePassword(currentPassword, newPassword);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Success', 'Password updated');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      goBack();
    } catch (err) {
      const msg = err?.response?.data?.message || 'Failed to change password';
      Alert.alert('Error', msg);
    } finally {
      setPwLoading(false);
    }
  };

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
    addFolder?.(name);
    setNewFolderName('');
  };

  const handleStartRename = (folder) => {
    if (DEFAULT_FOLDERS.includes(folder)) return;
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
    renameFolder?.(editingFolder, name);
    accounts.forEach((acc) => {
      if ((acc.folder || 'Personal') === editingFolder) {
        updateAccount?.(acc.id, { folder: name });
      }
    });
    setEditingFolder(null);
    setEditName('');
  };

  const handleRemoveFolder = (folderName) => {
    if (DEFAULT_FOLDERS.includes(folderName)) return;
    const count = getAccountCount(folderName);
    if (count === 0) {
      removeFolder?.(folderName);
      refreshFolders?.();
      return;
    }
    const otherFolders = folders.filter((f) => f !== folderName);
    if (otherFolders.length === 0) {
      Alert.alert('Cannot remove', 'Move accounts to another folder first.');
      return;
    }
    Alert.alert(
      `Remove "${folderName}"?`,
      `${count} account(s) will be moved to Personal. Continue?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            accounts.forEach((acc) => {
              if ((acc.folder || 'Personal') === folderName) {
                updateAccount?.(acc.id, { folder: 'Personal' });
              }
            });
            removeFolder?.(folderName);
            refreshFolders?.();
          },
        },
      ]
    );
  };

  const getHeaderIcon = () => {
    switch (screen) {
      case SCREENS.changePassword: return 'lock-reset';
      case SCREENS.changePin: return 'numeric';
      case SCREENS.autoLock: return 'clock-outline';
      case SCREENS.manageFolders: return 'folder-multiple';
      case SCREENS.myDevices: return 'cellphone-link';
      default: return 'cog';
    }
  };

  const headerTitle = {
    [SCREENS.main]: 'Settings',
    [SCREENS.changePassword]: 'Change password',
    [SCREENS.changePin]: appLockConfig?.pinHash ? 'Change PIN' : 'Set PIN',
    [SCREENS.autoLock]: 'Auto-lock',
    [SCREENS.manageFolders]: 'Manage folders',
    [SCREENS.myDevices]: 'My devices',
  }[screen];

  const headerSubtitle = {
    [SCREENS.main]: 'Preferences & security',
    [SCREENS.changePassword]: 'Update your password',
    [SCREENS.changePin]: '6-digit PIN',
    [SCREENS.autoLock]: 'Lock after inactivity',
    [SCREENS.manageFolders]: 'Organize your accounts',
    [SCREENS.myDevices]: 'Devices linked to your account',
  }[screen];

  const sheetHeight = Math.min(screenHeight * 0.92, 720);
  const padBottom = Math.max(safeBottom, 20) + spacing.lg;

  const Row = ({ icon, label, onPress, right, children }) => (
    <TouchableOpacity
      style={[s.row, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
      onPress={onPress}
      activeOpacity={0.7}
      disabled={!onPress}
    >
      {icon && <MaterialCommunityIcons name={icon} size={22} color={theme.colors.accent} style={s.rowIcon} />}
      <View style={s.rowBody}>
        {children || <Text style={[s.rowLabel, { color: theme.colors.text }]}>{label}</Text>}
      </View>
      {right}
    </TouchableOpacity>
  );

  const Section = ({ title, children }) => (
    <View style={s.section}>
      <Text style={[s.sectionTitle, { color: theme.colors.textMuted }]}>{title}</Text>
      {children}
    </View>
  );

  const renderMain = () => (
    <ScrollView
      style={s.scroll}
      contentContainerStyle={[s.scrollContent, { paddingBottom: padBottom }]}
      showsVerticalScrollIndicator={false}
    >
      <Section title="Account">
        {user?.email && (
          <View style={[s.row, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            <MaterialCommunityIcons name="email-outline" size={22} color={theme.colors.textMuted} style={s.rowIcon} />
            <View style={s.rowBody}>
              <Text style={[s.rowLabel, { color: theme.colors.text }]}>{user.email}</Text>
            </View>
          </View>
        )}
        <Row
          icon="cellphone-link"
          label="My devices"
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setScreen(SCREENS.myDevices); }}
          right={<MaterialCommunityIcons name="chevron-right" size={22} color={theme.colors.textMuted} />}
        />
        <View style={[s.row, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
          <MaterialCommunityIcons name="phone-sync" size={22} color={theme.colors.accent} style={s.rowIcon} />
          <View style={s.rowBody}>
            <Text style={[s.rowLabel, { color: theme.colors.text }]}>Allow multiple devices</Text>
          </View>
          <TouchableOpacity
            style={[s.toggle, { backgroundColor: allowMultipleDevices ? theme.colors.accent : theme.colors.surface }]}
            onPress={async () => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              try {
                await authApi.updatePreferences({ allowMultipleDevices: !allowMultipleDevices });
                onPreferencesChange?.();
              } catch (e) {
                Alert.alert('Error', e?.response?.data?.message || 'Could not update');
              }
            }}
          >
            <View style={[s.toggleKnob, { backgroundColor: theme.colors.text }, allowMultipleDevices && s.toggleKnobOn]} />
          </TouchableOpacity>
        </View>
        <Row
          icon="lock-reset"
          label="Change password"
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setScreen(SCREENS.changePassword); }}
          right={<MaterialCommunityIcons name="chevron-right" size={22} color={theme.colors.textMuted} />}
        />
      </Section>

      <Section title="Appearance">
        {THEME_OPTIONS.map((opt) => {
          const isSelected = preference === opt.id;
          return (
            <TouchableOpacity
              key={opt.id}
              style={[s.row, { backgroundColor: theme.colors.surface, borderColor: isSelected ? theme.colors.accent : theme.colors.border }, isSelected && { borderWidth: 2 }]}
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setThemePreference(opt.id); }}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons name={opt.icon} size={22} color={isSelected ? theme.colors.accent : theme.colors.textMuted} style={s.rowIcon} />
              <View style={s.rowBody}>
                <Text style={[s.rowLabel, { color: theme.colors.text }]}>{opt.label}</Text>
              </View>
              {isSelected && <MaterialCommunityIcons name="check-circle" size={24} color={theme.colors.accent} />}
            </TouchableOpacity>
          );
        })}
      </Section>

      {appLock !== undefined && (
        <Section title="Security">
          <View style={[s.row, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            <MaterialCommunityIcons name="fingerprint" size={22} color={theme.colors.accent} style={s.rowIcon} />
            <View style={s.rowBody}>
              <Text style={[s.rowLabel, { color: theme.colors.text }]}>App lock {hasBiometric ? '(biometric)' : '(PIN)'}</Text>
            </View>
            <TouchableOpacity
              style={[s.toggle, { backgroundColor: appLock ? theme.colors.accent : theme.colors.surface }]}
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onAppLockChange?.(!appLock); }}
            >
              <View style={[s.toggleKnob, { backgroundColor: theme.colors.text }, appLock && s.toggleKnobOn]} />
            </TouchableOpacity>
          </View>
          {appLock && (
            <>
              <Row
                icon="numeric"
                label={appLockConfig?.pinHash ? 'Change PIN' : 'Set PIN'}
                onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setScreen(SCREENS.changePin); }}
                right={<MaterialCommunityIcons name="chevron-right" size={22} color={theme.colors.textMuted} />}
              />
              <Row
                icon="clock-outline"
                label={`Auto-lock: ${autoLockMinutes === 0 ? 'Never' : `${autoLockMinutes} min`}`}
                onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setScreen(SCREENS.autoLock); }}
                right={<MaterialCommunityIcons name="chevron-right" size={22} color={theme.colors.textMuted} />}
              />
            </>
          )}
        </Section>
      )}

      <Section title="Data">
        <Row
          icon="folder-edit"
          label="Manage folders"
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setScreen(SCREENS.manageFolders); }}
          right={<MaterialCommunityIcons name="chevron-right" size={22} color={theme.colors.textMuted} />}
        />
        <Row
          icon="export"
          label="Export accounts"
          onPress={() => onExportImport?.('export')}
          right={<MaterialCommunityIcons name="chevron-right" size={22} color={theme.colors.textMuted} />}
        />
        <Row
          icon="import"
          label="Import accounts"
          onPress={() => onExportImport?.('import')}
          right={<MaterialCommunityIcons name="chevron-right" size={22} color={theme.colors.textMuted} />}
        />
      </Section>

      <Section title="Activity">
        {onCheckMfa && (
          <Row
            icon="cellphone-check"
            label="Check for login requests"
            onPress={() => onCheckMfa()}
            right={<MaterialCommunityIcons name="chevron-right" size={22} color={theme.colors.textMuted} />}
          />
        )}
        <Row
          icon="history"
          label="Login history"
          onPress={() => onExportImport?.('loginHistory')}
          right={<MaterialCommunityIcons name="chevron-right" size={22} color={theme.colors.textMuted} />}
        />
        <Row
          icon="shield-check"
          label="MFA history"
          onPress={() => onExportImport?.('mfaHistory')}
          right={<MaterialCommunityIcons name="chevron-right" size={22} color={theme.colors.textMuted} />}
        />
        <Row
          icon="key-plus"
          label="Generate password reset code"
          onPress={async () => {
            try {
              const res = await authApi.requestPasswordResetCode(deviceId);
              const code = res.data?.code;
              if (code) setResetCodeInfo({ visible: true, code });
            } catch (e) {
              const msg = e?.response?.data?.message || 'Could not generate code';
              Alert.alert(
                e?.response?.status === 403 ? 'Use primary device' : 'Error',
                msg
              );
            }
          }}
          right={<MaterialCommunityIcons name="chevron-right" size={22} color={theme.colors.textMuted} />}
        />
      </Section>
    </ScrollView>
  );

  const renderChangePassword = () => (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={s.flex}>
      <ScrollView style={s.flex} keyboardShouldPersistTaps="handled" contentContainerStyle={s.panelPad} showsVerticalScrollIndicator={false}>
        <View style={[s.row, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
          <MaterialCommunityIcons name="email-outline" size={22} color={theme.colors.textMuted} style={s.rowIcon} />
          <View style={s.rowBody}>
            <Text style={[s.rowLabel, { color: theme.colors.text }]}>{user?.email || '—'}</Text>
          </View>
        </View>
        <View style={[s.hintRow, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
          <MaterialCommunityIcons name="information-outline" size={20} color={theme.colors.accent} />
          <Text style={[s.hintText, { color: theme.colors.textSecondary }]}>Enter current password, then choose a new one.</Text>
        </View>
        <PasswordInput label="Current password" placeholder="Enter current password" value={currentPassword} onChangeText={setCurrentPassword} />
        <PasswordInput label="New password" placeholder="Min 8 chars, upper, lower, number, symbol" value={newPassword} onChangeText={setNewPassword} hint={PASSWORD_REQUIREMENTS} />
        <PasswordInput label="Confirm new password" placeholder="Re-enter new password" value={confirmPassword} onChangeText={setConfirmPassword} />
        <TouchableOpacity
          style={[s.btn, { backgroundColor: theme.colors.accent }]}
          onPress={handleChangePassword}
          disabled={pwLoading}
        >
          {pwLoading ? <ActivityIndicator color={theme.colors.text} /> : <Text style={[s.btnText, { color: theme.colors.text }]}>Update password</Text>}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );

  const renderChangePin = () => (
    <ScrollView style={s.flex} contentContainerStyle={s.panelPad} showsVerticalScrollIndicator={false}>
      <View style={[s.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, borderWidth: 1 }]}>
        <PinPad
          title={appLockConfig?.pinHash ? 'Change PIN (6 digits)' : 'Set PIN (6 digits)'}
          mode="setup"
          minLength={6}
          onComplete={async (pin) => {
            const hashed = await hashPin(pin);
            if (hashed) onPinSetup?.(hashed);
            goBack();
          }}
          onCancel={goBack}
        />
      </View>
    </ScrollView>
  );

  const renderAutoLock = () => (
    <ScrollView style={s.flex} contentContainerStyle={s.panelPad} showsVerticalScrollIndicator={false}>
      <View style={[s.hintRow, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
        <MaterialCommunityIcons name="information-outline" size={20} color={theme.colors.accent} />
        <Text style={[s.hintText, { color: theme.colors.textSecondary }]}>Lock the app after this much inactivity.</Text>
      </View>
      {AUTO_LOCK_OPTIONS.map((opt) => {
        const isSelected = autoLockMinutes === opt.value;
        return (
          <TouchableOpacity
            key={opt.value}
            style={[s.row, { backgroundColor: theme.colors.surface, borderColor: isSelected ? theme.colors.accent : theme.colors.border }, isSelected && { borderWidth: 2 }]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onAutoLockSelect?.(opt.value);
              goBack();
            }}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons name={opt.icon} size={22} color={isSelected ? theme.colors.accent : theme.colors.textMuted} style={s.rowIcon} />
            <View style={s.rowBody}>
              <Text style={[s.rowLabel, { color: theme.colors.text }]}>{opt.label}</Text>
            </View>
            {isSelected && <MaterialCommunityIcons name="check-circle" size={24} color={theme.colors.accent} />}
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );

  const renderManageFolders = () => (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={s.flex}>
        <ScrollView style={s.flex} keyboardShouldPersistTaps="handled" contentContainerStyle={s.panelPad} showsVerticalScrollIndicator={false}>
          <View style={[s.row, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, flexDirection: 'column', alignItems: 'stretch' }]}>
            <Text style={[s.sectionTitle, { color: theme.colors.textMuted, marginBottom: spacing.sm }]}>Add folder</Text>
            <View style={s.addRow}>
              <TextInput
                style={[s.input, { backgroundColor: theme.colors.bgElevated, borderColor: theme.colors.border, color: theme.colors.text }]}
                placeholder="Folder name"
                placeholderTextColor={theme.colors.textMuted}
                value={newFolderName}
                onChangeText={setNewFolderName}
                onSubmitEditing={handleAddFolder}
              />
              <TouchableOpacity style={[s.addBtn, { backgroundColor: theme.colors.accent }]} onPress={handleAddFolder}>
                <Text style={[s.addBtnText, { color: theme.colors.onAccent }]}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>
          <Text style={[s.sectionTitle, { color: theme.colors.textMuted }]}>Your folders</Text>
          {folders.map((f) => (
            <View key={f} style={[s.row, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
              {editingFolder === f ? (
                <View style={s.editRow}>
                  <TextInput
                    style={[s.input, s.editInput, { backgroundColor: theme.colors.bgElevated, borderColor: theme.colors.border, color: theme.colors.text }]}
                    value={editName}
                    onChangeText={setEditName}
                    autoFocus
                  />
                  <TouchableOpacity style={[s.iconBtn, { backgroundColor: theme.colors.success }]} onPress={handleSaveRename}>
                    <MaterialCommunityIcons name="check" size={20} color={theme.colors.text} />
                  </TouchableOpacity>
                  <TouchableOpacity style={[s.iconBtn, { backgroundColor: theme.colors.surface }]} onPress={() => { setEditingFolder(null); setEditName(''); }}>
                    <MaterialCommunityIcons name="close" size={20} color={theme.colors.textMuted} />
                  </TouchableOpacity>
                </View>
              ) : (
                <>
                  <MaterialCommunityIcons name={DEFAULT_FOLDERS.includes(f) ? 'folder' : 'folder-outline'} size={22} color={theme.colors.accent} style={s.rowIcon} />
                  <View style={[s.rowBody, { flex: 1 }]}>
                    <Text style={[s.rowLabel, { color: theme.colors.text, flex: 1 }]} numberOfLines={1}>{f}</Text>
                    <View style={[s.badge, { backgroundColor: theme.colors.bgCard }]}>
                      <Text style={[s.badgeText, { color: theme.colors.textMuted }]}>{getAccountCount(f)}</Text>
                    </View>
                  </View>
                  {!DEFAULT_FOLDERS.includes(f) && (
                    <View style={s.rowActions}>
                      <TouchableOpacity onPress={() => handleStartRename(f)} hitSlop={8}>
                        <MaterialCommunityIcons name="pencil" size={20} color={theme.colors.textMuted} />
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => handleRemoveFolder(f)} hitSlop={8}>
                        <MaterialCommunityIcons name="delete-outline" size={20} color={theme.colors.error} />
                      </TouchableOpacity>
                    </View>
                  )}
                </>
              )}
            </View>
          ))}
        </ScrollView>
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );

  const renderMyDevices = () => (
    <ScrollView
      style={s.scroll}
      contentContainerStyle={[s.scrollContent, { paddingBottom: padBottom }]}
      showsVerticalScrollIndicator={false}
    >
      <Section title="Account">
        {user?.email && (
          <View style={[s.row, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            <MaterialCommunityIcons name="email-outline" size={22} color={theme.colors.textMuted} style={s.rowIcon} />
            <View style={s.rowBody}>
              <Text style={[s.rowLabel, { color: theme.colors.text }]}>{user.email}</Text>
            </View>
          </View>
        )}
      </Section>
      <Section title="Devices">
        <View style={[s.hintRow, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
          <MaterialCommunityIcons name="information-outline" size={20} color={theme.colors.accent} />
          <Text style={[s.hintText, { color: theme.colors.textSecondary }]}>
            Each device has a unique ID. Device 1 receives login approval requests.
          </Text>
        </View>
        {devicesLoading ? (
          <View style={{ padding: 24, alignItems: 'center' }}>
            <ActivityIndicator size="small" color={theme.colors.accent} />
          </View>
        ) : (
          devices.map((d) => {
            const isCurrent = d.deviceId === deviceId;
            return (
              <View
                key={d.deviceId}
                style={[s.row, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
              >
                <MaterialCommunityIcons
                  name={d.deviceNumber === 1 ? 'cellphone-check' : 'cellphone'}
                  size={22}
                  color={d.deviceNumber === 1 ? theme.colors.accent : theme.colors.textMuted}
                  style={s.rowIcon}
                />
                <View style={[s.rowBody, { flexDirection: 'column', alignItems: 'flex-start' }]}>
                  <Text style={[s.rowLabel, { color: theme.colors.text }]}>
                    Device {d.deviceNumber} {isCurrent && '(this device)'}
                  </Text>
                  <Text style={[s.hintText, { color: theme.colors.textSecondary, marginTop: 2, fontSize: 12 }]} numberOfLines={1}>
                    {d.deviceId}
                  </Text>
                  {d.platform && (
                    <Text style={[s.hintText, { color: theme.colors.textMuted, fontSize: 11 }]}>{d.platform}</Text>
                  )}
                </View>
                {d.deviceNumber === 1 && (
                  <View style={[s.badge, { backgroundColor: theme.colors.accent + '30' }]}>
                    <Text style={[s.badgeText, { color: theme.colors.accent }]}>Primary</Text>
                  </View>
                )}
              </View>
            );
          })
        )}
      </Section>
    </ScrollView>
  );

  const renderContent = () => {
    switch (screen) {
      case SCREENS.changePassword: return renderChangePassword();
      case SCREENS.changePin: return renderChangePin();
      case SCREENS.autoLock: return renderAutoLock();
      case SCREENS.manageFolders: return renderManageFolders();
      case SCREENS.myDevices: return renderMyDevices();
      default: return renderMain();
    }
  };

  if (!visible) return null;

  return (
    <>
    <Modal visible animationType="slide" transparent onRequestClose={onClose} statusBarTranslucent>
      <View style={[s.overlay, { backgroundColor: theme.colors.overlay }]}>
        <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={screen === SCREENS.main ? onClose : goBack} />
        <View style={[s.sheetWrapper, { backgroundColor: theme.colors.bgElevated }]}>
          <View style={[s.sheet, { height: sheetHeight }]}>
            <View style={s.header}>
              <View style={s.headerLeft}>
                {screen !== SCREENS.main && (
                  <TouchableOpacity onPress={goBack} style={[s.iconBtn, { backgroundColor: theme.colors.surface }]} hitSlop={8}>
                    <MaterialCommunityIcons name="arrow-left" size={22} color={theme.colors.textSecondary} />
                  </TouchableOpacity>
                )}
                <View style={[s.headerIcon, { backgroundColor: theme.colors.surface }]}>
                  <MaterialCommunityIcons name={getHeaderIcon()} size={24} color={theme.colors.accent} />
                </View>
                <View>
                  <Text style={[s.headerTitle, { color: theme.colors.text }]}>{headerTitle}</Text>
                  <Text style={[s.headerSub, { color: theme.colors.textMuted }]}>{headerSubtitle}</Text>
                </View>
              </View>
              <TouchableOpacity onPress={onClose} style={[s.iconBtn, { backgroundColor: theme.colors.surface }]} hitSlop={8}>
                <MaterialCommunityIcons name="close" size={22} color={theme.colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <View style={s.contentArea}>
              {renderContent()}
            </View>
          </View>
          <View style={[s.bottomFill, { backgroundColor: theme.colors.bgElevated, minHeight: Math.max(safeBottom, 40) + 24 }]} />
        </View>
      </View>
    </Modal>

    <Modal visible={resetCodeInfo.visible} animationType="fade" transparent onRequestClose={() => setResetCodeInfo({ visible: false, code: null })}>
      <View style={[s.resetCodeOverlay, { backgroundColor: theme.colors.overlay }]}>
        <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={() => setResetCodeInfo({ visible: false, code: null })} />
        <View style={[s.resetCodeDialog, { backgroundColor: theme.colors.bgCard, borderColor: theme.colors.border }]}>
          <Text style={[s.resetCodeTitle, { color: theme.colors.text }]}>Reset code</Text>
          <Text style={[s.resetCodeBody, { color: theme.colors.textSecondary }]}>
            Use this code on the device where you forgot your password.
          </Text>
          <Text style={[s.resetCodeCode, { color: theme.colors.accent }]}>{resetCodeInfo.code}</Text>
          <Text style={[s.resetCodeHint, { color: theme.colors.textMuted }]}>Valid for 10 minutes.</Text>
          <TouchableOpacity
            style={[s.resetCodeOk, { backgroundColor: theme.colors.accent }]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setResetCodeInfo({ visible: false, code: null });
            }}
          >
            <Text style={[s.resetCodeOkText, { color: theme.colors.onAccent }]}>OK</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
    </>
  );
};

const s = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
  },
  sheetWrapper: {
    width: '100%',
    borderTopLeftRadius: radii.xxl,
    borderTopRightRadius: radii.xxl,
    overflow: 'hidden',
  },
  sheet: {
    width: '100%',
    overflow: 'hidden',
    paddingHorizontal: spacing.xl,
  },
  bottomFill: {
    width: '100%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.lg,
    paddingHorizontal: 0,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  headerIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  headerSub: {
    fontSize: 13,
    marginTop: 2,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentArea: {
    flex: 1,
    minHeight: 0,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing.xl,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: radii.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
  },
  rowIcon: {
    marginRight: spacing.md,
  },
  rowBody: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  rowLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  rowActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  toggle: {
    width: 48,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    padding: 2,
  },
  toggleKnob: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  toggleKnobOn: {
    alignSelf: 'flex-end',
  },
  flex: {
    flex: 1,
    minHeight: 0,
  },
  panelPad: {
    paddingBottom: spacing.xxl,
  },
  hint: {
    fontSize: 14,
    marginBottom: spacing.lg,
    lineHeight: 20,
  },
  hintRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: spacing.md,
    borderRadius: radii.md,
    marginBottom: spacing.lg,
    borderWidth: 1,
    gap: spacing.md,
  },
  hintText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  btn: {
    minHeight: 52,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.md,
  },
  btnText: {
    fontSize: 16,
    fontWeight: '700',
  },
  card: {
    padding: spacing.xl,
    borderRadius: radii.lg,
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
  editInput: {
    flex: 1,
    minWidth: 0,
  },
  editRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
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
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radii.sm,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  resetCodeOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  resetCodeDialog: {
    width: '100%',
    maxWidth: 320,
    borderRadius: radii.lg,
    padding: spacing.xl,
    borderWidth: 1,
  },
  resetCodeTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: spacing.md,
  },
  resetCodeBody: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: spacing.md,
  },
  resetCodeCode: {
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: 4,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  resetCodeHint: {
    fontSize: 13,
    marginBottom: spacing.lg,
  },
  resetCodeOk: {
    paddingVertical: spacing.md,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resetCodeOkText: {
    fontSize: 16,
    fontWeight: '700',
  },
});
