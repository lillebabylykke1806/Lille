'use client';
import { farger } from '../../lib/farger';
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

type Props = {
  bruker: any;
};

const dagensdato = () => new Date().toISOString().split('T')[0];

const GlitterOvergang = ({ onDone }: { onDone: () => void }) => {
  const partikler = Array.from({ length: 80 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    størrelse: Math.random() * 4 + 1,
    forsinkelse: Math.random() * 1.5,
    farge: ['#C4A882', '#E8DDD0', '#F5E6C8', '#9FD4B8', '#FDFAF6'][Math.floor(Math.random() * 5)],
  }));

  useEffect(() => {
    const timer = setTimeout(onDone, 2500);
    return () => clearTimeout(timer);
  }, [onDone]);

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, pointerEvents: 'none', overflow: 'hidden' }}>
      <style>{`
        @keyframes glitterFall {
          0% { transform: translateY(-20px) scale(0); opacity: 0; }
          20% { opacity: 1; transform: translateY(0) scale(1); }
          100% { transform: translateY(110vh) rotate(360deg); opacity: 0; }
        }
        @keyframes bgDark {
          0% { background: rgba(26,31,46,0); }
          100% { background: rgba(26,31,46,0.95); }
        }
      `}</style>
      <div style={{ position: 'absolute', inset: 0, animation: 'bgDark 1.5s ease forwards' }} />
      {partikler.map(p => (
        <div key={p.id} style={{
          position: 'absolute',
          left: `${p.x}%`, top: `${p.y}%`,
          width: `${p.størrelse}px`, height: `${p.størrelse}px`,
          borderRadius: '50%',
          backgroundColor: p.farge,
          boxShadow: `0 0 ${p.størrelse * 2}px ${p.farge}`,
          animation: `glitterFall 2s ${p.forsinkelse}s ease-in forwards`,
        }} />
      ))}
    </div>
  );
};

export default function Sovn({ bruker }: Props) {
  const [visning, setVisning] = useState<'velg' | 'lurAktiv' | 'nattAktiv' | 'etterregistrer'>('velg');
  const [startTid, setStartTid] = useState<Date | null>(null);
  const [minutter, setMinutter] = useState(0);
  const [sekunder, setSekunder] = useState(0);
  const [søvnType, setSøvnType] = useState<'lur' | 'natt' | null>(null);
  const [visGlitter, setVisGlitter] = useState(false);
  const [visJusterTid, setVisJusterTid] = useState(false);
  const [nyTidStr, setNyTidStr] = useState('');
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
    localStorage.setItem('lille_starttid', nå.toISOString());
    localStorage.setItem('lille_sovtype', type);
    if (type === 'natt') {
      setVisGlitter(true);
      setTimeout(() => {
        setVisGlitter(false);
        setVisning('nattAktiv');
      }, 2500);
    } else {
      setVisning('lurAktiv');
    }
  };

  const justerStartTidManuelt = () => {
    if (!nyTidStr || !startTid) return;
    const [h, m] = nyTidStr.split(':').map(Number);
    const nyTid = new Date(startTid);
    nyTid.setHours(h, m, 0, 0);
    if (nyTid > new Date()) return;
    setStartTid(nyTid);
    localStorage.setItem('lille_starttid', nyTid.toISOString());
    setVisJusterTid(false);
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

  // Sirkulær timer SVG
  const CircularTimer = ({ dark = false }: { dark?: boolean }) => {
    const radius = 100;
    const circumference = 2 * Math.PI * radius;
    const progress = Math.min((minutter % 60) / 60, 1);
    const strokeDashoffset = circumference - progress * circumference;
    return (
      <div style={{ position: 'relative', width: '240px', height: '240px', margin: '0 auto 24px' }}>
        <svg width="240" height="240" viewBox="0 0 240 240">
          <circle cx="120" cy="120" r="100" fill="none" stroke={dark ? 'rgba(255,255,255,0.1)' : farger.kremMørk} strokeWidth="8"/>
          <circle cx="120" cy="120" r="100" fill="none"
            stroke={dark ? '#7C8FD4' : farger.grønn}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            transform="rotate(-90 120 120)"
            style={{ transition: 'stroke-dashoffset 1s linear' }}
          />
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ fontSize: '13px', fontFamily: 'var(--font-inter)', color: dark ? '#8A8FA8' : farger.tekstLys, marginBottom: '8px' }}>
            {dark ? 'Natta pågår' : 'Luren pågår'}
          </div>
          <div style={{ fontSize: '48px', fontFamily: 'var(--font-plus-jakarta)', color: dark ? '#FDFAF6' : farger.tekst, fontWeight: '700', lineHeight: 1 }}>
            {String(Math.floor(minutter / 60)).padStart(2, '0')}:{String(minutter % 60).padStart(2, '0')}
          </div>
          <div style={{ fontSize: '16px', fontFamily: 'var(--font-inter)', color: dark ? '#8A8FA8' : farger.tekstLys, marginTop: '4px' }}>
            {String(sekunder).padStart(2, '0')} sek
          </div>
        </div>
      </div>
    );
  };

  if (visGlitter) {
    return <GlitterOvergang onDone={() => {}} />;
  }

  if (visning === 'velg') {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <div style={{ marginBottom: '16px', position: 'relative', display: 'inline-block' }}>
          <span style={{ position: 'absolute', top: '-8px', left: '10px', fontSize: '14px', opacity: 0.6 }}>✦</span>
          <span style={{ position: 'absolute', top: '0px', right: '5px', fontSize: '10px', opacity: 0.5 }}>✦</span>
          <svg width="90" height="90" viewBox="0 0 90 90" fill="none">
            <path d="M 55 12 C 37 12 23 26 23 47 C 23 68 37 82 55 82 C 43 75 35 62 35 47 C 35 32 43 19 55 12 Z" fill="#E8C87A"/>
            <circle cx="38" cy="42" r="3" fill="#D4A843" opacity="0.6"/>
            <circle cx="45" cy="55" r="2" fill="#D4A843" opacity="0.4"/>
            <path d="M35 44 Q38 47 41 44" stroke="#D4A843" strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.7"/>
          </svg>
        </div>

        <div style={{ fontSize: '22px', fontFamily: 'var(--font-plus-jakarta)', color: farger.tekst, marginBottom: '4px', lineHeight: 1.3 }}>Hva slags søvn<br/>skal du registrere?</div>
        <div style={{ fontSize: '13px', fontFamily: 'var(--font-inter)', color: farger.tekstLys, marginBottom: '28px' }}>Velg type for best mulig innsikt</div>

        {/* Lur */}
        <div style={{ marginBottom: '10px' }}>
          <button onClick={() => startSøvn('lur')} style={{ width: '100%', padding: '18px 20px', backgroundColor: farger.hvit, border: `1px solid ${farger.kremMørk}`, borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '16px', cursor: 'pointer', textAlign: 'left' }}>
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
          {/* Etterregistrer lur */}
          <button onClick={() => { setNyType('lur'); setVisning('etterregistrer'); }} style={{ marginTop: '6px', marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '4px', background: 'none', border: 'none', cursor: 'pointer', color: farger.tekstLys, fontSize: '12px', fontFamily: 'var(--font-inter)', padding: '4px 8px' }}>
            <span style={{ fontSize: '16px' }}>+</span> Legg til tidligere lur
          </button>
        </div>

        {/* Natt */}
        <div style={{ marginBottom: '20px' }}>
          <button onClick={() => startSøvn('natt')} style={{ width: '100%', padding: '18px 20px', backgroundColor: farger.hvit, border: `1px solid ${farger.kremMørk}`, borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '16px', cursor: 'pointer', textAlign: 'left' }}>
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
          <button onClick={() => { setNyType('natt'); setVisning('etterregistrer'); }} style={{ marginTop: '6px', marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '4px', background: 'none', border: 'none', cursor: 'pointer', color: farger.tekstLys, fontSize: '12px', fontFamily: 'var(--font-inter)', padding: '4px 8px' }}>
            <span style={{ fontSize: '16px' }}>+</span> Legg til tidligere natt
          </button>
        </div>

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
        <div style={{ backgroundColor: farger.hvit, border: `1px solid ${farger.kremMørk}`, borderRadius: '16px', padding: '20px' }}>
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
      <div style={{ padding: '24px', backgroundColor: farger.bakgrunn, minHeight: '100vh' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <button onClick={() => setVisning('velg')} style={{ background: 'none', border: 'none', color: farger.tekstLys, cursor: 'pointer', fontSize: '24px' }}>‹</button>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '14px', fontFamily: 'var(--font-plus-jakarta)', color: farger.tekst, fontWeight: '600', letterSpacing: '0.05em' }}>LUR</div>
            <div style={{ fontSize: '12px', fontFamily: 'var(--font-inter)', color: farger.tekstLys }}>Dagtidssøvn</div>
          </div>
          <div style={{ width: '32px' }} />
        </div>

        <CircularTimer />

        {/* Juster starttid */}
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <button onClick={() => { setNyTidStr(startTid?.toLocaleTimeString('no-NO', { hour: '2-digit', minute: '2-digit' }) || ''); setVisJusterTid(!visJusterTid); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: farger.tekstLys, fontSize: '13px', fontFamily: 'var(--font-inter)', textDecoration: 'underline' }}>
            Startet kl. {startTid?.toLocaleTimeString('no-NO', { hour: '2-digit', minute: '2-digit' })} – endre
          </button>
          {visJusterTid && (
            <div style={{ marginTop: '10px', display: 'flex', gap: '8px', justifyContent: 'center', alignItems: 'center' }}>
              <input type="time" value={nyTidStr} onChange={e => setNyTidStr(e.target.value)} style={{ padding: '8px 12px', fontSize: '16px', border: `1px solid ${farger.kremMørk}`, borderRadius: '10px', backgroundColor: farger.hvit, color: farger.tekst, outline: 'none', fontFamily: 'var(--font-inter)' }} />
              <button onClick={justerStartTidManuelt} style={{ padding: '8px 16px', backgroundColor: farger.grønn, border: 'none', borderRadius: '10px', color: '#fff', fontSize: '13px', cursor: 'pointer', fontFamily: 'var(--font-inter)' }}>OK</button>
            </div>
          )}
        </div>

        {/* Avslutt */}
        <button onClick={stoppSøvn} style={{ width: '100%', padding: '16px', backgroundColor: farger.grønn, border: 'none', borderRadius: '14px', fontSize: '15px', fontWeight: '600', fontFamily: 'var(--font-inter)', color: '#FDFAF6', cursor: 'pointer', marginBottom: '12px' }}>
          Avslutt lur
        </button>

        {/* Oppsummering */}
        <div style={{ backgroundColor: farger.hvit, border: `1px solid ${farger.kremMørk}`, borderRadius: '16px', padding: '16px' }}>
          <div style={{ fontSize: '14px', fontFamily: 'var(--font-plus-jakarta)', color: farger.tekst, marginBottom: '12px' }}>Lur oppsummert så langt</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <div style={{ fontSize: '11px', fontFamily: 'var(--font-inter)', color: farger.tekstLys, marginBottom: '2px' }}>Startet</div>
              <div style={{ fontSize: '16px', fontFamily: 'var(--font-plus-jakarta)', color: farger.tekst }}>{startTid?.toLocaleTimeString('no-NO', { hour: '2-digit', minute: '2-digit' })}</div>
            </div>
            <div>
              <div style={{ fontSize: '11px', fontFamily: 'var(--font-inter)', color: farger.tekstLys, marginBottom: '2px' }}>Sovet</div>
              <div style={{ fontSize: '16px', fontFamily: 'var(--font-plus-jakarta)', color: farger.tekst }}>{String(Math.floor(minutter / 60)).padStart(2, '0')}:{String(minutter % 60).padStart(2, '0')}</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (visning === 'nattAktiv') {
    return (
      <div style={{ backgroundColor: '#1A1F2E', minHeight: '100vh', display: 'flex', flexDirection: 'column', padding: '24px', position: 'fixed', inset: 0, zIndex: 50, overflowY: 'auto' }}>
        <style>{`
          @keyframes twinkle { 0%,100%{opacity:0.2} 50%{opacity:1} }
          @keyframes glitterFall {
            0% { transform: translateY(-20px) scale(0); opacity: 0; }
            20% { opacity: 1; }
            100% { transform: translateY(110vh); opacity: 0; }
          }
        `}</style>

        {/* Stjerner */}
        {[...Array(30)].map((_, i) => (
          <div key={i} style={{ position: 'fixed', width: `${Math.random() * 2 + 1}px`, height: `${Math.random() * 2 + 1}px`, borderRadius: '50%', backgroundColor: '#C4A882', left: `${Math.random() * 100}%`, top: `${Math.random() * 70}%`, animation: `twinkle ${1 + Math.random() * 3}s ${Math.random() * 2}s infinite` }} />
        ))}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <button onClick={() => setVisning('velg')} style={{ background: 'none', border: 'none', color: '#8A8FA8', cursor: 'pointer', fontSize: '24px' }}>‹</button>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '14px', fontFamily: 'var(--font-plus-jakarta)', color: '#E8DDD0', fontWeight: '600', letterSpacing: '0.05em' }}>NATTA</div>
            <div style={{ fontSize: '12px', fontFamily: 'var(--font-inter)', color: '#8A8FA8' }}>Nattesøvn</div>
          </div>
          <div style={{ width: '32px' }} />
        </div>

        {/* Stor søt måne */}
        <div style={{ textAlign: 'center', marginBottom: '8px' }}>
          <svg width="120" height="120" viewBox="0 0 120 120" style={{ filter: 'drop-shadow(0 0 30px rgba(232,200,122,0.4))' }}>
            <path d="M 75 18 C 50 18 32 36 32 60 C 32 84 50 102 75 102 C 60 94 50 78 50 60 C 50 42 60 26 75 18 Z" fill="#E8C87A"/>
            <circle cx="48" cy="55" r="4" fill="#D4A843" opacity="0.5"/>
            <circle cx="55" cy="70" r="2.5" fill="#D4A843" opacity="0.3"/>
            <path d="M44 57 Q48 61 52 57" stroke="#D4A843" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.6"/>
            <circle cx="80" cy="25" r="3" fill="#E8C87A" opacity="0.3"/>
            <circle cx="90" cy="45" r="2" fill="#E8C87A" opacity="0.2"/>
          </svg>
        </div>

        {/* Sirkulær timer - mørk versjon */}
        <div style={{ position: 'relative', width: '200px', height: '200px', margin: '0 auto 16px' }}>
          <svg width="200" height="200" viewBox="0 0 200 200">
            <circle cx="100" cy="100" r="85" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="6"/>
            <circle cx="100" cy="100" r="85" fill="none" stroke="#7C8FD4" strokeWidth="6" strokeLinecap="round"
              strokeDasharray={2 * Math.PI * 85}
              strokeDashoffset={2 * Math.PI * 85 - (Math.min((minutter % 60) / 60, 1)) * 2 * Math.PI * 85}
              transform="rotate(-90 100 100)" style={{ transition: 'stroke-dashoffset 1s linear' }}
            />
          </svg>
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ fontSize: '13px', fontFamily: 'var(--font-inter)', color: '#8A8FA8', marginBottom: '6px' }}>Natta pågår</div>
            <div style={{ fontSize: '40px', fontFamily: 'var(--font-plus-jakarta)', color: '#FDFAF6', fontWeight: '700', lineHeight: 1 }}>
              {String(Math.floor(minutter / 60)).padStart(2, '0')}:{String(minutter % 60).padStart(2, '0')}
            </div>
          </div>
        </div>

        {/* Juster starttid */}
        <div style={{ textAlign: 'center', marginBottom: '16px' }}>
          <button onClick={() => { setNyTidStr(startTid?.toLocaleTimeString('no-NO', { hour: '2-digit', minute: '2-digit' }) || ''); setVisJusterTid(!visJusterTid); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#8A8FA8', fontSize: '13px', fontFamily: 'var(--font-inter)', textDecoration: 'underline' }}>
            Sovnet kl. {startTid?.toLocaleTimeString('no-NO', { hour: '2-digit', minute: '2-digit' })} – endre
          </button>
          {visJusterTid && (
            <div style={{ marginTop: '10px', display: 'flex', gap: '8px', justifyContent: 'center', alignItems: 'center' }}>
              <input type="time" value={nyTidStr} onChange={e => setNyTidStr(e.target.value)} style={{ padding: '8px 12px', fontSize: '16px', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '10px', backgroundColor: 'rgba(255,255,255,0.08)', color: '#FDFAF6', outline: 'none', fontFamily: 'var(--font-inter)' }} />
              <button onClick={justerStartTidManuelt} style={{ padding: '8px 16px', backgroundColor: '#7C8FD4', border: 'none', borderRadius: '10px', color: '#fff', fontSize: '13px', cursor: 'pointer', fontFamily: 'var(--font-inter)' }}>OK</button>
            </div>
          )}
        </div>

        {/* Avslutt */}
        <button onClick={stoppSøvn} style={{ width: '100%', padding: '16px', backgroundColor: '#7C8FD4', border: 'none', borderRadius: '14px', fontSize: '15px', fontWeight: '600', fontFamily: 'var(--font-inter)', color: '#FDFAF6', cursor: 'pointer', marginBottom: '12px' }}>
          ☀️ Baby våknet
        </button>

        {/* Oppsummering */}
        <div style={{ backgroundColor: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', padding: '16px' }}>
          <div style={{ fontSize: '14px', fontFamily: 'var(--font-plus-jakarta)', color: '#E8DDD0', marginBottom: '12px' }}>Natta oppsummert så langt</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <div style={{ fontSize: '11px', fontFamily: 'var(--font-inter)', color: '#8A8FA8', marginBottom: '2px' }}>Sovnet</div>
              <div style={{ fontSize: '16px', fontFamily: 'var(--font-plus-jakarta)', color: '#E8DDD0' }}>{startTid?.toLocaleTimeString('no-NO', { hour: '2-digit', minute: '2-digit' })}</div>
            </div>
            <div>
              <div style={{ fontSize: '11px', fontFamily: 'var(--font-inter)', color: '#8A8FA8', marginBottom: '2px' }}>Sovet</div>
              <div style={{ fontSize: '16px', fontFamily: 'var(--font-plus-jakarta)', color: '#E8DDD0' }}>{String(Math.floor(minutter / 60)).padStart(2, '0')}:{String(minutter % 60).padStart(2, '0')}</div>
            </div>
          </div>
        </div>

        <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '14px', fontFamily: 'var(--font-inter)', color: '#8A8FA8', fontStyle: 'italic' }}>Sov godt, lille stjerne ✨</div>
      </div>
    );
  }

  return null;
}