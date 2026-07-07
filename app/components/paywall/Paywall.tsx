'use client';

import { useEffect, useState } from 'react';
import { farger } from '../../lib/farger';
import {
  getOfferingPrices,
  purchaseMonthly,
  purchaseYearly,
  restorePurchases,
} from '../../lib/revenuecat';
import { useLanguage } from '../../lib/i18n/LanguageContext';

const PAYWALL_GRØNN = '#3D6B4F';
const PAYWALL_BAKGRUNN = '#F5F0EA';
const FALLBACK_MÅNEDLIG = 'NOK 99';
const FALLBACK_ÅRLIG = 'NOK 799';

type Plan = 'monthly' | 'yearly';

type Props = {
  onSuccess: () => void;
  onClose?: () => void;
  required?: boolean;
};

export default function Paywall({ onSuccess, onClose, required = false }: Props) {
  const { t } = useLanguage();
  const [priser, setPriser] = useState<{ monthly?: string; yearly?: string }>({});
  const [valgtPlan, setValgtPlan] = useState<Plan>('yearly');
  const [laster, setLaster] = useState<'kjøp' | 'restore' | null>(null);
  const [feil, setFeil] = useState('');
  const [suksess, setSuksess] = useState('');

  useEffect(() => {
    getOfferingPrices().then(setPriser);
  }, []);

  const månedligPris = priser.monthly || FALLBACK_MÅNEDLIG;
  const årligPris = priser.yearly || FALLBACK_ÅRLIG;

  const handleStartTrial = async () => {
    setFeil('');
    setSuksess('');
    setLaster('kjøp');
    const result = valgtPlan === 'yearly' ? await purchaseYearly() : await purchaseMonthly();
    setLaster(null);
    if (result.success) {
      setSuksess(t('paywall.kjøpFullført'));
      setTimeout(onSuccess, 800);
    } else if (!result.cancelled) {
      setFeil(result.error || t('paywall.kjøpFeilet'));
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
              {valgt && <span style={{ color: '#FDFAF6', fontSize: 13, lineHeight: 1 }}>✓</span>}
            </div>
            <div style={{ fontSize: '16px', fontWeight: 700, color: farger.tekst }}>{tittel}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '17px', fontWeight: 700, color: valgt ? PAYWALL_GRØNN : farger.tekst }}>
              {pris}
              <span style={{ fontSize: '13px', fontWeight: 500 }}>{periode}</span>
            </div>
            <div style={{ fontSize: '11px', color: farger.tekstLys, fontFamily: 'var(--font-inter), sans-serif', marginTop: 2 }}>
              {t('paywall.etterPrøve')}
            </div>
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
          padding: '48px 24px 40px',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {!required && onClose && (
          <button
            onClick={onClose}
            style={{
              alignSelf: 'flex-start',
              background: 'none',
              border: 'none',
              color: farger.tekstLys,
              fontSize: '24px',
              cursor: 'pointer',
              marginBottom: 8,
              padding: 0,
            }}
          >
            ‹
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

        <p
          style={{
            fontSize: '12px',
            color: farger.tekstLys,
            textAlign: 'center',
            lineHeight: 1.5,
            marginTop: 12,
            fontFamily: 'var(--font-inter), sans-serif',
          }}
        >
          {t('paywall.avbrytNårSomHelst')}
        </p>

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
            marginTop: 'auto',
          }}
        >
          {laster === 'restore' ? t('paywall.gjenoppretter') : t('paywall.gjenopprettKjøp')}
        </button>

        <p
          style={{
            fontSize: '11px',
            color: farger.tekstLys,
            textAlign: 'center',
            lineHeight: 1.5,
            marginTop: 8,
            fontFamily: 'var(--font-inter)',
          }}
        >
          {t('paywall.vilkår')}
        </p>
      </div>
    </div>
  );
}
