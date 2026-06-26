'use client';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabase } from '../lib/supabase';
import { farger } from '../lib/farger';

export default function PartnerPage() {
  const searchParams = useSearchParams();
  const kode = searchParams.get('kode');
  const [status, setStatus] = useState<'laster' | 'loggInn' | 'ferdig' | 'feil'>('laster');
  const [epost, setEpost] = useState('');
  const [passord, setPassord] = useState('');
  const [erNy, setErNy] = useState(false);
  const [barnNavn, setBarnNavn] = useState('');

  useEffect(() => {
    const sjekkKode = async () => {
      if (!kode) { setStatus('feil'); return; }
      const { data } = await supabase.from('partner_invitasjoner').select('*, barn(navn)').eq('kode', kode).eq('akseptert', false).single();
      if (!data) { setStatus('feil'); return; }
      setBarnNavn(data.barn?.navn || 'babyen');
      setStatus('loggInn');
    };
    sjekkKode();
  }, [kode]);

  const aksepter = async () => {
    // Logg inn eller registrer
    let bruker_id = '';
    if (erNy) {
      const { data, error } = await supabase.auth.signUp({ email: epost, password: passord });
      if (error) return;
      bruker_id = data.user?.id || '';
    } else {
      const { data, error } = await supabase.auth.signInWithPassword({ email: epost, password: passord });
      if (error) return;
      bruker_id = data.user?.id || '';
    }

    // Hent invitasjon
    const { data: inv } = await supabase.from('partner_invitasjoner').select('*').eq('kode', kode).single();
    if (!inv) return;

    // Gi tilgang
    await supabase.from('barn_tilgang').insert({ barn_id: inv.barn_id, bruker_id, rolle: 'partner' });
    await supabase.from('partner_invitasjoner').update({ akseptert: true }).eq('kode', kode);

    setStatus('ferdig');
  };

  if (status === 'laster') return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', backgroundColor: farger.bakgrunn }}>
      <div style={{ width: '28px', height: '28px', border: `2px solid ${farger.grønn}`, borderTop: '2px solid transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  if (status === 'feil') return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', backgroundColor: farger.bakgrunn, padding: '24px', textAlign: 'center' }}>
      <div style={{ fontSize: '48px', marginBottom: '16px' }}>😕</div>
      <div style={{ fontSize: '20px', fontFamily: 'var(--font-plus-jakarta)', color: farger.tekst, fontWeight: '700', marginBottom: '8px' }}>Ugyldig invitasjon</div>
      <div style={{ fontSize: '14px', fontFamily: 'var(--font-inter)', color: farger.tekstLys }}>Lenken er utløpt eller allerede brukt.</div>
    </div>
  );

  if (status === 'ferdig') return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', backgroundColor: farger.bakgrunn, padding: '24px', textAlign: 'center' }}>
      <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎉</div>
      <div style={{ fontSize: '20px', fontFamily: 'var(--font-plus-jakarta)', color: farger.tekst, fontWeight: '700', marginBottom: '8px' }}>Du har fått tilgang!</div>
      <div style={{ fontSize: '14px', fontFamily: 'var(--font-inter)', color: farger.tekstLys, marginBottom: '24px' }}>Last ned Lille og logg inn med {epost}</div>
      <a href='https://lilleapp.no' style={{ padding: '14px 28px', backgroundColor: farger.grønn, color: 'white', borderRadius: '50px', textDecoration: 'none', fontWeight: '600', fontFamily: 'var(--font-inter)' }}>Gå til Lille 🌿</a>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', backgroundColor: farger.bakgrunn, padding: '24px' }}>
      <div style={{ width: '100%', maxWidth: '400px' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <img src='/leep.png' style={{ width: '100px', marginBottom: '16px', mixBlendMode: 'multiply' }} />
          <div style={{ fontSize: '22px', fontFamily: 'var(--font-plus-jakarta)', color: farger.tekst, fontWeight: '700', marginBottom: '8px' }}>Du er invitert! 🤍</div>
          <div style={{ fontSize: '14px', fontFamily: 'var(--font-inter)', color: farger.tekstLys }}>Logg inn eller opprett konto for å følge {barnNavn}</div>
        </div>
        <div style={{ backgroundColor: farger.hvit, border: `1px solid ${farger.kremMørk}`, borderRadius: '16px', padding: '24px' }}>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
            <button onClick={() => setErNy(false)} style={{ flex: 1, padding: '10px', borderRadius: '10px', border: !erNy ? `2px solid ${farger.grønn}` : `1px solid ${farger.kremMørk}`, backgroundColor: !erNy ? farger.grønnLys : farger.bakgrunn, color: !erNy ? farger.grønn : farger.tekstLys, cursor: 'pointer', fontFamily: 'var(--font-inter)', fontSize: '13px', fontWeight: !erNy ? '600' : '400' }}>Har konto</button>
            <button onClick={() => setErNy(true)} style={{ flex: 1, padding: '10px', borderRadius: '10px', border: erNy ? `2px solid ${farger.grønn}` : `1px solid ${farger.kremMørk}`, backgroundColor: erNy ? farger.grønnLys : farger.bakgrunn, color: erNy ? farger.grønn : farger.tekstLys, cursor: 'pointer', fontFamily: 'var(--font-inter)', fontSize: '13px', fontWeight: erNy ? '600' : '400' }}>Ny bruker</button>
          </div>
          <input type='email' value={epost} onChange={e => setEpost(e.target.value)} placeholder='E-post' style={{ width: '100%', padding: '12px 14px', fontSize: '15px', border: `1px solid ${farger.kremMørk}`, borderRadius: '10px', backgroundColor: farger.bakgrunn, color: farger.tekst, marginBottom: '12px', outline: 'none', fontFamily: 'var(--font-inter)', boxSizing: 'border-box' }} />
          <input type='password' value={passord} onChange={e => setPassord(e.target.value)} placeholder='Passord' style={{ width: '100%', padding: '12px 14px', fontSize: '15px', border: `1px solid ${farger.kremMørk}`, borderRadius: '10px', backgroundColor: farger.bakgrunn, color: farger.tekst, marginBottom: '20px', outline: 'none', fontFamily: 'var(--font-inter)', boxSizing: 'border-box' }} />
          <button onClick={aksepter} style={{ width: '100%', padding: '14px', backgroundColor: farger.grønn, border: 'none', borderRadius: '10px', fontSize: '15px', fontWeight: '600', color: '#FDFAF6', cursor: 'pointer', fontFamily: 'var(--font-inter)' }}>
            {erNy ? 'Opprett konto og godta' : 'Logg inn og godta'} 🤍
          </button>
        </div>
      </div>
    </div>
  );
}
