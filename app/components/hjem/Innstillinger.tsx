'use client';
import { farger } from '../../lib/farger';
import { useLanguage } from '../../lib/i18n/LanguageContext';
import { useMåleenhet } from '../../lib/i18n/MåleenhetContext';
import { SPRÅK_NAVN, SPRÅK_FLAGG, Locale } from '../../lib/i18n/translations';

const SPRÅK_KODER: Locale[] = ['no', 'en', 'sv', 'da', 'de'];

type Props = { onTilbake: () => void; };

export default function Innstillinger({ onTilbake }: Props) {
  const { locale, setLocale } = useLanguage();
  const { målesystem, setMålesystem } = useMåleenhet();

  return (
    <div style={{ backgroundColor: farger.bakgrunn, minHeight: '100vh', padding: '0 0 100px' }}>
      {/* Header */}
      <div style={{ padding: '24px 24px 0', display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
        <button onClick={onTilbake} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M15 18L9 12L15 6" stroke={farger.tekst} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <div style={{ fontSize: '22px', fontFamily: 'var(--font-plus-jakarta)', color: farger.tekst, fontWeight: '700' }}>Innstillinger</div>
      </div>

      <div style={{ padding: '0 24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>

        {/* Språk */}
        <div>
          <div style={{ fontSize: '13px', fontFamily: 'var(--font-inter)', color: farger.tekstLys, fontWeight: '600', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Språk</div>
          <div style={{ backgroundColor: farger.hvit, border: `1px solid ${farger.kremMørk}`, borderRadius: '16px', padding: '16px' }}>
            <div style={{ display: 'flex', gap: '8px' }}>
              {SPRÅK_KODER.map((code) => (
                <button key={code} onClick={() => setLocale(code)} style={{ flex: 1, padding: '10px 4px', borderRadius: '12px', border: locale === code ? `2px solid ${farger.grønn}` : `1px solid ${farger.kremMørk}`, backgroundColor: locale === code ? farger.grønnLys : farger.bakgrunn, cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                  <span style={{ fontSize: '20px' }}>{SPRÅK_FLAGG[code]}</span>
                  <span style={{ fontSize: '10px', fontFamily: 'var(--font-inter)', color: locale === code ? farger.grønn : farger.tekstLys, fontWeight: locale === code ? '600' : '400' }}>{SPRÅK_NAVN[code]}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Måleenheter */}
        <div>
          <div style={{ fontSize: '13px', fontFamily: 'var(--font-inter)', color: farger.tekstLys, fontWeight: '600', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Måleenheter</div>
          <div style={{ backgroundColor: farger.hvit, border: `1px solid ${farger.kremMørk}`, borderRadius: '16px', padding: '16px', display: 'flex', gap: '10px' }}>
            <button onClick={() => setMålesystem('metrisk')} style={{ flex: 1, padding: '16px', borderRadius: '14px', border: målesystem === 'metrisk' ? `2px solid ${farger.grønn}` : `1px solid ${farger.kremMørk}`, backgroundColor: målesystem === 'metrisk' ? farger.grønnLys : farger.bakgrunn, cursor: 'pointer' }}>
              <div style={{ fontSize: '24px', marginBottom: '8px' }}>📏</div>
              <div style={{ fontSize: '14px', fontFamily: 'var(--font-plus-jakarta)', color: målesystem === 'metrisk' ? farger.grønn : farger.tekst, fontWeight: '700', marginBottom: '4px' }}>Metrisk</div>
              <div style={{ fontSize: '11px', fontFamily: 'var(--font-inter)', color: farger.tekstLys, lineHeight: 1.4 }}>kg · cm · ml · °C</div>
            </button>
            <button onClick={() => setMålesystem('imperisk')} style={{ flex: 1, padding: '16px', borderRadius: '14px', border: målesystem === 'imperisk' ? `2px solid ${farger.grønn}` : `1px solid ${farger.kremMørk}`, backgroundColor: målesystem === 'imperisk' ? farger.grønnLys : farger.bakgrunn, cursor: 'pointer' }}>
              <div style={{ fontSize: '24px', marginBottom: '8px' }}>🇺🇸</div>
              <div style={{ fontSize: '14px', fontFamily: 'var(--font-plus-jakarta)', color: målesystem === 'imperisk' ? farger.grønn : farger.tekst, fontWeight: '700', marginBottom: '4px' }}>Imperisk</div>
              <div style={{ fontSize: '11px', fontFamily: 'var(--font-inter)', color: farger.tekstLys, lineHeight: 1.4 }}>lb/oz · in/ft · fl oz · °F</div>
            </button>
          </div>
          {målesystem === 'imperisk' && (
            <div style={{ marginTop: '10px', padding: '12px 16px', backgroundColor: farger.grønnLys, border: `1px solid ${farger.grønn}`, borderRadius: '12px' }}>
              <div style={{ fontSize: '12px', fontFamily: 'var(--font-inter)', color: farger.grønn, lineHeight: 1.5 }}>
                ✓ Vekt vises i lb/oz · Lengde i ft/in · Væske i fl oz · Temperatur i °F
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
