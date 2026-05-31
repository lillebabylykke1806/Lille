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

export default function Amming({ bruker }: Props) {
  const [fase, setFase] = useState<'velg' | 'aktiv' | 'ferdig'>('velg');
  const [valgtBryst, setValgtBryst] = useState<'venstre' | 'høyre' | null>(null);
  const [startTid, setStartTid] = useState<Date | null>(null);
  const [sekunder, setSekunder] = useState(0);
  const [logg, setLogg] = useState<AmmingLogg[]>([]);
  const [laster, setLaster] = useState(false);

  const lastLogg = useCallback(async () => {
    const { data } = await supabase
      .from('amming')
      .select('*')
      .eq('profil_id', bruker?.id)
      .eq('dato', dagensdato())
      .order('start', { ascending: false });
    if (data) setLogg(data);
  }, [bruker?.id]);

  useEffect(() => {
    lastLogg();
  }, [lastLogg]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined;
    if (fase === 'aktiv' && startTid) {
      interval = setInterval(() => {
        setSekunder(Math.floor((Date.now() - startTid.getTime()) / 1000));
      }, 1000);
    }
    return () => { if (interval) clearInterval(interval); };
  }, [fase, startTid]);

  const startAmming = (bryst: 'venstre' | 'høyre') => {
    setValgtBryst(bryst);
    setStartTid(new Date());
    setSekunder(0);
    setFase('aktiv');
  };

  const avsluttAmming = async () => {
    if (!startTid || !valgtBryst) return;
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
    setFase('velg');
    setStartTid(null);
    setSekunder(0);
    lastLogg();
  };

  const byttBryst = () => {
    setValgtBryst(prev => prev === 'venstre' ? 'høyre' : 'venstre');
  };

  const formaterTid = (sek: number) => {
    const m = Math.floor(sek / 60);
    const s = sek % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const totalMinutter = logg.reduce((sum, l) => sum + (l.varighet || 0), 0);
  const sisteAmming = logg[0];

  return (
    <div style={{ backgroundColor: farger.bakgrunn, minHeight: '100vh', padding: '24px 24px 100px' }}>

      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ fontSize: '24px', fontFamily: 'var(--font-plus-jakarta)', color: farger.tekst, fontWeight: '600', marginBottom: '4px' }}>
          Amming
        </div>
        <div style={{ fontSize: '13px', fontFamily: 'var(--font-inter)', color: farger.tekstLys }}>
          Registrer og følg ammingen
        </div>
      </div>

      {/* Aktiv amming */}
      {fase === 'aktiv' && (
        <div style={{ backgroundColor: farger.hvit, border: `1px solid ${farger.kremMørk}`, borderRadius: '20px', padding: '24px', marginBottom: '16px', textAlign: 'center' }}>
          <div style={{ fontSize: '13px', fontFamily: 'var(--font-inter)', color: farger.tekstLys, marginBottom: '8px' }}>
            Ammer på
          </div>
          <div style={{ fontSize: '22px', fontFamily: 'var(--font-plus-jakarta)', color: farger.tekst, fontWeight: '600', marginBottom: '24px' }}>
            {valgtBryst === 'venstre' ? '← Venstre bryst' : 'Høyre bryst →'}
          </div>

          {/* Timer */}
          <div style={{ width: '160px', height: '160px', borderRadius: '50%', border: `3px solid ${farger.grønn}`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', backgroundColor: farger.grønnLys }}>
            <div style={{ fontSize: '36px', fontFamily: 'var(--font-plus-jakarta)', color: farger.grønn, fontWeight: '700' }}>
              {formaterTid(sekunder)}
            </div>
          </div>

          {/* Bytt bryst */}
          <button onClick={byttBryst} style={{ padding: '10px 20px', backgroundColor: 'transparent', border: `1px solid ${farger.kremMørk}`, borderRadius: '20px', fontSize: '13px', fontFamily: 'var(--font-inter)', color: farger.tekstLys, cursor: 'pointer', marginBottom: '16px' }}>
            Bytt til {valgtBryst === 'venstre' ? 'høyre' : 'venstre'} bryst
          </button>

          {/* Avslutt */}
          <button onClick={avsluttAmming} disabled={laster} style={{ width: '100%', padding: '16px', backgroundColor: farger.grønn, border: 'none', borderRadius: '16px', fontSize: '15px', fontWeight: '600', color: '#FDFAF6', cursor: 'pointer', fontFamily: 'var(--font-inter)' }}>
            {laster ? 'Lagrer...' : 'Avslutt amming'}
          </button>
        </div>
      )}

      {/* Velg bryst */}
      {fase === 'velg' && (
        <>
          {/* Siste amming */}
          {sisteAmming && (
            <div style={{ backgroundColor: farger.hvit, border: `1px solid ${farger.kremMørk}`, borderRadius: '16px', padding: '16px', marginBottom: '16px' }}>
              <div style={{ fontSize: '12px', fontFamily: 'var(--font-inter)', color: farger.tekstLys, marginBottom: '4px' }}>Siste amming</div>
              <div style={{ fontSize: '16px', fontFamily: 'var(--font-plus-jakarta)', color: farger.tekst, fontWeight: '600' }}>
                {sisteAmming.bryst === 'venstre' ? '← Venstre' : 'Høyre →'} · {sisteAmming.varighet} min
              </div>
              <div style={{ fontSize: '12px', fontFamily: 'var(--font-inter)', color: farger.tekstLys, marginTop: '2px' }}>
                {sisteAmming.start} – {sisteAmming.slutt}
              </div>
              <div style={{ marginTop: '8px', fontSize: '12px', fontFamily: 'var(--font-inter)', color: farger.grønn }}>
                God start! 🤍
              </div>
            </div>
          )}

          {/* Velg bryst-knapper */}
          <div style={{ backgroundColor: farger.hvit, border: `1px solid ${farger.kremMørk}`, borderRadius: '20px', padding: '20px', marginBottom: '16px' }}>
            <div style={{ fontSize: '15px', fontFamily: 'var(--font-plus-jakarta)', color: farger.tekst, fontWeight: '600', marginBottom: '16px', textAlign: 'center' }}>
              Velg bryst
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
          </div>

          {/* Ammelogg i dag */}
          {logg.length > 0 && (
            <div style={{ backgroundColor: farger.hvit, border: `1px solid ${farger.kremMørk}`, borderRadius: '16px', padding: '16px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <div style={{ fontSize: '15px', fontFamily: 'var(--font-plus-jakarta)', color: farger.tekst, fontWeight: '600' }}>Ammelogg i dag</div>
                <div style={{ fontSize: '12px', fontFamily: 'var(--font-inter)', color: farger.tekstLys }}>{logg.length} økter · {totalMinutter} min</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {logg.map((l, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', backgroundColor: farger.bakgrunn, borderRadius: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#FFE8D6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <img src="/tateflaske-mork.png" style={{ width: 18, height: 18, objectFit: 'contain', transform: l.bryst === 'venstre' ? 'scaleX(-1)' : 'none' }} />
                      </div>
                      <div>
                        <div style={{ fontSize: '13px', fontFamily: 'var(--font-inter)', color: farger.tekst, fontWeight: '500' }}>
                          {l.bryst === 'venstre' ? '← Venstre' : 'Høyre →'}
                        </div>
                        <div style={{ fontSize: '11px', fontFamily: 'var(--font-inter)', color: farger.tekstLys }}>
                          {l.start} – {l.slutt}
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

          {/* Innsikt */}
          {logg.length > 0 && (
            <div style={{ backgroundColor: farger.terrakottaLys, borderRadius: '16px', padding: '16px' }}>
              <div style={{ fontSize: '13px', fontFamily: 'var(--font-plus-jakarta)', color: farger.tekst, fontWeight: '600', marginBottom: '4px' }}>✨ Innsikt</div>
              <div style={{ fontSize: '12px', fontFamily: 'var(--font-inter)', color: farger.tekstLys, lineHeight: 1.6 }}>
                {totalMinutter >= 60
                  ? `Babyen din har fått ${totalMinutter} minutter med amming i dag. Flott jobba! 🤍`
                  : `${logg.length} amminger i dag, totalt ${totalMinutter} minutter.`}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}