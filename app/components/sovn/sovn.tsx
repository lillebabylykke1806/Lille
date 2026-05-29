'use client';
import { farger } from '../../lib/farger';
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import NattlysPanel from './NattlysPanel';
import PustMedMeg from './PustMedMeg';
import LydPanel from './LydPanel';

type Props = { bruker: any; };
type TidslinjeItem = { tid: string; tekst: string; type: string; };

const dagensdato = () => new Date().toISOString().split('T')[0];

const SIGNALER = [
  { id: 'gned', label: 'Gned øynene' },
  { id: 'stirret', label: 'Stirret tomt' },
  { id: 'gjesping', label: 'Gjesping' },
  { id: 'hodet', label: 'Vendte hodet bort' },
  { id: 'kranglete', label: 'Ble kranglete' },
  { id: 'interesse', label: 'Mistet interesse' },
];

const TIPS_NATT = [
  'En rolig legging og mørkt rom kan bidra til dypere og lengre søvn.',
  'Hvit støy kan hjelpe babyen å sove lenger mellom oppvåkningene.',
  'En fast kveldsrutine gir babyen trygghet og lettere innsovning.',
  'Kjølig romtemperatur (18–20°C) gir ofte bedre søvnkvalitet.',
];

const GlitterOvergang = ({ onDone }: { onDone: () => void }) => {
  const partikler = Array.from({ length: 80 }, (_, i) => ({
    id: i, x: Math.random() * 100, y: Math.random() * 100,
    størrelse: Math.random() * 4 + 1, forsinkelse: Math.random() * 1.5,
    farge: ['#C4A882', '#E8DDD0', '#F5E6C8', '#9FD4B8', '#FDFAF6'][Math.floor(Math.random() * 5)],
  }));
  useEffect(() => { const t = setTimeout(onDone, 2500); return () => clearTimeout(t); }, [onDone]);
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, pointerEvents: 'none', overflow: 'hidden' }}>
      <style>{`
        @keyframes glitterFall { 0%{transform:translateY(-20px) scale(0);opacity:0} 20%{opacity:1;transform:translateY(0) scale(1)} 100%{transform:translateY(110vh) rotate(360deg);opacity:0} }
        @keyframes bgDark { 0%{background:rgba(13,27,62,0)} 100%{background:rgba(13,27,62,0.97)} }
      `}</style>
      <div style={{ position: 'absolute', inset: 0, animation: 'bgDark 1.5s ease forwards' }} />
      {partikler.map(p => (
        <div key={p.id} style={{ position: 'absolute', left: `${p.x}%`, top: `${p.y}%`, width: `${p.størrelse}px`, height: `${p.størrelse}px`, borderRadius: '50%', backgroundColor: p.farge, boxShadow: `0 0 ${p.størrelse * 2}px ${p.farge}`, animation: `glitterFall 2s ${p.forsinkelse}s ease-in forwards` }} />
      ))}
    </div>
  );
};

const Bølger = () => (
  <svg viewBox="0 0 430 200" style={{ position: 'absolute', top: '60px', left: 0, width: '100%', height: '200px', zIndex: 0 }} preserveAspectRatio="none">
    <path d="M0 100 C60 60 120 130 180 90 C240 50 300 120 360 80 C400 55 430 70 430 70 L430 200 L0 200 Z" fill="#A8B5A2" opacity="0.2"/>
    <path d="M0 120 C80 85 160 145 240 110 C300 82 370 130 430 105 L430 200 L0 200 Z" fill="#A8B5A2" opacity="0.25"/>
    <path d="M0 145 C100 118 200 155 300 135 C370 120 430 140 430 140 L430 200 L0 200 Z" fill="#A8B5A2" opacity="0.2"/>
  </svg>
);

const TidslinjeIkon = ({ type, mørk = false }: { type: string; mørk?: boolean }) => {
  const size = 40;
  if (type === 'lur') return (
    <div style={{ width: size, height: size, borderRadius: '50%', backgroundColor: mørk ? '#1E3A5F' : '#E8EFF8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <path d="M6 15C4.3 15 3 13.7 3 12C3 10.5 4 9.2 5.5 9C5.8 7.3 7.2 6 9 6C10.1 6 11 6.5 11.7 7.3C12.1 7.1 12.5 7 13 7C14.7 7 16 8.3 16 10C16 10.2 16 10.3 15.9 10.5C17.1 10.9 18 12 18 13.3C18 14.8 16.8 16 15.3 16H6V15Z" fill={mørk ? '#8AAEE0' : '#A8B5A2'} opacity="0.9"/>
        <text x="8" y="13" fontSize="5" fill={mørk ? '#FDFAF6' : '#5C7A6B'} fontFamily="sans-serif" fontWeight="bold">zzz</text>
      </svg>
    </div>
  );
  if (type === 'natt') return (
    <div style={{ width: size, height: size, borderRadius: '50%', backgroundColor: mørk ? '#1A2A5E' : '#D6E5DF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <path d="M21 12.5C20.4 15.8 17.5 18 14 18C10 18 7 15 7 11C7 8 9 5.5 12 4.5C9.5 7 9.5 11 12.5 13.5C15.5 16 19.5 15 21 12.5Z" fill={mørk ? '#8AAEE0' : '#2D5C45'}/>
      </svg>
    </div>
  );
  if (type === 'amming') return (
    <div style={{ width: size, height: size, borderRadius: '50%', backgroundColor: mørk ? '#3A2A1E' : '#F2E4D8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <img src="/tateflaske.png" alt="amming" style={{ width: '40px', height: '40px', objectFit: 'contain', filter: 'brightness(0) invert(1) sepia(1) saturate(0.3) hue-rotate(220deg)' }} />
    </div>
  );
  if (type === 'oppvåkning') return (
    <div style={{ width: size, height: size, borderRadius: '50%', backgroundColor: mørk ? '#2A1E3A' : '#F2E8D8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="5" fill="#F4A853"/>
        <line x1="12" y1="2" x2="12" y2="5" stroke="#F4A853" strokeWidth="2" strokeLinecap="round"/>
        <line x1="12" y1="19" x2="12" y2="22" stroke="#F4A853" strokeWidth="2" strokeLinecap="round"/>
        <line x1="2" y1="12" x2="5" y2="12" stroke="#F4A853" strokeWidth="2" strokeLinecap="round"/>
        <line x1="19" y1="12" x2="22" y2="12" stroke="#F4A853" strokeWidth="2" strokeLinecap="round"/>
        <line x1="4.9" y1="4.9" x2="7" y2="7" stroke="#F4A853" strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="17" y1="17" x2="19.1" y2="19.1" stroke="#F4A853" strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="19.1" y1="4.9" x2="17" y2="7" stroke="#F4A853" strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="7" y1="17" x2="4.9" y2="19.1" stroke="#F4A853" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    </div>
  );
  if (type === 'uro') return (
    <div style={{ width: size, height: size, borderRadius: '50%', backgroundColor: mørk ? '#3A2A1E' : '#FFF0D6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path d="M10 16C10 16 3 11 3 6.5C3 4.5 4.5 3 6.5 3C7.8 3 9 3.7 10 5C11 3.7 12.2 3 13.5 3C15.5 3 17 4.5 17 6.5C17 11 10 16 10 16Z" fill={mørk ? '#E8C87A' : '#E8A830'} opacity="0.8"/>
      </svg>
    </div>
  );
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', backgroundColor: mørk ? '#1A2A3E' : '#F0EBE3', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path d="M10 16C10 16 3 11 3 6.5C3 4.5 4.5 3 6.5 3C7.8 3 9 3.7 10 5C11 3.7 12.2 3 13.5 3C15.5 3 17 4.5 17 6.5C17 11 10 16 10 16Z" fill="none" stroke={mørk ? '#8A8FA8' : '#8A7060'} strokeWidth="1.3"/>
      </svg>
    </div>
  );
};

export default function Sovn({ bruker }: Props) {
  const [visning, setVisning] = useState<'velg' | 'lurAktiv' | 'nattAktiv' | 'etterregistrer'>('velg');
  const [startTid, setStartTid] = useState<Date | null>(null);
  const [lurId, setLurId] = useState<number | null>(null);
  const [minutter, setMinutter] = useState(0);
  const [søvnType, setSøvnType] = useState<'lur' | 'natt' | null>(null);
  const [visGlitter, setVisGlitter] = useState(false);
  const [visJusterTid, setVisJusterTid] = useState(false);
  const [nyTidStr, setNyTidStr] = useState('');
  const [valgteSignaler, setValgteSignaler] = useState<string[]>([]);
  const [tidslinje, setTidslinje] = useState<TidslinjeItem[]>([]);
  const [søvnkvalitet, setSøvnkvalitet] = useState('God');
  const [nyDato, setNyDato] = useState(dagensdato());
  const [nyType, setNyType] = useState<'lur' | 'natt'>('lur');
  const [nyStart, setNyStart] = useState('');
  const [nySlutt, setNySlutt] = useState('');
  const [visLydPanel, setVisLydPanel] = useState(false);
  const [visNattlys, setVisNattlys] = useState(false);
  const [visPust, setVisPust] = useState(false);
  const [visManeAnimasjon, setVisManeAnimasjon] = useState(false);

  const lastTidslinje = useCallback(async () => {
    const { data } = await supabase
      .from('lurer')
      .select('*')
      .eq('profil_id', bruker?.id)
      .eq('dato', dagensdato())
      .order('start', { ascending: true });
    if (!data) return;
    const items: TidslinjeItem[] = data.map((l: any) => ({
      tid: l.start,
      tekst: l.type === 'lur' ? 'Lur' : l.type === 'natt' ? 'Sovnet' : l.type === 'oppvåkning' ? 'Våknet' : l.type === 'amming' ? 'Amming' : l.tekst || l.type,
      type: l.type,
    }));
    setTidslinje(items);
    const oppvåkninger = data.filter((l: any) => l.type === 'oppvåkning').length;
    const totalMinutter = data.filter((l: any) => l.type === 'natt' || l.type === 'lur').reduce((sum: number, l: any) => sum + (l.varighet || 0), 0);
    if (oppvåkninger === 0 && totalMinutter > 120) setSøvnkvalitet('Utmerket');
    else if (oppvåkninger <= 2) setSøvnkvalitet('God');
    else if (oppvåkninger <= 4) setSøvnkvalitet('Ok');
    else setSøvnkvalitet('Urolig');
  }, [bruker?.id]);

  useEffect(() => {
    const lagretStartTid = localStorage.getItem('lille_starttid');
    const lagretType = localStorage.getItem('lille_sovtype');
    if (lagretStartTid && lagretType) {
      setStartTid(new Date(lagretStartTid));
      setSøvnType(lagretType as 'lur' | 'natt');
      setVisning(lagretType === 'natt' ? 'nattAktiv' : 'lurAktiv');
    }
    lastTidslinje();
  }, [lastTidslinje]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined;
    if (startTid && (visning === 'lurAktiv' || visning === 'nattAktiv')) {
      interval = setInterval(() => {
        const diff = Math.floor((Date.now() - startTid.getTime()) / 1000);
        setMinutter(Math.floor(diff / 60));
      }, 1000);
    }
    return () => { if (interval) clearInterval(interval); };
  }, [startTid, visning]);

  const startSøvn = async (type: 'lur' | 'natt') => {
    const nå = new Date();
    setStartTid(nå);
    setSøvnType(type);
    setValgteSignaler([]);
    localStorage.setItem('lille_starttid', nå.toISOString());
    localStorage.setItem('lille_sovtype', type);
    const { data } = await supabase.from('lurer').insert({
      profil_id: bruker?.id, dato: dagensdato(), type,
      start: nå.toLocaleTimeString('no-NO', { hour: '2-digit', minute: '2-digit' }),
      slutt: null, varighet: 0, signaler: '',
    }).select();
    if (data?.[0]) setLurId(data[0].id);
    if (type === 'natt') {
      setVisGlitter(true);
      setVisManeAnimasjon(true);
      setTimeout(() => {
        setVisGlitter(false);
        setVisning('nattAktiv');
        lastTidslinje();
        setTimeout(() => setVisManeAnimasjon(false), 2000);
      }, 2500);
    } else {
      setVisning('lurAktiv');
      lastTidslinje();
    }
  };

  const registrerOppvåkning = async () => {
    const nå = new Date();
    await supabase.from('lurer').insert({
      profil_id: bruker?.id, dato: dagensdato(), type: 'oppvåkning',
      start: nå.toLocaleTimeString('no-NO', { hour: '2-digit', minute: '2-digit' }),
      slutt: null, varighet: 0, signaler: '',
    });
    lastTidslinje();
  };

  const toggleSignal = async (signalId: string) => {
    const nyeSignaler = valgteSignaler.includes(signalId)
      ? valgteSignaler.filter(s => s !== signalId)
      : [...valgteSignaler, signalId];
    setValgteSignaler(nyeSignaler);
    if (lurId) await supabase.from('lurer').update({ signaler: nyeSignaler.join(',') }).eq('id', lurId);
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
    if (lurId) {
      await supabase.from('lurer').update({
        slutt: slutt.toLocaleTimeString('no-NO', { hour: '2-digit', minute: '2-digit' }),
        varighet: Math.floor(diff / 60),
      }).eq('id', lurId);
    }
    localStorage.removeItem('lille_starttid');
    localStorage.removeItem('lille_sovtype');
    setStartTid(null); setSøvnType(null); setLurId(null);
    setVisning('velg');
    lastTidslinje();
  };

  const lagreEtterregistrert = async () => {
    if (!nyStart || !nySlutt) return;
    const [sh, sm] = nyStart.split(':').map(Number);
    const [eh, em] = nySlutt.split(':').map(Number);
    const varighet = (eh * 60 + em) - (sh * 60 + sm);
    if (varighet <= 0) return;
    await supabase.from('lurer').insert({
      profil_id: bruker?.id, dato: nyDato, type: nyType,
      start: nyStart, slutt: nySlutt, varighet, signaler: '',
    });
    setNyStart(''); setNySlutt('');
    setVisning('velg'); lastTidslinje();
  };

  const søvnmelding = () => {
    if (minutter < 60) return 'Baby sover 🌙 Natta har så vidt begynt – la ro senke seg.';
    if (valgteSignaler.length > 0) return `Baby viste ${valgteSignaler.length} trøtthetstegn før legging. Bra at du la merke til det! 🌿`;
    if (søvnkvalitet === 'Utmerket') return 'Fantastisk natt! ✨ Baby sover godt og sammenhengende.';
    if (søvnkvalitet === 'God') return 'Nydelig natt ✨ Baby sover godt med få oppvåkninger.';
    if (søvnkvalitet === 'Ok') return 'En grei natt 🌙 Litt uro, men baby sover.';
    return 'Urolig natt 💛 Baby trenger ekstra ro og nærhet nå.';
  };

  const circumference = 2 * Math.PI * 95;
  const progress = Math.min((minutter % 60) / 60, 1);
  const timer = Math.floor(minutter / 60);
  const sek = minutter % 60;
  const timerTekst = timer > 0 ? `${timer} t ${sek} m` : `${sek} m`;

  if (visGlitter) return <GlitterOvergang onDone={() => {}} />;

  if (visning === 'velg') {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <div style={{ marginBottom: '8px', position: 'relative', display: 'inline-block' }}>
          <svg width="14" height="14" viewBox="0 0 12 12" fill="none" style={{ position: 'absolute', top: '-14px', left: '-5px' }}>
            <path d="M6 0L7.2 4.8L12 6L7.2 7.2L6 12L4.8 7.2L0 6L4.8 4.8Z" fill="#8A7060" opacity="0.5"/>
          </svg>
          <svg width="8" height="8" viewBox="0 0 12 12" fill="none" style={{ position: 'absolute', top: '-5px', right: '-20px' }}>
            <path d="M6 0L7.2 4.8L12 6L7.2 7.2L6 12L4.8 7.2L0 6L4.8 4.8Z" fill="#8A7060" opacity="0.35"/>
          </svg>
          <svg width="10" height="10" viewBox="0 0 12 12" fill="none" style={{ position: 'absolute', top: '30px', right: '-28px' }}>
            <path d="M6 0L7.2 4.8L12 6L7.2 7.2L6 12L4.8 7.2L0 6L4.8 4.8Z" fill="#8A7060" opacity="0.4"/>
          </svg>
          <svg width="6" height="6" viewBox="0 0 12 12" fill="none" style={{ position: 'absolute', bottom: '10px', left: '-18px' }}>
            <path d="M6 0L7.2 4.8L12 6L7.2 7.2L6 12L4.8 7.2L0 6L4.8 4.8Z" fill="#8A7060" opacity="0.3"/>
          </svg>
          <svg width="9" height="9" viewBox="0 0 12 12" fill="none" style={{ position: 'absolute', bottom: '-8px', right: '-12px' }}>
            <path d="M6 0L7.2 4.8L12 6L7.2 7.2L6 12L4.8 7.2L0 6L4.8 4.8Z" fill="#8A7060" opacity="0.38"/>
          </svg>
          <svg width="7" height="7" viewBox="0 0 12 12" fill="none" style={{ position: 'absolute', top: '60px', left: '-22px' }}>
            <path d="M6 0L7.2 4.8L12 6L7.2 7.2L6 12L4.8 7.2L0 6L4.8 4.8Z" fill="#8A7060" opacity="0.28"/>
          </svg>
          <img src="/mane.png" alt="måne" style={{ width: '150px', height: 'auto', maskImage: 'radial-gradient(ellipse 70% 75% at 35% 52%, black 30%, transparent 68%)', WebkitMaskImage: 'radial-gradient(ellipse 70% 75% at 35% 52%, black 30%, transparent 68%)' }} />
        </div>
        <div style={{ fontSize: '22px', fontFamily: 'var(--font-plus-jakarta)', color: farger.tekst, marginBottom: '4px', lineHeight: 1.3 }}>
          Hva slags søvn<br/>skal du registrere?
        </div>
        <div style={{ fontSize: '13px', fontFamily: 'var(--font-inter)', color: farger.tekstLys, marginBottom: '28px' }}>
          Velg type for best mulig innsikt
        </div>
        <div style={{ marginBottom: '10px' }}>
          <button onClick={() => startSøvn('lur')} style={{ width: '100%', padding: '18px 20px', backgroundColor: farger.hvit, border: `1px solid ${farger.kremMørk}`, borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '16px', cursor: 'pointer', textAlign: 'left' }}>
            <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
              <circle cx="18" cy="18" r="7" fill="#F4A853"/>
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
              <div style={{ fontSize: '16px', fontFamily: 'var(--font-plus-jakarta)', color: farger.tekst, marginBottom: '2px', fontWeight: '400' }}>Lur</div>
              <div style={{ fontSize: '13px', fontFamily: 'var(--font-inter)', color: farger.tekstLys }}>Dagtidssøvn</div>
            </div>
            <div style={{ marginLeft: 'auto', color: farger.tekstLys, fontSize: '18px' }}>›</div>
          </button>
        </div>
        <div style={{ marginBottom: '28px' }}>
          <button onClick={() => startSøvn('natt')} style={{ width: '100%', padding: '18px 20px', backgroundColor: farger.hvit, border: `1px solid ${farger.kremMørk}`, borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '16px', cursor: 'pointer', textAlign: 'left' }}>
            <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
              <path d="M28 20C27.1 24.6 23 28 18 28C12.5 28 8 23.5 8 18C8 13 11.4 8.9 16 8C13 11 13 16.5 16.5 20C20 23.5 25 23.5 28 20Z" fill="#6B7FC4"/>
              <circle cx="24" cy="11" r="1.2" fill="#6B7FC4" opacity="0.5"/>
              <circle cx="28" cy="15" r="0.8" fill="#6B7FC4" opacity="0.4"/>
            </svg>
            <div>
              <div style={{ fontSize: '16px', fontFamily: 'var(--font-plus-jakarta)', color: farger.tekst, marginBottom: '2px', fontWeight: '400' }}>Natta</div>
              <div style={{ fontSize: '13px', fontFamily: 'var(--font-inter)', color: farger.tekstLys }}>Nattesøvn</div>
            </div>
            <div style={{ marginLeft: 'auto', color: farger.tekstLys, fontSize: '18px' }}>›</div>
          </button>
        </div>
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
      <div style={{ backgroundColor: '#F8F3EE', minHeight: '100vh', position: 'relative', overflow: 'hidden' }}>
        <Bølger />
        <div style={{ position: 'relative', zIndex: 1, padding: '16px 24px 120px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <button onClick={() => setVisning('velg')} style={{ background: 'none', border: 'none', color: farger.tekstLys, cursor: 'pointer', fontSize: '24px' }}>‹</button>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '14px', fontFamily: 'var(--font-plus-jakarta)', color: farger.tekst, fontWeight: '700', letterSpacing: '0.08em' }}>LUR</div>
              <div style={{ fontSize: '12px', fontFamily: 'var(--font-inter)', color: farger.tekstLys }}>Dagtidssøvn</div>
            </div>
            <div style={{ width: '32px' }} />
          </div>
          <div style={{ position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '16px', minHeight: '260px', zIndex: 1 }}>
            <div style={{ position: 'absolute', left: '10px', top: '0px', opacity: 0.7 }}>
              <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                <circle cx="24" cy="24" r="9" fill="#F4A853" opacity="0.9"/>
                <line x1="24" y1="4" x2="24" y2="11" stroke="#F4A853" strokeWidth="2.5" strokeLinecap="round"/>
                <line x1="24" y1="37" x2="24" y2="44" stroke="#F4A853" strokeWidth="2.5" strokeLinecap="round"/>
                <line x1="4" y1="24" x2="11" y2="24" stroke="#F4A853" strokeWidth="2.5" strokeLinecap="round"/>
                <line x1="37" y1="24" x2="44" y2="24" stroke="#F4A853" strokeWidth="2.5" strokeLinecap="round"/>
                <line x1="9" y1="9" x2="14" y2="14" stroke="#F4A853" strokeWidth="2" strokeLinecap="round"/>
                <line x1="34" y1="34" x2="39" y2="39" stroke="#F4A853" strokeWidth="2" strokeLinecap="round"/>
                <line x1="39" y1="9" x2="34" y2="14" stroke="#F4A853" strokeWidth="2" strokeLinecap="round"/>
                <line x1="14" y1="34" x2="9" y2="39" stroke="#F4A853" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
            <button onClick={() => { setNyTidStr(startTid?.toLocaleTimeString('no-NO', { hour: '2-digit', minute: '2-digit' }) || ''); setVisJusterTid(!visJusterTid); }} style={{ background: 'none', border: 'none', cursor: 'pointer', position: 'relative', width: '220px', height: '220px' }}>
              <svg width="220" height="220" viewBox="0 0 220 220">
                <defs>
                  <linearGradient id="lurBg" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#F5EFE6"/>
                    <stop offset="100%" stopColor="#EDE5D8"/>
                  </linearGradient>
                  <linearGradient id="lurGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#A8B5A2"/>
                    <stop offset="50%" stopColor="#EBC8B4"/>
                    <stop offset="100%" stopColor="#A8B5A2"/>
                  </linearGradient>
                </defs>
                <circle cx="110" cy="110" r="95" fill="url(#lurBg)"/>
                <circle cx="110" cy="110" r="95" fill="none" stroke="#EDE5D8" strokeWidth="12"/>
                <circle cx="110" cy="110" r="95" fill="none" stroke="url(#lurGrad)" strokeWidth="12" strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={circumference - progress * circumference}
                  transform="rotate(-90 110 110)" style={{ transition: 'stroke-dashoffset 1s linear' }}/>
              </svg>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" style={{ marginBottom: '6px' }}>
                  <path d="M9 15C9 15 2 10.5 2 6C2 4 3.5 2.5 5.5 2.5C7 2.5 8.2 3.3 9 4.5C9.8 3.3 11 2.5 12.5 2.5C14.5 2.5 16 4 16 6C16 10.5 9 15 9 15Z" fill="none" stroke="#C48E7B" strokeWidth="1.3"/>
                </svg>
                <div style={{ fontSize: '13px', fontFamily: 'var(--font-inter)', color: farger.tekstLys, marginBottom: '4px' }}>Luren pågår</div>
                <div style={{ fontSize: '40px', fontFamily: 'var(--font-plus-jakarta)', color: farger.tekst, fontWeight: '700', lineHeight: 1.1 }}>
                  {String(Math.floor(minutter / 60)).padStart(2, '0')}:{String(minutter % 60).padStart(2, '0')}
                </div>
                <div style={{ fontSize: '11px', fontFamily: 'var(--font-inter)', color: farger.tekstLys, marginTop: '4px', textDecoration: 'underline' }}>Trykk for å justere tid</div>
              </div>
            </button>
          </div>
          {visJusterTid && (
            <div style={{ backgroundColor: farger.hvit, border: `1px solid ${farger.kremMørk}`, borderRadius: '12px', padding: '12px 16px', marginBottom: '12px', display: 'flex', gap: '8px', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ fontSize: '12px', fontFamily: 'var(--font-inter)', color: farger.tekstLys }}>Sett starttid:</div>
              <input type="time" value={nyTidStr} onChange={e => setNyTidStr(e.target.value)} style={{ padding: '6px 10px', fontSize: '15px', border: `1px solid ${farger.kremMørk}`, borderRadius: '8px', backgroundColor: farger.bakgrunn, color: farger.tekst, outline: 'none', fontFamily: 'var(--font-inter)' }} />
              <button onClick={justerStartTidManuelt} style={{ padding: '6px 14px', backgroundColor: farger.grønn, border: 'none', borderRadius: '8px', color: '#fff', fontSize: '13px', cursor: 'pointer', fontFamily: 'var(--font-inter)' }}>OK</button>
            </div>
          )}
          <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
            <button onClick={stoppSøvn} style={{ flex: 2, padding: '16px', backgroundColor: '#A8B5A2', border: 'none', borderRadius: '28px', fontSize: '15px', fontWeight: '600', fontFamily: 'var(--font-inter)', color: '#FDFAF6', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              Avslutt lur
              <div style={{ width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.6)', borderRadius: '3px' }} />
            </button>
            <button style={{ flex: 1, padding: '16px', backgroundColor: farger.hvit, border: `1px solid ${farger.kremMørk}`, borderRadius: '28px', fontSize: '14px', fontFamily: 'var(--font-inter)', color: farger.tekstLys, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
              Pauser <span style={{ letterSpacing: '2px' }}>||</span>
            </button>
          </div>
          <div style={{ backgroundColor: farger.hvit, border: `1px solid ${farger.kremMørk}`, borderRadius: '16px', padding: '16px', marginBottom: '12px' }}>
            <div style={{ fontSize: '15px', fontFamily: 'var(--font-plus-jakarta)', color: farger.tekst, marginBottom: '4px' }}>Signaler før lur</div>
            <div style={{ fontSize: '12px', fontFamily: 'var(--font-inter)', color: farger.tekstLys, marginBottom: '14px' }}>Hva har babyen vist før luren?</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '12px' }}>
              {SIGNALER.map(signal => (
                <button key={signal.id} onClick={() => toggleSignal(signal.id)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', padding: '10px 4px', borderRadius: '12px', border: valgteSignaler.includes(signal.id) ? `1.5px solid ${farger.grønn}` : `1px solid ${farger.kremMørk}`, backgroundColor: valgteSignaler.includes(signal.id) ? farger.grønnLys : farger.bakgrunn, cursor: 'pointer' }}>
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path d="M10 16C10 16 3 11 3 6.5C3 4.5 4.5 3 6.5 3C7.8 3 9 3.7 10 5C11 3.7 12.2 3 13.5 3C15.5 3 17 4.5 17 6.5C17 11 10 16 10 16Z" fill={valgteSignaler.includes(signal.id) ? farger.grønn : 'none'} stroke={valgteSignaler.includes(signal.id) ? farger.grønn : '#8A7060'} strokeWidth="1.3"/>
                  </svg>
                  <div style={{ fontSize: '9px', fontFamily: 'var(--font-inter)', color: valgteSignaler.includes(signal.id) ? farger.grønn : farger.tekstLys, textAlign: 'center', lineHeight: 1.2 }}>{signal.label}</div>
                </button>
              ))}
            </div>
            <button style={{ width: '100%', padding: '12px', backgroundColor: 'transparent', border: `1.5px dashed ${farger.kremMørk}`, borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer' }}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <circle cx="8" cy="8" r="7" stroke="#8A7060" strokeWidth="1.3"/>
                <line x1="8" y1="5" x2="8" y2="11" stroke="#8A7060" strokeWidth="1.3" strokeLinecap="round"/>
                <line x1="5" y1="8" x2="11" y2="8" stroke="#8A7060" strokeWidth="1.3" strokeLinecap="round"/>
              </svg>
              <span style={{ fontSize: '13px', fontFamily: 'var(--font-inter)', color: farger.tekstLys }}>Legg til eget signal</span>
            </button>
          </div>
          <button style={{ width: '100%', padding: '16px 20px', backgroundColor: farger.hvit, border: `1px solid ${farger.kremMørk}`, borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', marginBottom: '16px' }}>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: '14px', fontFamily: 'var(--font-plus-jakarta)', color: farger.tekst, marginBottom: '2px' }}>Se signalhistorikk</div>
              <div style={{ fontSize: '12px', fontFamily: 'var(--font-inter)', color: farger.tekstLys }}>Hva har du sett før tidligere lurer?</div>
            </div>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M6 4L10 8L6 12" stroke="#8A7060" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          {tidslinje.length > 0 && (
            <div style={{ backgroundColor: farger.hvit, border: `1px solid ${farger.kremMørk}`, borderRadius: '16px', padding: '16px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div style={{ fontSize: '16px', fontFamily: 'var(--font-plus-jakarta)', color: farger.tekst, fontWeight: '600' }}>I dag</div>
                <button style={{ fontSize: '12px', fontFamily: 'var(--font-inter)', color: farger.tekstLys, background: 'none', border: `1px solid ${farger.kremMørk}`, padding: '4px 12px', borderRadius: '20px', cursor: 'pointer' }}>Se dagbok</button>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <div style={{ display: 'flex', alignItems: 'flex-end', minWidth: `${tidslinje.length * 80}px`, paddingBottom: '8px' }}>
                  {tidslinje.map((item, i) => (
                    <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                      <div style={{ fontSize: '10px', fontFamily: 'var(--font-inter)', color: i === tidslinje.length - 1 ? farger.grønn : farger.tekstLys, fontWeight: i === tidslinje.length - 1 ? '700' : '400', marginBottom: '2px' }}>{item.tid}</div>
                      <div style={{ fontSize: '10px', fontFamily: 'var(--font-inter)', color: i === tidslinje.length - 1 ? farger.grønn : farger.tekstLys, fontWeight: i === tidslinje.length - 1 ? '700' : '400', marginBottom: '8px', textAlign: 'center' }}>{item.tekst}</div>
                      <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                        {i > 0 && <div style={{ flex: 1, height: '1px', backgroundColor: farger.kremMørk }} />}
                        <TidslinjeIkon type={item.type} />
                        {i < tidslinje.length - 1 && <div style={{ flex: 1, height: '1px', backgroundColor: farger.kremMørk }} />}
                        {i === tidslinje.length - 1 && <div style={{ flex: 1, height: '1px', borderTop: `1px dashed ${farger.kremMørk}` }} />}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
          <div style={{ backgroundColor: farger.terrakottaLys, borderRadius: '16px', padding: '16px' }}>
            <div style={{ fontSize: '10px', letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: 'var(--font-inter)', color: farger.tekstLys, marginBottom: '6px' }}>💡 TIPS</div>
            <div style={{ fontSize: '13px', fontFamily: 'var(--font-inter)', color: farger.tekst, lineHeight: 1.6 }}>En god våkentid før lur gir ofte en lengre og roligere søvn.</div>
          </div>
        </div>
      </div>
    );
  }

  if (visning === 'nattAktiv') {
    return (
      <div style={{ backgroundColor: '#0D1B3E', minHeight: '100vh', position: 'fixed', inset: 0, zIndex: 50, overflowY: 'auto' }}>
        <style>{`
          @keyframes moonRise { 0%{transform:translateY(140px);opacity:0} 100%{transform:translateY(0px);opacity:1} }
          @keyframes moonFloat { 0%,100%{transform:translateY(0px)} 50%{transform:translateY(-8px)} }
          @keyframes twinkleStar { 0%,100%{opacity:0.15;transform:scale(0.8)} 50%{opacity:1;transform:scale(1.2)} }
          @keyframes sheetUp { 0%{transform:translateY(100%)} 100%{transform:translateY(0)} }
        `}</style>

        {/* Stjerner */}
        {[
          {x:8,y:6,s:6,d:0,op:0.7},{x:20,y:4,s:5,d:0.5,op:0.5},{x:35,y:8,s:6,d:1,op:0.8},
          {x:50,y:5,s:4,d:0.3,op:0.6},{x:65,y:7,s:7,d:0.8,op:0.9},{x:78,y:4,s:5,d:1.2,op:0.5},
          {x:88,y:8,s:6,d:0.6,op:0.7},{x:95,y:5,s:4,d:1.5,op:0.6},{x:12,y:15,s:5,d:0.2,op:0.8},
          {x:28,y:18,s:6,d:0.9,op:0.5},{x:45,y:14,s:4,d:1.4,op:0.7},{x:60,y:16,s:7,d:0.4,op:0.9},
          {x:75,y:12,s:5,d:1.1,op:0.6},{x:90,y:18,s:6,d:0.7,op:0.8},{x:5,y:30,s:4,d:1.6,op:0.5},
          {x:18,y:35,s:7,d:0.1,op:0.9},{x:32,y:28,s:5,d:1.3,op:0.7},{x:48,y:32,s:6,d:0.6,op:0.6},
          {x:62,y:26,s:4,d:1.8,op:0.8},{x:76,y:33,s:7,d:0.3,op:0.5},{x:92,y:28,s:5,d:1.0,op:0.7},
          {x:10,y:45,s:6,d:0.7,op:0.6},{x:25,y:50,s:4,d:1.5,op:0.8},{x:40,y:44,s:7,d:0.2,op:0.5},
          {x:55,y:48,s:5,d:1.2,op:0.9},{x:70,y:42,s:6,d:0.8,op:0.7},{x:85,y:50,s:4,d:1.7,op:0.6},
        ].map((s, i) => (
          <div key={i} style={{ position: 'fixed', left: `${s.x}%`, top: `${s.y}%`, animation: `twinkleStar ${2 + s.d}s ${s.d}s infinite ease-in-out` }}>
            <svg viewBox="0 0 10 10" fill="none" width={s.s} height={s.s}>
              <path d="M5 0L5.8 3.8L10 5L5.8 6.2L5 10L4.2 6.2L0 5L4.2 3.8Z" fill="#E8C87A" opacity={s.op}/>
            </svg>
          </div>
        ))}

        <div style={{ position: 'relative', zIndex: 1, padding: '16px 24px 140px' }}>

          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <button onClick={() => setVisning('velg')} style={{ background: 'none', border: 'none', color: '#8A8FA8', cursor: 'pointer', fontSize: '24px' }}>‹</button>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '14px', fontFamily: 'var(--font-plus-jakarta)', color: '#E8DDD0', fontWeight: '700', letterSpacing: '0.08em' }}>NATTA</div>
              <div style={{ fontSize: '12px', fontFamily: 'var(--font-inter)', color: '#8A8FA8' }}>Nattesøvn</div>
            </div>
            <div style={{ width: '32px' }} />
          </div>

          {/* Måne + klokke */}
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '260px', marginBottom: '16px' }}>
            <div style={{ position: 'absolute', left: '-20px', top: '-10px', animation: visManeAnimasjon ? 'moonRise 1.5s ease-out forwards' : 'moonFloat 5s ease-in-out infinite' }}>
              <img src="/mane-natt.png" alt="måne" style={{ width: '180px', height: 'auto', filter: 'drop-shadow(0 0 30px rgba(232,200,122,0.5))' }} />
            </div>
            <div style={{ position: 'relative', width: '200px', height: '200px', marginLeft: '60px' }}>
              <svg width="200" height="200" viewBox="0 0 200 200">
                <defs>
                  <linearGradient id="nattGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#3D5A9E"/>
                    <stop offset="50%" stopColor="#8AAEE0"/>
                    <stop offset="100%" stopColor="#3D5A9E"/>
                  </linearGradient>
                  <linearGradient id="nattBg" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#1A2A5E"/>
                    <stop offset="100%" stopColor="#0D1B3E"/>
                  </linearGradient>
                </defs>
                <circle cx="100" cy="100" r="88" fill="url(#nattBg)" stroke="rgba(255,255,255,0.05)" strokeWidth="1"/>
                <circle cx="100" cy="100" r="88" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="10"/>
                <circle cx="100" cy="100" r="88" fill="none" stroke="url(#nattGrad)" strokeWidth="10" strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * 88}
                  strokeDashoffset={2 * Math.PI * 88 - progress * 2 * Math.PI * 88}
                  transform="rotate(-90 100 100)" style={{ transition: 'stroke-dashoffset 1s linear' }}/>
              </svg>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" style={{ marginBottom: '4px' }}>
                  <path d="M21 12.5C20.4 15.8 17.5 18 14 18C10 18 7 15 7 11C7 8 9 5.5 12 4.5C9.5 7 9.5 11 12.5 13.5C15.5 16 19.5 15 21 12.5Z" fill="none" stroke="#8AAEE0" strokeWidth="1.5"/>
                  <circle cx="18" cy="8" r="1" fill="#8AAEE0" opacity="0.6"/>
                </svg>
                <div style={{ fontSize: '11px', fontFamily: 'var(--font-inter)', color: '#8A8FA8', marginBottom: '2px' }}>Baby sover</div>
                <div style={{ fontSize: '32px', fontFamily: 'var(--font-plus-jakarta)', color: '#FDFAF6', fontWeight: '700', lineHeight: 1 }}>{timerTekst}</div>
                <button onClick={() => { setNyTidStr(startTid?.toLocaleTimeString('no-NO', { hour: '2-digit', minute: '2-digit' }) || ''); setVisJusterTid(!visJusterTid); }} style={{ background: 'none', border: 'none', cursor: 'pointer', marginTop: '6px' }}>
                  <div style={{ fontSize: '11px', fontFamily: 'var(--font-inter)', color: '#8A8FA8', textDecoration: 'underline' }}>
                    Siden {startTid?.toLocaleTimeString('no-NO', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </button>
              </div>
            </div>
          </div>

          {/* Juster tid */}
          {visJusterTid && (
            <div style={{ backgroundColor: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '12px 16px', marginBottom: '12px', display: 'flex', gap: '8px', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ fontSize: '12px', fontFamily: 'var(--font-inter)', color: '#8A8FA8' }}>Sett sovnetid:</div>
              <input type="time" value={nyTidStr} onChange={e => setNyTidStr(e.target.value)} style={{ padding: '6px 10px', fontSize: '15px', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px', backgroundColor: 'rgba(255,255,255,0.06)', color: '#FDFAF6', outline: 'none', fontFamily: 'var(--font-inter)' }} />
              <button onClick={justerStartTidManuelt} style={{ padding: '6px 14px', backgroundColor: '#7C8FD4', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '13px', cursor: 'pointer', fontFamily: 'var(--font-inter)' }}>OK</button>
            </div>
          )}

          {/* AI innsikt */}
          <div style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '14px 16px', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <span style={{ fontSize: '14px' }}>✨</span>
              <div style={{ fontSize: '13px', fontFamily: 'var(--font-plus-jakarta)', color: '#E8DDD0', fontWeight: '600' }}>Nattens innsikt</div>
            </div>
            <div style={{ fontSize: '13px', fontFamily: 'var(--font-inter)', color: '#C4A882', lineHeight: 1.6 }}>{søvnmelding()}</div>
          </div>

          {/* Signaler i kveld */}
          <div style={{ backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', padding: '14px 16px', marginBottom: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div style={{ fontSize: '13px', fontFamily: 'var(--font-plus-jakarta)', color: '#E8DDD0', fontWeight: '600' }}>Signaler i kveld</div>
              <button style={{ fontSize: '11px', fontFamily: 'var(--font-inter)', color: '#8A8FA8', background: 'none', border: '1px solid rgba(255,255,255,0.1)', padding: '3px 10px', borderRadius: '20px', cursor: 'pointer' }}>Se alle</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
              {SIGNALER.map(signal => (
                <button key={signal.id} onClick={() => toggleSignal(signal.id)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', padding: '10px 4px', borderRadius: '12px', border: valgteSignaler.includes(signal.id) ? '1.5px solid rgba(138,174,224,0.6)' : '1px solid rgba(255,255,255,0.08)', backgroundColor: valgteSignaler.includes(signal.id) ? 'rgba(138,174,224,0.15)' : 'rgba(255,255,255,0.04)', cursor: 'pointer' }}>
                  <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
                    <path d="M10 16C10 16 3 11 3 6.5C3 4.5 4.5 3 6.5 3C7.8 3 9 3.7 10 5C11 3.7 12.2 3 13.5 3C15.5 3 17 4.5 17 6.5C17 11 10 16 10 16Z" fill={valgteSignaler.includes(signal.id) ? '#8AAEE0' : 'none'} stroke={valgteSignaler.includes(signal.id) ? '#8AAEE0' : 'rgba(255,255,255,0.3)'} strokeWidth="1.3"/>
                  </svg>
                  <div style={{ fontSize: '8px', fontFamily: 'var(--font-inter)', color: valgteSignaler.includes(signal.id) ? '#8AAEE0' : '#8A8FA8', textAlign: 'center', lineHeight: 1.2 }}>{signal.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Nattens tidslinje */}
          {tidslinje.length > 0 && (
            <div style={{ backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', padding: '14px 16px', marginBottom: '16px' }}>
              <div style={{ fontSize: '13px', fontFamily: 'var(--font-plus-jakarta)', color: '#E8DDD0', fontWeight: '600', marginBottom: '12px' }}>Nattens tidslinje</div>
              <div style={{ overflowX: 'auto' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', minWidth: `${tidslinje.length * 80}px` }}>
                  {tidslinje.map((item, i) => (
                    <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                      <div style={{ fontSize: '10px', fontFamily: 'var(--font-inter)', color: i === tidslinje.length - 1 ? '#C4A882' : '#8A8FA8', fontWeight: i === tidslinje.length - 1 ? '600' : '400', marginBottom: '2px' }}>{item.tid}</div>
                      <div style={{ fontSize: '10px', fontFamily: 'var(--font-inter)', color: i === tidslinje.length - 1 ? '#C4A882' : '#8A8FA8', marginBottom: '8px', textAlign: 'center', lineHeight: 1.2 }}>{item.tekst}</div>
                      <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                        {i > 0 && <div style={{ flex: 1, height: '1px', backgroundColor: 'rgba(255,255,255,0.1)' }} />}
                        <TidslinjeIkon type={item.type} mørk={true} />
                        {i < tidslinje.length - 1 && <div style={{ flex: 1, height: '1px', backgroundColor: 'rgba(255,255,255,0.1)' }} />}
                        {i === tidslinje.length - 1 && <div style={{ flex: 1, height: '1px', borderTop: '1px dashed rgba(255,255,255,0.1)' }} />}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Hurtigregistrering */}
          <div style={{ backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', padding: '14px 16px', marginBottom: '16px' }}>
            <div style={{ fontSize: '13px', fontFamily: 'var(--font-plus-jakarta)', color: '#E8DDD0', fontWeight: '600', marginBottom: '12px' }}>Hurtigregistrering</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
              <button onClick={registrerOppvåkning} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', padding: '12px 6px', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.08)', backgroundColor: 'rgba(255,255,255,0.04)', cursor: 'pointer' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="5" stroke="#F4A853" strokeWidth="1.5" fill="none"/>
                  <line x1="12" y1="2" x2="12" y2="5" stroke="#F4A853" strokeWidth="1.5" strokeLinecap="round"/>
                  <line x1="12" y1="19" x2="12" y2="22" stroke="#F4A853" strokeWidth="1.5" strokeLinecap="round"/>
                  <line x1="2" y1="12" x2="5" y2="12" stroke="#F4A853" strokeWidth="1.5" strokeLinecap="round"/>
                  <line x1="19" y1="12" x2="22" y2="12" stroke="#F4A853" strokeWidth="1.5" strokeLinecap="round"/>
                  <line x1="4.9" y1="4.9" x2="7" y2="7" stroke="#F4A853" strokeWidth="1.2" strokeLinecap="round"/>
                  <line x1="17" y1="17" x2="19.1" y2="19.1" stroke="#F4A853" strokeWidth="1.2" strokeLinecap="round"/>
                  <line x1="19.1" y1="4.9" x2="17" y2="7" stroke="#F4A853" strokeWidth="1.2" strokeLinecap="round"/>
                  <line x1="7" y1="17" x2="4.9" y2="19.1" stroke="#F4A853" strokeWidth="1.2" strokeLinecap="round"/>
                </svg>
                <div style={{ fontSize: '10px', fontFamily: 'var(--font-inter)', color: '#8A8FA8' }}>Våknet</div>
              </button>
              <button onClick={() => {}} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', padding: '12px 6px', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.08)', backgroundColor: 'rgba(255,255,255,0.04)', cursor: 'pointer' }}>
                <img src="/tateflaske.png" alt="amming" style={{ width: '26px', height: '26px', objectFit: 'contain' }} />
                <div style={{ fontSize: '10px', fontFamily: 'var(--font-inter)', color: '#8A8FA8' }}>Ammet</div>
              </button>
              <button onClick={() => {}} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', padding: '12px 6px', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.08)', backgroundColor: 'rgba(255,255,255,0.04)', cursor: 'pointer' }}>
              <img src="/bleie.png" alt="bleie" style={{ width: '40px', height: '40px', objectFit: 'contain', filter: 'brightness(0) invert(1) sepia(1) saturate(0.3) hue-rotate(220deg)' }} />
                <div style={{ fontSize: '10px', fontFamily: 'var(--font-inter)', color: '#8A8FA8' }}>Bleieskift</div>
              </button>
              <button onClick={() => {}} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', padding: '12px 6px', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.08)', backgroundColor: 'rgba(255,255,255,0.04)', cursor: 'pointer' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="2" fill="#8A8FA8"/>
                  <circle cx="5" cy="12" r="2" fill="#8A8FA8"/>
                  <circle cx="19" cy="12" r="2" fill="#8A8FA8"/>
                </svg>
                <div style={{ fontSize: '10px', fontFamily: 'var(--font-inter)', color: '#8A8FA8' }}>Annet</div>
              </button>
            </div>
          </div>

          {/* Skap ro */}
<div style={{ backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', padding: '14px 16px', marginBottom: '16px' }}>
  <div style={{ fontSize: '13px', fontFamily: 'var(--font-plus-jakarta)', color: '#E8DDD0', fontWeight: '600', marginBottom: '12px' }}>Skap ro</div>
  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
    <button onClick={() => setVisLydPanel(true)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', padding: '20px 16px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.08)', backgroundColor: 'rgba(255,255,255,0.06)', cursor: 'pointer', width: '100%' }}>
    <img src="/lydbolge.png" alt="lyder" style={{ width: '100%', height: '60px', objectFit: 'contain' }} />
      <div style={{ fontSize: '13px', fontFamily: 'var(--font-inter)', color: '#C4A882' }}>Lyder</div>
    </button>
    <button onClick={() => setVisNattlys(true)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', padding: '20px 16px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.08)', backgroundColor: 'rgba(255,255,255,0.06)', cursor: 'pointer', width: '100%' }}>
    <img src="/nattlampe.png" alt="nattlys" style={{ width: '90px', height: '90px', objectFit: 'contain' }} />
      <div style={{ fontSize: '13px', fontFamily: 'var(--font-inter)', color: '#C4A882' }}>Nattlys</div>
    </button>
    <button onClick={() => setVisPust(true)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', padding: '20px 16px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.08)', backgroundColor: 'rgba(255,255,255,0.06)', cursor: 'pointer', width: '100%' }}>
    <img src="/pusteboble.png" alt="pust" style={{ width: '90px', height: '90px', objectFit: 'contain' }} />
      <div style={{ fontSize: '13px', fontFamily: 'var(--font-inter)', color: '#C4A882' }}>Pust med meg</div>
    </button>
  </div>
</div>

          {/* Knapper */}
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={stoppSøvn} style={{ flex: 2, padding: '16px', backgroundColor: '#4A5580', border: 'none', borderRadius: '28px', fontSize: '14px', fontWeight: '600', fontFamily: 'var(--font-inter)', color: '#FDFAF6', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              Avslutt natta
            </button>
            <button onClick={registrerOppvåkning} style={{ flex: 1, padding: '16px', backgroundColor: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '28px', fontSize: '12px', fontFamily: 'var(--font-inter)', color: '#C4A882', cursor: 'pointer', textAlign: 'center' }}>
              Nattlig<br/>oppvåkning
            </button>
          </div>
        </div>

        {/* Paneler */}
        {visLydPanel && <LydPanel onLukk={() => setVisLydPanel(false)} />}
        {visNattlys && <NattlysPanel onLukk={() => setVisNattlys(false)} />}
        {visPust && <PustMedMeg onLukk={() => setVisPust(false)} />}
      </div>
    );
  }

  return null;
}