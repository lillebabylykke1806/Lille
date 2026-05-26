'use client';
import { farger } from '../../lib/farger';
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

type Props = {
  bruker: any;
};

const dagensdato = () => new Date().toISOString().split('T')[0];

export default function Sovn({ bruker }: Props) {
  const [visning, setVisning] = useState<'velg' | 'lurAktiv' | 'nattAktiv' | 'etterregistrer'>('velg');
  const [startTid, setStartTid] = useState<Date | null>(null);
  const [minutter, setMinutter] = useState(0);
  const [sekunder, setSekunder] = useState(0);
  const [søvnType, setSøvnType] = useState<'lur' | 'natt' | null>(null);
  const [nyDato, setNyDato] = useState(dagensdato());
  const [nyType, setNyType] = useState<'lur' | 'natt'>('lur');
  const [nyStart, setNyStart] = useState('');
  const [nySlutt, setNySlutt] = useState('');

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

  const lagreEtterregistrert = async () => {
    if (!nyStart || !nySlutt) return;
    const [sh, sm] = nyStart.split(':').map(Number);
    const [eh, em] = nySlutt.split(':').map(Number);
    const varighet = (eh * 60 + em) - (sh * 60 + sm);
    if (varighet <= 0) return;
    await supabase.from('lurer').insert({
      profil_id: bruker?.id,
      dato: nyDato,
      type: nyType,
      start: nyStart,
      slutt: nySlutt,
      varighet,
      signaler: '',
    });
    setNyStart('');
    setNySlutt('');
    setVisning('velg');
  };

  if (visning === 'velg') {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        {/* Header med stor måne */}
        <div style={{ marginBottom: '16px', position: 'relative', display: 'inline-block' }}>
          <span style={{ position: 'absolute', top: '-8px', left: '10px', fontSize: '14px', opacity: 0.6 }}>✦</span>
          <span style={{ position: 'absolute', top: '0px', right: '5px', fontSize: '10px', opacity: 0.5 }}>✦</span>
          <svg width="90" height="90" viewBox="0 0 90 90" fill="none">
            <path d="M 55 12 C 37 12 23 26 23 47 C 23 68 37 82 55 82 C 43 75 35 62 35 47 C 35 32 43 19 55 12 Z" fill="#E8C87A"/>
            <circle cx="38" cy="42" r="3" fill="#D4A843" opacity="0.6"/>
            <circle cx="45" cy="55" r="2" fill="#D4A843" opacity="0.4"/>
            <path d="M35 44 Q38 47 41 44" stroke="#D4A843" strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.7"/>
            <circle cx="62" cy="18" r="4" fill="#E8C87A" opacity="0.3"/>
            <circle cx="70" cy="35" r="2.5" fill="#E8C87A" opacity="0.2"/>
          </svg>
        </div>

        <div style={{ fontSize: '22px', fontFamily: 'var(--font-plus-jakarta)', color: farger.tekst, marginBottom: '4px', lineHeight: 1.3 }}>Hva slags søvn<br/>skal du registrere?</div>
        <div style={{ fontSize: '13px', fontFamily: 'var(--font-inter)', color: farger.tekstLys, marginBottom: '28px' }}>Velg type for best mulig innsikt</div>

        {/* Lur */}
        <button onClick={() => startSøvn('lur')} style={{ width: '100%', padding: '18px 20px', backgroundColor: farger.hvit, border: `1px solid ${farger.kremMørk}`, borderRadius: '16px', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '16px', cursor: 'pointer', textAlign: 'left' }}>
          <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
            <circle cx="18" cy="18" r="7" fill="none" stroke="#F4A853" strokeWidth="2"/>
            <line x1="18" y1="3" x2="18" y2="8" stroke="#F4A853" strokeWidth="2" strokeLinecap="round"/>
            <line x1="18" y1="28" x2="18" y2="33" stroke="#F4A853" strokeWidth="2" strokeLinecap="round"/>
            <line x1="3" y1="18" x2="8" y2="18" stroke="#F4A853" strokeWidth="2" strokeLinecap="round"/>
            <line x1="28" y1="18" x2="33" y2="18" stroke="#F4A853" strokeWidth="2" strokeLinecap="round"/>
            <line x1="7" y1="7" x2="11" y2="11" stroke="#F4A853" strokeWidth="2" strokeLinecap="round"/>
            <line x1="25" y1="25" x2="29" y2="29" stroke="#F4A853" strokeWidth="2" strokeLinecap="round"/>
            <line x1="29" y1="7" x2="25" y2="11" stroke="#F4A853" strokeWidth="2" strokeLinecap="round"/>
            <line x1="11" y1="25" x2="7" y2="29" stroke="#F4A853" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          <div>
            <div style={{ fontSize: '16px', fontFamily: 'var(--font-plus-jakarta)', color: farger.tekst, marginBottom: '2px' }}>Lur</div>
            <div style={{ fontSize: '13px', fontFamily: 'var(--font-inter)', color: farger.tekstLys }}>Dagtidssøvn</div>
          </div>
          <div style={{ marginLeft: 'auto', color: farger.tekstLys, fontSize: '20px' }}>›</div>
        </button>

        {/* Natt */}
        <button onClick={() => startSøvn('natt')} style={{ width: '100%', padding: '18px 20px', backgroundColor: farger.hvit, border: `1px solid ${farger.kremMørk}`, borderRadius: '16px', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '16px', cursor: 'pointer', textAlign: 'left' }}>
          <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
            <path d="M28 20C27.1 24.6 23 28 18 28C12.5 28 8 23.5 8 18C8 13 11.4 8.9 16 8C13 11 13 16.5 16.5 20C20 23.5 25 23.5 28 20Z" fill="#5C6BC0"/>
            <circle cx="24" cy="10" r="1.5" fill="#5C6BC0" opacity="0.5"/>
            <circle cx="28" cy="14" r="1" fill="#5C6BC0" opacity="0.4"/>
          </svg>
          <div>
            <div style={{ fontSize: '16px', fontFamily: 'var(--font-plus-jakarta)', color: farger.tekst, marginBottom: '2px' }}>Natta</div>
            <div style={{ fontSize: '13px', fontFamily: 'var(--font-inter)', color: farger.tekstLys }}>Nattesøvn</div>
          </div>
          <div style={{ marginLeft: 'auto', color: farger.tekstLys, fontSize: '20px' }}>›</div>
        </button>

        {/* Etterregistrer */}
        <button onClick={() => setVisning('etterregistrer')} style={{ width: '100%', padding: '18px 20px', backgroundColor: farger.hvit, border: `1px solid ${farger.kremMørk}`, borderRadius: '16px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '16px', cursor: 'pointer', textAlign: 'left' }}>
          <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
            <circle cx="18" cy="18" r="12" stroke={farger.grønn} strokeWidth="1.8" fill="none"/>
            <line x1="18" y1="11" x2="18" y2="18" stroke={farger.grønn} strokeWidth="2" strokeLinecap="round"/>
            <line x1="18" y1="18" x2="23" y2="21" stroke={farger.grønn} strokeWidth="2" strokeLinecap="round"/>
            <path d="M8 8L12 12" stroke={farger.grønn} strokeWidth="1.5" strokeLinecap="round"/>
            <path d="M6 14H10" stroke={farger.grønn} strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          <div>
            <div style={{ fontSize: '16px', fontFamily: 'var(--font-plus-jakarta)', color: farger.tekst, marginBottom: '2px' }}>Legg til tidligere</div>
            <div style={{ fontSize: '13px', fontFamily: 'var(--font-inter)', color: farger.tekstLys }}>Etterregistrer søvn</div>
          </div>
          <div style={{ marginLeft: 'auto', color: farger.tekstLys, fontSize: '20px' }}>›</div>
        </button>

        {/* Tips */}
        <div style={{ backgroundColor: farger.terrakottaLys, borderRadius: '16px', padding: '16px', display: 'flex', gap: '12px', alignItems: 'flex-start', textAlign: 'left' }}>
          <span style={{ fontSize: '18px' }}>💡</span>
          <div>
            <div style={{ fontSize: '13px', fontFamily: 'var(--font-plus-jakarta)', color: farger.tekst, marginBottom: '4px' }}>Tips</div>
            <div style={{ fontSize: '12px', fontFamily: 'var(--font-inter)', color: farger.tekstLys, lineHeight: 1.6 }}>Ved å registrere riktig søvntype får du mer treffsikre innsikter.</div>
          </div>
        </div>
      </div>
    );
  }

  if (visning === 'etterregistrer') {
    return (
      <div style={{ padding: '24px' }}>
        <button onClick={() => setVisning('velg')} style={{ background: 'none', border: 'none', color: farger.tekstLys, cursor: 'pointer', fontSize: '24px', marginBottom: '16px' }}>‹</button>
        <div style={{ fontSize: '22px', fontFamily: 'var(--font-plus-jakarta)', color: farger.tekst, marginBottom: '24px' }}>Legg til tidligere søvn</div>

        <div style={{ backgroundColor: farger.hvit, border: `1px solid ${farger.kremMørk}`, borderRadius: '16px', padding: '20px', marginBottom: '16px' }}>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
            {(['lur', 'natt'] as const).map(t => (
              <button key={t} onClick={() => setNyType(t)} style={{ flex: 1, padding: '10px', borderRadius: '10px', border: nyType === t ? `2px solid ${farger.grønn}` : `1px solid ${farger.kremMørk}`, backgroundColor: nyType === t ? farger.grønnLys : farger.bakgrunn, color: nyType === t ? farger.grønn : farger.tekstLys, fontSize: '13px', fontFamily: 'var(--font-inter)', cursor: 'pointer', fontWeight: nyType === t ? '600' : '400' }}>
                {t === 'lur' ? 'Lur' : 'Nattesøvn'}
              </button>
            ))}
          </div>

          <div style={{ fontSize: '11px', letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: 'var(--font-inter)', color: farger.tekstLys, marginBottom: '8px' }}>Dato</div>
          <input type="date" value={nyDato} onChange={e => setNyDato(e.target.value)} style={{ width: '100%', padding: '10px 14px', fontSize: '14px', border: `1px solid ${farger.kremMørk}`, borderRadius: '10px', backgroundColor: farger.bakgrunn, color: farger.tekst, marginBottom: '14px', outline: 'none', fontFamily: 'var(--font-inter)', boxSizing: 'border-box' }} />

          <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '11px', letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: 'var(--font-inter)', color: farger.tekstLys, marginBottom: '8px' }}>Starttid</div>
              <input type="time" value={nyStart} onChange={e => setNyStart(e.target.value)} style={{ width: '100%', padding: '10px 14px', fontSize: '14px', border: `1px solid ${farger.kremMørk}`, borderRadius: '10px', backgroundColor: farger.bakgrunn, color: farger.tekst, outline: 'none', fontFamily: 'var(--font-inter)', boxSizing: 'border-box' }} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '11px', letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: 'var(--font-inter)', color: farger.tekstLys, marginBottom: '8px' }}>Sluttid</div>
              <input type="time" value={nySlutt} onChange={e => setNySlutt(e.target.value)} style={{ width: '100%', padding: '10px 14px', fontSize: '14px', border: `1px solid ${farger.kremMørk}`, borderRadius: '10px', backgroundColor: farger.bakgrunn, color: farger.tekst, outline: 'none', fontFamily: 'var(--font-inter)', boxSizing: 'border-box' }} />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={() => setVisning('velg')} style={{ flex: 1, padding: '12px', backgroundColor: 'transparent', border: `1px solid ${farger.kremMørk}`, borderRadius: '10px', fontSize: '13px', color: farger.tekstLys, cursor: 'pointer', fontFamily: 'var(--font-inter)' }}>Avbryt</button>
            <button onClick={lagreEtterregistrert} style={{ flex: 1, padding: '12px', backgroundColor: farger.grønn, border: 'none', borderRadius: '10px', fontSize: '13px', fontWeight: '600', color: '#FDFAF6', cursor: 'pointer', fontFamily: 'var(--font-inter)' }}>Lagre</button>
          </div>
        </div>
      </div>
    );
  }

  if (visning === 'lurAktiv') {
    return (
      <div style={{ padding: '24px' }}>
        <button onClick={() => setVisning('velg')} style={{ background: 'none', border: 'none', color: farger.tekstLys, cursor: 'pointer', fontSize: '24px', marginBottom: '16px' }}>‹</button>
        <div style={{ backgroundColor: farger.grønn, borderRadius: '24px', padding: '32px', textAlign: 'center' }}>
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
        <div style={{ fontSize: '14px', fontFamily: 'var(--font-inter)', color: '#8A8FA8', marginBottom: '24px' }}>Har sovnet kl. {startTid?.toLocaleTimeString('no-NO', { hour: '2-digit', minute: '2-digit' })}</div>

        <div style={{ width: '100%', maxWidth: '360px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '16px', padding: '16px', marginBottom: '16px' }}>
          <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', fontFamily: 'var(--font-inter)', marginBottom: '8px', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Juster starttid</div>
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