'use client';
import { farger } from '../../lib/farger';
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase';

type Props = { bruker: any; };
type TidslinjeItem = { tid: string; tekst: string; type: string; };

const dagensdato = () => new Date().toISOString().split('T')[0];

const SIGNALER = [
  { id: 'gned', label: 'Gned øynene', emoji: '👀' },
  { id: 'stirret', label: 'Stirret tomt', emoji: '😶' },
  { id: 'gjesping', label: 'Gjesping', emoji: '🥱' },
  { id: 'hodet', label: 'Vendte hodet bort', emoji: '↩️' },
  { id: 'kranglete', label: 'Ble kranglete', emoji: '😣' },
  { id: 'interesse', label: 'Mistet interesse', emoji: '😴' },
  { id: 'ben', label: 'Trakk ben opp', emoji: '🦵' },
  { id: 'rygg', label: 'Bøyde ryggen', emoji: '🫸' },
  { id: 'luft', label: 'Mye luft', emoji: '💨' },
  { id: 'mat', label: 'Knotete etter mat', emoji: '🍼' },
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
        @keyframes bgDark { 0%{background:rgba(26,31,46,0)} 100%{background:rgba(26,31,46,0.97)} }
      `}</style>
      <div style={{ position: 'absolute', inset: 0, animation: 'bgDark 1.5s ease forwards' }} />
      {partikler.map(p => (
        <div key={p.id} style={{ position: 'absolute', left: `${p.x}%`, top: `${p.y}%`, width: `${p.størrelse}px`, height: `${p.størrelse}px`, borderRadius: '50%', backgroundColor: p.farge, boxShadow: `0 0 ${p.størrelse * 2}px ${p.farge}`, animation: `glitterFall 2s ${p.forsinkelse}s ease-in forwards` }} />
      ))}
    </div>
  );
};

const Bølger = () => (
  <svg viewBox="0 0 430 180" style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: '180px' }} preserveAspectRatio="none">
    <path d="M0 120 C60 80 120 140 180 100 C240 60 300 130 360 90 C400 65 430 80 430 80 L430 180 L0 180 Z" fill="#D6E5DF" opacity="0.5"/>
    <path d="M0 140 C80 100 160 160 240 120 C300 90 370 140 430 110 L430 180 L0 180 Z" fill="#D6E5DF" opacity="0.7"/>
    <path d="M0 160 C100 130 200 170 300 145 C370 128 430 150 430 150 L430 180 L0 180 Z" fill="#C8D8D0" opacity="0.6"/>
  </svg>
);

const TidslinjeIkon = ({ type, mørk = false }: { type: string; mørk?: boolean }) => {
  const bg = mørk ? 'rgba(255,255,255,0.1)' : farger.kremMørk;
  const size = 36;
  if (type === 'lur' || type === 'natt') return (
    <div style={{ width: size, height: size, borderRadius: '50%', backgroundColor: mørk ? '#3D4F7C' : '#D6E5DF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <path d="M21 12.5C20.4 15.8 17.5 18 14 18C10 18 7 15 7 11C7 8 9 5.5 12 4.5C9.5 7 9.5 11.5 12.5 14C15.5 16.5 19.5 15.5 21 12.5Z" fill={mørk ? '#7C8FD4' : farger.grønn}/>
      </svg>
    </div>
  );
  if (type === 'amming') return (
    <div style={{ width: size, height: size, borderRadius: '50%', backgroundColor: mørk ? '#4A3D5C' : '#F2E4D8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <span style={{ fontSize: '14px' }}>🍼</span>
    </div>
  );
  if (type === 'oppvåkning') return (
    <div style={{ width: size, height: size, borderRadius: '50%', backgroundColor: mørk ? '#3D4A5C' : '#E8F0EC', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <span style={{ fontSize: '14px' }}>😴</span>
    </div>
  );
  if (type === 'uro') return (
    <div style={{ width: size, height: size, borderRadius: '50%', backgroundColor: mørk ? '#5C3D3D' : '#F5E6E6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <span style={{ fontSize: '14px' }}>💛</span>
    </div>
  );
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', backgroundColor: bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <span style={{ fontSize: '14px' }}>⭐</span>
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
  const [tipIndex] = useState(Math.floor(Math.random() * TIPS_NATT.length));
  const [nyDato, setNyDato] = useState(dagensdato());
  const [nyType, setNyType] = useState<'lur' | 'natt'>('lur');
  const [nyStart, setNyStart] = useState('');
  const [nySlutt, setNySlutt] = useState('');

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
      tekst: l.type === 'lur' ? 'Lur' : l.type === 'natt' ? 'Sovnet' : l.type === 'oppvåkning' ? 'Våknet kort' : l.type === 'amming' ? 'Amming' : l.tekst || l.type,
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
      setTimeout(() => { setVisGlitter(false); setVisning('nattAktiv'); lastTidslinje(); }, 2500);
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
    if (søvnkvalitet === 'Utmerket') return 'Fantastisk natt! ✨ Baby har sovet godt og sammenhengende.';
    if (søvnkvalitet === 'God') return 'Nydelig start på natta ✨ Baby har sovet godt og hatt få oppvåkninger.';
    if (søvnkvalitet === 'Ok') return 'En grei natt 🌙 Litt uro, men baby sover.';
    return 'Urolig natt 💛 Baby trenger ekstra ro og nærhet nå.';
  };

  const circumference = 2 * Math.PI * 85;
  const progress = Math.min((minutter % 60) / 60, 1);
  const strokeDashoffset = circumference - progress * circumference;

  if (visGlitter) return <GlitterOvergang onDone={() => {}} />;

  if (visning === 'velg') {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>

        {/* Måne med stjerner */}
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
          <img
            src="/mane.png"
            alt="måne"
            style={{
              width: '150px',
              height: 'auto',
              maskImage: 'radial-gradient(ellipse 70% 75% at 35% 52%, black 30%, transparent 68%)',
              WebkitMaskImage: 'radial-gradient(ellipse 70% 75% at 35% 52%, black 30%, transparent 68%)',
            }}
          />
        </div>

        <div style={{ fontSize: '22px', fontFamily: 'var(--font-plus-jakarta)', color: farger.tekst, marginBottom: '4px', lineHeight: 1.3 }}>
          Hva slags søvn<br/>skal du registrere?
        </div>
        <div style={{ fontSize: '13px', fontFamily: 'var(--font-inter)', color: farger.tekstLys, marginBottom: '28px' }}>
          Velg type for best mulig innsikt
        </div>

        {/* Lur-knapp */}
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

        {/* Natt-knapp */}
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
      <div style={{ backgroundColor: '#F8F3EE', minHeight: '100vh', position: 'relative', overflow: 'hidden' }}>
        <Bølger />
        <div style={{ position: 'relative', zIndex: 1, padding: '16px 24px 120px' }}>

          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <button onClick={() => setVisning('velg')} style={{ background: 'none', border: 'none', color: farger.tekstLys, cursor: 'pointer', fontSize: '24px' }}>‹</button>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '14px', fontFamily: 'var(--font-plus-jakarta)', color: farger.tekst, fontWeight: '700', letterSpacing: '0.08em' }}>LUR</div>
              <div style={{ fontSize: '12px', fontFamily: 'var(--font-inter)', color: farger.tekstLys }}>Dagtidssøvn</div>
            </div>
            <div style={{ width: '32px' }} />
          </div>

          {/* Timer område */}
          <div style={{ position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '16px', minHeight: '260px' }}>

            {/* Sol øverst til venstre */}
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

           

            {/* Sirkulær timer */}
            <button
              onClick={() => { setNyTidStr(startTid?.toLocaleTimeString('no-NO', { hour: '2-digit', minute: '2-digit' }) || ''); setVisJusterTid(!visJusterTid); }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', position: 'relative', width: '220px', height: '220px' }}
            >
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
    strokeDasharray={2 * Math.PI * 95}
    strokeDashoffset={2 * Math.PI * 95 - progress * 2 * Math.PI * 95}
    transform="rotate(-90 110 110)" style={{ transition: 'stroke-dashoffset 1s linear' }}/>
</svg>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                {/* Hjerte ikon */}
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" style={{ marginBottom: '6px' }}>
                  <path d="M9 15C9 15 2 10.5 2 6C2 4 3.5 2.5 5.5 2.5C7 2.5 8.2 3.3 9 4.5C9.8 3.3 11 2.5 12.5 2.5C14.5 2.5 16 4 16 6C16 10.5 9 15 9 15Z" fill="none" stroke="#C48E7B" strokeWidth="1.3"/>
                </svg>
                <div style={{ fontSize: '13px', fontFamily: 'var(--font-inter)', color: farger.tekstLys, marginBottom: '4px' }}>Luren pågår</div>
                <div style={{ fontSize: '40px', fontFamily: 'var(--font-plus-jakarta)', color: farger.tekst, fontWeight: '700', lineHeight: 1.1 }}>
                  {String(Math.floor(minutter / 60)).padStart(2, '0')}:{String(minutter % 60).padStart(2, '0')}
                </div>
                <div style={{ fontSize: '11px', fontFamily: 'var(--font-inter)', color: farger.tekstLys, marginTop: '4px', textDecoration: 'underline' }}>
                  Trykk for å justere tid
                </div>
              </div>
            </button>
          </div>

          {/* Juster tid */}
          {visJusterTid && (
            <div style={{ backgroundColor: farger.hvit, border: `1px solid ${farger.kremMørk}`, borderRadius: '12px', padding: '12px 16px', marginBottom: '12px', display: 'flex', gap: '8px', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ fontSize: '12px', fontFamily: 'var(--font-inter)', color: farger.tekstLys }}>Sett starttid:</div>
              <input type="time" value={nyTidStr} onChange={e => setNyTidStr(e.target.value)} style={{ padding: '6px 10px', fontSize: '15px', border: `1px solid ${farger.kremMørk}`, borderRadius: '8px', backgroundColor: farger.bakgrunn, color: farger.tekst, outline: 'none', fontFamily: 'var(--font-inter)' }} />
              <button onClick={justerStartTidManuelt} style={{ padding: '6px 14px', backgroundColor: farger.grønn, border: 'none', borderRadius: '8px', color: '#fff', fontSize: '13px', cursor: 'pointer', fontFamily: 'var(--font-inter)' }}>OK</button>
            </div>
          )}

          {/* Knapper */}
          <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
            <button onClick={stoppSøvn} style={{ flex: 2, padding: '16px', backgroundColor: '#A8B5A2', border: 'none', borderRadius: '28px', fontSize: '15px', fontWeight: '600', fontFamily: 'var(--font-inter)', color: '#FDFAF6', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              Avslutt lur
              <div style={{ width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.6)', borderRadius: '3px' }} />
            </button>
            <button style={{ flex: 1, padding: '16px', backgroundColor: farger.hvit, border: `1px solid ${farger.kremMørk}`, borderRadius: '28px', fontSize: '14px', fontFamily: 'var(--font-inter)', color: farger.tekstLys, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
              Pauser <span style={{ letterSpacing: '2px' }}>||</span>
            </button>
          </div>

          {/* Signaler */}
          <div style={{ backgroundColor: farger.hvit, border: `1px solid ${farger.kremMørk}`, borderRadius: '16px', padding: '16px', marginBottom: '16px' }}>
            <div style={{ fontSize: '15px', fontFamily: 'var(--font-plus-jakarta)', color: farger.tekst, marginBottom: '4px' }}>Signaler før lur</div>
            <div style={{ fontSize: '12px', fontFamily: 'var(--font-inter)', color: farger.tekstLys, marginBottom: '14px' }}>Hva har babyen vist før luren?</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px' }}>
              {SIGNALER.map(signal => (
                <button key={signal.id} onClick={() => toggleSignal(signal.id)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', padding: '8px 4px', borderRadius: '10px', border: valgteSignaler.includes(signal.id) ? `1.5px solid ${farger.grønn}` : `1px solid ${farger.kremMørk}`, backgroundColor: valgteSignaler.includes(signal.id) ? farger.grønnLys : farger.bakgrunn, cursor: 'pointer' }}>
                  <div style={{ fontSize: '18px' }}>{signal.emoji}</div>
                  <div style={{ fontSize: '9px', fontFamily: 'var(--font-inter)', color: valgteSignaler.includes(signal.id) ? farger.grønn : farger.tekstLys, textAlign: 'center', lineHeight: 1.2 }}>{signal.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Tidslinje */}
          {tidslinje.length > 0 && (
            <div style={{ backgroundColor: farger.hvit, border: `1px solid ${farger.kremMørk}`, borderRadius: '16px', padding: '16px', marginBottom: '16px' }}>
              <div style={{ fontSize: '16px', fontFamily: 'var(--font-plus-jakarta)', color: farger.tekst, marginBottom: '16px' }}>I dag</div>
              <div style={{ overflowX: 'auto' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', minWidth: `${tidslinje.length * 80}px` }}>
                  {tidslinje.map((item, i) => (
                    <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                      <div style={{ fontSize: '10px', fontFamily: 'var(--font-inter)', color: i === tidslinje.length - 1 ? farger.grønn : farger.tekstLys, fontWeight: i === tidslinje.length - 1 ? '600' : '400', marginBottom: '4px' }}>{item.tid}</div>
                      <div style={{ fontSize: '10px', fontFamily: 'var(--font-inter)', color: i === tidslinje.length - 1 ? farger.grønn : farger.tekstLys, marginBottom: '8px', textAlign: 'center' }}>{item.tekst}</div>
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

          {/* Tips */}
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
      <div style={{ backgroundColor: '#1A1F2E', minHeight: '100vh', position: 'fixed', inset: 0, zIndex: 50, overflowY: 'auto' }}>
        <style>{`
          @keyframes twinkle { 0%,100%{opacity:0.15;transform:scale(1)} 50%{opacity:1;transform:scale(1.3)} }
          @keyframes glitterDrift { 0%{transform:translateX(0) translateY(0);opacity:0.8} 50%{transform:translateX(30px) translateY(-20px);opacity:0.3} 100%{transform:translateX(60px) translateY(0);opacity:0} }
        `}</style>

        {[
          {x:15,y:8,s:2.5,d:0},{x:45,y:5,s:1.5,d:0.5},{x:75,y:10,s:2,d:1},
          {x:88,y:6,s:1,d:0.3},{x:25,y:15,s:1.5,d:0.8},{x:60,y:8,s:1,d:1.2},
          {x:92,y:18,s:2,d:0.6},{x:10,y:25,s:1,d:1.5},{x:35,y:20,s:1.5,d:0.2},
          {x:80,y:22,s:1,d:1.8},{x:50,y:30,s:1,d:0.9},{x:70,y:15,s:2.5,d:0.4},
          {x:5,y:40,s:1.5,d:1.1},{x:95,y:35,s:1,d:0.7},{x:20,y:50,s:1,d:2},
          {x:65,y:45,s:2,d:0.3},{x:85,y:55,s:1.5,d:1.3},{x:40,y:60,s:1,d:0.6},
          {x:55,y:55,s:1,d:1.7},{x:30,y:65,s:2,d:0.1},
        ].map((stjerne, i) => (
          <div key={i} style={{
            position: 'fixed', borderRadius: '50%',
            width: `${stjerne.s}px`, height: `${stjerne.s}px`,
            backgroundColor: i % 5 === 0 ? '#E8C87A' : '#C4A882',
            left: `${stjerne.x}%`, top: `${stjerne.y}%`,
            boxShadow: stjerne.s > 2 ? `0 0 ${stjerne.s * 2}px #C4A882` : 'none',
            animation: `twinkle ${2 + stjerne.d}s ${stjerne.d}s infinite ease-in-out`,
          }} />
        ))}

        <div style={{ position: 'relative', zIndex: 1, padding: '16px 24px 120px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
            <button onClick={() => setVisning('velg')} style={{ background: 'none', border: 'none', color: '#8A8FA8', cursor: 'pointer', fontSize: '24px' }}>‹</button>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '14px', fontFamily: 'var(--font-plus-jakarta)', color: '#E8DDD0', fontWeight: '700', letterSpacing: '0.08em' }}>NATTA</div>
              <div style={{ fontSize: '12px', fontFamily: 'var(--font-inter)', color: '#8A8FA8' }}>Nattesøvn</div>
            </div>
            <div style={{ width: '32px' }} />
          </div>

          <div style={{ position: 'relative', height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ position: 'absolute', left: '10px', top: '10px' }}>
              <svg width="120" height="120" viewBox="0 0 120 120" style={{ filter: 'drop-shadow(0 0 25px rgba(232,200,122,0.6))' }}>
                <path d="M 75 15 C 50 15 32 33 32 58 C 32 83 50 101 75 101 C 60 93 51 77 51 58 C 51 39 60 23 75 15 Z" fill="#E8C87A"/>
                <ellipse cx="56" cy="52" rx="4" ry="5" fill="#D4A843" opacity="0.7"/>
                <ellipse cx="63" cy="68" rx="3" ry="3.5" fill="#D4A843" opacity="0.5"/>
                <path d="M52 55 Q56 60 60 55" stroke="#C49030" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.8"/>
                <circle cx="55" cy="50" r="1.5" fill="#FFF8E0" opacity="0.6"/>
                <circle cx="72" cy="22" r="4" fill="#F5E6C8" opacity="0.25"/>
              </svg>
            </div>
            <div style={{ position: 'relative', width: '200px', height: '200px', marginLeft: '60px' }}>
              <svg width="200" height="200" viewBox="0 0 200 200">
                <defs>
                  <linearGradient id="nattGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#4A5580"/>
                    <stop offset="100%" stopColor="#8B9FD4"/>
                  </linearGradient>
                </defs>
                <circle cx="100" cy="100" r="82" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.06)" strokeWidth="1"/>
                <circle cx="100" cy="100" r="82" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8"/>
                <circle cx="100" cy="100" r="82" fill="none" stroke="url(#nattGrad)" strokeWidth="8" strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * 82}
                  strokeDashoffset={2 * Math.PI * 82 - progress * 2 * Math.PI * 82}
                  transform="rotate(-90 100 100)" style={{ transition: 'stroke-dashoffset 1s linear' }}/>
              </svg>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" style={{ marginBottom: '6px' }}>
                  <path d="M21 12.5C20.4 15.8 17.5 18 14 18C10 18 7 15 7 11C7 8 9 5.5 12 4.5C9.5 7 9.5 11 12.5 13.5C15.5 16 19.5 15 21 12.5Z" fill="none" stroke="#7C8FD4" strokeWidth="1.5"/>
                </svg>
                <div style={{ fontSize: '12px', fontFamily: 'var(--font-inter)', color: '#8A8FA8', marginBottom: '4px' }}>Natta pågår</div>
                <div style={{ fontSize: '36px', fontFamily: 'var(--font-plus-jakarta)', color: '#FDFAF6', fontWeight: '700', lineHeight: 1 }}>
                  {String(Math.floor(minutter / 60)).padStart(2, '0')}:{String(minutter % 60).padStart(2, '0')}
                </div>
                <button onClick={() => { setNyTidStr(startTid?.toLocaleTimeString('no-NO', { hour: '2-digit', minute: '2-digit' }) || ''); setVisJusterTid(!visJusterTid); }} style={{ background: 'none', border: 'none', cursor: 'pointer', marginTop: '4px' }}>
                  <div style={{ fontSize: '11px', fontFamily: 'var(--font-inter)', color: '#8A8FA8', textDecoration: 'underline' }}>
                    Sovnet {startTid?.toLocaleTimeString('no-NO', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </button>
              </div>
            </div>
          </div>

          {visJusterTid && (
            <div style={{ backgroundColor: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '12px 16px', marginBottom: '12px', display: 'flex', gap: '8px', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ fontSize: '12px', fontFamily: 'var(--font-inter)', color: '#8A8FA8' }}>Sett sovnetid:</div>
              <input type="time" value={nyTidStr} onChange={e => setNyTidStr(e.target.value)} style={{ padding: '6px 10px', fontSize: '15px', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px', backgroundColor: 'rgba(255,255,255,0.06)', color: '#FDFAF6', outline: 'none', fontFamily: 'var(--font-inter)' }} />
              <button onClick={justerStartTidManuelt} style={{ padding: '6px 14px', backgroundColor: '#7C8FD4', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '13px', cursor: 'pointer', fontFamily: 'var(--font-inter)' }}>OK</button>
            </div>
          )}

          <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
            <button onClick={stoppSøvn} style={{ flex: 2, padding: '14px', backgroundColor: '#7C8FD4', border: 'none', borderRadius: '24px', fontSize: '14px', fontWeight: '600', fontFamily: 'var(--font-inter)', color: '#FDFAF6', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              Avslutt natta
              <div style={{ width: '18px', height: '18px', border: '2px solid rgba(255,255,255,0.4)', borderRadius: '3px' }} />
            </button>
            <button onClick={registrerOppvåkning} style={{ flex: 1, padding: '14px', backgroundColor: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '24px', fontSize: '12px', fontFamily: 'var(--font-inter)', color: '#C4A882', cursor: 'pointer', textAlign: 'center' }}>
              Nattlig<br/>oppvåkning
            </button>
          </div>

          <div style={{ backgroundColor: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '16px', marginBottom: '16px' }}>
            <div style={{ fontSize: '15px', fontFamily: 'var(--font-plus-jakarta)', color: '#E8DDD0', marginBottom: '14px' }}>Natta oppsummert så langt</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '14px' }}>
              <div>
                <div style={{ fontSize: '10px', fontFamily: 'var(--font-inter)', color: '#8A8FA8', marginBottom: '4px' }}>Sovnet</div>
                <div style={{ fontSize: '16px', fontFamily: 'var(--font-plus-jakarta)', color: '#E8DDD0', fontWeight: '600' }}>{startTid?.toLocaleTimeString('no-NO', { hour: '2-digit', minute: '2-digit' })}</div>
              </div>
              <div>
                <div style={{ fontSize: '10px', fontFamily: 'var(--font-inter)', color: '#8A8FA8', marginBottom: '4px' }}>Sovet</div>
                <div style={{ fontSize: '16px', fontFamily: 'var(--font-plus-jakarta)', color: '#E8DDD0', fontWeight: '600' }}>{String(Math.floor(minutter / 60)).padStart(2, '0')}:{String(minutter % 60).padStart(2, '0')}</div>
              </div>
              <div>
                <div style={{ fontSize: '10px', fontFamily: 'var(--font-inter)', color: '#8A8FA8', marginBottom: '4px' }}>Søvnkvalitet</div>
                <div style={{ fontSize: '16px', fontFamily: 'var(--font-plus-jakarta)', color: søvnkvalitet === 'God' || søvnkvalitet === 'Utmerket' ? '#9FD4B8' : '#E8C87A', fontWeight: '600' }}>{søvnkvalitet}</div>
              </div>
            </div>
            <div style={{ backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: '12px', padding: '12px', display: 'flex', gap: '10px', alignItems: 'center' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'rgba(124,143,212,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ fontSize: '14px' }}>✦</span>
              </div>
              <div style={{ fontSize: '13px', fontFamily: 'var(--font-inter)', color: '#C4A882', lineHeight: 1.5 }}>{søvnmelding()}</div>
            </div>
          </div>

          {tidslinje.length > 0 && (
            <div style={{ backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', padding: '16px', marginBottom: '16px' }}>
              <div style={{ fontSize: '16px', fontFamily: 'var(--font-plus-jakarta)', color: '#E8DDD0', marginBottom: '16px' }}>I natt</div>
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

          <div style={{ backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', padding: '16px' }}>
            <div style={{ fontSize: '11px', letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: 'var(--font-inter)', color: '#8A8FA8', marginBottom: '8px' }}>TIPS</div>
            <div style={{ fontSize: '13px', fontFamily: 'var(--font-inter)', color: '#C4A882', lineHeight: 1.6 }}>{TIPS_NATT[tipIndex]}</div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}