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

export default function Hjemskjerm({ bruker, onNavigate }: Props) {
  const [babyNavn, setBabyNavn] = useState('');
  const [babyTilstand, setBabyTilstand] = useState('rolig');
  const [dagensFlyt, setDagensFlyt] = useState([]);

  useEffect(() => {
    const lastProfil = async () => {
      const { data: profil } = await supabase
        .from('profiler')
        .select('*')
        .eq('id', bruker.id)
        .single();
      if (profil?.baby_navn) setBabyNavn(profil.baby_navn);
    };
    lastProfil();
  }, [bruker]);

  const tilstandConfig = {
    rolig: { farge1: '#D6E5DF', farge2: '#F2E4D8', tekst: 'Rolig og våken', undertekst: 'Klar for lek og samspill' },
    trøtt: { farge1: '#E8DDD0', farge2: '#D6E5DF', tekst: 'Virker trøtt', undertekst: 'Kanskje tid for en lur snart?' },
    urolig: { farge1: '#F2E4D8', farge2: '#F5C4A8', tekst: 'Litt urolig', undertekst: 'Trenger ro og regulering' },
    sover: { farge1: '#D6E5DF', farge2: '#B8CFC8', tekst: 'Sover nå', undertekst: 'Hvil deg du også 🌙' },
  };

  const valgtTilstand = tilstandConfig[babyTilstand] || tilstandConfig.rolig;

  const snarveier = [
    {
      label: 'Søvn', side: 'sovn',
      svg: (
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
          <path d="M26 17C25.1 21.6 21 25 16 25C10.5 25 6 20.5 6 15C6 10 9.4 5.9 14 5C11 8 11 13.5 14.5 17C18 20.5 23 20.5 26 17Z" fill={farger.grønn} opacity="0.8"/>
          <circle cx="22" cy="8" r="1.5" fill={farger.grønn} opacity="0.4"/>
          <circle cx="26" cy="12" r="1" fill={farger.grønn} opacity="0.3"/>
        </svg>
      ),
    },
    {
        label: 'Amming', side: 'amming',
        svg: (
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
            <rect x="10" y="15" width="12" height="13" rx="3" stroke={farger.grønn} strokeWidth="1.6" fill="none"/>
            <path d="M12 15V13C12 11 13 10 14 10H18C19 10 20 11 20 13V15" stroke={farger.grønn} strokeWidth="1.4" strokeLinecap="round" fill="none"/>
            <path d="M15 10C15 10 15 8.5 16 7.5C17 8.5 17 10 17 10" stroke={farger.grønn} strokeWidth="1.3" strokeLinecap="round"/>
            <line x1="12.5" y1="19" x2="12.5" y2="21" stroke={farger.grønn} strokeWidth="1" opacity="0.5"/>
            <line x1="12.5" y1="22.5" x2="12.5" y2="24.5" stroke={farger.grønn} strokeWidth="1" opacity="0.5"/>
          </svg>
        ),
      },
    {
      label: 'Signal & uro', side: 'kolikk',
      svg: (
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
          <path d="M16 26C16 26 5 19 5 12C5 8.7 7.7 6 11 6C13 6 14.8 7 16 8.5C17.2 7 19 6 21 6C24.3 6 27 8.7 27 12C27 19 16 26 16 26Z" fill="none" stroke={farger.grønn} strokeWidth="1.8" strokeLinejoin="round"/>
        </svg>
      ),
    },
  ];

  return (
    <div>
      {/* Header */}
      <div style={{ padding: '20px 24px 0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: '22px', fontFamily: 'Georgia, serif', color: farger.tekst, marginBottom: '4px' }}>
              {tidspunkt()}{babyNavn ? `, ${babyNavn}` : ''} ✨
            </div>
            <div style={{ fontSize: '13px', fontFamily: 'sans-serif', color: farger.tekstLys }}>
              {valgtTilstand.tekst}
            </div>
          </div>
          <button style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M18 8C18 6.4087 17.3679 4.88258 16.2426 3.75736C15.1174 2.63214 13.5913 2 12 2C10.4087 2 8.88258 2.63214 7.75736 3.75736C6.63214 4.88258 6 6.4087 6 8C6 15 3 17 3 17H21C21 17 18 15 18 8Z" fill={farger.tekstLys} />
              <path d="M13.73 21C13.5542 21.3031 13.3019 21.5547 12.9982 21.7295C12.6946 21.9044 12.3504 21.9965 12 21.9965C11.6496 21.9965 11.3054 21.9044 11.0018 21.7295C10.6982 21.5547 10.4458 21.3031 10.27 21" stroke={farger.tekstLys} strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      </div>

    {/* Boble */}
<div style={{ display: 'flex', justifyContent: 'center', padding: '0 0' }}>
  <div style={{ position: 'relative', width: '100%', height: '320px' }}>
    <img src="/boble.png" alt="boble" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
      <img src="/baby-ansikt.png" alt="baby" style={{ width: '80px', height: '80px', objectFit: 'contain', mixBlendMode: 'multiply' }} />
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '16px', fontFamily: 'Georgia, serif', color: farger.tekst, marginBottom: '4px' }}>{valgtTilstand.tekst}</div>
        <div style={{ fontSize: '12px', fontFamily: 'sans-serif', color: farger.tekstLys }}>{valgtTilstand.undertekst}</div>
      </div>
    </div>
  </div>
</div>

      {/* Tilstandsvelger */}
      <div style={{ display: 'flex', gap: '8px', padding: '0 24px', marginBottom: '24px', overflowX: 'auto' }}>
        {Object.entries(tilstandConfig).map(([key]) => (
          <button key={key} onClick={() => setBabyTilstand(key)} style={{ flexShrink: 0, padding: '8px 14px', borderRadius: '20px', border: babyTilstand === key ? `2px solid ${farger.grønn}` : `1px solid ${farger.kremMørk}`, backgroundColor: babyTilstand === key ? farger.grønnLys : farger.hvit, color: babyTilstand === key ? farger.grønn : farger.tekstLys, fontSize: '12px', fontFamily: 'sans-serif', cursor: 'pointer', fontWeight: babyTilstand === key ? '600' : '400' }}>
            {key.charAt(0).toUpperCase() + key.slice(1)}
          </button>
        ))}
      </div>

      {/* Snarveier */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', padding: '0 24px', marginBottom: '24px' }}>
        {snarveier.map(item => (
          <button key={item.side} onClick={() => onNavigate(item.side)} style={{ padding: '16px 8px', backgroundColor: farger.hvit, border: `1px solid ${farger.kremMørk}`, borderRadius: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
            {item.svg}
            <span style={{ fontSize: '11px', fontFamily: 'sans-serif', color: farger.tekstLys }}>{item.label}</span>
          </button>
        ))}
      </div>

      {/* Dagens flyt */}
      <div style={{ padding: '0 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <div style={{ fontSize: '16px', fontFamily: 'Georgia, serif', color: farger.tekst }}>Dagens flyt</div>
          <button style={{ fontSize: '12px', fontFamily: 'sans-serif', color: farger.grønn, background: 'none', border: `1px solid ${farger.grønnLys}`, padding: '4px 10px', borderRadius: '20px', cursor: 'pointer' }}>Se dagbok</button>
        </div>
        {dagensFlyt.length === 0 ? (
          <div style={{ backgroundColor: farger.hvit, border: `1px solid ${farger.kremMørk}`, borderRadius: '16px', padding: '24px', textAlign: 'center' }}>
            <div style={{ fontSize: '14px', fontStyle: 'italic', color: farger.tekstLys, fontFamily: 'Georgia, serif' }}>Ingen registreringer ennå i dag</div>
            <div style={{ fontSize: '12px', fontFamily: 'sans-serif', color: farger.tekstLys, marginTop: '6px' }}>Trykk + for å begynne</div>
          </div>
        ) : (
          <div style={{ backgroundColor: farger.hvit, border: `1px solid ${farger.kremMørk}`, borderRadius: '16px', overflow: 'hidden' }}>
            {dagensFlyt.map((item: any, i) => (
              <div key={i} style={{ padding: '12px 16px', borderBottom: i < dagensFlyt.length - 1 ? `1px solid ${farger.kremMørk}` : 'none', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: farger.grønn, flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <span style={{ fontSize: '13px', fontFamily: 'sans-serif', color: farger.tekstLys, marginRight: '8px' }}>{item.tid}</span>
                  <span style={{ fontSize: '14px', fontFamily: 'sans-serif', color: farger.tekst }}>{item.tekst}</span>
                </div>
                {item.varighet && <span style={{ fontSize: '12px', fontFamily: 'sans-serif', color: farger.tekstLys }}>{item.varighet}</span>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}