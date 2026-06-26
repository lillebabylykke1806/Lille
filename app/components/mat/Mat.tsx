'use client';
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { farger } from '../../lib/farger';
import { useLanguage } from '../../lib/i18n/LanguageContext';
import { Locale, OversettelseNøkkel } from '../../lib/i18n/translations';

type Props = { bruker: any; aktivtBarn?: any; };

type MatRegistrering = {
    id: number;
    dato: string;
    klokkeslett: string;
    matvare: string;
    kategori: string;
    reaksjon: string;
    mengde: string;
    notater?: string;
    allergi_status?: string | null;
  };

type TFn = (nøkkel: OversettelseNøkkel, variabler?: Record<string, string | number>) => string;

const LOCALE_SPRÅKNAVN: Record<Locale, string> = {
  no: 'norsk',
  en: 'English',
  sv: 'svenska',
  da: 'dansk',
  de: 'Deutsch',
};

const getKategorier = (t: TFn) => [
  { id: 'frukt', label: t('mat.kategoriFrukt'), ikon: '🍎', farge: '#FFF1F2', border: '#FECDD3', tekstFarge: '#BE123C' },
  { id: 'grønnsaker', label: t('mat.kategoriGrønnsaker'), ikon: '🥦', farge: '#F0F7F0', border: '#C8DEC8', tekstFarge: '#2D5C45' },
  { id: 'fisk', label: t('mat.kategoriFisk'), ikon: '🐟', farge: '#EEF2FF', border: '#C7D2FE', tekstFarge: '#4338CA' },
  { id: 'korn', label: t('mat.kategoriKorn'), ikon: '🌾', farge: '#FFF8EC', border: '#F4D9A0', tekstFarge: '#8B6340' },
  { id: 'bær', label: t('mat.kategoriBær'), ikon: '🫐', farge: '#FDF4FF', border: '#E9D5FF', tekstFarge: '#7C3AED' },
  { id: 'annet', label: t('mat.kategoriAnnet'), ikon: '🍽️', farge: '#F8FAFC', border: '#E2E8F0', tekstFarge: '#475569' },
];

const getReaksjoner = (t: TFn) => [
  { id: 'elsket', label: t('mat.reaksjonElsket'), ikon: '😍' },
  { id: 'likte', label: t('mat.reaksjonLikte'), ikon: '😊' },
  { id: 'nøytral', label: t('mat.reaksjonNøytral'), ikon: '😐' },
  { id: 'smakte', label: t('mat.reaksjonSmakte'), ikon: '😕' },
  { id: 'avslo', label: t('mat.reaksjonAvslo'), ikon: '😣' },
];

const getMengder = (t: TFn) => [
  { id: 'lite', label: t('mat.mengdeLite') },
  { id: 'middels', label: t('mat.mengdeMiddels') },
  { id: 'halvparten', label: t('mat.mengdeHalvparten') },
  { id: 'meste', label: t('mat.mengdeMeste') },
];

const getAllergiStatus = (t: TFn) => [
  { id: 'grønn', label: t('mat.allergiIngenReaksjon'), farge: '#2D5C45', bg: '#E8F0E8', ikon: '🟢' },
  { id: 'oransje', label: t('mat.allergiUsikker'), farge: '#C48E7B', bg: '#FFF3D6', ikon: '🟡' },
  { id: 'rød', label: t('mat.allergiTydelig'), farge: '#BE123C', bg: '#FFF1F2', ikon: '🔴' },
];

const getTips = (t: TFn) => [
  { ikon: '🪑', tittel: t('mat.tipRoligStemningTittel'), tekst: t('mat.tipRoligStemningTekst') },
  { ikon: '🥄', tittel: t('mat.tipSmåMengderTittel'), tekst: t('mat.tipSmåMengderTekst') },
  { ikon: '😊', tittel: t('mat.tipTålmodighet'), tekst: t('mat.tipTålmodighetTekst') },
];

export default function Mat({ bruker, aktivtBarn }: Props) {
  const { t, locale } = useLanguage();
  const KATEGORIER = getKategorier(t);
  const REAKSJONER = getReaksjoner(t);
  const MENGDER = getMengder(t);
  const ALLERGI_STATUS = getAllergiStatus(t);
  const TIPS = getTips(t);
  const [matreg, setMatreg] = useState<MatRegistrering[]>([]);
  const [babyNavn, setBabyNavn] = useState('babyen');
  const [laster, setLaster] = useState(true);
  const [visSkjema, setVisSkjema] = useState(false);
  const [aiInnsikter, setAiInnsikter] = useState<string[]>([]);
  const [lasterAi, setLasterAi] = useState(false);

  // Skjema-state
  const [matvare, setMatvare] = useState('');
  const [kategori, setKategori] = useState('');
  const [reaksjon, setReaksjon] = useState('');
  const [mengde, setMengde] = useState('');
  const [notater, setNotater] = useState('');
  const [dato, setDato] = useState(new Date().toISOString().split('T')[0]);
  const [klokkeslett, setKlokkeslett] = useState(new Date().toTimeString().slice(0, 5));
  const [lagrer, setLagrer] = useState(false);
  const [allergiStatus, setAllergiStatus] = useState('');
  const [erNyMatvare, setErNyMatvare] = useState<boolean | null>(null);

  const lastData = useCallback(async () => {
    setLaster(true);
    if (aktivtBarn?.navn) setBabyNavn(aktivtBarn.navn);

    const { data } = await supabase.from('mat').select('*').eq('profil_id', bruker?.id).order('dato', { ascending: false }).order('klokkeslett', { ascending: false });
    setMatreg(data || []);
    setLaster(false);
}, [bruker?.id, aktivtBarn?.navn]);

  useEffect(() => { lastData(); }, [lastData]);

  const hentAiInnsikter = useCallback(async () => {
    setLasterAi(true);
    const språkNavn = LOCALE_SPRÅKNAVN[locale];
    const prompt = `Du er en varm babyekspert i appen Lille. Analyser ${babyNavn}s matregistreringer og gi 3-4 korte, personlige innsikter på ${språkNavn}.

Matdata: ${JSON.stringify(matreg.slice(0, 20))}

Skriv 3-4 korte innsikter. Bruk babyens navn. Start hver med ✨. Fokuser på reaksjonsmønstre, favoritter og tips. Svar KUN med innsiktene, én per linje.`;
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 800, messages: [{ role: 'user', content: prompt }] }),
      });
      const result = await response.json();
      const tekst = result.content?.[0]?.text || '';
      setAiInnsikter(tekst.split('\n').filter((l: string) => l.trim().startsWith('✨')));
    } catch { setAiInnsikter([]); }
    setLasterAi(false);
  }, [babyNavn, locale, matreg]);

  useEffect(() => {
    if (matreg.length >= 3) hentAiInnsikter();
  }, [matreg, hentAiInnsikter]);

  const lagreMatregistrering = async () => {
if (!matvare.trim() || !kategori || !reaksjon || !mengde) return;
    setLagrer(true);
    await supabase.from('mat').insert({
        profil_id: bruker?.id,
        dato, klokkeslett, matvare: matvare.trim(), kategori, reaksjon, mengde, notater: notater.trim() || null, allergi_status: allergiStatus || null,
      });
      setMatvare(''); setKategori(''); setReaksjon(''); setMengde(''); setNotater(''); setAllergiStatus(''); setErNyMatvare(null);
    await lastData();
    setLagrer(false);
  };

  // Beregn smakskart
  const smakskart = KATEGORIER.map(kat => ({
    ...kat,
    antall: matreg.filter(m => m.kategori === kat.id).length,
    totalt: KATEGORIER.find(k => k.id === kat.id) ? matreg.filter(m => m.kategori === kat.id).length : 0,
  }));

  // Favoritter (mest positive reaksjoner)
  const favoritter = [...matreg]
    .filter(m => m.reaksjon === 'elsket' || m.reaksjon === 'likte')
    .reduce((acc: Record<string, number>, m) => {
      acc[m.matvare] = (acc[m.matvare] || 0) + 1;
      return acc;
    }, {});
  const topFavoritter = Object.entries(favoritter).sort((a, b) => b[1] - a[1]).slice(0, 3);

  // Ikke populære
  const ikkePop = [...matreg]
    .filter(m => m.reaksjon === 'avslo' || m.reaksjon === 'smakte')
    .reduce((acc: Record<string, number>, m) => {
      acc[m.matvare] = (acc[m.matvare] || 0) + 1;
      return acc;
    }, {});
  const topIkkePop = Object.entries(ikkePop).sort((a, b) => b[1] - a[1]).slice(0, 2);

  // Unike matvarer prøvd
  const unikeMatvarer = [...new Set(matreg.map(m => m.matvare))];

  const getReaksjonIkon = (r: string) => REAKSJONER.find(x => x.id === r)?.ikon || '😐';
  const getReaksjonLabel = (r: string) => REAKSJONER.find(x => x.id === r)?.label || '';
  const getKategoriIkon = (k: string) => KATEGORIER.find(x => x.id === k)?.ikon || '🍽️';
  const getMengdeLabel = (m: string) => MENGDER.find(x => x.id === m)?.label || '';

  const innsiktKort = [
    { ikon: '❤️', bg: '#FFF1F2', tittel: t('mat.favorittmat'), tekst: t('mat.favorittmatTekst') },
    { ikon: '😊', bg: '#F0F7F0', tittel: t('mat.reaksjoner'), tekst: t('mat.reaksjonerTekst') },
    { ikon: '🌈', bg: '#FFF8EC', tittel: t('mat.smaksreise'), tekst: t('mat.smaksreiseTekst') },
    { ikon: '✨', bg: '#F5F0FF', tittel: t('mat.personligeMønstre'), tekst: t('mat.personligeMønstreTekst') },
  ];

  const snartKommerItems = [
    { ikon: '💛', tekst: t('mat.babyMatspråk', { navn: babyNavn }) },
    { ikon: '❤️', tekst: t('mat.favorittsmaker') },
    { ikon: '😕', tekst: t('mat.matSomIkkeFaltISmak') },
    { ikon: '✨', tekst: t('mat.personligeAiInnsikter') },
  ];

  const formatDato = (dato: string) => {
    const d = new Date(dato);
    return `${d.getDate()}. ${d.toLocaleDateString(locale === 'no' ? 'no-NO' : locale === 'sv' ? 'sv-SE' : locale === 'da' ? 'da-DK' : locale === 'de' ? 'de-DE' : 'en-GB', { month: 'short' })}`;
  };

  if (laster) return (
    <div style={{ backgroundColor: farger.bakgrunn, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <div style={{ width: '28px', height: '28px', border: `2px solid ${farger.grønn}`, borderTop: '2px solid transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
    </div>
  );

  return (
    <div style={{ backgroundColor: farger.bakgrunn, minHeight: '100vh', padding: '24px 24px 120px' }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } } @keyframes fadeOpp { 0%{opacity:0;transform:translateY(8px)} 100%{opacity:1;transform:translateY(0)} }`}</style>

      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <div style={{ fontSize: '26px', fontFamily: 'var(--font-plus-jakarta)', color: farger.tekst, fontWeight: '700', marginBottom: '4px' }}>
          {t('mat.tittel')}
        </div>
        <div style={{ fontSize: '13px', fontFamily: 'var(--font-inter)', color: farger.tekstLys }}>
          {t('mat.undertittel')}
        </div>
      </div>

      {matreg.length === 0 ? (
        // ─── ONBOARDING ───
        <>
          {/* Hero */}
          <div style={{ backgroundColor: farger.hvit, border: `1px solid ${farger.kremMørk}`, borderRadius: '24px', padding: '24px', marginBottom: '16px', display: 'flex', gap: '16px', alignItems: 'center' }}>
            <div style={{ fontSize: '72px', flexShrink: 0 }}>🐻</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '18px', fontFamily: 'var(--font-plus-jakarta)', color: farger.tekst, fontWeight: '700', marginBottom: '8px' }}>
                {t('mat.velkommenTittel')}
              </div>
              <div style={{ fontSize: '13px', fontFamily: 'var(--font-inter)', color: farger.tekstLys, lineHeight: 1.7, marginBottom: '16px', whiteSpace: 'pre-line' }}>
                {t('mat.velkommenBeskrivelse', { navn: babyNavn })}
              </div>
              <button
                onClick={() => setVisSkjema(true)}
                style={{ padding: '13px 24px', background: 'linear-gradient(135deg, #F4A853, #E8943F)', border: 'none', borderRadius: '50px', fontSize: '14px', fontWeight: '700', color: '#fff', cursor: 'pointer', fontFamily: 'var(--font-inter)', display: 'inline-flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 16px rgba(244,168,83,0.4)' }}
              >
                <span style={{ fontSize: '18px' }}>+</span> {t('mat.registrerFørsteMåltid')}
              </button>
            </div>
          </div>

          {/* Dette vil du få innsikt i */}
          <div style={{ backgroundColor: farger.hvit, border: `1px solid ${farger.kremMørk}`, borderRadius: '20px', padding: '20px', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '16px' }}>
              <span style={{ fontSize: '14px' }}>✨</span>
              <div style={{ fontSize: '15px', fontFamily: 'var(--font-plus-jakarta)', color: farger.tekst, fontWeight: '700' }}>{t('mat.detteVilDuFåInnsiktI')}</div>
              <span style={{ fontSize: '14px' }}>✨</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              {innsiktKort.map((item, i) => (
                <div key={i} style={{ backgroundColor: item.bg, borderRadius: '16px', padding: '14px' }}>
                  <div style={{ fontSize: '24px', marginBottom: '8px' }}>{item.ikon}</div>
                  <div style={{ fontSize: '12px', fontFamily: 'var(--font-plus-jakarta)', color: farger.tekst, fontWeight: '700', marginBottom: '4px' }}>{item.tittel}</div>
                  <div style={{ fontSize: '11px', fontFamily: 'var(--font-inter)', color: farger.tekstLys, lineHeight: 1.5 }}>{item.tekst}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Smakskart */}
          <div style={{ backgroundColor: farger.hvit, border: `1px solid ${farger.kremMørk}`, borderRadius: '20px', padding: '20px', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
              <span style={{ fontSize: '20px' }}>🗺️</span>
              <div style={{ fontSize: '15px', fontFamily: 'var(--font-plus-jakarta)', color: farger.tekst, fontWeight: '700' }}>{t('mat.smakskart')}</div>
            </div>
            <div style={{ fontSize: '12px', fontFamily: 'var(--font-inter)', color: farger.tekstLys, marginBottom: '16px' }}>{t('mat.smakskartBeskrivelse')}</div>
            <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
              {KATEGORIER.map(kat => (
                <div key={kat.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', minWidth: '56px' }}>
                  <div style={{ width: '52px', height: '52px', borderRadius: '50%', backgroundColor: kat.farge, border: `1.5px solid ${kat.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px' }}>
                    {kat.ikon}
                  </div>
                  <div style={{ fontSize: '10px', fontFamily: 'var(--font-inter)', color: farger.tekst, textAlign: 'center', fontWeight: '500' }}>{kat.label}</div>
                  <div style={{ fontSize: '10px', fontFamily: 'var(--font-inter)', color: farger.tekstLys }}>{t('mat.nullPrøvd')}</div>
                </div>
              ))}
            </div>
          </div>

{/* Snart kommer dette */}
<div style={{ background: 'linear-gradient(135deg, #FFF8EC 0%, #FFF0D6 100%)', border: '1px solid #F4D9A0', borderRadius: '20px', padding: '20px', marginBottom: '16px' }}>
  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
    <span style={{ fontSize: '20px' }}>💡</span>
    <div style={{ fontSize: '15px', fontFamily: 'var(--font-plus-jakarta)', color: '#8B6340', fontWeight: '700' }}>{t('mat.snartKommer')}</div>
  </div>
  <div style={{ fontSize: '13px', fontFamily: 'var(--font-inter)', color: '#6B5040', marginBottom: '12px' }}>
    {t('mat.snartKommerBeskrivelse')}
  </div>
  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
    {snartKommerItems.map((item, i) => (
      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div style={{ width: '20px', height: '20px', borderRadius: '50%', backgroundColor: '#FFF0D6', border: '1px solid #F4D9A0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path d="M2 5L4 7L8 3" stroke="#8B6340" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <div style={{ fontSize: '12px', fontFamily: 'var(--font-inter)', color: '#6B5040' }}>{item.tekst}</div>
      </div>
    ))}
  </div>
</div>

          {/* Tips */}
          <div style={{ backgroundColor: farger.hvit, border: `1px solid ${farger.kremMørk}`, borderRadius: '20px', padding: '20px' }}>
            <div style={{ fontSize: '14px', fontFamily: 'var(--font-plus-jakarta)', color: farger.tekst, fontWeight: '700', marginBottom: '16px' }}>{t('mat.tipsTitle')}</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
              {TIPS.map((tip, i) => (
                <div key={i} style={{ backgroundColor: farger.bakgrunn, borderRadius: '14px', padding: '12px', textAlign: 'center' }}>
                  <div style={{ fontSize: '22px', marginBottom: '6px' }}>{tip.ikon}</div>
                  <div style={{ fontSize: '11px', fontFamily: 'var(--font-plus-jakarta)', color: farger.tekst, fontWeight: '700', marginBottom: '4px' }}>{tip.tittel}</div>
                  <div style={{ fontSize: '10px', fontFamily: 'var(--font-inter)', color: farger.tekstLys, lineHeight: 1.4 }}>{tip.tekst}</div>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : (
        // ─── MED DATA ───
        <>
          {/* Dagens observasjon */}
          <div style={{ backgroundColor: farger.hvit, border: `1px solid ${farger.kremMørk}`, borderRadius: '20px', padding: '20px', marginBottom: '16px', display: 'flex', gap: '16px', alignItems: 'center' }}>
            <div style={{ fontSize: '56px', flexShrink: 0 }}>🍑</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '11px', fontFamily: 'var(--font-inter)', color: '#F4A853', fontWeight: '700', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '4px' }}>{t('mat.dagsObservasjon')}</div>
              <div style={{ fontSize: '18px', fontFamily: 'var(--font-plus-jakarta)', color: farger.tekst, fontWeight: '700', lineHeight: 1.3, marginBottom: '8px' }}>
                {t('mat.harPrøvd', { navn: babyNavn, antall: unikeMatvarer.length })}
              </div>
              {topFavoritter.length > 0 && (
                <div style={{ fontSize: '13px', fontFamily: 'var(--font-inter)', color: farger.tekstLys, marginBottom: '8px' }}>
                  {t('mat.favorittenSerUtTilÅVære')}
                </div>
              )}
              {topFavoritter[0] && (
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 12px', backgroundColor: '#F0F7F0', border: `1px solid ${farger.grønn}`, borderRadius: '20px' }}>
                  <span>{getKategoriIkon(matreg.find(m => m.matvare === topFavoritter[0][0])?.kategori || '')}</span>
                  <span style={{ fontSize: '13px', fontFamily: 'var(--font-inter)', color: farger.grønn, fontWeight: '600' }}>{topFavoritter[0][0]}</span>
                </div>
              )}
            </div>
          </div>

          {/* Tre kolonner: Smaksreise, Favoritter, Ikke populær */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '16px' }}>
            {/* Smaksreise */}
            <div style={{ backgroundColor: farger.hvit, border: `1px solid ${farger.kremMørk}`, borderRadius: '16px', padding: '14px' }}>
              <div style={{ fontSize: '10px', fontFamily: 'var(--font-inter)', color: farger.grønn, fontWeight: '700', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t('mat.smaksreiseHeader')}</div>
              {unikeMatvarer.slice(0, 4).map((m, i) => (
                <div key={i} style={{ fontSize: '12px', fontFamily: 'var(--font-inter)', color: farger.tekst, marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span>{getKategoriIkon(matreg.find(r => r.matvare === m)?.kategori || '')}</span>
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m}</span>
                </div>
              ))}
              <div style={{ fontSize: '11px', fontFamily: 'var(--font-inter)', color: farger.grønn, fontWeight: '600', marginTop: '6px' }}>{t('mat.totalt', { antall: unikeMatvarer.length })}</div>
            </div>

            {/* Favoritter */}
            <div style={{ backgroundColor: farger.hvit, border: `1px solid ${farger.kremMørk}`, borderRadius: '16px', padding: '14px' }}>
              <div style={{ fontSize: '10px', fontFamily: 'var(--font-inter)', color: '#BE123C', fontWeight: '700', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t('mat.favoritterHeader')}</div>
              {topFavoritter.slice(0, 3).map(([navn], i) => (
                <div key={i} style={{ fontSize: '12px', fontFamily: 'var(--font-inter)', color: farger.tekst, marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ fontSize: '10px', fontWeight: '700', color: '#F4A853' }}>{i + 1}</span>
                  <span>{getKategoriIkon(matreg.find(r => r.matvare === navn)?.kategori || '')}</span>
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{navn}</span>
                </div>
              ))}
              {topFavoritter.length === 0 && <div style={{ fontSize: '11px', fontFamily: 'var(--font-inter)', color: farger.tekstLys }}>{t('mat.ingenEnnå')}</div>}
              <div style={{ fontSize: '11px', fontFamily: 'var(--font-inter)', color: '#BE123C', fontWeight: '600', marginTop: '6px' }}>{t('mat.seAlle')}</div>
            </div>

            {/* Ikke populær */}
            <div style={{ backgroundColor: farger.hvit, border: `1px solid ${farger.kremMørk}`, borderRadius: '16px', padding: '14px' }}>
              <div style={{ fontSize: '10px', fontFamily: 'var(--font-inter)', color: '#8B6340', fontWeight: '700', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t('mat.ikkeSåPopulærtHeader')}</div>
              {topIkkePop.slice(0, 2).map(([navn], i) => (
                <div key={i} style={{ fontSize: '12px', fontFamily: 'var(--font-inter)', color: farger.tekst, marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span>{getKategoriIkon(matreg.find(r => r.matvare === navn)?.kategori || '')}</span>
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{navn}</span>
                </div>
              ))}
              {topIkkePop.length === 0 && <div style={{ fontSize: '11px', fontFamily: 'var(--font-inter)', color: farger.tekstLys }}>{t('mat.ingenEnnå')}</div>}
              <div style={{ fontSize: '11px', fontFamily: 'var(--font-inter)', color: '#8B6340', fontWeight: '600', marginTop: '6px' }}>{t('mat.seMer')}</div>
            </div>
          </div>

          {/* AI Innsikter */}
          {(lasterAi || aiInnsikter.length > 0) && (
            <div style={{ backgroundColor: farger.hvit, border: `1px solid ${farger.kremMørk}`, borderRadius: '20px', padding: '20px', marginBottom: '16px', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', right: '16px', bottom: '16px', fontSize: '48px', opacity: 0.15 }}>🐻</div>
              <div style={{ fontSize: '11px', fontFamily: 'var(--font-inter)', color: '#F4A853', fontWeight: '700', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '10px' }}>{t('mat.innsiktFraAi')}</div>
              {lasterAi ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '20px', height: '20px', border: '2px solid #F4A853', borderTop: '2px solid transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                  <div style={{ fontSize: '13px', fontFamily: 'var(--font-inter)', color: farger.tekstLys }}>{t('mat.analysererMatmønstre')}</div>
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

        {/* Siste måltider */}
<div style={{ backgroundColor: farger.hvit, border: `1px solid ${farger.kremMørk}`, borderRadius: '20px', padding: '20px', marginBottom: '16px' }}>
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
    <div style={{ fontSize: '15px', fontFamily: 'var(--font-plus-jakarta)', color: farger.tekst, fontWeight: '700' }}>{t('mat.sisteMåltider')}</div>
    <div style={{ fontSize: '13px', fontFamily: 'var(--font-inter)', color: '#F4A853', fontWeight: '600' }}>{t('mat.seAlle')}</div>
  </div>
  <div style={{ background: 'rgba(255,255,255,0.6)', border: '1px solid rgba(220,207,192,0.35)', borderRadius: '16px', overflow: 'hidden', padding: '8px 0' }}>
    {matreg.slice(0, 5).map((m, i) => (
      <div key={i} style={{ position: 'relative' }}>
        {i < Math.min(matreg.length, 5) - 1 && (
          <div style={{ position: 'absolute', left: '36px', top: '54px', width: '1px', height: 'calc(100% - 10px)', backgroundColor: 'rgba(220,207,192,0.5)' }} />
        )}
        <div style={{ padding: '12px 18px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: KATEGORIER.find(k => k.id === m.kategori)?.farge || farger.bakgrunn, border: `1px solid ${KATEGORIER.find(k => k.id === m.kategori)?.border || farger.kremMørk}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', flexShrink: 0, zIndex: 1 }}>
            {getKategoriIkon(m.kategori)}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '14px', fontFamily: 'var(--font-inter)', color: farger.tekst, fontWeight: i === 0 ? 600 : 400 }}>
              {m.matvare}
            </div>
            <div style={{ fontSize: '11px', fontFamily: 'var(--font-inter)', color: farger.tekstLys, marginTop: '2px' }}>
  {getReaksjonIkon(m.reaksjon)} {getReaksjonLabel(m.reaksjon)} · {getMengdeLabel(m.mengde)}
</div>
{m.allergi_status && (
  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', marginTop: '4px', padding: '2px 8px', backgroundColor: ALLERGI_STATUS.find(a => a.id === m.allergi_status)?.bg, borderRadius: '20px' }}>
    <span style={{ fontSize: '10px' }}>{ALLERGI_STATUS.find(a => a.id === m.allergi_status)?.ikon}</span>
    <span style={{ fontSize: '10px', fontFamily: 'var(--font-inter)', color: ALLERGI_STATUS.find(a => a.id === m.allergi_status)?.farge, fontWeight: '600' }}>
      {ALLERGI_STATUS.find(a => a.id === m.allergi_status)?.label}
    </span>
  </div>
)}
          </div>
          <div style={{ fontSize: '12px', fontFamily: 'var(--font-inter)', color: farger.tekstLys, flexShrink: 0, textAlign: 'right' }}>
            <div>{m.klokkeslett.slice(0, 5)}</div>
            <div style={{ fontSize: '10px', marginTop: '2px' }}>
              {formatDato(m.dato)}
            </div>
          </div>
        </div>
      </div>
    ))}
  </div>
</div>

                
          {/* Smakskart */}
          <div style={{ backgroundColor: farger.hvit, border: `1px solid ${farger.kremMørk}`, borderRadius: '20px', padding: '20px', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '18px' }}>🗺️</span>
                <div style={{ fontSize: '15px', fontFamily: 'var(--font-plus-jakarta)', color: farger.tekst, fontWeight: '700' }}>{t('mat.smakskart')}</div>
              </div>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M6 4L10 8L6 12" stroke={farger.tekstLys} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '4px' }}>
              {smakskart.map(kat => (
                <div key={kat.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', minWidth: '64px' }}>
                  <div style={{ width: '52px', height: '52px', borderRadius: '50%', backgroundColor: kat.farge, border: `1.5px solid ${kat.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px' }}>
                    {kat.ikon}
                  </div>
                  <div style={{ fontSize: '10px', fontFamily: 'var(--font-inter)', color: farger.tekst, textAlign: 'center', fontWeight: '500' }}>{kat.label}</div>
                  <div style={{ fontSize: '10px', fontFamily: 'var(--font-inter)', color: kat.antall > 0 ? kat.tekstFarge : farger.tekstLys, fontWeight: kat.antall > 0 ? '600' : '400' }}>
                    {kat.antall > 0 ? t('mat.prøvd', { antall: kat.antall }) : t('mat.nullPrøvd')}
                  </div>
                  {/* Fremdriftslinje */}
                  {kat.antall > 0 && (
                    <div style={{ width: '52px', height: '3px', backgroundColor: farger.kremMørk, borderRadius: '2px' }}>
                      <div style={{ height: '3px', backgroundColor: kat.tekstFarge, borderRadius: '2px', width: `${Math.min(kat.antall * 10, 100)}%` }} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Registrer-knapp */}
          <button
            onClick={() => setVisSkjema(true)}
            style={{ position: 'fixed', bottom: '100px', left: '50%', transform: 'translateX(-50%)', padding: '16px 32px', background: 'linear-gradient(135deg, #F4A853, #E8943F)', border: 'none', borderRadius: '50px', fontSize: '15px', fontWeight: '700', color: '#fff', cursor: 'pointer', fontFamily: 'var(--font-inter)', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 20px rgba(244,168,83,0.5)', zIndex: 50 }}
          >
            <span style={{ fontSize: '18px' }}>+</span> {t('mat.registrerMåltid')}
          </button>
        </>
      )}

      {/* ─── REGISTRERINGSSKJEMA ─── */}
      {visSkjema && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 200, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }} onClick={() => setVisSkjema(false)}>
          <div onClick={e => e.stopPropagation()} style={{ backgroundColor: farger.hvit, width: '100%', maxWidth: '430px', borderRadius: '24px 24px 0 0', padding: '24px', paddingBottom: '48px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ width: '36px', height: '4px', backgroundColor: farger.kremMørk, borderRadius: '2px', margin: '0 auto 20px' }} />
            <div style={{ fontSize: '20px', fontFamily: 'var(--font-plus-jakarta)', color: farger.tekst, fontWeight: '700', marginBottom: '20px' }}>{t('mat.nyttMåltid')}</div>

            {/* Matvare */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '13px', fontFamily: 'var(--font-inter)', color: farger.tekst, fontWeight: '600', marginBottom: '8px' }}>{t('mat.matvare')}</div>
              <input
                value={matvare}
                onChange={e => setMatvare(e.target.value)}
                placeholder={t('mat.matvarePlaceholder')}
                style={{ width: '100%', padding: '12px 14px', fontSize: '14px', border: `1px solid ${farger.kremMørk}`, borderRadius: '12px', backgroundColor: farger.bakgrunn, color: farger.tekst, outline: 'none', fontFamily: 'var(--font-inter)', boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '13px', fontFamily: 'var(--font-inter)', color: farger.tekst, fontWeight: '600', marginBottom: '8px' }}>{t('mat.nyMatvare')}</div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => setErNyMatvare(true)} style={{ flex: 1, padding: '12px', backgroundColor: erNyMatvare === true ? farger.grønnLys : farger.bakgrunn, border: `1.5px solid ${erNyMatvare === true ? farger.grønn : farger.kremMørk}`, borderRadius: '12px', cursor: 'pointer', fontSize: '13px', fontFamily: 'var(--font-inter)', color: erNyMatvare === true ? farger.grønn : farger.tekst, fontWeight: erNyMatvare === true ? '600' : '400' }}>
                  {t('mat.ja')}
                </button>
                <button onClick={() => setErNyMatvare(false)} style={{ flex: 1, padding: '12px', backgroundColor: erNyMatvare === false ? farger.grønnLys : farger.bakgrunn, border: `1.5px solid ${erNyMatvare === false ? farger.grønn : farger.kremMørk}`, borderRadius: '12px', cursor: 'pointer', fontSize: '13px', fontFamily: 'var(--font-inter)', color: erNyMatvare === false ? farger.grønn : farger.tekst, fontWeight: erNyMatvare === false ? '600' : '400' }}>
                  {t('mat.nei')}
                </button>
              </div>
              {erNyMatvare === true && (
                <div style={{ marginTop: '10px', padding: '12px 16px', backgroundColor: '#F0F7F0', border: `1px solid ${farger.grønn}`, borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '18px' }}>🌱</span>
                  <span style={{ fontSize: '13px', fontFamily: 'var(--font-inter)', color: farger.grønn, fontWeight: '600' }}>{t('mat.førstegangBadge', { navn: babyNavn })}</span>
                </div>
              )}
            </div>

            {/* Kategori */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '13px', fontFamily: 'var(--font-inter)', color: farger.tekst, fontWeight: '600', marginBottom: '8px' }}>{t('mat.kategori')}</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                {KATEGORIER.map(kat => (
                  <button key={kat.id} onClick={() => setKategori(kat.id)} style={{ padding: '10px 8px', backgroundColor: kategori === kat.id ? kat.farge : farger.bakgrunn, border: `1.5px solid ${kategori === kat.id ? kat.border : farger.kremMørk}`, borderRadius: '12px', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                    <span style={{ fontSize: '20px' }}>{kat.ikon}</span>
                    <span style={{ fontSize: '11px', fontFamily: 'var(--font-inter)', color: kategori === kat.id ? kat.tekstFarge : farger.tekst, fontWeight: kategori === kat.id ? '700' : '400' }}>{kat.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Reaksjon */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '13px', fontFamily: 'var(--font-inter)', color: farger.tekst, fontWeight: '600', marginBottom: '8px' }}>{t('mat.reaksjon')}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {REAKSJONER.map(r => (
                  <button key={r.id} onClick={() => setReaksjon(r.id)} style={{ padding: '12px 16px', backgroundColor: reaksjon === r.id ? farger.grønnLys : farger.bakgrunn, border: `1.5px solid ${reaksjon === r.id ? farger.grønn : farger.kremMørk}`, borderRadius: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', textAlign: 'left' }}>
                    <span style={{ fontSize: '20px' }}>{r.ikon}</span>
                    <span style={{ fontSize: '13px', fontFamily: 'var(--font-inter)', color: reaksjon === r.id ? farger.grønn : farger.tekst, fontWeight: reaksjon === r.id ? '600' : '400' }}>{r.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Mengde */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '13px', fontFamily: 'var(--font-inter)', color: farger.tekst, fontWeight: '600', marginBottom: '8px' }}>{t('mat.mengdeSpist')}</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                {MENGDER.map(m => (
                  <button key={m.id} onClick={() => setMengde(m.id)} style={{ padding: '12px', backgroundColor: mengde === m.id ? '#FFF8EC' : farger.bakgrunn, border: `1.5px solid ${mengde === m.id ? '#F4D9A0' : farger.kremMørk}`, borderRadius: '12px', cursor: 'pointer', fontSize: '13px', fontFamily: 'var(--font-inter)', color: mengde === m.id ? '#8B6340' : farger.tekst, fontWeight: mengde === m.id ? '600' : '400' }}>
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Allergivarsel */}
<div style={{ marginBottom: '16px' }}>
  <div style={{ fontSize: '13px', fontFamily: 'var(--font-inter)', color: farger.tekst, fontWeight: '600', marginBottom: '4px' }}>{t('mat.allergiValgfritt')}</div>
  <div style={{ fontSize: '11px', fontFamily: 'var(--font-inter)', color: farger.tekstLys, marginBottom: '8px' }}>{t('mat.allergiSpørsmål')}</div>
  <div style={{ display: 'flex', gap: '8px' }}>
    {ALLERGI_STATUS.map(a => (
      <button key={a.id} onClick={() => setAllergiStatus(allergiStatus === a.id ? '' : a.id)}
        style={{ flex: 1, padding: '12px 8px', backgroundColor: allergiStatus === a.id ? a.bg : farger.bakgrunn, border: `1.5px solid ${allergiStatus === a.id ? a.farge : farger.kremMørk}`, borderRadius: '12px', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
        <span style={{ fontSize: '18px' }}>{a.ikon}</span>
        <span style={{ fontSize: '10px', fontFamily: 'var(--font-inter)', color: allergiStatus === a.id ? a.farge : farger.tekstLys, fontWeight: allergiStatus === a.id ? '600' : '400', textAlign: 'center', lineHeight: 1.3 }}>{a.label}</span>
      </button>
    ))}
  </div>
</div>

            {/* Dato og tid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>
              <div>
                <div style={{ fontSize: '13px', fontFamily: 'var(--font-inter)', color: farger.tekst, fontWeight: '600', marginBottom: '8px' }}>{t('mat.dato')}</div>
                <input type="date" value={dato} onChange={e => setDato(e.target.value)} style={{ width: '100%', padding: '10px 12px', fontSize: '13px', border: `1px solid ${farger.kremMørk}`, borderRadius: '12px', backgroundColor: farger.bakgrunn, color: farger.tekst, outline: 'none', fontFamily: 'var(--font-inter)', boxSizing: 'border-box' }} />
              </div>
              <div>
                <div style={{ fontSize: '13px', fontFamily: 'var(--font-inter)', color: farger.tekst, fontWeight: '600', marginBottom: '8px' }}>{t('mat.tidspunkt')}</div>
                <input type="time" value={klokkeslett} onChange={e => setKlokkeslett(e.target.value)} style={{ width: '100%', padding: '10px 12px', fontSize: '13px', border: `1px solid ${farger.kremMørk}`, borderRadius: '12px', backgroundColor: farger.bakgrunn, color: farger.tekst, outline: 'none', fontFamily: 'var(--font-inter)', boxSizing: 'border-box' }} />
              </div>
            </div>

            {/* Notater */}
            <div style={{ marginBottom: '24px' }}>
              <div style={{ fontSize: '13px', fontFamily: 'var(--font-inter)', color: farger.tekst, fontWeight: '600', marginBottom: '8px' }}>{t('mat.notaterValgfritt')}</div>
              <textarea value={notater} onChange={e => setNotater(e.target.value)} placeholder={t('mat.notaterPlaceholder')} rows={2} style={{ width: '100%', padding: '12px 14px', fontSize: '13px', border: `1px solid ${farger.kremMørk}`, borderRadius: '12px', backgroundColor: farger.bakgrunn, color: farger.tekst, outline: 'none', fontFamily: 'var(--font-inter)', resize: 'none', boxSizing: 'border-box' }} />
            </div>

            <button
              onClick={lagreMatregistrering}
              disabled={!matvare.trim() || !kategori || !reaksjon || !mengde || lagrer}
              style={{ width: '100%', padding: '16px', backgroundColor: (!matvare.trim() || !kategori || !reaksjon || !mengde) ? farger.kremMørk : farger.grønn, border: 'none', borderRadius: '14px', fontSize: '15px', fontWeight: '600', color: (!matvare.trim() || !kategori || !reaksjon || !mengde) ? farger.tekstLys : '#FDFAF6', cursor: (!matvare.trim() || !kategori || !reaksjon || !mengde) ? 'not-allowed' : 'pointer', fontFamily: 'var(--font-inter)' }}
            >
              {lagrer ? t('mat.lagrer') : t('mat.lagreMåltid')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}