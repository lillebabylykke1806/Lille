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
  const [byttAnimasjon, setByttAnimasjon] = useState(false);
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
    if (data) setLogg(data);
    setLasterLogg(false);
  }, [bruker?.id]);

  useEffect(() => { lastLogg(); }, [lastLogg]);

  useEffect(() => {
    if (logg.length > 0) {
      setValgtBryst(motattBryst(logg[0].bryst) as 'venstre' | 'høyre');
    }
  }, [logg]);

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
    await supabase.from('amming').update({
      start: redigerStart,
      slutt: redigerSlutt,
      varighet,
    }).eq('id', visRedigerLogg.id);
    setVisRedigerLogg(null);
    lastLogg();
  };

  const slettLogg = async (id: number) => {
    await supabase.from('amming').delete().eq('id', id);
    setVisRedigerLogg(null);
    lastLogg();
  };

  const byttBryst = () => {
    setByttAnimasjon(true);
    setTimeout(() => setByttAnimasjon(false), 400);
    setValgtBryst(prev => motattBryst(prev) as 'venstre' | 'høyre');
  };

  const formaterTid = (sek: number) => {
    const m = Math.floor(sek / 60);
    const s = sek % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const totalMinutter = logg.reduce((sum, l) => sum + (l.varighet || 0), 0);
  const sisteAmming = logg[0];
  const anbefalingBryst = logg.length > 0 ? motattBryst(logg[0].bryst) as 'venstre' | 'høyre' : 'høyre';

  if (lasterLogg) return null;

  return (
    <div style={{ backgroundColor: farger.bakgrunn, minHeight: '100vh', padding: '24px 24px 100px' }}>
      <style>{`
        @keyframes puls { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.03); } }
        @keyframes bytt { 0% { transform: scale(0.95); opacity: 0.7; } 100% { transform: scale(1); opacity: 1; } }
      `}</style>

      {/* Header */}
      <div style={{ marginBottom: '20px', textAlign: 'center' }}>
        <div style={{ fontSize: '26px', fontFamily: 'var(--font-plus-jakarta)', color: farger.tekst, fontWeight: '700', marginBottom: '4px' }}>Amming</div>
        <div style={{ fontSize: '13px', fontFamily: 'var(--font-inter)', color: farger.tekstLys }}>Registrer og følg ammingen</div>
      </div>

      {/* Siste amming */}
      {sisteAmming && (
        <div style={{ backgroundColor: farger.hvit, border: `1px solid ${farger.kremMørk}`, borderRadius: '16px', padding: '16px 20px', marginBottom: '12px' }}>
          <div style={{ fontSize: '12px', fontFamily: 'var(--font-inter)', color: farger.tekstLys, marginBottom: '6px' }}>Siste amming</div>
          <div style={{ fontSize: '20px', fontFamily: 'var(--font-plus-jakarta)', color: farger.tekst, fontWeight: '700', marginBottom: '4px' }}>{sisteAmming.varighet} min</div>
          <div style={{ fontSize: '13px', fontFamily: 'var(--font-inter)', color: farger.tekstLys, marginBottom: '6px' }}>
            {sisteAmming.bryst === 'venstre' ? '← Venstre bryst' : 'Høyre bryst →'} · {sisteAmming.start}–{sisteAmming.slutt}
          </div>
          <div style={{ fontSize: '12px', fontFamily: 'var(--font-inter)', color: farger.grønn }}>
            Neste: {anbefalingBryst === 'venstre' ? '← venstre bryst' : 'høyre bryst →'} 🤍
          </div>
        </div>
      )}

      {/* Innsikt */}
      {logg.length > 0 && (
        <div style={{ backgroundColor: '#F5EDE8', borderRadius: '16px', padding: '16px 20px', marginBottom: '12px' }}>
          <div style={{ fontSize: '13px', fontFamily: 'var(--font-plus-jakarta)', color: farger.tekst, fontWeight: '600', marginBottom: '4px' }}>✨ Innsikt</div>
          <div style={{ fontSize: '13px', fontFamily: 'var(--font-inter)', color: farger.tekstLys, lineHeight: 1.6 }}>
            {logg.length >= 5
              ? `Flott jobb! Du har ammet ${logg.length} ganger i dag – totalt ${totalMinutter} minutter. 🤍`
              : `${logg.length} ${logg.length === 1 ? 'amming' : 'amminger'} i dag · ${totalMinutter} minutter totalt.`}
          </div>
        </div>
      )}

      {/* Start amming / aktiv timer */}
      <div style={{ backgroundColor: farger.hvit, border: `1px solid ${farger.kremMørk}`, borderRadius: '20px', padding: '20px', marginBottom: '12px' }}>
        {aktiv ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '12px', fontFamily: 'var(--font-inter)', color: farger.tekstLys, marginBottom: '4px' }}>Ammer på</div>
            <div style={{ fontSize: '20px', fontFamily: 'var(--font-plus-jakarta)', color: farger.tekst, fontWeight: '700', marginBottom: '4px', animation: byttAnimasjon ? 'bytt 0.4s ease' : 'none' }}>
              {valgtBryst === 'venstre' ? '← Venstre bryst' : 'Høyre bryst →'}
            </div>

            {/* Starttid – klikk for å justere */}
            <button onClick={() => setVisJusterStart(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', marginBottom: '20px' }}>
              <div style={{ fontSize: '12px', fontFamily: 'var(--font-inter)', color: farger.tekstLys }}>Startet {startTidStr}</div>
              <div style={{ fontSize: '10px', fontFamily: 'var(--font-inter)', color: farger.grønn, textDecoration: 'underline' }}>Trykk for å justere</div>
            </button>

            {/* Timer */}
            <div style={{ position: 'relative', width: '160px', height: '160px', margin: '0 auto 20px' }}>
              <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: `3px solid ${farger.grønn}`, animation: 'puls 2s ease-in-out infinite' }} />
              <div style={{ position: 'absolute', inset: '8px', borderRadius: '50%', backgroundColor: farger.grønnLys, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ fontSize: '34px', fontFamily: 'var(--font-plus-jakarta)', color: farger.grønn, fontWeight: '700', letterSpacing: '-1px' }}>
                  {formaterTid(sekunder)}
                </div>
              </div>
            </div>

            {/* Bytt bryst */}
            <button onClick={byttBryst} style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '0 auto 14px', padding: '10px 20px', backgroundColor: 'transparent', border: `1.5px solid ${farger.kremMørk}`, borderRadius: '24px', fontSize: '13px', fontFamily: 'var(--font-inter)', color: farger.tekst, cursor: 'pointer' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M7 16L3 12L7 8M17 8L21 12L17 16M3 12H21" stroke={farger.tekst} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Bytt til {valgtBryst === 'venstre' ? 'høyre' : 'venstre'} bryst
            </button>

            <button onClick={åpneAvslutt} disabled={laster} style={{ width: '100%', padding: '14px', backgroundColor: farger.grønnLys, border: `1px solid ${farger.grønn}`, borderRadius: '14px', fontSize: '14px', fontWeight: '600', color: farger.grønn, cursor: 'pointer', fontFamily: 'var(--font-inter)' }}>
              Avslutt amming
            </button>
          </div>
        ) : (
          <>
            {logg.length > 0 ? (
              <>
                <div style={{ fontSize: '13px', fontFamily: 'var(--font-inter)', color: farger.tekstLys, marginBottom: '12px', textAlign: 'center' }}>Anbefalt neste bryst</div>
                <button onClick={() => startAmming(anbefalingBryst)} style={{ width: '100%', padding: '16px', backgroundColor: farger.grønnLys, border: `1px solid ${farger.grønn}`, borderRadius: '16px', fontSize: '15px', fontWeight: '600', color: farger.grønn, cursor: 'pointer', fontFamily: 'var(--font-inter)', marginBottom: '10px' }}>
                  🤍 Start med {anbefalingBryst === 'venstre' ? 'venstre' : 'høyre'} bryst
                </button>
                <button onClick={() => startAmming(motattBryst(anbefalingBryst) as 'venstre' | 'høyre')} style={{ width: '100%', padding: '12px', backgroundColor: 'transparent', border: `1px solid ${farger.kremMørk}`, borderRadius: '16px', fontSize: '13px', color: farger.tekstLys, cursor: 'pointer', fontFamily: 'var(--font-inter)' }}>
                  Eller start med {motattBryst(anbefalingBryst)} bryst
                </button>
              </>
            ) : (
              <>
                <div style={{ fontSize: '13px', fontFamily: 'var(--font-inter)', color: farger.tekstLys, marginBottom: '12px', textAlign: 'center' }}>
                  Anbefalt neste bryst
                </div>
                <button onClick={() => startAmming('høyre')} style={{ width: '100%', padding: '16px', backgroundColor: farger.grønnLys, border: `1px solid ${farger.grønn}`, borderRadius: '16px', fontSize: '15px', fontWeight: '600', color: farger.grønn, cursor: 'pointer', fontFamily: 'var(--font-inter)', marginBottom: '10px' }}>
                  🤍 Start med høyre bryst
                </button>
                <button onClick={() => startAmming('venstre')} style={{ width: '100%', padding: '12px', backgroundColor: 'transparent', border: `1px solid ${farger.kremMørk}`, borderRadius: '16px', fontSize: '13px', color: farger.tekstLys, cursor: 'pointer', fontFamily: 'var(--font-inter)' }}>
                  Eller start med venstre bryst
                </button>
              </>
            )}
          </>
        )}
      </div>

      {/* Ammelogg */}
      {logg.length > 0 && (
        <div style={{ backgroundColor: farger.hvit, border: `1px solid ${farger.kremMørk}`, borderRadius: '16px', padding: '16px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <div style={{ fontSize: '15px', fontFamily: 'var(--font-plus-jakarta)', color: farger.tekst, fontWeight: '600' }}>Ammelogg i dag</div>
            <div style={{ fontSize: '12px', fontFamily: 'var(--font-inter)', color: farger.tekstLys }}>{logg.length} {logg.length === 1 ? 'økt' : 'økter'}</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {logg.map((l, i) => (
              <button key={i} onClick={() => { setVisRedigerLogg(l); setRedigerStart(l.start); setRedigerSlutt(l.slutt); }}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', backgroundColor: farger.bakgrunn, borderRadius: '12px', border: 'none', cursor: 'pointer', textAlign: 'left', width: '100%' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: l.bryst === 'venstre' ? '#A8C4A2' : '#F4A853', flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: '13px', fontFamily: 'var(--font-inter)', color: farger.tekst, fontWeight: '500' }}>
                      {l.bryst === 'venstre' ? 'Venstre bryst' : 'Høyre bryst'}
                    </div>
                    <div style={{ fontSize: '11px', fontFamily: 'var(--font-inter)', color: farger.tekstLys }}>
                      {l.start}–{l.slutt}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ fontSize: '14px', fontFamily: 'var(--font-plus-jakarta)', color: farger.grønn, fontWeight: '600' }}>{l.varighet} min</div>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <path d="M11 4H4C3.46957 4 2.96086 4.21071 2.58579 4.58579C2.21071 4.96086 2 5.46957 2 6V20C2 20.5304 2.21071 21.0391 2.58579 21.4142C2.96086 21.7893 3.46957 22 4 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V13" stroke={farger.tekstLys} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M18.5 2.50001C18.8978 2.10219 19.4374 1.87869 20 1.87869C20.5626 1.87869 21.1022 2.10219 21.5 2.50001C21.8978 2.89784 22.1213 3.43741 22.1213 4.00001C22.1213 4.56262 21.8978 5.10219 21.5 5.50001L12 15L8 16L9 12L18.5 2.50001Z" stroke={farger.tekstLys} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

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

      {/* Modal: Avslutt med juster slutttid */}
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
            <button onClick={avsluttAmming} disabled={laster} style={{ width: '100%', padding: '16px', backgroundColor: farger.grønnLys, border: `1px solid ${farger.grønn}`, borderRadius: '16px', fontSize: '15px', fontWeight: '600', color: farger.grønn, cursor: 'pointer', fontFamily: 'var(--font-inter)' }}>
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
            <button onClick={() => slettLogg(visRedigerLogg.id)} style={{ width: '100%', padding: '14px', backgroundColor: 'transparent', border: `1px solid #FFB3B3`, borderRadius: '16px', fontSize: '14px', color: '#C0392B', cursor: 'pointer', fontFamily: 'var(--font-inter)' }}>
              Slett amming
            </button>
          </div>
        </div>
      )}
    </div>
  );
}