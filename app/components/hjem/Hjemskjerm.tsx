'use client';
import { farger } from '../../lib/farger';
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

type Props = {
  bruker: any;
  onNavigate: (side: string) => void;
};

const tidspunkt = () => {
  const h = new Date().getHours();
  if (h < 12) return 'God morgen';
  if (h < 18) return 'God ettermiddag';
  return 'God kveld';
};

const BlomstIllustrasjon = () => (
  <svg width="52" height="52" viewBox="0 0 52 52" fill="none">
    <ellipse cx="26" cy="14" rx="5" ry="9" fill="#EBC8B4" opacity="0.7" transform="rotate(0 26 26)"/>
    <ellipse cx="26" cy="14" rx="5" ry="9" fill="#EBC8B4" opacity="0.6" transform="rotate(45 26 26)"/>
    <ellipse cx="26" cy="14" rx="5" ry="9" fill="#EBC8B4" opacity="0.5" transform="rotate(90 26 26)"/>
    <ellipse cx="26" cy="14" rx="5" ry="9" fill="#EBC8B4" opacity="0.6" transform="rotate(135 26 26)"/>
    <ellipse cx="26" cy="14" rx="5" ry="9" fill="#F7D5C5" opacity="0.5" transform="rotate(180 26 26)"/>
    <ellipse cx="26" cy="14" rx="5" ry="9" fill="#F7D5C5" opacity="0.4" transform="rotate(225 26 26)"/>
    <ellipse cx="26" cy="14" rx="5" ry="9" fill="#EBC8B4" opacity="0.5" transform="rotate(270 26 26)"/>
    <ellipse cx="26" cy="14" rx="5" ry="9" fill="#EBC8B4" opacity="0.6" transform="rotate(315 26 26)"/>
    <circle cx="26" cy="26" r="7" fill="#C48E7B" opacity="0.85"/>
    <circle cx="26" cy="26" r="4" fill="#EBC8B4" opacity="0.9"/>
    <path d="M26 38 Q30 42 28 46 Q24 42 26 38Z" fill="#A8B5A2" opacity="0.7"/>
    <path d="M26 38 Q22 43 24 46 Q28 42 26 38Z" fill="#A8B5A2" opacity="0.5"/>
  </svg>
);

export default function Hjemskjerm({ bruker, onNavigate }: Props) {
  const [babyNavn, setBabyNavn] = useState('');
  const [babyTilstand, setBabyTilstand] = useState('rolig');
  const [babyBilde, setBabyBilde] = useState<string | null>(null);
  const [dagensFlyt, setDagensFlyt] = useState<any[]>([]);

  useEffect(() => {
    const lastProfil = async () => {
      const { data: profil } = await supabase
        .from('profiler')
        .select('*')
        .eq('id', bruker.id)
        .single();
      if (profil?.baby_navn) setBabyNavn(profil.baby_navn);
      const lagretBilde = localStorage.getItem('lille_babybilde');
      if (lagretBilde) setBabyBilde(lagretBilde);
    };
    lastProfil();
  }, [bruker]);

  const tilstandConfig: Record<string, { tekst: string; undertekst: string; farge: string; blobFarge: string }> = {
    rolig: {
      tekst: 'Rolig og våken',
      undertekst: 'Klar for lek og samspill',
      farge: '#A8B5A2',
      blobFarge: 'radial-gradient(ellipse at 40% 40%, #D6E5DF 0%, #EBC8B4 60%, #F7F3EC 100%)',
    },
    trøtt: {
      tekst: 'Virker trøtt',
      undertekst: 'Kanskje tid for en lur snart?',
      farge: '#C7BDD8',
      blobFarge: 'radial-gradient(ellipse at 40% 40%, #C7BDD8 0%, #DCCFC0 60%, #F7F3EC 100%)',
    },
    urolig: {
      tekst: 'Litt urolig',
      undertekst: 'Trenger ro og regulering',
      farge: '#C48E7B',
      blobFarge: 'radial-gradient(ellipse at 40% 40%, #EBC8B4 0%, #DCCFC0 50%, #F7F3EC 100%)',
    },
    sover: {
      tekst: 'Sover nå',
      undertekst: 'Hvil deg du også 🌙',
      farge: '#A8B5A2',
      blobFarge: 'radial-gradient(ellipse at 40% 40%, #D6E5DF 0%, #C7BDD8 55%, #F7F3EC 100%)',
    },
  };

  const valgtTilstand = tilstandConfig[babyTilstand] || tilstandConfig.rolig;

  const aiInnsikt: Record<string, string> = {
    rolig: 'Baby virker rolig og mottakelig nå ✦',
    trøtt: 'Baby viser trøtthetstegn – kanskje start nedtrapping?',
    urolig: 'Baby virker litt overstimulert i dag',
    sover: 'Baby sover – bruk tiden til å hvile 🌙',
  };

  const tilstandLabels: Record<string, string> = {
    rolig: 'Rolig',
    trøtt: 'Trøtt',
    urolig: 'Urolig',
    sover: 'Sover',
  };

  const snarveier = [
    {
      label: 'Søvn', side: 'sovn',
      svg: (
        <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
          <path d="M22 15C21.2 19 17.5 22 13 22C8 22 4 18 4 13C4 8.5 7.2 4.8 11.5 4C9 6.8 9 11.5 12 14.5C15 17.5 19.5 17.5 22 15Z" fill="#A8B5A2" opacity="0.85"/>
          <circle cx="20" cy="6" r="1.2" fill="#A8B5A2" opacity="0.4"/>
          <circle cx="23" cy="10" r="0.8" fill="#A8B5A2" opacity="0.3"/>
        </svg>
      ),
    },
    {
      label: 'Amming', side: 'amming',
      svg: (
        <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
          <rect x="8" y="13" width="12" height="11" rx="3.5" stroke="#A8B5A2" strokeWidth="1.6" fill="none"/>
          <path d="M10 13V11.5C10 9.8 11 9 12 9H16C17 9 18 9.8 18 11.5V13" stroke="#A8B5A2" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
          <path d="M13 9C13 9 13 7.5 14 6.5C15 7.5 15 9 15 9" stroke="#A8B5A2" strokeWidth="1.3" strokeLinecap="round"/>
        </svg>
      ),
    },
    {
      label: 'Signal & uro', side: 'kolikk',
      svg: (
        <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
          <path d="M14 23C14 23 4 17 4 10.5C4 7.5 6.7 5 10 5C11.8 5 13.2 5.9 14 7.2C14.8 5.9 16.2 5 18 5C21.3 5 24 7.5 24 10.5C24 17 14 23 14 23Z" fill="none" stroke="#A8B5A2" strokeWidth="1.7" strokeLinejoin="round"/>
        </svg>
      ),
    },
  ];

  return (
    <div style={{ backgroundColor: '#F7F3EC', minHeight: '100vh', overflowX: 'hidden' }}>

      {/* Header */}
      <div style={{ padding: '20px 24px 0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{
              fontSize: '22px',
              fontFamily: 'var(--font-plus-jakarta), sans-serif',
              fontWeight: 600,
              color: '#3F3A37',
              marginBottom: '2px',
              letterSpacing: '-0.3px',
            }}>
              {tidspunkt()}{babyNavn ? `, ${babyNavn}` : ''} ✨
            </div>
            <div style={{
              fontSize: '13px',
              fontFamily: 'var(--font-inter), sans-serif',
              color: '#7B746D',
            }}>
              {valgtTilstand.tekst}
            </div>
          </div>
          <button style={{
            background: 'rgba(255,255,255,0.7)',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(220,207,192,0.5)',
            borderRadius: '50%',
            width: '40px',
            height: '40px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: '0 2px 12px rgba(0,0,0,0.05)',
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M18 8C18 6.4087 17.3679 4.88258 16.2426 3.75736C15.1174 2.63214 13.5913 2 12 2C10.4087 2 8.88258 2.63214 7.75736 3.75736C6.63214 4.88258 6 6.4087 6 8C6 15 3 17 3 17H21C21 17 18 15 18 8Z" fill="#7B746D" opacity="0.7"/>
              <path d="M13.73 21C13.5542 21.3031 13.3019 21.5547 12.9982 21.7295C12.6946 21.9044 12.3504 21.9965 12 21.9965C11.6496 21.9965 11.3054 21.9044 11.0018 21.7295C10.6982 21.5547 10.4458 21.3031 10.27 21" stroke="#7B746D" strokeWidth="1.8" strokeLinecap="round" opacity="0.7"/>
            </svg>
          </button>
        </div>
      </div>

      {/* AI Innsikt-kort */}
      <div style={{ padding: '16px 24px 0' }}>
        <div style={{
          background: 'rgba(255,255,255,0.75)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(235,200,180,0.4)',
          borderRadius: '20px',
          padding: '14px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
        }}>
          <div style={{ flex: 1 }}>
            <div style={{
              fontSize: '13.5px',
              fontFamily: 'var(--font-inter), sans-serif',
              color: '#3F3A37',
              lineHeight: '1.4',
              marginBottom: '6px',
            }}>
              {aiInnsikt[babyTilstand]}
            </div>
            <button
              onClick={() => onNavigate('innsikt')}
              style={{
                background: 'none',
                border: 'none',
                padding: 0,
                cursor: 'pointer',
                fontSize: '12px',
                fontFamily: 'var(--font-inter), sans-serif',
                color: '#A8B5A2',
                fontWeight: 500,
                display: 'flex',
                alignItems: 'center',
                gap: '3px',
              }}>
              Se innsikt
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M4 2.5L7.5 6L4 9.5" stroke="#A8B5A2" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
          <div style={{ marginLeft: '12px', flexShrink: 0 }}>
            <BlomstIllustrasjon />
          </div>
        </div>
      </div>

   {/* Stor blob med babybilde */}
<div style={{ position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '480px' }}>

{/* Lag 1 - ytterst, fersken */}
<div style={{
  position: 'absolute',
  width: '320px',
  height: '300px',
  background: 'radial-gradient(ellipse, #EBC8B4 0%, transparent 70%)',
  borderRadius: '62% 38% 54% 46% / 55% 48% 52% 45%',
  opacity: 0.5,
  filter: 'blur(18px)',
  transform: 'translate(30px, -20px)',
}} />

{/* Lag 2 - grønn, litt rotert */}
<div style={{
  position: 'absolute',
  width: '300px',
  height: '290px',
  background: 'radial-gradient(ellipse, #A8B5A2 0%, transparent 70%)',
  borderRadius: '45% 55% 38% 62% / 52% 60% 40% 48%',
  opacity: 0.45,
  filter: 'blur(16px)',
  transform: 'translate(-25px, 15px)',
}} />

{/* Lag 3 - kjerne, varmere */}
<div style={{
  position: 'absolute',
  width: '260px',
  height: '260px',
  background: 'radial-gradient(ellipse at 50% 50%, #DCCFC0 0%, #C8D5C2 40%, transparent 75%)',
  borderRadius: '55% 45% 62% 38% / 48% 55% 45% 52%',
  opacity: 0.7,
  filter: 'blur(8px)',
}} />

{/* Lag 4 - glitter/stjerner */}
<div style={{
  position: 'absolute',
  width: '220px',
  height: '220px',
  background: 'radial-gradient(ellipse at 40% 60%, rgba(255,255,255,0.4) 0%, transparent 60%)',
  borderRadius: '50%',
  filter: 'blur(4px)',
}} />

{/* Innhold */}
<div style={{
  position: 'relative',
  zIndex: 2,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '12px',
}}>
  {babyBilde ? (
    <div style={{
      width: '130px',
      height: '130px',
      borderRadius: '50%',
      overflow: 'hidden',
      border: '3px solid rgba(255,255,255,0.9)',
      boxShadow: '0 8px 30px rgba(0,0,0,0.10)',
    }}>
      <img src={babyBilde} alt="baby" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
    </div>
  ) : (
    <div style={{
      width: '90px',
      height: '90px',
      borderRadius: '50%',
      background: 'rgba(255,255,255,0.6)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      border: '2px solid rgba(255,255,255,0.8)',
    }}>
      <img src="/baby-ansikt.png" alt="baby" style={{ width: '64px', height: '64px', objectFit: 'contain', mixBlendMode: 'multiply' }} />
    </div>
  )}
  <div style={{ textAlign: 'center' }}>
    <div style={{
      fontSize: '17px',
      fontFamily: 'var(--font-plus-jakarta), sans-serif',
      fontWeight: 600,
      color: '#3F3A37',
      marginBottom: '4px',
    }}>
      {valgtTilstand.tekst}
    </div>
    <div style={{
      fontSize: '12.5px',
      fontFamily: 'var(--font-inter), sans-serif',
      color: '#7B746D',
    }}>
      {valgtTilstand.undertekst}
    </div>
  </div>
</div>
</div>

      {/* Tilstandsvelger */}
      <div style={{ display: 'flex', gap: '8px', padding: '0 24px 16px', overflowX: 'auto' }}>
        {Object.entries(tilstandConfig).map(([key, val]) => (
          <button
            key={key}
            onClick={() => setBabyTilstand(key)}
            style={{
              flexShrink: 0,
              padding: '9px 18px',
              borderRadius: '24px',
              border: babyTilstand === key
                ? `1.5px solid ${val.farge}`
                : '1.5px solid rgba(220,207,192,0.6)',
              backgroundColor: babyTilstand === key
                ? `${val.farge}22`
                : 'rgba(255,255,255,0.6)',
              color: babyTilstand === key ? val.farge : '#7B746D',
              fontSize: '12.5px',
              fontFamily: 'var(--font-inter), sans-serif',
              cursor: 'pointer',
              fontWeight: babyTilstand === key ? 600 : 400,
              transition: 'all 0.3s ease',
            }}
          >
            {tilstandLabels[key]}
          </button>
        ))}
      </div>

      {/* Snarveier */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', padding: '0 24px', marginBottom: '28px' }}>
        {snarveier.map(item => (
          <button
            key={item.side}
            onClick={() => onNavigate(item.side)}
            style={{
              padding: '18px 8px 14px',
              background: 'rgba(255,255,255,0.75)',
              border: '1px solid rgba(220,207,192,0.4)',
              borderRadius: '20px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '8px',
              cursor: 'pointer',
              boxShadow: '0 4px 16px rgba(0,0,0,0.04)',
              transition: 'all 0.3s ease',
            }}
          >
            {item.svg}
            <span style={{
              fontSize: '11px',
              fontFamily: 'var(--font-inter), sans-serif',
              color: '#7B746D',
            }}>
              {item.label}
            </span>
          </button>
        ))}
      </div>

      {/* Dagens flyt */}
      <div style={{ padding: '0 24px 32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <div style={{
            fontSize: '16px',
            fontFamily: 'var(--font-plus-jakarta), sans-serif',
            fontWeight: 600,
            color: '#3F3A37',
          }}>
            Dagens flyt
          </div>
          <button style={{
            fontSize: '12px',
            fontFamily: 'var(--font-inter), sans-serif',
            color: '#A8B5A2',
            background: 'rgba(168,181,162,0.12)',
            border: '1px solid rgba(168,181,162,0.3)',
            padding: '5px 14px',
            borderRadius: '20px',
            cursor: 'pointer',
            fontWeight: 500,
          }}>
            Se dagbok
          </button>
        </div>
        {dagensFlyt.length === 0 ? (
          <div style={{
            background: 'rgba(255,255,255,0.6)',
            border: '1px solid rgba(220,207,192,0.35)',
            borderRadius: '20px',
            padding: '28px 24px',
            textAlign: 'center',
          }}>
            <div style={{
              fontSize: '14px',
              fontStyle: 'italic',
              color: '#7B746D',
              fontFamily: 'var(--font-plus-jakarta), sans-serif',
              marginBottom: '6px',
            }}>
              Ingen registreringer ennå i dag
            </div>
            <div style={{
              fontSize: '12px',
              fontFamily: 'var(--font-inter), sans-serif',
              color: '#A8B5A2',
            }}>
              Trykk + for å begynne
            </div>
          </div>
        ) : (
          <div style={{
            background: 'rgba(255,255,255,0.6)',
            border: '1px solid rgba(220,207,192,0.35)',
            borderRadius: '20px',
            overflow: 'hidden',
          }}>
            {dagensFlyt.map((item: any, i) => (
              <div key={i} style={{
                padding: '14px 18px',
                borderBottom: i < dagensFlyt.length - 1 ? '1px solid rgba(220,207,192,0.3)' : 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
              }}>
                <div style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: '#A8B5A2', flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <span style={{ fontSize: '12px', fontFamily: 'var(--font-inter), sans-serif', color: '#7B746D', marginRight: '8px' }}>{item.tid}</span>
                  <span style={{ fontSize: '14px', fontFamily: 'var(--font-inter), sans-serif', color: '#3F3A37' }}>{item.tekst}</span>
                </div>
                {item.varighet && <span style={{ fontSize: '12px', color: '#7B746D' }}>{item.varighet}</span>}
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}