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
  const [sekunder, setSekunder] = useState(0);
  const [logg, setLogg] = useState<AmmingLogg[]>([]);
  const [laster, setLaster] = useState(false);
  const [byttAnimasjon, setByttAnimasjon] = useState(false);

  const lastLogg = useCallback(async () => {
    const { data } = await supabase
      .from('amming')
      .select('*')
      .eq('profil_id', bruker?.id)
      .eq('dato', dagensdato())
      .order('start', { ascending: false });
    if (data) setLogg(data);
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
    setValgtBryst(bryst);
    setStartTid(new Date());
    setSekunder(0);
    setAktiv(true);
  };

  const avsluttAmming = async () => {
    if (!startTid) return;
    setLaster(true);
    const slutt = new Date();
    const varighet = Math.floor((slutt.getTime() - startTid.getTime()) / 1000 / 60);
    await supabase.from('amming').insert({
      profil_id: bruker?.id,
      dato: dagensdato(),
      bryst: valgtBryst,
      start: startTid.toLocaleTimeString('no-NO', { hour: '2-digit', minute: '2-digit' }),
      slutt: slutt.toLocaleTimeString('no-NO', { hour: '2-digit', minute: '2-digit' }),
      varighet,
    });
    setLaster(false);
    setAktiv(false);
    setStartTid(null);
    setSekunder(0);
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

  return (
    <div style={{ backgroundColor: farger.bakgrunn, minHeight: '100vh', padding: '24px 24px 100px' }}>
      <style>{`
        @keyframes puls { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.03); } }
        @keyframes bytt { 0% { transform: scale(0.95); opacity: 0.7; } 100% { transform: scale(1); opacity: 1; } }
      `}</style>

      {/* Header */}
      <div style={{ marginBottom: '20px', textAlign: 'center' }}>
        <div style={{ fontSize: '26px', fontFamily: 'var(--font-plus-jakarta)', color: farger.tekst, fontWeight: '700', marginBottom: '4px' }}>
          Amming
        </div>
        <div style={{ fontSize: '13px', fontFamily: 'var(--font-inter)', color: farger.tekstLys }}>
          Registrer og følg ammingen
        </div>
      </div>

      {/* Siste amming */}
      {sisteAmming && (
        <div style={{ backgroundColor: farger.hvit, border: `1px solid ${farger.kremMørk}`, borderRadius: '16px', padding: '16px 20px', marginBottom: '12px' }}>
          <div style={{ fontSize: '12px', fontFamily: 'var(--font-inter)', color: farger.tekstLys, marginBottom: '6px' }}>Siste amming</div>
          <div style={{ fontSize: '20px', fontFamily: 'var(--font-plus-jakarta)', color: farger.tekst, fontWeight: '700', marginBottom: '4px' }}>
            {sisteAmming.varighet} min
          </div>
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
          /* AKTIV TIMER INNE PÅ SAMME SIDE */
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '12px', fontFamily: 'var(--font-inter)', color: farger.tekstLys, marginBottom: '4px' }}>
              Ammer på
            </div>
            <div style={{ fontSize: '20px', fontFamily: 'var(--font-plus-jakarta)', color: farger.tekst, fontWeight: '700', marginBottom: '4px', animation: byttAnimasjon ? 'bytt 0.4s ease' : 'none' }}>
              {valgtBryst === 'venstre' ? '← Venstre bryst' : 'Høyre bryst →'}
            </div>
            <div style={{ fontSize: '12px', fontFamily: 'var(--font-inter)', color: farger.tekstLys, marginBottom: '20px' }}>
              Startet {startTid?.toLocaleTimeString('no-NO', { hour: '2-digit', minute: '2-digit' })}
            </div>

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

            <button onClick={avsluttAmming} disabled={laster} style={{ width: '100%', padding: '14px', backgroundColor: farger.grønnLys, border: `1px solid ${farger.grønn}`, borderRadius: '14px', fontSize: '14px', fontWeight: '600', color: farger.grønn, cursor: 'pointer', fontFamily: 'var(--font-inter)' }}>
              {laster ? 'Lagrer...' : 'Avslutt amming'}
            </button>
          </div>
        ) : (
          /* VELG BRYST */
          <>
            {logg.length > 0 ? (
              <>
                <div style={{ fontSize: '13px', fontFamily: 'var(--font-inter)', color: farger.tekstLys, marginBottom: '12px', textAlign: 'center' }}>
                  Anbefalt neste bryst
                </div>
                <button onClick={() => startAmming(anbefalingBryst)} style={{ width: '100%', padding: '16px', backgroundColor: farger.grønnLys, border: `1px solid ${farger.grønn}`, borderRadius: '16px', fontSize: '15px', fontWeight: '600', color: farger.grønn, cursor: 'pointer', fontFamily: 'var(--font-inter)', marginBottom: '10px' }}>
                  🤍 Start med {anbefalingBryst === 'venstre' ? 'venstre' : 'høyre'} bryst
                </button>
                <button onClick={() => startAmming(motattBryst(anbefalingBryst) as 'venstre' | 'høyre')} style={{ width: '100%', padding: '12px', backgroundColor: 'transparent', border: `1px solid ${farger.kremMørk}`, borderRadius: '16px', fontSize: '13px', color: farger.tekstLys, cursor: 'pointer', fontFamily: 'var(--font-inter)' }}>
                  Eller start med {motattBryst(anbefalingBryst)} bryst
                </button>
              </>
            ) : (
              <>
                <div style={{ fontSize: '14px', fontFamily: 'var(--font-plus-jakarta)', color: farger.tekst, fontWeight: '600', marginBottom: '14px', textAlign: 'center' }}>
                  Velg bryst for å starte
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button onClick={() => startAmming('venstre')} style={{ flex: 1, padding: '20px 12px', backgroundColor: farger.bakgrunn, border: `1.5px solid ${farger.kremMørk}`, borderRadius: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                    <div style={{ width: '52px', height: '52px', borderRadius: '50%', backgroundColor: '#FFE8D6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <img src="/tateflaske-mork.png" style={{ width: 28, height: 28, objectFit: 'contain', transform: 'scaleX(-1)' }} />
                    </div>
                    <div style={{ fontSize: '14px', fontFamily: 'var(--font-inter)', color: farger.tekst, fontWeight: '500' }}>Venstre</div>
                  </button>
                  <button onClick={() => startAmming('høyre')} style={{ flex: 1, padding: '20px 12px', backgroundColor: farger.bakgrunn, border: `1.5px solid ${farger.kremMørk}`, borderRadius: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                    <div style={{ width: '52px', height: '52px', borderRadius: '50%', backgroundColor: '#FFE8D6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <img src="/tateflaske-mork.png" style={{ width: 28, height: 28, objectFit: 'contain' }} />
                    </div>
                    <div style={{ fontSize: '14px', fontFamily: 'var(--font-inter)', color: farger.tekst, fontWeight: '500' }}>Høyre</div>
                  </button>
                </div>
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
              <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', backgroundColor: farger.bakgrunn, borderRadius: '12px' }}>
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
                <div style={{ fontSize: '14px', fontFamily: 'var(--font-plus-jakarta)', color: farger.grønn, fontWeight: '600' }}>
                  {l.varighet} min
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}