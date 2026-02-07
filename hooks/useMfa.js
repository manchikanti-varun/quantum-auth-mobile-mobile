/**
 * MFA hook – polls for pending challenges, resolves with PQC signature (approve/deny).
 */
import { useState, useEffect } from 'react';
import { Alert, AppState } from 'react-native';
import { mfaApi } from '../services/api';
import { storage } from '../services/storage';
import { deviceService } from '../services/device';

export const useMfa = (deviceId, token) => {
  const [pendingChallenge, setPendingChallenge] = useState(null);

  useEffect(() => {
    if (!deviceId || !token) return;

    checkForPendingChallenges();
    const interval = setInterval(checkForPendingChallenges, 150);
    return () => clearInterval(interval);
  }, [deviceId, token]);

  // Poll immediately when app comes to foreground (e.g. login from browser)
  useEffect(() => {
    const sub = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active' && deviceId && token) {
        checkForPendingChallenges();
      }
    });
    return () => sub?.remove();
  }, [deviceId, token]);

  const checkForPendingChallenges = async () => {
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
      if (__DEV__) console.warn('MFA poll error:', e?.message);
    }
  };

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
      console.log('MFA resolve error', e);
      Alert.alert('Error', 'Failed to process MFA decision');
    }
  };

  return {
    pendingChallenge,
    resolveChallenge,
  };
};
