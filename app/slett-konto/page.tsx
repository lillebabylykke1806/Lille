'use client';

export default function SlettKonto() {
    return (
      <div style={{ maxWidth: '700px', margin: '0 auto', padding: '40px 24px', fontFamily: 'sans-serif', lineHeight: 1.7, color: '#3F3A37' }}>
        <h1 style={{ fontSize: '28px', marginBottom: '8px' }}>Delete account</h1>
        <p style={{ color: '#7B746D', marginBottom: '32px' }}>Lille – baby tracking app</p>
  
        <p>If you want to delete your account and all associated data, send an email to:</p>
        <p style={{ fontSize: '18px', fontWeight: 'bold', color: '#2D5C45' }}>isabellafjellet@gmail.com</p>
  
        <p>Write &quot;Delete account&quot; in the subject line and include the email address you used to sign up.</p>
  
        <h2 style={{ fontSize: '20px', marginTop: '32px' }}>What gets deleted</h2>
        <ul>
          <li>User account and login information</li>
          <li>All entries (sleep, feeding, diapers, signals)</li>
          <li>Baby profile and photo</li>
          <li>All personal insights</li>
        </ul>
  
        <h2 style={{ fontSize: '20px', marginTop: '32px' }}>Timeline</h2>
        <p>Your account and all data will be deleted within 30 days of receiving your request.</p>
  
        <h2 style={{ fontSize: '20px', marginTop: '32px' }}>Contact</h2>
        <p>Isabella Figved<br/>Email: isabellafjellet@gmail.com</p>
      </div>
    );
  }
