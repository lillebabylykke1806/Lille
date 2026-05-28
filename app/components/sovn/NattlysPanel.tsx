'use client';
import { useState, useEffect } from 'react';

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

const SCENARIER: Scenario[] = [
  {
    id: 'maaneskinn',
    navn: '🌙 Måneskinn',
    beskrivelse: 'Mørk blå og stille. Perfekt under nattamming.',
    bakgrunn: 'radial-gradient(ellipse at 30% 40%, #1A2A5E 0%, #0D1B3E 60%, #060D1F 100%)',
    glow: 'rgba(138,174,224,0.15)',
    stjerner: true,
  },
  {
    id: 'varm',
    navn: '☁️ Rolig varm',
    beskrivelse: 'Varm beige som en saltlampe. Beroligende.',
    bakgrunn: 'radial-gradient(ellipse at 50% 40%, #8B4513 0%, #5C2A0A 40%, #3A1A06 100%)',
    glow: 'rgba(235,180,100,0.25)',
  },
  {
    id: 'stjernehimmel',
    navn: '✨ Stjernehimmel',
    beskrivelse: 'Mørk med sakte stjernestøv. Meditasjonsfølelse.',
    bakgrunn: 'radial-gradient(ellipse at 50% 50%, #0F1A3E 0%, #060D1F 100%)',
    glow: 'rgba(200,180,255,0.1)',
    stjerner: true,
  },
  {
    id: 'havlys',
    navn: '🌊 Havlys',
    beskrivelse: 'Blå-lilla gradient med sakte bølgebevegelse.',
    bakgrunn: 'radial-gradient(ellipse at 40% 60%, #0D3B5E 0%, #1A1040 60%, #060D1F 100%)',
    glow: 'rgba(80,160,220,0.2)',
    bølger: true,
  },
];

const FARGER = [
  { id: 'varm_hvit', navn: 'Varm hvit', farge: '#FFE4B5' },
  { id: 'solnedgang', navn: 'Solnedgang', farge: '#FF8C42' },
  { id: 'lavendel', navn: 'Lavendel', farge: '#C4A8E8' },
  { id: 'himmelblaa', navn: 'Himmelblå', farge: '#87CEEB' },
  { id: 'skoggronn', navn: 'Skoggrønn', farge: '#8FBC8F' },
];

export default function NattlysPanel({ onLukk }: Props) {
  const [aktivTab, setAktivTab] = useState<'farger' | 'scener'>('scener');
  const [valgtScenario, setValgtScenario] = useState<Scenario | null>(null);
  const [valgtFarge, setValgtFarge] = useState(FARGER[0]);
  const [lysstyrke, setLysstyrke] = useState(30);
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
      const t = setTimeout(() => setAktivtNattlys(false), timer * 60 * 1000);
      return () => clearTimeout(t);
    }
  }, [aktivtNattlys, timer]);

  // Fullt nattlys-modus
  if (aktivtNattlys) {
    const scenario = valgtScenario;
    const bg = scenario
      ? scenario.bakgrunn
      : `radial-gradient(ellipse at 50% 50%, ${valgtFarge.farge}22 0%, ${valgtFarge.farge}08 60%, #060D1F 100%)`;
    const glowFarge = scenario ? scenario.glow : `${valgtFarge.farge}20`;
    const visStjerner = scenario?.stjerner || aktivTab === 'farger';
    const visBølger = scenario?.bølger;

    return (
      <div style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: bg,
        transition: 'background 1s ease',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      }}>
        <style>{`
          @keyframes nattStar { 0%,100%{opacity:0.1} 50%{opacity:0.6} }
          @keyframes nattBølge { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
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

        {/* Bølger */}
        {visBølger && (
          <svg viewBox="0 0 430 100" style={{ position: 'absolute', bottom: '20%', width: '100%', animation: 'nattBølge 4s ease-in-out infinite' }} preserveAspectRatio="none">
            <path d="M0 50 C60 30 120 70 180 50 C240 30 300 70 360 50 C400 35 430 45 430 45 L430 100 L0 100 Z" fill="rgba(80,140,200,0.08)"/>
            <path d="M0 65 C80 45 160 75 240 55 C300 40 370 65 430 55 L430 100 L0 100 Z" fill="rgba(80,140,200,0.06)"/>
          </svg>
        )}

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
          Avslutt nattlys
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ fontSize: '18px', fontFamily: 'var(--font-plus-jakarta)', color: '#E8DDD0', fontWeight: '600' }}>Nattlys</div>
          <button onClick={onLukk} style={{ background: 'none', border: 'none', color: '#8A8FA8', cursor: 'pointer', fontSize: '20px' }}>✕</button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: '12px', padding: '3px', marginBottom: '20px' }}>
          {(['farger', 'scener'] as const).map(tab => (
            <button key={tab} onClick={() => setAktivTab(tab)} style={{
              flex: 1, padding: '8px', borderRadius: '10px', border: 'none', cursor: 'pointer',
              backgroundColor: aktivTab === tab ? 'rgba(255,255,255,0.12)' : 'transparent',
              color: aktivTab === tab ? '#E8DDD0' : '#8A8FA8',
              fontSize: '13px', fontFamily: 'var(--font-inter)', fontWeight: aktivTab === tab ? '600' : '400',
              transition: 'all 0.2s ease',
            }}>
              {tab === 'farger' ? 'Farger' : 'Scener'}
            </button>
          ))}
        </div>

        {aktivTab === 'farger' && (
          <>
            {/* Fargevalg */}
            <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', justifyContent: 'center' }}>
              {FARGER.map(f => (
                <button key={f.id} onClick={() => setValgtFarge(f)} style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px',
                  background: 'none', border: 'none', cursor: 'pointer',
                }}>
                  <div style={{
                    width: '48px', height: '48px', borderRadius: '50%',
                    backgroundColor: f.farge,
                    border: valgtFarge.id === f.id ? '3px solid #FDFAF6' : '3px solid transparent',
                    boxShadow: valgtFarge.id === f.id ? `0 0 12px ${f.farge}` : 'none',
                    transition: 'all 0.2s ease',
                  }} />
                  <div style={{ fontSize: '9px', fontFamily: 'var(--font-inter)', color: '#8A8FA8', textAlign: 'center' }}>{f.navn}</div>
                </button>
              ))}
            </div>

            {/* Lysstyrke */}
            <div style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <div style={{ fontSize: '13px', fontFamily: 'var(--font-inter)', color: '#E8DDD0' }}>Lysstyrke</div>
                <div style={{ fontSize: '13px', fontFamily: 'var(--font-inter)', color: '#8A8FA8' }}>{lysstyrke}%</div>
              </div>
              <input type="range" min={5} max={80} value={lysstyrke} onChange={e => setLysstyrke(Number(e.target.value))}
                style={{ width: '100%', accentColor: '#8AAEE0' }} />
            </div>

            {/* Timer */}
            <div style={{ marginBottom: '24px' }}>
              <div style={{ fontSize: '13px', fontFamily: 'var(--font-inter)', color: '#E8DDD0', marginBottom: '10px' }}>Timer</div>
              <div style={{ display: 'flex', gap: '8px' }}>
                {[30, 60, 90, null].map((t, i) => (
                  <button key={i} onClick={() => setTimer(t)} style={{
                    flex: 1, padding: '10px 4px', borderRadius: '12px', border: 'none', cursor: 'pointer',
                    backgroundColor: timer === t ? '#7C8FD4' : 'rgba(255,255,255,0.06)',
                    color: timer === t ? '#FDFAF6' : '#8A8FA8',
                    fontSize: '12px', fontFamily: 'var(--font-inter)',
                    transition: 'all 0.2s ease',
                  }}>
                    {t === null ? 'Alltid på' : `${t} min`}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {aktivTab === 'scener' && (
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
                    {s.id === 'maaneskinn' ? '🌙' : s.id === 'varm' ? '🕯️' : s.id === 'stjernehimmel' ? '✨' : '🌊'}
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
        )}

        {/* Start-knapp */}
        <button
          onClick={() => {
            if (aktivTab === 'scener' && !valgtScenario) setValgtScenario(SCENARIER[0]);
            setAktivtNattlys(true);
          }}
          style={{
            width: '100%', padding: '16px', borderRadius: '20px', border: 'none', cursor: 'pointer',
            background: 'linear-gradient(135deg, #4A5580 0%, #7C8FD4 100%)',
            color: '#FDFAF6', fontSize: '15px', fontWeight: '600',
            fontFamily: 'var(--font-inter)',
            boxShadow: '0 4px 20px rgba(124,143,212,0.3)',
          }}>
          Slå på nattlys 🌙
        </button>
      </div>
    </div>
  );
}