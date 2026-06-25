'use client';
import { useState, useEffect } from 'react';
import { useLanguage } from '../../lib/i18n/LanguageContext';
import { OversettelseNøkkel } from '../../lib/i18n/translations';

type Props = {
  onLukk: () => void;
};

type Scenario = {
  id: string;
  navn: string;
  beskrivelse: string;
  bakgrunn: string;
  glow: string;
  stjerner?: boolean;
  bølger?: boolean;
};

type TFn = (nøkkel: OversettelseNøkkel, variabler?: Record<string, string | number>) => string;

const getScenarier = (t: TFn): Scenario[] => [
  {
    id: 'maaneskinn',
    navn: t('nattlys.måneskinn'),
    beskrivelse: t('nattlys.måneskinnBeskrivelse'),
    bakgrunn: 'radial-gradient(ellipse at 25% 30%, #2A4A8E 0%, #0D1B3E 55%, #050D20 100%)',
    glow: 'rgba(138,174,224,0.35)',
    stjerner: true,
  },
  {
    id: 'varm',
    navn: t('nattlys.roligVarm'),
    beskrivelse: t('nattlys.roligVarmBeskrivelse'),
    bakgrunn: 'radial-gradient(ellipse at 50% 60%, #7A3A0A 0%, #3D1A05 45%, #1A0A02 100%)',
    glow: 'rgba(220,140,50,0.5)',
  },
  {
    id: 'stjernehimmel',
    navn: t('nattlys.stjernehimmel'),
    beskrivelse: t('nattlys.stjernehimmelBeskrivelse'),
    bakgrunn: 'radial-gradient(ellipse at 60% 40%, #2A1A5E 0%, #0F0820 70%, #050310 100%)',
    glow: 'rgba(160,120,255,0.35)',
    stjerner: true,
  },
];

export default function NattlysPanel({ onLukk }: Props) {
  const { t } = useLanguage();
  const SCENARIER = getScenarier(t);

  const [valgtScenario, setValgtScenario] = useState<Scenario | null>(null);
  const [lysstyrke, setLysstyrke] = useState(50);
  const [timer, setTimer] = useState<number | null>(60);
  const [aktivtNattlys, setAktivtNattlys] = useState(false);
  const [stjerner] = useState(() =>
    Array.from({ length: 40 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      s: Math.random() * 3 + 1,
      d: Math.random() * 3,
    }))
  );

  useEffect(() => {
    if (aktivtNattlys && 'wakeLock' in navigator) {
      let wakeLock: any = null;
      (navigator as any).wakeLock.request('screen').then((wl: any) => {
        wakeLock = wl;
      }).catch(() => {});
      return () => { if (wakeLock) wakeLock.release(); };
    }
  }, [aktivtNattlys]);

  useEffect(() => {
    if (aktivtNattlys && timer !== null) {
      const timeout = setTimeout(() => setAktivtNattlys(false), timer * 60 * 1000);
      return () => clearTimeout(timeout);
    }
  }, [aktivtNattlys, timer]);

  // Fullt nattlys-modus
  if (aktivtNattlys) {
    const scenario = valgtScenario || SCENARIER[0];
    const bg = scenario.bakgrunn;
    const glowFarge = scenario.glow;
    const visStjerner = scenario.stjerner;

    return (
      <div style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: bg,
        transition: 'background 1s ease',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      }}>
        <style>{`
          @keyframes nattStar { 0%,100%{opacity:0.1} 50%{opacity:0.6} }
          @keyframes nattGlow { 0%,100%{opacity:0.3} 50%{opacity:0.6} }
        `}</style>

        {/* Glow i midten */}
        <div style={{
          position: 'absolute',
          width: '300px', height: '300px',
          borderRadius: '50%',
          background: `radial-gradient(ellipse, ${glowFarge} 0%, transparent 70%)`,
          animation: 'nattGlow 4s ease-in-out infinite',
          filter: 'blur(20px)',
        }} />

        {/* Stjerner */}
        {visStjerner && stjerner.map(s => (
          <div key={s.id} style={{
            position: 'absolute',
            left: `${s.x}%`, top: `${s.y}%`,
            width: `${s.s}px`, height: `${s.s}px`,
            borderRadius: '50%',
            backgroundColor: '#E8C87A',
            animation: `nattStar ${2 + s.d}s ${s.d}s infinite ease-in-out`,
          }} />
        ))}

        {/* Lysstyrke overlay */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundColor: `rgba(0,0,0,${1 - lysstyrke / 100})`,
          pointerEvents: 'none',
        }} />

        {/* Avslutt-knapp – diskret */}
        <button
          onClick={() => setAktivtNattlys(false)}
          style={{
            position: 'absolute', bottom: '48px',
            padding: '12px 28px',
            backgroundColor: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: '24px',
            color: 'rgba(255,255,255,0.4)',
            fontSize: '13px',
            fontFamily: 'var(--font-inter)',
            cursor: 'pointer',
          }}>
          {t('nattlys.avsluttNattlys')}
        </button>
      </div>
    );
  }

  // Panel (sheet)
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 200 }} onClick={onLukk}>
      <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)' }} />
      <div
        onClick={e => e.stopPropagation()}
        style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          backgroundColor: '#0D1B3E',
          borderRadius: '24px 24px 0 0',
          padding: '20px 24px 40px',
          border: '1px solid rgba(255,255,255,0.1)',
          maxHeight: '85vh',
          overflowY: 'auto',
          animation: 'sheetUp 0.3s ease-out',
        }}>

        <style>{`@keyframes sheetUp { 0%{transform:translateY(100%)} 100%{transform:translateY(0)} }`}</style>

        {/* Handle */}
        <div style={{ width: '40px', height: '4px', backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: '2px', margin: '0 auto 16px' }} />

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div style={{ fontSize: '18px', fontFamily: 'var(--font-plus-jakarta)', color: '#E8DDD0', fontWeight: '600' }}>{t('nattlys.tittel')}</div>
          <button onClick={onLukk} style={{ background: 'none', border: 'none', color: '#8A8FA8', cursor: 'pointer', fontSize: '20px' }}>✕</button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '24px' }}>
          {SCENARIER.map(s => (
            <button key={s.id} onClick={() => setValgtScenario(s)} style={{
              padding: '16px', borderRadius: '16px', border: 'none', cursor: 'pointer',
              background: valgtScenario?.id === s.id
                ? `linear-gradient(135deg, rgba(124,143,212,0.3) 0%, rgba(124,143,212,0.1) 100%)`
                : 'rgba(255,255,255,0.05)',
              borderWidth: '1px', borderStyle: 'solid',
              borderColor: valgtScenario?.id === s.id ? 'rgba(124,143,212,0.5)' : 'rgba(255,255,255,0.08)',
              display: 'flex', alignItems: 'center', gap: '14px', textAlign: 'left',
              transition: 'all 0.2s ease',
            }}>
              {/* Forhåndsvisning */}
              <div style={{
                width: '52px', height: '52px', borderRadius: '12px', flexShrink: 0,
                background: s.bakgrunn,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: `0 0 12px ${s.glow}`,
              }}>
                <div style={{ fontSize: '20px' }}>
                  {s.id === 'maaneskinn' ? '🌙' : s.id === 'varm' ? '🕯️' : '✨'}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '14px', fontFamily: 'var(--font-plus-jakarta)', color: '#E8DDD0', fontWeight: '600', marginBottom: '4px' }}>{s.navn}</div>
                <div style={{ fontSize: '12px', fontFamily: 'var(--font-inter)', color: '#8A8FA8', lineHeight: 1.4 }}>{s.beskrivelse}</div>
              </div>
              {valgtScenario?.id === s.id && (
                <div style={{ marginLeft: 'auto', flexShrink: 0 }}>
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <circle cx="10" cy="10" r="9" fill="#7C8FD4" opacity="0.3"/>
                    <path d="M6 10L9 13L14 7" stroke="#8AAEE0" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              )}
            </button>
          ))}
        </div>

        {/* Start-knapp */}
        <button
          onClick={() => {
            if (!valgtScenario) setValgtScenario(SCENARIER[0]);
            setAktivtNattlys(true);
          }}
          style={{
            width: '100%', padding: '16px', borderRadius: '20px', border: 'none', cursor: 'pointer',
            background: 'linear-gradient(135deg, #4A5580 0%, #7C8FD4 100%)',
            color: '#FDFAF6', fontSize: '15px', fontWeight: '600',
            fontFamily: 'var(--font-inter)',
            boxShadow: '0 4px 20px rgba(124,143,212,0.3)',
          }}>
          {t('nattlys.slåPå')}
        </button>
      </div>
    </div>
  );
}
