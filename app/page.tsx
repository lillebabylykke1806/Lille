'use client';
import { supabase } from './lib/supabase';
import { farger } from './lib/farger';
import { useState, useEffect } from 'react';
import Hjemskjerm from './components/hjem/Hjemskjerm';
import Profil from './components/hjem/profil';
import Sovn from './components/sovn/sovn';
import Onboarding from './components/onboarding/Onboarding';
import Viftemeny from './components/viftemeny/Viftemeny';
import Amming from './components/amming/Amming';
import Bleie from './components/bleie/Bleie';
import Innsikt from './components/innsikt/Innsikt';
import Medisin from './components/medisin/Medisin';
import Notat from './components/notat/Notat';
import Aktivitet from './components/aktivitet/Aktivitet';
import Vekt from './components/vekt/Vekt';
import Signaler from './components/signaler/Signaler';
import Kolikk from './components/kolikk/Kolikk';

export default function Home() {
  const [aktivSide, setAktivSide] = useState('hjem');
  const [bruker, setBruker] = useState<any>(null);
  const [laster, setLaster] = useState(true);
  const [epost, setEpost] = useState('');
  const [passord, setPassord] = useState('');
  const [erNyBruker, setErNyBruker] = useState(false);
  const [innloggingFeil, setInnloggingFeil] = useState('');
  const [visRegistrer, setVisRegistrer] = useState(false);
  const [visOnboarding, setVisOnboarding] = useState(false);
  const [aktivtBarn, setAktivtBarn] = useState<any>(null);

  useEffect(() => {
    const lastData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setBruker(session.user);

        const { data: barn } = await supabase
          .from('barn')
          .select('*')
          .eq('bruker_id', session.user.id)
          .order('opprettet', { ascending: true })
          .limit(1)
          .single();

        if (barn) {
          setAktivtBarn(barn);
        } else {
          setVisOnboarding(true);
        }

        const lagretType = localStorage.getItem('lille_sovtype');
        if (lagretType === 'natt') setAktivSide('sovn');
      }
      setLaster(false);
    };
    setTimeout(() => setLaster(false), 5000);
    lastData();
  }, []);

  const loggInn = async () => {
    setInnloggingFeil('');
    const { data, error } = await supabase.auth.signInWithPassword({ email: epost, password: passord });
    if (error) {
      setInnloggingFeil('Feil e-post eller passord. Prøv igjen.');
    } else {
      localStorage.removeItem('lille_babybilde');
      setBruker(data.user);
    }
  };

  const registrer = async () => {
    setInnloggingFeil('');
    const { data, error } = await supabase.auth.signUp({ email: epost, password: passord });
    if (error) {
      setInnloggingFeil('Noe gikk galt. Prøv igjen.');
    } else {
      const res = await fetch('/api/create-checkout-session', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: epost }) });
      const { url } = await res.json();
      if (url) window.location.href = url;
      else setBruker(data.user);
    }
  };

  const loggUt = async () => {
    await supabase.auth.signOut();
    setBruker(null);
    setAktivtBarn(null);
  };

  if (laster) {
    return (
      <div style={{ backgroundColor: farger.bakgrunn, minHeight: '100vh', maxWidth: '430px', margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '24px' }}>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <img src="/leep.png" alt="Lille" style={{ width: '180px', height: 'auto', mixBlendMode: 'multiply' }} />
        <div style={{ width: '28px', height: '28px', border: `2px solid ${farger.grønn}`, borderTop: '2px solid transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
      </div>
    );
  }

  if (visOnboarding) return <Onboarding bruker={bruker} onFerdig={async () => {
    const { data: barn } = await supabase.from('barn').select('*').eq('bruker_id', bruker.id).order('opprettet', { ascending: true }).limit(1).single();
    if (barn) setAktivtBarn(barn);
    setVisOnboarding(false);
  }} />;

  if (!bruker) {
    return (
      <div style={{ backgroundColor: farger.bakgrunn, minHeight: '100vh', maxWidth: '430px', margin: '0 auto', fontFamily: 'var(--font-plus-jakarta), sans-serif', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 24px' }}>
        <div style={{ marginBottom: '32px', textAlign: 'center' }}>
          <img src="/leep.png" alt="Lille" style={{ width: '140px', height: 'auto', marginBottom: '16px', mixBlendMode: 'multiply' }} />
          <div style={{ fontSize: '13px', color: farger.tekstLys, fontFamily: 'var(--font-inter), sans-serif' }}>Din babys språk, i dine hender</div>
        </div>
        <div style={{ backgroundColor: farger.hvit, border: `1px solid ${farger.kremMørk}`, borderRadius: '16px', padding: '24px', width: '100%' }}>
          <p style={{ fontSize: '18px', fontStyle: 'italic', color: farger.terrakotta, margin: '0 0 20px' }}>{erNyBruker ? 'Velkommen til Lille' : 'Hei igjen!'}</p>
          <input type="email" value={epost} onChange={(e) => setEpost(e.target.value)} placeholder="din@epost.no" style={{ width: '100%', padding: '12px 14px', fontSize: '15px', border: `1px solid ${farger.kremMørk}`, borderRadius: '10px', backgroundColor: farger.bakgrunn, color: farger.tekst, marginBottom: '12px', outline: 'none', fontFamily: 'var(--font-inter), sans-serif', boxSizing: 'border-box' }} />
          <input type="password" value={passord} onChange={(e) => setPassord(e.target.value)} placeholder="Minst 6 tegn" style={{ width: '100%', padding: '12px 14px', fontSize: '15px', border: `1px solid ${farger.kremMørk}`, borderRadius: '10px', backgroundColor: farger.bakgrunn, color: farger.tekst, marginBottom: '20px', outline: 'none', fontFamily: 'var(--font-inter), sans-serif', boxSizing: 'border-box' }} />
          {innloggingFeil && <p style={{ fontSize: '13px', color: '#C0392B', fontFamily: 'var(--font-inter), sans-serif', margin: '0 0 14px', textAlign: 'center' }}>{innloggingFeil}</p>}
          <button onClick={erNyBruker ? registrer : loggInn} style={{ width: '100%', padding: '14px', backgroundColor: farger.grønn, border: 'none', borderRadius: '10px', fontSize: '12px', fontWeight: '600', color: '#FDFAF6', cursor: 'pointer', letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: 'var(--font-inter), sans-serif', marginBottom: '12px' }}>
            {erNyBruker ? 'Opprett konto' : 'Logg inn'}
          </button>
          <button onClick={() => { setErNyBruker(!erNyBruker); setInnloggingFeil(''); }} style={{ width: '100%', padding: '12px', backgroundColor: 'transparent', border: `1px solid ${farger.kremMørk}`, borderRadius: '10px', fontSize: '12px', color: farger.tekstLys, cursor: 'pointer', fontFamily: 'var(--font-inter), sans-serif' }}>
            {erNyBruker ? 'Har allerede konto? Logg inn' : 'Ny bruker? Opprett konto'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: farger.bakgrunn, minHeight: '100vh', maxWidth: '430px', margin: '0 auto', fontFamily: 'var(--font-plus-jakarta), sans-serif', position: 'relative', paddingBottom: '90px' }}>
      <div style={{ overflowY: 'auto' }}>
        {aktivSide === 'hjem' && <Hjemskjerm bruker={bruker} aktivtBarn={aktivtBarn} onNavigate={setAktivSide} onByttBarn={setAktivtBarn} />}
        {aktivSide === 'sovn' && <Sovn bruker={aktivtBarn || bruker} />}
        {aktivSide === 'bleie' && <Bleie bruker={aktivtBarn || bruker} />}
        {aktivSide === 'kolikk' && <div style={{ padding: '20px 24px' }}><p style={{ color: farger.tekst }}>Uro/kolikk kommer her</p></div>}
        {aktivSide === 'amming' && <Amming bruker={aktivtBarn || bruker} />}
        {aktivSide === 'innsikt' && <Innsikt bruker={bruker} aktivtBarn={aktivtBarn} onNavigate={setAktivSide} />}
        {aktivSide === 'medisin' && <Medisin bruker={aktivtBarn || bruker} />}
        {aktivSide === 'notat' && <Notat bruker={aktivtBarn || bruker} />}
        {aktivSide === 'vekt' && <Vekt bruker={aktivtBarn || bruker} />}
        {aktivSide === 'aktivitet' && <Aktivitet bruker={aktivtBarn || bruker} />}
        {aktivSide === 'signaler' && <Signaler bruker={aktivtBarn || bruker} />}
        {aktivSide === 'kolikk' && <Kolikk bruker={aktivtBarn || bruker} />}
        {aktivSide === 'profil' && <Profil bruker={bruker} onLoggUt={loggUt} />}
      </div>

      {/* Navigasjon */}
      <div style={{ position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: '430px', backgroundColor: farger.hvit, borderTop: `1px solid ${farger.kremMørk}`, display: 'flex', alignItems: 'center', padding: '8px 0 24px' }}>
        <button onClick={() => setAktivSide('hjem')} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', border: 'none', background: 'transparent', cursor: 'pointer', padding: '6px 0' }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path d="M3 9.5L12 3L21 9.5V20C21 20.55 20.55 21 20 21H15V15H9V21H4C3.45 21 3 20.55 3 20V9.5Z" fill={aktivSide === 'hjem' ? farger.grønn : farger.kremMørk}/>
          </svg>
          <span style={{ fontSize: '10px', fontFamily: 'var(--font-inter), sans-serif', color: aktivSide === 'hjem' ? farger.grønn : farger.tekstLys, fontWeight: aktivSide === 'hjem' ? '600' : '400' }}>Hjem</span>
        </button>

        <button onClick={() => setAktivSide('sovn')} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', border: 'none', background: 'transparent', cursor: 'pointer', padding: '6px 0' }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path d="M12 3C7.03 3 3 7.03 3 12C3 16.97 7.03 21 12 21C14.5 21 16.76 20.01 18.43 18.4C14.1 18.17 10.5 14.43 10.5 9.9C10.5 7.3 11.72 4.98 13.62 3.45C13.09 3.16 12.56 3 12 3Z" fill={aktivSide === 'sovn' ? farger.grønn : farger.kremMørk}/>
          </svg>
          <span style={{ fontSize: '10px', fontFamily: 'var(--font-inter), sans-serif', color: aktivSide === 'sovn' ? farger.grønn : farger.tekstLys, fontWeight: aktivSide === 'sovn' ? '600' : '400' }}>Søvn</span>
        </button>

        <button onClick={() => setVisRegistrer(!visRegistrer)} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', border: 'none', background: 'transparent', cursor: 'pointer', padding: '0' }}>
          <div style={{ width: '52px', height: '52px', borderRadius: '50%', backgroundColor: farger.grønn, display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: '-20px', boxShadow: '0 4px 12px rgba(45,92,69,0.35)' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d={visRegistrer ? "M18 6L6 18M6 6L18 18" : "M12 5V19M5 12H19"} stroke="#FDFAF6" strokeWidth="2.5" strokeLinecap="round"/>
            </svg>
          </div>
        </button>

        <button onClick={() => setAktivSide('innsikt')} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', border: 'none', background: 'transparent', cursor: 'pointer', padding: '6px 0' }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <rect x="3" y="12" width="4" height="9" rx="1" fill={aktivSide === 'innsikt' ? farger.grønn : farger.kremMørk}/>
            <rect x="10" y="7" width="4" height="14" rx="1" fill={aktivSide === 'innsikt' ? farger.grønn : farger.kremMørk}/>
            <rect x="17" y="3" width="4" height="18" rx="1" fill={aktivSide === 'innsikt' ? farger.grønn : farger.kremMørk}/>
          </svg>
          <span style={{ fontSize: '10px', fontFamily: 'var(--font-inter), sans-serif', color: aktivSide === 'innsikt' ? farger.grønn : farger.tekstLys, fontWeight: aktivSide === 'innsikt' ? '600' : '400' }}>Innsikt</span>
        </button>

        <button onClick={() => setAktivSide('profil')} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', border: 'none', background: 'transparent', cursor: 'pointer', padding: '6px 0' }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="8" r="4" fill={aktivSide === 'profil' ? farger.grønn : farger.kremMørk}/>
            <path d="M4 20C4 16.69 7.58 14 12 14C16.42 14 20 16.69 20 20" stroke={aktivSide === 'profil' ? farger.grønn : farger.kremMørk} strokeWidth="2" strokeLinecap="round"/>
          </svg>
          <span style={{ fontSize: '10px', fontFamily: 'var(--font-inter), sans-serif', color: aktivSide === 'profil' ? farger.grønn : farger.tekstLys, fontWeight: aktivSide === 'profil' ? '600' : '400' }}>Profil</span>
        </button>
      </div>

      {visRegistrer && (
  <Viftemeny
    bruker={bruker}
    aktivtBarn={aktivtBarn}
    onNavigate={setAktivSide}
    onLukk={() => setVisRegistrer(false)}
  />
)}
    </div>
  );
}