'use client';

import { ReactNode } from 'react';
import { PERSONVERN_URL, VILKAR_URL } from '../../lib/consent';
import { farger } from '../../lib/farger';

type Props = {
  template: string;
  termsLabel: string;
  privacyLabel: string;
};

const linkStyle: React.CSSProperties = {
  color: farger.grønn,
  fontWeight: 600,
  textDecoration: 'underline',
  textUnderlineOffset: 2,
};

function åpne(url: string) {
  window.open(url, '_blank', 'noopener,noreferrer');
}

/** Renders consent.terms with {terms}/{privacy} as links — order follows the locale string. */
export function ConsentLabel({ template, termsLabel, privacyLabel }: Props) {
  const parts = template.split(/(\{terms\}|\{privacy\})/g);

  const nodes: ReactNode[] = parts.map((part, i) => {
    if (part === '{terms}') {
      return (
        <a
          key={i}
          href={VILKAR_URL}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            åpne(VILKAR_URL);
          }}
          style={linkStyle}
        >
          {termsLabel}
        </a>
      );
    }
    if (part === '{privacy}') {
      return (
        <a
          key={i}
          href={PERSONVERN_URL}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            åpne(PERSONVERN_URL);
          }}
          style={linkStyle}
        >
          {privacyLabel}
        </a>
      );
    }
    return <span key={i}>{part}</span>;
  });

  return <span style={{ lineHeight: 1.45 }}>{nodes}</span>;
}
