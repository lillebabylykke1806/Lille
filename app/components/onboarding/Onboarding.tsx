'use client';
import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { farger } from '../../lib/farger';

type Props = {
  bruker: any;
  onFerdig: () => void;
};

const ALLE_FAVORITTER = [
  { id: 'sovn', label: 'Søvn / lur', ikon: '🌙' },
  { id: 'amming', label: 'Amming', ikon: '🍼' },
  { id: 'bleie', label: 'Bleie', ikon: '👶' },
  { id: 'medisin', label: 'Medisin / vaksine', ikon: '💊' },
  { id: 'signaler', label: 'Signaler', ikon: '🤍' },
  { id: 'pumping', label: 'Pumping', ikon: '🫧' },
  { id: 'mat', label: 'Mat (fast føde)', ikon: '🥣' },
  { id: 'aktivitet', label: 'Aktivitet', ikon: '🌿' },
  { id: 'notat', label: 'Notat', ikon: '📝' },
  { id: 'temperatur', label: 'Temperatur', ikon: '🌡️' },
  { id: 'vekt', label: 'Vekt / lengde', ikon: '📏' },
];

const hentAnbefalte = (alder: number) => {
  if (alder < 1) return ['amming', 'sovn', 'bleie', 'signaler', 'notat', 'medisin'];
  if (alder < 4) return ['sovn', 'amming', 'bleie', 'signaler', 'aktivitet', 'notat'];
  if (alder < 8) return ['sovn', 'mat', 'bleie', 'aktivitet', 'signaler', 'notat'];
  if (alder < 12) return ['sovn', 'mat', 'bleie', 'aktivitet', 'medisin', 'notat'];
  return ['sovn', 'mat', 'aktivitet', 'medisin', 'vekt', 'notat'];
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
                if (fødselsdato) {
                  setFavoritter(hentAnbefalte(alderIMåneder()));
                }
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
            Vi har foreslått basert på {babyNavn}s alder ({alderTekst()})
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
                  }}
                >
                  <span style={{ fontSize: '22px' }}>{item.ikon}</span>
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