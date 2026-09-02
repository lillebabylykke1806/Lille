'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../lib/supabase';
import { farger } from '../lib/farger';
import { useLanguage } from '../lib/i18n/LanguageContext';

export default function TilbakestillPassord() {
  const { t } = useLanguage();
  const router = useRouter();
  const [klar, setKlar] = useState(false);
  const [ugyldig, setUgyldig] = useState(false);
  const [passord, setPassord] = useState('');
  const [lagrer, setLagrer] = useState(false);
  const [feil, setFeil] = useState('');
  const [suksess, setSuksess] = useState(false);

  useEffect(() => {
    const hasRecoveryHash = window.location.hash.includes('type=recovery');
    let resolved = false;

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        resolved = true;
        setKlar(true);
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        resolved = true;
        setKlar(true);
      }
    });

    const timeout = setTimeout(() => {
      if (!resolved) setUgyldig(true);
    }, hasRecoveryHash ? 5000 : 1500);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  const lagrePassord = async () => {
    if (passord.length < 6) return;
    setLagrer(true);
    setFeil('');
    try {
      const { error } = await supabase.auth.updateUser({ password: passord });
      if (error) {
        setFeil(t('innlogging.noeGikkGalt'));
        return;
      }
      setSuksess(true);
      await supabase.auth.signOut();
      setTimeout(() => router.push('/'), 3000);
    } catch {
      setFeil(t('innlogging.noeGikkGalt'));
    } finally {
      setLagrer(false);
    }
  };

  return (
    <div style={{ backgroundColor: farger.bakgrunn, minHeight: '100vh', maxWidth: '430px', margin: '0 auto', fontFamily: 'var(--font-plus-jakarta), sans-serif', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 24px' }}>
      <div style={{ marginBottom: '32px', textAlign: 'center' }}>
        <img src="/leep.png" alt="Lille" style={{ width: '140px', height: 'auto', marginBottom: '16px', mixBlendMode: 'multiply' }} />
      </div>
      <div style={{ backgroundColor: farger.hvit, border: `1px solid ${farger.kremMørk}`, borderRadius: '16px', padding: '24px', width: '100%' }}>
        {ugyldig ? (
          <p style={{ fontSize: '14px', color: farger.tekstLys, fontFamily: 'var(--font-inter), sans-serif', textAlign: 'center', lineHeight: 1.6, margin: 0 }}>
            {t('tilbakestillPassord.ugyldigLenke')}
          </p>
        ) : suksess ? (
          <p style={{ fontSize: '14px', color: farger.grønn, fontFamily: 'var(--font-inter), sans-serif', textAlign: 'center', lineHeight: 1.6, margin: 0 }}>
            {t('tilbakestillPassord.suksess')}
          </p>
        ) : !klar ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0' }}>
            <div style={{ width: '28px', height: '28px', border: `2px solid ${farger.grønn}`, borderTop: '2px solid transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        ) : (
          <>
            <p style={{ fontSize: '18px', fontStyle: 'italic', color: farger.terrakotta, margin: '0 0 20px' }}>{t('tilbakestillPassord.tittel')}</p>
            <input
              type="password"
              value={passord}
              onChange={(e) => setPassord(e.target.value)}
              placeholder={t('tilbakestillPassord.nyttPassord')}
              style={{ width: '100%', padding: '12px 14px', fontSize: '15px', border: `1px solid ${farger.kremMørk}`, borderRadius: '10px', backgroundColor: farger.bakgrunn, color: farger.tekst, marginBottom: '16px', outline: 'none', fontFamily: 'var(--font-inter), sans-serif', boxSizing: 'border-box' }}
            />
            {feil && <p style={{ fontSize: '13px', color: '#C0392B', fontFamily: 'var(--font-inter), sans-serif', margin: '0 0 14px', textAlign: 'center' }}>{feil}</p>}
            <button
              onClick={lagrePassord}
              disabled={lagrer || passord.length < 6}
              style={{ width: '100%', padding: '14px', backgroundColor: farger.grønn, border: 'none', borderRadius: '10px', fontSize: '12px', fontWeight: '600', color: '#FDFAF6', cursor: lagrer || passord.length < 6 ? 'default' : 'pointer', opacity: lagrer || passord.length < 6 ? 0.7 : 1, letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: 'var(--font-inter), sans-serif' }}
            >
              {lagrer ? '…' : t('tilbakestillPassord.lagre')}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
