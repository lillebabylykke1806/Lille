import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import {
  lærtVåkenvinduMinutter,
  typiskKveldsuroTid,
  harRegistrertLurEtter,
  type LurEntry,
  type UroEntry,
} from './søvnUtils';
import type { Locale } from './i18n/translations';

const NOTIF_IDS = {
  windDown30: 1,
  napNow: 2,
  napOverdue15: 3,
  eveningFussy45: 4,
} as const;

const STORAGE_ENABLED = 'lille_varsler_på';
const STORAGE_ASKED = 'lille_varsler_spurt';

function isNative(): boolean {
  return Capacitor.isNativePlatform();
}

export function notificationsEnabled(): boolean {
  return localStorage.getItem(STORAGE_ENABLED) === 'true';
}

export function setNotificationsEnabled(enabled: boolean): void {
  localStorage.setItem(STORAGE_ENABLED, enabled ? 'true' : 'false');
}

export async function requestNotificationPermissionIfNeeded(): Promise<boolean> {
  if (!isNative()) return false;

  if (localStorage.getItem(STORAGE_ASKED) === 'true') {
    return notificationsEnabled();
  }

  localStorage.setItem(STORAGE_ASKED, 'true');

  try {
    const current = await LocalNotifications.checkPermissions();
    if (current.display === 'granted') {
      setNotificationsEnabled(true);
      return true;
    }

    const result = await LocalNotifications.requestPermissions();
    const granted = result.display === 'granted';
    setNotificationsEnabled(granted);
    return granted;
  } catch {
    setNotificationsEnabled(false);
    return false;
  }
}

export async function ensureNotificationChannel(): Promise<void> {
  if (!isNative()) return;
  try {
    await LocalNotifications.createChannel({
      id: 'lille-reminders',
      name: 'Lille reminders',
      importance: 4,
      vibration: true,
    });
  } catch {
    // Channel may already exist
  }
}

function notificationCopy(babyName: string) {
  const name = babyName || 'your baby';
  return {
    windDown30: `Time to wind down 🌙 ${name}'s nap time is coming up soon`,
    napNow: `Time to rest, little one 🤍 ${name} is ready for a nap`,
    napOverdue15: `We know it's hard to stop the fun 😊 but ${name} needs some rest`,
    eveningFussy45: `Evening is approaching 🌅 Time to start the calming routine you know works for ${name}`,
  };
}

export async function cancelAllBabyNotifications(): Promise<void> {
  if (!isNative()) return;
  try {
    await LocalNotifications.cancel({
      notifications: Object.values(NOTIF_IDS).map((id) => ({ id })),
    });
  } catch {
    // ignore
  }
}

export async function scheduleBabyNotifications(params: {
  babyName: string;
  fødselsdato: string;
  lastWakeTime: Date | null;
  lurer?: LurEntry[];
  uroLogg?: UroEntry[];
  locale: Locale;
}): Promise<void> {
  if (!isNative() || !notificationsEnabled()) {
    await cancelAllBabyNotifications();
    return;
  }

  const { babyName, fødselsdato, lastWakeTime, lurer = [], uroLogg = [] } = params;
  const copy = notificationCopy(babyName);

  await ensureNotificationChannel();
  await cancelAllBabyNotifications();

  const notifications: {
    id: number;
    title: string;
    body: string;
    schedule: { at: Date };
    channelId?: string;
  }[] = [];
  const now = Date.now();
  const minLeadMs = 60_000;

  if (lastWakeTime) {
    const wakeWindow = lærtVåkenvinduMinutter(lurer, fødselsdato);
    const napAt = new Date(lastWakeTime.getTime() + wakeWindow * 60_000);
    const windDownAt = new Date(napAt.getTime() - 30 * 60_000);
    const overdueAt = new Date(napAt.getTime() + 15 * 60_000);

    const napRegistered = harRegistrertLurEtter(lurer, lastWakeTime, overdueAt);

    if (windDownAt.getTime() > now + minLeadMs) {
      notifications.push({
        id: NOTIF_IDS.windDown30,
        title: 'Lille',
        body: copy.windDown30,
        schedule: { at: windDownAt },
        channelId: 'lille-reminders',
      });
    }

    if (napAt.getTime() > now + minLeadMs) {
      notifications.push({
        id: NOTIF_IDS.napNow,
        title: 'Lille',
        body: copy.napNow,
        schedule: { at: napAt },
        channelId: 'lille-reminders',
      });
    }

    if (!napRegistered && overdueAt.getTime() > now + minLeadMs) {
      notifications.push({
        id: NOTIF_IDS.napOverdue15,
        title: 'Lille',
        body: copy.napOverdue15,
        schedule: { at: overdueAt },
        channelId: 'lille-reminders',
      });
    }
  }

  const fussyTime = typiskKveldsuroTid(uroLogg);
  if (fussyTime) {
    const eveningNotifyAt = new Date(fussyTime.getTime() - 45 * 60_000);
    if (eveningNotifyAt.getTime() > now + minLeadMs) {
      notifications.push({
        id: NOTIF_IDS.eveningFussy45,
        title: 'Lille',
        body: copy.eveningFussy45,
        schedule: { at: eveningNotifyAt },
        channelId: 'lille-reminders',
      });
    }
  }

  if (notifications.length === 0) return;

  try {
    await LocalNotifications.schedule({ notifications });
  } catch (err) {
    console.warn('Could not schedule notifications', err);
  }
}

export async function toggleNotifications(enabled: boolean): Promise<boolean> {
  if (!isNative()) {
    setNotificationsEnabled(enabled);
    return false;
  }

  if (enabled) {
    const current = await LocalNotifications.checkPermissions();
    if (current.display !== 'granted') {
      const result = await LocalNotifications.requestPermissions();
      if (result.display !== 'granted') {
        setNotificationsEnabled(false);
        return false;
      }
    }
    setNotificationsEnabled(true);
    return true;
  }

  setNotificationsEnabled(false);
  await cancelAllBabyNotifications();
  return true;
}
