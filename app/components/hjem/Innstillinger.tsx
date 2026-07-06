'use client';
import { useState, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { farger } from '../../lib/farger';
import { useLanguage } from '../../lib/i18n/LanguageContext';
import { useMåleenhet } from '../../lib/i18n/MåleenhetContext';
import { SPRÅK_NAVN, SPRÅK_FLAGG, Locale } from '../../lib/i18n/translations';
import {
  notificationsEnabled,
  toggleNotifications,
  scheduleBabyNotifications,
} from '../../lib/notifications';
import { supabase } from '../../lib/supabase';
import { hentProfilId } from '../../lib/profilId';

const SPRÅK_KODER: Locale[] = ['no', 'en', 'sv', 'da', 'de'];

type Props = {
  onTilbake: () => void;
  bruker?: any;
  aktivtBarn?: any;
};

export default function Innstillinger({ onTilbake, bruker, aktivtBarn }: Props) {
  const { locale, setLocale, t } = useLanguage();
  const { målesystem, setMålesystem } = useMåleenhet();
  const [varslerPå, setVarslerPå] = useState(false);

  useEffect(() => {
    setVarslerPå(notificationsEnabled());
  }, []);

  const handleVarslerToggle = async () => {
    const nyVerdi = !varslerPå;
    const ok = await toggleNotifications(nyVerdi);
    if (!ok && nyVerdi) return;
    setVarslerPå(nyVerdi);

    if (nyVerdi && bruker && aktivtBarn) {
      const profilId = await hentProfilId(aktivtBarn, bruker);
      if (!profilId) return;

      const fjortenDagerSiden = new Date();
      fjortenDagerSiden.setDate(fjortenDagerSiden.getDate() - 14);
      const fraDato = fjortenDagerSiden.toISOString().split('T')[0];

      const [lurRes, uroRes] = await Promise.all([
        supabase.from('lurer').select('*').eq('profil_id', profilId).gte('dato', fraDato).order('start', { ascending: false }),
        supabase.from('uro_logg').select('tidspunkt').eq('profil_id', profilId).order('dato', { ascending: false }).limit(15),
      ]);

      const oppvåkninger = (lurRes.data || []).filter((l: { type: string; start?: string }) => l.type === 'oppvåkning' && l.start);
      const siste = [...oppvåkninger].sort((a: { dato: string; start?: string }, b: { dato: string; start?: string }) =>
        `${b.dato}T${b.start || ''}`.localeCompare(`${a.dato}T${a.start || ''}`)
      )[0];

      let lastWakeTime: Date | null = null;
      if (siste?.start) {
        const [timer, minutter] = siste.start.split(':').map(Number);
        lastWakeTime = new Date(`${siste.dato}T00:00:00`);
        lastWakeTime.setHours(timer, minutter, 0, 0);
      }

      await scheduleBabyNotifications({
        babyName: aktivtBarn.navn || '',
        fødselsdato: aktivtBarn.fødselsdato || '',
        lastWakeTime,
        lurer: lurRes.data || [],
        uroLogg: uroRes.data || [],
        locale,
      });
    }
  };

  return (
    <div style={{ backgroundColor: farger.bakgrunn, minHeight: '100vh', padding: '0 0 100px' }}>
      {/* Header */}
      <div style={{ padding: '24px 24px 0', display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
        <button onClick={onTilbake} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M15 18L9 12L15 6" stroke={farger.tekst} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <div style={{ fontSize: '22px', fontFamily: 'var(--font-plus-jakarta)', color: farger.tekst, fontWeight: '700' }}>{t('profil.innstillinger')}</div>
      </div>

      <div style={{ padding: '0 24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>

        {/* Språk */}
        <div>
          <div style={{ fontSize: '13px', fontFamily: 'var(--font-inter)', color: farger.tekstLys, fontWeight: '600', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{t('innstillinger.språk')}</div>
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

        {/* Varsler */}
        {Capacitor.isNativePlatform() && (
          <div>
            <div style={{ fontSize: '13px', fontFamily: 'var(--font-inter)', color: farger.tekstLys, fontWeight: '600', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{t('innstillinger.varsler')}</div>
            <div style={{ backgroundColor: farger.hvit, border: `1px solid ${farger.kremMørk}`, borderRadius: '16px', padding: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
                <div>
                  <div style={{ fontSize: '14px', fontFamily: 'var(--font-plus-jakarta)', color: farger.tekst, fontWeight: '600', marginBottom: '4px' }}>
                    {varslerPå ? t('innstillinger.varslerPå') : t('innstillinger.varslerAv')}
                  </div>
                  <div style={{ fontSize: '12px', fontFamily: 'var(--font-inter)', color: farger.tekstLys, lineHeight: 1.5 }}>
                    {t('innstillinger.varslerBeskrivelse')}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleVarslerToggle}
                  aria-pressed={varslerPå}
                  style={{
                    width: '52px',
                    height: '30px',
                    borderRadius: '15px',
                    border: 'none',
                    backgroundColor: varslerPå ? farger.grønn : farger.kremMørk,
                    cursor: 'pointer',
                    position: 'relative',
                    flexShrink: 0,
                    transition: 'background-color 0.2s ease',
                  }}
                >
                  <span style={{
                    position: 'absolute',
                    top: '3px',
                    left: varslerPå ? '25px' : '3px',
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    backgroundColor: farger.hvit,
                    transition: 'left 0.2s ease',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
                  }} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Måleenheter */}
        <div>
          <div style={{ fontSize: '13px', fontFamily: 'var(--font-inter)', color: farger.tekstLys, fontWeight: '600', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{t('innstillinger.måleenheter')}</div>
          <div style={{ backgroundColor: farger.hvit, border: `1px solid ${farger.kremMørk}`, borderRadius: '16px', padding: '16px', display: 'flex', gap: '10px' }}>
            <button onClick={() => setMålesystem('metrisk')} style={{ flex: 1, padding: '16px', borderRadius: '14px', border: målesystem === 'metrisk' ? `2px solid ${farger.grønn}` : `1px solid ${farger.kremMørk}`, backgroundColor: målesystem === 'metrisk' ? farger.grønnLys : farger.bakgrunn, cursor: 'pointer' }}>
              <div style={{ fontSize: '24px', marginBottom: '8px' }}>📏</div>
              <div style={{ fontSize: '14px', fontFamily: 'var(--font-plus-jakarta)', color: målesystem === 'metrisk' ? farger.grønn : farger.tekst, fontWeight: '700', marginBottom: '4px' }}>{t('innstillinger.metrisk')}</div>
              <div style={{ fontSize: '11px', fontFamily: 'var(--font-inter)', color: farger.tekstLys, lineHeight: 1.4 }}>kg · cm · ml · °C</div>
            </button>
            <button onClick={() => setMålesystem('imperisk')} style={{ flex: 1, padding: '16px', borderRadius: '14px', border: målesystem === 'imperisk' ? `2px solid ${farger.grønn}` : `1px solid ${farger.kremMørk}`, backgroundColor: målesystem === 'imperisk' ? farger.grønnLys : farger.bakgrunn, cursor: 'pointer' }}>
              <div style={{ fontSize: '24px', marginBottom: '8px' }}>🇺🇸</div>
              <div style={{ fontSize: '14px', fontFamily: 'var(--font-plus-jakarta)', color: målesystem === 'imperisk' ? farger.grønn : farger.tekst, fontWeight: '700', marginBottom: '4px' }}>{t('innstillinger.imperisk')}</div>
              <div style={{ fontSize: '11px', fontFamily: 'var(--font-inter)', color: farger.tekstLys, lineHeight: 1.4 }}>lb/oz · in/ft · fl oz · °F</div>
            </button>
          </div>
          {målesystem === 'imperisk' && (
            <div style={{ marginTop: '10px', padding: '12px 16px', backgroundColor: farger.grønnLys, border: `1px solid ${farger.grønn}`, borderRadius: '12px' }}>
              <div style={{ fontSize: '12px', fontFamily: 'var(--font-inter)', color: farger.grønn, lineHeight: 1.5 }}>
                {t('innstillinger.imperiskInfo')}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
