'use client';
import { farger } from '../../lib/farger';
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

type Props = {
  bruker: any;
};

const dagensdato = () => new Date().toISOString().split('T')[0];

export default function Sovn({ bruker }: Props) {
  const [visning, setVisning] = useState<'velg' | 'lurAktiv' | 'nattAktiv'>('velg');
  const [startTid, setStartTid] = useState<Date | null>(null);
  const [minutter, setMinutter] = useState(0);
  const [sekunder, setSekunder] = useState(0);
  const [søvnType, setSøvnType] = useState<'lur' | 'natt' | null>(null);

  useEffect(() => {
    const lagretStartTid = localStorage.getItem('lille_starttid');
    const lagretType = localStorage.getItem('lille_sovtype');
    if (lagretStartTid && lagretType) {
      setStartTid(new Date(lagretStartTid));
      setSøvnType(lagretType as 'lur' | 'natt');
      setVisning(lagretType === 'natt' ? 'nattAktiv' : 'lurAktiv');
    }
  }, []);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined;
    if (startTid && (visning === 'lurAktiv' || visning === 'nattAktiv')) {
      interval = setInterval(() => {
        const diff = Math.floor((Date.now() - startTid.getTime()) / 1000);
        setMinutter(Math.floor(diff / 60));
        setSekunder(diff % 60);
      }, 1000);
    }
    return () => { if (interval) clearInterval(interval); };
  }, [startTid, visning]);

  const startSøvn = (type: 'lur' | 'natt') => {
    const nå = new Date();
    setStartTid(nå);
    setSøvnType(type);
    setVisning(type === 'natt' ? 'nattAktiv' : 'lurAktiv');
    localStorage.setItem('lille_starttid', nå.toISOString());
    localStorage.setItem('lille_sovtype', type);
  };

  const justerStartTid = (min: number) => {
    if (!startTid) return;
    const nyTid = new Date(startTid.getTime() - min * 60 * 1000);
    setStartTid(nyTid);
    localStorage.setItem('lille_starttid', nyTid.toISOString());
  };

  const stoppSøvn = async () => {
    if (!startTid || !søvnType) return;
    const slutt = new Date();
    const diff = Math.floor((slutt.getTime() - startTid.getTime()) / 1000);
    await supabase.from('lurer').insert({
      profil_id: bruker?.id,
      dato: dagensdato(),
      type: søvnType,
      start: startTid.toLocaleTimeString('no-NO', { hour: '2-digit', minute: '2-digit' }),
      slutt: slutt.toLocaleTimeString('no-NO', { hour: '2-digit', minute: '2-digit' }),
      varighet: Math.floor(diff / 60),
      signaler: '',
    });
    localStorage.removeItem('lille_starttid');
    localStorage.removeItem('lille_sovtype');
    setStartTid(null);
    setSøvnType(null);
    setVisning('velg');
  };

  if (visning === 'velg') {
    return (
      <div style={{ padding: '24px' }}>
        <div style={{ fontSize: '11px', letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: 'var(--font-inter)', color: farger.tekstLys, marginBottom: '8px' }}>Søvn</div>
        <div style={{ fontSize: '24px', fontFamily: 'var(--font-plus-jakarta)', color: farger.tekst, marginBottom: '8px' }}>Hva slags søvn skal du registrere?</div>
        <div style={{ fontSize: '14px', fontFamily: 'var(--font-inter)', color: farger.tekstLys, marginBottom: '32px' }}>Velg type for best mulig innsikt</div>

        {/* Lur */}
        <button onClick={() => startSøvn('lur')} style={{ width: '100%', padding: '20px', backgroundColor: farger.hvit, border: `1px solid ${farger.kremMørk}`, borderRadius: '16px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '16px', cursor: 'pointer', textAlign: 'left' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: '#FFF3E8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <circle cx="14" cy="14" r="10" fill="#F4A853" opacity="0.8"/>
              <circle cx="14" cy="14" r="6" fill="#F4A853"/>
              {[0,45,90,135,180,225,270,315].map((deg, i) => (
                <line key={i} x1="14" y1="2" x2="14" y2="5" stroke="#F4A853" strokeWidth="2" strokeLinecap="round" transform={`rotate(${deg} 14 14)`} opacity="0.6"/>
              ))}
            </svg>
          </div>
          <div>
            <div style={{ fontSize: '16px', fontFamily: 'var(--font-plus-jakarta)', color: farger.tekst, marginBottom: '2px' }}>Lur</div>
            <div style={{ fontSize: '13px', fontFamily: 'var(--font-inter)', color: farger.tekstLys }}>Dagtidssøvn</div>
          </div>
          <div style={{ marginLeft: 'auto', color: farger.tekstLys }}>›</div>
        </button>

        {/* Natt */}
        <button onClick={() => startSøvn('natt')} style={{ width: '100%', padding: '20px', backgroundColor: farger.hvit, border: `1px solid ${farger.kremMørk}`, borderRadius: '16px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '16px', cursor: 'pointer', textAlign: 'left' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <path d="M22 15C21.1 19.6 17 23 12 23C6.5 23 2 18.5 2 13C2 8 5.4 3.9 10 3C7 6 7 11.5 10.5 15C14 18.5 19 18.5 22 15Z" fill="#7C8FD4"/>
              <circle cx="19" cy="6" r="1.5" fill="#7C8FD4" opacity="0.5"/>
              <circle cx="23" cy="10" r="1" fill="#7C8FD4" opacity="0.4"/>
            </svg>
          </div>
          <div>
            <div style={{ fontSize: '16px', fontFamily: 'var(--font-plus-jakarta)', color: farger.tekst, marginBottom: '2px' }}>Natta</div>
            <div style={{ fontSize: '13px', fontFamily: 'var(--font-inter)', color: farger.tekstLys }}>Nattesøvn</div>
          </div>
          <div style={{ marginLeft: 'auto', color: farger.tekstLys }}>›</div>
        </button>

        {/* Tips */}
        <div style={{ backgroundColor: farger.terrakottaLys, borderRadius: '16px', padding: '16px', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
          <span style={{ fontSize: '20px' }}>💡</span>
          <div>
            <div style={{ fontSize: '13px', fontFamily: 'var(--font-plus-jakarta)', color: farger.tekst, marginBottom: '4px' }}>Tips</div>
            <div style={{ fontSize: '12px', fontFamily: 'var(--font-inter)', color: farger.tekstLys, lineHeight: 1.6 }}>Ved å registrere riktig søvntype får du mer treffsikre innsikter.</div>
          </div>
        </div>
      </div>
    );
  }

  if (visning === 'lurAktiv') {
    return (
      <div style={{ padding: '24px' }}>
        <button onClick={() => setVisning('velg')} style={{ background: 'none', border: 'none', color: farger.tekstLys, cursor: 'pointer', fontSize: '24px', marginBottom: '16px' }}>‹</button>
        <div style={{ backgroundColor: farger.grønn, borderRadius: '24px', padding: '32px', textAlign: 'center', marginBottom: '16px' }}>
          <div style={{ fontSize: '12px', letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: 'var(--font-inter)', color: '#9FD4B8', marginBottom: '8px' }}>Lur pågår</div>
          <div style={{ fontSize: '52px', fontFamily: 'var(--font-plus-jakarta)', color: '#FDFAF6', fontWeight: '700', marginBottom: '4px' }}>
            {minutter} min
          </div>
          <div style={{ fontSize: '20px', fontFamily: 'var(--font-inter)', color: '#9FD4B8', marginBottom: '4px' }}>
            {sekunder < 10 ? '0' : ''}{sekunder} sek
          </div>
          <div style={{ fontSize: '13px', fontFamily: 'var(--font-inter)', color: '#9FD4B8', marginBottom: '24px' }}>
            Startet kl. {startTid?.toLocaleTimeString('no-NO', { hour: '2-digit', minute: '2-digit' })}
          </div>

          {/* Juster starttid */}
          <div style={{ marginBottom: '20px' }}>
            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)', fontFamily: 'var(--font-inter)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '8px' }}>Juster starttid</div>
            <div style={{ display: 'flex', gap: '8px' }}>
              {[5, 10, 15, 30].map(min => (
                <button key={min} onClick={() => justerStartTid(min)} style={{ flex: 1, padding: '8px 0', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.25)', backgroundColor: 'rgba(255,255,255,0.1)', color: '#FDFAF6', fontSize: '12px', fontFamily: 'var(--font-inter)', cursor: 'pointer' }}>
                  -{min}m
                </button>
              ))}
            </div>
          </div>

          <button onClick={stoppSøvn} style={{ width: '100%', padding: '16px', backgroundColor: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)', borderRadius: '12px', fontSize: '14px', fontWeight: '600', fontFamily: 'var(--font-inter)', color: '#FDFAF6', cursor: 'pointer' }}>
            Avslutt lur
          </button>
        </div>
      </div>
    );
  }

  if (visning === 'nattAktiv') {
    return (
      <div style={{ backgroundColor: '#1A1F2E', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 24px', position: 'fixed', inset: 0, zIndex: 50 }}>
        <style>{`@keyframes twinkle { 0%,100%{opacity:0.3} 50%{opacity:1} }`}</style>
        {[...Array(20)].map((_, i) => (
          <div key={i} style={{ position: 'absolute', width: '2px', height: '2px', borderRadius: '50%', backgroundColor: '#C4A882', left: `${Math.random() * 100}%`, top: `${Math.random() * 60}%`, animation: `twinkle ${1 + Math.random() * 2}s ${Math.random() * 2}s infinite` }} />
        ))}
        <svg width="100" height="100" viewBox="0 0 100 100" style={{ marginBottom: '24px', filter: 'drop-shadow(0 0 20px rgba(196,168,130,0.5))' }}>
          <path d="M 60 15 C 42 15 28 29 28 50 C 28 71 42 85 60 85 C 48 78 40 65 40 50 C 40 35 48 22 60 15 Z" fill="#E8C87A"/>
        </svg>
        <div style={{ fontSize: '11px', letterSpacing: '0.14em', textTransform: 'uppercase', fontFamily: 'var(--font-inter)', color: '#8A8FA8', marginBottom: '12px' }}>Natta er i gang ✨</div>
        <div style={{ fontSize: '52px', fontFamily: 'var(--font-plus-jakarta)', color: '#C4A882', fontWeight: '700', marginBottom: '4px' }}>{minutter} min</div>
        <div style={{ fontSize: '14px', fontFamily: 'var(--font-inter)', color: '#8A8FA8', marginBottom: '8px' }}>Har sovnet kl. {startTid?.toLocaleTimeString('no-NO', { hour: '2-digit', minute: '2-digit' })}</div>

        <div style={{ width: '100%', maxWidth: '360px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '16px', padding: '16px', marginBottom: '16px', marginTop: '16px' }}>
          <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', fontFamily: 'var(--font-inter)', marginBottom: '8px' }}>JUSTER STARTTID</div>
          <div style={{ display: 'flex', gap: '8px' }}>
            {[5, 10, 15, 30].map(min => (
              <button key={min} onClick={() => justerStartTid(min)} style={{ flex: 1, padding: '8px 0', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.15)', backgroundColor: 'rgba(255,255,255,0.08)', color: '#C4A882', fontSize: '12px', fontFamily: 'var(--font-inter)', cursor: 'pointer' }}>
                -{min}m
              </button>
            ))}
          </div>
        </div>

        <button onClick={stoppSøvn} style={{ width: '100%', maxWidth: '360px', padding: '16px', backgroundColor: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '12px', fontSize: '14px', fontFamily: 'var(--font-inter)', color: '#8A8FA8', cursor: 'pointer' }}>
          ☀️ Baby våknet
        </button>
        <div style={{ marginTop: '20px', fontSize: '14px', fontFamily: 'var(--font-inter)', color: '#8A8FA8', fontStyle: 'italic' }}>Sov godt, lille stjerne</div>
      </div>
    );
  }

  return null;
}