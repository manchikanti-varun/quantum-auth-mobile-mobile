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
  const { theme } = useTheme();

  const { token, user, loading, login, register, logout, pendingMfa, cancelPendingMfa, loginWithOtp } = useAuth(deviceId, () => {
    setShowAuth(false);
  });

  const [mfaResolving, setMfaResolving] = useState(null); // 'approve' | 'deny' | null
  const { accounts, totpCodes, totpAdjacent, totpSecondsRemaining, addAccount, removeAccount, toggleFavorite, updateAccount, setLastUsed, reloadAccounts } = useAccounts();
  const { pendingChallenge, resolveChallenge } = useMfa(deviceId, token);

  const appState = useRef(AppState.currentState);
  const handleQrScanRef = useRef(null);

  useEffect(() => {
    (async () => {
      const lockConfig = await storage.getAppLock();
      setAppLockConfig(lockConfig);
      setAppLock(lockConfig?.enabled !== false);
      const mins = await storage.getAutoLockMinutes();
      setAutoLockMinutes(mins);
    })();
  }, []);

  useEffect(() => {
    initializeApp();
  }, []);

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
        if (autoLockMinutes > 0 && elapsed >= autoLockMinutes) {
          setBiometricUnlocked(false);
          setBiometricChecking(true);
          biometricService
            .authenticate('Verify identity to continue')
            .then(({ success }) => {
              setBiometricChecking(false);
              if (success) {
                setBiometricUnlocked(true);
                lastActivityRef.current = Date.now();
              }
            });
        } else if (!biometricUnlocked) {
          setBiometricChecking(true);
          biometricService
            .authenticate('Verify identity to continue')
            .then(({ success }) => {
              setBiometricChecking(false);
              if (success) setBiometricUnlocked(true);
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
  }, [appLock, autoLockMinutes]);

  const initializeApp = async () => {
    const { deviceId: id } = await deviceService.ensureDeviceIdentity();
    setDeviceId(id);

    const lockConfig = await storage.getAppLock();
    setAppLockConfig(lockConfig);
    const useLock = lockConfig?.enabled !== false;
    setAppLock(useLock);

    if (!useLock) {
      setBiometricChecking(false);
      setBiometricUnlocked(true);
      lastActivityRef.current = Date.now();
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
    setAppLock(enabled);
    const config = await storage.getAppLock();
    await storage.saveAppLock({ ...config, enabled });
    setAppLockConfig({ ...config, enabled });
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

  const handleLogin = async (email, password) => {
    try {
      await login(email, password);
    } catch (e) {
      // Error handled in hook
    }
  };

  const handleRegister = async (email, password, displayName) => {
    try {
      await register(email, password, displayName);
    } catch (e) {
      // Error handled in hook
    }
  };

  const handleQrScan = async (data) => {
    try {
      const parsed = qrParser.parseOtpauth(data);
      if (!parsed) return;

      const { issuer, label, secret } = parsed;

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
      };

      await addAccount(account);
      setShowScanner(false);
      Alert.alert(
        'Account added',
        `${label} added.`,
        [{ text: 'OK' }],
      );
    } catch (e) {
      console.warn('Add account error', e);
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

          <SettingsModal
            visible={showSettings}
            onClose={() => setShowSettings(false)}
            user={user}
            onProfilePress={() => { setShowSettings(false); setShowProfile(true); }}
            appLock={appLock}
            onAppLockChange={handleAppLockChange}
            appLockConfig={appLockConfig}
            onPinSetup={handlePinSetup}
            onAutoLockChange={() => setShowAutoLockPicker(true)}
            autoLockMinutes={autoLockMinutes}
            onExportImport={(mode) => {
              if (mode === 'loginHistory' || mode === 'mfaHistory') {
                setHistoryMode(mode);
              } else {
                setExportImportMode(mode);
              }
            }}
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
            onClose={() => setHistoryMode(null)}
          />
            </>
          ) : (
            <BiometricGate
              onUnlock={handleUnlock}
              onPinUnlock={handlePinUnlock}
              loading={biometricChecking}
              hasPinFallback={!!appLockConfig?.pinHash}
            />
          )}
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
