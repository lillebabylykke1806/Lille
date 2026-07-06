'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '../lib/i18n/LanguageContext';

export default function Bekreftelse() {
  const router = useRouter();
  const { t } = useLanguage();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.push('/');
    }, 4000);
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div style={{
      backgroundColor: '#F5EFE6',
      minHeight: '100vh',
      maxWidth: '430px',
      margin: '0 auto',
      fontFamily: 'var(--font-plus-jakarta), sans-serif',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 24px',
      textAlign: 'center',
      gap: '20px',
    }}>
      <div style={{ fontSize: '48px' }}>🌿</div>
      <h1 style={{ fontSize: '26px', fontStyle: 'italic', color: '#B05A2F', margin: 0 }}>
        {t('bekreftelse.tittel')}
      </h1>
      <p style={{ fontSize: '15px', color: '#8A7060', fontFamily: 'var(--font-inter), sans-serif', lineHeight: 1.7, margin: 0 }}>
        {t('bekreftelse.prøveperiode')}<br />
        {t('bekreftelse.redirect')}
      </p>
      <div style={{
        width: '28px', height: '28px',
        border: '2px solid #2D5C45',
        borderTop: '2px solid transparent',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite',
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
