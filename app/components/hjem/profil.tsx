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
        <div style={{ position: 'relative' }}>
  <div style={{ width: '110px', height: '110px', borderRadius: '50%', backgroundColor: farger.krem, border: `2px solid ${farger.kremMørk}`, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
    {babyBilde ? (
      <img src={babyBilde} alt="Baby" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
    ) : (
      <img src="/baby-ansikt.png" alt="Baby" style={{ width: '70px', height: '70px', objectFit: 'contain', mixBlendMode: 'multiply' }} />
    )}
  </div>
  <div style={{ position: 'absolute', bottom: '4px', right: '4px', width: '28px', height: '28px', borderRadius: '50%', backgroundColor: farger.grønn, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
      <path d="M23 19C23 19.5304 22.7893 20.0391 22.4142 20.4142C22.0391 20.7893 21.5304 21 21 21H3C2.46957 21 1.96086 20.7893 1.58579 20.4142C1.21071 20.0391 1 19.5304 1 19V8C1 7.46957 1.21071 6.96086 1.58579 6.58579C1.96086 6.21071 2.46957 6 3 6H7L9 3H15L17 6H21C21.5304 6 22.0391 6.21071 22.4142 6.58579C22.7893 6.96086 23 7.46957 23 8V19Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="12" cy="13" r="4" stroke="white" strokeWidth="2"/>
    </svg>
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
      {babyFødselsdato && (
  <div style={{ backgroundColor: farger.hvit, border: `1px solid ${farger.kremMørk}`, borderRadius: '16px', padding: '20px', marginTop: '16px' }}>
    <div style={{ fontSize: '10px', letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: 'sans-serif', color: farger.tekstLys, marginBottom: '12px' }}>Basert på alder</div>
    {(() => {
      const måneder = Math.floor((new Date().getTime() - new Date(babyFødselsdato).getTime()) / (1000 * 60 * 60 * 24 * 30.5));
      const uker = Math.floor((new Date().getTime() - new Date(babyFødselsdato).getTime()) / (1000 * 60 * 60 * 24 * 7));
      const alder = uker < 12 ? `${uker} uker` : måneder < 24 ? `${måneder} måneder` : `${Math.floor(måneder / 12)} år`;
      const søvn = måneder < 3 ? { min: 14, max: 17, lurer: '4–5 lurer per dag' } :
        måneder < 6 ? { min: 12, max: 15, lurer: '3–4 lurer per dag' } :
        måneder < 12 ? { min: 12, max: 14, lurer: '2–3 lurer per dag' } :
        { min: 11, max: 14, lurer: '1–2 lurer per dag' };
      return (
        <>
          <div style={{ fontSize: '18px', fontStyle: 'italic', color: farger.terrakotta, fontFamily: 'Georgia, serif', marginBottom: '8px' }}>{babyNavn || 'Babyen'} er {alder} gammel</div>
          <div style={{ fontSize: '13px', fontFamily: 'sans-serif', color: farger.tekstLys, lineHeight: 1.6 }}>
            Anbefalt søvn: {søvn.min}–{søvn.max} timer per døgn<br />{søvn.lurer}
          </div>
        </>
      );
    })()}
  </div>
)}
    </div>
  );
}