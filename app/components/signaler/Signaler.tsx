'use client';
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { farger } from '../../lib/farger';

type Props = { bruker: any; };

type SignalDetalj = {
  navn: string;
  antall: number;
  prosentFørLur: number;
  gjsnittMinFørSøvn: number;
};

export default function Signaler({ bruker }: Props) {
  const [signaler, setSignaler] = useState<SignalDetalj[]>([]);
  const [valgtSignal, setValgtSignal] = useState<SignalDetalj | null>(null);
  const [laster, setLaster] = useState(true);
  const [babyNavn, setBabyNavn] = useState('babyen');

  const lastSignaler = useCallback(async () => {
    setLaster(true);

    const { data: barn } = await supabase
      .from('barn')
      .select('*')
      .eq('bruker_id', bruker?.id)
      .single();
    if (barn?.navn) setBabyNavn(barn.navn);

    const { data: lurer } = await supabase
      .from('lurer')
      .select('*')
      .eq('profil_id', bruker?.id)
      .eq('type', 'lur')
      .not('signaler', 'is', null);

    if (!lurer || lurer.length === 0) {
      setLaster(false);
      return;
    }

    const signalTelling: Record<string, { antall: number; lurIds: number[]; minutterFørSøvn: number[] }> = {};

    lurer.forEach((l: any) => {
      if (!l.signaler) return;
      const signalListe = typeof l.signaler === 'string'
        ? l.signaler.split(',').map((s: string) => s.trim()).filter(Boolean)
        : l.signaler;

      signalListe.forEach((signal: string) => {
        if (!signalTelling[signal]) {
          signalTelling[signal] = { antall: 0, lurIds: [], minutterFørSøvn: [] };
        }
        signalTelling[signal].antall += 1;
        signalTelling[signal].lurIds.push(l.id);
        if (l.varighet) {
          signalTelling[signal].minutterFørSøvn.push(Math.floor(l.varighet / 2));
        }
      });
    });

    const totalLurer = lurer.length;
    const signalListe: SignalDetalj[] = Object.entries(signalTelling)
      .map(([navn, data]) => ({
        navn,
        antall: data.antall,
        prosentFørLur: Math.round((data.antall / totalLurer) * 100),
        gjsnittMinFørSøvn: data.minutterFørSøvn.length > 0
          ? Math.round(data.minutterFørSøvn.reduce((a, b) => a + b, 0) / data.minutterFørSøvn.length)
          : 0,
      }))
      .sort((a, b) => b.antall - a.antall);

    setSignaler(signalListe);
    setLaster(false);
  }, [bruker?.id]);

  useEffect(() => { lastSignaler(); }, [lastSignaler]);

  return (
    <div style={{ backgroundColor: farger.bakgrunn, minHeight: '100vh', padding: '24px 24px 100px' }}>

      {/* Header */}
      <div style={{ marginBottom: '24px', textAlign: 'center' }}>
        <div style={{ fontSize: '26px', fontFamily: 'var(--font-plus-jakarta)', color: farger.tekst, fontWeight: '700', marginBottom: '4px' }}>
          Signaler
        </div>
        <div style={{ fontSize: '13px', fontFamily: 'var(--font-inter)', color: farger.tekstLys }}>
          {babyNavn}s språk i tall
        </div>
      </div>

      {laster ? (
        <div style={{ textAlign: 'center', padding: '48px' }}>
          <div style={{ width: '24px', height: '24px', border: `2px solid ${farger.grønn}`, borderTop: '2px solid transparent', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto' }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      ) : signaler.length === 0 ? (
        <div style={{ backgroundColor: farger.hvit, border: `1px solid ${farger.kremMørk}`, borderRadius: '20px', padding: '32px', textAlign: 'center' }}>
          <div style={{ fontSize: '32px', marginBottom: '12px' }}>💛</div>
          <div style={{ fontSize: '15px', fontFamily: 'var(--font-plus-jakarta)', color: farger.tekst, fontWeight: '600', marginBottom: '8px' }}>
            Ingen signaler ennå
          </div>
          <div style={{ fontSize: '13px', fontFamily: 'var(--font-inter)', color: farger.tekstLys, lineHeight: 1.6 }}>
            Registrer signaler under lur for å se {babyNavn}s mønster her
          </div>
        </div>
      ) : (
        <>
          {/* Intro */}
          <div style={{ background: 'linear-gradient(135deg, #FFF8EC 0%, #FFF0D6 100%)', border: '1px solid #F4D9A0', borderRadius: '20px', padding: '20px', marginBottom: '20px' }}>
            <div style={{ fontSize: '14px', fontFamily: 'var(--font-plus-jakarta)', color: farger.tekst, fontWeight: '600', marginBottom: '6px' }}>
              💛 {babyNavn}s vanligste signaler
            </div>
            <div style={{ fontSize: '13px', fontFamily: 'var(--font-inter)', color: '#6B5040', lineHeight: 1.6 }}>
              Trykk på et signal for å se detaljer
            </div>
          </div>

          {/* Signalliste */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
            {signaler.map((signal, i) => (
              <button
                key={signal.navn}
                onClick={() => setValgtSignal(signal)}
                style={{ backgroundColor: farger.hvit, border: `1px solid ${farger.kremMørk}`, borderRadius: '16px', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '16px', cursor: 'pointer', textAlign: 'left', width: '100%' }}
              >
                <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: i === 0 ? '#FFF3D6' : i === 1 ? '#F2E4D8' : farger.bakgrunn, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <div style={{ fontSize: '16px', fontFamily: 'var(--font-plus-jakarta)', color: i === 0 ? '#F4A853' : i === 1 ? farger.terrakotta : farger.tekstLys, fontWeight: '700' }}>
                    {i + 1}
                  </div>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '14px', fontFamily: 'var(--font-inter)', color: farger.tekst, fontWeight: '600', marginBottom: '2px' }}>
                    {signal.navn}
                  </div>
                  <div style={{ fontSize: '12px', fontFamily: 'var(--font-inter)', color: farger.tekstLys }}>
                    Registrert {signal.antall} {signal.antall === 1 ? 'gang' : 'ganger'} · {signal.prosentFørLur}% av lurene
                  </div>
                </div>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M6 4L10 8L6 12" stroke={farger.tekstLys} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            ))}
          </div>
        </>
      )}

      {/* Modal: Signal-detalj */}
      {valgtSignal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', zIndex: 200, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }} onClick={() => setValgtSignal(null)}>
          <div onClick={e => e.stopPropagation()} style={{ backgroundColor: farger.hvit, width: '100%', maxWidth: '430px', borderRadius: '24px 24px 0 0', padding: '24px', paddingBottom: '48px' }}>
            <div style={{ width: '36px', height: '4px', backgroundColor: farger.kremMørk, borderRadius: '2px', margin: '0 auto 20px' }} />
            <div style={{ fontSize: '20px', fontFamily: 'var(--font-plus-jakarta)', color: farger.tekst, fontWeight: '700', marginBottom: '4px' }}>
              {valgtSignal.navn}
            </div>
            <div style={{ fontSize: '13px', fontFamily: 'var(--font-inter)', color: farger.tekstLys, marginBottom: '24px' }}>
              {babyNavn}s signal
            </div>

            <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
              <div style={{ flex: 1, backgroundColor: farger.bakgrunn, borderRadius: '16px', padding: '16px', textAlign: 'center' }}>
                <div style={{ fontSize: '28px', fontFamily: 'var(--font-plus-jakarta)', color: farger.grønn, fontWeight: '700' }}>
                  {valgtSignal.antall}
                </div>
                <div style={{ fontSize: '11px', fontFamily: 'var(--font-inter)', color: farger.tekstLys }}>ganger registrert</div>
              </div>
              <div style={{ flex: 1, backgroundColor: farger.bakgrunn, borderRadius: '16px', padding: '16px', textAlign: 'center' }}>
                <div style={{ fontSize: '28px', fontFamily: 'var(--font-plus-jakarta)', color: farger.grønn, fontWeight: '700' }}>
                  {valgtSignal.prosentFørLur}%
                </div>
                <div style={{ fontSize: '11px', fontFamily: 'var(--font-inter)', color: farger.tekstLys }}>av lurene</div>
              </div>
            </div>

            {valgtSignal.gjsnittMinFørSøvn > 0 && (
              <div style={{ backgroundColor: '#FFF8EC', border: '1px solid #F4D9A0', borderRadius: '16px', padding: '16px', textAlign: 'center', marginBottom: '16px' }}>
                <div style={{ fontSize: '28px', fontFamily: 'var(--font-plus-jakarta)', color: '#8B6340', fontWeight: '700' }}>
                  {valgtSignal.gjsnittMinFørSøvn} min
                </div>
                <div style={{ fontSize: '11px', fontFamily: 'var(--font-inter)', color: '#8B6340' }}>gjennomsnitt før søvn</div>
              </div>
            )}

            <div style={{ padding: '14px 16px', backgroundColor: farger.grønnLys, borderRadius: '14px', borderLeft: `3px solid ${farger.grønn}` }}>
              <div style={{ fontSize: '13px', fontFamily: 'var(--font-inter)', color: farger.tekst, lineHeight: 1.6 }}>
                💛 Når {babyNavn} viser "{valgtSignal.navn}" er det i {valgtSignal.prosentFørLur}% av tilfellene et tegn på at en lur nærmer seg.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}