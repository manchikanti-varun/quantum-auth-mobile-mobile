/** Auth: login, register, logout, MFA polling, backup OTP, device registration. */
import { useState, useEffect, useRef } from 'react';
import { authApi, deviceApi, setOnUnauthorized } from '../services/api';
import { useAlert } from '../context/AlertContext';
import { validateRegister, validateLogin } from '../utils/validation';
import { storage } from '../services/storage';
import { deviceService } from '../services/device';
import { getExpoPushTokenAsync } from '../services/pushNotifications';

const SESSION_CHECK_INTERVAL_MS = 60 * 1000; // 1 min – so revoked device reflects within ~1 min

export const useAuth = (deviceId, onSuccess, onRevoked) => {
  const { showAlert } = useAlert();
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [pendingMfa, setPendingMfa] = useState(null);
  const approvedHandledRef = useRef(false);
  const onRevokedRef = useRef(onRevoked);
  onRevokedRef.current = onRevoked;

  const clearAuth = async () => {
    setToken(null);
    setUser(null);
    await storage.saveToken(null);
    const { setAuthToken } = require('../services/api');
    setAuthToken(null);
  };

  useEffect(() => {
    setOnUnauthorized(async (err) => {
      await clearAuth();
      const msg = err?.response?.data?.message || '';
      if (typeof msg === 'string' && msg.toLowerCase().includes('revoked')) {
        onRevokedRef.current?.();
      }
    });
    return () => setOnUnauthorized(null);
  }, []);

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
      setUser(data.email ? { uid: data.uid, email: data.email, displayName: data.displayName ?? null, preferences: { allowMultipleDevices: true } } : null);
      setPendingMfa(null);
      await storage.saveLastActivity(Date.now());
      onSuccess?.();
      await registerDevice(data.uid, pendingMfa.deviceId, pendingMfa.rememberDevice ?? true);
          return;
        }
        if (status === 'denied' || status === 'expired') {
          setPendingMfa(null);
          showAlert(
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
          showAlert('Error', msg);
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
          const timeoutDays = await storage.getSessionTimeoutDays();
          let lastActivity = await storage.getLastActivity();
          const now = Date.now();
          if (lastActivity === 0) {
            await storage.saveLastActivity(now);
            lastActivity = now;
          }
          const msPerDay = 24 * 60 * 60 * 1000;
          if (timeoutDays > 0 && (now - lastActivity) > timeoutDays * msPerDay) {
            await clearAuth();
            setLoading(false);
            return;
          }
          setToken(saved);
          const { setAuthToken } = await import('../services/api');
          setAuthToken(saved);
          try {
            const res = await authApi.getMe();
            if (res.data?.email) {
              setUser({
                uid: res.data.uid,
                email: res.data.email,
                displayName: res.data.displayName ?? null,
                preferences: res.data.preferences ?? { allowMultipleDevices: true },
              });
            }
          } catch (e) {}
        }
      } catch (e) {}
      finally {
        setLoading(false);
      }
    })();
  }, []);

  // Periodic session check so a revoked device (e.g. logged out from device 1) reflects within ~1 min
  useEffect(() => {
    if (!token || !deviceId) return;
    const interval = setInterval(() => {
      authApi.getMe().catch(() => {});
    }, SESSION_CHECK_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [token, deviceId]);

  const updateApiToken = (newToken) => {
    const { setAuthToken } = require('../services/api');
    setAuthToken(newToken);
  };

  const login = async (email, password, rememberDevice = true) => {
    const loginErrors = validateLogin({ email, password });
    if (loginErrors.length > 0) {
      showAlert('Validation', loginErrors[0]);
      return;
    }
    if (!deviceId) {
      showAlert('Error', 'Device ID is missing. Please restart the app.');
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
      setUser(response.data.email ? { uid: response.data.uid, email: response.data.email, displayName: response.data.displayName ?? null } : null);
      await storage.saveLastActivity(Date.now());
      await registerDevice(response.data.uid, deviceId, rememberDevice);
      onSuccess?.();
      return response.data;
    } catch (err) {
      const msg = err?.response?.data?.message;
      const status = err?.response?.status;
      let message = msg;
      if (!message) {
        if (!err?.response) message = 'Unable to connect. Please check your internet connection and try again.';
        else if (status === 401) message = 'Invalid email or password. Please try again.';
        else if (status === 429) message = 'Too many attempts. Please wait a moment and try again.';
        else message = 'Something went wrong. Please try again.';
      }
      showAlert('Sign in failed', message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const register = async (email, password, displayName, rememberDevice = true, securityCode = '') => {
    const registerErrors = validateRegister({ email, password, displayName });
    if (registerErrors.length > 0) {
      showAlert('Validation', registerErrors[0]);
      return;
    }

    try {
      setLoading(true);
      const response = await authApi.register(email, password, displayName, securityCode);
      const newToken = response.data.token;
      setToken(newToken);
      await storage.saveToken(newToken);
      updateApiToken(newToken);
      setUser(response.data.email ? { uid: response.data.uid, email: response.data.email, displayName: response.data.displayName ?? null, preferences: { allowMultipleDevices: true } } : null);
      await storage.saveLastActivity(Date.now());
      await registerDevice(response.data.uid, deviceId, rememberDevice);
      onSuccess?.();
      return response.data;
    } catch (err) {
      const msg = err?.response?.data?.message;
      let message = msg;
      if (!message) {
        if (!err?.response) message = 'Unable to connect. Please check your internet connection and try again.';
        else if (err?.response?.status === 409) message = 'An account with this email already exists. Try signing in instead.';
        else message = 'Something went wrong. Please try again.';
      }
      showAlert('Registration failed', message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const registerDevice = async (uid, deviceId, rememberDevice = true) => {
    try {
      const keypair = await storage.getPqcKeypair();
      const kyberKeypair = await storage.getKyberKeypair();
      if (deviceId && keypair?.publicKey && keypair?.algorithm) {
        const pushToken = await getExpoPushTokenAsync();
        await deviceApi.register({
          deviceId,
          pqcPublicKey: keypair.publicKey,
          pqcAlgorithm: keypair.algorithm,
          kyberPublicKey: kyberKeypair?.publicKey || null,
          kyberAlgorithm: kyberKeypair?.algorithm || null,
          platform: 'android',
          pushToken: pushToken || null,
          rememberDevice,
        });
      }
    } catch (e) {
    }
  };

  const logout = async () => {
    await clearAuth();
  };

  const cancelPendingMfa = () => setPendingMfa(null);

  const recordLastActivity = async () => {
    await storage.saveLastActivity(Date.now());
  };

  const refreshUser = async () => {
    if (!token) return;
    try {
      const res = await authApi.getMe();
      if (res.data?.email) {
        setUser({
          uid: res.data.uid,
          email: res.data.email,
          displayName: res.data.displayName ?? null,
          preferences: res.data.preferences ?? { allowMultipleDevices: true },
        });
      }
    } catch (e) {
    }
  };

  const loginWithOtp = async (challengeId, deviceId, code, rememberDevice = true) => {
    if (!challengeId || !deviceId || !code) {
      showAlert('Validation', 'Enter the 6-digit code');
      return;
    }
    try {
      setLoading(true);
      const res = await authApi.loginWithOtp(challengeId, deviceId, code);
      const data = res.data;
      setToken(data.token);
      await storage.saveToken(data.token);
      updateApiToken(data.token);
      setUser(data.email ? { uid: data.uid, email: data.email, displayName: data.displayName ?? null, preferences: { allowMultipleDevices: true } } : null);
      await storage.saveLastActivity(Date.now());
      await registerDevice(data.uid, deviceId, rememberDevice);
      setPendingMfa(null);
      onSuccess?.();
    } catch (err) {
      const message = err?.response?.data?.message || 'Invalid or expired code. Please try again with a fresh 6-digit code.';
      showAlert('Could not sign in', message);
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
    refreshUser,
    recordLastActivity,
  };
};
