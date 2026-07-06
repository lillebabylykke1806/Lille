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

type Props = {
  onSuccess: () => void;
  onClose?: () => void;
  required?: boolean;
};

export default function Paywall({ onSuccess, onClose, required = false }: Props) {
  const { t } = useLanguage();
  const [priser, setPriser] = useState<{ monthly?: string; yearly?: string }>({});
  const [laster, setLaster] = useState<'monthly' | 'yearly' | 'restore' | null>(null);
  const [feil, setFeil] = useState('');
  const [suksess, setSuksess] = useState('');

  useEffect(() => {
    getOfferingPrices().then(setPriser);
  }, []);

  const handleMonthly = async () => {
    setFeil('');
    setSuksess('');
    setLaster('monthly');
    const result = await purchaseMonthly();
    setLaster(null);
    if (result.success) {
      setSuksess(t('paywall.kjøpFullført'));
      setTimeout(onSuccess, 800);
    } else if (!result.cancelled) {
      setFeil(result.error || t('paywall.kjøpFeilet'));
    }
  };

  const handleYearly = async () => {
    setFeil('');
    setSuksess('');
    setLaster('yearly');
    const result = await purchaseYearly();
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

        <div style={{ textAlign: 'center', marginBottom: 32 }}>
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
            {t('paywall.tittel')}
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

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
          <button
            onClick={handleYearly}
            disabled={laster !== null}
            style={{
              width: '100%',
              padding: '18px 20px',
              backgroundColor: PAYWALL_GRØNN,
              color: '#FDFAF6',
              border: 'none',
              borderRadius: 16,
              cursor: laster ? 'not-allowed' : 'pointer',
              opacity: laster && laster !== 'yearly' ? 0.6 : 1,
              textAlign: 'left',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.06em', opacity: 0.85, marginBottom: 4 }}>
                  {t('paywall.bestVerdi')}
                </div>
                <div style={{ fontSize: '17px', fontWeight: 700 }}>{t('paywall.årlig')}</div>
                <div style={{ fontSize: '13px', fontFamily: 'var(--font-inter)', opacity: 0.9, marginTop: 2 }}>
                  {t('paywall.årligUndertekst')}
                </div>
              </div>
              <div style={{ fontSize: '18px', fontWeight: 700 }}>
                {laster === 'yearly' ? '...' : priser.yearly || t('paywall.årligPris')}
              </div>
            </div>
          </button>

          <button
            onClick={handleMonthly}
            disabled={laster !== null}
            style={{
              width: '100%',
              padding: '18px 20px',
              backgroundColor: farger.hvit,
              color: farger.tekst,
              border: `1px solid ${farger.kremMørk}`,
              borderRadius: 16,
              cursor: laster ? 'not-allowed' : 'pointer',
              opacity: laster && laster !== 'monthly' ? 0.6 : 1,
              textAlign: 'left',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '17px', fontWeight: 700 }}>{t('paywall.månedlig')}</div>
                <div style={{ fontSize: '13px', fontFamily: 'var(--font-inter)', color: farger.tekstLys, marginTop: 2 }}>
                  {t('paywall.månedligUndertekst')}
                </div>
              </div>
              <div style={{ fontSize: '18px', fontWeight: 700, color: PAYWALL_GRØNN }}>
                {laster === 'monthly' ? '...' : priser.monthly || t('paywall.månedligPris')}
              </div>
            </div>
          </button>
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
            marginTop: 16,
            fontFamily: 'var(--font-inter)',
          }}
        >
          {t('paywall.vilkår')}
        </p>
      </div>
    </div>
  );
}
