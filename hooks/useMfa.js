/**
 * MFA hook. Polls for pending login challenges; resolves with PQC signature (approve/deny).
 * Bursts polling when app becomes active.
 * @module hooks/useMfa
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { Alert, AppState } from 'react-native';
import * as Haptics from 'expo-haptics';
import { mfaApi } from '../services/api';
import { storage } from '../services/storage';
import { deviceService } from '../services/device';
import { useToast } from '../context/ToastContext';

export const useMfa = (deviceId, token) => {
  const { showToast } = useToast();
  const [pendingChallenge, setPendingChallenge] = useState(null);
  const pollErrorCountRef = useRef(0);

  const pollInProgressRef = useRef(false);
  const checkForPendingChallenges = useCallback(async () => {
    if (!deviceId || !token) return;
    if (pollInProgressRef.current) return;
    pollInProgressRef.current = true;
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
      pollErrorCountRef.current += 1;
    } finally {
      pollInProgressRef.current = false;
    }
  }, [deviceId, token]);

  useEffect(() => {
    if (!deviceId || !token) return;

    checkForPendingChallenges();
    const intervalId = setInterval(checkForPendingChallenges, 300);

    const sub = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active' && deviceId && token) {
        checkForPendingChallenges();
        [50, 150, 300, 500, 800, 1200].forEach((ms) =>
          setTimeout(checkForPendingChallenges, ms),
        );
      }
    });

    return () => {
      clearInterval(intervalId);
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
        showToast('Login approved. The other device can now sign in.');
      } else if (flagged) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        showToast('Login denied and marked as suspicious.');
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        showToast('Login denied.');
      }
    } catch (e) {
      Alert.alert('Error', e?.response?.data?.message || 'Failed to process MFA decision');
    }
  };

  return {
    pendingChallenge,
    resolveChallenge,
    checkForPendingChallenges,
  };
};
