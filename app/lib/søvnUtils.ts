export type LurEntry = {
  dato: string;
  type: string;
  start?: string | null;
  slutt?: string | null;
  varighet?: number | null;
};

/** Parse HH:MM / HH.MM (and optional seconds) onto a calendar date. */
function parseTimeOnDate(dateStr: string, timeStr: string): Date {
  const normalized = (timeStr || '00:00').trim().replace(/\./g, ':');
  const [h, m] = normalized.slice(0, 5).split(':').map(Number);
  const d = new Date(`${dateStr}T00:00:00`);
  d.setHours(h || 0, m || 0, 0, 0);
  return d;
}

function sleepStartTime(entry: LurEntry): Date | null {
  if (!entry.start || (entry.type !== 'lur' && entry.type !== 'natt')) return null;
  return parseTimeOnDate(entry.dato, entry.start);
}

function sleepEndTime(entry: LurEntry): Date | null {
  if (!entry.start) return null;
  const sleepStart = parseTimeOnDate(entry.dato, entry.start);

  if (entry.slutt) {
    const endSameDay = parseTimeOnDate(entry.dato, entry.slutt);
    if (endSameDay <= sleepStart) {
      const nextDay = new Date(entry.dato);
      nextDay.setDate(nextDay.getDate() + 1);
      return parseTimeOnDate(nextDay.toISOString().split('T')[0], entry.slutt);
    }
    return endSameDay;
  }

  if (entry.varighet && entry.varighet > 0) {
    return new Date(sleepStart.getTime() + entry.varighet * 60000);
  }

  return null;
}

/** Minutes of sleep (lur/natt) that fall on the given calendar day. */
export function søvnMinutterForDag(lurer: LurEntry[], targetDato: string): number {
  const targetStart = new Date(`${targetDato}T00:00:00`);
  const targetEnd = new Date(`${targetDato}T23:59:59.999`);

  let total = 0;

  for (const l of lurer) {
    if (l.type !== 'lur' && l.type !== 'natt') continue;
    if (!l.start) continue;

    const sleepStart = parseTimeOnDate(l.dato, l.start);
    const sleepEnd = sleepEndTime(l);
    if (!sleepEnd) continue;

    const overlapStart = Math.max(sleepStart.getTime(), targetStart.getTime());
    const overlapEnd = Math.min(sleepEnd.getTime(), targetEnd.getTime());

    if (overlapEnd > overlapStart) {
      total += Math.round((overlapEnd - overlapStart) / 60000);
    }
  }

  return total;
}

export function våkenvinduMinutter(fødselsdato: string): number {
  if (!fødselsdato) return 90;
  const nå = new Date();
  const født = new Date(fødselsdato);
  const alder = (nå.getFullYear() - født.getFullYear()) * 12 + (nå.getMonth() - født.getMonth());
  if (alder < 2) return 45;
  if (alder < 4) return 75;
  if (alder < 6) return 120;
  if (alder < 9) return 150;
  if (alder < 12) return 180;
  return 210;
}

/** Wake moment from an oppvåkning row, or from the end of a completed lur/natt. */
function wakeStartTime(entry: LurEntry): Date | null {
  if (!entry.start) return null;
  if (entry.type === 'oppvåkning') {
    return parseTimeOnDate(entry.dato, entry.start);
  }
  if (entry.type === 'lur' || entry.type === 'natt') {
    return sleepEndTime(entry);
  }
  return null;
}

function sortKey(entry: LurEntry): string {
  const t = (entry.start || '00:00').replace(/\./g, ':').slice(0, 5);
  return `${entry.dato}T${t}`;
}

/**
 * Most recent actual wake time: latest of
 * - explicit oppvåkning registrations
 * - end times of completed lur/natt sessions
 */
export function sisteVåkenTid(lurer: LurEntry[]): Date | null {
  let latest: Date | null = null;

  for (const entry of lurer) {
    const wake = wakeStartTime(entry);
    if (!wake) continue;
    if (!latest || wake.getTime() > latest.getTime()) {
      latest = wake;
    }
  }

  return latest;
}

/**
 * True if baby has an active (ongoing) sleep session after the given wake time,
 * or any completed sleep that started after that wake.
 */
export function erBabySovendeEtter(lurer: LurEntry[], etter: Date, nå: Date = new Date()): boolean {
  for (const l of lurer) {
    const sleepStart = sleepStartTime(l);
    if (!sleepStart) continue;
    if (sleepStart.getTime() <= etter.getTime()) continue;

    // Ongoing sleep: started after wake, no end yet
    if (!l.slutt && !(l.varighet && l.varighet > 0)) {
      return true;
    }

    const sleepEnd = sleepEndTime(l);
    if (sleepEnd && sleepStart.getTime() <= nå.getTime() && nå.getTime() < sleepEnd.getTime()) {
      return true;
    }
  }

  // Active local session (registered from this device, may race ahead of reload)
  try {
    if (typeof localStorage !== 'undefined' && localStorage.getItem('lille_starttid')) {
      return true;
    }
  } catch {
    // ignore
  }

  return false;
}

/** True if any lur/natt started after `etter` (early or on-time sleep both count). */
export function harSovnetEtter(lurer: LurEntry[], etter: Date): boolean {
  return lurer.some((l) => {
    const sleepStart = sleepStartTime(l);
    return !!sleepStart && sleepStart.getTime() > etter.getTime();
  });
}

/**
 * Average wake window learned from EVERY actual wake→sleep interval,
 * including early sleeps. Uses recent samples (weighted toward newest).
 */
export function lærtVåkenvinduMinutter(lurer: LurEntry[], fødselsdato: string): number {
  const fallback = våkenvinduMinutter(fødselsdato);
  const sorted = [...lurer]
    .filter((l) => l.start && l.dato)
    .sort((a, b) => sortKey(a).localeCompare(sortKey(b)));

  // Collect unique wake moments (dedupe oppvåkning + sleep-end within 5 min)
  const wakeMoments: Date[] = [];
  for (const entry of sorted) {
    const wakeStart = wakeStartTime(entry);
    if (!wakeStart) continue;
    const dup = wakeMoments.some((w) => Math.abs(w.getTime() - wakeStart.getTime()) < 5 * 60_000);
    if (!dup) wakeMoments.push(wakeStart);
  }

  const wakeWindows: number[] = [];

  for (const wakeStart of wakeMoments) {
    let nextSleep: Date | null = null;
    for (const entry of sorted) {
      const sleepStart = sleepStartTime(entry);
      if (!sleepStart) continue;
      if (sleepStart.getTime() <= wakeStart.getTime()) continue;
      nextSleep = sleepStart;
      break;
    }
    if (!nextSleep) continue;

    const minutes = Math.round((nextSleep.getTime() - wakeStart.getTime()) / 60000);
    // Include early sleepers (from ~15 min) and long windows up to 6h
    if (minutes >= 15 && minutes <= 360) {
      wakeWindows.push(minutes);
    }
  }

  if (wakeWindows.length === 0) return fallback;
  if (wakeWindows.length === 1) {
    // Blend single observation with age fallback so one early nap still moves the needle
    return Math.round(wakeWindows[0] * 0.6 + fallback * 0.4);
  }

  const recent = wakeWindows.slice(-10);
  // Weight newer windows more so early-sleep patterns adapt quickly
  let weightSum = 0;
  let weighted = 0;
  recent.forEach((m, idx) => {
    const w = idx + 1;
    weighted += m * w;
    weightSum += w;
  });
  return Math.round(weighted / weightSum);
}

export type UroEntry = { tidspunkt: string };

/** Typical evening fussiness time based on registered uro episodes. */
export function typiskKveldsuroTid(uroLogg: UroEntry[]): Date | null {
  if (uroLogg.length < 3) return null;

  const tidspunkter = uroLogg.slice(0, 10).map((l) => {
    const normalized = (l.tidspunkt || '00:00').replace(/\./g, ':');
    const [h, m] = normalized.split(':').map(Number);
    return (h || 0) * 60 + (m || 0);
  });
  const gjsnitt = Math.round(tidspunkter.reduce((a, b) => a + b, 0) / tidspunkter.length);
  const d = new Date();
  d.setHours(Math.floor(gjsnitt / 60), gjsnitt % 60, 0, 0);
  if (d.getTime() <= Date.now()) {
    d.setDate(d.getDate() + 1);
  }
  return d;
}

export function harRegistrertLurEtter(lurer: LurEntry[], etter: Date, før: Date): boolean {
  return lurer.some((l) => {
    const sleepStart = sleepStartTime(l);
    if (!sleepStart) return false;
    return sleepStart.getTime() > etter.getTime() && sleepStart.getTime() <= før.getTime();
  });
}
