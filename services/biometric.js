/**
 * Biometric authentication service (fingerprint, face ID).
 * Uses expo-local-authentication with device passcode fallback.
 * @module services/biometric
 */
import * as LocalAuthentication from 'expo-local-authentication';

export const biometricService = {
  async hasBiometric() {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      if (!hasHardware) return false;
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      return !!isEnrolled;
    } catch (e) {
      return false;
    }
  },

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
      return { success: true };
    }
  },
};
