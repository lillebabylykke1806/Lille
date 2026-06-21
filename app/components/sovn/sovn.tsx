'use client';
import { farger } from '../../lib/farger';
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { hentProfilId } from '../../lib/profilId';
import NattlysPanel from './NattlysPanel';
import PustMedMeg from './PustMedMeg';
import LydPanel from './LydPanel';

type Props = { bruker: any; aktivtBarn?: any; åpneEtterregistrer?: boolean; åpneMorgen?: boolean; onNavigate?: (side: string) => void; };
type TidslinjeItem = { id?: number; tid: string; slutt?: string; tekst: string; type: string; varighet?: number; };

const tilTidsformat = (tid: string): string => {
  if (!tid) return '';
  return tid.slice(0, 5); // Tar bare HH:MM
};

const dagensdato = () => new Date().toISOString().split('T')[0];

const SIGNALER = [
  { id: 'gned', label: 'Gned øynene' },
  { id: 'gjesping', label: 'Gjesping' },
  { id: 'stirret', label: 'Stirret tomt' },
  { id: 'hodet', label: 'Vendte hodet' },
];

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
      <img src="/tateflaske.png" alt="amming" style={{ width: '32px', height: '32px', objectFit: 'contain' }} />
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

export default function Sovn({ bruker, aktivtBarn, åpneEtterregistrer, åpneMorgen, onNavigate }: Props) {
  const [visning, setVisning] = useState<'velg' | 'lurAktiv' | 'nattAktiv' | 'etterregistrer' | 'morgen'>('velg');
  const [startTid, setStartTid] = useState<Date | null>(null);
  const [lurId, setLurId] = useState<number | null>(null);
  const [minutter, setMinutter] = useState(0);
  const [søvnType, setSøvnType] = useState<'lur' | 'natt' | null>(null);
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
  const [nattMinutter, setNattMinutter] = useState(0);
  const [visEgetSignal, setVisEgetSignal] = useState(false);
  const [egetSignalTekst, setEgetSignalTekst] = useState('');
  const [redigerLur, setRedigerLur] = useState<TidslinjeItem | null>(null);
  const [redigerStart, setRedigerStart] = useState('');
  const [redigerSlutt, setRedigerSlutt] = useState('');
  const [lurFerdig, setLurFerdig] = useState(false);
  const [nattligOppvåkning, setNattligOppvåkning] = useState(false);
const [oppvåkningStart, setOppvåkningStart] = useState<Date | null>(null);
const [oppvåkningMinutter, setOppvåkningMinutter] = useState(0);
const [visAnnetModal, setVisAnnetModal] = useState(false);
const [annetTekst, setAnnetTekst] = useState('');

  const lastTidslinje = useCallback(async () => {
    const profilId = await hentProfilId(aktivtBarn, bruker);
    if (!profilId) return;
    const { data } = await supabase
      .from('lurer')
      .select('*')
      .eq('profil_id', profilId)
      .eq('dato', dagensdato())
      .order('start', { ascending: true });
    if (!data) return;
    const items: TidslinjeItem[] = data.map((l: any) => ({
      id: l.id,
      tid: l.start,
      slutt: l.slutt,
      tekst: l.type === 'lur' ? 'Lur' : l.type === 'natt' ? 'Sovnet' : l.type === 'oppvåkning' ? 'Våknet' : l.type === 'amming' ? 'Amming' : l.tekst || l.type,
      type: l.type,
      varighet: l.varighet,
    }));
    setTidslinje(items);
    const oppvåkninger = data.filter((l: any) => l.type === 'oppvåkning').length;
    if (oppvåkninger === 0) setSøvnkvalitet('Utmerket');
    else if (oppvåkninger <= 2) setSøvnkvalitet('God');
    else if (oppvåkninger <= 4) setSøvnkvalitet('Ok');
    else setSøvnkvalitet('Urolig');
  }, [bruker, aktivtBarn]);

  useEffect(() => {
    const lagretStartTid = localStorage.getItem('lille_starttid');
    const lagretType = localStorage.getItem('lille_sovtype');
    const lagretLurId = localStorage.getItem('lille_lurid');
    if (lagretStartTid && lagretType) {
      setStartTid(new Date(lagretStartTid));
      setSøvnType(lagretType as 'lur' | 'natt');
      setVisning(lagretType === 'natt' ? 'nattAktiv' : 'lurAktiv');
      if (lagretLurId) setLurId(parseInt(lagretLurId));
    }
    lastTidslinje();
  }, [lastTidslinje]);

  useEffect(() => {
    if (åpneEtterregistrer) {
      const igår = new Date();
      igår.setDate(igår.getDate() - 1);
      setNyDato(igår.toISOString().split('T')[0]);
      setNyType('natt');
      setVisning('etterregistrer');
    }
  }, [åpneEtterregistrer]);

  useEffect(() => {
    if (åpneMorgen) setVisning('morgen');
  }, [åpneMorgen]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined;
    if (visning === 'nattAktiv' && nattligOppvåkning && oppvåkningStart) {
      interval = setInterval(() => {
        const diff = Math.floor((Date.now() - oppvåkningStart.getTime()) / 1000);
        setOppvåkningMinutter(Math.floor(diff / 60));
      }, 1000);
    } else if (startTid && !lurFerdig && (visning === 'lurAktiv' || visning === 'nattAktiv')) {
      interval = setInterval(() => {
        const diff = Math.floor((Date.now() - startTid.getTime()) / 1000);
        setMinutter(Math.floor(diff / 60));
      }, 1000);
    }
    return () => { if (interval) clearInterval(interval); };
  }, [startTid, visning, lurFerdig, nattligOppvåkning, oppvåkningStart]);

  const startSøvn = async (type: 'lur' | 'natt') => {
    const profilId = await hentProfilId(aktivtBarn, bruker);
    if (!profilId) return;
    const nå = new Date();
    setStartTid(nå);
    setSøvnType(type);
    setValgteSignaler([]);
    setLurFerdig(false);
    localStorage.setItem('lille_starttid', nå.toISOString());
    localStorage.setItem('lille_sovtype', type);
    const { data } = await supabase.from('lurer').insert({
      profil_id: profilId, dato: dagensdato(), type,
      start: nå.toLocaleTimeString('no-NO', { hour: '2-digit', minute: '2-digit' }),
      slutt: null, varighet: 0, signaler: '',
    }).select();
    if (data?.[0]) {
      setLurId(data[0].id);
      localStorage.setItem('lille_lurid', data[0].id.toString());
    }
    if (type === 'natt') {
      setVisManeAnimasjon(true);
      setVisning('nattAktiv');
      lastTidslinje();
      setTimeout(() => setVisManeAnimasjon(false), 2000);
    } else {
      setVisning('lurAktiv');
      lastTidslinje();
    }
  };

  const registrerOppvåkning = async () => {
    const profilId = await hentProfilId(aktivtBarn, bruker);
    if (!profilId) return;
    const nå = new Date();
    await supabase.from('lurer').insert({
      profil_id: profilId, dato: dagensdato(), type: 'oppvåkning',
      start: nå.toLocaleTimeString('no-NO', { hour: '2-digit', minute: '2-digit' }),
      slutt: null, varighet: 0, signaler: '',
    });
    setNattligOppvåkning(true);
    setOppvåkningStart(nå);
    setOppvåkningMinutter(0);
    lastTidslinje();
  };
  
  const startSøvnIgjen = async () => {
    const profilId = await hentProfilId(aktivtBarn, bruker);
    if (!profilId) return;
    const nå = new Date();
    const { data } = await supabase.from('lurer').insert({
      profil_id: profilId, dato: dagensdato(), type: 'natt',
      start: nå.toLocaleTimeString('no-NO', { hour: '2-digit', minute: '2-digit' }),
      slutt: null, varighet: 0, signaler: '',
    }).select();
    if (data?.[0]) {
      setLurId(data[0].id);
      localStorage.setItem('lille_lurid', data[0].id.toString());
    }
    setNattligOppvåkning(false);
    setOppvåkningStart(null);
    setOppvåkningMinutter(0);
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
    const varighetMinutter = Math.floor(diff / 60);
    if (lurId) {
      await supabase.from('lurer').update({
        slutt: slutt.toLocaleTimeString('no-NO', { hour: '2-digit', minute: '2-digit' }),
        varighet: varighetMinutter,
      }).eq('id', lurId);
    }
    localStorage.removeItem('lille_starttid');
    localStorage.removeItem('lille_sovtype');
    localStorage.removeItem('lille_lurid');
    setNattMinutter(varighetMinutter);
    setStartTid(null); setSøvnType(null); setLurId(null);
    if (søvnType === 'natt') {
      setVisning('morgen');
    } else {
      setLurFerdig(true);
    }
    lastTidslinje();
  };

  const lagreEtterregistrert = async () => {
    if (!nyStart) return;
    const profilId = await hentProfilId(aktivtBarn, bruker);
    if (!profilId) return;
    const [sh, sm] = nyStart.split(':').map(Number);
    let varighet = 0;
    let sluttDato = nyDato;
    if (nySlutt) {
      const [eh, em] = nySlutt.split(':').map(Number);
      varighet = (eh * 60 + em) - (sh * 60 + sm);
      if (varighet < 0) {
        varighet += 24 * 60;
        const neste = new Date(nyDato);
        neste.setDate(neste.getDate() + 1);
        sluttDato = neste.toISOString().split('T')[0];
      }
    }
    await supabase.from('lurer').insert({
      profil_id: profilId, dato: nyDato, type: nyType,
      start: nyStart, slutt: nySlutt || null, varighet, signaler: '',
    });
    if (nySlutt) {
      await supabase.from('lurer').insert({
        profil_id: profilId, dato: dagensdato(), type: 'oppvåkning',
        start: nySlutt, slutt: null, varighet: 0, signaler: '',
      });
    }
    setNyStart(''); setNySlutt('');
    setVisning('velg'); lastTidslinje();
  };

  const lagreRedigertLur = async () => {
    if (!redigerLur?.id || !redigerStart) return;
    const [sh, sm] = redigerStart.split(':').map(Number);
    let varighet = 0;
    if (redigerSlutt) {
      const [eh, em] = redigerSlutt.split(':').map(Number);
      varighet = (eh * 60 + em) - (sh * 60 + sm);
      if (varighet < 0) varighet += 24 * 60;
    }
    await supabase.from('lurer').update({
      start: redigerStart,
      slutt: redigerSlutt || null,
      varighet,
    }).eq('id', redigerLur.id);
    setRedigerLur(null);
    lastTidslinje();
  };

  const søvnmelding = () => {
    if (minutter < 60) return 'Baby sover 🌙 Natta har så vidt begynt – la ro senke seg.';
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
  const antallOppvåkninger = tidslinje.filter(t => t.type === 'oppvåkning').length;

  const RedigerModal = () => (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 200, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }} onClick={() => setRedigerLur(null)}>
      <div onClick={e => e.stopPropagation()} style={{ backgroundColor: farger.hvit, width: '100%', maxWidth: '430px', borderRadius: '24px 24px 0 0', padding: '24px', paddingBottom: '48px' }}>
        <div style={{ width: '36px', height: '4px', backgroundColor: farger.kremMørk, borderRadius: '2px', margin: '0 auto 20px' }} />
        <div style={{ fontSize: '18px', fontFamily: 'var(--font-plus-jakarta)', color: farger.tekst, fontWeight: '700', marginBottom: '20px' }}>
          Rediger {redigerLur?.tekst}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
          <div>
            <div style={{ fontSize: '12px', fontFamily: 'var(--font-inter)', color: farger.tekstLys, fontWeight: '600', marginBottom: '6px' }}>Starttid</div>
            <input type="time" value={redigerStart} onChange={e => setRedigerStart(e.target.value)} style={{ width: '100%', padding: '12px', fontSize: '16px', border: `1px solid ${farger.kremMørk}`, borderRadius: '10px', backgroundColor: farger.bakgrunn, color: farger.tekst, outline: 'none', fontFamily: 'var(--font-inter)', boxSizing: 'border-box', textAlign: 'center' }} />
          </div>
          <div>
            <div style={{ fontSize: '12px', fontFamily: 'var(--font-inter)', color: farger.tekstLys, fontWeight: '600', marginBottom: '6px' }}>Sluttid</div>
            <input type="time" value={redigerSlutt} onChange={e => setRedigerSlutt(e.target.value)} style={{ width: '100%', padding: '12px', fontSize: '16px', border: `1px solid ${farger.kremMørk}`, borderRadius: '10px', backgroundColor: farger.bakgrunn, color: farger.tekst, outline: 'none', fontFamily: 'var(--font-inter)', boxSizing: 'border-box', textAlign: 'center' }} />
          </div>
        </div>
        <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
  <button onClick={() => setRedigerLur(null)} style={{ flex: 1, padding: '14px', backgroundColor: 'transparent', border: `1px solid ${farger.kremMørk}`, borderRadius: '12px', fontSize: '14px', color: farger.tekstLys, cursor: 'pointer', fontFamily: 'var(--font-inter)' }}>Avbryt</button>
  <button onClick={lagreRedigertLur} style={{ flex: 2, padding: '14px', backgroundColor: farger.grønn, border: 'none', borderRadius: '12px', fontSize: '14px', fontWeight: '600', color: '#FDFAF6', cursor: 'pointer', fontFamily: 'var(--font-inter)' }}>Lagre</button>
</div>
<button onClick={async () => {
  if (!redigerLur?.id) return;
  await supabase.from('lurer').delete().eq('id', redigerLur.id);
  setRedigerLur(null);
  lastTidslinje();
}} style={{ width: '100%', padding: '14px', backgroundColor: 'transparent', border: '1px solid #C48E7B', borderRadius: '12px', fontSize: '14px', color: '#C48E7B', cursor: 'pointer', fontFamily: 'var(--font-inter)' }}>
  🗑️ Slett registrering
</button>
      </div>
    </div>
  );

  // MORGEN-SKJERM
  if (visning === 'morgen') {
    return (
      <div style={{ backgroundColor: '#F7F3EC', minHeight: '100vh', padding: '48px 24px 100px' }}>
        <style>{`
          @keyframes solOpp { 0%{transform:translateY(60px);opacity:0} 100%{transform:translateY(0);opacity:1} }
          @keyframes fadeOpp { 0%{opacity:0;transform:translateY(10px)} 100%{opacity:1;transform:translateY(0)} }
          @keyframes spin { to { transform: rotate(360deg); } }
        `}</style>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px', animation: 'solOpp 1s ease-out forwards' }}>
          <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
            <circle cx="40" cy="40" r="22" fill="#F4A853" opacity="0.9"/>
            <line x1="40" y1="6" x2="40" y2="16" stroke="#F4A853" strokeWidth="3" strokeLinecap="round"/>
            <line x1="40" y1="64" x2="40" y2="74" stroke="#F4A853" strokeWidth="3" strokeLinecap="round"/>
            <line x1="6" y1="40" x2="16" y2="40" stroke="#F4A853" strokeWidth="3" strokeLinecap="round"/>
            <line x1="64" y1="40" x2="74" y2="40" stroke="#F4A853" strokeWidth="3" strokeLinecap="round"/>
            <line x1="15" y1="15" x2="22" y2="22" stroke="#F4A853" strokeWidth="2.5" strokeLinecap="round"/>
            <line x1="58" y1="58" x2="65" y2="65" stroke="#F4A853" strokeWidth="2.5" strokeLinecap="round"/>
            <line x1="65" y1="15" x2="58" y2="22" stroke="#F4A853" strokeWidth="2.5" strokeLinecap="round"/>
            <line x1="22" y1="58" x2="15" y2="65" stroke="#F4A853" strokeWidth="2.5" strokeLinecap="round"/>
          </svg>
        </div>
        <div style={{ textAlign: 'center', marginBottom: '32px', animation: 'fadeOpp 0.8s 0.3s ease-out both' }}>
          <div style={{ fontSize: '28px', fontFamily: 'var(--font-plus-jakarta)', color: farger.tekst, fontWeight: '700', marginBottom: '8px' }}>God morgen! 🌿</div>
          <div style={{ fontSize: '14px', fontFamily: 'var(--font-inter)', color: farger.tekstLys, lineHeight: 1.6 }}>
            {nattMinutter >= 360 ? `Baby sov i ${Math.floor(nattMinutter / 60)} timer og ${nattMinutter % 60} minutter` : 'Natta er over – ny dag begynner'}
          </div>
        </div>
        <div style={{ backgroundColor: farger.hvit, border: `1px solid ${farger.kremMørk}`, borderRadius: '20px', padding: '20px', marginBottom: '16px', animation: 'fadeOpp 0.8s 0.5s ease-out both' }}>
          <div style={{ fontSize: '15px', fontFamily: 'var(--font-plus-jakarta)', color: farger.tekst, fontWeight: '600', marginBottom: '16px' }}>Nattens sammendrag</div>
          <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
  <div style={{ flex: 1, backgroundColor: farger.bakgrunn, borderRadius: '14px', padding: '14px', textAlign: 'center' }}>
    <div style={{ fontSize: '22px', fontFamily: 'var(--font-plus-jakarta)', color: farger.grønn, fontWeight: '700' }}>{Math.floor(nattMinutter / 60)}t {nattMinutter % 60}m</div>
    <div style={{ fontSize: '11px', fontFamily: 'var(--font-inter)', color: farger.tekstLys }}>Total søvntid</div>
  </div>
  <div style={{ flex: 1, backgroundColor: farger.bakgrunn, borderRadius: '14px', padding: '14px', textAlign: 'center' }}>
    <div style={{ fontSize: '22px', fontFamily: 'var(--font-plus-jakarta)', color: antallOppvåkninger > 3 ? '#C48E7B' : farger.grønn, fontWeight: '700' }}>{antallOppvåkninger}</div>
    <div style={{ fontSize: '11px', fontFamily: 'var(--font-inter)', color: farger.tekstLys }}>Oppvåkninger</div>
  </div>
  <div style={{ flex: 1, backgroundColor: farger.bakgrunn, borderRadius: '14px', padding: '14px', textAlign: 'center' }}>
    <div style={{ fontSize: '22px', fontFamily: 'var(--font-plus-jakarta)', color: farger.grønn, fontWeight: '700' }}>
      {(() => {
        const nattLurer = tidslinje.filter(t => t.type === 'natt' || t.type === 'lur');
        if (nattLurer.length === 0) return '—';
        let lengst = 0;
        nattLurer.forEach(l => { if (l.varighet && l.varighet > lengst) lengst = l.varighet; });
        if (lengst === 0) return '—';
        return `${Math.floor(lengst / 60)}t ${lengst % 60}m`;
      })()}
    </div>
    <div style={{ fontSize: '11px', fontFamily: 'var(--font-inter)', color: farger.tekstLys }}>Lengste strekk</div>
  </div>
</div>
          {tidslinje.length > 0 && (
            <div style={{ overflowX: 'auto', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-end', minWidth: `${tidslinje.length * 70}px`, paddingBottom: '8px' }}>
                {tidslinje.map((item, i) => (
                  <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                    <div style={{ fontSize: '9px', fontFamily: 'var(--font-inter)', color: farger.tekstLys, marginBottom: '2px' }}>{item.tid}</div>
                    <div style={{ fontSize: '9px', fontFamily: 'var(--font-inter)', color: farger.tekstLys, marginBottom: '6px', textAlign: 'center', lineHeight: 1.2 }}>{item.tekst}</div>
                    <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                      {i > 0 && <div style={{ flex: 1, height: '1px', backgroundColor: farger.kremMørk }} />}
                      <TidslinjeIkon type={item.type} />
                      {i < tidslinje.length - 1 && <div style={{ flex: 1, height: '1px', backgroundColor: farger.kremMørk }} />}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div style={{ padding: '12px', backgroundColor: farger.bakgrunn, borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ fontSize: '20px' }}>{søvnkvalitet === 'Utmerket' ? '⭐' : søvnkvalitet === 'God' ? '🌿' : søvnkvalitet === 'Ok' ? '🌙' : '💛'}</div>
            <div>
              <div style={{ fontSize: '13px', fontFamily: 'var(--font-inter)', color: farger.tekst, fontWeight: '600' }}>{søvnkvalitet} natt</div>
              <div style={{ fontSize: '11px', fontFamily: 'var(--font-inter)', color: farger.tekstLys }}>
                {søvnkvalitet === 'Utmerket' ? 'Baby sov fantastisk! Du kan være stolt 🤍' : søvnkvalitet === 'God' ? 'En god natt med lite uro' : søvnkvalitet === 'Ok' ? 'Litt urolig, men ok' : 'Tøff natt – du gjør det bra!'}
              </div>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', animation: 'fadeOpp 0.8s 0.7s ease-out both' }}>
          <button onClick={async () => { await registrerOppvåkning(); setVisning('velg'); lastTidslinje(); }} style={{ width: '100%', padding: '16px', backgroundColor: farger.grønnLys, border: `1px solid ${farger.grønn}`, borderRadius: '16px', fontSize: '15px', fontWeight: '600', color: farger.grønn, cursor: 'pointer', fontFamily: 'var(--font-inter)' }}>
            Start dagen 🌿
          </button>
          <button onClick={() => { setNyTidStr(new Date().toLocaleTimeString('no-NO', { hour: '2-digit', minute: '2-digit' })); setVisJusterTid(true); }} style={{ background: 'none', border: 'none', fontSize: '12px', fontFamily: 'var(--font-inter)', color: farger.tekstLys, cursor: 'pointer', textDecoration: 'underline', padding: '4px' }}>
            Ikke riktig tidspunkt? Juster oppvåkning
          </button>
          {visJusterTid && (
            <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', zIndex: 200, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }} onClick={() => setVisJusterTid(false)}>
              <div onClick={e => e.stopPropagation()} style={{ backgroundColor: farger.hvit, width: '100%', maxWidth: '430px', borderRadius: '24px 24px 0 0', padding: '24px', paddingBottom: '48px' }}>
                <div style={{ width: '36px', height: '4px', backgroundColor: farger.kremMørk, borderRadius: '2px', margin: '0 auto 20px' }} />
                <div style={{ fontSize: '18px', fontFamily: 'var(--font-plus-jakarta)', color: farger.tekst, fontWeight: '600', marginBottom: '20px' }}>Når våknet babyen?</div>
                <input type="time" value={nyTidStr} onChange={e => setNyTidStr(e.target.value)} style={{ width: '100%', padding: '14px 16px', fontSize: '22px', border: `1px solid ${farger.kremMørk}`, borderRadius: '12px', backgroundColor: farger.bakgrunn, color: farger.tekst, outline: 'none', fontFamily: 'var(--font-inter)', boxSizing: 'border-box', marginBottom: '20px', textAlign: 'center' }} />
                <button onClick={async () => {
                  const profilId = await hentProfilId(aktivtBarn, bruker);
                  if (!profilId) return;
                  await supabase.from('lurer').insert({ profil_id: profilId, dato: dagensdato(), type: 'oppvåkning', start: nyTidStr, slutt: null, varighet: 0, signaler: '' });
                  setVisJusterTid(false); setVisning('velg'); lastTidslinje();
                }} style={{ width: '100%', padding: '16px', backgroundColor: farger.grønnLys, border: `1px solid ${farger.grønn}`, borderRadius: '16px', fontSize: '15px', fontWeight: '600', color: farger.grønn, cursor: 'pointer', fontFamily: 'var(--font-inter)' }}>
                  Lagre oppvåkning
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // VELG-SKJERM
  if (visning === 'velg') {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <div style={{ marginBottom: '8px', position: 'relative', display: 'inline-block' }}>
          <img src="/mane.png" alt="måne" style={{ width: '150px', height: 'auto', maskImage: 'radial-gradient(ellipse 70% 75% at 35% 52%, black 30%, transparent 68%)', WebkitMaskImage: 'radial-gradient(ellipse 70% 75% at 35% 52%, black 30%, transparent 68%)' }} />
        </div>
        <div style={{ fontSize: '22px', fontFamily: 'var(--font-plus-jakarta)', color: farger.tekst, marginBottom: '4px', lineHeight: 1.3 }}>Hva slags søvn<br/>skal du registrere?</div>
        <div style={{ fontSize: '13px', fontFamily: 'var(--font-inter)', color: farger.tekstLys, marginBottom: '28px' }}>Velg type for best mulig innsikt</div>
        <div style={{ marginBottom: '10px' }}>
          <button onClick={() => startSøvn('lur')} style={{ width: '100%', padding: '18px 20px', backgroundColor: farger.hvit, border: `1px solid ${farger.kremMørk}`, borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '16px', cursor: 'pointer', textAlign: 'left' }}>
            <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
              <circle cx="18" cy="18" r="7" fill="#F4A853"/>
              <line x1="18" y1="3" x2="18" y2="8" stroke="#F4A853" strokeWidth="2" strokeLinecap="round"/>
              <line x1="18" y1="28" x2="18" y2="33" stroke="#F4A853" strokeWidth="2" strokeLinecap="round"/>
              <line x1="3" y1="18" x2="8" y2="18" stroke="#F4A853" strokeWidth="2" strokeLinecap="round"/>
              <line x1="28" y1="18" x2="33" y2="18" stroke="#F4A853" strokeWidth="2" strokeLinecap="round"/>
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

  // ETTERREGISTRER
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
              <div style={{ fontSize: '11px', fontFamily: 'var(--font-inter)', color: farger.tekstLys, marginTop: '6px' }}>Sover babyen fortsatt? La sluttid stå tom.</div>
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

  // LUR AKTIV
  if (visning === 'lurAktiv') {
    const sisteLurFerdig = lurFerdig ? tidslinje.filter(t => t.type === 'lur').slice(-1)[0] : null;
    return (
      <div style={{ backgroundColor: '#F8F3EE', minHeight: '100vh', position: 'relative', overflow: 'hidden' }}>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <Bølger />
        <div style={{ position: 'relative', zIndex: 1, padding: '16px 24px 120px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <button onClick={() => { setLurFerdig(false); setVisning('velg'); }} style={{ background: 'none', border: 'none', color: farger.tekstLys, cursor: 'pointer', fontSize: '24px' }}>‹</button>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '14px', fontFamily: 'var(--font-plus-jakarta)', color: farger.tekst, fontWeight: '700', letterSpacing: '0.08em' }}>{lurFerdig ? 'LUR AVSLUTTET' : 'LUR'}</div>
              <div style={{ fontSize: '12px', fontFamily: 'var(--font-inter)', color: farger.tekstLys }}>Dagtidssøvn</div>
            </div>
            <div style={{ width: '32px' }} />
          </div>

          {lurFerdig ? (
            <div style={{ textAlign: 'center', padding: '32px 0' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>✅</div>
              <div style={{ fontSize: '20px', fontFamily: 'var(--font-plus-jakarta)', color: farger.tekst, fontWeight: '700', marginBottom: '8px' }}>Lur registrert!</div>
              {sisteLurFerdig && (
                <div style={{ fontSize: '13px', fontFamily: 'var(--font-inter)', color: farger.tekstLys, marginBottom: '24px' }}>
                  {sisteLurFerdig.tid}{sisteLurFerdig.slutt ? ` – ${sisteLurFerdig.slutt}` : ''} · {sisteLurFerdig.varighet} min
                </div>
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <button onClick={() => { setLurFerdig(false); setVisning('velg'); }} style={{ width: '100%', padding: '16px', backgroundColor: farger.grønn, border: 'none', borderRadius: '16px', fontSize: '15px', fontWeight: '600', color: '#FDFAF6', cursor: 'pointer', fontFamily: 'var(--font-inter)' }}>
                  Tilbake 🌿
                </button>
                {sisteLurFerdig && (
                  <button onClick={() => { setRedigerLur(sisteLurFerdig); setRedigerStart(sisteLurFerdig.tid); setRedigerSlutt(sisteLurFerdig.slutt || ''); }} style={{ width: '100%', padding: '16px', backgroundColor: 'transparent', border: `1px solid ${farger.kremMørk}`, borderRadius: '16px', fontSize: '14px', color: farger.tekstLys, cursor: 'pointer', fontFamily: 'var(--font-inter)' }}>
                    Juster tidspunkt
                  </button>
                )}
              </div>
            </div>
          ) : (
            <>
              <div style={{ position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '16px', minHeight: '260px', zIndex: 1 }}>
                <button onClick={() => { setNyTidStr(startTid?.toLocaleTimeString('no-NO', { hour: '2-digit', minute: '2-digit' }) || ''); setVisJusterTid(!visJusterTid); }} style={{ background: 'none', border: 'none', cursor: 'pointer', position: 'relative', width: '220px', height: '220px' }}>
                  <svg width="220" height="220" viewBox="0 0 220 220">
                    <defs>
                      <linearGradient id="lurGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#A8B5A2"/>
                        <stop offset="50%" stopColor="#EBC8B4"/>
                        <stop offset="100%" stopColor="#A8B5A2"/>
                      </linearGradient>
                    </defs>
                    <circle cx="110" cy="110" r="95" fill="#F5EFE6"/>
                    <circle cx="110" cy="110" r="95" fill="none" stroke="#EDE5D8" strokeWidth="12"/>
                    <circle cx="110" cy="110" r="95" fill="none" stroke="url(#lurGrad)" strokeWidth="12" strokeLinecap="round"
                      strokeDasharray={circumference} strokeDashoffset={circumference - progress * circumference}
                      transform="rotate(-90 110 110)" style={{ transition: 'stroke-dashoffset 1s linear' }}/>
                  </svg>
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
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
                <button onClick={stoppSøvn} style={{ flex: 2, padding: '16px', backgroundColor: '#A8B5A2', border: 'none', borderRadius: '28px', fontSize: '15px', fontWeight: '600', fontFamily: 'var(--font-inter)', color: '#FDFAF6', cursor: 'pointer' }}>
                  Avslutt lur
                </button>
              </div>

              {/* Signaler */}
              <div style={{ backgroundColor: farger.hvit, border: `1px solid ${farger.kremMørk}`, borderRadius: '16px', padding: '16px', marginBottom: '12px' }}>
                <div style={{ fontSize: '15px', fontFamily: 'var(--font-plus-jakarta)', color: farger.tekst, marginBottom: '4px' }}>Signaler før lur</div>
                <div style={{ fontSize: '12px', fontFamily: 'var(--font-inter)', color: farger.tekstLys, marginBottom: '14px' }}>Hva har babyen vist før luren?</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                  {SIGNALER.map(signal => (
                    <button key={signal.id} onClick={() => toggleSignal(signal.id)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', padding: '10px 4px', borderRadius: '12px', border: valgteSignaler.includes(signal.id) ? `1.5px solid ${farger.grønn}` : `1px solid ${farger.kremMørk}`, backgroundColor: valgteSignaler.includes(signal.id) ? farger.grønnLys : farger.bakgrunn, cursor: 'pointer' }}>
                      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                        <path d="M10 16C10 16 3 11 3 6.5C3 4.5 4.5 3 6.5 3C7.8 3 9 3.7 10 5C11 3.7 12.2 3 13.5 3C15.5 3 17 4.5 17 6.5C17 11 10 16 10 16Z" fill={valgteSignaler.includes(signal.id) ? farger.grønn : 'none'} stroke={valgteSignaler.includes(signal.id) ? farger.grønn : '#8A7060'} strokeWidth="1.3"/>
                      </svg>
                      <div style={{ fontSize: '9px', fontFamily: 'var(--font-inter)', color: valgteSignaler.includes(signal.id) ? farger.grønn : farger.tekstLys, textAlign: 'center', lineHeight: 1.2 }}>{signal.label}</div>
                    </button>
                  ))}
                </div>
                <button onClick={() => setVisEgetSignal(true)} style={{ width: '100%', padding: '12px', backgroundColor: 'transparent', border: `1.5px dashed ${farger.kremMørk}`, borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer', marginTop: '8px' }}>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <circle cx="8" cy="8" r="7" stroke="#8A7060" strokeWidth="1.3"/>
                    <line x1="8" y1="5" x2="8" y2="11" stroke="#8A7060" strokeWidth="1.3" strokeLinecap="round"/>
                    <line x1="5" y1="8" x2="11" y2="8" stroke="#8A7060" strokeWidth="1.3" strokeLinecap="round"/>
                  </svg>
                  <span style={{ fontSize: '13px', fontFamily: 'var(--font-inter)', color: farger.tekstLys }}>Legg til eget signal</span>
                </button>
              </div>
            </>
          )}

   {/* Tidslinje */}
{tidslinje.length > 0 && (
  <div style={{ backgroundColor: farger.hvit, border: `1px solid ${farger.kremMørk}`, borderRadius: '16px', padding: '16px', marginBottom: '16px' }}>
    <div style={{ fontSize: '16px', fontFamily: 'var(--font-plus-jakarta)', color: farger.tekst, fontWeight: '600', marginBottom: '4px' }}>I dag</div>
    <div style={{ fontSize: '11px', fontFamily: 'var(--font-inter)', color: farger.tekstLys, marginBottom: '14px' }}>Trykk på en lur for å redigere tid</div>
    <div style={{ overflowX: 'auto' }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', minWidth: `${tidslinje.length * 80}px`, paddingBottom: '8px' }}>
        {tidslinje.map((item, i) => (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
            <div style={{ fontSize: '10px', fontFamily: 'var(--font-inter)', color: farger.tekstLys, marginBottom: '2px' }}>{item.tid}{item.slutt ? `–${item.slutt}` : ''}</div>
            <div style={{ fontSize: '10px', fontFamily: 'var(--font-inter)', color: farger.tekstLys, marginBottom: '8px', textAlign: 'center' }}>{item.tekst}</div>
            <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
              {i > 0 && <div style={{ flex: 1, height: '1px', backgroundColor: farger.kremMørk }} />}
              <button
                onClick={() => { if (item.type === 'lur' || item.type === 'natt') { setRedigerLur(item); setRedigerStart(tilTidsformat(item.tid)); setRedigerSlutt(tilTidsformat(item.slutt || '')); } }}
                style={{ background: 'none', border: 'none', padding: 0, cursor: (item.type === 'lur' || item.type === 'natt') ? 'pointer' : 'default' }}
              >
                <TidslinjeIkon type={item.type} />
              </button>
              {i < tidslinje.length - 1 && <div style={{ flex: 1, height: '1px', backgroundColor: farger.kremMørk }} />}
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
)}

          {/* Eget signal modal */}
          {visEgetSignal && (
            <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', zIndex: 200, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }} onClick={() => setVisEgetSignal(false)}>
              <div onClick={e => e.stopPropagation()} style={{ backgroundColor: farger.hvit, width: '100%', maxWidth: '430px', borderRadius: '24px 24px 0 0', padding: '24px', paddingBottom: '48px' }}>
                <div style={{ width: '36px', height: '4px', backgroundColor: farger.kremMørk, borderRadius: '2px', margin: '0 auto 20px' }} />
                <div style={{ fontSize: '18px', fontFamily: 'var(--font-plus-jakarta)', color: farger.tekst, fontWeight: '600', marginBottom: '20px' }}>Legg til eget signal</div>
                <input type="text" value={egetSignalTekst} onChange={e => setEgetSignalTekst(e.target.value)} placeholder="F.eks. Klynket, Gned ansiktet..." autoFocus style={{ width: '100%', padding: '14px 16px', fontSize: '15px', border: `1px solid ${farger.kremMørk}`, borderRadius: '12px', backgroundColor: farger.bakgrunn, color: farger.tekst, outline: 'none', fontFamily: 'var(--font-inter)', boxSizing: 'border-box', marginBottom: '20px' }} />
                <button onClick={async () => {
                  if (!egetSignalTekst.trim()) return;
                  const nyeSignaler = [...valgteSignaler, egetSignalTekst.trim()];
                  setValgteSignaler(nyeSignaler);
                  if (lurId) await supabase.from('lurer').update({ signaler: nyeSignaler.join(',') }).eq('id', lurId);
                  setEgetSignalTekst(''); setVisEgetSignal(false);
                }} style={{ width: '100%', padding: '16px', backgroundColor: farger.grønnLys, border: `1px solid ${farger.grønn}`, borderRadius: '16px', fontSize: '15px', fontWeight: '600', color: farger.grønn, cursor: 'pointer', fontFamily: 'var(--font-inter)' }}>
                  Lagre signal
                </button>
              </div>
            </div>
          )}

          {redigerLur && <RedigerModal />}
        </div>
      </div>
    );
  }

  // NATT AKTIV
  if (visning === 'nattAktiv') {
    return (
      <div style={{ backgroundColor: '#0D1B3E', minHeight: '100vh', position: 'fixed', inset: 0, zIndex: 50, overflowY: 'auto' }}>
        <style>{`
          @keyframes moonRise { 0%{transform:translateY(140px);opacity:0} 100%{transform:translateY(0px);opacity:1} }
          @keyframes moonFloat { 0%,100%{transform:translateY(0px)} 50%{transform:translateY(-8px)} }
          @keyframes twinkleStar { 0%,100%{opacity:0.15;transform:scale(0.8)} 50%{opacity:1;transform:scale(1.2)} }
        `}</style>
        {[
          {x:8,y:6,s:6,d:0,op:0.7},{x:20,y:4,s:5,d:0.5,op:0.5},{x:35,y:8,s:6,d:1,op:0.8},
          {x:50,y:5,s:4,d:0.3,op:0.6},{x:65,y:7,s:7,d:0.8,op:0.9},{x:78,y:4,s:5,d:1.2,op:0.5},
          {x:88,y:8,s:6,d:0.6,op:0.7},{x:12,y:15,s:5,d:0.2,op:0.8},{x:28,y:18,s:6,d:0.9,op:0.5},
          {x:45,y:14,s:4,d:1.4,op:0.7},{x:60,y:16,s:7,d:0.4,op:0.9},{x:75,y:12,s:5,d:1.1,op:0.6},
        ].map((s, i) => (
          <div key={i} style={{ position: 'fixed', left: `${s.x}%`, top: `${s.y}%`, pointerEvents: 'none', animation: `twinkleStar ${2 + s.d}s ${s.d}s infinite ease-in-out` }}>
            <svg viewBox="0 0 10 10" fill="none" width={s.s} height={s.s}>
              <path d="M5 0L5.8 3.8L10 5L5.8 6.2L5 10L4.2 6.2L0 5L4.2 3.8Z" fill="#E8C87A" opacity={s.op}/>
            </svg>
          </div>
        ))}
        <div style={{ position: 'relative', zIndex: 1, padding: '16px 24px 140px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <button onClick={() => setVisning('velg')} style={{ background: 'none', border: 'none', color: '#8A8FA8', cursor: 'pointer', fontSize: '24px' }}>‹</button>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '14px', fontFamily: 'var(--font-plus-jakarta)', color: '#E8DDD0', fontWeight: '700', letterSpacing: '0.08em' }}>NATTA</div>
              <div style={{ fontSize: '12px', fontFamily: 'var(--font-inter)', color: '#8A8FA8' }}>Nattesøvn</div>
            </div>
            <div style={{ width: '32px' }} />
          </div>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '260px', marginBottom: '16px', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', left: '-20px', top: '-10px', pointerEvents: 'none', animation: visManeAnimasjon ? 'moonRise 1.5s ease-out forwards' : 'moonFloat 5s ease-in-out infinite' }}>
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
                </defs>
                <circle cx="100" cy="100" r="88" fill="#1A2A5E" stroke="rgba(255,255,255,0.05)" strokeWidth="1"/>
                <circle cx="100" cy="100" r="88" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="10"/>
                <circle cx="100" cy="100" r="88" fill="none" stroke="url(#nattGrad)" strokeWidth="10" strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * 88} strokeDashoffset={2 * Math.PI * 88 - progress * 2 * Math.PI * 88}
                  transform="rotate(-90 100 100)" style={{ transition: 'stroke-dashoffset 1s linear' }}/>
              </svg>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
  <div style={{ fontSize: '11px', fontFamily: 'var(--font-inter)', color: nattligOppvåkning ? '#F4A853' : '#8A8FA8', marginBottom: '2px' }}>
    {nattligOppvåkning ? 'Våken siden' : 'Baby sover'}
  </div>
  <div style={{ fontSize: '32px', fontFamily: 'var(--font-plus-jakarta)', color: nattligOppvåkning ? '#F4A853' : '#FDFAF6', fontWeight: '700', lineHeight: 1 }}>
    {nattligOppvåkning
      ? `${String(Math.floor(oppvåkningMinutter / 60)).padStart(2, '0')}:${String(oppvåkningMinutter % 60).padStart(2, '0')}`
      : timerTekst}
  </div>
  <button onClick={() => { setNyTidStr(startTid?.toLocaleTimeString('no-NO', { hour: '2-digit', minute: '2-digit' }) || ''); setVisJusterTid(!visJusterTid); }} style={{ background: 'none', border: 'none', cursor: 'pointer', marginTop: '6px' }}>
    <div style={{ fontSize: '11px', fontFamily: 'var(--font-inter)', color: '#8A8FA8', textDecoration: 'underline' }}>Siden {startTid?.toLocaleTimeString('no-NO', { hour: '2-digit', minute: '2-digit' })}</div>
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
          <div style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '14px 16px', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <span style={{ fontSize: '14px' }}>✨</span>
              <div style={{ fontSize: '13px', fontFamily: 'var(--font-plus-jakarta)', color: '#E8DDD0', fontWeight: '600' }}>Nattens innsikt</div>
            </div>
            <div style={{ fontSize: '13px', fontFamily: 'var(--font-inter)', color: '#C4A882', lineHeight: 1.6 }}>{søvnmelding()}</div>
          </div>
          <div style={{ backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', padding: '14px 16px', marginBottom: '16px' }}>
            <div style={{ fontSize: '13px', fontFamily: 'var(--font-plus-jakarta)', color: '#E8DDD0', fontWeight: '600', marginBottom: '12px' }}>Signaler i kveld</div>
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
            <button onClick={() => setVisEgetSignal(true)} style={{ width: '100%', padding: '12px', backgroundColor: 'transparent', border: '1.5px dashed rgba(255,255,255,0.15)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer', marginTop: '8px' }}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <circle cx="8" cy="8" r="7" stroke="rgba(255,255,255,0.4)" strokeWidth="1.3"/>
                <line x1="8" y1="5" x2="8" y2="11" stroke="rgba(255,255,255,0.4)" strokeWidth="1.3" strokeLinecap="round"/>
                <line x1="5" y1="8" x2="11" y2="8" stroke="rgba(255,255,255,0.4)" strokeWidth="1.3" strokeLinecap="round"/>
              </svg>
              <span style={{ fontSize: '13px', fontFamily: 'var(--font-inter)', color: '#8A8FA8' }}>Legg til eget signal</span>
            </button>
          </div>
          {tidslinje.length > 0 && (
            <div style={{ position: 'relative', backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', padding: '14px 16px', marginBottom: '16px', overflow: 'hidden' }}>
              <div style={{ fontSize: '13px', fontFamily: 'var(--font-plus-jakarta)', color: '#E8DDD0', fontWeight: '600', marginBottom: '12px' }}>Nattens tidslinje</div>
              <div style={{ overflowX: 'auto', overflowY: 'hidden' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', minWidth: `${tidslinje.length * 80}px` }}>
                  {tidslinje.map((item, i) => (
                    <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                      <div style={{ fontSize: '10px', fontFamily: 'var(--font-inter)', color: '#8A8FA8', marginBottom: '2px' }}>{item.tid}</div>
                      <div style={{ fontSize: '10px', fontFamily: 'var(--font-inter)', color: '#8A8FA8', marginBottom: '8px', textAlign: 'center', lineHeight: 1.2 }}>{item.tekst}</div>
                      <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                        {i > 0 && <div style={{ flex: 1, height: '1px', backgroundColor: 'rgba(255,255,255,0.1)' }} />}
                        <button onClick={() => { if (item.type === 'natt') { setRedigerLur(item); setRedigerStart(item.tid); setRedigerSlutt(item.slutt || ''); } }} style={{ background: 'none', border: 'none', padding: 0, cursor: item.type === 'natt' ? 'pointer' : 'default' }}>
                          <TidslinjeIkon type={item.type} mørk={true} />
                        </button>
                        {i < tidslinje.length - 1 && <div style={{ flex: 1, height: '1px', backgroundColor: 'rgba(255,255,255,0.1)' }} />}
                        {i === tidslinje.length - 1 && <div style={{ flex: 1, height: '1px', borderTop: '1px dashed rgba(255,255,255,0.1)' }} />}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
          <div style={{ backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', padding: '14px 16px', marginBottom: '16px' }}>
            <div style={{ fontSize: '13px', fontFamily: 'var(--font-plus-jakarta)', color: '#E8DDD0', fontWeight: '600', marginBottom: '12px' }}>Hurtigregistrering</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
              <button type="button" onClick={() => registrerOppvåkning()} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', padding: '12px 6px', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.08)', backgroundColor: 'rgba(255,255,255,0.04)', cursor: 'pointer' }}>
                <div style={{ width: '56px', height: '56px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="5" stroke="#F4A853" strokeWidth="1.5" fill="none"/>
                    <line x1="12" y1="2" x2="12" y2="5" stroke="#F4A853" strokeWidth="1.5" strokeLinecap="round"/>
                    <line x1="12" y1="19" x2="12" y2="22" stroke="#F4A853" strokeWidth="1.5" strokeLinecap="round"/>
                    <line x1="2" y1="12" x2="5" y2="12" stroke="#F4A853" strokeWidth="1.5" strokeLinecap="round"/>
                    <line x1="19" y1="12" x2="22" y2="12" stroke="#F4A853" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                </div>
                <div style={{ fontSize: '10px', fontFamily: 'var(--font-inter)', color: '#8A8FA8' }}>Våknet</div>
              </button>
              <button type="button" onClick={() => onNavigate?.('amming')} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', padding: '12px 6px', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.08)', backgroundColor: 'rgba(255,255,255,0.04)', cursor: 'pointer' }}>
                <img src="/tateflaske.png" alt="amming" style={{ width: '56px', height: '56px', minHeight: '56px', objectFit: 'contain' }} />
                <div style={{ fontSize: '10px', fontFamily: 'var(--font-inter)', color: '#8A8FA8' }}>Ammet</div>
              </button>
              <button type="button" onClick={() => onNavigate?.('bleie')} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', padding: '12px 6px', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.08)', backgroundColor: 'rgba(255,255,255,0.04)', cursor: 'pointer' }}>
                <img src="/bleie.png" alt="bleie" style={{ width: '56px', height: '56px', minHeight: '56px', objectFit: 'contain', filter: 'brightness(0) invert(1) sepia(1) saturate(0.3) hue-rotate(220deg)' }} />
                <div style={{ fontSize: '10px', fontFamily: 'var(--font-inter)', color: '#8A8FA8' }}>Bleieskift</div>
              </button>
              <button type="button" onClick={() => setVisAnnetModal(true)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', padding: '12px 6px', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.08)', backgroundColor: 'rgba(255,255,255,0.04)', cursor: 'pointer' }}>
                <div style={{ width: '56px', height: '56px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="2" fill="#8A8FA8"/>
                    <circle cx="5" cy="12" r="2" fill="#8A8FA8"/>
                    <circle cx="19" cy="12" r="2" fill="#8A8FA8"/>
                  </svg>
                </div>
                <div style={{ fontSize: '10px', fontFamily: 'var(--font-inter)', color: '#8A8FA8' }}>Annet</div>
              </button>
              </div>
          </div>
          <div style={{ backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', padding: '14px 16px', marginBottom: '16px' }}>
            <div style={{ fontSize: '13px', fontFamily: 'var(--font-plus-jakarta)', color: '#E8DDD0', fontWeight: '600', marginBottom: '12px' }}>Skap ro</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
              <button onClick={() => setVisLydPanel(true)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', padding: '12px 6px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.08)', backgroundColor: 'rgba(255,255,255,0.06)', cursor: 'pointer' }}>
                <img src="/lydbolge.png" alt="lyder" style={{ width: '100%', height: '50px', minHeight: '90px', objectFit: 'contain' }} />
                <div style={{ fontSize: '11px', fontFamily: 'var(--font-inter)', color: '#C4A882' }}>Lyder</div>
              </button>
              <button onClick={() => setVisNattlys(true)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', padding: '12px 6px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.08)', backgroundColor: 'rgba(255,255,255,0.06)', cursor: 'pointer' }}>
                <img src="/nattlampe.png" alt="nattlys" style={{ width: '70px', height: '70px', minHeight: '90px', objectFit: 'contain' }} />
                <div style={{ fontSize: '11px', fontFamily: 'var(--font-inter)', color: '#C4A882' }}>Nattlys</div>
              </button>
              <button onClick={() => setVisPust(true)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', padding: '12px 6px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.08)', backgroundColor: 'rgba(255,255,255,0.06)', cursor: 'pointer' }}>
                <img src="/pusteboble.png" alt="pust" style={{ width: '90px', height: '90px', minHeight: '90px', objectFit: 'contain' }} />
                <div style={{ fontSize: '11px', fontFamily: 'var(--font-inter)', color: '#C4A882' }}>Pust med meg</div>
              </button>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={stoppSøvn} style={{ flex: 2, padding: '16px', backgroundColor: '#4A5580', border: 'none', borderRadius: '28px', fontSize: '14px', fontWeight: '600', fontFamily: 'var(--font-inter)', color: '#FDFAF6', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              Avslutt natta
            </button>
            <button onClick={nattligOppvåkning ? startSøvnIgjen : registrerOppvåkning} style={{ flex: 1, padding: '16px', backgroundColor: nattligOppvåkning ? 'rgba(138,174,224,0.15)' : 'rgba(255,255,255,0.06)', border: `1px solid ${nattligOppvåkning ? 'rgba(138,174,224,0.4)' : 'rgba(255,255,255,0.12)'}`, borderRadius: '28px', fontSize: '12px', fontFamily: 'var(--font-inter)', color: nattligOppvåkning ? '#8AAEE0' : '#C4A882', cursor: 'pointer', textAlign: 'center' }}>
  {nattligOppvåkning ? 'Start søvnen\nigjen' : 'Nattlig\noppvåkning'}
</button>
          </div>
          {redigerLur && <RedigerModal />}
        </div>
        {visAnnetModal && (
          <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 200, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }} onClick={() => setVisAnnetModal(false)}>
            <div onClick={e => e.stopPropagation()} style={{ backgroundColor: farger.hvit, width: '100%', maxWidth: '430px', borderRadius: '24px 24px 0 0', padding: '24px', paddingBottom: '48px' }}>
              <div style={{ width: '36px', height: '4px', backgroundColor: farger.kremMørk, borderRadius: '2px', margin: '0 auto 20px' }} />
              <div style={{ fontSize: '18px', fontFamily: 'var(--font-plus-jakarta)', color: farger.tekst, fontWeight: '600', marginBottom: '20px' }}>Registrer noe annet</div>
              <textarea
                value={annetTekst}
                onChange={e => setAnnetTekst(e.target.value)}
                placeholder="F.eks. trøstet, ga vann, skiftet pyjamas..."
                autoFocus
                style={{ width: '100%', padding: '14px 16px', fontSize: '15px', border: `1px solid ${farger.kremMørk}`, borderRadius: '12px', backgroundColor: farger.bakgrunn, color: farger.tekst, outline: 'none', fontFamily: 'var(--font-inter)', resize: 'none', minHeight: '90px', boxSizing: 'border-box', marginBottom: '20px' }}
              />
              <button onClick={async () => {
                if (!annetTekst.trim()) return;
                const profilId = await hentProfilId(aktivtBarn, bruker);
                if (!profilId) return;
                const nå = new Date();
                await supabase.from('lurer').insert({
                  profil_id: profilId, dato: dagensdato(), type: 'annet',
                  start: nå.toLocaleTimeString('no-NO', { hour: '2-digit', minute: '2-digit' }),
                  slutt: null, varighet: 0, signaler: annetTekst.trim(),
                });
                setAnnetTekst('');
                setVisAnnetModal(false);
                lastTidslinje();
              }} style={{ width: '100%', padding: '16px', backgroundColor: farger.grønnLys, border: `1px solid ${farger.grønn}`, borderRadius: '16px', fontSize: '15px', fontWeight: '600', color: farger.grønn, cursor: 'pointer', fontFamily: 'var(--font-inter)' }}>
                Lagre
              </button>
            </div>
          </div>
        )}
        {visLydPanel && <LydPanel onLukk={() => setVisLydPanel(false)} />}
        {visNattlys && <NattlysPanel onLukk={() => setVisNattlys(false)} />}
        {visPust && <PustMedMeg onLukk={() => setVisPust(false)} />}
      </div>
    );
  }

  return null;
}