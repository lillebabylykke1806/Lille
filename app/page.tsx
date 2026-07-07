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
import Mat from './components/mat/Mat';
import Pumping from './components/pumping/Pumping';
import Temperatur from './components/temperatur/Temperatur';
import Paywall from './components/paywall/Paywall';
import { useLanguage } from './lib/i18n/LanguageContext';
import { hasActiveSubscription, initRevenueCat, isNativeApp } from './lib/subscription';
import { requestNotificationPermissionIfNeeded } from './lib/notifications';
import { watchScreenshots } from './lib/screenshot';

export default function Home() {
  const { t } = useLanguage();
  const [aktivSide, setAktivSide] = useState('hjem');
  const [bruker, setBruker] = useState<any>(null);
  const [laster, setLaster] = useState(true);
  const [epost, setEpost] = useState('');
  const [passord, setPassord] = useState('');
  const [erNyBruker, setErNyBruker] = useState(false);
  const [innloggingFeil, setInnloggingFeil] = useState('');
  const [loggerInn, setLoggerInn] = useState(false);
  const [visRegistrer, setVisRegistrer] = useState(false);
  const [visOnboarding, setVisOnboarding] = useState(false);
  const [visGlemtPopup, setVisGlemtPopup] = useState(false);
  const [åpneEtterregistrer, setÅpneEtterregistrer] = useState(false);
const [åpneMorgen, setÅpneMorgen] = useState(false);
  const [aktivtBarn, setAktivtBarn] = useState<any>(null);
  const [innsiktStartFane, setInnsiktStartFane] = useState<'språk' | 'innsikt'>('språk');
  const [harAbonnement, setHarAbonnement] = useState<boolean | null>(null);
  const [visPaywall, setVisPaywall] = useState(false);
  const [visScreenshotToast, setVisScreenshotToast] = useState(false);

  useEffect(() => {
    const lastData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        let partnerHarAktivTilgang = false;

        // Sjekk om bruker er partner med tilgang
        const { data: partnerTilgang } = await supabase
          .from('barn_tilgang')
          .select('*, invitert_av')
          .eq('bruker_id', session.user.id)
          .single();

        if (partnerTilgang) {
          // Sjekk at den som inviterte har aktivt abonnement
          const { data: invitertBruker } = await supabase
            .from('profiler')
            .select('stripe_subscription_status')
            .eq('id', partnerTilgang.invitert_av)
            .single();

          if (invitertBruker?.stripe_subscription_status === 'active') {
            setHarAbonnement(true);
            partnerHarAktivTilgang = true;

            // Last inn partner-barnets data
            const { data: partnerBarn } = await supabase
              .from('barn_tilgang')
              .select('barn_id, barn(*)')
              .eq('bruker_id', session.user.id)
              .single();
            if (partnerBarn?.barn) setAktivtBarn(partnerBarn.barn);
          } else {
            // Bruker A har ikke aktivt abonnement – partner B får ikke tilgang
            setHarAbonnement(false);
            await supabase.auth.signOut();
            setLaster(false);
            return;
          }
        }

        if (!partnerHarAktivTilgang) {
          const aktiv = await hasActiveSubscription(
            session.user.email || '',
            session.user.id,
          );
          setHarAbonnement(aktiv);
          if (!aktiv) {
            if (isNativeApp()) {
              setVisPaywall(true);
            } else {
              await supabase.auth.signOut();
              setLaster(false);
              return;
            }
          }
        } else {
          setHarAbonnement(true);
        }
      
        setBruker(session.user);
      
        if (!partnerHarAktivTilgang) {
          const { data: barn } = await supabase
            .from('barn')
            .select('*')
            .eq('bruker_id', session.user.id)
            .order('opprettet', { ascending: true })
            .limit(1)
            .single();
  
          // Sjekk om bruker har tilgang via partner-invitasjon
          if (!barn || barn.length === 0) {
            const { data: tilgang } = await supabase
              .from('barn_tilgang')
              .select('barn_id, barn(*)')
              .eq('bruker_id', session.user.id);

            if (tilgang && tilgang.length > 0) {
              const partnerBarn = tilgang[0].barn;
              setAktivtBarn(partnerBarn);
            } else {
              setVisOnboarding(true);
            }
          } else {
            setAktivtBarn(barn);
          }
        }
  
        const lagretType = localStorage.getItem('lille_sovtype');
        if (lagretType === 'natt') setAktivSide('sovn');
      }
      setLaster(false);
    };
    setTimeout(() => setLaster(false), 5000);
    lastData();
  }, []);
  
  useEffect(() => {
    if (!bruker) return;
    requestNotificationPermissionIfNeeded();
  }, [bruker]);

  useEffect(() => {
    if (!bruker) return;
    let hideTimer: ReturnType<typeof setTimeout> | undefined;
    let cleanup = () => {};

    watchScreenshots(() => {
      setVisScreenshotToast(true);
      if (hideTimer) clearTimeout(hideTimer);
      hideTimer = setTimeout(() => setVisScreenshotToast(false), 4000);
    }).then((unwatch) => {
      cleanup = unwatch;
    });

    return () => {
      if (hideTimer) clearTimeout(hideTimer);
      cleanup();
    };
  }, [bruker]);

  useEffect(() => {
    if (!bruker) return;
    const sjekkGlemtLeggetid = async () => {
      const nå = new Date();
      const timer = nå.getHours();
      if (timer < 6 || timer > 11) return;
    
      const dagensdato = nå.toISOString().split('T')[0];
      const sistVist = localStorage.getItem('lille_glemt_popup_dato');
      if (sistVist === dagensdato) {
        setVisGlemtPopup(false);
        return;
      }
  
      const igår = new Date();
      igår.setDate(igår.getDate() - 1);
      const igårDato = igår.toISOString().split('T')[0];
  
      const { data } = await supabase
        .from('lurer')
        .select('*')
        .eq('profil_id', bruker.id)
        .eq('dato', igårDato)
        .eq('type', 'natt');

        if (!data || data.length === 0) {
          localStorage.setItem('lille_glemt_popup_dato', dagensdato);
          setVisGlemtPopup(true);
        }
    };
    sjekkGlemtLeggetid();
  }, [bruker]);

  const loggInn = async () => {
    if (loggerInn) return;
    setInnloggingFeil('');
    setLoggerInn(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email: epost, password: passord });
      if (error) {
        setInnloggingFeil(t('innlogging.feilEpostPassord'));
        return;
      }
      localStorage.removeItem('lille_babybilde');
      // Subscription/RevenueCat checks are guarded by timeouts and can never hang the login.
      const aktiv = await hasActiveSubscription(data.user.email || '', data.user.id);
      setHarAbonnement(aktiv);
      if (!aktiv) {
        if (isNativeApp()) {
          setBruker(data.user);
          setVisPaywall(true);
          return;
        }
        await supabase.auth.signOut();
        return;
      }
      setBruker(data.user);
    } catch {
      setInnloggingFeil(t('innlogging.noeGikkGalt'));
    } finally {
      setLoggerInn(false);
    }
  };

  const registrer = async () => {
    if (loggerInn) return;
    setInnloggingFeil('');
    setLoggerInn(true);
    try {
      const { data, error } = await supabase.auth.signUp({ email: epost, password: passord });
      if (error) {
        setInnloggingFeil(t('innlogging.noeGikkGalt'));
        return;
      }
      if (!data.user) return;
      if (isNativeApp()) {
        // Show the user immediately; RevenueCat is set up in the background and
        // failures here must not block the sign-up flow.
        setBruker(data.user);
        setHarAbonnement(false);
        setVisPaywall(true);
        initRevenueCat(data.user.id);
      } else {
        const res = await fetch('/api/create-checkout-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: epost }),
        });
        const { url } = await res.json();
        if (url) window.location.href = url;
        else setBruker(data.user);
      }
    } catch {
      setInnloggingFeil(t('innlogging.noeGikkGalt'));
    } finally {
      setLoggerInn(false);
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

  if (visPaywall && bruker && harAbonnement === false && isNativeApp()) {
    return (
      <Paywall
        required
        onSuccess={() => {
          setHarAbonnement(true);
          setVisPaywall(false);
        }}
      />
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
          <div style={{ fontSize: '13px', color: farger.tekstLys, fontFamily: 'var(--font-inter), sans-serif' }}>{t('innlogging.tagline')}</div>
        </div>
        <div style={{ backgroundColor: farger.hvit, border: `1px solid ${farger.kremMørk}`, borderRadius: '16px', padding: '24px', width: '100%' }}>
          <p style={{ fontSize: '18px', fontStyle: 'italic', color: farger.terrakotta, margin: '0 0 20px' }}>{erNyBruker ? t('innlogging.velkommen') : t('innlogging.heiIgjen')}</p>
          <input type="email" value={epost} onChange={(e) => setEpost(e.target.value)} placeholder={t('innlogging.epostPlaceholder')} style={{ width: '100%', padding: '12px 14px', fontSize: '15px', border: `1px solid ${farger.kremMørk}`, borderRadius: '10px', backgroundColor: farger.bakgrunn, color: farger.tekst, marginBottom: '12px', outline: 'none', fontFamily: 'var(--font-inter), sans-serif', boxSizing: 'border-box' }} />
          <input type="password" value={passord} onChange={(e) => setPassord(e.target.value)} placeholder={t('innlogging.passordPlaceholder')} style={{ width: '100%', padding: '12px 14px', fontSize: '15px', border: `1px solid ${farger.kremMørk}`, borderRadius: '10px', backgroundColor: farger.bakgrunn, color: farger.tekst, marginBottom: '20px', outline: 'none', fontFamily: 'var(--font-inter), sans-serif', boxSizing: 'border-box' }} />
          {innloggingFeil && <p style={{ fontSize: '13px', color: '#C0392B', fontFamily: 'var(--font-inter), sans-serif', margin: '0 0 14px', textAlign: 'center' }}>{innloggingFeil}</p>}
          <button onClick={erNyBruker ? registrer : loggInn} disabled={loggerInn} style={{ width: '100%', padding: '14px', backgroundColor: farger.grønn, border: 'none', borderRadius: '10px', fontSize: '12px', fontWeight: '600', color: '#FDFAF6', cursor: loggerInn ? 'default' : 'pointer', opacity: loggerInn ? 0.7 : 1, letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: 'var(--font-inter), sans-serif', marginBottom: '12px' }}>
            {loggerInn ? '…' : (erNyBruker ? t('innlogging.opprettKonto') : t('innlogging.loggInn'))}
          </button>
          <button onClick={() => { setErNyBruker(!erNyBruker); setInnloggingFeil(''); }} style={{ width: '100%', padding: '12px', backgroundColor: 'transparent', border: `1px solid ${farger.kremMørk}`, borderRadius: '10px', fontSize: '12px', color: farger.tekstLys, cursor: 'pointer', fontFamily: 'var(--font-inter), sans-serif' }}>
            {erNyBruker ? t('innlogging.harAlleredeKonto') : t('innlogging.nyBruker')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: farger.bakgrunn, minHeight: '100vh', maxWidth: '430px', margin: '0 auto', fontFamily: 'var(--font-plus-jakarta), sans-serif', position: 'relative' }}>
      <div style={{ overflowY: 'auto', height: '100vh', paddingBottom: '90px' }}>
      {aktivSide === 'hjem' && <Hjemskjerm bruker={bruker} aktivtBarn={aktivtBarn} onNavigate={(side, fane) => {
        if (side === 'sovn-morgen') {
          setÅpneMorgen(true);
          setÅpneEtterregistrer(false);
          setAktivSide('sovn');
          return;
        }
        if (side === 'sovn') {
          setÅpneMorgen(false);
          setÅpneEtterregistrer(false);
        }
        setAktivSide(side);
        if (fane === 'innsikt') setInnsiktStartFane('innsikt');
        else setInnsiktStartFane('språk');
      }} onByttBarn={setAktivtBarn} />}
      {aktivSide === 'sovn' && <Sovn bruker={bruker} aktivtBarn={aktivtBarn} åpneEtterregistrer={åpneEtterregistrer} åpneMorgen={åpneMorgen} onNavigate={setAktivSide} onNavigasjonKonsumert={() => { setÅpneMorgen(false); setÅpneEtterregistrer(false); }} />}
        {aktivSide === 'bleie' && <Bleie bruker={bruker} />}
        {aktivSide === 'amming' && <Amming bruker={bruker} />}
        {aktivSide === 'innsikt' && <Innsikt bruker={bruker} aktivtBarn={aktivtBarn} onNavigate={setAktivSide} startFane={innsiktStartFane} />}
        {aktivSide === 'medisin' && <Medisin bruker={bruker} />}
        {aktivSide === 'notat' && <Notat bruker={bruker} />}
        {aktivSide === 'vekt' && <Vekt bruker={bruker} aktivtBarn={aktivtBarn} />}
        {aktivSide === 'aktivitet' && <Aktivitet bruker={bruker} />}
        {aktivSide === 'signaler' && <Signaler bruker={bruker} aktivtBarn={aktivtBarn} onNavigate={setAktivSide} />}
        {aktivSide === 'kolikk' && <Kolikk bruker={bruker} aktivtBarn={aktivtBarn} />}
        {aktivSide === 'mat' && <Mat bruker={bruker} aktivtBarn={aktivtBarn} />}
        {aktivSide === 'profil' && <Profil bruker={bruker} onLoggUt={loggUt} aktivtBarn={aktivtBarn} onByttBarn={setAktivtBarn} onVisPaywall={() => setVisPaywall(true)} />}
        {aktivSide === 'pumping' && <Pumping bruker={bruker} />}
        {aktivSide === 'temperatur' && <Temperatur bruker={bruker} aktivtBarn={aktivtBarn} onNavigate={setAktivSide} />}
      </div>

      {/* Navigasjon */}
      <div style={{ position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: '430px', backgroundColor: farger.hvit, borderTop: `1px solid ${farger.kremMørk}`, display: 'flex', alignItems: 'center', padding: '8px 0 24px' }}>
        <button onClick={() => setAktivSide('hjem')} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', border: 'none', background: 'transparent', cursor: 'pointer', padding: '6px 0' }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path d="M3 9.5L12 3L21 9.5V20C21 20.55 20.55 21 20 21H15V15H9V21H4C3.45 21 3 20.55 3 20V9.5Z" fill={aktivSide === 'hjem' ? farger.grønn : farger.kremMørk}/>
          </svg>
          <span style={{ fontSize: '10px', fontFamily: 'var(--font-inter), sans-serif', color: aktivSide === 'hjem' ? farger.grønn : farger.tekstLys, fontWeight: aktivSide === 'hjem' ? '600' : '400' }}>{t('nav.hjem')}</span>
        </button>

        <button onClick={() => { setÅpneMorgen(false); setÅpneEtterregistrer(false); setAktivSide('sovn'); }} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', border: 'none', background: 'transparent', cursor: 'pointer', padding: '6px 0' }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path d="M12 3C7.03 3 3 7.03 3 12C3 16.97 7.03 21 12 21C14.5 21 16.76 20.01 18.43 18.4C14.1 18.17 10.5 14.43 10.5 9.9C10.5 7.3 11.72 4.98 13.62 3.45C13.09 3.16 12.56 3 12 3Z" fill={aktivSide === 'sovn' ? farger.grønn : farger.kremMørk}/>
          </svg>
          <span style={{ fontSize: '10px', fontFamily: 'var(--font-inter), sans-serif', color: aktivSide === 'sovn' ? farger.grønn : farger.tekstLys, fontWeight: aktivSide === 'sovn' ? '600' : '400' }}>{t('nav.søvn')}</span>
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
          <span style={{ fontSize: '10px', fontFamily: 'var(--font-inter), sans-serif', color: aktivSide === 'innsikt' ? farger.grønn : farger.tekstLys, fontWeight: aktivSide === 'innsikt' ? '600' : '400' }}>{t('nav.innsikt')}</span>
        </button>

        <button onClick={() => setAktivSide('profil')} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', border: 'none', background: 'transparent', cursor: 'pointer', padding: '6px 0' }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="8" r="4" fill={aktivSide === 'profil' ? farger.grønn : farger.kremMørk}/>
            <path d="M4 20C4 16.69 7.58 14 12 14C16.42 14 20 16.69 20 20" stroke={aktivSide === 'profil' ? farger.grønn : farger.kremMørk} strokeWidth="2" strokeLinecap="round"/>
          </svg>
          <span style={{ fontSize: '10px', fontFamily: 'var(--font-inter), sans-serif', color: aktivSide === 'profil' ? farger.grønn : farger.tekstLys, fontWeight: aktivSide === 'profil' ? '600' : '400' }}>{t('nav.profil')}</span>
        </button>
      </div>

      {visGlemtPopup && (
  <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
    <div style={{ backgroundColor: farger.hvit, borderRadius: '24px', padding: '28px 24px', width: '100%', maxWidth: '380px', textAlign: 'center' }}>
      <div style={{ fontSize: '40px', marginBottom: '16px' }}>🌙</div>
      <div style={{ fontSize: '18px', fontFamily: 'var(--font-plus-jakarta)', color: farger.tekst, fontWeight: '700', marginBottom: '10px' }}>
        {t('hjem.glemtLeggetidTittel')}
      </div>
      <div style={{ fontSize: '13px', fontFamily: 'var(--font-inter)', color: farger.tekstLys, lineHeight: 1.7, marginBottom: '24px' }}>
        {t('hjem.glemtLeggetidTekst')}
      </div>
      <button
        onClick={() => { setVisGlemtPopup(false); setÅpneEtterregistrer(true); setÅpneMorgen(false); setAktivSide('sovn'); }}
        style={{ width: '100%', padding: '14px', backgroundColor: farger.grønn, border: 'none', borderRadius: '14px', fontSize: '14px', fontWeight: '600', color: '#FDFAF6', cursor: 'pointer', fontFamily: 'var(--font-inter)', marginBottom: '10px' }}
      >
        {t('hjem.registrerLeggetid')}
      </button>
      <button
        onClick={() => { setVisGlemtPopup(false); setÅpneMorgen(true); setÅpneEtterregistrer(false); setAktivSide('sovn'); }}
        style={{ width: '100%', padding: '14px', backgroundColor: 'transparent', border: `1px solid ${farger.kremMørk}`, borderRadius: '14px', fontSize: '14px', color: farger.tekstLys, cursor: 'pointer', fontFamily: 'var(--font-inter)' }}
      >
        {t('hjem.startNyDag')}
      </button>
    </div>
  </div>
)}

      {visRegistrer && (
  <Viftemeny
    bruker={bruker}
    aktivtBarn={aktivtBarn}
    onNavigate={setAktivSide}
    onLukk={() => setVisRegistrer(false)}
  />
)}

      {visPaywall && bruker && harAbonnement && isNativeApp() && (
        <Paywall
          onSuccess={() => setVisPaywall(false)}
          onClose={() => setVisPaywall(false)}
        />
      )}

      {visScreenshotToast && (
        <div style={{
          position: 'fixed',
          bottom: '110px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 400,
          width: 'calc(100% - 48px)',
          maxWidth: '380px',
          padding: '14px 18px',
          backgroundColor: 'rgba(63, 58, 55, 0.92)',
          color: '#FDFAF6',
          borderRadius: '16px',
          fontSize: '14px',
          fontFamily: 'var(--font-inter), sans-serif',
          textAlign: 'center',
          boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
          pointerEvents: 'none',
        }}>
          Don&apos;t forget to tag @lilleapp 🤍
        </div>
      )}
    </div>
  );
}