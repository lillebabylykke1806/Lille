'use client';

import type { ReactNode } from 'react';
import { farger } from '../../lib/farger';
import { useLanguage } from '../../lib/i18n/LanguageContext';
import { ConsentLabel } from './ConsentLabel';

type Props = {
  godtarVilkår: boolean;
  markedsforing: boolean;
  onGodtarVilkår: (v: boolean) => void;
  onMarkedsforing: (v: boolean) => void;
};

export function ConsentCheckboxes({
  godtarVilkår,
  markedsforing,
  onGodtarVilkår,
  onMarkedsforing,
}: Props) {
  const { t } = useLanguage();

  const rad = (checked: boolean, onChange: (v: boolean) => void, label: ReactNode) => (
    <label
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '10px',
        marginBottom: '12px',
        cursor: 'pointer',
        fontFamily: 'var(--font-inter), sans-serif',
        fontSize: '13px',
        color: farger.tekst,
        lineHeight: 1.45,
      }}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        style={{ marginTop: '3px', width: '16px', height: '16px', flexShrink: 0, accentColor: farger.grønn }}
      />
      <span style={{ flex: 1, minWidth: 0 }}>{label}</span>
    </label>
  );

  return (
    <div style={{ marginBottom: '4px' }}>
      {rad(
        godtarVilkår,
        onGodtarVilkår,
        <ConsentLabel
          template={t('consent.terms')}
          termsLabel={t('consent.terms.link')}
          privacyLabel={t('consent.privacy.link')}
        />,
      )}
      {rad(markedsforing, onMarkedsforing, t('consent.marketing'))}
    </div>
  );
}
