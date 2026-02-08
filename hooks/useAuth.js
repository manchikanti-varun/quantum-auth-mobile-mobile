/**
 * Auth hook – login, register, logout, MFA polling, backup OTP. Manages token & user.
 */
import { useState, useEffect, useRef } from 'react';
import { Alert } from 'react-native';
import { authApi, deviceApi, setOnUnauthorized } from '../services/api';
import { validateRegister, validateLogin } from '../utils/validation';
import { storage } from '../services/storage';
import { deviceService } from '../services/device';
import { getExpoPushTokenAsync } from '../services/pushNotifications';

export const useAuth = (deviceId, onSuccess) => {
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null); // { email, displayName }
  const [pendingMfa, setPendingMfa] = useState(null); // { challengeId, deviceId } when waiting for approve/deny
  const approvedHandledRef = useRef(false);

  const clearAuth = async () => {
    setToken(null);
    setUser(null);
    await storage.saveToken(null);
    const { setAuthToken } = require('../services/api');
    setAuthToken(null);
  };

  useEffect(() => {
    setOnUnauthorized(clearAuth);
  }, []);

  // Poll for login approval when waiting for other device
  useEffect(() => {
    if (!pendingMfa?.challengeId || !pendingMfa?.deviceId) return;

    const poll = async () => {
      try {
        const res = await authApi.getLoginStatus(pendingMfa.challengeId, pendingMfa.deviceId);
        const status = res.data?.status;
        if (status === 'approved') {
          if (approvedHandledRef.current) return;
          approvedHandledRef.current = true;
          const data = res.data;
          setToken(data.token);
          await storage.saveToken(data.token);
          updateApiToken(data.token);
          setUser(data.email ? { email: data.email, displayName: data.displayName ?? null } : null);
          setPendingMfa(null);
          onSuccess?.();
          await registerDevice(data.uid, pendingMfa.deviceId, pendingMfa.rememberDevice ?? true);
          return;
        }
        if (status === 'denied' || status === 'expired') {
          setPendingMfa(null);
          Alert.alert(
            status === 'denied' ? 'Login denied' : 'Login expired',
            status === 'denied' ? 'The login was denied on your other device.' : 'The login request expired. Try again.',
          );
          return;
        }
      } catch (e) {
        const status = e?.response?.status;
        if (status === 403 || status === 404 || status === 429) {
          setPendingMfa(null);
          const msg = status === 429
            ? 'Too many requests. Tap Cancel and try again in a moment.'
            : status === 403
              ? 'Device mismatch. Cancel and log in again.'
              : 'Challenge not found. It may have expired.';
          Alert.alert('Error', msg);
        }
      }
    };

    const interval = setInterval(poll, 150);
    poll();
    return () => clearInterval(interval);
  }, [pendingMfa?.challengeId, pendingMfa?.deviceId]);

  useEffect(() => {
    (async () => {
      try {
        const saved = await storage.getToken();
        if (saved) {
          setToken(saved);
          const { setAuthToken } = await import('../services/api');
          setAuthToken(saved);
          try {
            const res = await authApi.getMe();
            if (res.data?.email) {
              setUser({ email: res.data.email, displayName: res.data.displayName ?? null });
            }
          } catch (e) {
            // Token may be expired; user will be null
          }
        }
      } catch (e) {
        if (__DEV__) console.log('Failed to restore token', e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const updateApiToken = (newToken) => {
    const { setAuthToken } = require('../services/api');
    setAuthToken(newToken);
  };

  const login = async (email, password, rememberDevice = true) => {
    const loginErrors = validateLogin({ email, password });
    if (loginErrors.length > 0) {
      Alert.alert('Validation', loginErrors[0]);
      return;
    }
    if (!deviceId) {
      Alert.alert('Error', 'Device ID is missing. Please restart the app.');
      return;
    }

    try {
      setLoading(true);
      setPendingMfa(null);
      const response = await authApi.login(email, password, deviceId);
      if (response.data.requiresMfa && response.data.challengeId) {
        approvedHandledRef.current = false;
        setPendingMfa({ challengeId: response.data.challengeId, deviceId, rememberDevice });
        setLoading(false);
        return;
      }
      const newToken = response.data.token;
      setToken(newToken);
      await storage.saveToken(newToken);
      updateApiToken(newToken);
      setUser(response.data.email ? { email: response.data.email, displayName: response.data.displayName ?? null } : null);
      await registerDevice(response.data.uid, deviceId, rememberDevice);
      onSuccess?.();
      return response.data;
    } catch (err) {
      const msg = err?.response?.data?.message;
      const status = err?.response?.status;
      const networkMsg = !err?.response ? 'Cannot reach server. Check internet and backend URL (Railway).' : null;
      const message = msg || networkMsg || `Something went wrong${status ? ` (${status})` : ''}. Try again.`;
      Alert.alert('Error', message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const register = async (email, password, displayName, rememberDevice = true) => {
    const registerErrors = validateRegister({ email, password, displayName });
    if (registerErrors.length > 0) {
      Alert.alert('Validation', registerErrors[0]);
      return;
    }

    try {
      setLoading(true);
      const response = await authApi.register(email, password, displayName);
      const newToken = response.data.token;
      setToken(newToken);
      await storage.saveToken(newToken);
      updateApiToken(newToken);
      setUser(response.data.email ? { email: response.data.email, displayName: response.data.displayName ?? null } : null);
      await registerDevice(response.data.uid, deviceId, rememberDevice);
      onSuccess?.();
      return response.data;
    } catch (err) {
      const msg = err?.response?.data?.message;
      const networkMsg = !err?.response ? 'Cannot reach server. Check internet connection.' : null;
      const message = msg || networkMsg || 'Something went wrong. Please try again.';
      Alert.alert('Error', message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const registerDevice = async (uid, deviceId, rememberDevice = true) => {
    try {
      const keypair = await storage.getPqcKeypair();
      if (deviceId && keypair?.publicKey && keypair?.algorithm) {
        const pushToken = await getExpoPushTokenAsync();
        await deviceApi.register({
          deviceId,
          pqcPublicKey: keypair.publicKey,
          pqcAlgorithm: keypair.algorithm,
          platform: 'android',
          pushToken: pushToken || null,
          rememberDevice,
        });
      }
    } catch (e) {
      if (__DEV__) console.log('Device registration failed', e);
    }
  };

  const logout = async () => {
    try {
      if (deviceId && token) {
        await deviceApi.revoke(deviceId);
      }
    } catch (e) {
      if (__DEV__) console.log('Revoke on logout failed:', e?.message);
    }
    await clearAuth();
  };

  const cancelPendingMfa = () => setPendingMfa(null);

  const loginWithOtp = async (challengeId, deviceId, code, rememberDevice = true) => {
    if (!challengeId || !deviceId || !code) {
      Alert.alert('Validation', 'Enter the 6-digit code');
      return;
    }
    try {
      setLoading(true);
      const res = await authApi.loginWithOtp(challengeId, deviceId, code);
      const data = res.data;
      setToken(data.token);
      await storage.saveToken(data.token);
      updateApiToken(data.token);
      setUser(data.email ? { email: data.email, displayName: data.displayName ?? null } : null);
      await registerDevice(data.uid, deviceId, rememberDevice);
      setPendingMfa(null);
      onSuccess?.();
    } catch (err) {
      const message = err?.response?.data?.message || 'Invalid code or request. Try again.';
      Alert.alert('Error', message);
    } finally {
      setLoading(false);
    }
  };

  return {
    token,
    user,
    loading,
    login,
    register,
    logout,
    pendingMfa,
    cancelPendingMfa,
    loginWithOtp,
  };
};
