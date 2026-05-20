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
      <div style={{ display: 'flex', justifyContent: 'center', padding: '20px 24px' }}>
        <div style={{ position: 'relative', width: '220px', height: '220px' }}>
          {/* Bakgrunnsboble */}
          <div style={{
            position: 'absolute', inset: 0,
            background: `radial-gradient(circle at 40% 40%, ${valgtTilstand.farge1}, ${valgtTilstand.farge2})`,
            borderRadius: '60% 40% 55% 45% / 50% 60% 40% 50%',
            filter: 'blur(2px)',
            opacity: 0.9,
          }} />
          {/* Indre boble */}
          <div style={{
            position: 'absolute', inset: '15px',
            background: `radial-gradient(circle at 35% 35%, ${valgtTilstand.farge2}99, ${valgtTilstand.farge1}66)`,
            borderRadius: '55% 45% 60% 40% / 45% 55% 45% 55%',
          }} />
          {/* Innhold */}
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
              <circle cx="18" cy="14" r="9" fill={farger.grønn} opacity="0.7" />
              <circle cx="14" cy="12" r="1.5" fill={farger.hvit} />
              <circle cx="22" cy="12" r="1.5" fill={farger.hvit} />
              <path d="M14 17C14 17 15.5 19 18 19C20.5 19 22 17 22 17" stroke={farger.hvit} strokeWidth="1.5" strokeLinecap="round" />
              <path d="M10 22C10 22 12 26 18 26C24 26 26 22 26 22" stroke={farger.grønn} strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
            </svg>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '16px', fontFamily: 'Georgia, serif', color: farger.tekst, marginBottom: '4px' }}>{valgtTilstand.tekst}</div>
              <div style={{ fontSize: '12px', fontFamily: 'sans-serif', color: farger.tekstLys }}>{valgtTilstand.undertekst}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Tilstandsvelger */}
      <div style={{ display: 'flex', gap: '8px', padding: '0 24px', marginBottom: '24px', overflowX: 'auto' }}>
        {Object.entries(tilstandConfig).map(([key, val]) => (
          <button key={key} onClick={() => setBabyTilstand(key)} style={{ flexShrink: 0, padding: '8px 14px', borderRadius: '20px', border: babyTilstand === key ? `2px solid ${farger.grønn}` : `1px solid ${farger.kremMørk}`, backgroundColor: babyTilstand === key ? farger.grønnLys : farger.hvit, color: babyTilstand === key ? farger.grønn : farger.tekstLys, fontSize: '12px', fontFamily: 'sans-serif', cursor: 'pointer', fontWeight: babyTilstand === key ? '600' : '400' }}>
            {key.charAt(0).toUpperCase() + key.slice(1)}
          </button>
        ))}
      </div>

      {/* Snarveier */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', padding: '0 24px', marginBottom: '24px' }}>
        {[
          { label: 'Søvn', ikon: '🌙', side: 'sovn' },
          { label: 'Amming', ikon: '🤱', side: 'amming' },
          { label: 'Signal & uro', ikon: '💛', side: 'kolikk' },
        ].map(item => (
          <button key={item.side} onClick={() => onNavigate(item.side)} style={{ padding: '16px 8px', backgroundColor: farger.hvit, border: `1px solid ${farger.kremMørk}`, borderRadius: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
            <span style={{ fontSize: '24px' }}>{item.ikon}</span>
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