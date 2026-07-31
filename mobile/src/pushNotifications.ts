// Push / local notification plumbing.
//
// Scope note: remote push over Expo Go was removed in SDK 53+. This module is
// therefore "push-ready" rather than push-complete — it wires foreground
// presentation, permission requests, tap→deep-link handling, and (behind a guard)
// device-token registration. Local/scheduled notifications work today in Expo Go;
// remote push activates once the app is run as a development build, at which point
// `registerForPushNotificationsAsync` returns a real token to POST to the backend.

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { warn } from './logger';

// Show notifications while the app is foregrounded (banner + list, no sound spam).
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: true,
  }),
});

/**
 * Ask for permission and (on a real build) obtain the Expo push token. Returns
 * null when running in Expo Go, on a simulator, or if permission is denied —
 * callers must treat a null token as "push not available", not an error.
 */
export async function registerForPushNotificationsAsync(): Promise<string | null> {
  try {
    if (!Device.isDevice) return null; // simulators can't receive push

    const { status: existing } = await Notifications.getPermissionsAsync();
    let status = existing;
    if (existing !== 'granted') {
      status = (await Notifications.requestPermissionsAsync()).status;
    }
    if (status !== 'granted') return null;

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Default',
        importance: Notifications.AndroidImportance.DEFAULT,
      });
    }

    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
    // Without an EAS projectId (Expo Go / no dev build) a real token can't be minted.
    if (!projectId) return null;

    const token = await Notifications.getExpoPushTokenAsync({ projectId });
    return token.data;
  } catch (e) {
    warn('Push registration unavailable', e);
    return null;
  }
}

/**
 * Subscribe to notification taps. `onDeepLink` receives the `deepLink` route from
 * the notification's data payload so the app can navigate. Returns an unsubscribe.
 * Also handles the cold-start case where the app was launched by tapping a push.
 */
export function addNotificationResponseListener(
  onDeepLink: (deepLink: string) => void
): () => void {
  const extract = (response: Notifications.NotificationResponse | null) => {
    const data = response?.notification.request.content.data as
      | { deepLink?: string }
      | undefined;
    if (data?.deepLink) onDeepLink(data.deepLink);
  };

  // App launched from a notification while killed.
  Notifications.getLastNotificationResponseAsync().then(extract).catch(() => {});

  const sub = Notifications.addNotificationResponseReceivedListener(extract);
  return () => sub.remove();
}
