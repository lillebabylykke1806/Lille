export type Locale = 'no' | 'en' | 'sv' | 'da' | 'de';

export const SPRÅK_NAVN: Record<Locale, string> = {
  no: 'Norsk', en: 'English', sv: 'Svenska', da: 'Dansk', de: 'Deutsch',
};

export const SPRÅK_FLAGG: Record<Locale, string> = {
  no: '🇳🇴', en: '🇬🇧', sv: '🇸🇪', da: '🇩🇰', de: '🇩🇪',
};

export const oversettelser = {
  'felles.lagre': { no: 'Lagre', en: 'Save', sv: 'Spara', da: 'Gem', de: 'Speichern' },
  'felles.avbryt': { no: 'Avbryt', en: 'Cancel', sv: 'Avbryt', da: 'Annuller', de: 'Abbrechen' },
  'felles.slett': { no: 'Slett', en: 'Delete', sv: 'Radera', da: 'Slet', de: 'Löschen' },
  'felles.rediger': { no: 'Rediger', en: 'Edit', sv: 'Redigera', da: 'Rediger', de: 'Bearbeiten' },
  'felles.lukk': { no: 'Lukk', en: 'Close', sv: 'Stäng', da: 'Luk', de: 'Schließen' },
  'felles.laster': { no: 'Laster...', en: 'Loading...', sv: 'Laddar...', da: 'Indlæser...', de: 'Lädt...' },

  'nav.hjem': { no: 'Hjem', en: 'Home', sv: 'Hem', da: 'Hjem', de: 'Start' },
  'nav.søvn': { no: 'Søvn', en: 'Sleep', sv: 'Sömn', da: 'Søvn', de: 'Schlaf' },
  'nav.innsikt': { no: 'Innsikt', en: 'Insights', sv: 'Insikter', da: 'Indsigt', de: 'Einblicke' },
  'nav.profil': { no: 'Profil', en: 'Profile', sv: 'Profil', da: 'Profil', de: 'Profil' },

  'hjem.godMorgen': { no: 'God morgen', en: 'Good morning', sv: 'God morgon', da: 'Godmorgen', de: 'Guten Morgen' },
  'hjem.godEttermiddag': { no: 'God ettermiddag', en: 'Good afternoon', sv: 'God eftermiddag', da: 'God eftermiddag', de: 'Guten Tag' },
  'hjem.godKveld': { no: 'God kveld', en: 'Good evening', sv: 'God kväll', da: 'God aften', de: 'Guten Abend' },
  'hjem.lurPågår': { no: 'Lur pågår', en: 'Nap in progress', sv: 'Tupplur pågår', da: 'Lur i gang', de: 'Schläfchen läuft' },
  'hjem.nesteLur': { no: 'Neste lur', en: 'Next nap', sv: 'Nästa tupplur', da: 'Næste lur', de: 'Nächstes Nickerchen' },
  'hjem.dagensFlyt': { no: 'Dagens flyt', en: "Today's flow", sv: 'Dagens flöde', da: 'Dagens flow', de: 'Heutiger Ablauf' },
  'hjem.seDagbok': { no: 'Se dagbok', en: 'View diary', sv: 'Se dagbok', da: 'Se dagbog', de: 'Tagebuch ansehen' },

  'profil.tittel': { no: 'Profil', en: 'Profile', sv: 'Profil', da: 'Profil', de: 'Profil' },
  'profil.loggUt': { no: 'Logg ut', en: 'Log out', sv: 'Logga ut', da: 'Log ud', de: 'Abmelden' },
  'profil.språk': { no: 'Språk', en: 'Language', sv: 'Språk', da: 'Sprog', de: 'Sprache' },

  'innlogging.velkommen': { no: 'Velkommen til Lille', en: 'Welcome to Lille', sv: 'Välkommen till Lille', da: 'Velkommen til Lille', de: 'Willkommen bei Lille' },
  'innlogging.heiIgjen': { no: 'Hei igjen!', en: 'Hi again!', sv: 'Hej igen!', da: 'Hej igen!', de: 'Hallo wieder!' },
  'innlogging.loggInn': { no: 'Logg inn', en: 'Log in', sv: 'Logga in', da: 'Log ind', de: 'Anmelden' },
  'innlogging.opprettKonto': { no: 'Opprett konto', en: 'Create account', sv: 'Skapa konto', da: 'Opret konto', de: 'Konto erstellen' },
} as const;

export type OversettelseNøkkel = keyof typeof oversettelser;