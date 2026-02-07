/**
 * Auth hook – login, register, logout, MFA polling, backup OTP. Manages token & user.
 */
import { useState, useEffect } from 'react';
import { Alert } from 'react-native';
import { authApi, deviceApi, setOnUnauthorized } from '../services/api';
import { storage } from '../services/storage';
import { deviceService } from '../services/device';
import { getExpoPushTokenAsync } from '../services/pushNotifications';

export const useAuth = (deviceId, onSuccess) => {
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null); // { email, displayName }
  const [pendingMfa, setPendingMfa] = useState(null); // { challengeId, deviceId } when waiting for approve/deny

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
          const data = res.data;
          setToken(data.token);
          await storage.saveToken(data.token);
          updateApiToken(data.token);
          setUser(data.email ? { email: data.email, displayName: data.displayName ?? null } : null);
          await registerDevice(data.uid, pendingMfa.deviceId);
          setPendingMfa(null);
          onSuccess?.();
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
        // Keep polling on network error; stop only on approved/denied/expired
      }
    };

    const interval = setInterval(poll, 300);
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
        console.log('Failed to restore token', e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const updateApiToken = (newToken) => {
    const { setAuthToken } = require('../services/api');
    setAuthToken(newToken);
  };

  const login = async (email, password) => {
    if (!email || !password) {
      Alert.alert('Validation', 'Email and password are required');
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
        setPendingMfa({ challengeId: response.data.challengeId, deviceId });
        setLoading(false);
        return;
      }
      const newToken = response.data.token;
      setToken(newToken);
      await storage.saveToken(newToken);
      updateApiToken(newToken);
      setUser(response.data.email ? { email: response.data.email, displayName: response.data.displayName ?? null } : null);
      await registerDevice(response.data.uid, deviceId);
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

  const register = async (email, password, displayName) => {
    if (!email || !password) {
      Alert.alert('Validation', 'Email and password are required');
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
      await registerDevice(response.data.uid, deviceId);
      onSuccess?.();
      return response.data;
    } catch (err) {
      const message =
        err?.response?.data?.message || 'Something went wrong. Please try again.';
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
      console.log('Device registration failed', e);
    }
  };

  const logout = () => {
    clearAuth();
  };

  const cancelPendingMfa = () => setPendingMfa(null);

  const loginWithOtp = async (challengeId, deviceId, code) => {
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
      await registerDevice(data.uid, deviceId);
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
