'use client';

export default function SlettKonto() {
    return (
      <div style={{ maxWidth: '700px', margin: '0 auto', padding: '40px 24px', fontFamily: 'sans-serif', lineHeight: 1.7, color: '#3F3A37' }}>
        <h1 style={{ fontSize: '28px', marginBottom: '8px' }}>Slett konto</h1>
        <p style={{ color: '#7B746D', marginBottom: '32px' }}>Lille – babyregistreringsappen</p>
  
        <p>Hvis du ønsker å slette kontoen din og alle tilhørende data, send en e-post til:</p>
        <p style={{ fontSize: '18px', fontWeight: 'bold', color: '#2D5C45' }}>isabellafjellet@gmail.com</p>
  
        <p>Skriv «Slett konto» i emnefeltet og oppgi e-postadressen du brukte til å registrere deg.</p>
  
        <h2 style={{ fontSize: '20px', marginTop: '32px' }}>Hva som slettes</h2>
        <ul>
          <li>Brukerkonto og innloggingsinformasjon</li>
          <li>Alle registreringer (søvn, amming, bleier, signaler)</li>
          <li>Babyprofil og bilde</li>
          <li>Alle personlige innsikter</li>
        </ul>
  
        <h2 style={{ fontSize: '20px', marginTop: '32px' }}>Tidsramme</h2>
        <p>Kontoen og alle data slettes innen 30 dager etter mottak av forespørselen.</p>
  
        <h2 style={{ fontSize: '20px', marginTop: '32px' }}>Kontakt</h2>
        <p>Isabella Figved<br/>E-post: isabellafjellet@gmail.com</p>
      </div>
    );
  }
