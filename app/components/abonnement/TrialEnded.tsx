'use client';

import { useEffect, useState } from 'react';
import { farger } from '../../lib/farger';
import { useLanguage } from '../../lib/i18n/LanguageContext';
import { supabase } from '../../lib/supabase';
import { hentProfilId } from '../../lib/profilId';

type Props = {
  bruker: { id: string };
  onAbonner: () => void;
  onLukk: () => void;
};

export default function TrialEnded({ bruker, onAbonner, onLukk }: Props) {
  const { t } = useLanguage();
  const [oppsummering, setOppsummering] = useState('');

  useEffect(() => {
    const last = async () => {
      const profilId = await hentProfilId(null, bruker);
      if (!profilId) {
        setOppsummering(t('trialEnded.oppsummeringTom'));
        return;
      }
      const [{ count: lurer }, { count: amming }] = await Promise.all([
        supabase.from('lurer').select('*', { count: 'exact', head: true }).eq('profil_id', profilId),
        supabase.from('amming').select('*', { count: 'exact', head: true }).eq('profil_id', profilId),
      ]);
      const nLur = lurer ?? 0;
      const nAmming = amming ?? 0;
      if (nLur === 0 && nAmming === 0) {
        setOppsummering(t('trialEnded.oppsummeringTom'));
      } else {
        setOppsummering(t('trialEnded.oppsummering', { lurer: nLur, amming: nAmming }));
      }
    };
    void last();
  }, [bruker, t]);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 600,
        backgroundColor: 'rgba(63,58,55,0.45)',
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 430,
          backgroundColor: farger.hvit,
          borderRadius: '24px 24px 0 0',
          padding: '28px 24px 40px',
          fontFamily: 'var(--font-inter), sans-serif',
        }}
      >
        <div style={{ width: 36, height: 4, backgroundColor: farger.kremMørk, borderRadius: 2, margin: '0 auto 20px' }} />
        <h2
          style={{
            fontSize: 22,
            fontFamily: 'var(--font-plus-jakarta)',
            fontWeight: 700,
            color: farger.tekst,
            margin: '0 0 12px',
            textAlign: 'center',
          }}
        >
          {t('trialEnded.tittel')}
        </h2>
        <p style={{ fontSize: 14, color: farger.tekstLys, lineHeight: 1.55, margin: '0 0 12px', textAlign: 'center' }}>
          {oppsummering || t('felles.laster')}
        </p>
        <p style={{ fontSize: 14, color: farger.tekst, lineHeight: 1.55, margin: '0 0 24px', textAlign: 'center', fontWeight: 500 }}>
          {t('trialEnded.gratisSøvn')}
        </p>
        <button
          type="button"
          onClick={onAbonner}
          style={{
            width: '100%',
            padding: 16,
            backgroundColor: farger.grønn,
            color: '#FDFAF6',
            border: 'none',
            borderRadius: 14,
            fontSize: 15,
            fontWeight: 700,
            cursor: 'pointer',
            marginBottom: 10,
            fontFamily: 'var(--font-plus-jakarta)',
          }}
        >
          {t('trialEnded.abonner')}
        </button>
        <button
          type="button"
          onClick={onLukk}
          style={{
            width: '100%',
            padding: 14,
            background: 'none',
            border: 'none',
            color: farger.tekstLys,
            fontSize: 14,
            cursor: 'pointer',
          }}
        >
          {t('trialEnded.fortsettGratis')}
        </button>
      </div>
    </div>
  );
}
