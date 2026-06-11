'use client';
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { farger } from '../../lib/farger';

type Props = { bruker: any; };

type AmmingLogg = {
  id: number;
  bryst: string;
  start: string;
  slutt: string;
  varighet: number;
  dato: string;
};

const dagensdato = () => new Date().toISOString().split('T')[0];
const motattBryst = (bryst: string) => bryst === 'venstre' ? 'høyre' : 'venstre';

export default function Amming({ bruker }: Props) {
  const [aktiv, setAktiv] = useState(false);
  const [valgtBryst, setValgtBryst] = useState<'venstre' | 'høyre'>('høyre');
  const [startTid, setStartTid] = useState<Date | null>(null);
  const [startTidStr, setStartTidStr] = useState('');
  const [sluttTidStr, setSluttTidStr] = useState('');
  const [sekunder, setSekunder] = useState(0);
  const [logg, setLogg] = useState<AmmingLogg[]>([]);
  const [laster, setLaster] = useState(false);
  const [lasterLogg, setLasterLogg] = useState(true);
  const [visJusterStart, setVisJusterStart] = useState(false);
  const [visAvslutt, setVisAvslutt] = useState(false);
  const [visRedigerLogg, setVisRedigerLogg] = useState<AmmingLogg | null>(null);
  const [redigerStart, setRedigerStart] = useState('');
  const [redigerSlutt, setRedigerSlutt] = useState('');

  const lastLogg = useCallback(async () => {
    const { data } = await supabase
      .from('amming')
      .select('*')
      .eq('profil_id', bruker?.id)
      .eq('dato', dagensdato())
      .order('start', { ascending: false });
    if (data) {
      setLogg(data);
      if (data.length > 0 && !aktiv) {
        setValgtBryst(motattBryst(data[0].bryst) as 'venstre' | 'høyre');
      }
    }
    setLasterLogg(false);
  }, [bruker?.id, aktiv]);

  useEffect(() => {
    const lagretStart = localStorage.getItem('lille_amming_start');
    const lagretBryst = localStorage.getItem('lille_amming_bryst');

    const sjekkAktivAmming = async () => {
      if (lagretStart && lagretBryst) {
        const startTidStrVal = new Date(lagretStart).toLocaleTimeString('no-NO', { hour: '2-digit', minute: '2-digit' });
        const { data } = await supabase
          .from('amming')
          .select('*')
          .eq('profil_id', bruker?.id)
          .eq('start', startTidStrVal)
          .not('slutt', 'is', null)
          .limit(1);
        if (data && data.length > 0) {
          localStorage.removeItem('lille_amming_start');
          localStorage.removeItem('lille_amming_bryst');
        } else {
          const start = new Date(lagretStart);
          setStartTid(start);
          setStartTidStr(startTidStrVal);
          setValgtBryst(lagretBryst as 'venstre' | 'høyre');
          setSekunder(Math.floor((Date.now() - start.getTime()) / 1000));
          setAktiv(true);
        }
      }
      lastLogg();
    };
    sjekkAktivAmming();
  }, [lastLogg]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined;
    if (aktiv && startTid) {
      interval = setInterval(() => {
        setSekunder(Math.floor((Date.now() - startTid.getTime()) / 1000));
      }, 1000);
    }
    return () => { if (interval) clearInterval(interval); };
  }, [aktiv, startTid]);

  const startAmming = (bryst: 'venstre' | 'høyre') => {
    const nå = new Date();
    setValgtBryst(bryst);
    setStartTid(nå);
    setStartTidStr(nå.toLocaleTimeString('no-NO', { hour: '2-digit', minute: '2-digit' }));
    setSekunder(0);
    setAktiv(true);
    localStorage.setItem('lille_amming_start', nå.toISOString());
    localStorage.setItem('lille_amming_bryst', bryst);
  };

  const justerStartTid = (nyTid: string) => {
    const [h, m] = nyTid.split(':').map(Number);
    const nyStartTid = new Date();
    nyStartTid.setHours(h, m, 0, 0);
    setStartTid(nyStartTid);
    setStartTidStr(nyTid);
    setSekunder(Math.floor((Date.now() - nyStartTid.getTime()) / 1000));
    setVisJusterStart(false);
  };

  const åpneAvslutt = () => {
    const nå = new Date().toLocaleTimeString('no-NO', { hour: '2-digit', minute: '2-digit' });
    setSluttTidStr(nå);
    setVisAvslutt(true);
  };

  const avsluttAmming = async () => {
    if (!startTid) return;
    setLaster(true);
    const [sh, sm] = startTidStr.split(':').map(Number);
    const [eh, em] = sluttTidStr.split(':').map(Number);
    const varighet = Math.max(0, (eh * 60 + em) - (sh * 60 + sm));
    await supabase.from('amming').insert({
      profil_id: bruker?.id,
      dato: dagensdato(),
      bryst: valgtBryst,
      start: startTidStr,
      slutt: sluttTidStr,
      varighet,
    });
    localStorage.removeItem('lille_amming_start');
    localStorage.removeItem('lille_amming_bryst');
    setLaster(false);
    setAktiv(false);
    setStartTid(null);
    setSekunder(0);
    setVisAvslutt(false);
    lastLogg();
  };

  const lagreRedigertLogg = async () => {
    if (!visRedigerLogg) return;
    const [sh, sm] = redigerStart.split(':').map(Number);
    const [eh, em] = redigerSlutt.split(':').map(Number);
    const varighet = Math.max(0, (eh * 60 + em) - (sh * 60 + sm));
    await supabase.from('amming').update({ start: redigerStart, slutt: redigerSlutt, varighet }).eq('id', visRedigerLogg.id);
    setVisRedigerLogg(null);
    lastLogg();
  };

  const slettLogg = async (id: number) => {
    await supabase.from('amming').delete().eq('id', id);
    setVisRedigerLogg(null);
    lastLogg();
  };

  const formaterTid = (sek: number) => {
    const m = Math.floor(sek / 60);
    const s = sek % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const totalMinutter = logg.reduce((sum, l) => sum + (l.varighet || 0), 0);
  const sisteAmming = logg[0];
  const anbefalingBryst = logg.length > 0 ? motattBryst(logg[0].bryst) as 'venstre' | 'høyre' : 'høyre';
  const circumference = 2 * Math.PI * 95;
  const progress = Math.min((sekunder % 60) / 60, 1);

  if (lasterLogg) return (
    <div style={{ backgroundColor: farger.bakgrunn, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <div style={{ width: '24px', height: '24px', border: `2px solid ${farger.grønn}`, borderTop: '2px solid transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
    </div>
  );

  return (
    <div style={{ backgroundColor: '#F8F3EE', minHeight: '100vh', position: 'relative', overflow: 'hidden' }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes puls { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.02); } }
        @keyframes fadeOpp { 0%{opacity:0;transform:translateY(8px)} 100%{opacity:1;transform:translateY(0)} }
      `}</style>

      {/* Bølger */}
      <svg viewBox="0 0 430 200" style={{ position: 'absolute', top: '60px', left: 0, width: '100%', height: '200px', zIndex: 0 }} preserveAspectRatio="none">
        <path d="M0 100 C60 60 120 130 180 90 C240 50 300 120 360 80 C400 55 430 70 430 70 L430 200 L0 200 Z" fill={farger.terrakotta} opacity="0.08"/>
        <path d="M0 120 C80 85 160 145 240 110 C300 82 370 130 430 105 L430 200 L0 200 Z" fill={farger.terrakotta} opacity="0.06"/>
      </svg>

      <div style={{ position: 'relative', zIndex: 1, padding: '16px 24px 120px' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '8px' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '22px', fontFamily: 'var(--font-plus-jakarta)', color: farger.tekst, fontWeight: '700' }}>Amming</div>
            <div style={{ fontSize: '12px', fontFamily: 'var(--font-inter)', color: farger.tekstLys }}>
              {aktiv ? `${valgtBryst === 'venstre' ? '← Venstre' : 'Høyre →'} bryst` : `Anbefalt: ${anbefalingBryst === 'venstre' ? '← venstre' : 'høyre →'} bryst`}
            </div>
          </div>
        </div>

        {/* Stor sirkel-timer */}
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '20px', minHeight: '260px' }}>
          <div style={{ position: 'relative', width: '220px', height: '220px' }}>
            <svg width="220" height="220" viewBox="0 0 220 220">
              <defs>
                <linearGradient id="ammingGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor={farger.terrakotta}/>
                  <stop offset="50%" stopColor="#EBC8B4"/>
                  <stop offset="100%" stopColor={farger.terrakotta}/>
                </linearGradient>
              </defs>
              <circle cx="110" cy="110" r="95" fill="#FFF8EC"/>
              <circle cx="110" cy="110" r="95" fill="none" stroke="#F4D9A0" strokeWidth="12"/>
              {aktiv && (
                <circle cx="110" cy="110" r="95" fill="none" stroke="url(#ammingGrad)" strokeWidth="12" strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={circumference - progress * circumference}
                  transform="rotate(-90 110 110)" style={{ transition: 'stroke-dashoffset 1s linear' }}/>
              )}
            </svg>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              {aktiv ? (
                <>
                  <div style={{ fontSize: '13px', fontFamily: 'var(--font-inter)', color: farger.tekstLys, marginBottom: '4px' }}>Ammer nå</div>
                  <div style={{ fontSize: '40px', fontFamily: 'var(--font-plus-jakarta)', color: farger.tekst, fontWeight: '700', lineHeight: 1.1 }}>
                    {formaterTid(sekunder)}
                  </div>
                  <button onClick={() => setVisJusterStart(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', marginTop: '6px' }}>
                    <div style={{ fontSize: '11px', fontFamily: 'var(--font-inter)', color: farger.tekstLys, textDecoration: 'underline' }}>
                      Siden {startTidStr}
                    </div>
                  </button>
                </>
              ) : (
                <>
                  <img src="/tateflaske.png" style={{ width: '52px', height: '52px', objectFit: 'contain', marginBottom: '8px', mixBlendMode: 'multiply' }} />
                  <div style={{ fontSize: '13px', fontFamily: 'var(--font-inter)', color: farger.tekstLys }}>Trykk for å starte</div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Knapper */}
        {aktiv ? (
          <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
            <button onClick={() => {
              setValgtBryst(prev => motattBryst(prev) as 'venstre' | 'høyre');
              localStorage.setItem('lille_amming_bryst', motattBryst(valgtBryst));
            }} style={{ flex: 1, padding: '14px', backgroundColor: farger.hvit, border: `1px solid ${farger.kremMørk}`, borderRadius: '28px', fontSize: '13px', fontFamily: 'var(--font-inter)', color: farger.tekst, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M7 16L3 12L7 8M17 8L21 12L17 16M3 12H21" stroke={farger.tekst} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Bytt bryst
            </button>
            <button onClick={åpneAvslutt} style={{ flex: 2, padding: '14px', backgroundColor: farger.terrakotta, border: 'none', borderRadius: '28px', fontSize: '14px', fontWeight: '600', fontFamily: 'var(--font-inter)', color: '#FDFAF6', cursor: 'pointer' }}>
              Avslutt amming
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
            <button onClick={() => startAmming(motattBryst(anbefalingBryst) as 'venstre' | 'høyre')} style={{ flex: 1, padding: '14px', backgroundColor: farger.hvit, border: `1px solid ${farger.kremMørk}`, borderRadius: '28px', fontSize: '13px', fontFamily: 'var(--font-inter)', color: farger.tekstLys, cursor: 'pointer' }}>
              {motattBryst(anbefalingBryst) === 'venstre' ? '← Venstre' : 'Høyre →'}
            </button>
            <button onClick={() => startAmming(anbefalingBryst)} style={{ flex: 2, padding: '14px', backgroundColor: farger.terrakotta, border: 'none', borderRadius: '28px', fontSize: '14px', fontWeight: '600', fontFamily: 'var(--font-inter)', color: '#FDFAF6', cursor: 'pointer' }}>
              🤍 Start {anbefalingBryst === 'venstre' ? 'venstre' : 'høyre'} bryst
            </button>
          </div>
        )}

        {/* Siste amming */}
        {sisteAmming && (
          <div style={{ backgroundColor: farger.hvit, border: `1px solid ${farger.kremMørk}`, borderRadius: '16px', padding: '14px 18px', marginBottom: '12px', animation: 'fadeOpp 0.5s ease' }}>
            <div style={{ fontSize: '11px', fontFamily: 'var(--font-inter)', color: farger.tekstLys, marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Siste amming</div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: '16px', fontFamily: 'var(--font-plus-jakarta)', color: farger.tekst, fontWeight: '700' }}>{sisteAmming.varighet} min</div>
                <div style={{ fontSize: '12px', fontFamily: 'var(--font-inter)', color: farger.tekstLys }}>
                  {sisteAmming.bryst === 'venstre' ? '← Venstre' : 'Høyre →'} · {sisteAmming.start}–{sisteAmming.slutt}
                </div>
              </div>
              <div style={{ fontSize: '12px', fontFamily: 'var(--font-inter)', color: farger.grønn, textAlign: 'right' }}>
                Neste:<br/>{anbefalingBryst === 'venstre' ? '← venstre' : 'høyre →'} 🤍
              </div>
            </div>
          </div>
        )}

        {/* Innsikt */}
        {logg.length > 0 && (
          <div style={{ backgroundColor: farger.terrakottaLys, borderRadius: '16px', padding: '14px 18px', marginBottom: '12px' }}>
            <div style={{ fontSize: '13px', fontFamily: 'var(--font-plus-jakarta)', color: farger.terrakotta, fontWeight: '600', marginBottom: '4px' }}>✨ I dag</div>
            <div style={{ fontSize: '13px', fontFamily: 'var(--font-inter)', color: farger.tekst, lineHeight: 1.6 }}>
              {logg.length} {logg.length === 1 ? 'amming' : 'amminger'} · {totalMinutter} minutter totalt
            </div>
          </div>
        )}

        {/* Logg */}
        {logg.length > 0 && (
          <div style={{ backgroundColor: farger.hvit, border: `1px solid ${farger.kremMørk}`, borderRadius: '16px', padding: '16px 18px' }}>
            <div style={{ fontSize: '15px', fontFamily: 'var(--font-plus-jakarta)', color: farger.tekst, fontWeight: '600', marginBottom: '12px' }}>Ammelogg i dag</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {logg.map((l, i) => (
                <button key={i} onClick={() => { setVisRedigerLogg(l); setRedigerStart(l.start.slice(0,5)); setRedigerSlutt(l.slutt.slice(0,5)); }}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', backgroundColor: farger.bakgrunn, borderRadius: '12px', border: 'none', cursor: 'pointer', textAlign: 'left', width: '100%' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: l.bryst === 'venstre' ? farger.grønn : farger.terrakotta, flexShrink: 0 }} />
                    <div>
                      <div style={{ fontSize: '13px', fontFamily: 'var(--font-inter)', color: farger.tekst, fontWeight: '500' }}>
                        {l.bryst === 'venstre' ? '← Venstre bryst' : 'Høyre bryst →'}
                      </div>
                      <div style={{ fontSize: '11px', fontFamily: 'var(--font-inter)', color: farger.tekstLys }}>{l.start}–{l.slutt}</div>
                    </div>
                  </div>
                  <div style={{ fontSize: '14px', fontFamily: 'var(--font-plus-jakarta)', color: farger.grønn, fontWeight: '600' }}>{l.varighet} min</div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Modal: Juster starttid */}
      {visJusterStart && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', zIndex: 200, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }} onClick={() => setVisJusterStart(false)}>
          <div onClick={e => e.stopPropagation()} style={{ backgroundColor: farger.hvit, width: '100%', maxWidth: '430px', borderRadius: '24px 24px 0 0', padding: '24px', paddingBottom: '48px' }}>
            <div style={{ width: '36px', height: '4px', backgroundColor: farger.kremMørk, borderRadius: '2px', margin: '0 auto 20px' }} />
            <div style={{ fontSize: '18px', fontFamily: 'var(--font-plus-jakarta)', color: farger.tekst, fontWeight: '600', marginBottom: '20px' }}>Når startet ammingen?</div>
            <input type="time" defaultValue={startTidStr} onChange={e => setStartTidStr(e.target.value)}
              style={{ width: '100%', padding: '14px 16px', fontSize: '22px', border: `1px solid ${farger.kremMørk}`, borderRadius: '12px', backgroundColor: farger.bakgrunn, color: farger.tekst, outline: 'none', fontFamily: 'var(--font-inter)', boxSizing: 'border-box', marginBottom: '20px', textAlign: 'center' }} />
            <button onClick={() => justerStartTid(startTidStr)} style={{ width: '100%', padding: '16px', backgroundColor: farger.grønnLys, border: `1px solid ${farger.grønn}`, borderRadius: '16px', fontSize: '15px', fontWeight: '600', color: farger.grønn, cursor: 'pointer', fontFamily: 'var(--font-inter)' }}>
              Lagre
            </button>
          </div>
        </div>
      )}

      {/* Modal: Avslutt */}
      {visAvslutt && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', zIndex: 200, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }} onClick={() => setVisAvslutt(false)}>
          <div onClick={e => e.stopPropagation()} style={{ backgroundColor: farger.hvit, width: '100%', maxWidth: '430px', borderRadius: '24px 24px 0 0', padding: '24px', paddingBottom: '48px' }}>
            <div style={{ width: '36px', height: '4px', backgroundColor: farger.kremMørk, borderRadius: '2px', margin: '0 auto 20px' }} />
            <div style={{ fontSize: '18px', fontFamily: 'var(--font-plus-jakarta)', color: farger.tekst, fontWeight: '600', marginBottom: '20px' }}>Avslutt amming</div>
            <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'var(--font-inter)', color: farger.tekstLys, marginBottom: '8px' }}>Startet</div>
                <input type="time" value={startTidStr} onChange={e => setStartTidStr(e.target.value)}
                  style={{ width: '100%', padding: '12px', fontSize: '16px', border: `1px solid ${farger.kremMørk}`, borderRadius: '12px', backgroundColor: farger.bakgrunn, color: farger.tekst, outline: 'none', fontFamily: 'var(--font-inter)', boxSizing: 'border-box', textAlign: 'center' }} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'var(--font-inter)', color: farger.tekstLys, marginBottom: '8px' }}>Sluttet</div>
                <input type="time" value={sluttTidStr} onChange={e => setSluttTidStr(e.target.value)}
                  style={{ width: '100%', padding: '12px', fontSize: '16px', border: `1px solid ${farger.kremMørk}`, borderRadius: '12px', backgroundColor: farger.bakgrunn, color: farger.tekst, outline: 'none', fontFamily: 'var(--font-inter)', boxSizing: 'border-box', textAlign: 'center' }} />
              </div>
            </div>
            <button onClick={avsluttAmming} disabled={laster} style={{ width: '100%', padding: '16px', backgroundColor: farger.terrakotta, border: 'none', borderRadius: '16px', fontSize: '15px', fontWeight: '600', color: '#FDFAF6', cursor: 'pointer', fontFamily: 'var(--font-inter)' }}>
              {laster ? 'Lagrer...' : 'Lagre amming'}
            </button>
          </div>
        </div>
      )}

      {/* Modal: Rediger logg */}
      {visRedigerLogg && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', zIndex: 200, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }} onClick={() => setVisRedigerLogg(null)}>
          <div onClick={e => e.stopPropagation()} style={{ backgroundColor: farger.hvit, width: '100%', maxWidth: '430px', borderRadius: '24px 24px 0 0', padding: '24px', paddingBottom: '48px' }}>
            <div style={{ width: '36px', height: '4px', backgroundColor: farger.kremMørk, borderRadius: '2px', margin: '0 auto 20px' }} />
            <div style={{ fontSize: '18px', fontFamily: 'var(--font-plus-jakarta)', color: farger.tekst, fontWeight: '600', marginBottom: '4px' }}>Rediger amming</div>
            <div style={{ fontSize: '13px', fontFamily: 'var(--font-inter)', color: farger.tekstLys, marginBottom: '20px' }}>
              {visRedigerLogg.bryst === 'venstre' ? '← Venstre bryst' : 'Høyre bryst →'}
            </div>
            <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'var(--font-inter)', color: farger.tekstLys, marginBottom: '8px' }}>Startet</div>
                <input type="time" value={redigerStart} onChange={e => setRedigerStart(e.target.value)}
                  style={{ width: '100%', padding: '12px', fontSize: '16px', border: `1px solid ${farger.kremMørk}`, borderRadius: '12px', backgroundColor: farger.bakgrunn, color: farger.tekst, outline: 'none', fontFamily: 'var(--font-inter)', boxSizing: 'border-box', textAlign: 'center' }} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'var(--font-inter)', color: farger.tekstLys, marginBottom: '8px' }}>Sluttet</div>
                <input type="time" value={redigerSlutt} onChange={e => setRedigerSlutt(e.target.value)}
                  style={{ width: '100%', padding: '12px', fontSize: '16px', border: `1px solid ${farger.kremMørk}`, borderRadius: '12px', backgroundColor: farger.bakgrunn, color: farger.tekst, outline: 'none', fontFamily: 'var(--font-inter)', boxSizing: 'border-box', textAlign: 'center' }} />
              </div>
            </div>
            <button onClick={lagreRedigertLogg} style={{ width: '100%', padding: '16px', backgroundColor: farger.grønnLys, border: `1px solid ${farger.grønn}`, borderRadius: '16px', fontSize: '15px', fontWeight: '600', color: farger.grønn, cursor: 'pointer', fontFamily: 'var(--font-inter)', marginBottom: '10px' }}>
              Lagre endringer
            </button>
            <button onClick={() => slettLogg(visRedigerLogg.id)} style={{ width: '100%', padding: '14px', backgroundColor: 'transparent', border: '1px solid #FFB3B3', borderRadius: '16px', fontSize: '14px', color: '#C0392B', cursor: 'pointer', fontFamily: 'var(--font-inter)' }}>
              Slett amming
            </button>
          </div>
        </div>
      )}
    </div>
  );
}