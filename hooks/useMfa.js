/**
 * MFA hook – polls for pending challenges, resolves with PQC signature (approve/deny).
 */
import { useState, useEffect, useCallback } from 'react';
import { Alert, AppState } from 'react-native';
import { mfaApi } from '../services/api';
import { storage } from '../services/storage';
import { deviceService } from '../services/device';

export const useMfa = (deviceId, token) => {
  const [pendingChallenge, setPendingChallenge] = useState(null);

  const checkForPendingChallenges = useCallback(async () => {
    if (!deviceId || !token) return;
    try {
      const response = await mfaApi.getPending(deviceId);
      const challenge = response.data?.challenge;
      if (challenge?.challengeId) {
        setPendingChallenge({
          challengeId: challenge.challengeId,
          context: challenge.context || {},
        });
      } else {
        setPendingChallenge(null);
      }
    } catch (e) {
      if (__DEV__) console.warn('MFA poll error:', e?.response?.status, e?.response?.data?.message || e?.message);
    }
  }, [deviceId, token]);

  useEffect(() => {
    if (!deviceId || !token) return;

    checkForPendingChallenges();
    const interval = setInterval(checkForPendingChallenges, 150);
    return () => clearInterval(interval);
  }, [deviceId, token, checkForPendingChallenges]);

  // Poll when app comes to foreground – burst of polls to catch challenges quickly
  useEffect(() => {
    let timers = [];
    const sub = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active' && deviceId && token) {
        timers.forEach(clearTimeout);
        timers = [];
        checkForPendingChallenges();
        [100, 300, 600].forEach((ms) => {
          timers.push(setTimeout(checkForPendingChallenges, ms));
        });
      }
    });
    return () => {
      sub?.remove();
      timers.forEach(clearTimeout);
    };
  }, [deviceId, token, checkForPendingChallenges]);

  const resolveChallenge = async (decision, flagged = false) => {
    if (!pendingChallenge) return;

    try {
      const keypair = await storage.getPqcKeypair();
      const message = `${pendingChallenge.challengeId}:${decision}`;
      const signature = await deviceService.signMessage(message, keypair);

      await mfaApi.resolve({
        challengeId: pendingChallenge.challengeId,
        decision,
        signature,
        deviceId,
        flagged,
      });

      setPendingChallenge(null);
    } catch (e) {
      if (__DEV__) console.log('MFA resolve error', e);
      Alert.alert('Error', 'Failed to process MFA decision');
    }
  };

  return {
    pendingChallenge,
    resolveChallenge,
  };
};
