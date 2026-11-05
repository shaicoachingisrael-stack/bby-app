import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import i18n from './i18n';
import { supabase } from './supabase';

// Foreground behavior: show banner + play sound
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// Les 3 rappels du jour ; textes dans lib/locales (section `reminders`).
const DAILY_REMINDERS = [
  { id: 'morning-session', hour: 9, minute: 0, key: 'morning', needsTracking: false },
  { id: 'lunch-meal', hour: 12, minute: 30, key: 'lunch', needsTracking: true },
  { id: 'evening-mindset', hour: 20, minute: 0, key: 'evening', needsTracking: false },
];

export async function ensurePermissionsGranted(): Promise<boolean> {
  if (!Device.isDevice) return false;
  const settings = await Notifications.getPermissionsAsync();
  if (settings.granted) return true;
  if (settings.canAskAgain === false) return false;
  const req = await Notifications.requestPermissionsAsync();
  return req.granted;
}

export async function setupAndroidChannel() {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync('default', {
    name: 'Notifications BBY',
    importance: Notifications.AndroidImportance.DEFAULT,
    vibrationPattern: [0, 200, 100, 200],
    lightColor: '#0A0A0A',
  });
}

// `tracking` = suivi nutrition activé : sans lui (le défaut voulu par Shy), pas de
// rappel pour noter le déjeuner. À rappeler quand la langue ou le suivi change.
export async function scheduleDailyReminders(tracking: boolean) {
  // Wipe previous schedules to avoid duplicates after a re-install
  await Notifications.cancelAllScheduledNotificationsAsync();

  for (const r of DAILY_REMINDERS) {
    if (r.needsTracking && !tracking) continue;
    await Notifications.scheduleNotificationAsync({
      identifier: r.id,
      content: {
        title: i18n.t(`reminders.${r.key}Title`),
        body: i18n.t(`reminders.${r.key}Body`),
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: r.hour,
        minute: r.minute,
      },
    });
  }
}

export async function cancelAllReminders() {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

export async function registerPushToken(userId: string): Promise<string | null> {
  if (!Device.isDevice) return null;

  const granted = await ensurePermissionsGranted();
  if (!granted) return null;

  await setupAndroidChannel();

  // Native device token (APNs hex on iOS, FCM string on Android).
  // We talk directly to APNs from our Edge Function — no Expo Push.
  let token: string;
  try {
    const tokenData = await Notifications.getDevicePushTokenAsync();
    token = tokenData.data as string;
  } catch (e) {
    console.warn('Could not get native device push token', e);
    return null;
  }

  // Persist token in Supabase (upsert by (user_id, expo_token))
  const platform: 'ios' | 'android' | 'web' =
    Platform.OS === 'ios' ? 'ios' : Platform.OS === 'android' ? 'android' : 'web';

  const { error } = await supabase
    .from('push_tokens')
    .upsert(
      {
        user_id: userId,
        expo_token: token,
        platform,
        device_name: Device.modelName ?? Device.osName ?? 'Unknown',
        last_seen_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,expo_token' },
    );

  if (error) console.warn('push_tokens upsert error', error);
  return token;
}

export async function unregisterCurrentDevicePushToken(userId: string) {
  // Best-effort: we don't keep the token client-side, so wipe all rows for this user.
  // Acceptable for V1 (one device per user typical).
  const { error } = await supabase
    .from('push_tokens')
    .delete()
    .eq('user_id', userId);
  if (error) console.warn('push_tokens delete error', error);
}
