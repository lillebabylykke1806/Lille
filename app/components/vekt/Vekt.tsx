'use client';
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { farger } from '../../lib/farger';

type Props = { bruker: any; };

type VektLogg = {
  id: number;
  dato: string;
  vekt: number | null;
  lengde: number | null;
  klaer: string | null;
  sko: string | null;
  notat: string | null;
};

export default function Vekt({ bruker }: Props) {
  const [logg, setLogg] = useState<VektLogg[]>([]);
  const [visLeggTil, setVisLeggTil] = useState(false);
  const [lagrer, setLagrer] = useState(false);

  const [dato, setDato] = useState(new Date().toISOString().split('T')[0]);
  const [vekt, setVekt] = useState('');
  const [lengde, setLengde] = useState('');
  const [klaer, setKlaer] = useState('');
  const [sko, setSko] = useState('');
  const [notat, setNotat] = useState('');

  const lastLogg = useCallback(async () => {
    const { data } = await supabase
      .from('vekt')
      .select('*')
      .eq('profil_id', bruker?.id)
      .order('dato', { ascending: false });
    if (data) setLogg(data);
  }, [bruker?.id]);

  useEffect(() => { lastLogg(); }, [lastLogg]);

  const lagre = async () => {
    if (!vekt && !lengde && !klaer && !sko) return;
    setLagrer(true);
    await supabase.from('vekt').insert({
      profil_id: bruker?.id,
      dato,
      vekt: vekt ? parseFloat(vekt) : null,
      lengde: lengde ? parseFloat(lengde) : null,
      klaer: klaer || null,
      sko: sko || null,
      notat: notat || null,
    });
    setVekt(''); setLengde(''); setKlaer(''); setSko(''); setNotat('');
    setDato(new Date().toISOString().split('T')[0]);
    setVisLeggTil(false);
    setLagrer(false);
    lastLogg();
  };

  const sisteLogg = logg[0];

  const formatDato = (dato: string) => {
    return new Date(dato).toLocaleDateString('no-NO', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  return (
    <div style={{ backgroundColor: farger.bakgrunn, minHeight: '100vh', padding: '24px 24px 100px' }}>

      {/* Header */}
      <div style={{ marginBottom: '24px', textAlign: 'center' }}>
        <div style={{ fontSize: '26px', fontFamily: 'var(--font-plus-jakarta)', color: farger.tekst, fontWeight: '700', marginBottom: '4px' }}>
          Vekst & størrelser
        </div>
        <div style={{ fontSize: '13px', fontFamily: 'var(--font-inter)', color: farger.tekstLys }}>
          Følg barnets vekst over tid
        </div>
      </div>

      {/* Siste målinger */}
      {sisteLogg && (
        <div style={{ backgroundColor: farger.hvit, border: `1px solid ${farger.kremMørk}`, borderRadius: '20px', padding: '20px', marginBottom: '12px' }}>
          <div style={{ fontSize: '12px', fontFamily: 'var(--font-inter)', color: farger.tekstLys, marginBottom: '12px' }}>
            Siste registrering · {formatDato(sisteLogg.dato)}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            {sisteLogg.vekt && (
              <div style={{ backgroundColor: farger.bakgrunn, borderRadius: '14px', padding: '14px', textAlign: 'center' }}>
                <div style={{ fontSize: '24px', fontFamily: 'var(--font-plus-jakarta)', color: farger.grønn, fontWeight: '700' }}>
                  {sisteLogg.vekt} kg
                </div>
                <div style={{ fontSize: '11px', fontFamily: 'var(--font-inter)', color: farger.tekstLys }}>Vekt</div>
              </div>
            )}
            {sisteLogg.lengde && (
              <div style={{ backgroundColor: farger.bakgrunn, borderRadius: '14px', padding: '14px', textAlign: 'center' }}>
                <div style={{ fontSize: '24px', fontFamily: 'var(--font-plus-jakarta)', color: farger.grønn, fontWeight: '700' }}>
                  {sisteLogg.lengde} cm
                </div>
                <div style={{ fontSize: '11px', fontFamily: 'var(--font-inter)', color: farger.tekstLys }}>Lengde</div>
              </div>
            )}
            {sisteLogg.klaer && (
              <div style={{ backgroundColor: farger.bakgrunn, borderRadius: '14px', padding: '14px', textAlign: 'center' }}>
                <div style={{ fontSize: '22px', fontFamily: 'var(--font-plus-jakarta)', color: farger.grønn, fontWeight: '700' }}>
                  {sisteLogg.klaer}
                </div>
                <div style={{ fontSize: '11px', fontFamily: 'var(--font-inter)', color: farger.tekstLys }}>Klærstørrelse</div>
              </div>
            )}
            {sisteLogg.sko && (
              <div style={{ backgroundColor: farger.bakgrunn, borderRadius: '14px', padding: '14px', textAlign: 'center' }}>
                <div style={{ fontSize: '22px', fontFamily: 'var(--font-plus-jakarta)', color: farger.grønn, fontWeight: '700' }}>
                  {sisteLogg.sko}
                </div>
                <div style={{ fontSize: '11px', fontFamily: 'var(--font-inter)', color: farger.tekstLys }}>Skostørrelse</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Legg til knapp */}
      <button onClick={() => setVisLeggTil(true)} style={{ width: '100%', padding: '16px', backgroundColor: farger.grønnLys, border: `1px solid ${farger.grønn}`, borderRadius: '16px', fontSize: '15px', fontWeight: '600', color: farger.grønn, cursor: 'pointer', fontFamily: 'var(--font-inter)', marginBottom: '20px' }}>
        + Registrer ny måling
      </button>

      {/* Historikk */}
      {logg.length > 0 && (
        <div style={{ backgroundColor: farger.hvit, border: `1px solid ${farger.kremMørk}`, borderRadius: '16px', padding: '16px 20px' }}>
          <div style={{ fontSize: '15px', fontFamily: 'var(--font-plus-jakarta)', color: farger.tekst, fontWeight: '600', marginBottom: '12px' }}>
            Historikk
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {logg.map((l, i) => (
              <div key={l.id} style={{ padding: '14px', backgroundColor: farger.bakgrunn, borderRadius: '12px', borderLeft: `3px solid ${farger.grønn}` }}>
                <div style={{ fontSize: '12px', fontFamily: 'var(--font-inter)', color: farger.tekstLys, marginBottom: '8px' }}>
                  {formatDato(l.dato)}
                  {i === 0 && <span style={{ marginLeft: '8px', backgroundColor: farger.grønnLys, color: farger.grønn, fontSize: '10px', padding: '2px 8px', borderRadius: '10px', fontWeight: '600' }}>Siste</span>}
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {l.vekt && (
                    <div style={{ fontSize: '13px', fontFamily: 'var(--font-inter)', color: farger.tekst }}>
                      ⚖️ <span style={{ fontWeight: '600' }}>{l.vekt} kg</span>
                    </div>
                  )}
                  {l.lengde && (
                    <div style={{ fontSize: '13px', fontFamily: 'var(--font-inter)', color: farger.tekst }}>
                      📏 <span style={{ fontWeight: '600' }}>{l.lengde} cm</span>
                    </div>
                  )}
                  {l.klaer && (
                    <div style={{ fontSize: '13px', fontFamily: 'var(--font-inter)', color: farger.tekst }}>
                      👕 <span style={{ fontWeight: '600' }}>{l.klaer}</span>
                    </div>
                  )}
                  {l.sko && (
                    <div style={{ fontSize: '13px', fontFamily: 'var(--font-inter)', color: farger.tekst }}>
                      👟 <span style={{ fontWeight: '600' }}>{l.sko}</span>
                    </div>
                  )}
                </div>
                {l.notat && (
                  <div style={{ fontSize: '12px', fontFamily: 'var(--font-inter)', color: farger.tekstLys, fontStyle: 'italic', marginTop: '6px' }}>
                    {l.notat}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL: Legg til måling */}
      {visLeggTil && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', zIndex: 200, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }} onClick={() => setVisLeggTil(false)}>
          <div onClick={e => e.stopPropagation()} style={{ backgroundColor: farger.hvit, width: '100%', maxWidth: '430px', borderRadius: '24px 24px 0 0', padding: '24px', paddingBottom: '48px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ width: '36px', height: '4px', backgroundColor: farger.kremMørk, borderRadius: '2px', margin: '0 auto 20px' }} />
            <div style={{ fontSize: '18px', fontFamily: 'var(--font-plus-jakarta)', color: farger.tekst, fontWeight: '600', marginBottom: '20px' }}>
              Ny måling
            </div>

            {/* Dato */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '11px', letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: 'var(--font-inter)', color: farger.tekstLys, marginBottom: '8px' }}>Dato</div>
              <input type="date" value={dato} onChange={e => setDato(e.target.value)} style={{ width: '100%', padding: '12px 16px', fontSize: '14px', border: `1px solid ${farger.kremMørk}`, borderRadius: '12px', backgroundColor: farger.bakgrunn, color: farger.tekst, outline: 'none', fontFamily: 'var(--font-inter)', boxSizing: 'border-box' }} />
            </div>

            {/* Vekt og lengde */}
            <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '11px', letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: 'var(--font-inter)', color: farger.tekstLys, marginBottom: '8px' }}>Vekt (kg)</div>
                <input type="number" step="0.1" value={vekt} onChange={e => setVekt(e.target.value)} placeholder="F.eks. 5.2" style={{ width: '100%', padding: '12px 16px', fontSize: '14px', border: `1px solid ${farger.kremMørk}`, borderRadius: '12px', backgroundColor: farger.bakgrunn, color: farger.tekst, outline: 'none', fontFamily: 'var(--font-inter)', boxSizing: 'border-box' }} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '11px', letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: 'var(--font-inter)', color: farger.tekstLys, marginBottom: '8px' }}>Lengde (cm)</div>
                <input type="number" step="0.1" value={lengde} onChange={e => setLengde(e.target.value)} placeholder="F.eks. 58" style={{ width: '100%', padding: '12px 16px', fontSize: '14px', border: `1px solid ${farger.kremMørk}`, borderRadius: '12px', backgroundColor: farger.bakgrunn, color: farger.tekst, outline: 'none', fontFamily: 'var(--font-inter)', boxSizing: 'border-box' }} />
              </div>
            </div>

            {/* Klær og sko */}
            <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '11px', letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: 'var(--font-inter)', color: farger.tekstLys, marginBottom: '8px' }}>Klæsstørrelse</div>
                <input type="text" value={klaer} onChange={e => setKlaer(e.target.value)} placeholder="F.eks. 62 eller 3-6 mnd" style={{ width: '100%', padding: '12px 16px', fontSize: '14px', border: `1px solid ${farger.kremMørk}`, borderRadius: '12px', backgroundColor: farger.bakgrunn, color: farger.tekst, outline: 'none', fontFamily: 'var(--font-inter)', boxSizing: 'border-box' }} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '11px', letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: 'var(--font-inter)', color: farger.tekstLys, marginBottom: '8px' }}>Skostørrelse</div>
                <input type="text" value={sko} onChange={e => setSko(e.target.value)} placeholder="F.eks. 17" style={{ width: '100%', padding: '12px 16px', fontSize: '14px', border: `1px solid ${farger.kremMørk}`, borderRadius: '12px', backgroundColor: farger.bakgrunn, color: farger.tekst, outline: 'none', fontFamily: 'var(--font-inter)', boxSizing: 'border-box' }} />
              </div>
            </div>

            {/* Notat */}
            <div style={{ marginBottom: '24px' }}>
              <div style={{ fontSize: '11px', letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: 'var(--font-inter)', color: farger.tekstLys, marginBottom: '8px' }}>Notat (valgfritt)</div>
              <textarea value={notat} onChange={e => setNotat(e.target.value)} placeholder="F.eks. legevaktsbesøk, sjekket av lege..." style={{ width: '100%', padding: '12px 16px', fontSize: '14px', border: `1px solid ${farger.kremMørk}`, borderRadius: '12px', backgroundColor: farger.bakgrunn, color: farger.tekst, outline: 'none', fontFamily: 'var(--font-inter)', resize: 'none', minHeight: '70px', boxSizing: 'border-box' }} />
            </div>

            <button onClick={lagre} disabled={(!vekt && !lengde && !klaer && !sko) || lagrer} style={{ width: '100%', padding: '16px', backgroundColor: (vekt || lengde || klaer || sko) ? farger.grønnLys : farger.kremMørk, border: `1px solid ${(vekt || lengde || klaer || sko) ? farger.grønn : 'transparent'}`, borderRadius: '16px', fontSize: '15px', fontWeight: '600', color: (vekt || lengde || klaer || sko) ? farger.grønn : farger.tekstLys, cursor: (vekt || lengde || klaer || sko) ? 'pointer' : 'not-allowed', fontFamily: 'var(--font-inter)' }}>
              {lagrer ? 'Lagrer...' : 'Lagre måling'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}