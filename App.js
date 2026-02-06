import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Alert, AppState, Linking } from 'react-native';
import { v4 as uuidv4 } from 'uuid';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from './hooks/useAuth';
import { useAccounts } from './hooks/useAccounts';
import { useMfa } from './hooks/useMfa';
import { deviceService } from './services/device';
import { qrParser } from './services/qrParser';
import { biometricService } from './services/biometric';
import { HomeScreen } from './components/HomeScreen';
import { AuthModal } from './components/AuthModal';
import { ScannerModal } from './components/ScannerModal';
import { MfaModal } from './components/MfaModal';
import { FloatingActionButton } from './components/FloatingActionButton';
import { BiometricGate } from './components/BiometricGate';
import { theme } from './constants/theme';

export default function App() {
  const [biometricUnlocked, setBiometricUnlocked] = useState(false);
  const [biometricChecking, setBiometricChecking] = useState(true);
  const [showAuth, setShowAuth] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [deviceId, setDeviceId] = useState(null);

  const { token, loading, login, register, logout, pendingMfa, cancelPendingMfa, loginWithOtp } = useAuth(deviceId, () => {
    setShowAuth(false);
  });

  const { accounts, totpCodes, totpAdjacent, totpSecondsRemaining, addAccount, removeAccount } = useAccounts();
  const { pendingChallenge, resolveChallenge } = useMfa(deviceId, token);

  const appState = useRef(AppState.currentState);
  const handleQrScanRef = useRef(null);

  useEffect(() => {
    initializeApp();
  }, []);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (
        appState.current.match(/inactive|background/) &&
        nextState === 'active'
      ) {
        setBiometricUnlocked(false);
        setBiometricChecking(true);
        biometricService
          .authenticate('Verify identity to continue')
          .then(({ success }) => {
            setBiometricChecking(false);
            if (success) setBiometricUnlocked(true);
          });
      }
      appState.current = nextState;
    });
    return () => subscription?.remove();
  }, []);

  const checkBiometric = async () => {
    const { success } = await biometricService.authenticate(
      'Verify identity to open QSafe',
    );
    if (success) setBiometricUnlocked(true);
  };

  const initializeApp = async () => {
    const { deviceId: id } = await deviceService.ensureDeviceIdentity();
    setDeviceId(id);

    const { success } = await biometricService.authenticate(
      'Verify identity to open QSafe',
    );
    setBiometricChecking(false);
    if (success) setBiometricUnlocked(true);
  };

  const handleUnlock = async () => {
    setBiometricChecking(true);
    await checkBiometric();
    setBiometricChecking(false);
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
        `${label} added.\n\nFor Google 2FA: turn on "Set time automatically" in device Settings → Date & time, then enter the code on Google when the timer has at least 10 seconds left. If it says wrong, try the "If wrong, try" codes.`,
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
    const { success } = await biometricService.authenticate(
      'Verify identity to approve login',
    );
    if (success) resolveChallenge('approved');
    else Alert.alert('Authentication failed', 'Could not verify identity');
  };

  const handleMfaDeny = () => {
    resolveChallenge('denied');
  };

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <LinearGradient
        colors={theme.gradients.hero}
        style={styles.container}
      >
        <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
          {!biometricUnlocked ? (
            <BiometricGate onUnlock={handleUnlock} loading={biometricChecking} />
          ) : (
            <>
          <HomeScreen
            token={token}
            accounts={accounts}
            totpCodes={totpCodes}
            totpAdjacent={totpAdjacent}
            totpSecondsRemaining={totpSecondsRemaining}
            onLogout={logout}
            onScanPress={() => setShowAuth(true)}
            onRemoveAccount={removeAccount}
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
          />
            </>
          )}
        </SafeAreaView>
      </LinearGradient>
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
