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

const IkonKomponent = ({ type }: { type: string }) => {
  if (type === 'oppvåkning') return (
    <div style={{ width: 36, height: 36, borderRadius: '50%', backgroundColor: '#F2E8D8', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="5" fill="#F4A853"/>
        <line x1="12" y1="2" x2="12" y2="5" stroke="#F4A853" strokeWidth="2" strokeLinecap="round"/>
        <line x1="12" y1="19" x2="12" y2="22" stroke="#F4A853" strokeWidth="2" strokeLinecap="round"/>
        <line x1="2" y1="12" x2="5" y2="12" stroke="#F4A853" strokeWidth="2" strokeLinecap="round"/>
        <line x1="19" y1="12" x2="22" y2="12" stroke="#F4A853" strokeWidth="2" strokeLinecap="round"/>
        <line x1="4.9" y1="4.9" x2="7" y2="7" stroke="#F4A853" strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="17" y1="17" x2="19.1" y2="19.1" stroke="#F4A853" strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="19.1" y1="4.9" x2="17" y2="7" stroke="#F4A853" strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="7" y1="17" x2="4.9" y2="19.1" stroke="#F4A853" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    </div>
  );
  if (type === 'natt') return (
    <div style={{ width: 36, height: 36, borderRadius: '50%', backgroundColor: '#D6E5DF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <path d="M21 12.5C20.4 15.8 17.5 18 14 18C10 18 7 15 7 11C7 8 9 5.5 12 4.5C9.5 7 9.5 11 12.5 13.5C15.5 16 19.5 15 21 12.5Z" fill="#2D5C45"/>
      </svg>
    </div>
  );
  if (type === 'lur') return (
    <div style={{ width: 36, height: 36, borderRadius: '50%', backgroundColor: '#E8EFF8', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <path d="M6 15C4.3 15 3 13.7 3 12C3 10.5 4 9.2 5.5 9C5.8 7.3 7.2 6 9 6C10.1 6 11 6.5 11.7 7.3C12.1 7.1 12.5 7 13 7C14.7 7 16 8.3 16 10C16 10.2 16 10.3 15.9 10.5C17.1 10.9 18 12 18 13.3C18 14.8 16.8 16 15.3 16H6V15Z" fill="#A8B5A2" opacity="0.7"/>
        <text x="8" y="13" fontSize="5" fill="#5C7A6B" fontFamily="sans-serif" fontWeight="bold">zzz</text>
      </svg>
    </div>
  );
  if (type === 'amming') return (
    <div style={{ width: 36, height: 36, borderRadius: '50%', backgroundColor: '#F2E4D8', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <rect x="7" y="11" width="10" height="9" rx="3" stroke="#C48E7B" strokeWidth="1.6" fill="none"/>
        <path d="M9 11V9.5C9 8 10 7 11 7H13C14 7 15 8 15 9.5V11" stroke="#C48E7B" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
        <path d="M11 7C11 7 11 5.5 12 4.5C13 5.5 13 7 13 7" stroke="#C48E7B" strokeWidth="1.3" strokeLinecap="round"/>
      </svg>
    </div>
  );
  if (type === 'uro') return (
    <div style={{ width: 36, height: 36, borderRadius: '50%', backgroundColor: '#FFE8E8', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
        <path d="M10 16C10 16 3 11 3 6.5C3 4.5 4.5 3 6.5 3C7.8 3 9 3.7 10 5C11 3.7 12.2 3 13.5 3C15.5 3 17 4.5 17 6.5C17 11 10 16 10 16Z" fill="none" stroke="#C48E7B" strokeWidth="1.3"/>
      </svg>
    </div>
  );
  return (
    <div style={{ width: 36, height: 36, borderRadius: '50%', backgroundColor: '#F0EBE3', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
        <path d="M10 16C10 16 3 11 3 6.5C3 4.5 4.5 3 6.5 3C7.8 3 9 3.7 10 5C11 3.7 12.2 3 13.5 3C15.5 3 17 4.5 17 6.5C17 11 10 16 10 16Z" fill="none" stroke="#8A7060" strokeWidth="1.3"/>
      </svg>
    </div>
  );
};

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

    const lastDagensFlyt = async () => {
        const dagensdato = new Date().toISOString().split('T')[0];
        
        // Hent lurer
        const { data: lurer } = await supabase
          .from('lurer')
          .select('*')
          .eq('profil_id', bruker.id)
          .eq('dato', dagensdato)
          .order('start', { ascending: false });
      
        // Hent amming
        const { data: amming } = await supabase
          .from('amming')
          .select('*')
          .eq('profil_id', bruker.id)
          .eq('dato', dagensdato)
          .order('start', { ascending: false });
      
        const lurItems = (lurer || []).map((l: any) => ({
          tid: l.start,
          tekst: l.type === 'lur' ? 'Lur' : l.type === 'natt' ? 'Sovnet' : l.type === 'oppvåkning' ? 'Våknet' : l.tekst || l.type,
          type: l.type,
          varighet: l.varighet ? `${l.varighet} min` : null,
        }));
      
        const ammingItems = (amming || []).map((a: any) => ({
          tid: a.start,
          tekst: `Amming · ${a.bryst === 'venstre' ? 'venstre' : 'høyre'} bryst`,
          type: 'amming',
          varighet: a.varighet ? `${a.varighet} min` : null,
        }));

        const { data: bleier } = await supabase
  .from('bleie')
  .select('*')
  .eq('profil_id', bruker.id)
  .eq('dato', dagensdato)
  .order('tidspunkt', { ascending: false });

const bleieItems = (bleier || []).map((b: any) => ({
  tid: b.tidspunkt,
  tekst: `Bleie · ${b.type}`,
  type: 'bleie',
  varighet: null,
}));
      
        // Slå sammen og sorter på tid
        const alle = [...lurItems, ...ammingItems, ...bleieItems].sort((a, b) => {
            if (!a.tid || !b.tid) return 0;
            return b.tid.localeCompare(a.tid);
          });
      
        setDagensFlyt(alle);
      };

    lastProfil();
    lastDagensFlyt();
    const interval = setInterval(lastDagensFlyt, 60000);
    return () => clearInterval(interval);
  }, [bruker]);

  const tilstandConfig: Record<string, { tekst: string; undertekst: string; farge: string; blobFarge: string }> = {
    rolig: { tekst: 'Rolig og våken', undertekst: 'Klar for lek og samspill', farge: '#A8B5A2', blobFarge: 'radial-gradient(ellipse at 40% 40%, #D6E5DF 0%, #EBC8B4 60%, #F7F3EC 100%)' },
    trøtt: { tekst: 'Virker trøtt', undertekst: 'Kanskje tid for en lur snart?', farge: '#C7BDD8', blobFarge: 'radial-gradient(ellipse at 40% 40%, #C7BDD8 0%, #DCCFC0 60%, #F7F3EC 100%)' },
    urolig: { tekst: 'Litt urolig', undertekst: 'Trenger ro og regulering', farge: '#C48E7B', blobFarge: 'radial-gradient(ellipse at 40% 40%, #EBC8B4 0%, #DCCFC0 50%, #F7F3EC 100%)' },
    sover: { tekst: 'Sover nå', undertekst: 'Hvil deg du også 🌙', farge: '#A8B5A2', blobFarge: 'radial-gradient(ellipse at 40% 40%, #D6E5DF 0%, #C7BDD8 55%, #F7F3EC 100%)' },
  };

  const valgtTilstand = tilstandConfig[babyTilstand] || tilstandConfig.rolig;

  const aiInnsikt: Record<string, string> = {
    rolig: 'Baby virker rolig og mottakelig nå ✦',
    trøtt: 'Baby viser trøtthetstegn – kanskje start nedtrapping?',
    urolig: 'Baby virker litt overstimulert i dag',
    sover: 'Baby sover – bruk tiden til å hvile 🌙',
  };

  const tilstandLabels: Record<string, string> = {
    rolig: 'Rolig', trøtt: 'Trøtt', urolig: 'Urolig', sover: 'Sover',
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
            <div style={{ fontSize: '22px', fontFamily: 'var(--font-plus-jakarta), sans-serif', fontWeight: 600, color: '#3F3A37', marginBottom: '2px', letterSpacing: '-0.3px' }}>
              {tidspunkt()}{babyNavn ? `, ${babyNavn}` : ''} ✨
            </div>
            <div style={{ fontSize: '13px', fontFamily: 'var(--font-inter), sans-serif', color: '#7B746D' }}>
              {valgtTilstand.tekst}
            </div>
          </div>
          <button style={{ background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(8px)', border: '1px solid rgba(220,207,192,0.5)', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M18 8C18 6.4087 17.3679 4.88258 16.2426 3.75736C15.1174 2.63214 13.5913 2 12 2C10.4087 2 8.88258 2.63214 7.75736 3.75736C6.63214 4.88258 6 6.4087 6 8C6 15 3 17 3 17H21C21 17 18 15 18 8Z" fill="#7B746D" opacity="0.7"/>
              <path d="M13.73 21C13.5542 21.3031 13.3019 21.5547 12.9982 21.7295C12.6946 21.9044 12.3504 21.9965 12 21.9965C11.6496 21.9965 11.3054 21.9044 11.0018 21.7295C10.6982 21.5547 10.4458 21.3031 10.27 21" stroke="#7B746D" strokeWidth="1.8" strokeLinecap="round" opacity="0.7"/>
            </svg>
          </button>
        </div>
      </div>

      {/* AI Innsikt-kort */}
      <div style={{ padding: '16px 24px 0' }}>
        <div style={{ background: 'rgba(255,255,255,0.75)', backdropFilter: 'blur(12px)', border: '1px solid rgba(235,200,180,0.4)', borderRadius: '20px', padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 4px 20px rgba(0,0,0,0.04)' }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '13.5px', fontFamily: 'var(--font-inter), sans-serif', color: '#3F3A37', lineHeight: '1.4', marginBottom: '6px' }}>
              {aiInnsikt[babyTilstand]}
            </div>
            <button onClick={() => onNavigate('innsikt')} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontSize: '12px', fontFamily: 'var(--font-inter), sans-serif', color: '#A8B5A2', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '3px' }}>
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
      <div style={{ position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '520px' }}>
        <div style={{ position: 'absolute', width: '380px', height: '360px', background: 'radial-gradient(ellipse, #EBC8B4 0%, transparent 70%)', borderRadius: '62% 38% 54% 46% / 55% 48% 52% 45%', opacity: 0.35, filter: 'blur(22px)', transform: 'translate(50px, -30px)' }} />
        <div style={{ position: 'absolute', width: '360px', height: '340px', background: 'radial-gradient(ellipse, #C7BDD8 0%, transparent 70%)', borderRadius: '45% 55% 38% 62% / 52% 60% 40% 48%', opacity: 0.25, filter: 'blur(20px)', transform: 'translate(-50px, 20px)' }} />
        <div style={{ position: 'absolute', width: '340px', height: '340px', background: 'radial-gradient(ellipse at 50% 50%, #A8B5A2 0%, transparent 70%)', borderRadius: '55% 45% 62% 38% / 48% 55% 45% 52%', opacity: 0.7, filter: 'blur(16px)', transform: 'translate(0px, 10px)' }} />
        <div style={{ position: 'absolute', width: '240px', height: '240px', background: 'radial-gradient(ellipse at 50% 50%, rgba(255,255,255,0.5) 0%, transparent 70%)', borderRadius: '50%', filter: 'blur(6px)' }} />
        <div style={{ position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
          {babyBilde ? (
            <div style={{ width: '140px', height: '140px', borderRadius: '50%', overflow: 'hidden', border: '3px solid rgba(255,255,255,0.9)', boxShadow: '0 8px 30px rgba(0,0,0,0.10)' }}>
              <img src={babyBilde} alt="baby" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
          ) : (
            <div style={{ width: '90px', height: '90px', borderRadius: '50%', background: 'rgba(255,255,255,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid rgba(255,255,255,0.8)' }}>
              <img src="/baby-ansikt.png" alt="baby" style={{ width: '64px', height: '64px', objectFit: 'contain', mixBlendMode: 'multiply' }} />
            </div>
          )}
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '17px', fontFamily: 'var(--font-plus-jakarta), sans-serif', fontWeight: 600, color: '#3F3A37', marginBottom: '4px' }}>{valgtTilstand.tekst}</div>
            <div style={{ fontSize: '12.5px', fontFamily: 'var(--font-inter), sans-serif', color: '#7B746D' }}>{valgtTilstand.undertekst}</div>
          </div>
        </div>
      </div>

      {/* Tilstandsvelger */}
      <div style={{ display: 'flex', gap: '8px', padding: '0 24px 16px', overflowX: 'auto' }}>
        {Object.entries(tilstandConfig).map(([key, val]) => (
          <button key={key} onClick={() => setBabyTilstand(key)} style={{ flexShrink: 0, padding: '9px 18px', borderRadius: '24px', border: babyTilstand === key ? `1.5px solid ${val.farge}` : '1.5px solid rgba(220,207,192,0.6)', backgroundColor: babyTilstand === key ? `${val.farge}22` : 'rgba(255,255,255,0.6)', color: babyTilstand === key ? val.farge : '#7B746D', fontSize: '12.5px', fontFamily: 'var(--font-inter), sans-serif', cursor: 'pointer', fontWeight: babyTilstand === key ? 600 : 400, transition: 'all 0.3s ease' }}>
            {tilstandLabels[key]}
          </button>
        ))}
      </div>

      {/* Snarveier */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', padding: '0 24px', marginBottom: '28px' }}>
        {snarveier.map(item => (
          <button key={item.side} onClick={() => onNavigate(item.side)} style={{ padding: '18px 8px 14px', background: 'rgba(255,255,255,0.75)', border: '1px solid rgba(220,207,192,0.4)', borderRadius: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', cursor: 'pointer', boxShadow: '0 4px 16px rgba(0,0,0,0.04)', transition: 'all 0.3s ease' }}>
            {item.svg}
            <span style={{ fontSize: '11px', fontFamily: 'var(--font-inter), sans-serif', color: '#7B746D' }}>{item.label}</span>
          </button>
        ))}
      </div>

  {/* Dagens flyt */}
<div style={{ padding: '0 24px 32px' }}>
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
    <div style={{ fontSize: '16px', fontFamily: 'var(--font-plus-jakarta), sans-serif', fontWeight: 600, color: '#3F3A37' }}>Dagens flyt</div>
    <button style={{ fontSize: '12px', fontFamily: 'var(--font-inter), sans-serif', color: '#A8B5A2', background: 'rgba(168,181,162,0.12)', border: '1px solid rgba(168,181,162,0.3)', padding: '5px 14px', borderRadius: '20px', cursor: 'pointer', fontWeight: 500 }}>Se dagbok</button>
  </div>

  <div style={{ background: 'rgba(255,255,255,0.6)', border: '1px solid rgba(220,207,192,0.35)', borderRadius: '20px', overflow: 'hidden', padding: '8px 0' }}>
    {dagensFlyt.length === 0 ? (
      <div style={{ padding: '28px 24px', textAlign: 'center' }}>
        <div style={{ fontSize: '14px', fontStyle: 'italic', color: '#7B746D', fontFamily: 'var(--font-plus-jakarta), sans-serif', marginBottom: '6px' }}>Ingen registreringer ennå i dag</div>
        <div style={{ fontSize: '12px', fontFamily: 'var(--font-inter), sans-serif', color: '#A8B5A2' }}>Trykk + for å begynne</div>
      </div>
    ) : (
      <>
        {dagensFlyt.slice(0, 5).map((item: any, i) => (
          <div key={i} style={{ position: 'relative' }}>
            {i < Math.min(dagensFlyt.length, 5) - 1 && (
              <div style={{ position: 'absolute', left: '36px', top: '54px', width: '1px', height: 'calc(100% - 10px)', backgroundColor: 'rgba(220,207,192,0.5)' }} />
            )}
            <div style={{ padding: '12px 18px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <IkonKomponent type={item.type} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '14px', fontFamily: 'var(--font-inter), sans-serif', color: '#3F3A37', fontWeight: i === 0 ? 600 : 400 }}>{item.tekst}</div>
                <div style={{ fontSize: '11px', fontFamily: 'var(--font-inter), sans-serif', color: '#7B746D', marginTop: '2px' }}>{item.tid}</div>
              </div>
              {item.varighet && (
                <div style={{ fontSize: '12px', fontFamily: 'var(--font-inter), sans-serif', color: '#A8B5A2', fontWeight: 500 }}>{item.varighet}</div>
              )}
            </div>
          </div>
        ))}
 {dagensFlyt.length > 5 && (
          <div style={{ padding: '10px 18px', textAlign: 'center', borderTop: '1px solid rgba(220,207,192,0.35)' }}>
            <div style={{ fontSize: '12px', fontFamily: 'var(--font-inter)', color: farger.tekstLys }}>
              + {dagensFlyt.length - 5} flere – trykk «Se dagbok» for full oversikt
            </div>
          </div>
        )}
      </>
    )}
  </div>
</div>

    </div>
  );
}