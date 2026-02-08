/**
 * QSafe Mobile – Main application component.
 * Orchestrates authentication, app lock, biometric gate, modals, and screen routing.
 * Wraps content in ThemeProvider, ToastProvider, and SafeAreaProvider.
 * @module App
 */
import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Alert, AppState, Linking } from 'react-native';
import { v4 as uuidv4 } from 'uuid';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { usePreventScreenCapture } from 'expo-screen-capture';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { ToastProvider, useToast } from './context/ToastContext';
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
import { AppLockPromptModal } from './components/AppLockPromptModal';
import { IntroModal } from './components/IntroModal';
import { storage } from './services/storage';
import { verifyPin } from './utils/pinHash';

function AppContent() {
  usePreventScreenCapture();
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
  const [exportImportMode, setExportImportMode] = useState(null);
  const [historyMode, setHistoryMode] = useState(null);
  const [deviceId, setDeviceId] = useState(null);
  const [hasBiometric, setHasBiometric] = useState(false);
  const [showAppLockPrompt, setShowAppLockPrompt] = useState(false);
  const [showIntro, setShowIntro] = useState(null);
  const [sessionTimeoutDays, setSessionTimeoutDays] = useState(90);
  const { theme, isDark } = useTheme();
  const { showToast } = useToast();

  useEffect(() => {
    (async () => {
      const seen = await storage.getIntroSeen();
      setShowIntro(!seen);
    })();
  }, []);

  const { token, user, loading, login, register, logout, pendingMfa, cancelPendingMfa, loginWithOtp, refreshUser, recordLastActivity } = useAuth(deviceId, () => {
    setShowAuth(false);
  });

  const [mfaResolving, setMfaResolving] = useState(null); // 'approve' | 'deny' | null
  const { accounts, totpCodes, totpAdjacent, totpSecondsRemaining, addAccount, removeAccount, toggleFavorite, updateAccount, setLastUsed, reloadAccounts } = useAccounts(token, user?.uid);
  const { folders, addFolder, renameFolder, removeFolder, refreshFolders } = useFolders(token, user?.uid);
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
      const timeoutDays = await storage.getSessionTimeoutDays();
      setSessionTimeoutDays(timeoutDays);
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
    if (appLockConfig?.pinHash || (appLockConfig && !appLockConfig?.enabled)) {
      setShowAppLockPrompt(false);
      return;
    }
    const firstTime = token && !appLockConfig;
    const migration = token && appLockConfig?.enabled && !appLockConfig?.pinHash; // old users: enabled with biometric only
    if (firstTime || migration) setShowAppLockPrompt(true);
  }, [token, appLockConfig]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      const now = Date.now();
      if (
        appState.current.match(/inactive|background/) &&
        nextState === 'active'
      ) {
        if (token) recordLastActivity?.();
        if (!appLock) {
          setBiometricUnlocked(true);
          return;
        }
        const elapsed = (now - lastActivityRef.current) / 60000;
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
                lastActivityRef.current = now;
              }
            });
        } else {
          lastActivityRef.current = now;
        }
      } else if (nextState === 'active') {
        lastActivityRef.current = now;
        if (token) recordLastActivity?.();
      } else if (nextState.match(/inactive|background/)) {
        lastActivityRef.current = now;
      }
      appState.current = nextState;
    });
    return () => subscription?.remove();
  }, [appLock, autoLockMinutes, hasBiometric, token, recordLastActivity]);

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

    if (!hasBiometric) {
      setBiometricChecking(false);
      return;
    }

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
      Alert.alert('PIN required', 'Set a 6-digit PIN to enable app lock on this device.', [{ text: 'OK' }]);
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
    const accounts = await storage.getAccounts(user?.uid);
    return JSON.stringify(accounts, null, 2);
  };

  const handleImport = async (imported) => {
    const existing = await storage.getAccounts(user?.uid);
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
    await storage.saveAccounts(merged, user?.uid);
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
    else Alert.alert('Incorrect PIN', 'Please try again.');
  };

  const handleLogin = async (email, password, rememberDevice = true) => {
    try {
      await login(email, password, rememberDevice);
    } catch (e) {}
  };

  const handleRegister = async (email, password, displayName, rememberDevice = true, securityCode = '') => {
    try {
      await register(email, password, displayName, rememberDevice, securityCode);
    } catch (e) {}
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
        showToast('Already added');
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
      showToast(`${label} added`);
    } catch (e) {
      if (e?.message?.includes('SecureStore') || e?.message?.includes('2048')) {
        Alert.alert('Storage full', 'Could not save. Please remove an account or clear app data, then try again.');
      } else {
        Alert.alert('Could not add account', 'Try manual entry and paste the setup key from your service\'s security settings.');
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
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <LinearGradient
        colors={theme.gradients.hero}
        style={styles.container}
      >
        <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
          {!appLock || biometricUnlocked ? (
            <>
          {showIntro && !token && (
            <IntroModal
              visible={showIntro}
              onComplete={async () => {
                await storage.setIntroSeen();
                setShowIntro(false);
                setShowAuth(true);
              }}
            />
          )}
          {!(showIntro && !token) && (
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
            setLastUsed={(id) => {
              setLastUsed(id);
              recordLastActivity?.();
            }}
          />

          {token && (
            <FloatingActionButton
              onPress={async () => {
                const { success } = await biometricService.authenticate(
                  'Verify identity to add accounts',
                );
                if (success) setShowScanner(true);
                else Alert.alert('Verification required', 'Please verify your identity to add accounts.');
              }}
            />
          )}
          </>
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
            deviceId={deviceId}
            onPreferencesChange={refreshUser}
            appLock={appLock}
            onAppLockChange={handleAppLockChange}
            appLockConfig={appLockConfig}
            onPinSetup={handlePinSetup}
            onAutoLockSelect={handleAutoLockSelect}
            autoLockMinutes={autoLockMinutes}
            onSessionTimeoutSelect={async (days) => {
              await storage.saveSessionTimeoutDays(days);
              setSessionTimeoutDays(days);
            }}
            sessionTimeoutDays={sessionTimeoutDays}
            hasBiometric={hasBiometric}
            onCheckMfa={token ? checkForPendingChallenges : undefined}
            onExportImport={(mode) => {
              if (mode === 'loginHistory' || mode === 'mfaHistory') {
                setHistoryMode(mode);
              } else {
                setExportImportMode(mode);
              }
            }}
            folders={folders}
            accounts={accounts}
            addFolder={addFolder}
            renameFolder={renameFolder}
            removeFolder={removeFolder}
            updateAccount={updateAccount}
            refreshFolders={refreshFolders}
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

          <AppLockPromptModal
            visible={showAppLockPrompt}
            hasBiometric={hasBiometric}
            isMigration={!!(appLockConfig?.enabled && !appLockConfig?.pinHash)}
            onEnable={handleAppLockPromptEnable}
            onSkip={handleAppLockPromptSkip}
          />

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
        <ToastProvider>
          <AppContent />
        </ToastProvider>
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
