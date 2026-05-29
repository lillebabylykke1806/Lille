'use client';
import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { farger } from '../../lib/farger';

type Props = {
  bruker: any;
  onFerdig: () => void;
};

const hentAnbefalte = (alder: number) => {
  if (alder < 1) return ['amming', 'sovn', 'bleie', 'signaler', 'notat', 'medisin'];
  if (alder < 4) return ['sovn', 'amming', 'bleie', 'signaler', 'aktivitet', 'notat'];
  if (alder < 8) return ['sovn', 'mat', 'bleie', 'aktivitet', 'signaler', 'notat'];
  if (alder < 12) return ['sovn', 'mat', 'bleie', 'aktivitet', 'medisin', 'notat'];
  return ['sovn', 'mat', 'aktivitet', 'medisin', 'vekt', 'notat'];
};

const ALLE_FAVORITTER = [
  { id: 'amming', label: 'Amming' },
  { id: 'sovn', label: 'Søvn / lur' },
  { id: 'medisin', label: 'Medisin / vaksine' },
  { id: 'bleie', label: 'Bleie' },
  { id: 'signaler', label: 'Signaler' },
  { id: 'pumping', label: 'Pumping' },
  { id: 'mat', label: 'Mat (fast føde)' },
  { id: 'aktivitet', label: 'Aktivitet' },
  { id: 'notat', label: 'Notat' },
  { id: 'temperatur', label: 'Temperatur' },
  { id: 'vaksine', label: 'Vaksine' },
  { id: 'vekt', label: 'Vekt / lengde' },
];

const IkonKomponent = ({ id, valgt }: { id: string; valgt: boolean }) => {
  const farge = valgt ? farger.grønn : '#8A7060';
  const bgFarge = valgt ? `${farger.grønn}18` : farger.kremMørk;

  if (id === 'amming' || id === 'pumping') return (
    <div style={{ width: 40, height: 40, borderRadius: '50%', backgroundColor: bgFarge, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <img src="/tateflaske.png" style={{ width: 24, height: 24, objectFit: 'contain' }} />
    </div>
  );
  if (id === 'bleie') return (
    <div style={{ width: 40, height: 40, borderRadius: '50%', backgroundColor: bgFarge, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <img src="/bleie.png" style={{ width: 24, height: 24, objectFit: 'contain' }} />
    </div>
  );
  if (id === 'sovn') return (
    <div style={{ width: 40, height: 40, borderRadius: '50%', backgroundColor: bgFarge, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path d="M21 12.5C20.4 15.8 17.5 18 14 18C10 18 7 15 7 11C7 8 9 5.5 12 4.5C9.5 7 9.5 11 12.5 13.5C15.5 16 19.5 15 21 12.5Z" fill={farge} opacity="0.9"/>
      </svg>
    </div>
  );
  if (id === 'medisin') return (
    <div style={{ width: 40, height: 40, borderRadius: '50%', backgroundColor: bgFarge, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <rect x="8" y="4" width="8" height="14" rx="4" stroke={farge} strokeWidth="1.5" fill="none"/>
        <path d="M10 4V3C10 2.45 10.45 2 11 2H13C13.55 2 14 2.45 14 3V4" stroke={farge} strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="12" y1="8" x2="12" y2="14" stroke={farge} strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="9" y1="11" x2="15" y2="11" stroke={farge} strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    </div>
  );
  if (id === 'signaler') return (
    <div style={{ width: 40, height: 40, borderRadius: '50%', backgroundColor: bgFarge, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path d="M12 21C12 21 3 15 3 9C3 6.5 5 4.5 7.5 4.5C9.2 4.5 10.7 5.4 12 7C13.3 5.4 14.8 4.5 16.5 4.5C19 4.5 21 6.5 21 9C21 15 12 21 12 21Z" stroke={farge} strokeWidth="1.5" fill={valgt ? `${farger.grønn}30` : 'none'} strokeLinejoin="round"/>
      </svg>
    </div>
  );
  if (id === 'mat') return (
    <div style={{ width: 40, height: 40, borderRadius: '50%', backgroundColor: bgFarge, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <ellipse cx="12" cy="15" rx="7" ry="4" stroke={farge} strokeWidth="1.5" fill="none"/>
        <path d="M5 15C5 15 5 12 12 12C19 12 19 15 19 15" stroke={farge} strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="12" y1="12" x2="12" y2="7" stroke={farge} strokeWidth="1.5" strokeLinecap="round"/>
        <path d="M10 7C10 7 10 5 12 5C14 5 14 7 14 7" stroke={farge} strokeWidth="1.3" strokeLinecap="round" fill="none"/>
      </svg>
    </div>
  );
  if (id === 'aktivitet') return (
    <div style={{ width: 40, height: 40, borderRadius: '50%', backgroundColor: bgFarge, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path d="M12 20C12 20 5 14 5 9C5 6 7 4 9.5 4C10.8 4 12 5 12 5C12 5 13.2 4 14.5 4C17 4 19 6 19 9C19 14 12 20 12 20Z" fill={valgt ? `${farger.grønn}30` : 'none'} stroke={farge} strokeWidth="1.5"/>
        <path d="M12 5C12 5 10 8 10 11C10 13 11 15 12 16" stroke={farge} strokeWidth="1.2" strokeLinecap="round" opacity="0.6"/>
      </svg>
    </div>
  );
  if (id === 'notat') return (
    <div style={{ width: 40, height: 40, borderRadius: '50%', backgroundColor: bgFarge, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <rect x="5" y="3" width="14" height="18" rx="2" stroke={farge} strokeWidth="1.5" fill="none"/>
        <line x1="8" y1="8" x2="16" y2="8" stroke={farge} strokeWidth="1.3" strokeLinecap="round"/>
        <line x1="8" y1="12" x2="16" y2="12" stroke={farge} strokeWidth="1.3" strokeLinecap="round"/>
        <line x1="8" y1="16" x2="13" y2="16" stroke={farge} strokeWidth="1.3" strokeLinecap="round"/>
      </svg>
    </div>
  );
  if (id === 'temperatur') return (
    <div style={{ width: 40, height: 40, borderRadius: '50%', backgroundColor: bgFarge, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <rect x="9" y="3" width="6" height="13" rx="3" stroke={farge} strokeWidth="1.5" fill="none"/>
        <circle cx="12" cy="17" r="3" stroke={farge} strokeWidth="1.5" fill={valgt ? `${farger.grønn}40` : 'none'}/>
        <line x1="12" y1="10" x2="12" y2="14" stroke={farge} strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="15" y1="7" x2="17" y2="7" stroke={farge} strokeWidth="1.3" strokeLinecap="round"/>
        <line x1="15" y1="10" x2="17" y2="10" stroke={farge} strokeWidth="1.3" strokeLinecap="round"/>
      </svg>
    </div>
  );
  if (id === 'vaksine') return (
    <div style={{ width: 40, height: 40, borderRadius: '50%', backgroundColor: bgFarge, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <line x1="19" y1="5" x2="21" y2="3" stroke={farge} strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="15" y1="5" x2="19" y2="5" stroke={farge} strokeWidth="1.5" strokeLinecap="round"/>
        <path d="M6 18L15 9" stroke={farge} strokeWidth="1.5" strokeLinecap="round"/>
        <path d="M9 7L17 15" stroke={farge} strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="4" y1="20" x2="6" y2="18" stroke={farge} strokeWidth="1.5" strokeLinecap="round"/>
        <path d="M11 7L17 13" stroke={farge} strokeWidth="1.5" strokeLinecap="round" opacity="0.4"/>
      </svg>
    </div>
  );
  if (id === 'vekt') return (
    <div style={{ width: 40, height: 40, borderRadius: '50%', backgroundColor: bgFarge, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <rect x="3" y="10" width="18" height="10" rx="2" stroke={farge} strokeWidth="1.5" fill="none"/>
        <path d="M8 10C8 7.8 9.8 6 12 6C14.2 6 16 7.8 16 10" stroke={farge} strokeWidth="1.5" fill="none"/>
        <line x1="12" y1="13" x2="12" y2="16" stroke={farge} strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="10" y1="15" x2="14" y2="15" stroke={farge} strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    </div>
  );
  return (
    <div style={{ width: 40, height: 40, borderRadius: '50%', backgroundColor: bgFarge, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="8" stroke={farge} strokeWidth="1.5" fill="none"/>
      </svg>
    </div>
  );
};

export default function Onboarding({ bruker, onFerdig }: Props) {
  const [steg, setSteg] = useState(1);
  const [babyNavn, setBabyNavn] = useState('');
  const [fødselsdato, setFødselsdato] = useState('');
  const [babyBilde, setBabyBilde] = useState<string | null>(null);
  const [favoritter, setFavoritter] = useState<string[]>([]);
  const [laster, setLaster] = useState(false);

  const alderIMåneder = () => {
    if (!fødselsdato) return 0;
    const nå = new Date();
    const født = new Date(fødselsdato);
    return (nå.getFullYear() - født.getFullYear()) * 12 + (nå.getMonth() - født.getMonth());
  };

  const alderTekst = () => {
    const alder = alderIMåneder();
    if (alder < 1) return 'Nyfødt';
    if (alder < 12) return `${alder} måneder`;
    const år = Math.floor(alder / 12);
    const mnd = alder % 12;
    return mnd > 0 ? `${år} år og ${mnd} måneder` : `${år} år`;
  };

  const toggleFavoritt = (id: string) => {
    if (favoritter.includes(id)) {
      setFavoritter(favoritter.filter(f => f !== id));
    } else if (favoritter.length < 6) {
      setFavoritter([...favoritter, id]);
    }
  };

  const lastOppBilde = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fil = e.target.files?.[0];
    if (!fil) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setBabyBilde(result);
      localStorage.setItem('lille_babybilde', result);
    };
    reader.readAsDataURL(fil);
  };

  const lagreProfil = async () => {
    setLaster(true);
    await supabase.from('profiler').upsert({
      id: bruker.id,
      baby_navn: babyNavn,
      fødselsdato,
      favoritter: favoritter.join(','),
    });
    setLaster(false);
    onFerdig();
  };

  const progressProsent = (steg / 4) * 100;

  return (
    <div style={{ backgroundColor: farger.bakgrunn, minHeight: '100vh', maxWidth: '430px', margin: '0 auto', padding: '24px', display: 'flex', flexDirection: 'column' }}>

      {/* Progress bar */}
      <div style={{ height: '3px', backgroundColor: farger.kremMørk, borderRadius: '2px', marginBottom: '32px' }}>
        <div style={{ height: '100%', width: `${progressProsent}%`, backgroundColor: farger.grønn, borderRadius: '2px', transition: 'width 0.4s ease' }} />
      </div>

      {/* Steg 1 – Velkommen */}
      {steg === 1 && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
          <img src="/leep.png" alt="Lille" style={{ width: '120px', marginBottom: '32px', mixBlendMode: 'multiply' }} />
          <div style={{ fontSize: '28px', fontFamily: 'var(--font-plus-jakarta)', color: farger.tekst, fontWeight: '600', marginBottom: '12px', lineHeight: 1.3 }}>
            Velkommen til Lille
          </div>
          <div style={{ fontSize: '15px', fontFamily: 'var(--font-inter)', color: farger.tekstLys, lineHeight: 1.7, marginBottom: '48px', maxWidth: '300px' }}>
            Din babys språk, i dine hender. La oss sette opp appen for deg og din lille en.
          </div>
          <button onClick={() => setSteg(2)} style={{ width: '100%', padding: '16px', backgroundColor: farger.grønn, border: 'none', borderRadius: '16px', fontSize: '15px', fontWeight: '600', color: '#FDFAF6', cursor: 'pointer', fontFamily: 'var(--font-inter)' }}>
            Kom i gang 🌿
          </button>
        </div>
      )}

      {/* Steg 2 – Hvem er babyen? */}
      {steg === 2 && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontSize: '24px', fontFamily: 'var(--font-plus-jakarta)', color: farger.tekst, fontWeight: '600', marginBottom: '8px' }}>
            Hvem er babyen? 🤍
          </div>
          <div style={{ fontSize: '13px', fontFamily: 'var(--font-inter)', color: farger.tekstLys, marginBottom: '32px' }}>
            Fortell oss litt om din lille en
          </div>

          {/* Babybilde */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '28px' }}>
            <label style={{ cursor: 'pointer' }}>
              <div style={{ width: '100px', height: '100px', borderRadius: '50%', backgroundColor: farger.kremMørk, border: `2px dashed ${farger.grønn}`, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                {babyBilde ? (
                  <img src={babyBilde} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '28px' }}>📸</div>
                    <div style={{ fontSize: '10px', fontFamily: 'var(--font-inter)', color: farger.tekstLys, marginTop: '4px' }}>Legg til bilde</div>
                  </div>
                )}
              </div>
              <input type="file" accept="image/*" onChange={lastOppBilde} style={{ display: 'none' }} />
            </label>
          </div>

          {/* Navn */}
          <div style={{ marginBottom: '16px' }}>
            <div style={{ fontSize: '11px', letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: 'var(--font-inter)', color: farger.tekstLys, marginBottom: '8px' }}>Babyens navn</div>
            <input
              type="text"
              value={babyNavn}
              onChange={e => setBabyNavn(e.target.value)}
              placeholder="F.eks. Emma"
              style={{ width: '100%', padding: '12px 16px', fontSize: '15px', border: `1px solid ${farger.kremMørk}`, borderRadius: '12px', backgroundColor: farger.hvit, color: farger.tekst, outline: 'none', fontFamily: 'var(--font-inter)', boxSizing: 'border-box' }}
            />
          </div>

          {/* Fødselsdato */}
          <div style={{ marginBottom: '40px' }}>
            <div style={{ fontSize: '11px', letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: 'var(--font-inter)', color: farger.tekstLys, marginBottom: '8px' }}>Fødselsdato</div>
            <input
              type="date"
              value={fødselsdato}
              onChange={e => setFødselsdato(e.target.value)}
              style={{ width: '100%', padding: '12px 16px', fontSize: '15px', border: `1px solid ${farger.kremMørk}`, borderRadius: '12px', backgroundColor: farger.hvit, color: farger.tekst, outline: 'none', fontFamily: 'var(--font-inter)', boxSizing: 'border-box' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '10px', marginTop: 'auto' }}>
            <button onClick={() => setSteg(1)} style={{ flex: 1, padding: '14px', backgroundColor: 'transparent', border: `1px solid ${farger.kremMørk}`, borderRadius: '14px', fontSize: '14px', color: farger.tekstLys, cursor: 'pointer', fontFamily: 'var(--font-inter)' }}>
              Tilbake
            </button>
            <button
              onClick={() => {
                if (fødselsdato) setFavoritter(hentAnbefalte(alderIMåneder()));
                setSteg(3);
              }}
              disabled={!babyNavn || !fødselsdato}
              style={{ flex: 2, padding: '14px', backgroundColor: babyNavn && fødselsdato ? farger.grønn : farger.kremMørk, border: 'none', borderRadius: '14px', fontSize: '14px', fontWeight: '600', color: '#FDFAF6', cursor: babyNavn && fødselsdato ? 'pointer' : 'not-allowed', fontFamily: 'var(--font-inter)' }}
            >
              Neste →
            </button>
          </div>
        </div>
      )}

      {/* Steg 3 – Velg favoritter */}
      {steg === 3 && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontSize: '24px', fontFamily: 'var(--font-plus-jakarta)', color: farger.tekst, fontWeight: '600', marginBottom: '8px' }}>
            Velg dine favoritter ✨
          </div>
          <div style={{ fontSize: '13px', fontFamily: 'var(--font-inter)', color: farger.tekstLys, marginBottom: '4px' }}>
            Velg opptil 6 ting du vil ha rask tilgang til
          </div>
          <div style={{ fontSize: '12px', fontFamily: 'var(--font-inter)', color: farger.tekstLys, fontStyle: 'italic', marginBottom: '8px' }}>
            Basert på {babyNavn}s alder ({alderTekst()})
          </div>
          <div style={{ fontSize: '12px', fontFamily: 'var(--font-inter)', color: farger.grønn, fontWeight: '600', marginBottom: '20px' }}>
            {favoritter.length}/6 valgt
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1, overflowY: 'auto', marginBottom: '20px' }}>
            {ALLE_FAVORITTER.map(item => {
              const valgt = favoritter.includes(item.id);
              const deaktivert = favoritter.length >= 6 && !valgt;
              return (
                <button
                  key={item.id}
                  onClick={() => toggleFavoritt(item.id)}
                  style={{
                    padding: '14px 16px',
                    backgroundColor: valgt ? `${farger.grønn}18` : farger.hvit,
                    border: `1.5px solid ${valgt ? farger.grønn : farger.kremMørk}`,
                    borderRadius: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '14px',
                    cursor: deaktivert ? 'not-allowed' : 'pointer',
                    opacity: deaktivert ? 0.4 : 1,
                    transition: 'all 0.2s ease',
                    textAlign: 'left',
                    width: '100%',
                  }}
                >
                  <IkonKomponent id={item.id} valgt={valgt} />
                  <span style={{ fontSize: '14px', fontFamily: 'var(--font-inter)', color: valgt ? farger.grønn : farger.tekst, fontWeight: valgt ? '600' : '400', flex: 1 }}>
                    {item.label}
                  </span>
                  {valgt && (
                    <div style={{ width: '22px', height: '22px', borderRadius: '50%', backgroundColor: farger.grønn, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <path d="M2 6L5 9L10 3" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={() => setSteg(2)} style={{ flex: 1, padding: '14px', backgroundColor: 'transparent', border: `1px solid ${farger.kremMørk}`, borderRadius: '14px', fontSize: '14px', color: farger.tekstLys, cursor: 'pointer', fontFamily: 'var(--font-inter)' }}>
              Tilbake
            </button>
            <button
              onClick={() => setSteg(4)}
              disabled={favoritter.length === 0}
              style={{ flex: 2, padding: '14px', backgroundColor: favoritter.length > 0 ? farger.grønn : farger.kremMørk, border: 'none', borderRadius: '14px', fontSize: '14px', fontWeight: '600', color: '#FDFAF6', cursor: favoritter.length > 0 ? 'pointer' : 'not-allowed', fontFamily: 'var(--font-inter)' }}
            >
              Neste →
            </button>
          </div>
        </div>
      )}

      {/* Steg 4 – Ferdig */}
      {steg === 4 && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
          <div style={{ fontSize: '64px', marginBottom: '24px' }}>🌿</div>
          <div style={{ fontSize: '26px', fontFamily: 'var(--font-plus-jakarta)', color: farger.tekst, fontWeight: '600', marginBottom: '12px', lineHeight: 1.3 }}>
            Alt er klart{babyNavn ? `, ${babyNavn}` : ''}! 🤍
          </div>
          <div style={{ fontSize: '14px', fontFamily: 'var(--font-inter)', color: farger.tekstLys, lineHeight: 1.7, marginBottom: '48px', maxWidth: '280px' }}>
            Appen er nå tilpasset deg og din lille en. Vi gleder oss til å hjelpe deg i babytiden.
          </div>
          <button
            onClick={lagreProfil}
            disabled={laster}
            style={{ width: '100%', padding: '16px', backgroundColor: farger.grønn, border: 'none', borderRadius: '16px', fontSize: '15px', fontWeight: '600', color: '#FDFAF6', cursor: 'pointer', fontFamily: 'var(--font-inter)' }}
          >
            {laster ? 'Lagrer...' : 'Start Lille 🌙'}
          </button>
        </div>
      )}
    </div>
  );
}