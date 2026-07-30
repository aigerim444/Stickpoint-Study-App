import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Configure how notifications appear when the app is in the foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

const REMINDER_IDENTIFIER = 'stickpoint_daily_reminder';

export async function requestNotificationPermission(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  const existingPerms = await Notifications.getPermissionsAsync() as any;
  const existingStatus: string = existingPerms.status ?? (existingPerms.granted ? 'granted' : 'denied');
  if (existingStatus === 'granted') return true;
  const perms = await Notifications.requestPermissionsAsync() as any;
  const status: string = perms.status ?? (perms.granted ? 'granted' : 'denied');
  return status === 'granted';
}

export async function scheduleDaily(
  hour: number,
  minute: number,
  streak: number,
): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  const granted = await requestNotificationPermission();
  if (!granted) return false;

  // Cancel any existing reminder first
  await cancelDailyReminder();

  const streakLine =
    streak > 0
      ? `Day ${streak} streak 🔥 — keep it going!`
      : "Start your streak today 📚";

  await Notifications.scheduleNotificationAsync({
    identifier: REMINDER_IDENTIFIER,
    content: {
      title: '⏰ Time to study!',
      body: streakLine,
      data: { deepLink: '/(tabs)/' },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
    },
  });

  return true;
}

export async function cancelDailyReminder(): Promise<void> {
  try {
    await Notifications.cancelScheduledNotificationAsync(REMINDER_IDENTIFIER);
  } catch {
    // Notification may not exist yet — that's fine
  }
}

export async function updateReminderStreak(streak: number): Promise<void> {
  // Check if a reminder is already scheduled and re-schedule with updated streak text
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  const existing = scheduled.find((n) => n.identifier === REMINDER_IDENTIFIER);
  if (!existing) return;

  const trigger = existing.trigger as any;
  const hour: number = trigger?.hour ?? 20;
  const minute: number = trigger?.minute ?? 0;

  await scheduleDaily(hour, minute, streak);
}
