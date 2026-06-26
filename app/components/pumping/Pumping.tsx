'use client';
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { farger } from '../../lib/farger';
import { useLanguage } from '../../lib/i18n/LanguageContext';
import { Locale, OversettelseNøkkel } from '../../lib/i18n/translations';

type Props = { bruker: any; };

type PumpingRegistrering = {
  id: number;
  dato: string;
  klokkeslett: string;
  varighet: number;
  mengde: number;
  type: string;
  notat?: string;
};

type TFn = (nøkkel: OversettelseNøkkel, variabler?: Record<string, string | number>) => string;

const LOCALE_SPRÅKNAVN: Record<Locale, string> = {
  no: 'norsk',
  en: 'English',
  sv: 'svenska',
  da: 'dansk',
  de: 'Deutsch',
};

const getPumpingTyper = (t: TFn) => [
  { id: 'dobbel', label: t('pumping.typeDobbel') },
  { id: 'enkel-venstre', label: t('pumping.typeEnkelVenstre') },
  { id: 'enkel-høyre', label: t('pumping.typeEnkelHøyre') },
];

const getTidspunkt = (klokkeslett: string, t: TFn) => {
  const time = parseInt(klokkeslett.slice(0, 2));
  if (time >= 5 && time < 9) return { label: t('pumping.morgen'), ikon: '🌅' };
  if (time >= 9 && time < 12) return { label: t('pumping.formiddag'), ikon: '☀️' };
  if (time >= 12 && time < 17) return { label: t('pumping.ettermiddag'), ikon: '🌤️' };
  if (time >= 17 && time < 22) return { label: t('pumping.kveld'), ikon: '🌙' };
  return { label: t('pumping.natt'), ikon: '⭐' };
};

export default function Pumping({ bruker }: Props) {
  const { t, locale } = useLanguage();
  const pumpingTyper = getPumpingTyper(t);  const [pumpinger, setPumpinger] = useState<PumpingRegistrering[]>([]);
  const [laster, setLaster] = useState(true);
  const [visSkjema, setVisSkjema] = useState(false);
  const [aiInnsikter, setAiInnsikter] = useState<string[]>([]);
  const [lasterAi, setLasterAi] = useState(false);

  // Skjema-state
  const [varighet, setVarighet] = useState('');
  const [mengde, setMengde] = useState('');
  const [pumpingType, setPumpingType] = useState('dobbel');
  const [dato, setDato] = useState(new Date().toISOString().split('T')[0]);
  const [klokkeslett, setKlokkeslett] = useState(new Date().toTimeString().slice(0, 5));
  const [notat, setNotat] = useState('');
  const [lagrer, setLagrer] = useState(false);
  const [fryserMl, setFryserMl] = useState<number>(0);
  const [kjøleskapMl, setKjøleskapMl] = useState<number>(0);
  const [visLagerModal, setVisLagerModal] = useState(false);
  const [nyFryser, setNyFryser] = useState('');
  const [nyKjøleskap, setNyKjøleskap] = useState('');

  const lastData = useCallback(async () => {
    setLaster(true);
    const { data } = await supabase.from('pumping').select('*').eq('profil_id', bruker?.id).order('dato', { ascending: false }).order('klokkeslett', { ascending: false });
    setPumpinger(data || []);
    const { data: lager } = await supabase.from('melkelager').select('*').eq('profil_id', bruker?.id).single();
    if (lager) { setFryserMl(lager.fryser || 0); setKjøleskapMl(lager.kjøleskap || 0); }
    setLaster(false);
  }, [bruker?.id]);

  useEffect(() => { lastData(); }, [lastData]);

  const hentAiInnsikter = useCallback(async () => {
    setLasterAi(true);
    const språkNavn = LOCALE_SPRÅKNAVN[locale];
    const prompt = `Du er en varm og støttende laktasjonskonsulent i appen Lille. Analyser disse pumpingregistreringene og gi 3-4 personlige innsikter på ${språkNavn}.

Pumpingdata: ${JSON.stringify(pumpinger.slice(0, 20))}

Skriv 3-4 korte, varme og oppmuntrende innsikter. Start hver med ✦. Fokuser på mønstre, beste tidspunkt, mengdeutvikling og tips. Svar KUN med innsiktene, én per linje.`;
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 800, messages: [{ role: 'user', content: prompt }] }),
      });
      const result = await response.json();
      const tekst = result.content?.[0]?.text || '';
      setAiInnsikter(tekst.split('\n').filter((l: string) => l.trim().startsWith('✦')));
    } catch { }
    setLasterAi(false);
  }, [locale, pumpinger]);

  useEffect(() => {
    if (pumpinger.length >= 3) hentAiInnsikter();
  }, [pumpinger, hentAiInnsikter]);

  const lagrePumping = async () => {
    if (!varighet || !mengde) return;
    setLagrer(true);
    await supabase.from('pumping').insert({
      profil_id: bruker?.id,
      dato, klokkeslett,
      varighet: parseInt(varighet),
      mengde: parseInt(mengde),
      type: pumpingType,
      notat: notat.trim() || null,
    });
    setVarighet(''); setMengde(''); setNotat('');
    setVisSkjema(false);
    await lastData();
    setLagrer(false);
  };

  // Beregninger
  const dagensdato = new Date().toISOString().split('T')[0];
  const dagensPumpinger = pumpinger.filter(p => p.dato === dagensdato);
  const dagensMengde = dagensPumpinger.reduce((sum, p) => sum + p.mengde, 0);
  const dagensVarighet = dagensPumpinger.reduce((sum, p) => sum + p.varighet, 0);
  const dagensØkter = dagensPumpinger.length;

  const uketotal = pumpinger
    .filter(p => {
      const d = new Date(p.dato);
      const nå = new Date();
      const diff = (nå.getTime() - d.getTime()) / (1000 * 60 * 60 * 24);
      return diff <= 7;
    })
    .reduce((sum, p) => sum + p.mengde, 0);

  const snittPerDag = pumpinger.length > 0
    ? Math.round(pumpinger.reduce((sum, p) => sum + p.mengde, 0) / Math.max([...new Set(pumpinger.map(p => p.dato))].length, 1))
    : 0;

  const formatDato = (dato: string) => {
    const d = new Date(dato);
    return `${d.getDate()}. ${d.toLocaleDateString(locale === 'no' ? 'no-NO' : locale === 'sv' ? 'sv-SE' : locale === 'da' ? 'da-DK' : locale === 'de' ? 'de-DE' : 'en-GB', { month: 'short' })}`;
  };

  const getDatoLabel = (dato: string) => {
    const erIDag = dato === dagensdato;
    const erIGår = dato === new Date(Date.now() - 86400000).toISOString().split('T')[0];
    return erIDag ? t('pumping.iDagLabel') : erIGår ? t('pumping.iGår') : formatDato(dato);
  };

  const ukeØkter = pumpinger.filter(p => { const d = new Date(p.dato); const diff = (new Date().getTime() - d.getTime()) / (1000 * 60 * 60 * 24); return diff <= 7; }).length;
  const økterLabel = (antall: number) => `${antall} ${t('pumping.økter').toLowerCase()}`;

  if (laster) return (
    <div style={{ backgroundColor: farger.bakgrunn, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <div style={{ width: '28px', height: '28px', border: `2px solid ${farger.terrakotta}`, borderTop: '2px solid transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
    </div>
  );

  return (
    <div style={{ backgroundColor: farger.bakgrunn, minHeight: '100vh', padding: '24px 24px 120px' }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } } @keyframes fadeOpp { 0%{opacity:0;transform:translateY(8px)} 100%{opacity:1;transform:translateY(0)} }`}</style>

      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <div style={{ fontSize: '26px', fontFamily: 'var(--font-plus-jakarta)', color: farger.tekst, fontWeight: '700', marginBottom: '4px' }}>
          {t('pumping.tittel')}
        </div>
        <div style={{ fontSize: '13px', fontFamily: 'var(--font-inter)', color: farger.tekstLys }}>
          {t('pumping.undertittel')}
        </div>
      </div>

      {pumpinger.length === 0 ? (
        // ─── ONBOARDING ───
        <>
          {/* Hero */}
          <div style={{ backgroundColor: farger.hvit, border: `1px solid ${farger.kremMørk}`, borderRadius: '24px', padding: '24px', marginBottom: '16px' }}>
            <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div style={{ fontSize: '64px', flexShrink: 0 }}>🍼</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '18px', fontFamily: 'var(--font-plus-jakarta)', color: farger.tekst, fontWeight: '700', marginBottom: '10px' }}>
                  {t('pumping.velkommenTittel')}
                </div>
                <div style={{ fontSize: '13px', fontFamily: 'var(--font-inter)', color: farger.tekstLys, lineHeight: 1.7, marginBottom: '12px' }}>
                  {t('pumping.velkommenBeskrivelse')}
                </div>
                {[
                  t('pumping.steg1'),
                  t('pumping.steg2'),
                  t('pumping.steg3'),
                  t('pumping.steg4'),
                ].map((tekst, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <div style={{ width: '18px', height: '18px', borderRadius: '50%', backgroundColor: farger.terrakottaLys, border: `1px solid ${farger.terrakotta}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                        <path d="M2 5L4 7L8 3" stroke={farger.terrakotta} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                    <div style={{ fontSize: '13px', fontFamily: 'var(--font-inter)', color: farger.tekst }}>{tekst}</div>
                  </div>
                ))}
              </div>
            </div>
            <button
              onClick={() => setVisSkjema(true)}
              style={{ width: '100%', padding: '14px', background: `linear-gradient(135deg, ${farger.terrakotta}, #8B4520)`, border: 'none', borderRadius: '50px', fontSize: '15px', fontWeight: '700', color: '#fff', cursor: 'pointer', fontFamily: 'var(--font-inter)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: `0 4px 16px rgba(176,90,47,0.4)` }}
            >
              <span style={{ fontSize: '18px' }}>+</span> {t('pumping.registrerFørstePumping')}
            </button>
          </div>

          {/* Dette vil du få innsikt i */}
          <div style={{ backgroundColor: farger.hvit, border: `1px solid ${farger.kremMørk}`, borderRadius: '20px', padding: '20px', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '16px' }}>
              <span style={{ fontSize: '14px' }}>✨</span>
              <div style={{ fontSize: '15px', fontFamily: 'var(--font-plus-jakarta)', color: farger.tekst, fontWeight: '700' }}>{t('pumping.detteVilDuFåInnsiktI')}</div>
              <span style={{ fontSize: '14px' }}>✨</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              {[
                { ikon: '💧', bg: farger.terrakottaLys, tittel: t('pumping.mengdeTittel'), tekst: t('pumping.mengdeTekst') },
                { ikon: '🕐', bg: '#FFF8EC', tittel: t('pumping.frekvens'), tekst: t('pumping.frekvensTekst') },
                { ikon: '🧊', bg: '#EEF2FF', tittel: t('pumping.melkelager'), tekst: t('pumping.melkelagerTekst') },
                { ikon: '✨', bg: '#F5F0FF', tittel: t('pumping.aiInnsikt'), tekst: t('pumping.aiInnsiktTekst') },
              ].map((item, i) => (
                <div key={i} style={{ backgroundColor: item.bg, borderRadius: '16px', padding: '14px' }}>
                  <div style={{ fontSize: '24px', marginBottom: '8px' }}>{item.ikon}</div>
                  <div style={{ fontSize: '12px', fontFamily: 'var(--font-plus-jakarta)', color: farger.tekst, fontWeight: '700', marginBottom: '4px' }}>{item.tittel}</div>
                  <div style={{ fontSize: '11px', fontFamily: 'var(--font-inter)', color: farger.tekstLys, lineHeight: 1.5 }}>{item.tekst}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Slik kommer du i gang */}
          <div style={{ backgroundColor: farger.hvit, border: `1px solid ${farger.kremMørk}`, borderRadius: '20px', padding: '20px', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
              <span style={{ fontSize: '18px' }}>✦</span>
              <div style={{ fontSize: '15px', fontFamily: 'var(--font-plus-jakarta)', color: farger.tekst, fontWeight: '700' }}>{t('pumping.slikKommerDuIGang')}</div>
            </div>
            <div style={{ fontSize: '13px', fontFamily: 'var(--font-inter)', color: farger.tekstLys, marginBottom: '14px', lineHeight: 1.6 }}>
              {t('pumping.joMerDuRegistrerer')}
            </div>
            {[
              t('pumping.gangSteg1'),
              t('pumping.gangSteg2'),
              t('pumping.gangSteg3'),
              t('pumping.gangSteg4'),
            ].map((tekst, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                <div style={{ width: '20px', height: '20px', borderRadius: '50%', backgroundColor: farger.terrakottaLys, border: `1px solid ${farger.terrakotta}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <path d="M2 5L4 7L8 3" stroke={farger.terrakotta} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div style={{ fontSize: '13px', fontFamily: 'var(--font-inter)', color: farger.tekst }}>{tekst}</div>
              </div>
            ))}
          </div>

          {/* Ingen registrerte pumpinger */}
          <div style={{ backgroundColor: farger.hvit, border: `1px solid ${farger.kremMørk}`, borderRadius: '20px', padding: '24px', marginBottom: '16px', textAlign: 'center' }}>
            <div style={{ fontSize: '36px', marginBottom: '12px' }}>📋</div>
            <div style={{ fontSize: '14px', fontFamily: 'var(--font-plus-jakarta)', color: farger.tekst, fontWeight: '600', marginBottom: '6px' }}>{t('pumping.ingenRegistrert')}</div>
            <div style={{ fontSize: '13px', fontFamily: 'var(--font-inter)', color: farger.tekstLys, marginBottom: '16px', lineHeight: 1.6 }}>
              {t('pumping.historikkHer')}
            </div>
            <button
              onClick={() => setVisSkjema(true)}
              style={{ padding: '12px 24px', background: `linear-gradient(135deg, ${farger.terrakotta}, #8B4520)`, border: 'none', borderRadius: '50px', fontSize: '13px', fontWeight: '600', color: '#fff', cursor: 'pointer', fontFamily: 'var(--font-inter)', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <span>+</span> {t('pumping.registrerFørstePumping')}
            </button>
          </div>

          {/* Snart kan du se */}
          <div style={{ backgroundColor: farger.hvit, border: `1px solid ${farger.kremMørk}`, borderRadius: '20px', padding: '20px', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '16px' }}>
              <span style={{ fontSize: '14px' }}>✨</span>
              <div style={{ fontSize: '15px', fontFamily: 'var(--font-plus-jakarta)', color: farger.tekst, fontWeight: '700' }}>{t('pumping.snartKanDuSe')}</div>
              <span style={{ fontSize: '14px' }}>✨</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              {[
                { ikon: '📈', tittel: t('pumping.produksjonsgraf'), tekst: t('pumping.produksjonsgrafTekst') },
                { ikon: '⏰', tittel: t('pumping.besteTidspunkt'), tekst: t('pumping.besteTidspunktTekst') },
                { ikon: '📊', tittel: t('pumping.økterOgVarighet'), tekst: t('pumping.økterOgVarighetTekst') },
                { ikon: '🧊', tittel: t('pumping.melkelagerOversikt'), tekst: t('pumping.melkelagerOversiktTekst') },
              ].map((item, i) => (
                <div key={i} style={{ backgroundColor: farger.bakgrunn, borderRadius: '16px', padding: '14px', position: 'relative' }}>
                  <div style={{ position: 'absolute', top: '10px', right: '10px', fontSize: '14px' }}>🔒</div>
                  <div style={{ fontSize: '24px', marginBottom: '8px', opacity: 0.5 }}>{item.ikon}</div>
                  <div style={{ fontSize: '12px', fontFamily: 'var(--font-plus-jakarta)', color: farger.tekst, fontWeight: '700', marginBottom: '4px' }}>{item.tittel}</div>
                  <div style={{ fontSize: '11px', fontFamily: 'var(--font-inter)', color: farger.tekstLys, lineHeight: 1.5 }}>{item.tekst}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Du gjør en fantastisk jobb */}
          <div style={{ background: `linear-gradient(135deg, ${farger.terrakottaLys}, #FFF8EC)`, border: `1px solid ${farger.kremMørk}`, borderRadius: '20px', padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
              <div style={{ fontSize: '22px', flexShrink: 0 }}>💡</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '14px', fontFamily: 'var(--font-plus-jakarta)', color: farger.terrakotta, fontWeight: '700', marginBottom: '6px' }}>{t('pumping.duGjørEnFantastiskJobb')}</div>
                <div style={{ fontSize: '13px', fontFamily: 'var(--font-inter)', color: farger.tekst, lineHeight: 1.6 }}>
                  {t('pumping.duGjørEnFantastiskJobbTekst')}
                </div>
              </div>
              <div style={{ fontSize: '40px', flexShrink: 0 }}>🐻</div>
            </div>
          </div>
        </>
      ) : (
        // ─── MED DATA ───
        <>
          {/* Dagens oversikt */}
          <div style={{ backgroundColor: farger.hvit, border: `1px solid ${farger.kremMørk}`, borderRadius: '20px', padding: '20px', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '11px', fontFamily: 'var(--font-inter)', color: farger.terrakotta, fontWeight: '700', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '6px' }}>{t('pumping.dagensOversikt')}</div>
                <div style={{ fontSize: '18px', fontFamily: 'var(--font-plus-jakarta)', color: farger.tekst, fontWeight: '700', marginBottom: '4px' }}>
                  {t('pumping.harPumpet', { antall: dagensØkter, gang: dagensØkter === 1 ? t('pumping.gang') : t('pumping.ganger') })}
                </div>
                <div style={{ fontSize: '14px', fontFamily: 'var(--font-inter)', color: farger.tekstLys, marginBottom: '16px' }}>
                  {t('pumping.totalt', { mengde: dagensMengde })}
                </div>
                <div style={{ display: 'flex', gap: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '16px' }}>💧</span>
                    <div>
                      <div style={{ fontSize: '16px', fontFamily: 'var(--font-plus-jakarta)', color: farger.tekst, fontWeight: '700' }}>{dagensMengde} ml</div>
                      <div style={{ fontSize: '10px', fontFamily: 'var(--font-inter)', color: farger.tekstLys }}>{t('pumping.totalMengde')}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '16px' }}>🕐</span>
                    <div>
                      <div style={{ fontSize: '16px', fontFamily: 'var(--font-plus-jakarta)', color: farger.tekst, fontWeight: '700' }}>{dagensVarighet} min</div>
                      <div style={{ fontSize: '10px', fontFamily: 'var(--font-inter)', color: farger.tekstLys }}>{t('pumping.totalTid')}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '16px' }}>✦</span>
                    <div>
                      <div style={{ fontSize: '16px', fontFamily: 'var(--font-plus-jakarta)', color: farger.tekst, fontWeight: '700' }}>{dagensØkter}</div>
                      <div style={{ fontSize: '10px', fontFamily: 'var(--font-inter)', color: farger.tekstLys }}>{t('pumping.økter')}</div>
                    </div>
                  </div>
                </div>
              </div>
              <div style={{ fontSize: '56px', flexShrink: 0 }}>🍼</div>
            </div>
          </div>

          {/* 4 statistikkbokser */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '8px', marginBottom: '16px' }}>
            {[
              { label: t('pumping.iDag'), verdi: `${dagensMengde} ml`, undertekst: økterLabel(dagensØkter) },
              { label: t('pumping.denneUken'), verdi: `${(uketotal / 1000).toFixed(1)} l`, undertekst: økterLabel(ukeØkter) },
              { label: t('pumping.gjennomsnitt'), verdi: `${snittPerDag} ml`, undertekst: t('pumping.perDag') },
            ].map((boks, i) => (
              <div key={i} style={{ backgroundColor: farger.hvit, border: `1px solid ${farger.kremMørk}`, borderRadius: '14px', padding: '12px' }}>
                <div style={{ fontSize: '9px', fontFamily: 'var(--font-inter)', color: farger.terrakotta, fontWeight: '700', marginBottom: '4px', letterSpacing: '0.05em' }}>{boks.label}</div>
                <div style={{ fontSize: '14px', fontFamily: 'var(--font-plus-jakarta)', color: farger.tekst, fontWeight: '700', marginBottom: '2px' }}>{boks.verdi}</div>
                <div style={{ fontSize: '10px', fontFamily: 'var(--font-inter)', color: farger.tekstLys }}>{boks.undertekst}</div>
              </div>
            ))}
            <button onClick={() => setVisLagerModal(true)} style={{ backgroundColor: farger.hvit, border: `1px solid ${farger.kremMørk}`, borderRadius: '14px', padding: '12px', cursor: 'pointer', textAlign: 'left', width: '100%' }}>
              <div style={{ fontSize: '9px', fontFamily: 'var(--font-inter)', color: farger.terrakotta, fontWeight: '700', marginBottom: '6px', letterSpacing: '0.05em' }}>{t('pumping.melkelagerLabel')}</div>
              <div style={{ fontSize: '12px', fontFamily: 'var(--font-inter)', color: farger.tekst, marginBottom: '2px' }}>🥶 {fryserMl} ml</div>
              <div style={{ fontSize: '12px', fontFamily: 'var(--font-inter)', color: farger.tekst }}>🍼 {kjøleskapMl} ml</div>
            </button>
          </div>

          {/* AI Innsikt */}
          {(lasterAi || aiInnsikter.length > 0) && (
            <div style={{ backgroundColor: farger.hvit, border: `1px solid ${farger.kremMørk}`, borderRadius: '20px', padding: '20px', marginBottom: '16px', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', right: '16px', bottom: '16px', fontSize: '48px', opacity: 0.15 }}>🐻</div>
              <div style={{ fontSize: '11px', fontFamily: 'var(--font-inter)', color: farger.terrakotta, fontWeight: '700', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '10px' }}>{t('pumping.aiInnsiktHeader')}</div>
              {lasterAi ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '20px', height: '20px', border: `2px solid ${farger.terrakotta}`, borderTop: '2px solid transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                  <div style={{ fontSize: '13px', fontFamily: 'var(--font-inter)', color: farger.tekstLys }}>{t('pumping.analysererPumpemønstre')}</div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {aiInnsikter.map((innsikt, i) => (
                    <div key={i} style={{ fontSize: '13px', fontFamily: 'var(--font-inter)', color: farger.tekst, lineHeight: 1.6 }}>{innsikt}</div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Siste pumpingøkter – tidslinje */}
          <div style={{ backgroundColor: farger.hvit, border: `1px solid ${farger.kremMørk}`, borderRadius: '20px', padding: '20px', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{ fontSize: '11px', fontFamily: 'var(--font-inter)', color: farger.terrakotta, fontWeight: '700', letterSpacing: '0.08em', textTransform: 'uppercase' }}>{t('pumping.sistePumpingøkter')}</div>
              <div style={{ fontSize: '13px', fontFamily: 'var(--font-inter)', color: farger.terrakotta, fontWeight: '600' }}>{t('pumping.seAlle')}</div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.6)', border: '1px solid rgba(220,207,192,0.35)', borderRadius: '16px', overflow: 'hidden', padding: '8px 0' }}>
              {pumpinger.slice(0, 5).map((p, i) => {
                const tp = getTidspunkt(p.klokkeslett, t);
                const datoLabel = getDatoLabel(p.dato);
                return (
                  <div key={i} style={{ position: 'relative' }}>
                    {i < Math.min(pumpinger.length, 5) - 1 && (
                      <div style={{ position: 'absolute', left: '36px', top: '54px', width: '1px', height: 'calc(100% - 10px)', backgroundColor: 'rgba(220,207,192,0.5)' }} />
                    )}
                    <div style={{ padding: '12px 18px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: farger.terrakottaLys, border: `1px solid ${farger.kremMørk}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', flexShrink: 0, zIndex: 1 }}>
                        {tp.ikon}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                          <div style={{ fontSize: '14px', fontFamily: 'var(--font-inter)', color: farger.tekst, fontWeight: i === 0 ? 600 : 400 }}>
                            {datoLabel}, {p.klokkeslett.slice(0, 5)}
                          </div>
                          <div style={{ padding: '2px 8px', backgroundColor: farger.terrakottaLys, borderRadius: '20px', fontSize: '10px', fontFamily: 'var(--font-inter)', color: farger.terrakotta, fontWeight: '600' }}>
                            {tp.label}
                          </div>
                        </div>
                        <div style={{ fontSize: '11px', fontFamily: 'var(--font-inter)', color: farger.tekstLys }}>
                          {p.varighet} min · {pumpingTyper.find(pt => pt.id === p.type)?.label || p.type}
                        </div>
                      </div>
                      <div style={{ fontSize: '14px', fontFamily: 'var(--font-plus-jakarta)', color: farger.terrakotta, fontWeight: '700', flexShrink: 0 }}>
                        {p.mengde} ml
                      </div>
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path d="M6 4L10 8L6 12" stroke={farger.tekstLys} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Registrer-knapp */}
          <button
            onClick={() => setVisSkjema(true)}
            style={{ position: 'fixed', bottom: '100px', left: '50%', transform: 'translateX(-50%)', padding: '16px 32px', background: `linear-gradient(135deg, ${farger.terrakotta}, #8B4520)`, border: 'none', borderRadius: '50px', fontSize: '15px', fontWeight: '700', color: '#fff', cursor: 'pointer', fontFamily: 'var(--font-inter)', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: `0 4px 20px rgba(176,90,47,0.5)`, zIndex: 50 }}
          >
            <span style={{ fontSize: '18px' }}>+</span> {t('pumping.registrerPumpingøkt')}
          </button>
        </>
      )}

      {/* ─── REGISTRERINGSSKJEMA ─── */}
      {visSkjema && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 200, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }} onClick={() => setVisSkjema(false)}>
          <div onClick={e => e.stopPropagation()} style={{ backgroundColor: farger.hvit, width: '100%', maxWidth: '430px', borderRadius: '24px 24px 0 0', padding: '24px', paddingBottom: '48px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ width: '36px', height: '4px', backgroundColor: farger.kremMørk, borderRadius: '2px', margin: '0 auto 20px' }} />
            <div style={{ fontSize: '20px', fontFamily: 'var(--font-plus-jakarta)', color: farger.tekst, fontWeight: '700', marginBottom: '20px' }}>{t('pumping.nyPumpingøkt')}</div>

            {/* Type */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '13px', fontFamily: 'var(--font-inter)', color: farger.tekst, fontWeight: '600', marginBottom: '8px' }}>{t('pumping.typePumping')}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {pumpingTyper.map(pt => (
                  <button key={pt.id} onClick={() => setPumpingType(pt.id)} style={{ padding: '12px 16px', backgroundColor: pumpingType === pt.id ? farger.terrakottaLys : farger.bakgrunn, border: `1.5px solid ${pumpingType === pt.id ? farger.terrakotta : farger.kremMørk}`, borderRadius: '12px', cursor: 'pointer', textAlign: 'left', fontSize: '13px', fontFamily: 'var(--font-inter)', color: pumpingType === pt.id ? farger.terrakotta : farger.tekst, fontWeight: pumpingType === pt.id ? '600' : '400' }}>
                    {pt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Mengde */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '13px', fontFamily: 'var(--font-inter)', color: farger.tekst, fontWeight: '600', marginBottom: '8px' }}>{t('pumping.mengdeML')}</div>
              <input
                type="number"
                value={mengde}
                onChange={e => setMengde(e.target.value)}
                placeholder={t('pumping.mengdePlaceholder')}
                style={{ width: '100%', padding: '12px 14px', fontSize: '14px', border: `1px solid ${farger.kremMørk}`, borderRadius: '12px', backgroundColor: farger.bakgrunn, color: farger.tekst, outline: 'none', fontFamily: 'var(--font-inter)', boxSizing: 'border-box' }}
              />
            </div>

            {/* Varighet */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '13px', fontFamily: 'var(--font-inter)', color: farger.tekst, fontWeight: '600', marginBottom: '8px' }}>{t('pumping.varighetMinutter')}</div>
              <input
                type="number"
                value={varighet}
                onChange={e => setVarighet(e.target.value)}
                placeholder={t('pumping.varighetPlaceholder')}
                style={{ width: '100%', padding: '12px 14px', fontSize: '14px', border: `1px solid ${farger.kremMørk}`, borderRadius: '12px', backgroundColor: farger.bakgrunn, color: farger.tekst, outline: 'none', fontFamily: 'var(--font-inter)', boxSizing: 'border-box' }}
              />
            </div>

            {/* Dato og tid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>
              <div>
                <div style={{ fontSize: '13px', fontFamily: 'var(--font-inter)', color: farger.tekst, fontWeight: '600', marginBottom: '8px' }}>{t('pumping.dato')}</div>
                <input type="date" value={dato} onChange={e => setDato(e.target.value)} style={{ width: '100%', padding: '10px 12px', fontSize: '13px', border: `1px solid ${farger.kremMørk}`, borderRadius: '12px', backgroundColor: farger.bakgrunn, color: farger.tekst, outline: 'none', fontFamily: 'var(--font-inter)', boxSizing: 'border-box' }} />
              </div>
              <div>
                <div style={{ fontSize: '13px', fontFamily: 'var(--font-inter)', color: farger.tekst, fontWeight: '600', marginBottom: '8px' }}>{t('pumping.tidspunkt')}</div>
                <input type="time" value={klokkeslett} onChange={e => setKlokkeslett(e.target.value)} style={{ width: '100%', padding: '10px 12px', fontSize: '13px', border: `1px solid ${farger.kremMørk}`, borderRadius: '12px', backgroundColor: farger.bakgrunn, color: farger.tekst, outline: 'none', fontFamily: 'var(--font-inter)', boxSizing: 'border-box' }} />
              </div>
            </div>

            {/* Notat */}
            <div style={{ marginBottom: '24px' }}>
              <div style={{ fontSize: '13px', fontFamily: 'var(--font-inter)', color: farger.tekst, fontWeight: '600', marginBottom: '8px' }}>{t('pumping.notatValgfritt')}</div>
              <textarea value={notat} onChange={e => setNotat(e.target.value)} placeholder={t('pumping.notatPlaceholder')} rows={2} style={{ width: '100%', padding: '12px 14px', fontSize: '13px', border: `1px solid ${farger.kremMørk}`, borderRadius: '12px', backgroundColor: farger.bakgrunn, color: farger.tekst, outline: 'none', fontFamily: 'var(--font-inter)', resize: 'none', boxSizing: 'border-box' }} />
            </div>

            <button
              onClick={lagrePumping}
              disabled={!varighet || !mengde || lagrer}
              style={{ width: '100%', padding: '16px', backgroundColor: (!varighet || !mengde) ? farger.kremMørk : farger.terrakotta, border: 'none', borderRadius: '14px', fontSize: '15px', fontWeight: '600', color: (!varighet || !mengde) ? farger.tekstLys : '#FDFAF6', cursor: (!varighet || !mengde) ? 'not-allowed' : 'pointer', fontFamily: 'var(--font-inter)' }}
            >
              {lagrer ? t('pumping.lagrer') : t('pumping.lagrePumpingøkt')}
            </button>
          </div>
        </div>
      )}

      {visLagerModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', zIndex: 200, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }} onClick={() => setVisLagerModal(false)}>
          <div onClick={e => e.stopPropagation()} style={{ backgroundColor: farger.hvit, width: '100%', maxWidth: '430px', borderRadius: '24px 24px 0 0', padding: '24px', paddingBottom: '48px' }}>
            <div style={{ width: '36px', height: '4px', backgroundColor: farger.kremMørk, borderRadius: '2px', margin: '0 auto 20px' }} />
            <div style={{ fontSize: '18px', fontFamily: 'var(--font-plus-jakarta)', color: farger.tekst, fontWeight: '700', marginBottom: '20px' }}>🥶 {t('pumping.melkelagerLabel')}</div>
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '13px', fontFamily: 'var(--font-inter)', color: farger.tekst, fontWeight: '600', marginBottom: '8px' }}>🥶 Fryser (ml)</div>
              <input type="number" value={nyFryser} onChange={e => setNyFryser(e.target.value)} placeholder={`${fryserMl}`} style={{ width: '100%', padding: '12px 14px', fontSize: '14px', border: `1px solid ${farger.kremMørk}`, borderRadius: '12px', backgroundColor: farger.bakgrunn, color: farger.tekst, outline: 'none', fontFamily: 'var(--font-inter)', boxSizing: 'border-box' }} />
            </div>
            <div style={{ marginBottom: '24px' }}>
              <div style={{ fontSize: '13px', fontFamily: 'var(--font-inter)', color: farger.tekst, fontWeight: '600', marginBottom: '8px' }}>🍼 Kjøleskap (ml)</div>
              <input type="number" value={nyKjøleskap} onChange={e => setNyKjøleskap(e.target.value)} placeholder={`${kjøleskapMl}`} style={{ width: '100%', padding: '12px 14px', fontSize: '14px', border: `1px solid ${farger.kremMørk}`, borderRadius: '12px', backgroundColor: farger.bakgrunn, color: farger.tekst, outline: 'none', fontFamily: 'var(--font-inter)', boxSizing: 'border-box' }} />
            </div>
            <button onClick={async () => {
              const f = nyFryser ? parseInt(nyFryser) : fryserMl;
              const k = nyKjøleskap ? parseInt(nyKjøleskap) : kjøleskapMl;
              await supabase.from('melkelager').upsert({ profil_id: bruker?.id, fryser: f, kjøleskap: k }, { onConflict: 'profil_id' });
              setFryserMl(f); setKjøleskapMl(k);
              setNyFryser(''); setNyKjøleskap('');
              setVisLagerModal(false);
            }} style={{ width: '100%', padding: '16px', backgroundColor: farger.terrakotta, border: 'none', borderRadius: '14px', fontSize: '15px', fontWeight: '600', color: '#FDFAF6', cursor: 'pointer', fontFamily: 'var(--font-inter)' }}>
              Lagre
            </button>
          </div>
        </div>
      )}
    </div>
  );
}