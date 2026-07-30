import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import {
  lærtVåkenvinduMinutter,
  typiskKveldsuroTid,
  erBabySovendeEtter,
  harSovnetEtter,
  sisteVåkenTid,
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

/** Only skip triggers that are already due / past — must be << poll interval (60s). */
const MIN_SCHEDULE_LEAD_MS = 2_000;

/** Skip cancel+reschedule when wake/window/asleep state hasn't changed (home polls every 60s). */
let lastScheduleFingerprint = '';

function isNative(): boolean {
  return Capacitor.isNativePlatform();
}

export function notificationsEnabled(): boolean {
  try {
    return localStorage.getItem(STORAGE_ENABLED) === 'true';
  } catch {
    return false;
  }
}

export function setNotificationsEnabled(enabled: boolean): void {
  try {
    localStorage.setItem(STORAGE_ENABLED, enabled ? 'true' : 'false');
  } catch {
    // ignore
  }
}

export async function requestNotificationPermissionIfNeeded(): Promise<boolean> {
  if (!isNative()) return false;

  try {
    if (localStorage.getItem(STORAGE_ASKED) === 'true') {
      return notificationsEnabled();
    }

    localStorage.setItem(STORAGE_ASKED, 'true');
  } catch {
    return false;
  }

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
    napNow: `We know it's hard to stop the fun when you're having a good time 😊 but it's time to calm down now so ${name} doesn't get overtired`,
    napOverdue15: `Still awake? 🤍 ${name} may be getting overtired — a short rest will help`,
    eveningFussy45: `Evening is approaching 🌅 Time to start the calming routine you know works for ${name}`,
  };
}

type ScheduledNotif = {
  id: number;
  title: string;
  body: string;
  schedule: { at: Date; allowWhileIdle?: boolean };
  channelId?: string;
  extra?: { kind: string };
};

function pushIfFuture(
  list: ScheduledNotif[],
  notif: Omit<ScheduledNotif, 'schedule'> & { at: Date },
  now: number,
) {
  if (notif.at.getTime() <= now + MIN_SCHEDULE_LEAD_MS) return;
  list.push({
    id: notif.id,
    title: notif.title,
    body: notif.body,
    channelId: notif.channelId,
    extra: notif.extra,
    schedule: {
      at: notif.at,
      allowWhileIdle: true,
    },
  });
}

export async function cancelAllBabyNotifications(): Promise<void> {
  if (!isNative()) return;
  lastScheduleFingerprint = '';
  try {
    await LocalNotifications.cancel({
      notifications: Object.values(NOTIF_IDS).map((id) => ({ id })),
    });
  } catch {
    // ignore
  }
}

async function cancelAllBabyNotificationsKeepFingerprint(): Promise<void> {
  if (!isNative()) return;
  try {
    await LocalNotifications.cancel({
      notifications: Object.values(NOTIF_IDS).map((id) => ({ id })),
    });
  } catch {
    // ignore
  }
}

/** Cancel only nap-related reminders (keep evening fussy if desired). */
export async function cancelNapNotifications(): Promise<void> {
  if (!isNative()) return;
  lastScheduleFingerprint = '';
  try {
    await LocalNotifications.cancel({
      notifications: [
        { id: NOTIF_IDS.windDown30 },
        { id: NOTIF_IDS.napNow },
        { id: NOTIF_IDS.napOverdue15 },
      ],
    });
  } catch {
    // ignore
  }
}

export async function scheduleBabyNotifications(params: {
  babyName: string;
  fødselsdato: string;
  lastWakeTime?: Date | null;
  lurer?: LurEntry[];
  uroLogg?: UroEntry[];
  locale: Locale;
}): Promise<void> {
  if (!isNative() || !notificationsEnabled()) {
    await cancelAllBabyNotifications();
    return;
  }

  const { babyName, fødselsdato, lurer = [], uroLogg = [] } = params;
  const copy = notificationCopy(babyName);

  await ensureNotificationChannel();

  const now = Date.now();
  const lastWakeTime = params.lastWakeTime ?? sisteVåkenTid(lurer);
  const alreadyAsleep = lastWakeTime ? erBabySovendeEtter(lurer, lastWakeTime) : false;
  const alreadySleptThisWake = lastWakeTime ? harSovnetEtter(lurer, lastWakeTime) : false;
  const wakeWindow = lærtVåkenvinduMinutter(lurer, fødselsdato);
  const fussyTime = typiskKveldsuroTid(uroLogg);

  const fingerprint = [
    babyName,
    lastWakeTime?.getTime() ?? 'none',
    wakeWindow,
    alreadyAsleep ? 'asleep' : 'awake',
    alreadySleptThisWake ? 'slept' : 'nosleep',
    fussyTime?.getTime() ?? 'nofussy',
  ].join('|');

  // Home screen refreshes every 60s — don't cancel pending napNow just to reschedule the same times.
  if (fingerprint === lastScheduleFingerprint) {
    return;
  }

  // Cancel without clearing fingerprint, then lock fingerprint after a successful plan.
  await cancelAllBabyNotificationsKeepFingerprint();
  lastScheduleFingerprint = fingerprint;

  const notifications: ScheduledNotif[] = [];

  if (lastWakeTime) {
    // If baby is asleep or already registered a sleep after this wake, skip ALL nap reminders.
    if (!alreadyAsleep && !alreadySleptThisWake) {
      const napAt = new Date(lastWakeTime.getTime() + wakeWindow * 60_000);
      const windDownAt = new Date(napAt.getTime() - 30 * 60_000);
      const overdueAt = new Date(napAt.getTime() + 15 * 60_000);

      // 1) 30 min before predicted nap
      pushIfFuture(
        notifications,
        {
          id: NOTIF_IDS.windDown30,
          title: 'Lille',
          body: copy.windDown30,
          at: windDownAt,
          channelId: 'lille-reminders',
          extra: { kind: 'windDown30' },
        },
        now,
      );

      // 2) At predicted nap time (separate id + trigger — must not be skipped/overwritten)
      pushIfFuture(
        notifications,
        {
          id: NOTIF_IDS.napNow,
          title: 'Lille',
          body: copy.napNow,
          at: napAt,
          channelId: 'lille-reminders',
          extra: { kind: 'napNow' },
        },
        now,
      );

      // 3) 15 min after predicted nap if still awake
      pushIfFuture(
        notifications,
        {
          id: NOTIF_IDS.napOverdue15,
          title: 'Lille',
          body: copy.napOverdue15,
          at: overdueAt,
          channelId: 'lille-reminders',
          extra: { kind: 'napOverdue15' },
        },
        now,
      );
    }
  }

  if (fussyTime) {
    const eveningNotifyAt = new Date(fussyTime.getTime() - 45 * 60_000);
    pushIfFuture(
      notifications,
      {
        id: NOTIF_IDS.eveningFussy45,
        title: 'Lille',
        body: copy.eveningFussy45,
        at: eveningNotifyAt,
        channelId: 'lille-reminders',
        extra: { kind: 'eveningFussy45' },
      },
      now,
    );
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
