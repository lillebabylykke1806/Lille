/**
 * Public i18n exports.
 * Message strings live in ./messages/{locale}.ts (split by language).
 * Locale metadata + Stripe/Intl mapping: ./locales.ts
 * Date/number formatting: ./format.ts
 */

export type { Locale } from './locales';
export {
  LOCALES,
  SPRÅK_NAVN,
  SPRÅK_FLAGG,
  LOCALE_SPRÅKNAVN,
  isLocale,
  toBcp47,
  toStripeLocale,
} from './locales';

export type { OversettelseNøkkel } from './messages';
export { getMessage, messages } from './messages';
