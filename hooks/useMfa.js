import { useState, useEffect } from 'react';
import { Alert } from 'react-native';
import { mfaApi } from '../services/api';
import { storage } from '../services/storage';
import { deviceService } from '../services/device';

export const useMfa = (deviceId, token) => {
  const [pendingChallenge, setPendingChallenge] = useState(null);

  useEffect(() => {
    if (!deviceId || !token) return;

    checkForPendingChallenges();
    const interval = setInterval(checkForPendingChallenges, 1500);
    return () => clearInterval(interval);
  }, [deviceId, token]);

  const checkForPendingChallenges = async () => {
    if (!deviceId || !token) return;
    try {
      const response = await mfaApi.getPending(deviceId);
      if (response.data?.challenge) {
        const challenge = response.data.challenge;
        if (!pendingChallenge || pendingChallenge.challengeId !== challenge.challengeId) {
          setPendingChallenge({
            challengeId: challenge.challengeId,
            context: challenge.context || {},
          });
          // MFA modal will show automatically when pendingChallenge is set
        }
      } else if (pendingChallenge) {
        setPendingChallenge(null);
      }
    } catch (e) {
      // Silently fail
    }
  };

  const resolveChallenge = async (decision) => {
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
