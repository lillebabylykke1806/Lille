/** App language codes. Norwegian stays `no` internally; map to `nb` for Stripe/Intl. */

export const LOCALES = [
  'no',
  'en',
  'sv',
  'da',
  'de',
  'es',
  'fr',
  'it',
  'nl',
  'pl',
  'fi',
  'ja',
] as const;

export type Locale = (typeof LOCALES)[number];

/** Native language names (autonyms) for the language picker. */
export const SPRÅK_NAVN: Record<Locale, string> = {
  no: 'Norsk',
  en: 'English',
  sv: 'Svenska',
  da: 'Dansk',
  de: 'Deutsch',
  es: 'Español',
  fr: 'Français',
  it: 'Italiano',
  nl: 'Nederlands',
  pl: 'Polski',
  fi: 'Suomi',
  ja: '日本語',
};

export const SPRÅK_FLAGG: Record<Locale, string> = {
  no: '🇳🇴',
  en: '🇬🇧',
  sv: '🇸🇪',
  da: '🇩🇰',
  de: '🇩🇪',
  es: '🇪🇸',
  fr: '🇫🇷',
  it: '🇮🇹',
  nl: '🇳🇱',
  pl: '🇵🇱',
  fi: '🇫🇮',
  ja: '🇯🇵',
};

/** Language names for AI prompts (“svar på …”). */
export const LOCALE_SPRÅKNAVN: Record<Locale, string> = {
  no: 'norsk',
  en: 'English',
  sv: 'svenska',
  da: 'dansk',
  de: 'Deutsch',
  es: 'español',
  fr: 'français',
  it: 'italiano',
  nl: 'Nederlands',
  pl: 'polski',
  fi: 'suomi',
  ja: '日本語',
};

export function isLocale(value: string | null | undefined): value is Locale {
  return !!value && (LOCALES as readonly string[]).includes(value);
}

/** BCP-47 tag for Intl (`no` → `nb-NO`). */
export function toBcp47(locale: Locale): string {
  switch (locale) {
    case 'no':
      return 'nb-NO';
    case 'en':
      return 'en-GB';
    case 'sv':
      return 'sv-SE';
    case 'da':
      return 'da-DK';
    case 'de':
      return 'de-DE';
    case 'es':
      return 'es-ES';
    case 'fr':
      return 'fr-FR';
    case 'it':
      return 'it-IT';
    case 'nl':
      return 'nl-NL';
    case 'pl':
      return 'pl-PL';
    case 'fi':
      return 'fi-FI';
    case 'ja':
      return 'ja-JP';
    default:
      return 'en-GB';
  }
}

/** Stripe Checkout locale (`no` → `nb`). Unknown → `auto`. */
export function toStripeLocale(
  raw: unknown,
): 'auto' | 'nb' | 'en' | 'sv' | 'da' | 'de' | 'es' | 'fr' | 'it' | 'nl' | 'pl' | 'fi' | 'ja' {
  const code = typeof raw === 'string' ? raw.trim().toLowerCase() : '';
  switch (code) {
    case 'no':
      return 'nb';
    case 'en':
      return 'en';
    case 'sv':
      return 'sv';
    case 'da':
      return 'da';
    case 'de':
      return 'de';
    case 'es':
      return 'es';
    case 'fr':
      return 'fr';
    case 'it':
      return 'it';
    case 'nl':
      return 'nl';
    case 'pl':
      return 'pl';
    case 'fi':
      return 'fi';
    case 'ja':
      return 'ja';
    default:
      return 'auto';
  }
}
