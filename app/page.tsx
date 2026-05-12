'use client';
import { supabase } from './lib/supabase';
import { useState, useEffect } from 'react';

const SIGNALER = [
  'Gned øynene', 'Stirret tomt', 'Gjesping',
  'Vendte hodet bort', 'Ble kranglete', 'Mistet interesse',
  'Trakk ben opp', 'Bøyde ryggen', 'Mye luft', 'Knotete etter mat'
];

const farger = {
  bakgrunn: '#F5EFE6',
  krem: '#EDE5D8',
  kremMørk: '#E0D5C5',
  grønn: '#2D5C45',
  grønnLys: '#D6E5DF',
  terrakotta: '#B05A2F',
  terrakottaLys: '#F2E4D8',
  tekst: '#3D2B1F',
  tekstLys: '#8A7060',
  hvit: '#FDFAF6',
  nattBakgrunn: '#1A1F2E',
  nattKortKant: '#2D3446',
  nattTekst: '#E8DDD0',
  nattTekstLys: '#8A8FA8',
  nattAksent: '#C4A882',
};

const dagensdato = () => new Date().toISOString().split('T')[0];

const formatertDato = (datoStr: string) => {
  const dato = new Date(datoStr);
  const iGår = new Date();
  iGår.setDate(iGår.getDate() - 1);
  if (datoStr === dagensdato()) return 'I dag';
  if (datoStr === iGår.toISOString().split('T')[0]) return 'I går';
  const diffDager = Math.floor((new Date().getTime() - dato.getTime()) / (1000 * 60 * 60 * 24));  if (diffDager < 7) return dato.toLocaleDateString('no-NO', { weekday: 'long', day: 'numeric', month: 'long' });
  if (diffDager < 30) return 'Forrige uke — ' + dato.toLocaleDateString('no-NO', { day: 'numeric', month: 'long' });
  return dato.toLocaleDateString('no-NO', { day: 'numeric', month: 'long', year: 'numeric' });
};

const beregnAlder = (fødselsdato: string) => {
  if (!fødselsdato) return null;
  const født = new Date(fødselsdato);
  const diffMs = new Date().getTime() - født.getTime();
  const uker = Math.floor(diffMs / (1000 * 60 * 60 * 24 * 7));
  const måneder = Math.floor(diffMs / (1000 * 60 * 60 * 24 * 30.5));
  if (uker < 12) return `${uker} uker`;
  if (måneder < 24) return `${måneder} måneder`;
  return `${Math.floor(måneder / 12)} år`;
};

const anbefalingSøvn = (fødselsdato) => {
  if (!fødselsdato) return null;
  const måneder = Math.floor((new Date().getTime() - new Date(fødselsdato).getTime()) / (1000 * 60 * 60 * 24 * 30));
  if (måneder < 3) return { min: 14, max: 17, lurer: '4–5 lurer per dag' };
  if (måneder < 6) return { min: 12, max: 15, lurer: '3–4 lurer per dag' };
  if (måneder < 12) return { min: 12, max: 14, lurer: '2–3 lurer per dag' };
  return { min: 11, max: 14, lurer: '1–2 lurer per dag' };
};

const beregnKolikkNedtelling = (fødselsdato) => {
  if (!fødselsdato) return null;
  const født = new Date(fødselsdato);
  const ukerGammel = Math.floor((new Date().getTime() - født.getTime()) / (1000 * 60 * 60 * 24 * 7));
  const slutterVedUke = 16;
  const ukerIgjen = slutterVedUke - ukerGammel;
  if (ukerGammel >= slutterVedUke) return { ferdig: true, ukerGammel };
  return { ferdig: false, ukerIgjen, ukerGammel };
};

type KolikkLogRad = { time: number; nivå: number };

const beregnKolikkMønster = (kolikkLogger: KolikkLogRad[] | undefined) => {
  if (!kolikkLogger || kolikkLogger.length < 3) return null;
  const timeCount: Record<string, number> = {};
  kolikkLogger.forEach(log => {
    if (log.nivå >= 4) {
      const key = String(log.time);
      timeCount[key] = (timeCount[key] || 0) + 1;
    }
  });
  if (Object.keys(timeCount).length === 0) return null;
  const toppTime = Object.entries(timeCount).sort((a, b) => b[1] - a[1])[0];
  if (toppTime[1] < 2) return null;
  return parseInt(toppTime[0], 10);
};

const sjekkKolikkVarsel = (kolikkMønster) => {
  if (kolikkMønster === null) return null;
  const nå = new Date();
  const minutterTil = (kolikkMønster * 60) - (nå.getHours() * 60 + nå.getMinutes());
  if (minutterTil > 0 && minutterTil <= 45) return minutterTil;
  return null;
};

const GlitterOvergang = () => {
  const partikler = Array.from({ length: 120 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    startY: Math.random() * 30 - 30,
    størrelse: Math.random() * 6 + 1,
    forsinkelse: Math.random() * 2,
    varighet: Math.random() * 1.5 + 1.5,
    farge: ['#C4A882', '#E8DDD0', '#F5E6C8', '#9FD4B8', '#FDFAF6', '#D4B483', '#FFE4B5', '#E8C4A0'][Math.floor(Math.random() * 8)],
    form: Math.random() > 0.5 ? '50%' : Math.random() > 0.5 ? '2px' : '0%',
  }));

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, maxWidth: '430px', margin: '0 auto', overflow: 'hidden', pointerEvents: 'none' }}>
      <style>{`
        @keyframes glitterFall {
          0% { transform: translateY(-30px) rotate(0deg) scale(0); opacity: 0; }
          10% { opacity: 1; transform: translateY(0px) rotate(45deg) scale(1); }
          90% { opacity: 0.9; }
          100% { transform: translateY(110vh) rotate(720deg) scale(0.3); opacity: 0; }
        }
        @keyframes glitterBurst {
          0% { transform: scale(0) rotate(0deg); opacity: 0; }
          30% { transform: scale(1.4) rotate(180deg); opacity: 1; }
          60% { transform: scale(1) rotate(360deg); opacity: 0.8; }
          100% { transform: scale(0) rotate(540deg); opacity: 0; }
        }
        @keyframes bgFade {
          0% { background: rgba(26,31,46,0); }
          30% { background: rgba(26,31,46,0.7); }
          100% { background: rgba(26,31,46,0.95); }
        }
        @keyframes moonRise {
          0% { opacity: 0; transform: translateY(40px) scale(0.5); }
          50% { opacity: 1; transform: translateY(-10px) scale(1.1); }
          100% { opacity: 1; transform: translateY(0px) scale(1); }
        }
        @keyframes textFadeIn {
          0% { opacity: 0; transform: translateY(20px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes shimmer {
          0%, 100% { opacity: 0.4; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.3); }
        }
      `}</style>
      <div style={{ position: 'absolute', inset: 0, animation: 'bgFade 2.5s ease forwards' }} />
      {partikler.map(p => (
        <div key={p.id} style={{ position: 'absolute', left: `${p.x}%`, top: `${p.startY}%`, width: `${p.størrelse}px`, height: `${p.størrelse}px`, borderRadius: p.form, backgroundColor: p.farge, boxShadow: `0 0 ${p.størrelse * 3}px ${p.farge}`, animation: `glitterFall ${p.varighet}s ${p.forsinkelse}s ease-in forwards` }} />
      ))}
      {Array.from({ length: 15 }, (_, i) => ({ id: i, x: 10 + Math.random() * 80, y: 10 + Math.random() * 80, størrelse: Math.random() * 20 + 10, forsinkelse: Math.random() * 1.5 })).map(s => (
        <div key={`star-${s.id}`} style={{ position: 'absolute', left: `${s.x}%`, top: `${s.y}%`, width: `${s.størrelse}px`, height: `${s.størrelse}px`, display: 'flex', alignItems: 'center', justifyContent: 'center', animation: `glitterBurst 1.5s ${s.forsinkelse}s ease forwards` }}>
          <svg width={s.størrelse} height={s.størrelse} viewBox="0 0 20 20">
            <path d="M10 0 L11.5 8.5 L20 10 L11.5 11.5 L10 20 L8.5 11.5 L0 10 L8.5 8.5 Z" fill="#C4A882" opacity="0.9" />
          </svg>
        </div>
      ))}
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '20px' }}>
        <div style={{ animation: 'moonRise 1.5s 0.5s ease forwards', opacity: 0, filter: 'drop-shadow(0 0 40px rgba(196,168,130,0.8))' }}>
          <svg width="120" height="120" viewBox="0 0 100 100">
            <defs><radialGradient id="moonGlitter" cx="35%" cy="35%" r="65%"><stop offset="0%" stopColor="#F5E6C8" /><stop offset="40%" stopColor="#E8C87A" /><stop offset="100%" stopColor="#B8955A" /></radialGradient></defs>
            <path d="M 60 15 C 42 15 28 29 28 50 C 28 71 42 85 60 85 C 48 78 40 65 40 50 C 40 35 48 22 60 15 Z" fill="url(#moonGlitter)" />
          </svg>
        </div>
        <div style={{ textAlign: 'center', animation: 'textFadeIn 1s 1.2s ease forwards', opacity: 0 }}>
          <div style={{ fontSize: '26px', fontStyle: 'italic', fontFamily: 'Georgia, serif', color: '#C4A882', letterSpacing: '-0.5px', marginBottom: '8px' }}>God natt...</div>
          <div style={{ fontSize: '13px', fontFamily: 'sans-serif', color: '#8A8FA8', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Hvil dere begge</div>
        </div>
        <div style={{ display: 'flex', gap: '16px', animation: 'textFadeIn 1s 1.5s ease forwards', opacity: 0 }}>
          {[3, 5, 2, 4, 2, 5, 3].map((s, i) => (
            <div key={i} style={{ width: `${s}px`, height: `${s}px`, borderRadius: '50%', backgroundColor: '#C4A882', boxShadow: `0 0 ${s * 3}px #C4A882`, animation: `shimmer ${1 + i * 0.2}s ${i * 0.1}s infinite` }} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default function Home() {
  const [aktivSide, setAktivSide] = useState('hjem');
  const [babyNavn, setBabyNavn] = useState('');
  const [babyFødselsdato, setBabyFødselsdato] = useState('');
  const [babyBilde, setBabyBilde] = useState(null);
  const [tempNavn, setTempNavn] = useState('');
  const [tempFødselsdato, setTempFødselsdato] = useState('');
  const [sover, setSover] = useState(false);
  const [søvnType, setSøvnType] = useState(null);
  const [visTypeValg, setVisTypeValg] = useState(false);
  const [startTid, setStartTid] = useState(null);
  const [minutter, setMinutter] = useState(0);
  const [sekunder, setSekunder] = useState(0);
  const [lurer, setLurer] = useState([]);
  const [visSignaler, setVisSignaler] = useState(null);
  const [valgteSignaler, setValgteSignaler] = useState([]);
  const [kolikkNivå, setKolikkNivå] = useState(null);
  const [visKolikkPopup, setVisKolikkPopup] = useState(false);
  const [kolikkLogger, setKolikkLogger] = useState([]);
  const [nesteLur, setNesteLur] = useState(null);
  const [visGlitter, setVisGlitter] = useState(false);
  const [bruker, setBruker] = useState(null);
  const [laster, setLaster] = useState(true);
  const [epost, setEpost] = useState('');
  const [passord, setPassord] = useState('');
  const [erNyBruker, setErNyBruker] = useState(false);
  const [innloggingFeil, setInnloggingFeil] = useState('');

  const nattModus = sover && søvnType === 'natt';
  const dagensLurer = lurer.filter(l => l.dato === dagensdato());
  const alder = beregnAlder(babyFødselsdato);
  const søvnAnbefaling = anbefalingSøvn(babyFødselsdato);
  const kolikkInfo = beregnKolikkNedtelling(babyFødselsdato);
  const kolikkMønster = beregnKolikkMønster(kolikkLogger);
  const kolikkVarsel = sjekkKolikkVarsel(kolikkMønster);

  const grupperteLurer = lurer.reduce((acc, lur) => {
    if (!acc[lur.dato]) acc[lur.dato] = [];
    acc[lur.dato].push(lur);
    return acc;
  }, {});
  const sorterteDatoer = Object.keys(grupperteLurer).sort((a, b) => b.localeCompare(a));

  useEffect(() => {
    const lastData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setBruker(session.user);

        const { data: profil } = await supabase
          .from('profiler')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (profil) {
          if (profil.baby_navn) setBabyNavn(profil.baby_navn);
          if (profil.fødselsdato) setBabyFødselsdato(profil.fødselsdato);
        }

        const { data: supaLurer } = await supabase
          .from('lurer')
          .select('*')
          .eq('profil_id', session.user.id)
          .order('opprettet', { ascending: false });

        if (supaLurer && supaLurer.length > 0) {
          setLurer(supaLurer.map(l => ({
            id: l.id, dato: l.dato, type: l.type,
            start: l.start, slutt: l.slutt, varighet: l.varighet,
            signaler: l.signaler ? l.signaler.split(',').filter(s => s) : [],
          })));
        }

        const { data: supaKolikk } = await supabase
          .from('kolikk_logger')
          .select('*')
          .eq('profil_id', session.user.id)
          .order('opprettet', { ascending: false });

        if (supaKolikk && supaKolikk.length > 0) {
          setKolikkLogger(supaKolikk.map(k => ({
            id: k.id, dato: k.dato, time: k.time, minutt: k.minutt, nivå: k.nivå,
          })));
        }
      }

      const lagretBilde = localStorage.getItem('lille_babybilde');
      if (lagretBilde) setBabyBilde(lagretBilde);

      setLaster(false);
    };

    setTimeout(() => setLaster(false), 5000);
    lastData();
  }, []);

  useEffect(() => { if (babyNavn) localStorage.setItem('lille_babynavn', babyNavn); }, [babyNavn]);
  useEffect(() => { if (babyFødselsdato) localStorage.setItem('lille_fødselsdato', babyFødselsdato); }, [babyFødselsdato]);
  useEffect(() => { localStorage.setItem('lille_lurer', JSON.stringify(lurer)); beregnNesteLur(); }, [lurer]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined;
    if (sover && startTid) {
      interval = setInterval(() => {
        const diff = Math.floor((Date.now() - startTid.getTime()) / 1000);
        setMinutter(Math.floor(diff / 60));
        setSekunder(diff % 60);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [sover, startTid]);

  const beregnNesteLur = () => {
    const dagsLurer = lurer.filter(l => l.type === 'lur' && l.dato === dagensdato());
    if (dagsLurer.length < 2) { setNesteLur(null); return; }
    const sisteLur = dagsLurer[0];
    const [h, m] = sisteLur.slutt.split(':').map(Number);
    const nesteStart = h * 60 + m + 90;
    setNesteLur(`${Math.floor(nesteStart / 60) % 24}:${nesteStart % 60 < 10 ? '0' : ''}${nesteStart % 60}`);
  };

  const loggInn = async () => {
    setInnloggingFeil('');
    const { data, error } = await supabase.auth.signInWithPassword({ email: epost, password: passord });
    if (error) { setInnloggingFeil('Feil e-post eller passord. Prøv igjen.'); }
    else { setBruker(data.user); }
  };

  const registrer = async () => {
    setInnloggingFeil('');
    const { data, error } = await supabase.auth.signUp({ email: epost, password: passord });
    if (error) { setInnloggingFeil('Noe gikk galt. Prøv igjen.'); }
    else { setBruker(data.user); }
  };

  const loggUt = async () => {
    await supabase.auth.signOut();
    setBruker(null);
    setBabyNavn('');
    setBabyFødselsdato('');
    setBabyBilde(null);
    setLurer([]);
    setKolikkLogger([]);
    localStorage.clear();
  };

  const velgType = (type) => {
    setSøvnType(type); setVisTypeValg(false);
    setStartTid(new Date()); setSover(true);
    setMinutter(0); setSekunder(0);
    if (type === 'natt') {
      setVisGlitter(true);
      setTimeout(() => setVisGlitter(false), 3500);
    }
  };

  const stoppLur = async () => {
    if (!startTid || !søvnType) return;
    const slutt = new Date();
    const diff = Math.floor((slutt.getTime() - startTid.getTime()) / 1000);
    const nyLur = {
      id: Date.now(), dato: dagensdato(), type: søvnType,
      start: startTid.toLocaleTimeString('no-NO', { hour: '2-digit', minute: '2-digit' }),
      slutt: slutt.toLocaleTimeString('no-NO', { hour: '2-digit', minute: '2-digit' }),
      varighet: Math.floor(diff / 60), signaler: [],
    };
    setLurer(prev => [nyLur, ...prev]);
    if (søvnType === 'lur') setVisSignaler(nyLur.id);
    setValgteSignaler([]); setSover(false); setSøvnType(null);

    const { data } = await supabase.from('lurer').insert({
      profil_id: bruker?.id,
      dato: dagensdato(), type: søvnType,
      start: startTid.toLocaleTimeString('no-NO', { hour: '2-digit', minute: '2-digit' }),
      slutt: slutt.toLocaleTimeString('no-NO', { hour: '2-digit', minute: '2-digit' }),
      varighet: Math.floor(diff / 60), signaler: '',
    }).select();

    if (data && data[0]) {
      setLurer(prev => prev.map(l => l.id === nyLur.id ? { ...l, id: data[0].id } : l));
      setVisSignaler(data[0].id);
    }
  };

  const toggleSignal = (signal) => setValgteSignaler(prev => prev.includes(signal) ? prev.filter(s => s !== signal) : [...prev, signal]);

  const lagreSignaler = async () => {
    setLurer(lurer.map(lur => lur.id === visSignaler ? { ...lur, signaler: valgteSignaler } : lur));
    await supabase.from('lurer').update({ signaler: valgteSignaler.join(',') }).eq('id', visSignaler);
    setVisSignaler(null);
    setValgteSignaler([]);
  };

  const lagreProfil = async () => {
    const navn = tempNavn.trim() || babyNavn;
    const dato = tempFødselsdato || babyFødselsdato;
    if (navn) setBabyNavn(navn);
    if (dato) setBabyFødselsdato(dato);
    await supabase.from('profiler').upsert({ id: bruker?.id, baby_navn: navn, fødselsdato: dato });
    setAktivSide('hjem');
  };

  const håndterBilde = (e) => {
    const fil = e.target.files[0];
    if (!fil) return;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = () => {
      const maks = 200;
      let b = img.width, h = img.height;
      if (b > h) { h = Math.round(h * maks / b); b = maks; } else { b = Math.round(b * maks / h); h = maks; }
      canvas.width = b; canvas.height = h;
      ctx.drawImage(img, 0, 0, b, h);
      const k = canvas.toDataURL('image/jpeg', 0.6);
      setBabyBilde(k);
      try { localStorage.setItem('lille_babybilde', k); } catch (e) { }
    };
    img.src = URL.createObjectURL(fil);
  };

  const velgKolikk = async (tall) => {
    setKolikkNivå(tall);
    if (tall >= 4) {
      setVisKolikkPopup(true);
      const nyLog = { id: Date.now(), dato: dagensdato(), time: new Date().getHours(), minutt: new Date().getMinutes(), nivå: tall };
      setKolikkLogger(prev => [...prev, nyLog]);
      await supabase.from('kolikk_logger').insert({ profil_id: bruker?.id, dato: dagensdato(), time: new Date().getHours(), minutt: new Date().getMinutes(), nivå: tall });
    } else { setVisKolikkPopup(false); }
  };

  const timeGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'God morgen';
    if (h < 18) return 'God ettermiddag';
    return 'God kveld';
  };

  const kort = (ekstra = {}) => ({ backgroundColor: farger.hvit, border: `1px solid ${farger.kremMørk}`, borderRadius: '16px', padding: '20px', marginBottom: '14px', ...ekstra });
  const etikett = (farge = farger.tekstLys) => ({ fontSize: '10px', letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: 'sans-serif', color: farge, marginBottom: '8px' });
  const tittel = (farge = farger.terrakotta) => ({ fontSize: '18px', fontStyle: 'italic', color: farge, margin: '0 0 6px' });

  // LASTESKJERM
  if (laster) {
    return (
      <div style={{ backgroundColor: farger.bakgrunn, minHeight: '100vh', maxWidth: '430px', margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '24px' }}>
        <style>{`
          @keyframes spin { to { transform: rotate(360deg); } }
          @keyframes fadeIn { 0% { opacity: 0; } 100% { opacity: 1; } }
        `}</style>
        <img src="/leep.png" alt="Lille" style={{ width: '180px', height: 'auto', mixBlendMode: 'multiply', animation: 'fadeIn 0.8s ease forwards' }} />
        <div style={{ width: '28px', height: '28px', border: `2px solid ${farger.grønn}`, borderTop: '2px solid transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <div style={{ fontSize: '13px', fontFamily: 'sans-serif', color: farger.tekstLys, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          Laster inn...
        </div>
      </div>
    );
  }

  // INNLOGGINGSSIDE
  if (!bruker) {
    return (
      <div style={{ backgroundColor: farger.bakgrunn, minHeight: '100vh', maxWidth: '430px', margin: '0 auto', fontFamily: 'Georgia, serif', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 24px' }}>
        <div style={{ marginBottom: '32px', textAlign: 'center' }}>
          <img src="/leep.png" alt="Lille" style={{ width: '140px', height: 'auto', marginBottom: '16px', mixBlendMode: 'multiply' }} />
          <div style={{ fontSize: '13px', color: farger.tekstLys, fontFamily: 'sans-serif' }}>Din babys språk, i dine hender</div>
        </div>
        <div style={{ backgroundColor: farger.hvit, border: `1px solid ${farger.kremMørk}`, borderRadius: '16px', padding: '24px', width: '100%' }}>
          <div style={etikett()}>{erNyBruker ? 'Opprett konto' : 'Logg inn'}</div>
          <p style={tittel()}>{erNyBruker ? 'Velkommen til Lille' : 'Hei igjen!'}</p>
          <div style={etikett()}>E-post</div>
          <input type="email" value={epost} onChange={(e) => setEpost(e.target.value)} placeholder="din@epost.no" style={{ width: '100%', padding: '12px 14px', fontSize: '15px', border: `1px solid ${farger.kremMørk}`, borderRadius: '10px', backgroundColor: farger.bakgrunn, color: farger.tekst, marginBottom: '14px', outline: 'none', fontFamily: 'sans-serif', boxSizing: 'border-box' }} />
          <div style={etikett()}>Passord</div>
          <input type="password" value={passord} onChange={(e) => setPassord(e.target.value)} placeholder="Minst 6 tegn" style={{ width: '100%', padding: '12px 14px', fontSize: '15px', border: `1px solid ${farger.kremMørk}`, borderRadius: '10px', backgroundColor: farger.bakgrunn, color: farger.tekst, marginBottom: '20px', outline: 'none', fontFamily: 'sans-serif', boxSizing: 'border-box' }} />
          {innloggingFeil && <p style={{ fontSize: '13px', color: '#C0392B', fontFamily: 'sans-serif', margin: '0 0 14px', textAlign: 'center' }}>{innloggingFeil}</p>}
          <button onClick={erNyBruker ? registrer : loggInn} style={{ width: '100%', padding: '14px', backgroundColor: farger.grønn, border: 'none', borderRadius: '10px', fontSize: '12px', fontWeight: '600', color: '#FDFAF6', cursor: 'pointer', letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: 'sans-serif', marginBottom: '12px' }}>
            {erNyBruker ? 'Opprett konto' : 'Logg inn'}
          </button>
          <button onClick={() => { setErNyBruker(!erNyBruker); setInnloggingFeil(''); }} style={{ width: '100%', padding: '12px', backgroundColor: 'transparent', border: `1px solid ${farger.kremMørk}`, borderRadius: '10px', fontSize: '12px', color: farger.tekstLys, cursor: 'pointer', fontFamily: 'sans-serif' }}>
            {erNyBruker ? 'Har allerede konto? Logg inn' : 'Ny bruker? Opprett konto'}
          </button>
        </div>
      </div>
    );
  }

  if (nattModus) {
    return (
      <>
        {visGlitter && <GlitterOvergang />}
        <div style={{ backgroundColor: farger.nattBakgrunn, minHeight: '100vh', maxWidth: '430px', margin: '0 auto', fontFamily: 'Georgia, serif', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 24px' }}>
          <div style={{ width: '100px', height: '100px', marginBottom: '36px', filter: 'drop-shadow(0 0 30px rgba(196,168,130,0.4))' }}>
            <svg width="100" height="100" viewBox="0 0 100 100">
              <defs><radialGradient id="moonGrad" cx="35%" cy="35%" r="65%"><stop offset="0%" stopColor="#F5E6C8" /><stop offset="60%" stopColor="#D4B483" /><stop offset="100%" stopColor="#B8955A" /></radialGradient></defs>
              <path d="M 60 15 C 42 15 28 29 28 50 C 28 71 42 85 60 85 C 48 78 40 65 40 50 C 40 35 48 22 60 15 Z" fill="url(#moonGrad)" />
            </svg>
          </div>
          <div style={{ fontSize: '11px', letterSpacing: '0.14em', textTransform: 'uppercase', fontFamily: 'sans-serif', color: farger.nattTekstLys, marginBottom: '16px' }}>Nattesøvn pågår</div>
          <div style={{ fontSize: '48px', fontStyle: 'italic', color: farger.nattAksent, marginBottom: '8px', letterSpacing: '-1px', lineHeight: 1 }}>{minutter} min</div>
          <div style={{ fontSize: '18px', fontStyle: 'italic', color: farger.nattTekst, marginBottom: '6px' }}>{babyNavn || 'Babyen'} sover</div>
          <div style={{ fontSize: '13px', fontFamily: 'sans-serif', color: farger.nattTekstLys, marginBottom: '70px' }}>Startet kl. {startTid?.toLocaleTimeString('no-NO', { hour: '2-digit', minute: '2-digit' })}</div>
          <div style={{ display: 'flex', gap: '20px', marginBottom: '60px' }}>
            {[3, 5, 2, 4, 3, 5, 2].map((s, i) => <div key={i} style={{ width: `${s}px`, height: `${s}px`, borderRadius: '50%', backgroundColor: farger.nattAksent, opacity: 0.3 + (i % 3) * 0.15 }} />)}
          </div>
          <button onClick={stoppLur} style={{ width: '100%', padding: '16px', backgroundColor: 'transparent', border: `1px solid ${farger.nattKortKant}`, borderRadius: '14px', fontSize: '12px', fontWeight: '600', letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: 'sans-serif', color: farger.nattTekstLys, cursor: 'pointer' }}>Avslutt nattesøvn</button>
          <div style={{ marginTop: '24px', fontSize: '14px', fontStyle: 'italic', color: farger.nattTekstLys, textAlign: 'center', lineHeight: 1.8, opacity: 0.7 }}>God natt — hvil deg du også.</div>
        </div>
      </>
    );
  }

  return (
    <>
      {visGlitter && <GlitterOvergang />}
      <div style={{ backgroundColor: farger.bakgrunn, minHeight: '100vh', maxWidth: '430px', margin: '0 auto', fontFamily: 'Georgia, serif', position: 'relative', paddingBottom: '90px' }}>

        <div style={{ backgroundColor: farger.hvit, padding: '20px 24px 16px', borderBottom: `1px solid ${farger.kremMørk}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <img src="/leep.png" alt="Lille" style={{ height: '60px', width: 'auto', mixBlendMode: 'multiply' }} />
            <div style={{ fontSize: '11px', color: farger.tekstLys, letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: 'sans-serif' }}>
              {timeGreeting()}{babyNavn ? ` — ${babyNavn}` : ''}{alder ? ` · ${alder}` : ''}
            </div>
          </div>
          <div onClick={() => setAktivSide('profil')} style={{ width: '38px', height: '38px', borderRadius: '50%', backgroundColor: babyBilde ? 'transparent' : farger.grønnLys, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: '600', color: farger.grønn, cursor: 'pointer', fontFamily: 'sans-serif', border: `1px solid ${farger.kremMørk}`, overflow: 'hidden' }}>
            {babyBilde ? <img src={babyBilde} alt="Baby" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : babyNavn ? babyNavn[0].toUpperCase() : 'Ny'}
          </div>
        </div>

        <div style={{ padding: '20px 24px' }}>

          {aktivSide === 'hjem' && (
            <div>
              {!babyNavn && (
                <div style={kort()}>
                  <p style={tittel()}>Velkommen til Lille</p>
                  <p style={{ fontSize: '13px', color: farger.tekstLys, fontFamily: 'sans-serif', margin: '0 0 14px', lineHeight: 1.6 }}>Start med å legge inn babyens navn og fødselsdato.</p>
                  <button onClick={() => setAktivSide('profil')} style={{ width: '100%', padding: '12px', backgroundColor: farger.grønn, border: 'none', borderRadius: '10px', fontSize: '12px', fontWeight: '600', color: '#FDFAF6', cursor: 'pointer', letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: 'sans-serif' }}>Sett opp profil</button>
                </div>
              )}

              {kolikkVarsel !== null && !sover && (
                <div style={{ backgroundColor: '#FDF3E7', border: '1.5px solid #E8A04A', borderRadius: '16px', padding: '18px 20px', marginBottom: '14px' }}>
                  <div style={etikett('#A0621A')}>Kolikk-varsel</div>
                  <p style={{ fontSize: '16px', fontStyle: 'italic', color: farger.tekst, margin: '0 0 6px', lineHeight: 1.5 }}>{babyNavn || 'Babyen'} pleier å bli urolig rundt kl. {kolikkMønster}:00</p>
                  <p style={{ fontSize: '13px', fontFamily: 'sans-serif', color: '#A0621A', margin: '0 0 12px' }}>Det er om ~{kolikkVarsel} minutter — kanskje et godt tidspunkt å starte mageroing nå?</p>
                  <div style={{ backgroundColor: '#FEE9C4', borderRadius: '10px', padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '11px', fontFamily: 'sans-serif', color: '#A0621A', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Tid igjen</span>
                    <span style={{ fontSize: '14px', fontStyle: 'italic', fontFamily: 'Georgia, serif', color: '#7A4A10' }}>{kolikkVarsel} min</span>
                  </div>
                </div>
              )}

              {visTypeValg && !sover && (
                <div style={kort()}>
                  <div style={etikett()}>Hva skal registreres?</div>
                  <p style={tittel()}>Velg type søvn</p>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button onClick={() => velgType('lur')} style={{ flex: 1, padding: '20px 16px', backgroundColor: farger.grønnLys, border: `1px solid ${farger.kremMørk}`, borderRadius: '14px', cursor: 'pointer', fontFamily: 'Georgia, serif', textAlign: 'center' }}>
                      <div style={{ fontSize: '16px', fontStyle: 'italic', color: farger.grønn, marginBottom: '6px' }}>Lur</div>
                      <div style={{ fontSize: '11px', color: farger.tekstLys, fontFamily: 'sans-serif' }}>Dagtid</div>
                    </button>
                    <button onClick={() => velgType('natt')} style={{ flex: 1, padding: '20px 16px', background: 'linear-gradient(145deg, #4A2535 0%, #2E1520 100%)', border: '1px solid #6B3545', borderRadius: '14px', cursor: 'pointer', fontFamily: 'Georgia, serif', textAlign: 'center', boxShadow: '0 4px 20px rgba(74,37,53,0.25)' }}>
                      <div style={{ fontSize: '16px', fontStyle: 'italic', color: '#E8C4A0', marginBottom: '6px' }}>Nattesøvn</div>
                      <div style={{ fontSize: '11px', color: '#C4957A', fontFamily: 'sans-serif' }}>Kveld til morgen</div>
                    </button>
                  </div>
                </div>
              )}

              {(!sover || søvnType === 'lur') && (
                <div style={{ backgroundColor: sover && søvnType === 'lur' ? farger.grønn : farger.hvit, borderRadius: '16px', padding: '22px', marginBottom: '14px', border: `1px solid ${sover && søvnType === 'lur' ? 'transparent' : farger.kremMørk}`, transition: 'all 0.4s ease' }}>
                  <div style={{ fontSize: '10px', letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: 'sans-serif', color: sover && søvnType === 'lur' ? '#9FD4B8' : farger.tekstLys, marginBottom: '8px' }}>
                    {sover && søvnType === 'lur' ? 'Lur pågår' : 'Søvnregistrering'}
                  </div>
                  <div style={{ fontSize: '26px', fontStyle: 'italic', color: sover && søvnType === 'lur' ? '#FDFAF6' : farger.terrakotta, marginBottom: '6px', lineHeight: 1.2 }}>
                    {sover && søvnType === 'lur' ? `${minutter} min ${sekunder < 10 ? '0' : ''}${sekunder} sek` : `Sover ${babyNavn || 'babyen'} nå?`}
                  </div>
                  <div style={{ fontSize: '13px', fontFamily: 'sans-serif', color: sover && søvnType === 'lur' ? '#9FD4B8' : farger.tekstLys, marginBottom: '18px' }}>
                    {sover && søvnType === 'lur' ? `Startet kl. ${startTid?.toLocaleTimeString('no-NO', { hour: '2-digit', minute: '2-digit' })}` : 'Trykk for å registrere søvn'}
                  </div>
                  <button onClick={sover && søvnType === 'lur' ? stoppLur : () => setVisTypeValg(!visTypeValg)} style={{ width: '100%', padding: '13px', backgroundColor: sover && søvnType === 'lur' ? 'rgba(255,255,255,0.15)' : farger.grønn, border: sover && søvnType === 'lur' ? '1px solid rgba(255,255,255,0.3)' : 'none', borderRadius: '10px', fontSize: '12px', fontWeight: '600', letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: 'sans-serif', color: '#FDFAF6', cursor: 'pointer' }}>
                    {sover && søvnType === 'lur' ? 'Avslutt lur' : 'Registrer søvn'}
                  </button>
                </div>
              )}

              {visSignaler && (
                <div style={kort()}>
                  <div style={etikett(farger.grønn)}>Signallogger</div>
                  <p style={tittel()}>Hva så du før {babyNavn || 'babyen'} sovnet?</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
                    {SIGNALER.map(signal => (
                      <button key={signal} onClick={() => toggleSignal(signal)} style={{ padding: '7px 14px', borderRadius: '20px', border: valgteSignaler.includes(signal) ? `1.5px solid ${farger.grønn}` : `1px solid ${farger.kremMørk}`, backgroundColor: valgteSignaler.includes(signal) ? farger.grønnLys : farger.bakgrunn, color: valgteSignaler.includes(signal) ? farger.grønn : farger.tekstLys, fontSize: '12px', fontFamily: 'sans-serif', fontWeight: valgteSignaler.includes(signal) ? '600' : '400', cursor: 'pointer' }}>
                        {signal}
                      </button>
                    ))}
                  </div>
                  <button onClick={lagreSignaler} style={{ width: '100%', padding: '12px', backgroundColor: farger.grønn, border: 'none', borderRadius: '10px', fontSize: '12px', fontWeight: '600', color: '#FDFAF6', cursor: 'pointer', letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: 'sans-serif' }}>Lagre signaler</button>
                </div>
              )}

              {nesteLur && !sover && (
                <div style={kort({ padding: '16px 20px' })}>
                  <div style={etikett()}>Neste lur</div>
                  <div style={{ fontSize: '15px', fontStyle: 'italic', color: farger.tekst }}>{babyNavn || 'Babyen'} er klar rundt kl. {nesteLur}</div>
                  <div style={{ fontSize: '12px', color: farger.tekstLys, fontFamily: 'sans-serif', marginTop: '2px' }}>Basert på {babyNavn || 'babyens'} mønster</div>
                </div>
              )}

              {!sover && (
                <div style={kort()}>
                  <div style={etikett()}>Mage og kolikk</div>
                  <p style={tittel()}>Hvordan er magen i dag?</p>
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                    {[1, 2, 3, 4, 5].map(tall => (
                      <button key={tall} onClick={() => velgKolikk(tall)} style={{ flex: 1, padding: '12px 0', borderRadius: '10px', border: 'none', cursor: 'pointer', fontFamily: 'sans-serif', fontSize: '13px', fontWeight: '600', backgroundColor: kolikkNivå === tall ? tall <= 2 ? farger.grønn : tall === 3 ? farger.terrakotta : '#C0392B' : farger.krem, color: kolikkNivå === tall ? '#FDFAF6' : farger.tekstLys, transition: 'all 0.2s ease' }}>
                        {tall}
                      </button>
                    ))}
                  </div>
                  <p style={{ fontSize: '13px', fontFamily: 'sans-serif', color: farger.tekstLys, margin: 0, textAlign: 'center', fontStyle: 'italic' }}>
                    {kolikkNivå === null ? 'Trykk for å registrere' : kolikkNivå <= 2 ? 'Rolig mage — bra!' : kolikkNivå === 3 ? 'Litt urolig mage' : 'Mye uro — registrert'}
                  </p>
                  {kolikkLogger.filter(l => l.nivå >= 4).length > 0 && kolikkLogger.filter(l => l.nivå >= 4).length < 3 && (
                    <p style={{ fontSize: '11px', fontFamily: 'sans-serif', color: farger.tekstLys, margin: '10px 0 0', textAlign: 'center', fontStyle: 'italic' }}>
                      Logger {3 - kolikkLogger.filter(l => l.nivå >= 4).length} urolige dager til så lærer Lille når kolikken pleier å komme
                    </p>
                  )}
                  {kolikkMønster !== null && (
                    <p style={{ fontSize: '11px', fontFamily: 'sans-serif', color: farger.grønn, margin: '10px 0 0', textAlign: 'center', fontStyle: 'italic' }}>
                      Lille har lært at {babyNavn || 'babyen'} pleier å bli urolig rundt kl. {kolikkMønster}:00
                    </p>
                  )}
                </div>
              )}

              {visKolikkPopup && kolikkInfo && !sover && (
                <div style={{ backgroundColor: farger.terrakottaLys, border: `1.5px solid ${farger.terrakotta}`, borderRadius: '16px', padding: '22px', marginBottom: '14px', position: 'relative' }}>
                  <button onClick={() => setVisKolikkPopup(false)} style={{ position: 'absolute', top: '14px', right: '16px', background: 'none', border: 'none', fontSize: '16px', color: farger.tekstLys, cursor: 'pointer' }}>✕</button>
                  <div style={etikett(farger.terrakotta)}>En liten stund til</div>
                  {kolikkInfo.ferdig ? (
                    <>
                      <p style={{ fontSize: '18px', fontStyle: 'italic', color: farger.tekst, margin: '0 0 10px', lineHeight: 1.5 }}>Den verste perioden er trolig bak dere.</p>
                      <p style={{ fontSize: '13px', color: farger.tekstLys, fontFamily: 'sans-serif', lineHeight: 1.7, margin: 0 }}>{babyNavn || 'Babyen'} er {alder} gammel — de fleste babyer er ferdig med den verste kolikkperioden nå. Du har gjort det utrolig bra.</p>
                    </>
                  ) : (
                    <>
                      <p style={{ fontSize: '18px', fontStyle: 'italic', color: farger.tekst, margin: '0 0 10px', lineHeight: 1.5 }}>Dette er tungt — og du gjør det bra.</p>
                      <p style={{ fontSize: '13px', color: farger.tekstLys, fontFamily: 'sans-serif', lineHeight: 1.7, margin: '0 0 16px' }}>Kolikk er vanlig og går over. De fleste babyer er ferdig med den verste perioden innen 3–4 måneder.</p>
                      <div style={{ backgroundColor: farger.hvit, borderRadius: '12px', padding: '14px 16px' }}>
                        <div style={etikett(farger.terrakotta)}>Nedtelling for {babyNavn || 'babyen'}</div>
                        <div style={{ fontSize: '22px', fontStyle: 'italic', color: farger.tekst, marginBottom: '4px' }}>~{kolikkInfo.ukerIgjen} uker igjen</div>
                        <div style={{ fontSize: '12px', color: farger.tekstLys, fontFamily: 'sans-serif', marginBottom: '10px' }}>Basert på {babyNavn || 'babyens'} alder — {alder} gammel</div>
                        <div style={{ backgroundColor: farger.kremMørk, borderRadius: '10px', height: '5px', marginBottom: '4px' }}>
                          <div style={{ backgroundColor: farger.terrakotta, borderRadius: '10px', height: '5px', width: `${Math.min((kolikkInfo.ukerGammel / 16) * 100, 100)}%`, transition: 'width 0.5s ease' }} />
                        </div>
                        <div style={{ fontSize: '11px', color: farger.tekstLys, fontFamily: 'sans-serif' }}>Uke {kolikkInfo.ukerGammel} av ~16</div>
                      </div>
                    </>
                  )}
                </div>
              )}

              {!sover && (
                <div style={{ backgroundColor: farger.terrakottaLys, borderRadius: '16px', padding: '20px', border: `1px solid ${farger.kremMørk}` }}>
                  <div style={etikett(farger.terrakotta)}>Tips fra Lille</div>
                  <p style={{ fontSize: '15px', fontStyle: 'italic', color: farger.tekst, margin: 0, lineHeight: 1.6 }}>
                    {dagensLurer.length > 0 ? `${dagensLurer.length} registrering${dagensLurer.length > 1 ? 'er' : ''} i dag. Godt jobbet.` : 'Begynn å logge søvn. Etter noen dager ser du mønstre du ikke visste om.'}
                  </p>
                </div>
              )}
            </div>
          )}

          {aktivSide === 'logg' && (
            <div>
              <div style={etikett()}>Søvnlogg</div>
              {lurer.length === 0 ? (
                <div style={{ ...kort(), textAlign: 'center', padding: '40px 20px' }}>
                  <p style={tittel()}>Ingen registreringer ennå</p>
                  <p style={{ fontSize: '13px', color: farger.tekstLys, margin: 0, fontFamily: 'sans-serif' }}>Gå til hjem og registrer første søvn</p>
                </div>
              ) : (
                sorterteDatoer.map(dato => (
                  <div key={dato} style={{ marginBottom: '20px' }}>
                    <div style={{ fontSize: '12px', fontFamily: 'sans-serif', color: farger.tekstLys, fontWeight: '600', marginBottom: '8px' }}>{formatertDato(dato)}</div>
                    <div style={{ backgroundColor: farger.hvit, border: `1px solid ${farger.kremMørk}`, borderRadius: '16px', overflow: 'hidden' }}>
                      {grupperteLurer[dato].map((lur, index) => (
                        <div key={lur.id} style={{ padding: '14px 20px', borderBottom: index < grupperteLurer[dato].length - 1 ? `1px solid ${farger.kremMørk}` : 'none', backgroundColor: lur.type === 'natt' ? '#F9F5F0' : farger.hvit }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: lur.type === 'natt' ? '#4A2535' : farger.grønn, flexShrink: 0 }} />
                            <div style={{ flex: 1 }}>
                              <p style={{ fontSize: '14px', color: farger.tekst, margin: '0 0 2px', fontFamily: 'sans-serif' }}>{lur.start} — {lur.slutt}</p>
                              <p style={{ fontSize: '12px', color: farger.tekstLys, margin: 0, fontFamily: 'sans-serif' }}>{lur.varighet} minutter</p>
                            </div>
                            <span style={{ fontSize: '11px', fontFamily: 'sans-serif', padding: '4px 10px', borderRadius: '20px', backgroundColor: lur.type === 'natt' ? '#4A2535' : farger.grønnLys, color: lur.type === 'natt' ? '#E8C4A0' : farger.grønn, fontWeight: '500' }}>
                              {lur.type === 'natt' ? 'Natt' : lur.varighet >= 60 ? 'Lang lur' : lur.varighet >= 30 ? 'God lur' : 'Kort lur'}
                            </span>
                          </div>
                          {lur.signaler && lur.signaler.length > 0 && (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '8px', paddingLeft: '20px' }}>
                              {lur.signaler.map(signal => <span key={signal} style={{ fontSize: '11px', padding: '3px 10px', borderRadius: '20px', backgroundColor: farger.grønnLys, color: farger.grønn, fontFamily: 'sans-serif' }}>{signal}</span>)}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {aktivSide === 'innsikt' && (
            <div>
              <div style={etikett()}>Innsikt</div>
              <div style={kort()}>
                <p style={tittel()}>{babyNavn ? `${babyNavn}s mønster` : 'Babyens mønster'}</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  {[
                    { label: 'Lurer i dag', val: dagensLurer.filter(l => l.type === 'lur').length },
                    { label: 'Netter logget', val: lurer.filter(l => l.type === 'natt').length },
                    { label: 'Snitt lur', val: lurer.filter(l => l.type === 'lur').length > 0 ? Math.round(lurer.filter(l => l.type === 'lur').reduce((s, l) => s + l.varighet, 0) / lurer.filter(l => l.type === 'lur').length) + ' min' : '–' },
                    { label: 'Signaler logget', val: lurer.reduce((s, l) => s + (l.signaler ? l.signaler.length : 0), 0) },
                  ].map(item => (
                    <div key={item.label} style={{ backgroundColor: farger.bakgrunn, borderRadius: '12px', padding: '14px', border: `1px solid ${farger.kremMørk}` }}>
                      <p style={{ fontSize: '10px', color: farger.tekstLys, margin: '0 0 6px', fontFamily: 'sans-serif', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{item.label}</p>
                      <p style={{ fontSize: '24px', color: farger.terrakotta, margin: 0, fontStyle: 'italic' }}>{item.val}</p>
                    </div>
                  ))}
                </div>
              </div>

              {søvnAnbefaling && alder && (
                <div style={kort({ padding: '16px 20px' })}>
                  <div style={etikett(farger.grønn)}>Anbefalt for {alder}</div>
                  <div style={{ fontSize: '15px', fontStyle: 'italic', color: farger.tekst, marginBottom: '2px' }}>{søvnAnbefaling.min}–{søvnAnbefaling.max} timer søvn per døgn</div>
                  <div style={{ fontSize: '12px', color: farger.tekstLys, fontFamily: 'sans-serif' }}>{søvnAnbefaling.lurer}</div>
                </div>
              )}

              {kolikkLogger.length > 0 && (
                <div style={kort()}>
                  <div style={etikett()}>Kolikk-mønster</div>
                  <p style={{ fontSize: '15px', fontStyle: 'italic', color: farger.tekst, margin: '0 0 6px' }}>
                    {kolikkMønster !== null ? `Urolig mage oftest rundt kl. ${kolikkMønster}:00` : 'Logger flere dager for å se mønster'}
                  </p>
                  <p style={{ fontSize: '12px', color: farger.tekstLys, fontFamily: 'sans-serif', margin: 0 }}>
                    {kolikkLogger.filter(l => l.nivå >= 4).length} urolige registreringer totalt
                  </p>
                </div>
              )}

              {lurer.length >= 3 && (
                <div style={kort()}>
                  <div style={etikett(farger.terrakotta)}>Fra Lille Babylykke</div>
                  <p style={{ fontSize: '18px', fontStyle: 'italic', color: farger.tekst, margin: '0 0 8px', lineHeight: 1.5 }}>Vil du lære enda mer om {babyNavn || 'babyen'}?</p>
                  <p style={{ fontSize: '13px', color: farger.tekstLys, fontFamily: 'sans-serif', lineHeight: 1.7, margin: '0 0 16px' }}>Lær å lese signalene, roe magen og skape mer ro i babytiden — med babymassasjekurset fra Lille Babylykke.</p>
                  <a href="https://lillebabylykke.no" target="_blank" rel="noopener noreferrer" style={{ display: 'block', width: '100%', padding: '12px', backgroundColor: farger.terrakotta, borderRadius: '10px', fontSize: '12px', fontWeight: '600', color: '#FDFAF6', cursor: 'pointer', letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: 'sans-serif', textAlign: 'center', textDecoration: 'none', boxSizing: 'border-box' }}>Se kurset</a>
                </div>
              )}

              <div style={{ backgroundColor: farger.terrakottaLys, borderRadius: '16px', padding: '20px', border: `1px solid ${farger.kremMørk}` }}>
                <div style={etikett(farger.terrakotta)}>Lille lærer</div>
                <p style={{ fontSize: '15px', fontStyle: 'italic', color: farger.tekst, margin: '0 0 14px', lineHeight: 1.6 }}>
                  {lurer.length < 10 ? `Logger du ${10 - lurer.length} registreringer til begynner Lille å se mønstre.` : `Lille har lært av ${lurer.length} registreringer og begynner å forstå rytmen.`}
                </p>
                <div style={{ backgroundColor: farger.kremMørk, borderRadius: '10px', height: '6px', marginBottom: '6px' }}>
                  <div style={{ backgroundColor: farger.grønn, borderRadius: '10px', height: '6px', width: `${Math.min(lurer.length / 10 * 100, 100)}%`, transition: 'width 0.5s ease' }} />
                </div>
                <p style={{ fontSize: '11px', color: farger.tekstLys, margin: 0, fontFamily: 'sans-serif' }}>{Math.min(lurer.length, 10)} av 10 registreringer</p>
              </div>
            </div>
          )}

          {aktivSide === 'profil' && (
            <div>
              <div style={etikett()}>Profil</div>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
                <label style={{ cursor: 'pointer' }}>
                  <div style={{ width: '90px', height: '90px', borderRadius: '50%', backgroundColor: farger.krem, border: `2px solid ${farger.kremMørk}`, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                    {babyBilde ? <img src={babyBilde} alt="Baby" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ textAlign: 'center' }}><div style={{ fontSize: '24px', marginBottom: '4px' }}>👶</div><div style={{ fontSize: '10px', color: farger.tekstLys, fontFamily: 'sans-serif' }}>Legg til bilde</div></div>}
                  </div>
                  <input type="file" accept="image/*" onChange={håndterBilde} style={{ display: 'none' }} />
                </label>
              </div>
              <div style={kort()}>
                <div style={etikett()}>Babyens navn</div>
                <input type="text" value={tempNavn || babyNavn} onChange={(e) => setTempNavn(e.target.value)} placeholder="Skriv navn her..." style={{ width: '100%', padding: '12px 14px', fontSize: '15px', border: `1px solid ${farger.kremMørk}`, borderRadius: '10px', backgroundColor: farger.bakgrunn, color: farger.tekst, marginBottom: '16px', outline: 'none', fontFamily: 'Georgia, serif', boxSizing: 'border-box' }} />
                <div style={etikett()}>Fødselsdato</div>
                <input type="date" value={tempFødselsdato || babyFødselsdato} onChange={(e) => setTempFødselsdato(e.target.value)} style={{ width: '100%', padding: '12px 14px', fontSize: '15px', border: `1px solid ${farger.kremMørk}`, borderRadius: '10px', backgroundColor: farger.bakgrunn, color: farger.tekst, marginBottom: '16px', outline: 'none', fontFamily: 'sans-serif', boxSizing: 'border-box' }} />
                <button onClick={lagreProfil} style={{ width: '100%', padding: '12px', backgroundColor: farger.grønn, border: 'none', borderRadius: '10px', fontSize: '12px', fontWeight: '600', color: '#FDFAF6', cursor: 'pointer', letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: 'sans-serif', marginBottom: '12px' }}>Lagre profil</button>
                <button onClick={loggUt} style={{ width: '100%', padding: '12px', backgroundColor: 'transparent', border: `1px solid ${farger.kremMørk}`, borderRadius: '10px', fontSize: '12px', color: farger.tekstLys, cursor: 'pointer', fontFamily: 'sans-serif' }}>Logg ut</button>
              </div>
              {alder && søvnAnbefaling && (
                <div style={{ backgroundColor: farger.terrakottaLys, border: `1px solid ${farger.kremMørk}`, borderRadius: '16px', padding: '20px' }}>
                  <div style={etikett(farger.terrakotta)}>Basert på alder</div>
                  <p style={{ fontSize: '18px', fontStyle: 'italic', color: farger.tekst, margin: '0 0 8px' }}>{babyNavn || 'Babyen'} er {alder} gammel</p>
                  <p style={{ fontSize: '13px', color: farger.tekstLys, fontFamily: 'sans-serif', margin: 0, lineHeight: 1.6 }}>
                    Anbefalt søvn: {søvnAnbefaling.min}–{søvnAnbefaling.max} timer per døgn<br />{søvnAnbefaling.lurer}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        <div style={{ position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: '430px', backgroundColor: farger.hvit, borderTop: `1px solid ${farger.kremMørk}`, display: 'flex', padding: '12px 0 24px' }}>
          {[
            { id: 'hjem', label: 'Hjem' },
            { id: 'logg', label: 'Logg' },
            { id: 'innsikt', label: 'Innsikt' },
            { id: 'profil', label: 'Profil' },
          ].map(side => (
            <button key={side.id} onClick={() => setAktivSide(side.id)} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', border: 'none', background: 'transparent', cursor: 'pointer' }}>
              <div style={{ width: '4px', height: '4px', borderRadius: '50%', backgroundColor: aktivSide === side.id ? farger.terrakotta : 'transparent', marginBottom: '2px' }} />
              <span style={{ fontSize: '11px', fontFamily: 'sans-serif', letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: aktivSide === side.id ? '600' : '400', color: aktivSide === side.id ? farger.terrakotta : farger.tekstLys }}>
                {side.label}
              </span>
            </button>
          ))}
        </div>
      </div>
    </>
  );
}