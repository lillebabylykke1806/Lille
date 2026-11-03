'use client';

import { farger } from '../lib/farger';

export function EpostSkall(props: {
  title: string;
  lang: 'no' | 'en';
  children: React.ReactNode;
}) {
  return (
    <div
      lang={props.lang}
      style={{
        backgroundColor: farger.bakgrunn,
        minHeight: '100vh',
        fontFamily: 'var(--font-inter), sans-serif',
        color: farger.tekst,
      }}
    >
      <div style={{ maxWidth: 430, margin: '0 auto', padding: '48px 24px' }}>
        <p
          style={{
            margin: '0 0 8px',
            fontSize: 13,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: farger.grønn,
            fontFamily: 'var(--font-plus-jakarta), sans-serif',
            fontWeight: 700,
          }}
        >
          Lille
        </p>
        <h1 style={{ fontFamily: 'var(--font-plus-jakarta), sans-serif', fontSize: 24, margin: '0 0 16px' }}>
          {props.title}
        </h1>
        <div
          style={{
            background: farger.hvit,
            border: `1px solid ${farger.kremMørk}`,
            borderRadius: 16,
            padding: 24,
            lineHeight: 1.65,
            fontSize: 16,
          }}
        >
          {props.children}
        </div>
      </div>
    </div>
  );
}

export function EpostKnapp(props: { label: string; disabled?: boolean }) {
  return (
    <button
      type="submit"
      disabled={props.disabled}
      style={{
        display: 'block',
        width: '100%',
        background: farger.grønn,
        color: farger.hvit,
        border: 'none',
        borderRadius: 999,
        padding: '14px 20px',
        fontWeight: 600,
        fontSize: 15,
        cursor: props.disabled ? 'default' : 'pointer',
        fontFamily: 'var(--font-plus-jakarta), sans-serif',
      }}
    >
      {props.label}
    </button>
  );
}
