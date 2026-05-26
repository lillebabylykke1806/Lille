'use client';
import { farger } from '../../lib/farger';
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

type Props = {
  bruker: any;
  onLoggUt: () => void;
};

export default function Profil({ bruker, onLoggUt }: Props) {
  const [babyNavn, setBabyNavn] = useState('');
  const [babyFødselsdato, setBabyFødselsdato] = useState('');
  const [babyBilde, setBabyBilde] = useState(null);
  const [lagret, setLagret] = useState(false);

  useEffect(() => {
    const lastProfil = async () => {
      const { data: profil } = await supabase
        .from('profiler')
        .select('*')
        .eq('id', bruker.id)
        .single();
      if (profil?.baby_navn) setBabyNavn(profil.baby_navn);
      if (profil?.fødselsdato) setBabyFødselsdato(profil.fødselsdato);
      const lagretBilde = localStorage.getItem('lille_babybilde');
      if (lagretBilde) setBabyBilde(lagretBilde);
    };
    lastProfil();
  }, [bruker]);

  const håndterBilde = (e) => {
    const fil = e.target.files[0];
    if (!fil) return;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = () => {
      const maks = 300;
      let b = img.width, h = img.height;
      if (b > h) { h = Math.round(h * maks / b); b = maks; } else { b = Math.round(b * maks / h); h = maks; }
      canvas.width = b; canvas.height = h;
      ctx.drawImage(img, 0, 0, b, h);
      const k = canvas.toDataURL('image/jpeg', 0.8);
      setBabyBilde(k);
      try { localStorage.setItem('lille_babybilde', k); } catch (e) { }
    };
    img.src = URL.createObjectURL(fil);
  };

  const lagreProfil = async () => {
    await supabase.from('profiler').upsert({
      id: bruker.id,
      baby_navn: babyNavn,
      fødselsdato: babyFødselsdato,
    });
    setLagret(true);
    setTimeout(() => setLagret(false), 2000);
  };

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ fontSize: '11px', letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: 'sans-serif', color: farger.tekstLys, marginBottom: '20px' }}>Profil</div>

      {/* Babybilde */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
        <label style={{ cursor: 'pointer' }}>
          <div style={{ width: '110px', height: '110px', borderRadius: '50%', backgroundColor: farger.krem, border: `2px solid ${farger.kremMørk}`, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', position: 'relative' }}>
            {babyBilde ? (
              <img src={babyBilde} alt="Baby" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <img src="/baby-ansikt.png" alt="Baby" style={{ width: '70px', height: '70px', objectFit: 'contain', mixBlendMode: 'multiply' }} />
            )}
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.3)', padding: '6px', textAlign: 'center' }}>
              <span style={{ fontSize: '10px', color: '#fff', fontFamily: 'sans-serif' }}>Endre</span>
            </div>
          </div>
          <input type="file" accept="image/*" onChange={håndterBilde} style={{ display: 'none' }} />
        </label>
      </div>

      {/* Skjema */}
      <div style={{ backgroundColor: farger.hvit, border: `1px solid ${farger.kremMørk}`, borderRadius: '16px', padding: '20px', marginBottom: '16px' }}>
        <div style={{ fontSize: '10px', letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: 'sans-serif', color: farger.tekstLys, marginBottom: '8px' }}>Babyens navn</div>
        <input
          type="text"
          value={babyNavn}
          onChange={(e) => setBabyNavn(e.target.value)}
          placeholder="Skriv navn her..."
          style={{ width: '100%', padding: '12px 14px', fontSize: '15px', border: `1px solid ${farger.kremMørk}`, borderRadius: '10px', backgroundColor: farger.bakgrunn, color: farger.tekst, marginBottom: '16px', outline: 'none', fontFamily: 'Georgia, serif', boxSizing: 'border-box' }}
        />
        <div style={{ fontSize: '10px', letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: 'sans-serif', color: farger.tekstLys, marginBottom: '8px' }}>Fødselsdato</div>
        <input
          type="date"
          value={babyFødselsdato}
          onChange={(e) => setBabyFødselsdato(e.target.value)}
          style={{ width: '100%', padding: '12px 14px', fontSize: '15px', border: `1px solid ${farger.kremMørk}`, borderRadius: '10px', backgroundColor: farger.bakgrunn, color: farger.tekst, marginBottom: '16px', outline: 'none', fontFamily: 'sans-serif', boxSizing: 'border-box' }}
        />
        <button
          onClick={lagreProfil}
          style={{ width: '100%', padding: '14px', backgroundColor: lagret ? farger.grønnLys : farger.grønn, border: 'none', borderRadius: '10px', fontSize: '12px', fontWeight: '600', color: lagret ? farger.grønn : '#FDFAF6', cursor: 'pointer', letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: 'sans-serif', transition: 'all 0.3s' }}
        >
          {lagret ? '✓ Lagret!' : 'Lagre profil'}
        </button>
      </div>

      {/* Logg ut */}
      <button
        onClick={onLoggUt}
        style={{ width: '100%', padding: '14px', backgroundColor: 'transparent', border: `1px solid ${farger.kremMørk}`, borderRadius: '10px', fontSize: '12px', color: farger.tekstLys, cursor: 'pointer', fontFamily: 'sans-serif' }}
      >
        Logg ut
      </button>
    </div>
  );
}