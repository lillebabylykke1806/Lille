'use client';
export const dynamic = 'force-dynamic';

import { Suspense, useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import type { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { farger } from '../lib/farger';
import { erAlleredeRegistrert } from '../lib/authSignup';
import { useLanguage } from '../lib/i18n/LanguageContext';
import { lagreSamtykkeVedRegistrering } from '../lib/consent';
import { ConsentCheckboxes } from '../components/consent/ConsentCheckboxes';

const SUPABASE_URL = 'https://hicdsrqhgjdvjctxcucr.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhpY2RzcnFoZ2pkdmpjdHhjdWNyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgzNDMxNDEsImV4cCI6MjA5MzkxOTE0MX0.l8N5-LjFNakStf2ZF0-TyrD9Vg9ooFKihzh53L-NXNo';

type SideStatus = 'laster' | 'klar' | 'suksess' | 'feil';

function KodeInnhold() {
  const { t } = useLanguage();
  const searchParams = useSearchParams();
  const kode = searchParams.get('c')?.trim().toUpperCase() ?? '';

  const [sideStatus, setSideStatus] = useState<SideStatus>('laster');
  const [bruker, setBruker] = useState<User | null>(null);
  const [erNy, setErNy] = useState(false);
  const [epost, setEpost] = useState('');
  const [passord, setPassord] = useState('');
  const [authFeil, setAuthFeil] = useState('');
  const [alleredeKonto, setAlleredeKonto] = useState(false);
  const [lasterAuth, setLasterAuth] = useState(false);
  const [godtarVilkår, setGodtarVilkår] = useState(false);
  const [markedsforing, setMarkedsforing] = useState(false);
  const [lasterInnlosning, setLasterInnlosning] = useState(false);
  const [melding, setMelding] = useState('');
  const [feilmelding, setFeilmelding] = useState('');

  useEffect(() => {
    if (!kode) {
      setSideStatus('feil');
      setFeilmelding('No code in this link. Please check that you have the right URL.');
      return;
    }

    const sjekkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) setBruker(session.user);
      setSideStatus('klar');
    };
    sjekkSession();
  }, [kode]);

  const loggInnEllerRegistrer = async () => {
    setAuthFeil('');
    setAlleredeKonto(false);
    if (erNy && !godtarVilkår) {
      setAuthFeil(t('consent.required'));
      return;
    }
    setLasterAuth(true);
    try {
      if (erNy) {
        const { data, error } = await supabase.auth.signUp({ email: epost, password: passord });
        if (erAlleredeRegistrert(error, data?.user)) {
          setAlleredeKonto(true);
          return;
        }
        if (error) {
          setAuthFeil(error.message || t('innlogging.noeGikkGalt'));
          return;
        }
        if (data.user) {
          await lagreSamtykkeVedRegistrering(data.user.id, markedsforing, epost);
          setBruker(data.user);
        }
        return;
      }

      const { data, error } = await supabase.auth.signInWithPassword({ email: epost, password: passord });
      if (error) {
        const melding = error.message?.toLowerCase() ?? '';
        const feilPassord =
          error.code === 'invalid_credentials' ||
          melding.includes('invalid login credentials') ||
          melding.includes('invalid credentials');
        setAuthFeil(feilPassord ? t('innlogging.feilEpostPassord') : (error.message || t('innlogging.noeGikkGalt')));
        return;
      }
      if (data.user) setBruker(data.user);
    } finally {
      setLasterAuth(false);
    }
  };

  const losInnKode = useCallback(async () => {
    if (!kode || !bruker) return;
    setFeilmelding('');
    setMelding('');
    setLasterInnlosning(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        setFeilmelding('You need to be logged in to redeem this code.');
        return;
      }

      const res = await fetch(`${SUPABASE_URL}/functions/v1/redeem-code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
          apikey: SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({ code: kode }),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        setFeilmelding(data.error || 'Something went wrong — please try again shortly.');
        return;
      }

      if (data.type === 'customer_discount' && data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
        return;
      }

      setMelding(data.message || 'Code redeemed!');
      setSideStatus('suksess');
    } catch {
      setFeilmelding('Something went wrong — please try again shortly.');
    } finally {
      setLasterInnlosning(false);
    }
  }, [kode, bruker]);

  const spinner = (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', backgroundColor: farger.bakgrunn }}>
      <div style={{ width: '28px', height: '28px', border: `2px solid ${farger.grønn}`, borderTop: '2px solid transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  if (sideStatus === 'laster') return spinner;

  if (sideStatus === 'feil' && !kode) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', backgroundColor: farger.bakgrunn, padding: '24px', textAlign: 'center' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>😕</div>
        <div style={{ fontSize: '20px', fontFamily: 'var(--font-plus-jakarta)', color: farger.tekst, fontWeight: '700', marginBottom: '8px' }}>Invalid link</div>
        <div style={{ fontSize: '14px', fontFamily: 'var(--font-inter)', color: farger.tekstLys }}>{feilmelding}</div>
      </div>
    );
  }

  if (sideStatus === 'suksess') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', backgroundColor: farger.bakgrunn, padding: '24px', textAlign: 'center' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎉</div>
        <div style={{ fontSize: '20px', fontFamily: 'var(--font-plus-jakarta)', color: farger.tekst, fontWeight: '700', marginBottom: '8px' }}>Code redeemed!</div>
        <div style={{ fontSize: '14px', fontFamily: 'var(--font-inter)', color: farger.tekstLys, marginBottom: '24px', maxWidth: '360px' }}>{melding}</div>
        <a href='https://www.lilleapp.no' style={{ padding: '14px 28px', backgroundColor: farger.grønn, color: 'white', borderRadius: '50px', textDecoration: 'none', fontWeight: '600', fontFamily: 'var(--font-inter)' }}>Go to Lille</a>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', backgroundColor: farger.bakgrunn, padding: '24px' }}>
      <div style={{ width: '100%', maxWidth: '400px' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <img src='/leep.png' style={{ width: '100px', marginBottom: '16px', mixBlendMode: 'multiply' }} alt="" />
          <div style={{ fontSize: '22px', fontFamily: 'var(--font-plus-jakarta)', color: farger.tekst, fontWeight: '700', marginBottom: '8px' }}>Redeem code</div>
          <div style={{ fontSize: '14px', fontFamily: 'var(--font-inter)', color: farger.tekstLys }}>
            You're redeeming: <strong style={{ color: farger.grønn, letterSpacing: '1px' }}>{kode}</strong>
          </div>
        </div>

        <div style={{ backgroundColor: farger.hvit, border: `1px solid ${farger.kremMørk}`, borderRadius: '16px', padding: '24px' }}>
          {bruker ? (
            <>
              <div style={{ fontSize: '14px', fontFamily: 'var(--font-inter)', color: farger.tekstLys, marginBottom: '20px', textAlign: 'center' }}>
                Logged in as <strong style={{ color: farger.tekst }}>{bruker.email}</strong>
              </div>
              {feilmelding && (
                <div style={{ padding: '12px', backgroundColor: '#FDEDED', borderRadius: '10px', color: '#B04545', fontSize: '14px', fontFamily: 'var(--font-inter)', marginBottom: '16px', textAlign: 'center' }}>
                  {feilmelding}
                </div>
              )}
              <button
                onClick={losInnKode}
                disabled={lasterInnlosning}
                style={{ width: '100%', padding: '14px', backgroundColor: lasterInnlosning ? farger.kremMørk : farger.grønn, border: 'none', borderRadius: '10px', fontSize: '15px', fontWeight: '600', color: '#FDFAF6', cursor: lasterInnlosning ? 'wait' : 'pointer', fontFamily: 'var(--font-inter)' }}
              >
                {lasterInnlosning ? 'Redeeming…' : 'Redeem code 🤍'}
              </button>
            </>
          ) : (
            <>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
                <button onClick={() => { setErNy(false); setAuthFeil(''); setAlleredeKonto(false); setGodtarVilkår(false); setMarkedsforing(false); }} style={{ flex: 1, padding: '10px', borderRadius: '10px', border: !erNy ? `2px solid ${farger.grønn}` : `1px solid ${farger.kremMørk}`, backgroundColor: !erNy ? farger.grønnLys : farger.bakgrunn, color: !erNy ? farger.grønn : farger.tekstLys, cursor: 'pointer', fontFamily: 'var(--font-inter)', fontSize: '13px', fontWeight: !erNy ? '600' : '400' }}>{t('innlogging.loggInn')}</button>
                <button onClick={() => { setErNy(true); setAuthFeil(''); setAlleredeKonto(false); }} style={{ flex: 1, padding: '10px', borderRadius: '10px', border: erNy ? `2px solid ${farger.grønn}` : `1px solid ${farger.kremMørk}`, backgroundColor: erNy ? farger.grønnLys : farger.bakgrunn, color: erNy ? farger.grønn : farger.tekstLys, cursor: 'pointer', fontFamily: 'var(--font-inter)', fontSize: '13px', fontWeight: erNy ? '600' : '400' }}>{t('innlogging.opprettKonto')}</button>
              </div>
              <input type='email' value={epost} onChange={e => setEpost(e.target.value)} placeholder={t('innlogging.epostPlaceholder')} style={{ width: '100%', padding: '12px 14px', fontSize: '15px', border: `1px solid ${farger.kremMørk}`, borderRadius: '10px', backgroundColor: farger.bakgrunn, color: farger.tekst, marginBottom: '12px', outline: 'none', fontFamily: 'var(--font-inter)', boxSizing: 'border-box' }} />
              <input type='password' value={passord} onChange={e => setPassord(e.target.value)} placeholder={t('innlogging.passordPlaceholder')} style={{ width: '100%', padding: '12px 14px', fontSize: '15px', border: `1px solid ${farger.kremMørk}`, borderRadius: '10px', backgroundColor: farger.bakgrunn, color: farger.tekst, marginBottom: erNy || authFeil || alleredeKonto ? '12px' : '20px', outline: 'none', fontFamily: 'var(--font-inter)', boxSizing: 'border-box' }} />
              {erNy && (
                <ConsentCheckboxes
                  godtarVilkår={godtarVilkår}
                  markedsforing={markedsforing}
                  onGodtarVilkår={setGodtarVilkår}
                  onMarkedsforing={setMarkedsforing}
                />
              )}
              {alleredeKonto && (
                <div style={{ margin: '0 0 16px', padding: '14px', backgroundColor: '#FDF6F0', borderRadius: '12px', border: `1px solid ${farger.kremMørk}`, textAlign: 'center' }}>
                  <p style={{ fontSize: '15px', fontWeight: 600, color: farger.tekst, fontFamily: 'var(--font-inter)', margin: '0 0 4px' }}>{t('innlogging.alleredeKontoTittel')}</p>
                  <p style={{ fontSize: '13px', color: farger.tekstLys, fontFamily: 'var(--font-inter)', margin: '0 0 14px' }}>{t('innlogging.alleredeKontoTekst')}</p>
                  <button
                    type="button"
                    onClick={() => { setAlleredeKonto(false); setErNy(false); setAuthFeil(''); }}
                    style={{ width: '100%', padding: '12px', backgroundColor: farger.grønn, border: 'none', borderRadius: '10px', fontSize: '13px', fontWeight: 600, color: '#FDFAF6', cursor: 'pointer', fontFamily: 'var(--font-inter)' }}
                  >
                    {t('innlogging.gåTilInnlogging')}
                  </button>
                </div>
              )}
              {authFeil && !alleredeKonto && (
                <div style={{ fontSize: '13px', color: '#B04545', fontFamily: 'var(--font-inter)', marginBottom: '16px', textAlign: 'center' }}>{authFeil}</div>
              )}
              <button
                onClick={loggInnEllerRegistrer}
                disabled={lasterAuth || !epost || !passord || (erNy && !godtarVilkår)}
                style={{ width: '100%', padding: '14px', backgroundColor: lasterAuth || (erNy && !godtarVilkår) ? farger.kremMørk : farger.grønn, border: 'none', borderRadius: '10px', fontSize: '15px', fontWeight: '600', color: '#FDFAF6', cursor: lasterAuth || (erNy && !godtarVilkår) ? 'default' : 'pointer', fontFamily: 'var(--font-inter)', opacity: erNy && !godtarVilkår ? 0.6 : 1 }}
              >
                {lasterAuth ? t('innlogging.ventLitt') : erNy ? t('innlogging.opprettOgFortsett') : t('innlogging.loggInnOgFortsett')} 🤍
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function KodePage() {
  return (
    <Suspense fallback={
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', backgroundColor: '#F8F3EE' }}>
        <div style={{ width: '28px', height: '28px', border: '2px solid #2D5C45', borderTop: '2px solid transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    }>
      <KodeInnhold />
    </Suspense>
  );
}
