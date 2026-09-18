'use client';
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Locale, isLocale } from './locales';
import { getMessage, type OversettelseNøkkel } from './messages';

type LanguageContextType = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (nøkkel: OversettelseNøkkel, variabler?: Record<string, string | number>) => string;
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const detekterSpråk = (): Locale => {
  if (typeof window === 'undefined') return 'en';
  const lagret = localStorage.getItem('lille_språk');
  // Keep accepting stored `no` as-is (no migration). New locales are also valid.
  if (isLocale(lagret)) return lagret;

  const browserSpråk = navigator.language.toLowerCase();
  if (browserSpråk.startsWith('nb') || browserSpråk.startsWith('no') || browserSpråk.startsWith('nn')) return 'no';
  if (browserSpråk.startsWith('sv')) return 'sv';
  if (browserSpråk.startsWith('da')) return 'da';
  if (browserSpråk.startsWith('de')) return 'de';
  if (browserSpråk.startsWith('es')) return 'es';
  if (browserSpråk.startsWith('fr')) return 'fr';
  if (browserSpråk.startsWith('it')) return 'it';
  if (browserSpråk.startsWith('nl')) return 'nl';
  if (browserSpråk.startsWith('pl')) return 'pl';
  if (browserSpråk.startsWith('fi')) return 'fi';
  if (browserSpråk.startsWith('ja')) return 'ja';
  return 'en';
};

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('en');

  useEffect(() => {
    setLocaleState(detekterSpråk());
  }, []);

  const setLocale = (nyttSpråk: Locale) => {
    setLocaleState(nyttSpråk);
    localStorage.setItem('lille_språk', nyttSpråk);
  };

  const t = (nøkkel: OversettelseNøkkel, variabler?: Record<string, string | number>): string => {
    let tekst = getMessage(locale, nøkkel);
    if (variabler) {
      Object.entries(variabler).forEach(([key, value]) => {
        tekst = tekst.replace(`{${key}}`, String(value));
      });
    }
    return tekst;
  };

  return (
    <LanguageContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage må brukes inni LanguageProvider');
  return context;
}
