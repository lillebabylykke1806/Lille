'use client';
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { farger } from '../../lib/farger';

type Props = { bruker: any; };

type BleieLogg = {
  id: number;
  type: string;
  tidspunkt: string;
  dato: string;
};

const dagensdato = () => new Date().toISOString().split('T')[0];

const BLEIE_TYPER = [
  { id: 'våt', label: 'Våt', emoji: '💧', farge: '#E8F0F8', tekstFarge: '#4A7BAF' },
  { id: 'skitten', label: 'Skitten', emoji: '💩', farge: '#F5EDE0', tekstFarge: '#8B6340' },
  { id: 'begge', label: 'Begge', emoji: '💧💩', farge: '#EDE8F5', tekstFarge: '#6B4AAF' },
  { id: 'tørr', label: 'Tørr', emoji: '✨', farge: '#E8F5EC', tekstFarge: '#2D5C45' },
];

export default function Bleie({ bruker }: Props) {
  const [logg, setLogg] = useState<BleieLogg[]>([]);
  const [lagrer, setLagrer] = useState<string | null>(null);
  const [visBekreftet, setVisBekreftet] = useState<string | null>(null);

  const lastLogg = useCallback(async () => {
    const { data } = await supabase
      .from('bleie')
      .select('*')
      .eq('profil_id', bruker?.id)
      .eq('dato', dagensdato())
      .order('tidspunkt', { ascending: false });
    if (data) setLogg(data);
  }, [bruker?.id]);

  useEffect(() => {
    lastLogg();
  }, [lastLogg]);

  const registrerBleie = async (type: string) => {
    setLagrer(type);
    const tidspunkt = new Date().toLocaleTimeString('no-NO', { hour: '2-digit', minute: '2-digit' });
    await supabase.from('bleie').insert({
      profil_id: bruker?.id,
      dato: dagensdato(),
      type,
      tidspunkt,
    });
    setLagrer(null);
    setVisBekreftet(type);
    setTimeout(() => setVisBekreftet(null), 2000);
    lastLogg();
  };

  const antallBleier = logg.length;
  const sisteBytte = logg[0];

  return (
    <div style={{ backgroundColor: farger.bakgrunn, minHeight: '100vh', padding: '24px 24px 100px' }}>

      {/* Header */}
      <div style={{ marginBottom: '24px', textAlign: 'center' }}>
        <div style={{ fontSize: '26px', fontFamily: 'var(--font-plus-jakarta)', color: farger.tekst, fontWeight: '700', marginBottom: '4px' }}>
          Bleie
        </div>
        <div style={{ fontSize: '13px', fontFamily: 'var(--font-inter)', color: farger.tekstLys }}>
          Registrer bleieskift raskt og enkelt
        </div>
      </div>

      {/* Bekreftelses-animasjon */}
      {visBekreftet && (
        <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', backgroundColor: farger.grønnLys, border: `1px solid ${farger.grønn}`, borderRadius: '20px', padding: '20px 32px', zIndex: 200, textAlign: 'center', boxShadow: '0 8px 32px rgba(0,0,0,0.12)' }}>
          <div style={{ fontSize: '32px', marginBottom: '8px' }}>✓</div>
          <div style={{ fontSize: '14px', fontFamily: 'var(--font-inter)', color: farger.grønn, fontWeight: '600' }}>Registrert!</div>
        </div>
      )}

      {/* Siste bytte */}
      {sisteBytte && (
        <div style={{ backgroundColor: farger.hvit, border: `1px solid ${farger.kremMørk}`, borderRadius: '16px', padding: '16px 20px', marginBottom: '16px' }}>
          <div style={{ fontSize: '12px', fontFamily: 'var(--font-inter)', color: farger.tekstLys, marginBottom: '6px' }}>Siste bleieskift</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ fontSize: '28px' }}>
              {BLEIE_TYPER.find(b => b.id === sisteBytte.type)?.emoji || '👶'}
            </div>
            <div>
              <div style={{ fontSize: '16px', fontFamily: 'var(--font-plus-jakarta)', color: farger.tekst, fontWeight: '600' }}>
                {BLEIE_TYPER.find(b => b.id === sisteBytte.type)?.label || sisteBytte.type}
              </div>
              <div style={{ fontSize: '12px', fontFamily: 'var(--font-inter)', color: farger.tekstLys }}>
                {sisteBytte.tidspunkt}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Innsikt */}
      {antallBleier > 0 && (
        <div style={{ backgroundColor: '#F5EDE8', borderRadius: '16px', padding: '16px 20px', marginBottom: '16px' }}>
          <div style={{ fontSize: '13px', fontFamily: 'var(--font-plus-jakarta)', color: farger.tekst, fontWeight: '600', marginBottom: '4px' }}>✨ Innsikt</div>
          <div style={{ fontSize: '13px', fontFamily: 'var(--font-inter)', color: farger.tekstLys, lineHeight: 1.6 }}>
            {antallBleier >= 6
              ? `${antallBleier} bleieskift i dag – flott oversikt! 🤍`
              : antallBleier === 1
              ? `1 bleieskift registrert i dag.`
              : `${antallBleier} bleieskift registrert i dag.`}
          </div>
        </div>
      )}

      {/* Registrer */}
      <div style={{ backgroundColor: farger.hvit, border: `1px solid ${farger.kremMørk}`, borderRadius: '20px', padding: '20px', marginBottom: '16px' }}>
        <div style={{ fontSize: '15px', fontFamily: 'var(--font-plus-jakarta)', color: farger.tekst, fontWeight: '600', marginBottom: '16px', textAlign: 'center' }}>
          Hva slags bleie?
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          {BLEIE_TYPER.map(type => (
            <button
              key={type.id}
              onClick={() => registrerBleie(type.id)}
              disabled={lagrer !== null}
              style={{
                padding: '20px 12px',
                backgroundColor: lagrer === type.id ? farger.grønnLys : type.farge,
                border: `1.5px solid ${lagrer === type.id ? farger.grønn : 'transparent'}`,
                borderRadius: '16px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '8px',
                cursor: lagrer !== null ? 'not-allowed' : 'pointer',
                opacity: lagrer !== null && lagrer !== type.id ? 0.6 : 1,
                transition: 'all 0.2s ease',
              }}
            >
              <div style={{ fontSize: '32px' }}>{type.emoji}</div>
              <div style={{ fontSize: '14px', fontFamily: 'var(--font-inter)', color: type.tekstFarge, fontWeight: '600' }}>
                {lagrer === type.id ? 'Lagrer...' : type.label}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Logg */}
      {logg.length > 0 && (
        <div style={{ backgroundColor: farger.hvit, border: `1px solid ${farger.kremMørk}`, borderRadius: '16px', padding: '16px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <div style={{ fontSize: '15px', fontFamily: 'var(--font-plus-jakarta)', color: farger.tekst, fontWeight: '600' }}>Bleieskift i dag</div>
            <div style={{ fontSize: '12px', fontFamily: 'var(--font-inter)', color: farger.tekstLys }}>{antallBleier} totalt</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {logg.map((l, i) => {
              const type = BLEIE_TYPER.find(b => b.id === l.type);
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', backgroundColor: farger.bakgrunn, borderRadius: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ fontSize: '20px' }}>{type?.emoji || '👶'}</div>
                    <div>
                      <div style={{ fontSize: '13px', fontFamily: 'var(--font-inter)', color: farger.tekst, fontWeight: '500' }}>
                        {type?.label || l.type}
                      </div>
                      <div style={{ fontSize: '11px', fontFamily: 'var(--font-inter)', color: farger.tekstLys }}>
                        {l.tidspunkt}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}