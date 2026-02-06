/**
 * Expo Push Notifications – get token for MFA login alerts.
 * Used when registering device so the backend can send "Approve or Deny" pushes.
 */
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';

// Optional: show notifications when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

/**
 * Request permission and return Expo push token, or null if unavailable.
 * Returns null in Expo Go on Android (push not supported), simulator, or when user denies.
 */
export async function getExpoPushTokenAsync() {
  if (!Device.isDevice) return null;

  try {
    const { status: existing } = await Notifications.getPermissionsAsync();
    let final = existing;
    if (existing !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      final = status;
    }
    if (final !== 'granted') return null;

    const projectId = Constants.expoConfig?.extra?.eas?.projectId;
    const token = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined,
    );
    return token?.data ?? null;
  } catch (e) {
    if (__DEV__) console.warn('Expo push token error:', e?.message);
    return null;
  }
}
