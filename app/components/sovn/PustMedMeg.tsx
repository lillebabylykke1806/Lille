'use client';
import { useState, useEffect, useRef } from 'react';

type Props = { onLukk: () => void; };

type Øvelse = {
  id: string;
  navn: string;
  beskrivelse: string;
  innPust: number;
  hold: number;
  utPust: number;
};

const ØVELSER: Øvelse[] = [
  { id: 'rolig', navn: 'Rolig pust', beskrivelse: '4 sek inn – 6 sek ut', innPust: 4, hold: 0, utPust: 6 },
  { id: '478', navn: '4-7-8 pust', beskrivelse: '4 sek inn – 7 sek hold – 8 sek ut', innPust: 4, hold: 7, utPust: 8 },
  { id: 'boks', navn: 'Boks pust', beskrivelse: '4 sek inn – 4 sek hold – 4 sek ut', innPust: 4, hold: 4, utPust: 4 },
];

export default function PustMedMeg({ onLukk }: Props) {
  const [fase, setFase] = useState<'velg' | 'puster'>('velg');
  const [valgtØvelse, setValgtØvelse] = useState(ØVELSER[0]);
  const [varighet, setVarighet] = useState(5);
  const [pusteFase, setPusteFase] = useState<'inn' | 'hold' | 'ut'>('inn');
  const [sekunder, setSekunder] = useState(0);
  const [totaltGjenstår, setTotaltGjenstår] = useState(0);
  const [sirkelStr, setSirkelStr] = useState(0.3);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (fase === 'puster') {
      setTotaltGjenstår(varighet * 60);
      startPust();
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [fase]);

  const startPust = () => {
    const øvelse = valgtØvelse;
    let faseNå: 'inn' | 'hold' | 'ut' = 'inn';
    let sekNå = 0;
    let totalt = varighet * 60;

    setPusteFase('inn');
    setSekunder(øvelse.innPust);
    setSirkelStr(0.3);

    intervalRef.current = setInterval(() => {
      sekNå++;
      totalt--;
      setTotaltGjenstår(totalt);

      if (totalt <= 0) {
        if (intervalRef.current) clearInterval(intervalRef.current);
        setFase('velg');
        return;
      }

      const faselengde = faseNå === 'inn' ? øvelse.innPust : faseNå === 'hold' ? øvelse.hold : øvelse.utPust;

      if (sekNå >= faselengde) {
        sekNå = 0;
        if (faseNå === 'inn') {
          faseNå = øvelse.hold > 0 ? 'hold' : 'ut';
        } else if (faseNå === 'hold') {
          faseNå = 'ut';
        } else {
          faseNå = 'inn';
        }
        setPusteFase(faseNå);
        setSekunder(faseNå === 'inn' ? øvelse.innPust : faseNå === 'hold' ? øvelse.hold : øvelse.utPust);
        setSirkelStr(faseNå === 'inn' ? 0.3 : faseNå === 'hold' ? 1 : 1);
      } else {
        setSekunder(prev => prev - 1);
        if (faseNå === 'inn') setSirkelStr(0.3 + (sekNå / faselengde) * 0.7);
        else if (faseNå === 'ut') setSirkelStr(1 - (sekNå / faselengde) * 0.7);
      }
    }, 1000);
  };

  const minutter = Math.floor(totaltGjenstår / 60);
  const sek = totaltGjenstår % 60;

  if (fase === 'velg') {
    return (
      <div style={{ position: 'fixed', inset: 0, zIndex: 200, backgroundColor: '#0D1B3E', display: 'flex', flexDirection: 'column', padding: '24px' }}>
        <style>{`@keyframes pustInn { 0%{transform:scale(0.3)} 100%{transform:scale(1)} } @keyframes pustUt { 0%{transform:scale(1)} 100%{transform:scale(0.3)} }`}</style>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <button onClick={onLukk} style={{ background: 'none', border: 'none', color: '#8A8FA8', cursor: 'pointer', fontSize: '24px' }}>✕</button>
          <div style={{ fontSize: '18px', fontFamily: 'var(--font-plus-jakarta)', color: '#E8DDD0', fontWeight: '600' }}>Pust med meg</div>
          <div style={{ width: '32px' }} />
        </div>

        {/* Sirkelpreview */}
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '32px', height: '200px' }}>
          <div style={{ position: 'relative', width: '180px', height: '180px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ position: 'absolute', width: '180px', height: '180px', borderRadius: '50%', background: 'radial-gradient(ellipse, rgba(124,100,200,0.15) 0%, transparent 70%)', filter: 'blur(10px)' }} />
            <div style={{ width: '120px', height: '120px', borderRadius: '50%', background: 'radial-gradient(ellipse, rgba(124,100,200,0.4) 0%, rgba(60,50,150,0.6) 100%)', boxShadow: '0 0 30px rgba(124,100,200,0.4), 0 0 60px rgba(124,100,200,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ fontSize: '13px', fontFamily: 'var(--font-inter)', color: 'rgba(255,255,255,0.7)' }}>Finn ro</div>
            </div>
          </div>
        </div>

        {/* Velg øvelse */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '24px' }}>
          {ØVELSER.map(ø => (
            <button key={ø.id} onClick={() => setValgtØvelse(ø)} style={{
              padding: '16px', borderRadius: '16px', border: 'none', cursor: 'pointer',
              backgroundColor: valgtØvelse.id === ø.id ? 'rgba(124,100,200,0.2)' : 'rgba(255,255,255,0.04)',
              borderWidth: '1px', borderStyle: 'solid',
              borderColor: valgtØvelse.id === ø.id ? 'rgba(124,100,200,0.5)' : 'rgba(255,255,255,0.08)',
              display: 'flex', alignItems: 'center', gap: '12px', textAlign: 'left',
            }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: valgtØvelse.id === ø.id ? '#9B7FE8' : 'rgba(255,255,255,0.2)', flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: '14px', fontFamily: 'var(--font-plus-jakarta)', color: '#E8DDD0', fontWeight: '500', marginBottom: '2px' }}>{ø.navn}</div>
                <div style={{ fontSize: '12px', fontFamily: 'var(--font-inter)', color: '#8A8FA8' }}>{ø.beskrivelse}</div>
              </div>
            </button>
          ))}
        </div>

        {/* Varighet */}
        <div style={{ marginBottom: '28px' }}>
          <div style={{ fontSize: '13px', fontFamily: 'var(--font-inter)', color: '#E8DDD0', marginBottom: '10px' }}>Varighet</div>
          <div style={{ display: 'flex', gap: '8px' }}>
            {[2, 5, 10].map(v => (
              <button key={v} onClick={() => setVarighet(v)} style={{
                flex: 1, padding: '10px', borderRadius: '12px', border: 'none', cursor: 'pointer',
                backgroundColor: varighet === v ? '#7C6FD4' : 'rgba(255,255,255,0.06)',
                color: varighet === v ? '#FDFAF6' : '#8A8FA8',
                fontSize: '13px', fontFamily: 'var(--font-inter)',
              }}>
                {v} min
              </button>
            ))}
          </div>
        </div>

        <button onClick={() => setFase('puster')} style={{
          width: '100%', padding: '16px', borderRadius: '20px', border: 'none', cursor: 'pointer',
          background: 'linear-gradient(135deg, #5A3A9E 0%, #9B7FE8 100%)',
          color: '#FDFAF6', fontSize: '15px', fontWeight: '600', fontFamily: 'var(--font-inter)',
          boxShadow: '0 4px 20px rgba(124,100,200,0.4)',
        }}>
          Start øvelse
        </button>
      </div>
    );
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 200, backgroundColor: '#0D1540', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ position: 'absolute', top: '24px', left: '24px' }}>
        <button onClick={() => { if (intervalRef.current) clearInterval(intervalRef.current); setFase('velg'); }} style={{ background: 'none', border: 'none', color: '#8A8FA8', cursor: 'pointer', fontSize: '24px' }}>✕</button>
      </div>

      <div style={{ fontSize: '14px', fontFamily: 'var(--font-plus-jakarta)', color: '#E8DDD0', fontWeight: '600', marginBottom: '8px' }}>{valgtØvelse.navn}</div>

      {/* Pustefase tekst */}
      <div style={{ fontSize: '22px', fontFamily: 'var(--font-plus-jakarta)', color: '#FDFAF6', fontWeight: '300', marginBottom: '40px', letterSpacing: '0.05em' }}>
        {pusteFase === 'inn' ? 'Pust inn' : pusteFase === 'hold' ? 'Hold' : 'Pust ut'}
      </div>

      {/* Pustesirkel */}
      <div style={{ position: 'relative', width: '260px', height: '260px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '48px' }}>
        {/* Ytre glow */}
        <div style={{
          position: 'absolute',
          width: `${260 * sirkelStr}px`,
          height: `${260 * sirkelStr}px`,
          borderRadius: '50%',
          background: 'radial-gradient(ellipse, rgba(124,100,200,0.2) 0%, transparent 70%)',
          filter: 'blur(20px)',
          transition: 'width 1s ease, height 1s ease',
        }} />
        {/* Midtre ring */}
        <div style={{
          position: 'absolute',
          width: `${220 * sirkelStr}px`,
          height: `${220 * sirkelStr}px`,
          borderRadius: '50%',
          border: '1px solid rgba(155,127,232,0.3)',
          transition: 'width 1s ease, height 1s ease',
        }} />
        {/* Kjerne */}
        <div style={{
          width: `${180 * sirkelStr}px`,
          height: `${180 * sirkelStr}px`,
          borderRadius: '50%',
          background: 'radial-gradient(ellipse, rgba(124,100,200,0.6) 0%, rgba(60,30,150,0.8) 100%)',
          boxShadow: '0 0 40px rgba(124,100,200,0.5), 0 0 80px rgba(124,100,200,0.2)',
          transition: 'width 1s ease, height 1s ease',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{ fontSize: '28px', fontFamily: 'var(--font-plus-jakarta)', color: 'rgba(255,255,255,0.9)', fontWeight: '300' }}>{sekunder}</div>
        </div>
      </div>

      {/* Timer */}
      <div style={{ fontSize: '32px', fontFamily: 'var(--font-plus-jakarta)', color: 'rgba(255,255,255,0.6)', fontWeight: '300', marginBottom: '32px' }}>
        {String(minutter).padStart(2, '0')}:{String(sek).padStart(2, '0')}
      </div>

      <button onClick={() => { if (intervalRef.current) clearInterval(intervalRef.current); setFase('velg'); }} style={{
        padding: '14px 32px', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.12)',
        backgroundColor: 'rgba(255,255,255,0.06)', color: '#8A8FA8',
        fontSize: '14px', fontFamily: 'var(--font-inter)', cursor: 'pointer',
      }}>
        Avslutt øvelse
      </button>
    </div>
  );
}