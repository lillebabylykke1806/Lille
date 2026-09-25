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
import TrialEnded from './components/abonnement/TrialEnded';
import { ProProvider } from './components/abonnement/ProContext';
import { LockBadge } from './components/abonnement/LockedContent';
import { useLanguage } from './lib/i18n/LanguageContext';
import { formatDate } from './lib/i18n/format';
import { isNativeApp } from './lib/subscription';
import { syncRevenueCatUser } from './lib/revenuecat';
import { requestNotificationPermissionIfNeeded } from './lib/notifications';
import { watchScreenshots } from './lib/screenshot';
import { sikreProfilerRad } from './lib/profilId';
import { erAlleredeRegistrert } from './lib/authSignup';
import { lagreSamtykkeVedRegistrering } from './lib/consent';
import { ConsentCheckboxes } from './components/consent/ConsentCheckboxes';
import { sideKreverPro } from './lib/gratisFunksjoner';
import {
  getSubscriptionAccess,
  markFirstPaywallPending,
  consumeFirstPaywallPending,
  shouldShowDailyPaywall,
  markPaywallShownToday,
  hasSeenTrialEnded,
  markTrialEndedSeen,
  readLastKnownPro,
  type ProPeriod,
} from './lib/abonnementAccess';

export default function Home() {
  const { t, locale } = useLanguage();
  const [aktivSide, setAktivSide] = useState('hjem');
  const [bruker, setBruker] = useState<any>(null);
  const [laster, setLaster] = useState(true);
  const [epost, setEpost] = useState('');
  const [passord, setPassord] = useState('');
  const [erNyBruker, setErNyBruker] = useState(false);
  const [innloggingFeil, setInnloggingFeil] = useState('');
  const [alleredeKonto, setAlleredeKonto] = useState(false);
  const [godtarVilkår, setGodtarVilkår] = useState(false);
  const [markedsforing, setMarkedsforing] = useState(false);
  const [resetMelding, setResetMelding] = useState('');
  const [senderReset, setSenderReset] = useState(false);
  const [loggerInn, setLoggerInn] = useState(false);
  const [visRegistrer, setVisRegistrer] = useState(false);
  const [visOnboarding, setVisOnboarding] = useState(false);
  const [visGlemtPopup, setVisGlemtPopup] = useState(false);
  const [åpneEtterregistrer, setÅpneEtterregistrer] = useState(false);
const [åpneMorgen, setÅpneMorgen] = useState(false);
  const [aktivtBarn, setAktivtBarn] = useState<any>(null);
  const [innsiktStartFane, setInnsiktStartFane] = useState<'språk' | 'innsikt'>('språk');
  const [harAbonnement, setHarAbonnement] = useState<boolean | null>(null);
  const [proPeriod, setProPeriod] = useState<ProPeriod>(null);
  const [proExpiresAt, setProExpiresAt] = useState<string | null>(null);
  const [needsRestore, setNeedsRestore] = useState(false);
  const [visPaywall, setVisPaywall] = useState(false);
  const [visTrialEnded, setVisTrialEnded] = useState(false);
  const [visScreenshotToast, setVisScreenshotToast] = useState(false);
  const [gjenoppretter, setGjenoppretter] = useState(false);
  // True only for the register flow, so onboarding is shown after the paywall.
  const [isNyBruker, setIsNyBruker] = useState(false);

  const openPaywall = () => {
    setVisPaywall(true);
    markPaywallShownToday();
  };

  const lukkPaywallTilGratis = async () => {
    setVisPaywall(false);
    markPaywallShownToday();
    if (isNyBruker && bruker?.id) {
      const { data: barn } = await supabase
        .from('barn')
        .select('id')
        .eq('bruker_id', bruker.id)
        .limit(1)
        .maybeSingle();
      const trenger = await trengerOnboarding(bruker.id, !!barn);
      if (trenger) setVisOnboarding(true);
    }
  };

  const anvendAccess = (access: Awaited<ReturnType<typeof getSubscriptionAccess>>) => {
    setHarAbonnement(access.hasPro);
    setProPeriod(access.periodType);
    setProExpiresAt(access.expiresAt);
    setNeedsRestore(!!access.needsRestore);
    if (access.hasPro) {
      setVisTrialEnded(false);
      setNeedsRestore(false);
    } else if (!access.uncertain && access.hadExpiredTrial && !hasSeenTrialEnded()) {
      setVisTrialEnded(true);
    }
  };

  const gjenopprettKjøp = async () => {
    if (!bruker || gjenoppretter) return;
    setGjenoppretter(true);
    try {
      if (isNativeApp()) {
        const { restorePurchases } = await import('./lib/revenuecat');
        await restorePurchases();
      }
      const access = await getSubscriptionAccess(bruker.email || '', bruker.id);
      anvendAccess(access);
      if (!access.hasPro) openPaywall();
    } finally {
      setGjenoppretter(false);
    }
  };

  // Onboarding completion is tracked in the "profiler" table (column: onboarding_fullført).
  // The column name contains a non-ASCII character, so we bypass the typed query parser.
  const hentOnboardingFullført = async (userId: string): Promise<boolean | null> => {
    try {
      const { data, error } = await (supabase.from('profiler') as any)
        .select('onboarding_fullført')
        .eq('id', userId)
        .single();
      if (error) return null;
      return data?.onboarding_fullført ?? false;
    } catch {
      return null;
    }
  };

  const markerOnboardingFullført = async (userId: string): Promise<void> => {
    try {
      await (supabase.from('profiler') as any)
        .upsert({ id: userId, onboarding_fullført: true }, { onConflict: 'id' });
    } catch {
      // Column/table may be missing; don't block the flow.
    }
  };

  /** Decide whether onboarding is needed. Users with an existing baby profile are
   * considered onboarded (and the flag is backfilled). */
  const trengerOnboarding = async (userId: string, harBarn: boolean): Promise<boolean> => {
    if (harBarn) {
      const fullført = await hentOnboardingFullført(userId);
      if (fullført === false) await markerOnboardingFullført(userId);
      return false;
    }
    const fullført = await hentOnboardingFullført(userId);
    return fullført !== true;
  };

  /** Keep the user logged in in free mode; optionally show dismissible paywall. */
  const håndterManglendeAbonnement = async (user: { id: string; email?: string | null }) => {
    setBruker(user);
    void sikreProfilerRad(user.id);
    setHarAbonnement(false);
    setProPeriod(null);
    setProExpiresAt(null);
    if (isNativeApp()) void syncRevenueCatUser(user.id, user.email);
    setVisPaywall(true);
    markPaywallShownToday();
  };

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
          // Seed last-known so a slow/offline check never flashes locks at a payer.
          const lastKnown = readLastKnownPro(session.user.id);
          if (lastKnown !== null) setHarAbonnement(lastKnown);

          const access = await getSubscriptionAccess(
            session.user.email || '',
            session.user.id,
          );
          anvendAccess(access);
          if (!access.hasPro && !access.uncertain && !access.needsRestore) {
            const førstegang = consumeFirstPaywallPending();
            if (førstegang || shouldShowDailyPaywall()) {
              setVisPaywall(true);
              markPaywallShownToday();
            }
          }
        } else {
          setHarAbonnement(true);
        }
      
        setBruker(session.user);
        void sikreProfilerRad(session.user.id);
        if (isNativeApp()) void syncRevenueCatUser(session.user.id, session.user.email);
      
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
              const trenger = await trengerOnboarding(session.user.id, false);
              if (trenger) {
                setIsNyBruker(true);
                setVisOnboarding(true);
              }
            }
          } else {
            setAktivtBarn(barn);
            await trengerOnboarding(session.user.id, true);
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

  const glemtPassord = async () => {
    if (!epost.trim()) {
      setResetMelding('');
      setInnloggingFeil(t('innlogging.skrivEpostForReset'));
      return;
    }
    setSenderReset(true);
    setInnloggingFeil('');
    setResetMelding('');
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(epost.trim(), {
        redirectTo: `${window.location.origin}/tilbakestill-passord`,
      });
      if (error) {
        setInnloggingFeil(error.message || t('innlogging.noeGikkGalt'));
        return;
      }
      setResetMelding(t('innlogging.resetSendt'));
    } catch (e) {
      const melding = e instanceof Error ? e.message : '';
      setInnloggingFeil(melding || t('innlogging.noeGikkGalt'));
    } finally {
      setSenderReset(false);
    }
  };

  const gåTilInnlogging = () => {
    setAlleredeKonto(false);
    setInnloggingFeil('');
    setResetMelding('');
    setErNyBruker(false);
    setIsNyBruker(false);
  };

  const loggInn = async () => {
    if (loggerInn) return;
    setInnloggingFeil('');
    setAlleredeKonto(false);
    setLoggerInn(true);
    // Login = existing user, not the register flow.
    setIsNyBruker(false);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email: epost, password: passord });
      if (error) {
        const melding = error.message?.toLowerCase() ?? '';
        const feilPassord =
          error.code === 'invalid_credentials' ||
          melding.includes('invalid login credentials') ||
          melding.includes('invalid credentials');
        setInnloggingFeil(feilPassord ? t('innlogging.feilEpostPassord') : (error.message || t('innlogging.noeGikkGalt')));
        return;
      }
      localStorage.removeItem('lille_babybilde');
      const lastKnown = readLastKnownPro(data.user.id);
      if (lastKnown !== null) setHarAbonnement(lastKnown);
      const access = await getSubscriptionAccess(data.user.email || '', data.user.id);
      anvendAccess(access);

      // No Pro → free mode. Uncertain/needsRestore stays in app with restore CTA — never unlock.
      if (!access.hasPro) {
        setBruker(data.user);
        void sikreProfilerRad(data.user.id);
        if (isNativeApp()) void syncRevenueCatUser(data.user.id, data.user.email);
        if (!access.uncertain && !access.needsRestore) {
          setVisPaywall(true);
          markPaywallShownToday();
        }
        return;
      }

      // Active subscription → home. Only show onboarding if the account is genuinely
      // incomplete (no baby profile yet), never for established users.
      const { data: barn } = await supabase
        .from('barn')
        .select('id')
        .eq('bruker_id', data.user.id)
        .limit(1)
        .maybeSingle();
      const trenger = await trengerOnboarding(data.user.id, !!barn);
      if (trenger) {
        setIsNyBruker(true);
        setVisOnboarding(true);
      }
      setBruker(data.user);
      void sikreProfilerRad(data.user.id);
      if (isNativeApp()) void syncRevenueCatUser(data.user.id, data.user.email);
    } catch {
      setInnloggingFeil(t('innlogging.noeGikkGalt'));
    } finally {
      setLoggerInn(false);
    }
  };

  const registrer = async () => {
    if (loggerInn) return;
    if (!godtarVilkår) {
      setInnloggingFeil(t('consent.required'));
      return;
    }
    setInnloggingFeil('');
    setAlleredeKonto(false);
    setLoggerInn(true);
    // Register = new user: paywall → onboarding → home.
    setIsNyBruker(true);
    try {
      const { data, error } = await supabase.auth.signUp({ email: epost, password: passord });

      if (erAlleredeRegistrert(error, data?.user)) {
        setAlleredeKonto(true);
        return;
      }

      if (error) {
        setInnloggingFeil(error.message || t('innlogging.noeGikkGalt'));
        return;
      }
      if (!data.user) return;
      await lagreSamtykkeVedRegistrering(data.user.id, markedsforing, epost);
      markFirstPaywallPending();
      setBruker(data.user);
      setHarAbonnement(false);
      setProPeriod(null);
      setProExpiresAt(null);
      setVisPaywall(true);
      markPaywallShownToday();
      if (isNativeApp()) void syncRevenueCatUser(data.user.id, data.user.email);
    } catch (e) {
      const melding = e instanceof Error ? e.message : '';
      setInnloggingFeil(melding || t('innlogging.noeGikkGalt'));
    } finally {
      setLoggerInn(false);
    }
  };

  const loggUt = async () => {
    await supabase.auth.signOut();
    setBruker(null);
    setAktivtBarn(null);
  };

  // Keep spinner until access is known (or last-known seeded) so locks never flash.
  if (laster || (bruker && harAbonnement === null)) {
    return (
      <div style={{ backgroundColor: farger.bakgrunn, minHeight: '100vh', maxWidth: '430px', margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '24px' }}>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <img src="/leep.png" alt="Lille" style={{ width: '180px', height: 'auto', mixBlendMode: 'multiply' }} />
        <div style={{ width: '28px', height: '28px', border: `2px solid ${farger.grønn}`, borderTop: '2px solid transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
      </div>
    );
  }

  // 1. Not logged in → always show the login/register screen first.
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
          <input type="password" value={passord} onChange={(e) => setPassord(e.target.value)} placeholder={t('innlogging.passordPlaceholder')} style={{ width: '100%', padding: '12px 14px', fontSize: '15px', border: `1px solid ${farger.kremMørk}`, borderRadius: '10px', backgroundColor: farger.bakgrunn, color: farger.tekst, marginBottom: !erNyBruker ? '8px' : '20px', outline: 'none', fontFamily: 'var(--font-inter), sans-serif', boxSizing: 'border-box' }} />
          {!erNyBruker && (
            <button
              type="button"
              onClick={glemtPassord}
              disabled={senderReset}
              style={{ display: 'block', width: '100%', marginBottom: '16px', padding: '0', background: 'none', border: 'none', fontSize: '13px', color: farger.terrakotta, cursor: senderReset ? 'default' : 'pointer', fontFamily: 'var(--font-inter), sans-serif', textAlign: 'right', opacity: senderReset ? 0.7 : 1 }}
            >
              {senderReset ? '…' : t('innlogging.glemtPassord')}
            </button>
          )}
          {resetMelding && <p style={{ fontSize: '13px', color: farger.grønn, fontFamily: 'var(--font-inter), sans-serif', margin: '0 0 14px', textAlign: 'center', lineHeight: 1.5 }}>{resetMelding}</p>}
          {alleredeKonto && (
            <div style={{ margin: '0 0 16px', padding: '14px', backgroundColor: '#FDF6F0', borderRadius: '12px', border: `1px solid ${farger.kremMørk}`, textAlign: 'center' }}>
              <p style={{ fontSize: '15px', fontWeight: 600, color: farger.tekst, fontFamily: 'var(--font-inter), sans-serif', margin: '0 0 4px' }}>{t('innlogging.alleredeKontoTittel')}</p>
              <p style={{ fontSize: '13px', color: farger.tekstLys, fontFamily: 'var(--font-inter), sans-serif', margin: '0 0 14px' }}>{t('innlogging.alleredeKontoTekst')}</p>
              <button
                type="button"
                onClick={gåTilInnlogging}
                style={{ width: '100%', padding: '12px', backgroundColor: farger.grønn, border: 'none', borderRadius: '10px', fontSize: '13px', fontWeight: 600, color: '#FDFAF6', cursor: 'pointer', fontFamily: 'var(--font-inter), sans-serif', marginBottom: '10px' }}
              >
                {t('innlogging.gåTilInnlogging')}
              </button>
              <button
                type="button"
                onClick={glemtPassord}
                disabled={senderReset}
                style={{ display: 'block', width: '100%', padding: 0, background: 'none', border: 'none', fontSize: '13px', color: farger.terrakotta, cursor: senderReset ? 'default' : 'pointer', fontFamily: 'var(--font-inter), sans-serif', opacity: senderReset ? 0.7 : 1 }}
              >
                {senderReset ? '…' : t('innlogging.glemtPassord')}
              </button>
            </div>
          )}
          {innloggingFeil && <p style={{ fontSize: '13px', color: '#C0392B', fontFamily: 'var(--font-inter), sans-serif', margin: '0 0 14px', textAlign: 'center' }}>{innloggingFeil}</p>}
          {erNyBruker && (
            <ConsentCheckboxes
              godtarVilkår={godtarVilkår}
              markedsforing={markedsforing}
              onGodtarVilkår={setGodtarVilkår}
              onMarkedsforing={setMarkedsforing}
            />
          )}
          <button
            onClick={erNyBruker ? registrer : loggInn}
            disabled={loggerInn || (erNyBruker && !godtarVilkår)}
            style={{
              width: '100%',
              padding: '14px',
              backgroundColor: farger.grønn,
              border: 'none',
              borderRadius: '10px',
              fontSize: '12px',
              fontWeight: '600',
              color: '#FDFAF6',
              cursor: loggerInn || (erNyBruker && !godtarVilkår) ? 'default' : 'pointer',
              opacity: loggerInn || (erNyBruker && !godtarVilkår) ? 0.5 : 1,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              fontFamily: 'var(--font-inter), sans-serif',
              marginBottom: '12px',
            }}
          >
            {loggerInn ? '…' : (erNyBruker ? t('innlogging.opprettKonto') : t('innlogging.loggInn'))}
          </button>
          <button onClick={() => { setErNyBruker(!erNyBruker); setInnloggingFeil(''); setResetMelding(''); setAlleredeKonto(false); setGodtarVilkår(false); setMarkedsforing(false); }} style={{ width: '100%', padding: '12px', backgroundColor: 'transparent', border: `1px solid ${farger.kremMørk}`, borderRadius: '10px', fontSize: '12px', color: farger.tekstLys, cursor: 'pointer', fontFamily: 'var(--font-inter), sans-serif' }}>
            {erNyBruker ? t('innlogging.harAlleredeKonto') : t('innlogging.nyBruker')}
          </button>
        </div>
      </div>
    );
  }

  // 2. Freemium: paywall is an overlay (never blocks entering the app).
  // 3. New user without baby → onboarding (also in free mode).
  if (visOnboarding) return <Onboarding bruker={bruker} onFerdig={async () => {
    if (bruker?.id) await markerOnboardingFullført(bruker.id);
    const { data: barn } = await supabase.from('barn').select('*').eq('bruker_id', bruker.id).order('opprettet', { ascending: true }).limit(1).single();
    if (barn) setAktivtBarn(barn);
    setVisOnboarding(false);
    setIsNyBruker(false);
  }} />;

  // null = still resolving: treat as unlocked (spinner above). false = free with locks.
  const hasPro = harAbonnement !== false;

  const navigerTil = (side: string, fane?: string) => {
    if (sideKreverPro(side) && !hasPro) {
      openPaywall();
      return;
    }
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
    else if (fane) setInnsiktStartFane('språk');
  };

  // 4. Logged in → app shell (Pro or free).
  return (
    <ProProvider
      value={{
        hasPro,
        periodType: proPeriod,
        expiresAt: proExpiresAt,
        needsRestore,
        openPaywall,
      }}
    >
    <div style={{ backgroundColor: farger.bakgrunn, minHeight: '100vh', maxWidth: '430px', margin: '0 auto', fontFamily: 'var(--font-plus-jakarta), sans-serif', position: 'relative' }}>
      <div style={{ overflowY: 'auto', height: '100vh', paddingBottom: '90px' }}>
      {needsRestore && !hasPro && (
        <div style={{ margin: '12px 24px 0', padding: '14px 16px', backgroundColor: farger.hvit, border: `1px solid ${farger.kremMørk}`, borderRadius: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <p style={{ margin: 0, fontSize: 13, fontFamily: 'var(--font-inter)', color: farger.tekst, lineHeight: 1.5 }}>
            {t('pro.gjenopprettHint')}
          </p>
          <button
            type="button"
            onClick={() => void gjenopprettKjøp()}
            disabled={gjenoppretter}
            style={{ alignSelf: 'flex-start', padding: '10px 14px', border: 'none', borderRadius: 10, backgroundColor: farger.grønn, color: '#FDFAF6', fontSize: 13, fontWeight: 600, fontFamily: 'var(--font-inter)', cursor: gjenoppretter ? 'default' : 'pointer', opacity: gjenoppretter ? 0.7 : 1 }}
          >
            {gjenoppretter ? t('paywall.gjenoppretter') : t('paywall.gjenopprettKjøp')}
          </button>
        </div>
      )}
      {hasPro && proPeriod === 'trial' && proExpiresAt && (
        <div style={{ margin: '12px 24px 0', padding: '10px 14px', backgroundColor: farger.grønnLys, border: `1px solid ${farger.grønn}`, borderRadius: 12, fontSize: 12, fontFamily: 'var(--font-inter)', color: farger.grønn, textAlign: 'center' }}>
          {t('pro.prøveTil', { dato: formatDate(proExpiresAt, locale, { day: 'numeric', month: 'short', year: 'numeric' }) })}
        </div>
      )}
      {aktivSide === 'hjem' && <Hjemskjerm bruker={bruker} aktivtBarn={aktivtBarn} onNavigate={navigerTil} onByttBarn={setAktivtBarn} />}
      {aktivSide === 'sovn' && <Sovn bruker={bruker} aktivtBarn={aktivtBarn} åpneEtterregistrer={åpneEtterregistrer} åpneMorgen={åpneMorgen} onNavigate={(s) => navigerTil(s)} onNavigasjonKonsumert={() => { setÅpneMorgen(false); setÅpneEtterregistrer(false); }} />}
        {aktivSide === 'bleie' && hasPro && <Bleie bruker={bruker} />}
        {aktivSide === 'amming' && hasPro && <Amming bruker={bruker} />}
        {aktivSide === 'innsikt' && hasPro && <Innsikt bruker={bruker} aktivtBarn={aktivtBarn} onNavigate={(s) => navigerTil(s)} startFane={innsiktStartFane} />}
        {aktivSide === 'medisin' && hasPro && <Medisin bruker={bruker} />}
        {aktivSide === 'notat' && hasPro && <Notat bruker={bruker} />}
        {aktivSide === 'vekt' && hasPro && <Vekt bruker={bruker} aktivtBarn={aktivtBarn} />}
        {aktivSide === 'aktivitet' && hasPro && <Aktivitet bruker={bruker} />}
        {aktivSide === 'signaler' && hasPro && <Signaler bruker={bruker} aktivtBarn={aktivtBarn} onNavigate={(s) => navigerTil(s)} />}
        {aktivSide === 'kolikk' && hasPro && <Kolikk bruker={bruker} aktivtBarn={aktivtBarn} />}
        {aktivSide === 'mat' && hasPro && <Mat bruker={bruker} aktivtBarn={aktivtBarn} />}
        {aktivSide === 'profil' && <Profil bruker={bruker} onLoggUt={loggUt} aktivtBarn={aktivtBarn} onByttBarn={setAktivtBarn} onVisPaywall={openPaywall} />}
        {aktivSide === 'pumping' && hasPro && <Pumping bruker={bruker} />}
        {aktivSide === 'temperatur' && hasPro && <Temperatur bruker={bruker} aktivtBarn={aktivtBarn} onNavigate={(s) => navigerTil(s)} />}
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

        <button onClick={() => navigerTil('innsikt')} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', border: 'none', background: 'transparent', cursor: 'pointer', padding: '6px 0', position: 'relative' }}>
          <div style={{ position: 'relative' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <rect x="3" y="12" width="4" height="9" rx="1" fill={aktivSide === 'innsikt' ? farger.grønn : farger.kremMørk}/>
              <rect x="10" y="7" width="4" height="14" rx="1" fill={aktivSide === 'innsikt' ? farger.grønn : farger.kremMørk}/>
              <rect x="17" y="3" width="4" height="18" rx="1" fill={aktivSide === 'innsikt' ? farger.grønn : farger.kremMørk}/>
            </svg>
            <LockBadge synlig={!hasPro} />
          </div>
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
    onNavigate={(side) => navigerTil(side)}
    onLukk={() => setVisRegistrer(false)}
  />
)}

      {visPaywall && bruker && (
        <Paywall
          email={bruker.email}
          userId={bruker.id}
          onSuccess={async () => {
            setHarAbonnement(true);
            setNeedsRestore(false);
            setVisPaywall(false);
            setVisTrialEnded(false);
            const access = await getSubscriptionAccess(bruker.email || '', bruker.id);
            anvendAccess(access);
            if (isNyBruker) setVisOnboarding(true);
          }}
          onAuthenticated={async (user) => {
            // Existing account from paywall: enter app if Pro — never send to checkout.
            setIsNyBruker(false);
            localStorage.removeItem('lille_babybilde');
            const lastKnown = readLastKnownPro(user.id);
            if (lastKnown !== null) setHarAbonnement(lastKnown);
            const access = await getSubscriptionAccess(user.email || '', user.id);
            anvendAccess(access);
            setBruker(user);
            void sikreProfilerRad(user.id);
            if (isNativeApp()) void syncRevenueCatUser(user.id, user.email);

            if (access.hasPro) {
              setVisPaywall(false);
              setVisTrialEnded(false);
              const { data: barn } = await supabase
                .from('barn')
                .select('*')
                .eq('bruker_id', user.id)
                .order('opprettet', { ascending: true })
                .limit(1)
                .maybeSingle();
              if (barn) {
                setAktivtBarn(barn);
                await trengerOnboarding(user.id, true);
              } else {
                const { data: tilgang } = await supabase
                  .from('barn_tilgang')
                  .select('barn_id, barn(*)')
                  .eq('bruker_id', user.id);
                if (tilgang && tilgang.length > 0 && tilgang[0].barn) {
                  setAktivtBarn(tilgang[0].barn);
                } else {
                  const trenger = await trengerOnboarding(user.id, false);
                  if (trenger) {
                    setIsNyBruker(true);
                    setVisOnboarding(true);
                  }
                }
              }
              return;
            }
            // No Pro: stay on paywall as this user (props update via bruker).
          }}
          onClose={lukkPaywallTilGratis}
        />
      )}

      {visTrialEnded && bruker && !hasPro && (
        <TrialEnded
          bruker={bruker}
          onAbonner={() => {
            markTrialEndedSeen();
            setVisTrialEnded(false);
            openPaywall();
          }}
          onLukk={() => {
            markTrialEndedSeen();
            setVisTrialEnded(false);
          }}
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
    </ProProvider>
  );
}