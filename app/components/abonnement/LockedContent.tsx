'use client';

import { ReactNode, CSSProperties } from 'react';
import { farger } from '../../lib/farger';
import { usePro } from './ProContext';

type Props = {
  children: ReactNode;
  /** Optional readable title shown above the blur (e.g. insight card heading). */
  tittel?: string;
  style?: CSSProperties;
  /** When true, always show unlocked (override). */
  ulåst?: boolean;
};

export function LockedContent({ children, tittel, style, ulåst }: Props) {
  const { hasPro, openPaywall } = usePro();

  if (hasPro || ulåst) {
    return <div style={style}>{children}</div>;
  }

  return (
    <button
      type="button"
      onClick={openPaywall}
      style={{
        ...style,
        display: 'block',
        width: '100%',
        padding: 0,
        border: 'none',
        background: 'none',
        cursor: 'pointer',
        textAlign: 'left',
        position: 'relative',
        borderRadius: 16,
        overflow: 'hidden',
      }}
    >
      {tittel && (
        <div
          style={{
            fontSize: '13px',
            fontFamily: 'var(--font-plus-jakarta)',
            fontWeight: 700,
            color: farger.tekst,
            marginBottom: 8,
            padding: '0 2px',
          }}
        >
          {tittel}
        </div>
      )}
      <div
        style={{
          position: 'relative',
          borderRadius: 16,
          overflow: 'hidden',
        }}
      >
        <div
          aria-hidden
          style={{
            filter: 'blur(7px)',
            opacity: 0.5,
            pointerEvents: 'none',
            userSelect: 'none',
            transform: 'scale(1.02)',
          }}
        >
          {children}
        </div>
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(180deg, rgba(248,243,238,0.15), rgba(248,243,238,0.45))',
          }}
        >
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: '50%',
              backgroundColor: 'rgba(255,255,255,0.92)',
              border: `1px solid ${farger.kremMørk}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 14px rgba(0,0,0,0.08)',
              fontSize: 20,
            }}
          >
            🔒
          </div>
        </div>
      </div>
    </button>
  );
}

export function LockBadge({ synlig }: { synlig: boolean }) {
  if (!synlig) return null;
  return (
    <span
      aria-hidden
      style={{
        position: 'absolute',
        top: -2,
        right: '50%',
        transform: 'translateX(14px)',
        fontSize: 9,
        lineHeight: 1,
      }}
    >
      🔒
    </span>
  );
}
