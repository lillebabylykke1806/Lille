'use client';

import { useEffect, useState } from 'react';
import { farger } from '../../lib/farger';
import {
  getOfferingPrices,
  purchaseMonthly,
  purchaseYearly,
  restorePurchases,
  isNativeApp,
} from '../../lib/revenuecat';
import { useLanguage } from '../../lib/i18n/LanguageContext';
import { OversettelseNøkkel } from '../../lib/i18n/translations';
import { supabase } from '../../lib/supabase';
import { getSubscriptionAccess } from '../../lib/abonnementAccess';

const PAYWALL_GRØNN = '#3D6B4F';
const PAYWALL_BAKGRUNN = '#F5F0EA';
const FALLBACK_MÅNEDLIG = 'NOK 99';
const FALLBACK_ÅRLIG = 'NOK 799';
const PERSONVERN_URL = 'https://lilleapp.no/personvern';
const EULA_URL = 'https://lilleapp.no/vilkar';

type Plan = 'monthly' | 'yearly';

type Props = {
  onSuccess: () => void;
  onClose?: () => void;
  /** @deprecated Freemium: paywall is always dismissible when onClose is set. */
  required?: boolean;
  email?: string | null;
  userId?: string | null;
  /** Called after email/password login. Parent must update session and open app if Pro. */
  onAuthenticated: (user: { id: string; email?: string | null }) => Promise<void>;
};

const FAQ: { q: OversettelseNøkkel; a: OversettelseNøkkel }[] = [
  { q: 'paywall.faq1q', a: 'paywall.faq1a' },
  { q: 'paywall.faq2q', a: 'paywall.faq2a' },
  { q: 'paywall.faq3q', a: 'paywall.faq3a' },
  { q: 'paywall.faq4q', a: 'paywall.faq4a' },
];

export default function Paywall({ onSuccess, onClose, email, userId, onAuthenticated }: Props) {
  const { t, locale } = useLanguage();
  const [priser, setPriser] = useState<{ monthly?: string; yearly?: string }>({});
  const [valgtPlan, setValgtPlan] = useState<Plan>('yearly');
  const [laster, setLaster] = useState<'kjøp' | 'restore' | 'login' | 'reset' | null>(null);
  const [feil, setFeil] = useState('');
  const [suksess, setSuksess] = useState('');
  const [åpenFaq, setÅpenFaq] = useState<number | null>(null);
  const [visInnlogging, setVisInnlogging] = useState(false);
  const [loginEpost, setLoginEpost] = useState(email || '');
  const [loginPassord, setLoginPassord] = useState('');
  const [resetMelding, setResetMelding] = useState('');

  useEffect(() => {
    if (isNativeApp()) getOfferingPrices().then(setPriser);
  }, []);

  useEffect(() => {
    if (email && !visInnlogging) setLoginEpost(email);
  }, [email, visInnlogging]);

  const månedligPris = priser.monthly || FALLBACK_MÅNEDLIG;
  const årligPris = priser.yearly || FALLBACK_ÅRLIG;
  const prisEtterPrøve = valgtPlan === 'yearly' ? årligPris : månedligPris;

  const startStripeCheckout = async (checkoutEmail: string, checkoutUserId: string) => {
    const res = await fetch('/api/create-checkout-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: checkoutEmail, userId: checkoutUserId, locale }),
    });
    const { url } = await res.json();
    if (url) window.location.href = url;
    else setFeil(t('paywall.kjøpFeilet'));
  };

  /** Never open checkout/IAP if the user already has Pro. */
  const harAlleredeTilgang = async (checkEmail?: string | null, checkUserId?: string | null) => {
    const access = await getSubscriptionAccess(checkEmail || '', checkUserId || undefined);
    return access.hasPro;
  };

  const handleStartTrial = async () => {
    setFeil('');
    setSuksess('');
    setLaster('kjøp');
    try {
      if (await harAlleredeTilgang(email, userId)) {
        onSuccess();
        return;
      }
      if (!isNativeApp()) {
        await startStripeCheckout(email || '', userId || '');
        return;
      }
      const result = valgtPlan === 'yearly' ? await purchaseYearly() : await purchaseMonthly();
      if (result.success) {
        setSuksess(t('paywall.kjøpFullført'));
        setTimeout(onSuccess, 800);
      } else if (!result.cancelled) {
        setFeil(result.error || t('paywall.kjøpFeilet'));
      }
    } catch {
      setFeil(t('paywall.kjøpFeilet'));
    } finally {
      setLaster(null);
    }
  };

  const handleLoggInn = async () => {
    if (laster) return;
    setFeil('');
    setResetMelding('');
    setSuksess('');
    setLaster('login');
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: loginEpost.trim(),
        password: loginPassord,
      });
      if (error) {
        const melding = error.message?.toLowerCase() ?? '';
        const feilPassord =
          error.code === 'invalid_credentials' ||
          melding.includes('invalid login credentials') ||
          melding.includes('invalid credentials');
        setFeil(feilPassord ? t('innlogging.feilEpostPassord') : (error.message || t('innlogging.noeGikkGalt')));
        return;
      }
      if (!data.user) {
        setFeil(t('innlogging.noeGikkGalt'));
        return;
      }
      await onAuthenticated(data.user);
    } catch {
      setFeil(t('innlogging.noeGikkGalt'));
    } finally {
      setLaster(null);
    }
  };

  const handleGlemtPassord = async () => {
    if (!loginEpost.trim()) {
      setResetMelding('');
      setFeil(t('innlogging.skrivEpostForReset'));
      return;
    }
    setLaster('reset');
    setFeil('');
    setResetMelding('');
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(loginEpost.trim(), {
        redirectTo: `${window.location.origin}/tilbakestill-passord`,
      });
      if (error) {
        setFeil(error.message || t('innlogging.noeGikkGalt'));
        return;
      }
      setResetMelding(t('innlogging.resetSendt'));
    } catch (e) {
      const melding = e instanceof Error ? e.message : '';
      setFeil(melding || t('innlogging.noeGikkGalt'));
    } finally {
      setLaster(null);
    }
  };

  const handleRestore = async () => {
    setFeil('');
    setSuksess('');
    setLaster('restore');
    const result = await restorePurchases();
    setLaster(null);
    if (result.success) {
      setSuksess(t('paywall.gjenopprettet'));
      setTimeout(onSuccess, 800);
    } else {
      setFeil(result.error || t('paywall.ingentingÅGjenopprette'));
    }
  };

  const renderPlan = (plan: Plan) => {
    const valgt = valgtPlan === plan;
    const pris = plan === 'yearly' ? årligPris : månedligPris;
    const periode = plan === 'yearly' ? t('paywall.perÅr') : t('paywall.perMåned');
    const tittel = plan === 'yearly' ? t('paywall.årlig') : t('paywall.månedlig');

    return (
      <button
        type="button"
        onClick={() => setValgtPlan(plan)}
        disabled={laster !== null}
        style={{
          width: '100%',
          padding: '18px 20px',
          backgroundColor: farger.hvit,
          border: `2px solid ${valgt ? PAYWALL_GRØNN : farger.kremMørk}`,
          borderRadius: 16,
          cursor: laster ? 'not-allowed' : 'pointer',
          textAlign: 'left',
          position: 'relative',
          boxShadow: valgt ? '0 6px 20px rgba(61,107,79,0.14)' : 'none',
          transition: 'all 0.2s ease',
        }}
      >
        {plan === 'yearly' && (
          <div
            style={{
              position: 'absolute',
              top: -10,
              right: 16,
              backgroundColor: PAYWALL_GRØNN,
              color: '#FDFAF6',
              fontSize: '10px',
              fontWeight: 700,
              letterSpacing: '0.06em',
              padding: '3px 10px',
              borderRadius: 20,
            }}
          >
            {t('paywall.bestVerdi')}
          </div>
        )}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 22,
                height: 22,
                borderRadius: '50%',
                border: `2px solid ${valgt ? PAYWALL_GRØNN : farger.kremMørk}`,
                backgroundColor: valgt ? PAYWALL_GRØNN : 'transparent',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              {valgt && <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#FDFAF6' }} />}
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15, color: farger.tekst }}>{tittel}</div>
              {plan === 'monthly' && (
                <div style={{ fontSize: 12, color: farger.tekstLys, marginTop: 2 }}>{t('paywall.månedligUndertekst')}</div>
              )}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontWeight: 700, fontSize: 15, color: farger.tekst }}>{pris}</div>
            <div style={{ fontSize: 12, color: farger.tekstLys }}>{periode}</div>
          </div>
        </div>
      </button>
    );
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 500,
        backgroundColor: PAYWALL_BAKGRUNN,
        overflowY: 'auto',
        fontFamily: 'var(--font-plus-jakarta), sans-serif',
      }}
    >
      <div
        style={{
          maxWidth: 430,
          margin: '0 auto',
          minHeight: '100vh',
          padding: '20px 24px 40px',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label={t('felles.lukk')}
            style={{
              alignSelf: 'flex-start',
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: farger.hvit,
              border: `1px solid ${farger.kremMørk}`,
              color: farger.tekst,
              fontSize: 22,
              lineHeight: 1,
              cursor: 'pointer',
              marginBottom: 12,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            ×
          </button>
        )}

        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <img src="/leep.png" alt="Lille" style={{ width: 100, marginBottom: 20, mixBlendMode: 'multiply' }} />
          <h1
            style={{
              fontSize: '1.75rem',
              fontWeight: 700,
              color: farger.tekst,
              margin: '0 0 12px',
              lineHeight: 1.25,
            }}
          >
            {t('paywall.gratisPrøveTittel')}
          </h1>
          <p
            style={{
              fontSize: '15px',
              color: farger.tekstLys,
              lineHeight: 1.65,
              margin: 0,
              fontFamily: 'var(--font-inter), sans-serif',
            }}
          >
            {t('paywall.beskrivelse')}
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 20 }}>
          {renderPlan('yearly')}
          {renderPlan('monthly')}
        </div>

        <ul
          style={{
            listStyle: 'none',
            padding: 0,
            margin: '0 0 24px',
            fontFamily: 'var(--font-inter), sans-serif',
            fontSize: '14px',
            color: farger.tekst,
            lineHeight: 1.8,
          }}
        >
          {[t('paywall.fordel1'), t('paywall.fordel2'), t('paywall.fordel3')].map((tekst) => (
            <li key={tekst} style={{ display: 'flex', gap: 10, marginBottom: 6 }}>
              <span style={{ color: PAYWALL_GRØNN }}>✓</span>
              <span>{tekst}</span>
            </li>
          ))}
        </ul>

        {suksess && (
          <p style={{ color: PAYWALL_GRØNN, fontSize: '14px', textAlign: 'center', fontWeight: 600, marginBottom: 12 }}>
            {suksess}
          </p>
        )}
        {feil && (
          <p style={{ color: '#C0392B', fontSize: '14px', textAlign: 'center', marginBottom: 12, fontFamily: 'var(--font-inter)' }}>
            {feil}
          </p>
        )}

        <button
          onClick={handleStartTrial}
          disabled={laster !== null}
          style={{
            width: '100%',
            padding: '18px',
            backgroundColor: PAYWALL_GRØNN,
            color: '#FDFAF6',
            border: 'none',
            borderRadius: 16,
            fontSize: '16px',
            fontWeight: 700,
            cursor: laster ? 'not-allowed' : 'pointer',
            opacity: laster && laster !== 'kjøp' ? 0.6 : 1,
            fontFamily: 'var(--font-plus-jakarta), sans-serif',
          }}
        >
          {laster === 'kjøp' ? t('paywall.starterPrøve') : t('paywall.startGratisPrøve')}
        </button>

        <div style={{ marginTop: 16, textAlign: 'center' }}>
          {!visInnlogging ? (
            <button
              type="button"
              onClick={() => {
                setVisInnlogging(true);
                setFeil('');
                setResetMelding('');
              }}
              style={{
                background: 'none',
                border: 'none',
                padding: '8px 4px',
                fontSize: '14px',
                fontWeight: 600,
                color: PAYWALL_GRØNN,
                cursor: 'pointer',
                fontFamily: 'var(--font-inter), sans-serif',
                textDecoration: 'underline',
                textUnderlineOffset: 3,
              }}
            >
              {t('paywall.harAlleredeKonto')}
            </button>
          ) : (
            <div
              style={{
                backgroundColor: farger.hvit,
                border: `1px solid ${farger.kremMørk}`,
                borderRadius: 16,
                padding: '16px',
                textAlign: 'left',
              }}
            >
              <div
                style={{
                  fontSize: '14px',
                  fontWeight: 700,
                  color: farger.tekst,
                  marginBottom: 12,
                  fontFamily: 'var(--font-plus-jakarta)',
                }}
              >
                {t('innlogging.loggInn')}
              </div>
              <input
                type="email"
                value={loginEpost}
                onChange={(e) => setLoginEpost(e.target.value)}
                placeholder={t('innlogging.epostPlaceholder')}
                autoComplete="email"
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  fontSize: '15px',
                  border: `1px solid ${farger.kremMørk}`,
                  borderRadius: 10,
                  backgroundColor: farger.bakgrunn,
                  color: farger.tekst,
                  marginBottom: 10,
                  outline: 'none',
                  fontFamily: 'var(--font-inter), sans-serif',
                  boxSizing: 'border-box',
                }}
              />
              <input
                type="password"
                value={loginPassord}
                onChange={(e) => setLoginPassord(e.target.value)}
                placeholder={t('innlogging.passordPlaceholder')}
                autoComplete="current-password"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') void handleLoggInn();
                }}
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  fontSize: '15px',
                  border: `1px solid ${farger.kremMørk}`,
                  borderRadius: 10,
                  backgroundColor: farger.bakgrunn,
                  color: farger.tekst,
                  marginBottom: 8,
                  outline: 'none',
                  fontFamily: 'var(--font-inter), sans-serif',
                  boxSizing: 'border-box',
                }}
              />
              <button
                type="button"
                onClick={handleGlemtPassord}
                disabled={laster !== null}
                style={{
                  display: 'block',
                  width: '100%',
                  marginBottom: 12,
                  padding: 0,
                  background: 'none',
                  border: 'none',
                  fontSize: '13px',
                  color: farger.terrakotta,
                  cursor: laster ? 'default' : 'pointer',
                  fontFamily: 'var(--font-inter), sans-serif',
                  textAlign: 'right',
                  opacity: laster === 'reset' ? 0.7 : 1,
                }}
              >
                {laster === 'reset' ? '…' : t('innlogging.glemtPassord')}
              </button>
              {resetMelding && (
                <p
                  style={{
                    fontSize: '13px',
                    color: PAYWALL_GRØNN,
                    fontFamily: 'var(--font-inter), sans-serif',
                    margin: '0 0 12px',
                    textAlign: 'center',
                    lineHeight: 1.5,
                  }}
                >
                  {resetMelding}
                </p>
              )}
              <button
                type="button"
                onClick={handleLoggInn}
                disabled={laster !== null}
                style={{
                  width: '100%',
                  padding: '14px',
                  backgroundColor: PAYWALL_GRØNN,
                  border: 'none',
                  borderRadius: 12,
                  fontSize: '15px',
                  fontWeight: 700,
                  color: '#FDFAF6',
                  cursor: laster ? 'not-allowed' : 'pointer',
                  opacity: laster && laster !== 'login' ? 0.6 : 1,
                  fontFamily: 'var(--font-plus-jakarta), sans-serif',
                }}
              >
                {laster === 'login' ? '…' : t('innlogging.loggInn')}
              </button>
            </div>
          )}
        </div>

        <p
          style={{
            fontSize: '13px',
            color: farger.tekst,
            textAlign: 'center',
            lineHeight: 1.55,
            marginTop: 12,
            fontFamily: 'var(--font-inter), sans-serif',
            fontWeight: 500,
          }}
        >
          {t('paywall.klarPrisinfo', {
            pris: prisEtterPrøve,
            periode: valgtPlan === 'yearly' ? t('paywall.perÅr') : t('paywall.perMåned'),
          })}
        </p>

        <p
          style={{
            fontSize: '12px',
            color: farger.tekstLys,
            textAlign: 'center',
            lineHeight: 1.5,
            marginTop: 8,
            fontFamily: 'var(--font-inter), sans-serif',
          }}
        >
          {t('paywall.gratisMerke')}
        </p>

        {isNativeApp() && (
          <button
            onClick={handleRestore}
            disabled={laster !== null}
            style={{
              width: '100%',
              padding: '14px',
              backgroundColor: 'transparent',
              border: 'none',
              color: farger.tekstLys,
              fontSize: '14px',
              cursor: laster ? 'not-allowed' : 'pointer',
              fontFamily: 'var(--font-inter)',
              textDecoration: 'underline',
              textUnderlineOffset: 3,
              marginTop: 8,
            }}
          >
            {laster === 'restore' ? t('paywall.gjenoppretter') : t('paywall.gjenopprettKjøp')}
          </button>
        )}

        <div style={{ marginTop: 28 }}>
          <div
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: farger.tekst,
              marginBottom: 10,
              fontFamily: 'var(--font-plus-jakarta)',
            }}
          >
            {t('paywall.faqTittel')}
          </div>
          {FAQ.map((item, i) => {
            const åpen = åpenFaq === i;
            return (
              <div
                key={item.q}
                style={{
                  borderBottom: `1px solid ${farger.kremMørk}`,
                  marginBottom: 4,
                }}
              >
                <button
                  type="button"
                  onClick={() => setÅpenFaq(åpen ? null : i)}
                  style={{
                    width: '100%',
                    display: 'flex',
                    justifyContent: 'space-between',
                    gap: 12,
                    padding: '12px 0',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    textAlign: 'left',
                    fontFamily: 'var(--font-inter)',
                    fontSize: 13,
                    fontWeight: 600,
                    color: farger.tekst,
                  }}
                >
                  <span>{t(item.q)}</span>
                  <span style={{ color: farger.tekstLys }}>{åpen ? '−' : '+'}</span>
                </button>
                {åpen && (
                  <p
                    style={{
                      margin: '0 0 12px',
                      fontSize: 13,
                      lineHeight: 1.55,
                      color: farger.tekstLys,
                      fontFamily: 'var(--font-inter)',
                    }}
                  >
                    {t(item.a)}
                  </p>
                )}
              </div>
            );
          })}
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '8px 16px',
            marginTop: 24,
            fontFamily: 'var(--font-inter), sans-serif',
          }}
        >
          <a
            href={PERSONVERN_URL}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => {
              e.preventDefault();
              window.open(PERSONVERN_URL, '_blank');
            }}
            style={{
              fontSize: '13px',
              fontWeight: 600,
              color: PAYWALL_GRØNN,
              textDecoration: 'underline',
              textUnderlineOffset: 3,
              padding: '6px 2px',
            }}
          >
            {t('paywall.personvernerklæring')}
          </a>
          <span style={{ color: farger.kremMørk, fontSize: '13px' }} aria-hidden>
            ·
          </span>
          <a
            href={EULA_URL}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => {
              e.preventDefault();
              window.open(EULA_URL, '_blank');
            }}
            style={{
              fontSize: '13px',
              fontWeight: 600,
              color: PAYWALL_GRØNN,
              textDecoration: 'underline',
              textUnderlineOffset: 3,
              padding: '6px 2px',
            }}
          >
            {t('paywall.vilkårForBruk')}
          </a>
        </div>
      </div>
    </div>
  );
}
