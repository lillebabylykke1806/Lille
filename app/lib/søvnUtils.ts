export type LurEntry = {
  dato: string;
  type: string;
  start?: string | null;
  slutt?: string | null;
  varighet?: number | null;
};

function parseTimeOnDate(dateStr: string, timeStr: string): Date {
  const [h, m] = (timeStr || '00:00').slice(0, 5).split(':').map(Number);
  const d = new Date(`${dateStr}T00:00:00`);
  d.setHours(h, m, 0, 0);
  return d;
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

function wakeStartTime(entry: LurEntry): Date | null {
  if (!entry.start) return null;
  if (entry.type === 'oppvåkning') {
    return parseTimeOnDate(entry.dato, entry.start);
  }
  if ((entry.type === 'lur' || entry.type === 'natt') && entry.slutt) {
    const sleepStart = parseTimeOnDate(entry.dato, entry.start);
    const endSameDay = parseTimeOnDate(entry.dato, entry.slutt);
    if (endSameDay <= sleepStart) {
      const nextDay = new Date(entry.dato);
      nextDay.setDate(nextDay.getDate() + 1);
      return parseTimeOnDate(nextDay.toISOString().split('T')[0], entry.slutt);
    }
    return endSameDay;
  }
  return null;
}

/** Average wake window learned from recent sleep registrations, with age-based fallback. */
export function lærtVåkenvinduMinutter(lurer: LurEntry[], fødselsdato: string): number {
  const fallback = våkenvinduMinutter(fødselsdato);
  const sorted = [...lurer]
    .filter((l) => l.start && l.dato)
    .sort((a, b) => `${a.dato}T${a.start}`.localeCompare(`${b.dato}T${b.start}`));

  const wakeWindows: number[] = [];

  for (let i = 0; i < sorted.length; i++) {
    const wakeStart = wakeStartTime(sorted[i]);
    if (!wakeStart) continue;

    for (let j = i + 1; j < sorted.length; j++) {
      const next = sorted[j];
      if ((next.type === 'lur' || next.type === 'natt') && next.start) {
        const sleepStart = parseTimeOnDate(next.dato, next.start);
        const minutes = Math.round((sleepStart.getTime() - wakeStart.getTime()) / 60000);
        if (minutes >= 20 && minutes <= 300) {
          wakeWindows.push(minutes);
        }
        break;
      }
    }
  }

  if (wakeWindows.length < 2) return fallback;
  const recent = wakeWindows.slice(-10);
  return Math.round(recent.reduce((sum, m) => sum + m, 0) / recent.length);
}

export type UroEntry = { tidspunkt: string };

/** Typical evening fussiness time based on registered uro episodes. */
export function typiskKveldsuroTid(uroLogg: UroEntry[]): Date | null {
  if (uroLogg.length < 3) return null;

  const tidspunkter = uroLogg.slice(0, 10).map((l) => {
    const [h, m] = l.tidspunkt.split(':').map(Number);
    return h * 60 + m;
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
    if (l.type !== 'lur' && l.type !== 'natt') return false;
    if (!l.start) return false;
    const sleepStart = parseTimeOnDate(l.dato, l.start);
    return sleepStart.getTime() > etter.getTime() && sleepStart.getTime() <= før.getTime();
  });
}
