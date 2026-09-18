'use client';
import { useState, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { farger } from '../../lib/farger';
import { useLanguage } from '../../lib/i18n/LanguageContext';
import { useMåleenhet } from '../../lib/i18n/MåleenhetContext';
import { SPRÅK_NAVN, SPRÅK_FLAGG, LOCALES } from '../../lib/i18n/translations';
import { formatDate } from '../../lib/i18n/format';
import { sisteVåkenTid } from '../../lib/søvnUtils';
import {
  notificationsEnabled,
  toggleNotifications,
  scheduleBabyNotifications,
} from '../../lib/notifications';
import { supabase } from '../../lib/supabase';
import { hentProfilId } from '../../lib/profilId';
import { PERSONVERN_URL, VILKAR_URL } from '../../lib/consent';

const SUPABASE_URL = 'https://hicdsrqhgjdvjctxcucr.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhpY2RzcnFoZ2pkdmpjdHhjdWNyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgzNDMxNDEsImV4cCI6MjA5MzkxOTE0MX0.l8N5-LjFNakStf2ZF0-TyrD9Vg9ooFKihzh53L-NXNo';

type SamtykkeProfil = {
  vilkaar_godtatt_tid: string | null;
  vilkaar_versjon: string | null;
  personvern_godtatt_tid: string | null;
  personvern_versjon: string | null;
  markedsforing_samtykke: boolean | null;
};

type Props = {
  onTilbake: () => void;
  bruker?: any;
  aktivtBarn?: any;
};

export default function Innstillinger({ onTilbake, bruker, aktivtBarn }: Props) {
  const { locale, setLocale, t } = useLanguage();
  const { målesystem, setMålesystem } = useMåleenhet();
  const [varslerPå, setVarslerPå] = useState(false);
  const [samtykke, setSamtykke] = useState<SamtykkeProfil | null>(null);
  const [lasterSamtykke, setLasterSamtykke] = useState(true);
  const [oppdatererMarkedsforing, setOppdatererMarkedsforing] = useState(false);
  const [visSlettBekreftelse, setVisSlettBekreftelse] = useState(false);
  const [sletterKonto, setSletterKonto] = useState(false);
  const [slettFeil, setSlettFeil] = useState('');
  const [språkÅpen, setSpråkÅpen] = useState(false);

  const formatSamtykkeDato = (iso: string | null | undefined) => {
    if (!iso) return '';
    try {
      return formatDate(iso, locale, { year: 'numeric', month: 'short', day: 'numeric' });
    } catch {
      return iso.slice(0, 10);
    }
  };

  useEffect(() => {
    setVarslerPå(notificationsEnabled());
  }, []);

  useEffect(() => {
    const last = async () => {
      if (!bruker?.id) {
        setLasterSamtykke(false);
        return;
      }
      const { data } = await supabase
        .from('profiler')
        .select('vilkaar_godtatt_tid, vilkaar_versjon, personvern_godtatt_tid, personvern_versjon, markedsforing_samtykke')
        .eq('id', bruker.id)
        .maybeSingle();
      setSamtykke((data as SamtykkeProfil | null) ?? null);
      setLasterSamtykke(false);
    };
    void last();
  }, [bruker?.id]);

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

      await scheduleBabyNotifications({
        babyName: aktivtBarn.navn || '',
        fødselsdato: aktivtBarn.fødselsdato || '',
        lastWakeTime: sisteVåkenTid(lurRes.data || []),
        lurer: lurRes.data || [],
        uroLogg: uroRes.data || [],
        locale,
      });
    }
  };

  const toggleMarkedsforing = async () => {
    if (!bruker?.id || oppdatererMarkedsforing) return;
    const ny = !(samtykke?.markedsforing_samtykke ?? false);
    setOppdatererMarkedsforing(true);
    const { error } = await supabase
      .from('profiler')
      .update({ markedsforing_samtykke: ny })
      .eq('id', bruker.id);
    if (!error) {
      setSamtykke((prev) => prev ? { ...prev, markedsforing_samtykke: ny } : {
        vilkaar_godtatt_tid: null,
        vilkaar_versjon: null,
        personvern_godtatt_tid: null,
        personvern_versjon: null,
        markedsforing_samtykke: ny,
      });
      if (ny && bruker.email) {
        void fetch('/api/nyhetsbrev', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: bruker.email }),
        }).catch(() => {});
      }
    }
    setOppdatererMarkedsforing(false);
  };

  const slettKonto = async () => {
    if (sletterKonto) return;
    setSlettFeil('');
    setSletterKonto(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        setSlettFeil(t('settings.consent.slettFeilet'));
        return;
      }

      const res = await fetch(`${SUPABASE_URL}/functions/v1/delete-account`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
          apikey: SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({}),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.error) {
        setSlettFeil(data.error || t('settings.consent.slettFeilet'));
        return;
      }

      await supabase.auth.signOut();
      window.location.href = '/';
    } catch {
      setSlettFeil(t('settings.consent.slettFeilet'));
    } finally {
      setSletterKonto(false);
    }
  };

  const markedsforingPå = samtykke?.markedsforing_samtykke ?? false;

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
          <div style={{ backgroundColor: farger.hvit, border: `1px solid ${farger.kremMørk}`, borderRadius: '16px', padding: '8px', position: 'relative' }}>
            <button
              type="button"
              onClick={() => setSpråkÅpen((v) => !v)}
              aria-expanded={språkÅpen}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 14px',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                textAlign: 'left',
                fontFamily: 'var(--font-inter)',
              }}
            >
              <span style={{ fontSize: '22px', lineHeight: 1 }}>{SPRÅK_FLAGG[locale]}</span>
              <span style={{ flex: 1, fontSize: '15px', fontWeight: 600, color: farger.tekst }}>{SPRÅK_NAVN[locale]}</span>
              <span style={{ fontSize: '12px', color: farger.tekstLys }}>{språkÅpen ? '▴' : '▾'}</span>
            </button>
            {språkÅpen && (
              <div
                style={{
                  marginTop: '4px',
                  borderTop: `1px solid ${farger.kremMørk}`,
                  maxHeight: '280px',
                  overflowY: 'auto',
                }}
              >
                {LOCALES.map((code) => (
                  <button
                    key={code}
                    type="button"
                    onClick={() => {
                      setLocale(code);
                      setSpråkÅpen(false);
                    }}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '12px 14px',
                      background: locale === code ? farger.grønnLys : 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      textAlign: 'left',
                      fontFamily: 'var(--font-inter)',
                    }}
                  >
                    <span style={{ fontSize: '20px', lineHeight: 1 }}>{SPRÅK_FLAGG[code]}</span>
                    <span style={{ flex: 1, fontSize: '14px', fontWeight: locale === code ? 600 : 400, color: locale === code ? farger.grønn : farger.tekst }}>
                      {SPRÅK_NAVN[code]}
                    </span>
                    {locale === code && <span style={{ color: farger.grønn, fontSize: '14px' }}>✓</span>}
                  </button>
                ))}
              </div>
            )}
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

        {/* Samtykker */}
        <div>
          <div style={{ fontSize: '13px', fontFamily: 'var(--font-inter)', color: farger.tekstLys, fontWeight: '600', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{t('settings.consent.title')}</div>
          <div style={{ backgroundColor: farger.hvit, border: `1px solid ${farger.kremMørk}`, borderRadius: '16px', padding: '16px' }}>
            {lasterSamtykke ? (
              <div style={{ fontSize: '13px', color: farger.tekstLys, fontFamily: 'var(--font-inter)' }}>{t('felles.laster')}</div>
            ) : (
              <>
                <div style={{ fontSize: '13px', fontFamily: 'var(--font-inter)', color: farger.tekst, marginBottom: '10px', lineHeight: 1.5 }}>
                  {samtykke?.vilkaar_godtatt_tid
                    ? t('settings.consent.vilkaarGodtatt', {
                        dato: formatSamtykkeDato(samtykke.vilkaar_godtatt_tid),
                        versjon: samtykke.vilkaar_versjon || '—',
                      })
                    : `${t('consent.terms.link')}: ${t('settings.consent.ikkeDokumentert')}`}
                </div>
                <div style={{ fontSize: '13px', fontFamily: 'var(--font-inter)', color: farger.tekst, marginBottom: '14px', lineHeight: 1.5 }}>
                  {samtykke?.personvern_godtatt_tid
                    ? t('settings.consent.personvernGodtatt', {
                        dato: formatSamtykkeDato(samtykke.personvern_godtatt_tid),
                        versjon: samtykke.personvern_versjon || '—',
                      })
                    : `${t('consent.privacy.link')}: ${t('settings.consent.ikkeDokumentert')}`}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', marginBottom: '16px', borderTop: `1px solid ${farger.kremMørk}`, paddingTop: '14px' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '14px', fontFamily: 'var(--font-plus-jakarta)', color: farger.tekst, fontWeight: '600', marginBottom: '4px' }}>
                      {t('settings.consent.markedsforing')}
                    </div>
                    <div style={{ fontSize: '12px', fontFamily: 'var(--font-inter)', color: farger.tekstLys, lineHeight: 1.45 }}>
                      {t('settings.consent.withdraw')}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={toggleMarkedsforing}
                    disabled={oppdatererMarkedsforing}
                    aria-pressed={markedsforingPå}
                    style={{
                      width: '52px',
                      height: '30px',
                      borderRadius: '15px',
                      border: 'none',
                      backgroundColor: markedsforingPå ? farger.grønn : farger.kremMørk,
                      cursor: oppdatererMarkedsforing ? 'default' : 'pointer',
                      position: 'relative',
                      flexShrink: 0,
                      opacity: oppdatererMarkedsforing ? 0.7 : 1,
                    }}
                  >
                    <span style={{
                      position: 'absolute',
                      top: '3px',
                      left: markedsforingPå ? '25px' : '3px',
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      backgroundColor: farger.hvit,
                      boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
                    }} />
                  </button>
                </div>

                <a
                  href={VILKAR_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => { e.preventDefault(); window.open(VILKAR_URL, '_blank'); }}
                  style={{ display: 'block', fontSize: '13px', color: farger.grønn, fontFamily: 'var(--font-inter)', fontWeight: 600, marginBottom: '8px' }}
                >
                  {t('settings.consent.vilkaarLenke')}
                </a>
                <a
                  href={PERSONVERN_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => { e.preventDefault(); window.open(PERSONVERN_URL, '_blank'); }}
                  style={{ display: 'block', fontSize: '13px', color: farger.grønn, fontFamily: 'var(--font-inter)', fontWeight: 600, marginBottom: '16px' }}
                >
                  {t('profil.personvern')}
                </a>

                {!visSlettBekreftelse ? (
                  <button
                    type="button"
                    onClick={() => { setVisSlettBekreftelse(true); setSlettFeil(''); }}
                    style={{
                      width: '100%',
                      padding: '12px',
                      backgroundColor: 'transparent',
                      border: '1px solid #C0392B',
                      borderRadius: '10px',
                      fontSize: '13px',
                      fontWeight: 600,
                      color: '#C0392B',
                      cursor: 'pointer',
                      fontFamily: 'var(--font-inter)',
                    }}
                  >
                    {t('settings.consent.slettKonto')}
                  </button>
                ) : (
                  <div style={{ padding: '12px', backgroundColor: '#FDF2F2', borderRadius: '12px', border: '1px solid #F5C6C6' }}>
                    <p style={{ fontSize: '13px', fontFamily: 'var(--font-inter)', color: farger.tekst, margin: '0 0 12px', lineHeight: 1.5 }}>
                      {t('settings.consent.slettKontoInfo')}
                    </p>
                    {slettFeil && (
                      <p style={{ fontSize: '12px', color: '#C0392B', fontFamily: 'var(--font-inter)', margin: '0 0 10px' }}>{slettFeil}</p>
                    )}
                    <button
                      type="button"
                      onClick={slettKonto}
                      disabled={sletterKonto}
                      style={{
                        width: '100%',
                        padding: '12px',
                        backgroundColor: '#C0392B',
                        border: 'none',
                        borderRadius: '10px',
                        fontSize: '13px',
                        fontWeight: 600,
                        color: '#fff',
                        cursor: sletterKonto ? 'default' : 'pointer',
                        fontFamily: 'var(--font-inter)',
                        marginBottom: '8px',
                        opacity: sletterKonto ? 0.7 : 1,
                      }}
                    >
                      {sletterKonto ? t('felles.laster') : t('settings.consent.slettKontoBekreft')}
                    </button>
                    <button
                      type="button"
                      onClick={() => setVisSlettBekreftelse(false)}
                      disabled={sletterKonto}
                      style={{
                        width: '100%',
                        padding: '10px',
                        background: 'none',
                        border: 'none',
                        fontSize: '13px',
                        color: farger.tekstLys,
                        cursor: 'pointer',
                        fontFamily: 'var(--font-inter)',
                      }}
                    >
                      {t('felles.avbryt')}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
