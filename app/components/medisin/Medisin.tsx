'use client';
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { farger } from '../../lib/farger';
import { useLanguage } from '../../lib/i18n/LanguageContext';
import { OversettelseNøkkel } from '../../lib/i18n/translations';

type Props = { bruker: any; };

type Medisin = {
  id: number;
  navn: string;
  dosering: string;
  frekvens: string;
  tidspunkt: string;
  notat: string;
};

type MedisinLogg = {
  id: number;
  medisin_id: number;
  dato: string;
  tidspunkt: string;
  bivirkning: string;
};

type Vaksine = {
  id: number;
  navn: string;
  dato: string;
  tatt: boolean;
  notat: string;
};

type TFn = (nøkkel: OversettelseNøkkel, variabler?: Record<string, string | number>) => string;

const dagensdato = () => new Date().toISOString().split('T')[0];

const STANDARD_MEDISINER = [
  { navn: 'D-vitamindråper', dosering: '5 dråper', frekvens: 'Daglig', tidspunkt: '10:00' },
  { navn: 'Infacol', dosering: '0.5 ml', frekvens: 'Ved behov', tidspunkt: '' },
  { navn: 'Paracet', dosering: 'Se pakningsvedlegg', frekvens: 'Ved feber', tidspunkt: '' },
];

const NORSKE_VAKSINER = [
  { navn: '6 uker vaksine', alder: '6 uker', beskrivelse: 'Rotavirus' },
  { navn: '3 måneder vaksine', alder: '3 mnd', beskrivelse: 'DTaP-IPV-Hib-HepB + PCV' },
  { navn: '5 måneder vaksine', alder: '5 mnd', beskrivelse: 'DTaP-IPV-Hib-HepB + PCV + Rotavirus' },
  { navn: '12 måneder vaksine', alder: '12 mnd', beskrivelse: 'DTaP-IPV-Hib-HepB + PCV + MMR' },
  { navn: '15 måneder vaksine', alder: '15 mnd', beskrivelse: 'MMR 2' },
];

const getFrekvensValg = (t: TFn) => [
  { id: 'Daglig', label: t('medisin.frekvensDaily') },
  { id: 'To ganger daglig', label: t('medisin.frekvensTwoDaily') },
  { id: 'Ukentlig', label: t('medisin.frekvensWeekly') },
  { id: 'Ved behov', label: t('medisin.frekvensAsNeeded') },
  { id: 'Ved feber', label: t('medisin.frekvensAtFever') },
];
const MedisinIkon = ({ farge }: { farge: string }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <rect x="8" y="4" width="8" height="14" rx="4" stroke={farge} strokeWidth="1.5" fill="none"/>
    <line x1="12" y1="8" x2="12" y2="14" stroke={farge} strokeWidth="1.5" strokeLinecap="round"/>
    <line x1="9" y1="11" x2="15" y2="11" stroke={farge} strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

const VaksineIkon = ({ farge }: { farge: string }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <line x1="19" y1="5" x2="21" y2="3" stroke={farge} strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M6 18L15 9" stroke={farge} strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M9 7L17 15" stroke={farge} strokeWidth="1.5" strokeLinecap="round"/>
    <line x1="4" y1="20" x2="6" y2="18" stroke={farge} strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

export default function Medisin({ bruker }: Props) {
  const { t } = useLanguage();
  const frekvensValg = getFrekvensValg(t);
  const finnFrekvensLabel = (id: string) => frekvensValg.find(f => f.id === id)?.label ?? id;

  const [aktivFane, setAktivFane] = useState<'medisin' | 'vaksiner'>('medisin');
  const [medisiner, setMedisiner] = useState<Medisin[]>([]);
  const [logg, setLogg] = useState<MedisinLogg[]>([]);
  const [vaksiner, setVaksiner] = useState<Vaksine[]>([]);
  const [visLeggTil, setVisLeggTil] = useState(false);
  const [visLeggTilVaksine, setVisLeggTilVaksine] = useState(false);
  const [visGiDose, setVisGiDose] = useState<Medisin | null>(null);
  const [visVarsel, setVisVarsel] = useState<Medisin | null>(null);
  const [lagrer, setLagrer] = useState(false);
  const [visBekreftet, setVisBekreftet] = useState(false);
  const [nesteDose, setNesteDose] = useState<{ navn: string; tid: string } | null>(null);

  const [nyttNavn, setNyttNavn] = useState('');
  const [nyDosering, setNyDosering] = useState('');
  const [nyFrekvens, setNyFrekvens] = useState('Daglig');
  const [nyttTidspunkt, setNyttTidspunkt] = useState('10:00');
  const [nyttNotat, setNyttNotat] = useState('');
  const [bivirkningNotat, setBivirkningNotat] = useState('');
  const [påvirkerSøvn, setPåvirkerSøvn] = useState(false);
  const [nyVaksinNavn, setNyVaksinNavn] = useState('');
  const [nyVaksinDato, setNyVaksinDato] = useState('');
  const [nyVaksinNotat, setNyVaksinNotat] = useState('');

  const lastData = useCallback(async () => {
    const [med, medLogg, vaks] = await Promise.all([
      supabase.from('medisin').select('*').eq('profil_id', bruker?.id).order('opprettet', { ascending: true }),
      supabase.from('medisin_logg').select('*').eq('profil_id', bruker?.id).eq('dato', dagensdato()),
      supabase.from('vaksiner').select('*').eq('profil_id', bruker?.id).order('dato', { ascending: true }),
    ]);
    if (med.data) setMedisiner(med.data);
    if (medLogg.data) setLogg(medLogg.data);
    if (vaks.data) setVaksiner(vaks.data);
  }, [bruker?.id]);

  useEffect(() => { lastData(); }, [lastData]);

  const beOmVarsel = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    return false;
  };
  const settOppVarsel = (m: Medisin) => {
    if (!m.tidspunkt) return;
    const [h, min] = m.tidspunkt.split(':').map(Number);
    const nå = new Date();
    const varselTid = new Date();
    varselTid.setHours(h, min, 0, 0);
    if (varselTid <= nå) varselTid.setDate(varselTid.getDate() + 1);
    setTimeout(() => setVisVarsel(m), varselTid.getTime() - nå.getTime());
  };

  const leggTilMedisin = async (forslag?: any) => {
    const navn = forslag?.navn || nyttNavn;
    if (!navn) return;
    setLagrer(true);
    const { data } = await supabase.from('medisin').insert({
      profil_id: bruker?.id,
      navn,
      dosering: forslag?.dosering || nyDosering,
      frekvens: forslag?.frekvens || nyFrekvens,
      tidspunkt: forslag?.tidspunkt || nyttTidspunkt,
      notat: nyttNotat,
    }).select().single();
    if (data) {
      const ok = await beOmVarsel();
      if (ok) settOppVarsel(data);
    }
    setNyttNavn(''); setNyDosering(''); setNyFrekvens('Daglig');
    setNyttTidspunkt('10:00'); setNyttNotat('');
    setVisLeggTil(false);
    setLagrer(false);
    lastData();
  };

  const giDose = async () => {
    if (!visGiDose) return;
    setLagrer(true);
    await supabase.from('medisin_logg').insert({
      profil_id: bruker?.id,
      medisin_id: visGiDose.id,
      dato: dagensdato(),
      tidspunkt: new Date().toLocaleTimeString('no-NO', { hour: '2-digit', minute: '2-digit' }),
      bivirkning: påvirkerSøvn ? `Påvirker søvn. ${bivirkningNotat}` : bivirkningNotat,
    });
    if (visGiDose.tidspunkt) {
      setNesteDose({ navn: visGiDose.navn, tid: visGiDose.tidspunkt });
    }
    setBivirkningNotat(''); setPåvirkerSøvn(false);
    setVisGiDose(null);
    setVisBekreftet(true);
    setTimeout(() => { setVisBekreftet(false); setNesteDose(null); }, 3000);
    setLagrer(false);
    lastData();
  };

  const leggTilVaksine = async (navn: string, beskrivelse?: string) => {
    await supabase.from('vaksiner').insert({
      profil_id: bruker?.id,
      navn,
      notat: beskrivelse || nyVaksinNotat,
      dato: nyVaksinDato || null,
      tatt: false,
    });
    setNyVaksinNavn(''); setNyVaksinDato(''); setNyVaksinNotat('');
    setVisLeggTilVaksine(false);
    lastData();
  };

  const markerVaksineTatt = async (id: number, tatt: boolean) => {
    await supabase.from('vaksiner').update({ tatt: !tatt }).eq('id', id);
    lastData();
  };

  const erGittIDag = (medisinId: number) => logg.some(l => l.medisin_id === medisinId);
  const nestePåminnelse = medisiner.find(m => !erGittIDag(m.id) && m.frekvens !== 'Ved behov' && m.frekvens !== 'Ved feber' && m.tidspunkt);
  const standardSomMangler = STANDARD_MEDISINER.filter(s => !medisiner.some(m => m.navn === s.navn));
  const vaksinerSomMangler = NORSKE_VAKSINER.filter(v => !vaksiner.some(vak => vak.navn === v.navn));

  return (
    <div style={{ backgroundColor: farger.bakgrunn, minHeight: '100vh', padding: '24px 24px 100px' }}>

      {/* Header */}
      <div style={{ marginBottom: '20px', textAlign: 'center' }}>
        <div style={{ fontSize: '26px', fontFamily: 'var(--font-plus-jakarta)', color: farger.tekst, fontWeight: '700', marginBottom: '4px' }}>
          {t('medisin.tittel')}
        </div>
        <div style={{ fontSize: '13px', fontFamily: 'var(--font-inter)', color: farger.tekstLys }}>
          {t('medisin.undertittel')}
        </div>      </div>

      {/* Bekreftet */}
      {visBekreftet && (
        <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', backgroundColor: farger.hvit, border: `1px solid ${farger.kremMørk}`, borderRadius: '24px', padding: '28px 24px', zIndex: 200, textAlign: 'center', boxShadow: '0 8px 32px rgba(0,0,0,0.15)', width: '280px' }}>
          <div style={{ fontSize: '32px', marginBottom: '8px' }}>✓</div>
          <div style={{ fontSize: '16px', fontFamily: 'var(--font-plus-jakarta)', color: farger.tekst, fontWeight: '600', marginBottom: '8px' }}>{t('medisin.loggført')}</div>
          {nesteDose && (
            <>
              <div style={{ fontSize: '13px', fontFamily: 'var(--font-inter)', color: farger.tekstLys, marginBottom: '4px' }}>{t('medisin.nesteDose')}</div>
              <div style={{ fontSize: '15px', fontFamily: 'var(--font-plus-jakarta)', color: farger.grønn, fontWeight: '600' }}>{nesteDose.navn}</div>
              <div style={{ fontSize: '14px', fontFamily: 'var(--font-inter)', color: farger.tekstLys }}>{t('medisin.iMorgen', { tid: nesteDose.tid })}</div>            </>
          )}
        </div>
      )}

      {/* In-app varsel */}
      {visVarsel && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
          <div style={{ backgroundColor: farger.hvit, borderRadius: '24px', padding: '28px 24px', width: '100%', maxWidth: '340px', textAlign: 'center', boxShadow: '0 16px 48px rgba(0,0,0,0.2)' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: farger.grønnLys, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                <path d="M18 8C18 6.4 17.4 4.9 16.2 3.8C15.1 2.6 13.6 2 12 2C10.4 2 8.9 2.6 7.8 3.8C6.6 4.9 6 6.4 6 8C6 15 3 17 3 17H21C21 17 18 15 18 8Z" fill={farger.grønn} opacity="0.8"/>
                <path d="M13.7 21C13.6 21.3 13.3 21.6 13 21.7C12.7 21.9 12.4 22 12 22C11.6 22 11.3 21.9 11 21.7C10.7 21.6 10.4 21.3 10.3 21" stroke={farger.grønn} strokeWidth="1.8" strokeLinecap="round"/>
              </svg>
            </div>
            <div style={{ fontSize: '18px', fontFamily: 'var(--font-plus-jakarta)', color: farger.tekst, fontWeight: '700', marginBottom: '6px' }}>
              {visVarsel.navn}
            </div>
            <div style={{ fontSize: '13px', fontFamily: 'var(--font-inter)', color: farger.tekstLys, marginBottom: '4px' }}>
              {t('medisin.tidForDose')}
            </div>            <div style={{ fontSize: '32px', fontFamily: 'var(--font-plus-jakarta)', color: farger.grønn, fontWeight: '700', marginBottom: '8px' }}>
              {visVarsel.tidspunkt}
            </div>
            {visVarsel.dosering && (
              <div style={{ fontSize: '13px', fontFamily: 'var(--font-inter)', color: farger.tekstLys, marginBottom: '24px' }}>
                {visVarsel.dosering}
              </div>
            )}
            <button onClick={() => { setVisVarsel(null); setVisGiDose(visVarsel); }} style={{ width: '100%', padding: '14px', backgroundColor: farger.grønn, border: 'none', borderRadius: '16px', fontSize: '15px', fontWeight: '600', color: '#FDFAF6', cursor: 'pointer', fontFamily: 'var(--font-inter)', marginBottom: '10px' }}>
              {t('medisin.jegHarGittDosen')}
            </button>
            <button onClick={() => setVisVarsel(null)} style={{ width: '100%', padding: '12px', backgroundColor: 'transparent', border: `1px solid ${farger.kremMørk}`, borderRadius: '16px', fontSize: '14px', color: farger.tekstLys, cursor: 'pointer', fontFamily: 'var(--font-inter)' }}>
              {t('medisin.senere')}
            </button>          </div>
        </div>
      )}

      {/* Faner */}
      <div style={{ display: 'flex', backgroundColor: farger.kremMørk, borderRadius: '16px', padding: '4px', marginBottom: '20px' }}>
        <button onClick={() => setAktivFane('medisin')} style={{ flex: 1, padding: '10px', borderRadius: '12px', border: 'none', backgroundColor: aktivFane === 'medisin' ? farger.hvit : 'transparent', color: aktivFane === 'medisin' ? farger.tekst : farger.tekstLys, fontSize: '13px', fontFamily: 'var(--font-inter)', fontWeight: aktivFane === 'medisin' ? '600' : '400', cursor: 'pointer', transition: 'all 0.2s' }}>
          {t('medisin.faneMedisin')}
        </button>
        <button onClick={() => setAktivFane('vaksiner')} style={{ flex: 1, padding: '10px', borderRadius: '12px', border: 'none', backgroundColor: aktivFane === 'vaksiner' ? farger.hvit : 'transparent', color: aktivFane === 'vaksiner' ? farger.tekst : farger.tekstLys, fontSize: '13px', fontFamily: 'var(--font-inter)', fontWeight: aktivFane === 'vaksiner' ? '600' : '400', cursor: 'pointer', transition: 'all 0.2s' }}>
          {t('medisin.faneVaksiner')}
        </button>      </div>

      {/* MEDISIN-FANE */}
      {aktivFane === 'medisin' && (
        <>
          {nestePåminnelse && (
            <div style={{ backgroundColor: farger.grønnLys, border: `1px solid ${farger.grønn}`, borderRadius: '16px', padding: '16px 20px', marginBottom: '12px' }}>
              <div style={{ fontSize: '12px', fontFamily: 'var(--font-inter)', color: farger.grønn, fontWeight: '600', marginBottom: '10px' }}>{t('medisin.nestePåminnelse')}</div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <img src="/medisinflaske.png" style={{ width: 28, height: 28, objectFit: 'contain' }} />
                  </div>
                  <div>
                    <div style={{ fontSize: '15px', fontFamily: 'var(--font-plus-jakarta)', color: farger.tekst, fontWeight: '600' }}>{nestePåminnelse.navn}</div>
                    <div style={{ fontSize: '12px', fontFamily: 'var(--font-inter)', color: farger.tekstLys }}>{nestePåminnelse.tidspunkt} · {finnFrekvensLabel(nestePåminnelse.frekvens)}</div>
                    {nestePåminnelse.dosering && <div style={{ fontSize: '11px', fontFamily: 'var(--font-inter)', color: farger.tekstLys }}>{nestePåminnelse.dosering}</div>}
                  </div>
                </div>
                <button onClick={() => setVisGiDose(nestePåminnelse)} style={{ padding: '8px 16px', backgroundColor: farger.grønn, border: 'none', borderRadius: '20px', fontSize: '12px', fontFamily: 'var(--font-inter)', color: '#FDFAF6', fontWeight: '600', cursor: 'pointer' }}>
                  {t('medisin.giDose')}
                </button>
              </div>
            </div>
          )}

          <div style={{ backgroundColor: farger.hvit, border: `1px solid ${farger.kremMørk}`, borderRadius: '16px', padding: '16px 20px', marginBottom: '12px' }}>
            <div style={{ fontSize: '15px', fontFamily: 'var(--font-plus-jakarta)', color: farger.tekst, fontWeight: '600', marginBottom: '12px' }}>{t('medisin.medisinoversikt')}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {medisiner.map(m => (
                <div key={m.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', backgroundColor: farger.bakgrunn, borderRadius: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: farger.grønnLys, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <img src="/medisinflaske.png" style={{ width: 28, height: 28, objectFit: 'contain' }} />
                    </div>
                    <div>
                      <div style={{ fontSize: '14px', fontFamily: 'var(--font-inter)', color: farger.tekst, fontWeight: '500' }}>{m.navn}</div>
                      <div style={{ fontSize: '11px', fontFamily: 'var(--font-inter)', color: farger.tekstLys }}>
                        {m.dosering && `${m.dosering} · `}{finnFrekvensLabel(m.frekvens)}{m.tidspunkt && ` · ${m.tidspunkt}`}
                      </div>                    </div>
                  </div>
                  <button onClick={() => !erGittIDag(m.id) && setVisGiDose(m)} style={{ width: '32px', height: '32px', borderRadius: '50%', border: `1.5px solid ${erGittIDag(m.id) ? farger.grønn : farger.kremMørk}`, backgroundColor: erGittIDag(m.id) ? farger.grønn : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: erGittIDag(m.id) ? 'default' : 'pointer', flexShrink: 0 }}>
                    {erGittIDag(m.id) && <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 7L5.5 10.5L12 3.5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                  </button>
                </div>
              ))}

              {standardSomMangler.length > 0 && (
                <>
                  {medisiner.length > 0 && <div style={{ height: '1px', backgroundColor: farger.kremMørk, margin: '4px 0' }} />}
                  <div style={{ fontSize: '11px', fontFamily: 'var(--font-inter)', color: farger.tekstLys, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px' }}>{t('medisin.vanligeMedisiner')}</div>
                  {standardSomMangler.map((s, i) => (
                    <button key={i} onClick={() => leggTilMedisin(s)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', backgroundColor: farger.bakgrunn, border: `1px dashed ${farger.kremMørk}`, borderRadius: '12px', cursor: 'pointer', textAlign: 'left', width: '100%' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: farger.kremMørk, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <img src="/medisinflaske.png" style={{ width: 28, height: 28, objectFit: 'contain' }} />
                        </div>
                        <div>
                          <div style={{ fontSize: '14px', fontFamily: 'var(--font-inter)', color: farger.tekstLys }}>{s.navn}</div>
                          <div style={{ fontSize: '11px', fontFamily: 'var(--font-inter)', color: farger.tekstLys }}>{s.dosering} · {finnFrekvensLabel(s.frekvens)}</div>
                        </div>
                      </div>
                      <div style={{ fontSize: '11px', fontFamily: 'var(--font-inter)', color: farger.grønn, fontWeight: '600', flexShrink: 0 }}>{t('medisin.leggTil')}</div>
                    </button>
                  ))}
                </>
              )}

              {medisiner.length === 0 && standardSomMangler.length === 0 && (
                <div style={{ textAlign: 'center', padding: '16px', color: farger.tekstLys, fontSize: '13px', fontFamily: 'var(--font-inter)' }}>
                  {t('medisin.ingenMedisiner')}
                </div>
              )}
            </div>
          </div>

          <button onClick={() => setVisLeggTil(true)} style={{ width: '100%', padding: '16px', backgroundColor: farger.grønnLys, border: `1px solid ${farger.grønn}`, borderRadius: '16px', fontSize: '15px', fontWeight: '600', color: farger.grønn, cursor: 'pointer', fontFamily: 'var(--font-inter)' }}>
            {t('medisin.leggTilMedisin')}
          </button>
        </>
      )}

      {/* VAKSINER-FANE */}
      {aktivFane === 'vaksiner' && (
        <>
          <div style={{ backgroundColor: farger.hvit, border: `1px solid ${farger.kremMørk}`, borderRadius: '16px', padding: '16px 20px', marginBottom: '12px' }}>
            <div style={{ fontSize: '15px', fontFamily: 'var(--font-plus-jakarta)', color: farger.tekst, fontWeight: '600', marginBottom: '12px' }}>{t('medisin.vaksineoversikt')}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {vaksiner.map(v => (
                <div key={v.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', backgroundColor: farger.bakgrunn, borderRadius: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: v.tatt ? farger.grønnLys : farger.kremMørk, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <img src="/vaksine.png" style={{ width: 24, height: 24, objectFit: 'contain', opacity: v.tatt ? 1 : 0.5 }} />
                    </div>
                    <div>
                      <div style={{ fontSize: '14px', fontFamily: 'var(--font-inter)', color: farger.tekst, fontWeight: '500' }}>{v.navn}</div>
                      {v.dato && <div style={{ fontSize: '11px', fontFamily: 'var(--font-inter)', color: farger.tekstLys }}>{new Date(v.dato).toLocaleDateString('no-NO', { day: 'numeric', month: 'long', year: 'numeric' })}</div>}
                      {v.notat && <div style={{ fontSize: '11px', fontFamily: 'var(--font-inter)', color: farger.tekstLys, fontStyle: 'italic' }}>{v.notat}</div>}
                    </div>
                  </div>
                  <button onClick={() => markerVaksineTatt(v.id, v.tatt)} style={{ width: '32px', height: '32px', borderRadius: '50%', border: `1.5px solid ${v.tatt ? farger.grønn : farger.kremMørk}`, backgroundColor: v.tatt ? farger.grønn : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
                    {v.tatt && <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 7L5.5 10.5L12 3.5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                  </button>
                </div>
              ))}

              {vaksinerSomMangler.length > 0 && (
                <>
                  {vaksiner.length > 0 && <div style={{ height: '1px', backgroundColor: farger.kremMørk, margin: '4px 0' }} />}
                  <div style={{ fontSize: '11px', fontFamily: 'var(--font-inter)', color: farger.tekstLys, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px' }}>{t('medisin.norskVaksinasjonsprogram')}</div>
                  {vaksinerSomMangler.map((v, i) => (
                    <button key={i} onClick={() => leggTilVaksine(v.navn, v.beskrivelse)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', backgroundColor: farger.bakgrunn, border: `1px dashed ${farger.kremMørk}`, borderRadius: '12px', cursor: 'pointer', textAlign: 'left', width: '100%' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: farger.kremMørk, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <img src="/vaksine.png" style={{ width: 24, height: 24, objectFit: 'contain', opacity: 0.5 }} />
                        </div>
                        <div>
                          <div style={{ fontSize: '14px', fontFamily: 'var(--font-inter)', color: farger.tekstLys }}>{v.navn}</div>
                          <div style={{ fontSize: '11px', fontFamily: 'var(--font-inter)', color: farger.tekstLys }}>{v.alder}</div>
                        </div>
                      </div>
                      <div style={{ fontSize: '11px', fontFamily: 'var(--font-inter)', color: farger.grønn, fontWeight: '600', flexShrink: 0 }}>{t('medisin.leggTil')}</div>
                    </button>
                  ))}
                </>
              )}
            </div>
          </div>

          <button onClick={() => setVisLeggTilVaksine(true)} style={{ width: '100%', padding: '16px', backgroundColor: farger.grønnLys, border: `1px solid ${farger.grønn}`, borderRadius: '16px', fontSize: '15px', fontWeight: '600', color: farger.grønn, cursor: 'pointer', fontFamily: 'var(--font-inter)' }}>
            {t('medisin.leggTilVaksine')}
          </button>
        </>
      )}

      {/* MODAL: Legg til medisin */}
      {visLeggTil && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', zIndex: 200, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }} onClick={() => setVisLeggTil(false)}>
          <div onClick={e => e.stopPropagation()} style={{ backgroundColor: farger.hvit, width: '100%', maxWidth: '430px', borderRadius: '24px 24px 0 0', padding: '24px', paddingBottom: '48px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ width: '36px', height: '4px', backgroundColor: farger.kremMørk, borderRadius: '2px', margin: '0 auto 20px' }} />
            <div style={{ fontSize: '18px', fontFamily: 'var(--font-plus-jakarta)', color: farger.tekst, fontWeight: '600', marginBottom: '20px' }}>{t('medisin.leggTilMedisinTittel')}</div>

            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '11px', letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: 'var(--font-inter)', color: farger.tekstLys, marginBottom: '8px' }}>{t('medisin.navnPåMedisin')}</div>
              <input type="text" value={nyttNavn} onChange={e => setNyttNavn(e.target.value)} placeholder={t('medisin.navnPlaceholder')} style={{ width: '100%', padding: '12px 16px', fontSize: '14px', border: `1px solid ${farger.kremMørk}`, borderRadius: '12px', backgroundColor: farger.bakgrunn, color: farger.tekst, outline: 'none', fontFamily: 'var(--font-inter)', boxSizing: 'border-box' }} />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '11px', letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: 'var(--font-inter)', color: farger.tekstLys, marginBottom: '8px' }}>{t('medisin.dosering')}</div>
              <input type="text" value={nyDosering} onChange={e => setNyDosering(e.target.value)} placeholder={t('medisin.doseringPlaceholder')} style={{ width: '100%', padding: '12px 16px', fontSize: '14px', border: `1px solid ${farger.kremMørk}`, borderRadius: '12px', backgroundColor: farger.bakgrunn, color: farger.tekst, outline: 'none', fontFamily: 'var(--font-inter)', boxSizing: 'border-box' }} />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '11px', letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: 'var(--font-inter)', color: farger.tekstLys, marginBottom: '8px' }}>{t('medisin.frekvens')}</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {frekvensValg.map(f => (
                  <button key={f.id} onClick={() => setNyFrekvens(f.id)} style={{ padding: '8px 14px', backgroundColor: nyFrekvens === f.id ? farger.grønnLys : farger.bakgrunn, border: `1.5px solid ${nyFrekvens === f.id ? farger.grønn : farger.kremMørk}`, borderRadius: '20px', fontSize: '12px', fontFamily: 'var(--font-inter)', color: nyFrekvens === f.id ? farger.grønn : farger.tekst, cursor: 'pointer', fontWeight: nyFrekvens === f.id ? '600' : '400' }}>
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '11px', letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: 'var(--font-inter)', color: farger.tekstLys, marginBottom: '8px' }}>{t('medisin.tidspunktPåminnelse')}</div>
              <input type="time" value={nyttTidspunkt} onChange={e => setNyttTidspunkt(e.target.value)} style={{ width: '100%', padding: '12px 16px', fontSize: '14px', border: `1px solid ${farger.kremMørk}`, borderRadius: '12px', backgroundColor: farger.bakgrunn, color: farger.tekst, outline: 'none', fontFamily: 'var(--font-inter)', boxSizing: 'border-box' }} />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <div style={{ fontSize: '11px', letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: 'var(--font-inter)', color: farger.tekstLys, marginBottom: '8px' }}>{t('medisin.notatValgfritt')}</div>
              <textarea value={nyttNotat} onChange={e => setNyttNotat(e.target.value)} placeholder={t('medisin.notatMedisinPlaceholder')} style={{ width: '100%', padding: '12px 16px', fontSize: '14px', border: `1px solid ${farger.kremMørk}`, borderRadius: '12px', backgroundColor: farger.bakgrunn, color: farger.tekst, outline: 'none', fontFamily: 'var(--font-inter)', resize: 'none', minHeight: '70px', boxSizing: 'border-box' }} />
            </div>

            <button onClick={() => leggTilMedisin()} disabled={!nyttNavn || lagrer} style={{ width: '100%', padding: '16px', backgroundColor: nyttNavn ? farger.grønnLys : farger.kremMørk, border: `1px solid ${nyttNavn ? farger.grønn : 'transparent'}`, borderRadius: '16px', fontSize: '15px', fontWeight: '600', color: nyttNavn ? farger.grønn : farger.tekstLys, cursor: nyttNavn ? 'pointer' : 'not-allowed', fontFamily: 'var(--font-inter)' }}>
              {lagrer ? t('medisin.lagrer') : t('medisin.lagreMedPåminnelse')}
            </button>
          </div>
        </div>
      )}

      {/* MODAL: Legg til vaksine */}
      {visLeggTilVaksine && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', zIndex: 200, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }} onClick={() => setVisLeggTilVaksine(false)}>
          <div onClick={e => e.stopPropagation()} style={{ backgroundColor: farger.hvit, width: '100%', maxWidth: '430px', borderRadius: '24px 24px 0 0', padding: '24px', paddingBottom: '48px' }}>
            <div style={{ width: '36px', height: '4px', backgroundColor: farger.kremMørk, borderRadius: '2px', margin: '0 auto 20px' }} />
            <div style={{ fontSize: '18px', fontFamily: 'var(--font-plus-jakarta)', color: farger.tekst, fontWeight: '600', marginBottom: '20px' }}>{t('medisin.leggTilVaksineTittel')}</div>

            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '11px', letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: 'var(--font-inter)', color: farger.tekstLys, marginBottom: '8px' }}>{t('medisin.navn')}</div>
              <input type="text" value={nyVaksinNavn} onChange={e => setNyVaksinNavn(e.target.value)} placeholder={t('medisin.vaksinNavnPlaceholder')} style={{ width: '100%', padding: '12px 16px', fontSize: '14px', border: `1px solid ${farger.kremMørk}`, borderRadius: '12px', backgroundColor: farger.bakgrunn, color: farger.tekst, outline: 'none', fontFamily: 'var(--font-inter)', boxSizing: 'border-box' }} />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '11px', letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: 'var(--font-inter)', color: farger.tekstLys, marginBottom: '8px' }}>{t('medisin.datoForTime')}</div>
              <input type="date" value={nyVaksinDato} onChange={e => setNyVaksinDato(e.target.value)} style={{ width: '100%', padding: '12px 16px', fontSize: '14px', border: `1px solid ${farger.kremMørk}`, borderRadius: '12px', backgroundColor: farger.bakgrunn, color: farger.tekst, outline: 'none', fontFamily: 'var(--font-inter)', boxSizing: 'border-box' }} />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <div style={{ fontSize: '11px', letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: 'var(--font-inter)', color: farger.tekstLys, marginBottom: '8px' }}>{t('medisin.notatValgfritt')}</div>
              <textarea value={nyVaksinNotat} onChange={e => setNyVaksinNotat(e.target.value)} placeholder={t('medisin.notatVaksinePlaceholder')} style={{ width: '100%', padding: '12px 16px', fontSize: '14px', border: `1px solid ${farger.kremMørk}`, borderRadius: '12px', backgroundColor: farger.bakgrunn, color: farger.tekst, outline: 'none', fontFamily: 'var(--font-inter)', resize: 'none', minHeight: '70px', boxSizing: 'border-box' }} />
            </div>

            <button onClick={() => leggTilVaksine(nyVaksinNavn)} disabled={!nyVaksinNavn || lagrer} style={{ width: '100%', padding: '16px', backgroundColor: nyVaksinNavn ? farger.grønnLys : farger.kremMørk, border: `1px solid ${nyVaksinNavn ? farger.grønn : 'transparent'}`, borderRadius: '16px', fontSize: '15px', fontWeight: '600', color: nyVaksinNavn ? farger.grønn : farger.tekstLys, cursor: nyVaksinNavn ? 'pointer' : 'not-allowed', fontFamily: 'var(--font-inter)' }}>
              {lagrer ? t('medisin.lagrer') : t('medisin.lagreVaksine')}
            </button>
          </div>
        </div>
      )}

      {/* MODAL: Gi dose */}
      {visGiDose && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', zIndex: 200, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }} onClick={() => setVisGiDose(null)}>
          <div onClick={e => e.stopPropagation()} style={{ backgroundColor: farger.hvit, width: '100%', maxWidth: '430px', borderRadius: '24px 24px 0 0', padding: '24px', paddingBottom: '48px' }}>
            <div style={{ width: '36px', height: '4px', backgroundColor: farger.kremMørk, borderRadius: '2px', margin: '0 auto 20px' }} />
            <div style={{ fontSize: '18px', fontFamily: 'var(--font-plus-jakarta)', color: farger.tekst, fontWeight: '600', marginBottom: '4px' }}>{t('medisin.giDoseTittel')}</div>
            <div style={{ fontSize: '14px', fontFamily: 'var(--font-inter)', color: farger.tekstLys, marginBottom: '20px' }}>{visGiDose.navn} · {visGiDose.dosering}</div>

            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '11px', letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: 'var(--font-inter)', color: farger.tekstLys, marginBottom: '8px' }}>{t('medisin.bivirkningerNotat')}</div>
              <textarea value={bivirkningNotat} onChange={e => setBivirkningNotat(e.target.value)} placeholder={t('medisin.bivirkningerPlaceholder')} style={{ width: '100%', padding: '12px 16px', fontSize: '14px', border: `1px solid ${farger.kremMørk}`, borderRadius: '12px', backgroundColor: farger.bakgrunn, color: farger.tekst, outline: 'none', fontFamily: 'var(--font-inter)', resize: 'none', minHeight: '70px', boxSizing: 'border-box' }} />
            </div>

            <button onClick={() => setPåvirkerSøvn(!påvirkerSøvn)} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', backgroundColor: påvirkerSøvn ? farger.grønnLys : farger.bakgrunn, border: `1.5px solid ${påvirkerSøvn ? farger.grønn : farger.kremMørk}`, borderRadius: '12px', cursor: 'pointer', width: '100%', marginBottom: '20px', textAlign: 'left' }}>
              <div style={{ width: '20px', height: '20px', borderRadius: '50%', border: `1.5px solid ${påvirkerSøvn ? farger.grønn : farger.kremMørk}`, backgroundColor: påvirkerSøvn ? farger.grønn : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {påvirkerSøvn && <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M1.5 5L4 7.5L8.5 2.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
              </div>
              <div>
                <div style={{ fontSize: '13px', fontFamily: 'var(--font-inter)', color: farger.tekst, fontWeight: '500' }}>{t('medisin.påvirkerSøvn')}</div>
                <div style={{ fontSize: '11px', fontFamily: 'var(--font-inter)', color: farger.tekstLys }}>{t('medisin.påvirkerSøvnTekst')}</div>
              </div>
            </button>

            <button onClick={giDose} disabled={lagrer} style={{ width: '100%', padding: '16px', backgroundColor: farger.grønnLys, border: `1px solid ${farger.grønn}`, borderRadius: '16px', fontSize: '15px', fontWeight: '600', color: farger.grønn, cursor: 'pointer', fontFamily: 'var(--font-inter)' }}>
              {lagrer ? t('medisin.lagrer') : t('medisin.jegHarGittDosen')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}