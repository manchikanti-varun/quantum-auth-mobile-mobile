/**
 * QSafe – Main app entry. Handles auth flow, app lock, modals, and routing.
 */
import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Alert, AppState, Linking } from 'react-native';
import * as ScreenCapture from 'expo-screen-capture';
import { v4 as uuidv4 } from 'uuid';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { useAuth } from './hooks/useAuth';
import { useAccounts } from './hooks/useAccounts';
import { useFolders } from './hooks/useFolders';
import { useMfa } from './hooks/useMfa';
import { deviceService } from './services/device';
import { qrParser } from './services/qrParser';
import * as Haptics from 'expo-haptics';
import { biometricService } from './services/biometric';
import { HomeScreen } from './components/HomeScreen';
import { AuthModal } from './components/AuthModal';
import { ScannerModal } from './components/ScannerModal';
import { MfaModal } from './components/MfaModal';
import { SettingsModal } from './components/SettingsModal';
import { ExportImportModal } from './components/ExportImportModal';
import { HistoryModal } from './components/HistoryModal';
import { FloatingActionButton } from './components/FloatingActionButton';
import { BiometricGate } from './components/BiometricGate';
import { AutoLockModal } from './components/AutoLockModal';
import { ProfileModal } from './components/ProfileModal';
import { FoldersModal } from './components/FoldersModal';
import { AppLockPromptModal } from './components/AppLockPromptModal';
import { storage } from './services/storage';
import { verifyPin } from './utils/pinHash';

function AppContent() {
  const [biometricUnlocked, setBiometricUnlocked] = useState(false);
  const [biometricChecking, setBiometricChecking] = useState(true);
  const [appLock, setAppLock] = useState(true);
  const [appLockConfig, setAppLockConfig] = useState(null);
  const [autoLockMinutes, setAutoLockMinutes] = useState(0);
  const [showAutoLockPicker, setShowAutoLockPicker] = useState(false);
  const lastActivityRef = useRef(Date.now());
  const [showAuth, setShowAuth] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [exportImportMode, setExportImportMode] = useState(null);
  const [historyMode, setHistoryMode] = useState(null);
  const [deviceId, setDeviceId] = useState(null);
  const [hasBiometric, setHasBiometric] = useState(false);
  const [showAppLockPrompt, setShowAppLockPrompt] = useState(false);
  const [showFolders, setShowFolders] = useState(false);
  const { theme } = useTheme();

  const { token, user, loading, login, register, logout, pendingMfa, cancelPendingMfa, loginWithOtp } = useAuth(deviceId, () => {
    setShowAuth(false);
  });

  const [mfaResolving, setMfaResolving] = useState(null); // 'approve' | 'deny' | null
  const { accounts, totpCodes, totpAdjacent, totpSecondsRemaining, addAccount, removeAccount, toggleFavorite, updateAccount, setLastUsed, reloadAccounts } = useAccounts();
  const { folders, addFolder, renameFolder, removeFolder, refreshFolders } = useFolders();
  const { pendingChallenge, resolveChallenge, checkForPendingChallenges } = useMfa(deviceId, token);

  const appState = useRef(AppState.currentState);
  const handleQrScanRef = useRef(null);

  useEffect(() => {
    (async () => {
      const lockConfig = await storage.getAppLock();
      setAppLockConfig(lockConfig);
      setAppLock(lockConfig?.enabled === true);
      const mins = await storage.getAutoLockMinutes();
      setAutoLockMinutes(mins);
    })();
  }, []);

  useEffect(() => {
    initializeApp();
  }, []);

  useEffect(() => {
    (async () => {
      const hb = await biometricService.hasBiometric();
      setHasBiometric(hb);
    })();
  }, []);

  useEffect(() => {
    const firstTime = token && !appLockConfig;
    const migration = token && appLockConfig?.enabled && !appLockConfig?.pinHash; // old users: enabled with biometric only
    if (firstTime || migration) setShowAppLockPrompt(true);
  }, [token, appLockConfig]);

  useEffect(() => {
    if (!appLock || biometricUnlocked) {
      ScreenCapture.preventScreenCaptureAsync?.().catch(() => {});
    } else {
      ScreenCapture.allowScreenCaptureAsync?.().catch(() => {});
    }
    return () => {
      ScreenCapture.allowScreenCaptureAsync?.().catch(() => {});
    };
  }, [appLock, biometricUnlocked]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (
        appState.current.match(/inactive|background/) &&
        nextState === 'active'
      ) {
        if (!appLock) {
          setBiometricUnlocked(true);
          return;
        }
        const elapsed = (Date.now() - lastActivityRef.current) / 60000;
        const shouldLock = autoLockMinutes > 0 && elapsed >= autoLockMinutes;
        if (shouldLock) setBiometricUnlocked(false);

        if (!biometricUnlocked) {
          setBiometricChecking(true);
          if (!hasBiometric) {
            setBiometricChecking(false);
            return; // BiometricGate shows PIN
          }
          biometricService
            .authenticate('Verify identity to continue')
            .then(({ success }) => {
              setBiometricChecking(false);
              if (success) {
                setBiometricUnlocked(true);
                lastActivityRef.current = Date.now();
              }
            });
        } else {
          lastActivityRef.current = Date.now();
        }
      } else if (nextState === 'active') {
        lastActivityRef.current = Date.now();
      } else if (nextState.match(/inactive|background/)) {
        lastActivityRef.current = Date.now();
      }
      appState.current = nextState;
    });
    return () => subscription?.remove();
  }, [appLock, autoLockMinutes, hasBiometric]);

  const initializeApp = async () => {
    const { deviceId: id } = await deviceService.ensureDeviceIdentity();
    setDeviceId(id);

    const lockConfig = await storage.getAppLock();
    setAppLockConfig(lockConfig);
    const useLock = lockConfig?.enabled === true;
    setAppLock(useLock);

    if (!useLock) {
      setBiometricChecking(false);
      setBiometricUnlocked(true);
      lastActivityRef.current = Date.now();
      return;
    }

    const hasBiometric = await biometricService.hasBiometric();
    if (!hasBiometric && !lockConfig?.pinHash) {
      setBiometricChecking(false);
      setBiometricUnlocked(true);
      return;
    }

    // No biometric: show PIN gate directly (don't call authenticate — it would auto-allow)
    if (!hasBiometric) {
      setBiometricChecking(false);
      return; // BiometricGate will show PIN
    }

    // Has biometric: try it first; on fail, BiometricGate shows with "Use PIN instead"
    const { success } = await biometricService.authenticate(
      'Verify identity to open QSafe',
    );
    setBiometricChecking(false);
    if (success) {
      setBiometricUnlocked(true);
      lastActivityRef.current = Date.now();
    }
  };

  const handleAppLockChange = async (enabled) => {
    if (enabled && !hasBiometric && !appLockConfig?.pinHash) {
      Alert.alert('Set PIN required', 'No biometric on this device. Set a PIN to enable app lock.', [{ text: 'OK' }]);
      return;
    }
    setAppLock(enabled);
    const config = await storage.getAppLock();
    await storage.saveAppLock({ ...config, enabled });
    setAppLockConfig({ ...config, enabled });
  };

  const handleAppLockPromptEnable = async (opts) => {
    const config = { enabled: true, pinHash: opts?.pinHash };
    await storage.saveAppLock(config);
    setAppLockConfig(config);
    setAppLock(true);
    setShowAppLockPrompt(false);
    if (opts?.pinHash) setBiometricUnlocked(true); // unlock after PIN set (first time or migration)
  };

  const handleAppLockPromptSkip = async () => {
    await storage.saveAppLock({ enabled: false });
    setAppLockConfig({ enabled: false });
    setAppLock(false);
    setShowAppLockPrompt(false);
  };

  const handlePinSetup = async (pinHash) => {
    const config = await storage.getAppLock();
    const next = { ...config, pinHash };
    await storage.saveAppLock(next);
    setAppLockConfig(next);
  };

  const handleAutoLockSelect = async (minutes) => {
    setAutoLockMinutes(minutes);
    await storage.saveAutoLockMinutes(minutes);
  };

  const handleExport = async () => {
    const accounts = await storage.getAccounts();
    return JSON.stringify(accounts, null, 2);
  };

  const handleImport = async (imported) => {
    const existing = await storage.getAccounts();
    const merged = [...existing];
    for (const a of imported) {
      const exists = merged.some((x) => x.issuer === a.issuer && x.label === a.label);
      if (!exists) {
        merged.push({
          ...a,
          id: a.id || uuidv4(),
          favorite: a.favorite ?? false,
          folder: a.folder ?? 'Personal',
          notes: a.notes ?? '',
          lastUsed: a.lastUsed ?? 0,
        });
      }
    }
    await storage.saveAccounts(merged);
    reloadAccounts?.();
  };

  const handleUnlock = async () => {
    setBiometricChecking(true);
    const { success } = await biometricService.authenticate(
      'Verify identity to open QSafe',
    );
    setBiometricChecking(false);
    if (success) setBiometricUnlocked(true);
  };

  const handlePinUnlock = async (pin) => {
    const config = await storage.getAppLock();
    const valid = await verifyPin(pin, config?.pinHash);
    if (valid) setBiometricUnlocked(true);
    else Alert.alert('Wrong PIN', 'Please try again.');
  };

  const handleLogin = async (email, password, rememberDevice = true) => {
    try {
      await login(email, password, rememberDevice);
    } catch (e) {
      // Error handled in hook
    }
  };

  const handleRegister = async (email, password, displayName, rememberDevice = true) => {
    try {
      await register(email, password, displayName, rememberDevice);
    } catch (e) {
      // Error handled in hook
    }
  };

  const handleQrScan = async (data, options) => {
    try {
      const parsed = qrParser.parseOtpauth(data);
      if (!parsed) return;

      const { issuer, label, secret } = parsed;
      const folder = options?.folder || 'Personal';

      const existingAccount = accounts.find(
        (acc) => acc.issuer === issuer && acc.label === label,
      );
      if (existingAccount) {
        Alert.alert(
          'Already added',
          `${issuer}: ${label} is already enrolled in your accounts.`,
        );
        return;
      }

      const account = {
        id: uuidv4(),
        issuer,
        label,
        secret: String(secret).trim().replace(/\s/g, ''),
        folder,
      };

      await addAccount(account);
      setShowScanner(false);
      Alert.alert(
        'Account added',
        `${label} added.`,
        [{ text: 'OK' }],
      );
    } catch (e) {
      if (__DEV__) console.warn('Add account error', e);
      if (e?.message?.includes('SecureStore') || e?.message?.includes('2048')) {
        Alert.alert('Storage full', 'Could not save. Remove an account or clear app data and try again.');
      } else {
        Alert.alert('Error', 'Could not add account. Try manual entry and paste the exact key from Google.');
      }
    }
  };

  handleQrScanRef.current = handleQrScan;

  useEffect(() => {
    const handleIncomingLink = (event) => {
      const url = event?.url ?? event;
      if (url && typeof url === 'string' && url.startsWith('otpauth://')) {
        handleQrScanRef.current?.(url);
      }
    };

    const subscription = Linking.addEventListener('url', handleIncomingLink);

    Linking.getInitialURL().then((url) => {
      if (url && url.startsWith('otpauth://')) {
        handleQrScanRef.current?.(url);
      }
    });

    return () => subscription.remove();
  }, []);

  const handleMfaApprove = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setMfaResolving('approve');
    try {
      await resolveChallenge('approved');
    } catch (e) {
      // Error shown in useMfa
    } finally {
      setMfaResolving(null);
    }
  };

  const handleMfaDeny = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setMfaResolving('deny');
    try {
      await resolveChallenge('denied');
    } catch (e) {
      // Error shown in useMfa
    } finally {
      setMfaResolving(null);
    }
  };

  const handleMfaDenySuspicious = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setMfaResolving('deny');
    try {
      await resolveChallenge('denied', true);
    } catch (e) {
      // Error shown in useMfa
    } finally {
      setMfaResolving(null);
    }
  };

  return (
    <>
      <StatusBar style={theme.colors.bg === '#05070d' ? 'light' : 'dark'} />
      <LinearGradient
        colors={theme.gradients.hero}
        style={styles.container}
      >
        <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
          {!appLock || biometricUnlocked ? (
            <>
          <HomeScreen
            token={token}
            user={user}
            accounts={accounts}
            totpCodes={totpCodes}
            totpAdjacent={totpAdjacent}
            totpSecondsRemaining={totpSecondsRemaining}
            onLogout={logout}
            onScanPress={() => setShowAuth(true)}
            onRemoveAccount={removeAccount}
            onSettingsPress={() => setShowSettings(true)}
            onToggleFavorite={toggleFavorite}
            updateAccount={updateAccount}
            setLastUsed={setLastUsed}
          />

          {token && (
            <FloatingActionButton
              onPress={async () => {
                const { success } = await biometricService.authenticate(
                  'Verify identity to add accounts',
                );
                if (success) setShowScanner(true);
                else Alert.alert('Authentication failed', 'Could not verify identity');
              }}
            />
          )}

          <AuthModal
            visible={showAuth}
            onClose={() => { setShowAuth(false); cancelPendingMfa(); }}
            onLogin={handleLogin}
            onRegister={handleRegister}
            loading={loading}
            pendingMfa={pendingMfa}
            onCancelPendingMfa={cancelPendingMfa}
            onLoginWithOtp={loginWithOtp}
          />

          <ScannerModal
            visible={showScanner}
            onClose={() => setShowScanner(false)}
            onScan={handleQrScan}
            folders={folders}
          />

          <SettingsModal
            visible={showSettings}
            onClose={() => setShowSettings(false)}
            user={user}
            onProfilePress={() => { setShowSettings(false); setShowProfile(true); }}
            appLock={appLock}
            onAppLockChange={handleAppLockChange}
            appLockConfig={appLockConfig}
            onPinSetup={handlePinSetup}
            hasBiometric={hasBiometric}
            onAutoLockChange={() => setShowAutoLockPicker(true)}
            autoLockMinutes={autoLockMinutes}
            onCheckMfa={token ? checkForPendingChallenges : undefined}
            onExportImport={(mode) => {
              if (mode === 'loginHistory' || mode === 'mfaHistory') {
                setHistoryMode(mode);
              } else {
                setExportImportMode(mode);
              }
            }}
            onFoldersPress={() => { setShowSettings(false); setShowFolders(true); }}
          />

          <FoldersModal
            visible={showFolders}
            onClose={() => setShowFolders(false)}
            folders={folders}
            accounts={accounts}
            addFolder={addFolder}
            renameFolder={renameFolder}
            removeFolder={removeFolder}
            updateAccount={updateAccount}
            refreshFolders={refreshFolders}
          />

          <AutoLockModal
            visible={showAutoLockPicker}
            currentMinutes={autoLockMinutes}
            onSelect={handleAutoLockSelect}
            onClose={() => setShowAutoLockPicker(false)}
          />

          <ProfileModal
            visible={showProfile}
            user={user}
            onClose={() => setShowProfile(false)}
          />

          <ExportImportModal
            visible={!!exportImportMode}
            mode={exportImportMode}
            onClose={() => setExportImportMode(null)}
            onExport={handleExport}
            onImport={handleImport}
          />

          <HistoryModal
            visible={!!historyMode}
            mode={historyMode}
            deviceId={deviceId}
            onClose={() => setHistoryMode(null)}
          />
            </>
          ) : (
            <BiometricGate
              onUnlock={handleUnlock}
              onPinUnlock={handlePinUnlock}
              loading={biometricChecking}
              hasPinFallback={!!appLockConfig?.pinHash}
              hasBiometric={hasBiometric}
            />
          )}

          {/* App lock setup: first time or migration (old users with biometric only) - shows on top of lock */}
          <AppLockPromptModal
            visible={showAppLockPrompt}
            hasBiometric={hasBiometric}
            isMigration={!!(appLockConfig?.enabled && !appLockConfig?.pinHash)}
            onEnable={handleAppLockPromptEnable}
            onSkip={handleAppLockPromptSkip}
          />

          {/* MFA approve/deny: show even when app locked (on top of lock screen) */}
          <MfaModal
            visible={!!pendingChallenge}
            challenge={pendingChallenge}
            onClose={() => {}}
            onApprove={handleMfaApprove}
            onDeny={handleMfaDeny}
            onDenySuspicious={handleMfaDenySuspicious}
            resolving={mfaResolving}
          />
        </SafeAreaView>
      </LinearGradient>
    </>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AppContent />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safe: {
    flex: 1,
  },
});
