/**
 * MFA hook – polls for pending challenges, resolves with PQC signature (approve/deny).
 */
import { useState, useEffect, useCallback } from 'react';
import { Alert, AppState } from 'react-native';
import * as Haptics from 'expo-haptics';
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
          expiresAt: challenge.expiresAt,
        });
      } else {
        setPendingChallenge(null);
      }
    } catch (e) {
      if (__DEV__) console.warn('MFA poll error:', e?.response?.status, e?.response?.data?.message || e?.message);
    }
  }, [deviceId, token]);

  // Poll continuously when logged in
  useEffect(() => {
    if (!deviceId || !token) return;

    checkForPendingChallenges();
    const interval = setInterval(checkForPendingChallenges, 150);

    const sub = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active' && deviceId && token) {
        checkForPendingChallenges();
        [50, 150, 300, 500].forEach((ms) => {
          setTimeout(checkForPendingChallenges, ms);
        });
      }
    });

    return () => {
      clearInterval(interval);
      sub?.remove();
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
      if (decision === 'approved') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (e) {
      if (__DEV__) console.log('MFA resolve error', e);
      Alert.alert('Error', e?.response?.data?.message || 'Failed to process MFA decision');
    }
  };

  return {
    pendingChallenge,
    resolveChallenge,
  };
};
