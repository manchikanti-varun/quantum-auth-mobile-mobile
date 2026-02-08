/** Expo push token for MFA alerts. Null on simulator/Expo Go or when denied. */

import * as Device from 'expo-device';
import Constants from 'expo-constants';

export async function getExpoPushTokenAsync() {
  if (!Device.isDevice) return null;
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
    return null;
  }
}
