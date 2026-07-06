'use client';

export default function Personvern() {
    return (
      <>
        <button onClick={() => window.history.back()} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'none', border: 'none', cursor: 'pointer', padding: '16px 24px', fontSize: '15px', fontFamily: 'var(--font-inter)', color: '#2D5C45' }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M15 18L9 12L15 6" stroke="#2D5C45" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Back
        </button>
      <div style={{ maxWidth: '700px', margin: '0 auto', padding: '40px 24px', fontFamily: 'sans-serif', lineHeight: 1.7, color: '#3F3A37' }}>
        <h1 style={{ fontSize: '28px', marginBottom: '8px' }}>Privacy Policy for Lille</h1>
        <p style={{ color: '#7B746D', marginBottom: '32px' }}>Last updated: June 11, 2026</p>
  
        <h2 style={{ fontSize: '20px', marginTop: '32px' }}>What we collect</h2>
        <p>Lille collects information you log in the app, including sleep, feeding, diapers, signals and other daily activities for your baby. We also collect your email address for sign-in.</p>
  
        <h2 style={{ fontSize: '20px', marginTop: '32px' }}>How we use your data</h2>
        <p>Your data is used solely to give you personal insights and an overview of your baby&apos;s development. We do not share your data with third parties.</p>
  
        <h2 style={{ fontSize: '20px', marginTop: '32px' }}>Data storage</h2>
        <p>All data is stored securely in Supabase, a European cloud service. Data is deleted when you delete your account.</p>
  
        <h2 style={{ fontSize: '20px', marginTop: '32px' }}>AI analysis</h2>
        <p>The app uses Anthropic Claude to generate personal insights. Data sent to the AI service is not used to train models.</p>
  
        <h2 style={{ fontSize: '20px', marginTop: '32px' }}>Your rights</h2>
        <p>You have the right to request access to, correction of, or deletion of your personal data. Contact us at isabellafjellet@gmail.com.</p>
  
        <h2 style={{ fontSize: '20px', marginTop: '32px' }}>Contact</h2>
        <p>Isabella Figved<br/>Email: isabellafjellet@gmail.com</p>
      </div>
      </>
    );
  }
