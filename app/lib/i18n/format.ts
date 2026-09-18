import { Locale, toBcp47 } from './locales';

/** Format clock time for the active locale (14:30 vs 2:30 PM). */
export function formatTime(
  date: Date | string | number,
  locale: Locale,
  options?: Intl.DateTimeFormatOptions,
): string {
  const d = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(d.getTime())) return '';
  return new Intl.DateTimeFormat(toBcp47(locale), {
    hour: 'numeric',
    minute: '2-digit',
    ...options,
  }).format(d);
}

/** Format a calendar date for the active locale. */
export function formatDate(
  date: Date | string | number,
  locale: Locale,
  options?: Intl.DateTimeFormatOptions,
): string {
  const d = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(d.getTime())) return '';
  return new Intl.DateTimeFormat(toBcp47(locale), {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    ...options,
  }).format(d);
}

/** Short date e.g. for lists (day + short month). */
export function formatDateShort(
  date: Date | string | number,
  locale: Locale,
): string {
  return formatDate(date, locale, { day: 'numeric', month: 'short', year: undefined });
}

/** Weekday + date heading (e.g. home screen). */
export function formatDateHeading(
  date: Date | string | number,
  locale: Locale,
): string {
  return formatDate(date, locale, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: undefined,
  });
}

/** Format a number with locale decimal/grouping separators. */
export function formatNumber(
  value: number,
  locale: Locale,
  options?: Intl.NumberFormatOptions,
): string {
  if (!Number.isFinite(value)) return '';
  return new Intl.NumberFormat(toBcp47(locale), options).format(value);
}

/** Monday-first in most of Europe; Sunday-first for en-US style / Japan via locale. */
export function getWeekInfo(locale: Locale): { firstDay: number } {
  const bcp47 = toBcp47(locale);
  try {
    const info = (new Intl.Locale(bcp47) as Intl.Locale & { weekInfo?: { firstDay?: number } }).weekInfo;
    if (info?.firstDay != null) return { firstDay: info.firstDay };
  } catch {
    // older engines
  }
  // Fallback: Europe Mon=1, Japan/US Sun=7 (Intl uses 1=Mon … 7=Sun in weekInfo)
  if (locale === 'ja' || locale === 'en') return { firstDay: 7 };
  return { firstDay: 1 };
}
