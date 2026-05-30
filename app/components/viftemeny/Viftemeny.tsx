'use client';
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { farger } from '../../lib/farger';

type Props = {
  bruker: any;
  onNavigate: (side: string) => void;
  onLukk: () => void;
};

const ALLE_SIDER: Record<string, { label: string; bygget: boolean }> = {
  sovn: { label: 'Søvn / lur', bygget: true },
  amming: { label: 'Amming', bygget: true },
  bleie: { label: 'Bleie', bygget: false },
  medisin: { label: 'Medisin', bygget: false },
  signaler: { label: 'Signaler', bygget: false },
  pumping: { label: 'Pumping', bygget: false },
  mat: { label: 'Mat', bygget: false },
  aktivitet: { label: 'Aktivitet', bygget: false },
  notat: { label: 'Notat', bygget: false },
  temperatur: { label: 'Temperatur', bygget: false },
  vaksine: { label: 'Vaksine', bygget: false },
  vekt: { label: 'Vekt', bygget: false },
};

const IkonKomponent = ({ id }: { id: string }) => {
  const farge = farger.grønn;
  if (id === 'amming' || id === 'pumping') return (
    <img src="/tateflaske.png" style={{ width: 28, height: 28, objectFit: 'contain' }} />
  );
  if (id === 'bleie') return (
    <img src="/bleie.png" style={{ width: 28, height: 28, objectFit: 'contain' }} />
  );
  if (id === 'sovn') return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
      <path d="M21 12.5C20.4 15.8 17.5 18 14 18C10 18 7 15 7 11C7 8 9 5.5 12 4.5C9.5 7 9.5 11 12.5 13.5C15.5 16 19.5 15 21 12.5Z" fill={farge}/>
    </svg>
  );
  if (id === 'medisin') return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
      <rect x="8" y="4" width="8" height="14" rx="4" stroke={farge} strokeWidth="1.5" fill="none"/>
      <line x1="12" y1="8" x2="12" y2="14" stroke={farge} strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="9" y1="11" x2="15" y2="11" stroke={farge} strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
  if (id === 'signaler') return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
      <path d="M12 21C12 21 3 15 3 9C3 6.5 5 4.5 7.5 4.5C9.2 4.5 10.7 5.4 12 7C13.3 5.4 14.8 4.5 16.5 4.5C19 4.5 21 6.5 21 9C21 15 12 21 12 21Z" stroke={farge} strokeWidth="1.5" fill="none"/>
    </svg>
  );
  if (id === 'mat') return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
      <ellipse cx="12" cy="15" rx="7" ry="4" stroke={farge} strokeWidth="1.5" fill="none"/>
      <path d="M5 15C5 15 5 12 12 12C19 12 19 15 19 15" stroke={farge} strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="12" y1="12" x2="12" y2="7" stroke={farge} strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
  if (id === 'aktivitet') return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
      <path d="M12 20C12 20 5 14 5 9C5 6 7 4 9.5 4C10.8 4 12 5 12 5C12 5 13.2 4 14.5 4C17 4 19 6 19 9C19 14 12 20 12 20Z" stroke={farge} strokeWidth="1.5" fill="none"/>
    </svg>
  );
  if (id === 'notat') return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
      <rect x="5" y="3" width="14" height="18" rx="2" stroke={farge} strokeWidth="1.5" fill="none"/>
      <line x1="8" y1="8" x2="16" y2="8" stroke={farge} strokeWidth="1.3" strokeLinecap="round"/>
      <line x1="8" y1="12" x2="16" y2="12" stroke={farge} strokeWidth="1.3" strokeLinecap="round"/>
      <line x1="8" y1="16" x2="13" y2="16" stroke={farge} strokeWidth="1.3" strokeLinecap="round"/>
    </svg>
  );
  if (id === 'temperatur') return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
      <rect x="9" y="3" width="6" height="13" rx="3" stroke={farge} strokeWidth="1.5" fill="none"/>
      <circle cx="12" cy="17" r="3" stroke={farge} strokeWidth="1.5" fill="none"/>
    </svg>
  );
  if (id === 'vaksine') return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
      <line x1="19" y1="5" x2="21" y2="3" stroke={farge} strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M6 18L15 9" stroke={farge} strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M9 7L17 15" stroke={farge} strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="4" y1="20" x2="6" y2="18" stroke={farge} strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
  if (id === 'vekt') return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="10" width="18" height="10" rx="2" stroke={farge} strokeWidth="1.5" fill="none"/>
      <path d="M8 10C8 7.8 9.8 6 12 6C14.2 6 16 7.8 16 10" stroke={farge} strokeWidth="1.5" fill="none"/>
      <line x1="12" y1="13" x2="12" y2="16" stroke={farge} strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="8" stroke={farge} strokeWidth="1.5" fill="none"/>
    </svg>
  );
};

export default function Viftemeny({ bruker, onNavigate, onLukk }: Props) {
  const [favoritter, setFavoritter] = useState<string[]>([]);
  const [visVelgFavoritter, setVisVelgFavoritter] = useState(false);
  const [alleFavoritter, setAlleFavoritter] = useState<string[]>([]);

  useEffect(() => {
    const lastFavoritter = async () => {
      const { data } = await supabase.from('profiler').select('favoritter').eq('id', bruker.id).single();
      if (data?.favoritter) {
        setFavoritter(data.favoritter.split(','));
        setAlleFavoritter(data.favoritter.split(','));
      }
    };
    lastFavoritter();
  }, [bruker]);

  const lagreFavoritter = async () => {
    await supabase.from('profiler').update({ favoritter: alleFavoritter.join(',') }).eq('id', bruker.id);
    setFavoritter(alleFavoritter);
    setVisVelgFavoritter(false);
  };

  const toggleFavoritt = (id: string) => {
    if (alleFavoritter.includes(id)) {
      setAlleFavoritter(alleFavoritter.filter(f => f !== id));
    } else if (alleFavoritter.length < 6) {
      setAlleFavoritter([...alleFavoritter, id]);
    }
  };

  if (visVelgFavoritter) {
    return (
      <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 200, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }} onClick={() => setVisVelgFavoritter(false)}>
        <div onClick={e => e.stopPropagation()} style={{ backgroundColor: farger.hvit, width: '100%', maxWidth: '430px', borderRadius: '24px 24px 0 0', padding: '24px', paddingBottom: '48px', maxHeight: '85vh', overflowY: 'auto' }}>
          <div style={{ width: '36px', height: '4px', backgroundColor: farger.kremMørk, borderRadius: '2px', margin: '0 auto 20px' }} />
          <div style={{ fontSize: '18px', fontFamily: 'var(--font-plus-jakarta)', color: farger.tekst, fontWeight: '600', marginBottom: '4px' }}>Velg dine favoritter</div>
          <div style={{ fontSize: '13px', fontFamily: 'var(--font-inter)', color: farger.tekstLys, marginBottom: '8px' }}>Velg opptil 6 ting du vil ha rask tilgang til</div>
          <div style={{ fontSize: '12px', fontFamily: 'var(--font-inter)', color: farger.grønn, fontWeight: '600', marginBottom: '20px' }}>{alleFavoritter.length}/6 valgt</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '24px' }}>
            {Object.entries(ALLE_SIDER).map(([id, info]) => {
              const valgt = alleFavoritter.includes(id);
              const deaktivert = alleFavoritter.length >= 6 && !valgt;
              return (
                <button key={id} onClick={() => toggleFavoritt(id)} style={{ padding: '14px 16px', backgroundColor: valgt ? `${farger.grønn}18` : farger.bakgrunn, border: `1.5px solid ${valgt ? farger.grønn : farger.kremMørk}`, borderRadius: '14px', display: 'flex', alignItems: 'center', gap: '14px', cursor: deaktivert ? 'not-allowed' : 'pointer', opacity: deaktivert ? 0.4 : 1, textAlign: 'left', width: '100%' }}>
                  <IkonKomponent id={id} />
                  <span style={{ fontSize: '14px', fontFamily: 'var(--font-inter)', color: valgt ? farger.grønn : farger.tekst, fontWeight: valgt ? '600' : '400', flex: 1 }}>{info.label}</span>
                  {valgt && (
                    <div style={{ width: '22px', height: '22px', borderRadius: '50%', backgroundColor: farger.grønn, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <path d="M2 6L5 9L10 3" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
          <button onClick={lagreFavoritter} style={{ width: '100%', padding: '16px', backgroundColor: farger.grønn, border: 'none', borderRadius: '14px', fontSize: '15px', fontWeight: '600', color: '#FDFAF6', cursor: 'pointer', fontFamily: 'var(--font-inter)' }}>
            Lagre
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100 }} onClick={onLukk}>
      {/* Mørk bakgrunn */}
      <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)' }} />

      {/* Vifteikoner i halvsirkel */}
      {favoritter.map((id, i) => {
        const info = ALLE_SIDER[id];
        const antall = favoritter.length;
        const vinkel = 210 + (i / (antall - 1)) * 120;
        const rad = (vinkel * Math.PI) / 180;
        const radius = 170;
        const senterX = typeof window !== 'undefined' ? window.innerWidth / 2 : 200;
        const senterY = typeof window !== 'undefined' ? window.innerHeight - 280 : 700;
        const x = senterX + Math.cos(rad) * radius;
        const y = senterY + Math.sin(rad) * radius;

        const bgFarger: Record<string, string> = {
          sovn: '#E8E4F0',
          amming: '#FFE8D6',
          bleie: '#E8F0E8',
          medisin: '#E8F0E8',
          signaler: '#FFE8E8',
          pumping: '#FFE8D6',
          mat: '#FFF3D6',
          aktivitet: '#E8F0E8',
          notat: '#FFF3D6',
          temperatur: '#FFE8E8',
          vaksine: '#E8E4F0',
          vekt: '#E8E4F0',
        };

        return (
          <div
            key={id}
            onClick={e => {
              e.stopPropagation();
              if (info?.bygget) { onNavigate(id); onLukk(); }
            }}
            style={{
              position: 'fixed',
              left: `${x}px`,
              top: `${y}px`,
              transform: 'translate(-50%, -50%)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '6px',
              zIndex: 101,
              cursor: info?.bygget ? 'pointer' : 'default',
              opacity: info?.bygget ? 1 : 0.7,
            }}
          >
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              backgroundColor: bgFarger[id] || '#F0EBE3',
              boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <IkonKomponent id={id} />
            </div>
            <div style={{
              fontSize: '11px',
              fontFamily: 'var(--font-inter)',
              color: '#FDFAF6',
              fontWeight: '500',
              textShadow: '0 1px 4px rgba(0,0,0,0.6)',
              whiteSpace: 'nowrap',
            }}>
              {info?.label}
            </div>
          </div>
        );
      })}

     {/* Hvit panel nedre del */}
     <div style={{ position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: '430px', backgroundColor: 'rgba(255,255,255,0.97)', borderRadius: '24px 24px 0 0', padding: '20px 24px 120px', zIndex: 101 }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L14.4 9.6H22L15.8 14.4L18.2 22L12 17.2L5.8 22L8.2 14.4L2 9.6H9.6L12 2Z" fill={farger.grønn} opacity="0.7"/>
            </svg>
            <div>
              <div style={{ fontSize: '13px', fontFamily: 'var(--font-plus-jakarta)', color: farger.tekst, fontWeight: '600' }}>Dine favoritter</div>
              <div style={{ fontSize: '11px', fontFamily: 'var(--font-inter)', color: farger.tekstLys }}>Trykk for å endre dine favoritter</div>
            </div>
          </div>
          <button onClick={e => { e.stopPropagation(); setVisVelgFavoritter(true); }} style={{ padding: '6px 14px', backgroundColor: farger.grønnLys, border: `1px solid ${farger.grønn}`, borderRadius: '20px', fontSize: '12px', fontFamily: 'var(--font-inter)', color: farger.grønn, fontWeight: '600', cursor: 'pointer' }}>
            Se alle
          </button>
        </div>
      </div>

      {/* Lukk-knapp */}
      <div style={{ position: 'fixed', bottom: '108px', left: '50%', transform: 'translateX(-50%)', zIndex: 103 }}>
        <button onClick={onLukk} style={{ width: '56px', height: '56px', borderRadius: '50%', backgroundColor: farger.grønn, border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 4px 12px rgba(45,92,69,0.35)' }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M18 6L6 18M6 6L18 18" stroke="#FDFAF6" strokeWidth="2.5" strokeLinecap="round"/>
          </svg>
        </button>
      </div>
    </div>
  );
}