'use client';
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Locale, oversettelser, OversettelseNøkkel } from './translations';

type LanguageContextType = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (nøkkel: OversettelseNøkkel, variabler?: Record<string, string | number>) => string;
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const detekterSpråk = (): Locale => {
  if (typeof window === 'undefined') return 'en';
  const lagret = localStorage.getItem('lille_språk') as Locale | null;
  if (lagret && ['no', 'en', 'sv', 'da', 'de'].includes(lagret)) return lagret;

  const browserSpråk = navigator.language.toLowerCase();
  if (browserSpråk.startsWith('no')) return 'no';
  if (browserSpråk.startsWith('sv')) return 'sv';
  if (browserSpråk.startsWith('da')) return 'da';
  if (browserSpråk.startsWith('de')) return 'de';
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
    const oversettelse = oversettelser[nøkkel];
    if (!oversettelse) return nøkkel;
    let tekst: string = oversettelse[locale] || oversettelse.en;
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