'use client';
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { farger } from '../../lib/farger';

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

const dagensdato = () => new Date().toISOString().split('T')[0];

const STANDARD_MEDISINER = [
  { navn: 'D-vitamindråper', dosering: '5 dråper', frekvens: 'Daglig', tidspunkt: '10:00' },
  { navn: 'Infacol', dosering: '0.5 ml', frekvens: 'Ved behov', tidspunkt: '' },
  { navn: 'Paracet', dosering: 'Se pakningsvedlegg', frekvens: 'Ved feber', tidspunkt: '' },
];

const NORSKE_VAKSINER = [
  { navn: '6 uker – Rotavirus', alder: '6 uker' },
  { navn: '3 måneder – DTaP-IPV-Hib-HepB + PCV', alder: '3 mnd' },
  { navn: '5 måneder – DTaP-IPV-Hib-HepB + PCV + Rotavirus', alder: '5 mnd' },
  { navn: '12 måneder – DTaP-IPV-Hib-HepB + PCV + MMR', alder: '12 mnd' },
  { navn: '15 måneder – MMR 2', alder: '15 mnd' },
];

const FREKVENS_VALG = ['Daglig', 'To ganger daglig', 'Ukentlig', 'Ved behov', 'Engangsdose', 'Ved feber'];

export default function Medisin({ bruker }: Props) {
  const [medisiner, setMedisiner] = useState<Medisin[]>([]);
  const [logg, setLogg] = useState<MedisinLogg[]>([]);
  const [vaksiner, setVaksiner] = useState<Vaksine[]>([]);
  const [visLeggTil, setVisLeggTil] = useState(false);
  const [visAlleVaksiner, setVisAlleVaksiner] = useState(false);
  const [visGiDose, setVisGiDose] = useState<Medisin | null>(null);
  const [lagrer, setLagrer] = useState(false);
  const [visBekreftet, setVisBekreftet] = useState(false);

  const [nyttNavn, setNyttNavn] = useState('');
  const [nyDosering, setNyDosering] = useState('');
  const [nyFrekvens, setNyFrekvens] = useState('Daglig');
  const [nyttTidspunkt, setNyttTidspunkt] = useState('08:00');
  const [nyttNotat, setNyttNotat] = useState('');

  const [bivirkningNotat, setBivirkningNotat] = useState('');
  const [påvirkerSøvn, setPåvirkerSøvn] = useState(false);

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

  useEffect(() => {
    lastData();
  }, [lastData]);

  const beOmVarsel = async () => {
    if ('Notification' in window) {
      const t = await Notification.requestPermission();
      return t === 'granted';
    }
    return false;
  };

  const settOppVarsel = (m: Medisin) => {
    if (!('Notification' in window) || !m.tidspunkt) return;
    const [h, min] = m.tidspunkt.split(':').map(Number);
    const nå = new Date();
    const varselTid = new Date();
    varselTid.setHours(h, min, 0, 0);
    if (varselTid <= nå) varselTid.setDate(varselTid.getDate() + 1);
    setTimeout(() => {
      new Notification(`💊 Tid for ${m.navn}`, { body: m.dosering, icon: '/leep.png' });
    }, varselTid.getTime() - nå.getTime());
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
    setNyttTidspunkt('08:00'); setNyttNotat('');
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
    setBivirkningNotat(''); setPåvirkerSøvn(false);
    setVisGiDose(null);
    setVisBekreftet(true);
    setTimeout(() => setVisBekreftet(false), 2000);
    setLagrer(false);
    lastData();
  };

  const leggTilVaksine = async (navn: string) => {
    await supabase.from('vaksiner').insert({
      profil_id: bruker?.id,
      navn,
      tatt: false,
    });
    lastData();
  };

  const markerVaksineTatt = async (id: number, tatt: boolean) => {
    await supabase.from('vaksiner').update({ tatt: !tatt }).eq('id', id);
    lastData();
  };

  const erGittIDag = (medisinId: number) => logg.some(l => l.medisin_id === medisinId);
  const nestePåminnelse = medisiner.find(m => !erGittIDag(m.id) && m.frekvens !== 'Ved behov' && m.frekvens !== 'Ved feber' && m.tidspunkt);
  const standardSomMangler = STANDARD_MEDISINER.filter(s => !medisiner.some(m => m.navn === s.navn));

  return (
    <div style={{ backgroundColor: farger.bakgrunn, minHeight: '100vh', padding: '24px 24px 100px' }}>

      {/* Header */}
      <div style={{ marginBottom: '20px', textAlign: 'center' }}>
        <div style={{ fontSize: '26px', fontFamily: 'var(--font-plus-jakarta)', color: farger.tekst, fontWeight: '700', marginBottom: '4px' }}>
          Medisin & Vaksine
        </div>
        <div style={{ fontSize: '13px', fontFamily: 'var(--font-inter)', color: farger.tekstLys }}>
          Hold oversikt over medisiner og vaksiner
        </div>
      </div>

      {/* Bekreftet */}
      {visBekreftet && (
        <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', backgroundColor: farger.grønnLys, border: `1px solid ${farger.grønn}`, borderRadius: '20px', padding: '20px 32px', zIndex: 200, textAlign: 'center', boxShadow: '0 8px 32px rgba(0,0,0,0.12)' }}>
          <div style={{ fontSize: '32px', color: farger.grønn, marginBottom: '8px' }}>✓</div>
          <div style={{ fontSize: '14px', fontFamily: 'var(--font-inter)', color: farger.grønn, fontWeight: '600' }}>Dose registrert!</div>
        </div>
      )}

      {/* Neste påminnelse */}
      {nestePåminnelse && (
        <div style={{ backgroundColor: farger.grønnLys, border: `1px solid ${farger.grønn}`, borderRadius: '16px', padding: '16px 20px', marginBottom: '12px' }}>
          <div style={{ fontSize: '12px', fontFamily: 'var(--font-inter)', color: farger.grønn, fontWeight: '600', marginBottom: '10px' }}>🔔 Neste påminnelse</div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <rect x="8" y="4" width="8" height="14" rx="4" stroke={farger.grønn} strokeWidth="1.5" fill="none"/>
                  <line x1="12" y1="8" x2="12" y2="14" stroke={farger.grønn} strokeWidth="1.5" strokeLinecap="round"/>
                  <line x1="9" y1="11" x2="15" y2="11" stroke={farger.grønn} strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </div>
              <div>
                <div style={{ fontSize: '15px', fontFamily: 'var(--font-plus-jakarta)', color: farger.tekst, fontWeight: '600' }}>{nestePåminnelse.navn}</div>
                <div style={{ fontSize: '12px', fontFamily: 'var(--font-inter)', color: farger.tekstLys }}>{nestePåminnelse.tidspunkt} · {nestePåminnelse.frekvens}</div>
                {nestePåminnelse.dosering && <div style={{ fontSize: '11px', fontFamily: 'var(--font-inter)', color: farger.tekstLys }}>{nestePåminnelse.dosering}</div>}
              </div>
            </div>
            <button onClick={() => setVisGiDose(nestePåminnelse)} style={{ padding: '8px 16px', backgroundColor: farger.grønn, border: 'none', borderRadius: '20px', fontSize: '12px', fontFamily: 'var(--font-inter)', color: '#FDFAF6', fontWeight: '600', cursor: 'pointer' }}>
              Gi dose
            </button>
          </div>
        </div>
      )}

      {/* Medisinoversikt */}
      <div style={{ backgroundColor: farger.hvit, border: `1px solid ${farger.kremMørk}`, borderRadius: '16px', padding: '16px 20px', marginBottom: '12px' }}>
        <div style={{ fontSize: '15px', fontFamily: 'var(--font-plus-jakarta)', color: farger.tekst, fontWeight: '600', marginBottom: '12px' }}>Medisinoversikt</div>

        {medisiner.length === 0 && standardSomMangler.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '16px', color: farger.tekstLys, fontSize: '13px', fontFamily: 'var(--font-inter)' }}>
            Ingen medisiner lagt til ennå
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {medisiner.map(m => (
              <div key={m.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', backgroundColor: farger.bakgrunn, borderRadius: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: farger.grønnLys, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                      <rect x="8" y="4" width="8" height="14" rx="4" stroke={farger.grønn} strokeWidth="1.5" fill="none"/>
                      <line x1="12" y1="8" x2="12" y2="14" stroke={farger.grønn} strokeWidth="1.5" strokeLinecap="round"/>
                      <line x1="9" y1="11" x2="15" y2="11" stroke={farger.grønn} strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                  </div>
                  <div>
                    <div style={{ fontSize: '14px', fontFamily: 'var(--font-inter)', color: farger.tekst, fontWeight: '500' }}>{m.navn}</div>
                    <div style={{ fontSize: '11px', fontFamily: 'var(--font-inter)', color: farger.tekstLys }}>
                      {m.dosering && `${m.dosering} · `}{m.frekvens}{m.tidspunkt && ` · ${m.tidspunkt}`}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => !erGittIDag(m.id) && setVisGiDose(m)}
                  style={{ width: '32px', height: '32px', borderRadius: '50%', border: `1.5px solid ${erGittIDag(m.id) ? farger.grønn : farger.kremMørk}`, backgroundColor: erGittIDag(m.id) ? farger.grønn : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: erGittIDag(m.id) ? 'default' : 'pointer', flexShrink: 0 }}
                >
                  {erGittIDag(m.id) && (
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path d="M2 7L5.5 10.5L12 3.5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </button>
              </div>
            ))}

            {/* Forslag fra standard */}
            {standardSomMangler.length > 0 && (
              <>
                <div style={{ fontSize: '11px', fontFamily: 'var(--font-inter)', color: farger.tekstLys, textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: '4px', marginBottom: '4px' }}>Vanlige medisiner</div>
                {standardSomMangler.map((s, i) => (
                  <button key={i} onClick={() => leggTilMedisin(s)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', backgroundColor: farger.bakgrunn, border: `1px dashed ${farger.kremMørk}`, borderRadius: '12px', cursor: 'pointer', textAlign: 'left' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: farger.kremMørk, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                          <rect x="8" y="4" width="8" height="14" rx="4" stroke={farger.tekstLys} strokeWidth="1.5" fill="none"/>
                          <line x1="12" y1="8" x2="12" y2="14" stroke={farger.tekstLys} strokeWidth="1.5" strokeLinecap="round"/>
                          <line x1="9" y1="11" x2="15" y2="11" stroke={farger.tekstLys} strokeWidth="1.5" strokeLinecap="round"/>
                        </svg>
                      </div>
                      <div>
                        <div style={{ fontSize: '14px', fontFamily: 'var(--font-inter)', color: farger.tekstLys }}>{s.navn}</div>
                        <div style={{ fontSize: '11px', fontFamily: 'var(--font-inter)', color: farger.tekstLys }}>{s.dosering} · {s.frekvens}</div>
                      </div>
                    </div>
                    <div style={{ fontSize: '11px', fontFamily: 'var(--font-inter)', color: farger.grønn, fontWeight: '600' }}>+ Legg til</div>
                  </button>
                ))}
              </>
            )}
          </div>
        )}
      </div>

      {/* Vaksineoversikt */}
      <div style={{ backgroundColor: farger.hvit, border: `1px solid ${farger.kremMørk}`, borderRadius: '16px', padding: '16px 20px', marginBottom: '12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <div style={{ fontSize: '15px', fontFamily: 'var(--font-plus-jakarta)', color: farger.tekst, fontWeight: '600' }}>Vaksineoversikt</div>
          <button onClick={() => setVisAlleVaksiner(!visAlleVaksiner)} style={{ fontSize: '12px', fontFamily: 'var(--font-inter)', color: farger.grønn, fontWeight: '600', background: 'none', border: 'none', cursor: 'pointer' }}>
            {visAlleVaksiner ? 'Lukk' : 'Se alle'}
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {(visAlleVaksiner ? vaksiner : vaksiner.slice(0, 3)).map(v => (
            <div key={v.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', backgroundColor: farger.bakgrunn, borderRadius: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: v.tatt ? farger.grønnLys : farger.kremMørk, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <line x1="19" y1="5" x2="21" y2="3" stroke={v.tatt ? farger.grønn : farger.tekstLys} strokeWidth="1.5" strokeLinecap="round"/>
                    <path d="M6 18L15 9" stroke={v.tatt ? farger.grønn : farger.tekstLys} strokeWidth="1.5" strokeLinecap="round"/>
                    <path d="M9 7L17 15" stroke={v.tatt ? farger.grønn : farger.tekstLys} strokeWidth="1.5" strokeLinecap="round"/>
                    <line x1="4" y1="20" x2="6" y2="18" stroke={v.tatt ? farger.grønn : farger.tekstLys} strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                </div>
                <div>
                  <div style={{ fontSize: '13px', fontFamily: 'var(--font-inter)', color: farger.tekst, fontWeight: '500' }}>{v.navn}</div>
                  {v.dato && <div style={{ fontSize: '11px', fontFamily: 'var(--font-inter)', color: farger.tekstLys }}>{new Date(v.dato).toLocaleDateString('no-NO', { day: 'numeric', month: 'long', year: 'numeric' })}</div>}
                </div>
              </div>
              <button onClick={() => markerVaksineTatt(v.id, v.tatt)} style={{ width: '32px', height: '32px', borderRadius: '50%', border: `1.5px solid ${v.tatt ? farger.grønn : farger.kremMørk}`, backgroundColor: v.tatt ? farger.grønn : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
                {v.tatt && (
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M2 7L5.5 10.5L12 3.5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </button>
            </div>
          ))}

          {vaksiner.length === 0 && (
            <>
              <div style={{ fontSize: '11px', fontFamily: 'var(--font-inter)', color: farger.tekstLys, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px' }}>Norsk vaksinasjonsprogram</div>
              {NORSKE_VAKSINER.slice(0, 3).map((v, i) => (
                <button key={i} onClick={() => leggTilVaksine(v.navn)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', backgroundColor: farger.bakgrunn, border: `1px dashed ${farger.kremMørk}`, borderRadius: '10px', cursor: 'pointer', textAlign: 'left' }}>
                  <div>
                    <div style={{ fontSize: '12px', fontFamily: 'var(--font-inter)', color: farger.tekstLys }}>{v.navn}</div>
                    <div style={{ fontSize: '11px', fontFamily: 'var(--font-inter)', color: farger.tekstLys }}>{v.alder}</div>
                  </div>
                  <div style={{ fontSize: '11px', fontFamily: 'var(--font-inter)', color: farger.grønn, fontWeight: '600' }}>+ Legg til</div>
                </button>
              ))}
            </>
          )}
        </div>
      </div>

      {/* + Legg til medisin */}
      <button onClick={() => setVisLeggTil(true)} style={{ width: '100%', padding: '16px', backgroundColor: farger.grønnLys, border: `1px solid ${farger.grønn}`, borderRadius: '16px', fontSize: '15px', fontWeight: '600', color: farger.grønn, cursor: 'pointer', fontFamily: 'var(--font-inter)' }}>
        + Legg til medisin
      </button>

      {/* MODAL: Legg til medisin */}
      {visLeggTil && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', zIndex: 200, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }} onClick={() => setVisLeggTil(false)}>
          <div onClick={e => e.stopPropagation()} style={{ backgroundColor: farger.hvit, width: '100%', maxWidth: '430px', borderRadius: '24px 24px 0 0', padding: '24px', paddingBottom: '48px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ width: '36px', height: '4px', backgroundColor: farger.kremMørk, borderRadius: '2px', margin: '0 auto 20px' }} />
            <div style={{ fontSize: '18px', fontFamily: 'var(--font-plus-jakarta)', color: farger.tekst, fontWeight: '600', marginBottom: '20px' }}>Legg til medisin</div>

            {[
              { label: 'Navn på medisin', value: nyttNavn, setter: setNyttNavn, placeholder: 'F.eks. D-vitamindråper' },
              { label: 'Dosering', value: nyDosering, setter: setNyDosering, placeholder: 'F.eks. 5 dråper' },
            ].map(felt => (
              <div key={felt.label} style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '11px', letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: 'var(--font-inter)', color: farger.tekstLys, marginBottom: '8px' }}>{felt.label}</div>
                <input type="text" value={felt.value} onChange={e => felt.setter(e.target.value)} placeholder={felt.placeholder} style={{ width: '100%', padding: '12px 16px', fontSize: '14px', border: `1px solid ${farger.kremMørk}`, borderRadius: '12px', backgroundColor: farger.bakgrunn, color: farger.tekst, outline: 'none', fontFamily: 'var(--font-inter)', boxSizing: 'border-box' }} />
              </div>
            ))}

            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '11px', letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: 'var(--font-inter)', color: farger.tekstLys, marginBottom: '8px' }}>Frekvens</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {FREKVENS_VALG.map(f => (
                  <button key={f} onClick={() => setNyFrekvens(f)} style={{ padding: '8px 14px', backgroundColor: nyFrekvens === f ? farger.grønnLys : farger.bakgrunn, border: `1.5px solid ${nyFrekvens === f ? farger.grønn : farger.kremMørk}`, borderRadius: '20px', fontSize: '12px', fontFamily: 'var(--font-inter)', color: nyFrekvens === f ? farger.grønn : farger.tekst, cursor: 'pointer', fontWeight: nyFrekvens === f ? '600' : '400' }}>
                    {f}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '11px', letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: 'var(--font-inter)', color: farger.tekstLys, marginBottom: '8px' }}>Tidspunkt for påminnelse</div>
              <input type="time" value={nyttTidspunkt} onChange={e => setNyttTidspunkt(e.target.value)} style={{ width: '100%', padding: '12px 16px', fontSize: '14px', border: `1px solid ${farger.kremMørk}`, borderRadius: '12px', backgroundColor: farger.bakgrunn, color: farger.tekst, outline: 'none', fontFamily: 'var(--font-inter)', boxSizing: 'border-box' }} />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <div style={{ fontSize: '11px', letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: 'var(--font-inter)', color: farger.tekstLys, marginBottom: '8px' }}>Notat (valgfritt)</div>
              <textarea value={nyttNotat} onChange={e => setNyttNotat(e.target.value)} placeholder="F.eks. gi med mat..." style={{ width: '100%', padding: '12px 16px', fontSize: '14px', border: `1px solid ${farger.kremMørk}`, borderRadius: '12px', backgroundColor: farger.bakgrunn, color: farger.tekst, outline: 'none', fontFamily: 'var(--font-inter)', resize: 'none', minHeight: '70px', boxSizing: 'border-box' }} />
            </div>

            <button onClick={() => leggTilMedisin()} disabled={!nyttNavn || lagrer} style={{ width: '100%', padding: '16px', backgroundColor: nyttNavn ? farger.grønnLys : farger.kremMørk, border: `1px solid ${nyttNavn ? farger.grønn : 'transparent'}`, borderRadius: '16px', fontSize: '15px', fontWeight: '600', color: nyttNavn ? farger.grønn : farger.tekstLys, cursor: nyttNavn ? 'pointer' : 'not-allowed', fontFamily: 'var(--font-inter)' }}>
              {lagrer ? 'Lagrer...' : 'Lagre medisin 🔔'}
            </button>
          </div>
        </div>
      )}

      {/* MODAL: Gi dose */}
      {visGiDose && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', zIndex: 200, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }} onClick={() => setVisGiDose(null)}>
          <div onClick={e => e.stopPropagation()} style={{ backgroundColor: farger.hvit, width: '100%', maxWidth: '430px', borderRadius: '24px 24px 0 0', padding: '24px', paddingBottom: '48px' }}>
            <div style={{ width: '36px', height: '4px', backgroundColor: farger.kremMørk, borderRadius: '2px', margin: '0 auto 20px' }} />
            <div style={{ fontSize: '18px', fontFamily: 'var(--font-plus-jakarta)', color: farger.tekst, fontWeight: '600', marginBottom: '4px' }}>Gi dose</div>
            <div style={{ fontSize: '14px', fontFamily: 'var(--font-inter)', color: farger.tekstLys, marginBottom: '20px' }}>{visGiDose.navn} · {visGiDose.dosering}</div>

            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '11px', letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: 'var(--font-inter)', color: farger.tekstLys, marginBottom: '8px' }}>Bivirkninger / notat (valgfritt)</div>
              <textarea value={bivirkningNotat} onChange={e => setBivirkningNotat(e.target.value)} placeholder="F.eks. virket trøtt etterpå..." style={{ width: '100%', padding: '12px 16px', fontSize: '14px', border: `1px solid ${farger.kremMørk}`, borderRadius: '12px', backgroundColor: farger.bakgrunn, color: farger.tekst, outline: 'none', fontFamily: 'var(--font-inter)', resize: 'none', minHeight: '70px', boxSizing: 'border-box' }} />
            </div>

            <button onClick={() => setPåvirkerSøvn(!påvirkerSøvn)} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', backgroundColor: påvirkerSøvn ? farger.grønnLys : farger.bakgrunn, border: `1.5px solid ${påvirkerSøvn ? farger.grønn : farger.kremMørk}`, borderRadius: '12px', cursor: 'pointer', width: '100%', marginBottom: '20px', textAlign: 'left' }}>
              <div style={{ width: '20px', height: '20px', borderRadius: '50%', border: `1.5px solid ${påvirkerSøvn ? farger.grønn : farger.kremMørk}`, backgroundColor: påvirkerSøvn ? farger.grønn : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {påvirkerSøvn && <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M1.5 5L4 7.5L8.5 2.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
              </div>
              <div>
                <div style={{ fontSize: '13px', fontFamily: 'var(--font-inter)', color: farger.tekst, fontWeight: '500' }}>🌙 Kan påvirke søvn</div>
                <div style={{ fontSize: '11px', fontFamily: 'var(--font-inter)', color: farger.tekstLys }}>Appen vil ta hensyn til dette i søvnanalysen</div>
              </div>
            </button>

            <button onClick={giDose} disabled={lagrer} style={{ width: '100%', padding: '16px', backgroundColor: farger.grønnLys, border: `1px solid ${farger.grønn}`, borderRadius: '16px', fontSize: '15px', fontWeight: '600', color: farger.grønn, cursor: 'pointer', fontFamily: 'var(--font-inter)' }}>
              {lagrer ? 'Lagrer...' : 'Jeg har gitt dosen ✓'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}