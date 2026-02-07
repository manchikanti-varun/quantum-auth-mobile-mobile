/**
 * Expo Push Notifications – get token for MFA login alerts.
 * Push is not supported in Expo Go (SDK 53+); use dev/production build for push.
 */
import * as Device from 'expo-device';
import Constants from 'expo-constants';

/**
 * Request permission and return Expo push token, or null if unavailable.
 * Returns null in Expo Go (push removed in SDK 53), simulator, or when user denies.
 */
export async function getExpoPushTokenAsync() {
  if (!Device.isDevice) return null;
  // Skip in Expo Go to avoid "removed from Expo Go" error; push works in dev/production build
  if (Constants.appOwnership === 'expo') return null;

  try {
    const mod = await import('expo-notifications');
    const Notif = mod.default || mod;
    Notif.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });
    const { status: existing } = await Notif.getPermissionsAsync();
    let final = existing;
    if (existing !== 'granted') {
      const { status } = await Notif.requestPermissionsAsync();
      final = status;
    }
    if (final !== 'granted') return null;

    const projectId = Constants.expoConfig?.extra?.eas?.projectId;
    const token = await Notif.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined,
    );
    return token?.data ?? null;
  } catch (e) {
    if (__DEV__) console.warn('Expo push token error:', e?.message);
    return null;
  }
}
