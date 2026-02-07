/**
 * Biometric service – fingerprint/face unlock. Falls back to device passcode.
 */
import * as LocalAuthentication from 'expo-local-authentication';

export const biometricService = {
  async authenticate(reason = 'Authenticate to continue') {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      if (!hasHardware) return { success: true }; // No biometrics, allow

      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      if (!isEnrolled) return { success: true }; // Not set up, allow

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: reason,
        fallbackLabel: 'Use passcode',
        disableDeviceFallback: false,
      });

      return {
        success: result.success,
        error: result.error,
      };
    } catch (e) {
      console.log('Biometric auth error', e);
      return { success: true }; // On error, allow to not block user
    }
  },
};
