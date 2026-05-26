'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Bekreftelse() {
  const router = useRouter();

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
        Velkommen til Lille!
      </h1>
      <p style={{ fontSize: '15px', color: '#8A7060', fontFamily: 'var(--font-inter), sans-serif', lineHeight: 1.7, margin: 0 }}>
        Din 7 dagers gratis prøveperiode er nå aktivert.<br />
        Du sendes til appen om et øyeblikk...
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