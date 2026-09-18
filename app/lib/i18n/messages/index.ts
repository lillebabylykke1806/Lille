import type { Locale } from '../locales';
import no from './no';
import en from './en';
import sv from './sv';
import da from './da';
import de from './de';
import es from './es';
import fr from './fr';
import it from './it';
import nl from './nl';
import pl from './pl';
import fi from './fi';
import ja from './ja';

/** Norwegian is the complete key catalog. */
export type OversettelseNøkkel = keyof typeof no;

type MessageTable = { readonly [key: string]: string };

export const messages: Record<Locale, MessageTable> = {
  no,
  en,
  sv,
  da,
  de,
  es,
  fr,
  it,
  nl,
  pl,
  fi,
  ja,
};

export function getMessage(locale: Locale, key: string): string {
  return messages[locale]?.[key] || messages.en?.[key] || messages.no?.[key] || key;
}
