'use client';
import { farger } from '../../lib/farger';
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useLanguage } from '../../lib/i18n/LanguageContext';
import BarnVelger from './BarnVelger';
import Innstillinger from './Innstillinger';

type Props = {
  bruker: any;
  onLoggUt: () => void;
  aktivtBarn?: any;
  onByttBarn?: (barn: any) => void;
};

export default function Profil({ bruker, onLoggUt, aktivtBarn, onByttBarn }: Props) {
  const { t } = useLanguage();
  const [babyNavn, setBabyNavn] = useState('');
  const [babyFødselsdato, setBabyFødselsdato] = useState('');
  const [babyBilde, setBabyBilde] = useState<string | null>(null);
  const [lagret, setLagret] = useState(false);
  const [lasterBilde, setLasterBilde] = useState(false);
  const [visTilbakemelding, setVisTilbakemelding] = useState(false);
  const [tilbakemeldingTekst, setTilbakemeldingTekst] = useState('');
  const [sendt, setSendt] = useState(false);
  const [sender, setSender] = useState(false);
  const [visRedigerProfil, setVisRedigerProfil] = useState(false);
  const [visBarnVelger, setVisBarnVelger] = useState(false);
  const [visInnstillinger, setVisInnstillinger] = useState(false);
  const [brukernavn, setBrukernavn] = useState('');
  const [visPartnerModal, setVisPartnerModal] = useState(false);
  const [partnerEpost, setPartnerEpost] = useState('');
  const [senderInvitasjon, setSenderInvitasjon] = useState(false);
  const [invitasjonSendt, setInvitasjonSendt] = useState(false);
  const [visInviterModal, setVisInviterModal] = useState(false);
  const [kopiert, setKopiert] = useState(false);
  const [harPartner, setHarPartner] = useState(false);

  useEffect(() => {
    const lastProfil = async () => {
      try {
        const lagretNavn = localStorage.getItem(`lille_brukernavn_${bruker.id}`);
        if (lagretNavn) setBrukernavn(lagretNavn);
      } catch {}

      const { data: barn } = await supabase
        .from('barn')
        .select('*')
        .eq('bruker_id', bruker.id)
        .order('opprettet', { ascending: true })
        .limit(1)
        .single();
      if (barn?.navn) setBabyNavn(barn.navn);
      if (barn?.fødselsdato) setBabyFødselsdato(barn.fødselsdato);

      const { data } = supabase.storage
        .from('babybilde')
        .getPublicUrl(`${bruker.id}/profil.jpg`);
      if (data?.publicUrl) {
        const res = await fetch(data.publicUrl, { method: 'HEAD' });
        if (res.ok) setBabyBilde(data.publicUrl + '?t=' + Date.now());
      }
    };
    lastProfil();
  }, [bruker]);

  useEffect(() => {
    const sjekkPartner = async () => {
      const { data: barn } = await supabase.from('barn').select('id').eq('bruker_id', bruker.id).single();
      if (!barn) return;
      const { data: tilgang } = await supabase.from('barn_tilgang').select('*').eq('barn_id', barn.id);
      if (tilgang && tilgang.length > 0) setHarPartner(true);
      else {
        const { data: invitasjon } = await supabase.from('partner_invitasjoner').select('*').eq('barn_id', barn.id).eq('akseptert', false);
        if (invitasjon && invitasjon.length > 0) setHarPartner(true);
      }
    };
    sjekkPartner();
  }, [bruker.id]);

  const håndterBilde = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fil = e.target.files?.[0];
    if (!fil) return;
    setLasterBilde(true);

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = async () => {
      const maks = 300;
      let b = img.width, h = img.height;
      if (b > h) { h = Math.round(h * maks / b); b = maks; } else { b = Math.round(b * maks / h); h = maks; }
      canvas.width = b; canvas.height = h;
      ctx?.drawImage(img, 0, 0, b, h);

      canvas.toBlob(async (blob) => {
        if (!blob) { setLasterBilde(false); return; }

        const { error } = await supabase.storage
          .from('babybilde')
          .upload(`${bruker.id}/profil.jpg`, blob, {
            upsert: true,
            contentType: 'image/jpeg',
          });

        if (!error) {
          const { data } = supabase.storage
            .from('babybilde')
            .getPublicUrl(`${bruker.id}/profil.jpg`);
          setBabyBilde(data.publicUrl + '?t=' + Date.now());
          try { localStorage.setItem(`lille_babybilde_${bruker.id}`, data.publicUrl); } catch {}
        }
        setLasterBilde(false);
      }, 'image/jpeg', 0.8);
    };
    img.src = URL.createObjectURL(fil);
  };

  const lagreProfil = async () => {
    try {
      if (brukernavn.trim()) {
        localStorage.setItem(`lille_brukernavn_${bruker.id}`, brukernavn.trim());
      }
    } catch {}
    await supabase.from('barn').update({
      navn: babyNavn,
      fødselsdato: babyFødselsdato,
    }).eq('bruker_id', bruker.id);
    setLagret(true);
    setTimeout(() => {
      setLagret(false);
      setVisRedigerProfil(false);
    }, 2000);
  };

  const visningsNavn = brukernavn || bruker.email?.split('@')[0] || 'Bruker';

  const babyMåneder = babyFødselsdato
    ? Math.floor((new Date().getTime() - new Date(babyFødselsdato).getTime()) / (1000 * 60 * 60 * 24 * 30.5))
    : null;

  const åpneAbonnement = async () => {
    const res = await fetch('/api/portal-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: bruker.email }),
    });
    const { url } = await res.json();
    if (url) window.location.href = url;
  };

  const sendPartnerInvitasjon = async () => {
    if (!partnerEpost.trim()) return;
    setSenderInvitasjon(true);
    const { data: barn } = await supabase.from('barn').select('*').eq('bruker_id', bruker.id).single();
    await fetch('/api/inviter-partner', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        invitert_epost: partnerEpost.trim(),
        barn_id: barn?.id,
        barn_navn: barn?.navn || 'babyen',
        invitert_av_epost: bruker.email,
      }),
    });
    setSenderInvitasjon(false);
    setInvitasjonSendt(true);
  };

  if (visInnstillinger) {
    return <Innstillinger onTilbake={() => setVisInnstillinger(false)} />;
  }

  return (
    <div style={{ backgroundColor: farger.bakgrunn, minHeight: '100vh', padding: '0 0 100px' }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* Header */}
      <div style={{ padding: '24px 24px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div style={{ fontSize: '28px', fontFamily: 'var(--font-plus-jakarta)', color: farger.tekst, fontWeight: '700' }}>Mer</div>
        <button style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '8px' }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path d="M18 8C18 6.4 17.4 4.9 16.2 3.8C15.1 2.6 13.6 2 12 2C10.4 2 8.9 2.6 7.8 3.8C6.6 4.9 6 6.4 6 8C6 15 3 17 3 17H21C21 17 18 15 18 8Z" stroke={farger.tekstLys} strokeWidth="1.5" fill="none"/>
            <path d="M13.7 21C13.5 21.6 12.8 22 12 22C11.2 22 10.5 21.6 10.3 21" stroke={farger.tekstLys} strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </button>
      </div>

      {/* Motivasjonskort */}
      <div style={{ margin: '0 24px 20px', backgroundColor: farger.hvit, border: `1px solid ${farger.kremMørk}`, borderRadius: '20px', padding: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: farger.terrakottaLys, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M12 21C12 21 3 15 3 9C3 6.5 5 4.5 7.5 4.5C9.2 4.5 10.7 5.4 12 7C13.3 5.4 14.8 4.5 16.5 4.5C19 4.5 21 6.5 21 9C21 15 12 21 12 21Z" fill={farger.terrakotta} opacity="0.6"/>
          </svg>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '14px', fontFamily: 'var(--font-plus-jakarta)', color: farger.tekst, fontWeight: '600', lineHeight: 1.4 }}>Du gjør en fantastisk jobb,</div>
          <div style={{ fontSize: '13px', fontFamily: 'var(--font-inter)', color: farger.tekstLys, lineHeight: 1.4 }}>små steg hver dag blir til store fremskritt.</div>
        </div>
        <div style={{ fontSize: '32px', flexShrink: 0 }}>🌿</div>
      </div>

      {/* Profil-kort */}
      <button onClick={() => setVisRedigerProfil(true)} style={{ margin: '0 24px 20px', width: 'calc(100% - 48px)', backgroundColor: farger.hvit, border: `1px solid ${farger.kremMørk}`, borderRadius: '20px', padding: '16px', cursor: 'pointer', textAlign: 'left' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <label onClick={e => e.stopPropagation()} style={{ cursor: 'pointer', flexShrink: 0 }}>
            <div style={{ position: 'relative' }}>
              <div style={{ width: '60px', height: '60px', borderRadius: '50%', overflow: 'hidden', backgroundColor: farger.krem, border: `2px solid ${farger.kremMørk}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {lasterBilde ? (
                  <div style={{ width: '20px', height: '20px', border: `2px solid ${farger.grønn}`, borderTop: '2px solid transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                ) : babyBilde ? (
                  <img src={babyBilde} alt="Baby" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <img src="/baby-ansikt.png" alt="Baby" style={{ width: '40px', height: '40px', objectFit: 'contain', mixBlendMode: 'multiply' }} />
                )}
              </div>
              <div style={{ position: 'absolute', bottom: '0', right: '0', width: '18px', height: '18px', borderRadius: '50%', backgroundColor: farger.grønn, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
                  <path d="M12 5V19M5 12H19" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
                </svg>
              </div>
            </div>
            <input type="file" accept="image/*" onChange={håndterBilde} style={{ display: 'none' }} />
          </label>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '18px', fontFamily: 'var(--font-plus-jakarta)', color: farger.tekst, fontWeight: '700' }}>{visningsNavn} 🌸</div>
            <div style={{ fontSize: '13px', fontFamily: 'var(--font-inter)', color: farger.tekstLys }}>
              {babyNavn || t('profil.babyen')}{babyMåneder !== null ? ` · ${babyMåneder} ${t('profil.måneder')}` : ''}
            </div>
            <div style={{ marginTop: '6px', display: 'inline-flex', alignItems: 'center', gap: '4px', backgroundColor: '#FFF8EC', border: '1px solid #F4D9A0', borderRadius: '20px', padding: '3px 10px' }}>
              <span style={{ fontSize: '12px' }}>👑</span>
              <span style={{ fontSize: '11px', fontFamily: 'var(--font-inter)', color: '#8B6340', fontWeight: '600' }}>Premium aktiv</span>
            </div>
          </div>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M6 4L10 8L6 12" stroke={farger.tekstLys} strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </div>
      </button>

      {/* Barn */}
      <div style={{ padding: '0 24px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="8" r="4" stroke={farger.tekst} strokeWidth="1.5"/>
            <path d="M4 20C4 16.69 7.58 14 12 14C16.42 14 20 16.69 20 20" stroke={farger.tekst} strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          <div style={{ fontSize: '15px', fontFamily: 'var(--font-plus-jakarta)', color: farger.tekst, fontWeight: '700' }}>Barn</div>
        </div>
        <div style={{ backgroundColor: farger.hvit, border: `1px solid ${farger.kremMørk}`, borderRadius: '16px', overflow: 'hidden' }}>
          <button onClick={() => setVisBarnVelger(true)} style={{ width: '100%', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '14px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: farger.grønnLys, border: `2px solid ${farger.grønn}`, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
              {babyBilde ? (
                <img src={babyBilde} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <span style={{ fontSize: '16px', fontFamily: 'var(--font-plus-jakarta)', color: farger.grønn, fontWeight: '700' }}>{(aktivtBarn?.navn || babyNavn)?.charAt(0) || '?'}</span>
              )}
            </div>
            <span style={{ flex: 1, fontSize: '15px', fontFamily: 'var(--font-inter)', color: farger.tekst }}>{aktivtBarn?.navn || babyNavn || t('profil.babyen')}</span>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M6 4L10 8L6 12" stroke={farger.tekstLys} strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Familie */}
      <div style={{ padding: '0 24px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <circle cx="9" cy="7" r="3" stroke={farger.tekst} strokeWidth="1.5"/>
            <circle cx="15" cy="7" r="3" stroke={farger.tekst} strokeWidth="1.5"/>
            <path d="M3 20C3 17 5.69 14.5 9 14.5" stroke={farger.tekst} strokeWidth="1.5" strokeLinecap="round"/>
            <path d="M15 14.5C18.31 14.5 21 17 21 20" stroke={farger.tekst} strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          <div style={{ fontSize: '15px', fontFamily: 'var(--font-plus-jakarta)', color: farger.tekst, fontWeight: '700' }}>Familie</div>
        </div>
        <div style={{ backgroundColor: farger.hvit, border: `1px solid ${farger.kremMørk}`, borderRadius: '16px', overflow: 'hidden' }}>
          <button onClick={() => setVisPartnerModal(true)} style={{ width: '100%', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '14px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: farger.grønnLys, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <circle cx="9" cy="7" r="3" stroke={farger.grønn} strokeWidth="1.5"/>
                <circle cx="15" cy="7" r="3" stroke={farger.grønn} strokeWidth="1.5"/>
                <path d="M3 20C3 17 5.69 14.5 9 14.5" stroke={farger.grønn} strokeWidth="1.5" strokeLinecap="round"/>
                <path d="M15 14.5C18.31 14.5 21 17 21 20" stroke={farger.grønn} strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </div>
            <span style={{ flex: 1, fontSize: '15px', fontFamily: 'var(--font-inter)', color: farger.tekst }}>Del data med partner</span>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M6 4L10 8L6 12" stroke={farger.tekstLys} strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Lille */}
      <div style={{ padding: '0 24px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M12 2L14.4 9.6H22L15.8 14.4L18.2 22L12 17.2L5.8 22L8.2 14.4L2 9.6H9.6L12 2Z" fill={farger.tekst} opacity="0.7"/>
          </svg>
          <div style={{ fontSize: '15px', fontFamily: 'var(--font-plus-jakarta)', color: farger.tekst, fontWeight: '700' }}>Lille</div>
        </div>
        <div style={{ backgroundColor: farger.hvit, border: `1px solid ${farger.kremMørk}`, borderRadius: '16px', overflow: 'hidden' }}>
          {[
            { ikon: '👑', bg: '#FFF8EC', tittel: 'Mitt abonnement', undertekst: 'Premium aktiv', onClick: åpneAbonnement },
            { ikon: '🎁', bg: '#F0F7F0', tittel: 'Inviter en venn', undertekst: 'Dere får begge 1 måned gratis', onClick: () => setVisInviterModal(true) },
            { ikon: '💬', bg: '#EEF2FF', tittel: 'Send tilbakemelding', undertekst: 'Hjelp oss å bli enda bedre', onClick: () => setVisTilbakemelding(true) },
          ].map((item, i, arr) => (
            <button key={i} onClick={item.onClick} style={{ width: '100%', padding: '14px 20px', display: 'flex', alignItems: 'center', gap: '14px', background: 'none', border: 'none', borderBottom: i < arr.length - 1 ? `1px solid ${farger.kremMørk}` : 'none', cursor: 'pointer', textAlign: 'left' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: item.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', flexShrink: 0 }}>{item.ikon}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '14px', fontFamily: 'var(--font-inter)', color: farger.tekst, fontWeight: '500' }}>{item.tittel}</div>
                <div style={{ fontSize: '12px', fontFamily: 'var(--font-inter)', color: farger.tekstLys }}>{item.undertekst}</div>
              </div>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M6 4L10 8L6 12" stroke={farger.tekstLys} strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </button>
          ))}
        </div>
      </div>

      {/* Innstillinger */}
      <div style={{ padding: '0 24px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="3" stroke={farger.tekst} strokeWidth="1.5"/>
            <path d="M19.4 15C19.2 15.3 19.1 15.7 19.3 16L20.1 17.4C20.4 17.9 20.3 18.5 19.9 18.9L18.9 19.9C18.5 20.3 17.9 20.4 17.4 20.1L16 19.3C15.7 19.1 15.3 19.2 15 19.4L14.4 20.9C14.2 21.4 13.7 21.8 13.2 21.8H11.8C11.3 21.8 10.8 21.4 10.6 20.9L10 19.4C9.7 19.2 9.3 19.1 9 19.3L7.6 20.1C7.1 20.4 6.5 20.3 6.1 19.9L5.1 18.9C4.7 18.5 4.6 17.9 4.9 17.4L5.7 16C5.9 15.7 5.8 15.3 5.6 15L4.1 14.4C3.6 14.2 3.2 13.7 3.2 13.2V11.8C3.2 11.3 3.6 10.8 4.1 10.6L5.6 10C5.8 9.7 5.9 9.3 5.7 9L4.9 7.6C4.6 7.1 4.7 6.5 5.1 6.1L6.1 5.1C6.5 4.7 7.1 4.6 7.6 4.9L9 5.7C9.3 5.9 9.7 5.8 10 5.6L10.6 4.1C10.8 3.6 11.3 3.2 11.8 3.2H13.2C13.7 3.2 14.2 3.6 14.4 4.1L15 5.6C15.3 5.8 15.7 5.9 16 5.7L17.4 4.9C17.9 4.6 18.5 4.7 18.9 5.1L19.9 6.1C20.3 6.5 20.4 7.1 20.1 7.6L19.3 9C19.1 9.3 19.2 9.7 19.4 10L20.9 10.6C21.4 10.8 21.8 11.3 21.8 11.8V13.2C21.8 13.7 21.4 14.2 20.9 14.4L19.4 15Z" stroke={farger.tekst} strokeWidth="1.5"/>
          </svg>
          <div style={{ fontSize: '15px', fontFamily: 'var(--font-plus-jakarta)', color: farger.tekst, fontWeight: '700' }}>Innstillinger</div>
        </div>
        <div style={{ backgroundColor: farger.hvit, border: `1px solid ${farger.kremMørk}`, borderRadius: '16px', overflow: 'hidden' }}>
          {[
            { ikon: '⚙️', bg: '#F8FAFC', tittel: 'Innstillinger', onClick: () => setVisInnstillinger(true) },
            { ikon: '🔒', bg: '#F8FAFC', tittel: 'Personvern', onClick: () => window.open('https://lilleapp.no/personvern', '_blank') },
            { ikon: '❓', bg: '#F8FAFC', tittel: 'Hjelp & support', onClick: () => window.open('mailto:lillebabylykke@outlook.com?subject=Hjelp%20%26%20support%20-%20Lille', '_blank') },
          ].map((item, i, arr) => (
            <button key={i} onClick={item.onClick} style={{ width: '100%', padding: '14px 20px', display: 'flex', alignItems: 'center', gap: '14px', background: 'none', border: 'none', borderBottom: i < arr.length - 1 ? `1px solid ${farger.kremMørk}` : 'none', cursor: 'pointer', textAlign: 'left' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: item.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', flexShrink: 0 }}>{item.ikon}</div>
              <span style={{ flex: 1, fontSize: '14px', fontFamily: 'var(--font-inter)', color: farger.tekst, fontWeight: '500' }}>{item.tittel}</span>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M6 4L10 8L6 12" stroke={farger.tekstLys} strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </button>
          ))}
        </div>
      </div>

      {/* Bunn-sitat */}
      <div style={{ margin: '0 24px 20px', backgroundColor: farger.hvit, border: `1px solid ${farger.kremMørk}`, borderRadius: '20px', padding: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: farger.terrakottaLys, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M12 21C12 21 3 15 3 9C3 6.5 5 4.5 7.5 4.5C9.2 4.5 10.7 5.4 12 7C13.3 5.4 14.8 4.5 16.5 4.5C19 4.5 21 6.5 21 9C21 15 12 21 12 21Z" fill={farger.terrakotta} opacity="0.6"/>
          </svg>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '14px', fontFamily: 'var(--font-plus-jakarta)', color: farger.tekst, fontWeight: '600', lineHeight: 1.4 }}>Lille er her for å støtte deg</div>
          <div style={{ fontSize: '13px', fontFamily: 'var(--font-inter)', color: farger.tekstLys }}>i små og store øyeblikk.</div>
        </div>
        <div style={{ fontSize: '32px', flexShrink: 0 }}>🌿</div>
      </div>

      {/* Logg ut */}
      <div style={{ padding: '0 24px' }}>
        <button onClick={onLoggUt} style={{ width: '100%', padding: '14px', backgroundColor: 'transparent', border: `1px solid ${farger.kremMørk}`, borderRadius: '14px', fontSize: '14px', color: farger.tekstLys, cursor: 'pointer', fontFamily: 'var(--font-inter)' }}>
          {t('profil.loggUt')}
        </button>
      </div>

      {visRedigerProfil && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', zIndex: 200, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }} onClick={() => setVisRedigerProfil(false)}>
          <div onClick={e => e.stopPropagation()} style={{ backgroundColor: farger.hvit, width: '100%', maxWidth: '430px', borderRadius: '24px 24px 0 0', padding: '24px', paddingBottom: '48px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ width: '36px', height: '4px', backgroundColor: farger.kremMørk, borderRadius: '2px', margin: '0 auto 20px' }} />
            <div style={{ fontSize: '18px', fontFamily: 'var(--font-plus-jakarta)', color: farger.tekst, fontWeight: '700', marginBottom: '20px' }}>Rediger profil</div>

            <div style={{ fontSize: '12px', fontFamily: 'var(--font-inter)', color: farger.tekstLys, fontWeight: '600', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Ditt navn</div>
            <input type="text" value={brukernavn} onChange={e => setBrukernavn(e.target.value)} placeholder="F.eks. Isabella" style={{ width: '100%', padding: '12px 14px', fontSize: '15px', border: `1px solid ${farger.kremMørk}`, borderRadius: '12px', backgroundColor: farger.bakgrunn, color: farger.tekst, outline: 'none', fontFamily: 'var(--font-inter)', boxSizing: 'border-box', marginBottom: '16px' }} />

            <div style={{ fontSize: '12px', fontFamily: 'var(--font-inter)', color: farger.tekstLys, fontWeight: '600', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Babyens navn</div>
            <input type="text" value={babyNavn} onChange={e => setBabyNavn(e.target.value)} placeholder="F.eks. Wilhelm" style={{ width: '100%', padding: '12px 14px', fontSize: '15px', border: `1px solid ${farger.kremMørk}`, borderRadius: '12px', backgroundColor: farger.bakgrunn, color: farger.tekst, outline: 'none', fontFamily: 'var(--font-inter)', boxSizing: 'border-box', marginBottom: '16px' }} />

            <div style={{ fontSize: '12px', fontFamily: 'var(--font-inter)', color: farger.tekstLys, fontWeight: '600', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Fødselsdato</div>
            <input type="date" value={babyFødselsdato} onChange={e => setBabyFødselsdato(e.target.value)} style={{ width: '100%', padding: '12px 14px', fontSize: '15px', border: `1px solid ${farger.kremMørk}`, borderRadius: '12px', backgroundColor: farger.bakgrunn, color: farger.tekst, outline: 'none', fontFamily: 'var(--font-inter)', boxSizing: 'border-box', marginBottom: '24px' }} />

            <button onClick={lagreProfil} style={{ width: '100%', padding: '16px', backgroundColor: farger.grønn, border: 'none', borderRadius: '14px', fontSize: '15px', fontWeight: '600', color: '#FDFAF6', cursor: 'pointer', fontFamily: 'var(--font-inter)' }}>
              {lagret ? '✓ Lagret!' : 'Lagre'}
            </button>
          </div>
        </div>
      )}

      {/* Tilbakemelding modal */}
      {visTilbakemelding && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', zIndex: 200, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }} onClick={() => { setVisTilbakemelding(false); setSendt(false); setTilbakemeldingTekst(''); }}>
          <div onClick={e => e.stopPropagation()} style={{ backgroundColor: farger.hvit, width: '100%', maxWidth: '430px', borderRadius: '24px 24px 0 0', padding: '24px', paddingBottom: '48px' }}>
            <div style={{ width: '36px', height: '4px', backgroundColor: farger.kremMørk, borderRadius: '2px', margin: '0 auto 20px' }} />
            {sendt ? (
              <div style={{ textAlign: 'center', padding: '24px 0' }}>
                <div style={{ fontSize: '40px', marginBottom: '16px' }}>🤍</div>
                <div style={{ fontSize: '18px', fontFamily: 'var(--font-plus-jakarta)', color: farger.tekst, fontWeight: '700', marginBottom: '8px' }}>{t('profil.tusenTakk')}</div>
                <div style={{ fontSize: '13px', fontFamily: 'var(--font-inter)', color: farger.tekstLys, lineHeight: 1.7 }}>{t('profil.tilbakemeldingHjelper')}</div>
              </div>
            ) : (
              <>
                <div style={{ fontSize: '18px', fontFamily: 'var(--font-plus-jakarta)', color: farger.tekst, fontWeight: '700', marginBottom: '8px' }}>{t('profil.tilbakemeldingTittel')}</div>
                <div style={{ fontSize: '13px', fontFamily: 'var(--font-inter)', color: farger.tekstLys, marginBottom: '20px', lineHeight: 1.6 }}>{t('profil.tilbakemeldingBeskrivelse')}</div>
                <textarea
                  value={tilbakemeldingTekst}
                  onChange={e => setTilbakemeldingTekst(e.target.value)}
                  placeholder={t('profil.tilbakemeldingPlaceholder')}
                  style={{ width: '100%', padding: '14px 16px', fontSize: '14px', border: `1px solid ${farger.kremMørk}`, borderRadius: '12px', backgroundColor: farger.bakgrunn, color: farger.tekst, outline: 'none', fontFamily: 'var(--font-inter)', resize: 'none', minHeight: '120px', boxSizing: 'border-box', marginBottom: '16px' }}
                />
                <button
                  onClick={async () => {
                    if (!tilbakemeldingTekst.trim()) return;
                    setSender(true);
                    await fetch('/api/tilbakemelding', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ melding: tilbakemeldingTekst, epost: bruker.email }),
                    });
                    setSendt(true);
                    setSender(false);
                  }}
                  disabled={!tilbakemeldingTekst.trim() || sender}
                  style={{ width: '100%', padding: '16px', backgroundColor: tilbakemeldingTekst.trim() ? farger.grønn : farger.kremMørk, border: 'none', borderRadius: '16px', fontSize: '15px', fontWeight: '600', color: tilbakemeldingTekst.trim() ? '#FDFAF6' : farger.tekstLys, cursor: tilbakemeldingTekst.trim() ? 'pointer' : 'not-allowed', fontFamily: 'var(--font-inter)' }}
                >
                  {sender ? t('profil.sender') : t('profil.sendTilbakemeldingKnapp')}
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {visBarnVelger && (
        <BarnVelger
          bruker={bruker}
          aktivtBarnId={aktivtBarn?.id || null}
          onByttBarn={(barn) => { onByttBarn?.(barn); setVisBarnVelger(false); }}
          defaultVisMeny={true}
          onLukk={() => setVisBarnVelger(false)}
        />
      )}

      {visPartnerModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', zIndex: 200, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }} onClick={() => { setVisPartnerModal(false); setInvitasjonSendt(false); setPartnerEpost(''); }}>
          <div onClick={e => e.stopPropagation()} style={{ backgroundColor: farger.hvit, width: '100%', maxWidth: '430px', borderRadius: '24px 24px 0 0', padding: '24px', paddingBottom: '48px' }}>
            <div style={{ width: '36px', height: '4px', backgroundColor: farger.kremMørk, borderRadius: '2px', margin: '0 auto 20px' }} />
            {invitasjonSendt ? (
              <div style={{ textAlign: 'center', padding: '24px 0' }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>🤍</div>
                <div style={{ fontSize: '20px', fontFamily: 'var(--font-plus-jakarta)', color: farger.tekst, fontWeight: '700', marginBottom: '8px' }}>Invitasjon sendt!</div>
                <div style={{ fontSize: '14px', fontFamily: 'var(--font-inter)', color: farger.tekstLys, lineHeight: 1.6 }}>Vi har sendt en e-post til {partnerEpost} med en lenke for å komme i gang.</div>
              </div>
            ) : harPartner ? (
              <div style={{ textAlign: 'center', padding: '16px 0' }}>
                <div style={{ fontSize: '40px', marginBottom: '12px' }}>🤍</div>
                <div style={{ fontSize: '16px', fontFamily: 'var(--font-plus-jakarta)', color: farger.tekst, fontWeight: '700', marginBottom: '8px' }}>Partner er allerede lagt til</div>
                <div style={{ fontSize: '13px', fontFamily: 'var(--font-inter)', color: farger.tekstLys, lineHeight: 1.6 }}>Du kan kun dele med én partner. Ta kontakt med oss hvis du vil endre dette.</div>
              </div>
            ) : (
              <>
                <div style={{ fontSize: '20px', fontFamily: 'var(--font-plus-jakarta)', color: farger.tekst, fontWeight: '700', marginBottom: '8px' }}>Del med partner 🤍</div>
                <div style={{ fontSize: '13px', fontFamily: 'var(--font-inter)', color: farger.tekstLys, lineHeight: 1.6, marginBottom: '24px' }}>
                  Inviter partneren din til å se og registrere data for babyen. De får gratis tilgang – du betaler for begge.
                </div>
                <div style={{ fontSize: '12px', fontFamily: 'var(--font-inter)', color: farger.tekstLys, fontWeight: '600', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Partners e-post</div>
                <input
                  type="email"
                  value={partnerEpost}
                  onChange={e => setPartnerEpost(e.target.value)}
                  placeholder="partner@epost.no"
                  style={{ width: '100%', padding: '12px 14px', fontSize: '15px', border: `1px solid ${farger.kremMørk}`, borderRadius: '12px', backgroundColor: farger.bakgrunn, color: farger.tekst, outline: 'none', fontFamily: 'var(--font-inter)', boxSizing: 'border-box', marginBottom: '20px' }}
                />
                <button
                  onClick={sendPartnerInvitasjon}
                  disabled={!partnerEpost.trim() || senderInvitasjon}
                  style={{ width: '100%', padding: '16px', backgroundColor: partnerEpost.trim() ? farger.grønn : farger.kremMørk, border: 'none', borderRadius: '14px', fontSize: '15px', fontWeight: '600', color: partnerEpost.trim() ? '#FDFAF6' : farger.tekstLys, cursor: partnerEpost.trim() ? 'pointer' : 'not-allowed', fontFamily: 'var(--font-inter)' }}>
                  {senderInvitasjon ? 'Sender...' : 'Send invitasjon 🤍'}
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {visInviterModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', zIndex: 200, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }} onClick={() => setVisInviterModal(false)}>
          <div onClick={e => e.stopPropagation()} style={{ backgroundColor: farger.hvit, width: '100%', maxWidth: '430px', borderRadius: '24px 24px 0 0', padding: '24px', paddingBottom: '48px' }}>
            <div style={{ width: '36px', height: '4px', backgroundColor: farger.kremMørk, borderRadius: '2px', margin: '0 auto 20px' }} />
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <div style={{ fontSize: '40px', marginBottom: '12px' }}>🎁</div>
              <div style={{ fontSize: '20px', fontFamily: 'var(--font-plus-jakarta)', color: farger.tekst, fontWeight: '700', marginBottom: '8px' }}>Del Lille med en venn</div>
              <div style={{ fontSize: '14px', fontFamily: 'var(--font-inter)', color: farger.tekstLys, lineHeight: 1.6 }}>
                Del appen med en venn som har baby
              </div>
            </div>
            <div style={{ backgroundColor: farger.bakgrunn, borderRadius: '16px', padding: '20px', marginBottom: '16px', textAlign: 'center' }}>
              <div style={{ fontSize: '12px', fontFamily: 'var(--font-inter)', color: farger.tekstLys, marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Din rabattkode</div>
              <div style={{ fontSize: '32px', fontFamily: 'var(--font-plus-jakarta)', color: farger.tekst, fontWeight: '700', letterSpacing: '4px', marginBottom: '4px' }}>VENN20</div>
              <div style={{ fontSize: '12px', fontFamily: 'var(--font-inter)', color: farger.tekstLys }}>20% rabatt de første 2 månedene</div>
            </div>
            <button onClick={() => { 
              navigator.clipboard.writeText('Prøv Lille – appen som hjelper deg å forstå babyen din bedre! 🌙\n\nBruk koden VENN20 for 20% rabatt de første 2 månedene.\n\nLast ned her: https://lilleapp.no'); 
              setKopiert(true); 
              setTimeout(() => setKopiert(false), 3000); 
            }} style={{ width: '100%', padding: '16px', backgroundColor: farger.grønn, border: 'none', borderRadius: '16px', fontSize: '15px', fontWeight: '600', color: '#FDFAF6', cursor: 'pointer', fontFamily: 'var(--font-inter)', marginBottom: '10px' }}>
              {kopiert ? '✓ Kopiert!' : 'Kopier delingstekst'}
            </button>
            <button onClick={() => { 
              const tekst = encodeURIComponent('Prøv Lille – appen som hjelper deg å forstå babyen din bedre! 🌙\n\nBruk koden VENN20 for 20% rabatt de første 2 månedene.\n\nLast ned her: https://lilleapp.no'); 
              window.open(`sms:?body=${tekst}`); 
            }} style={{ width: '100%', padding: '16px', backgroundColor: 'transparent', border: `1px solid ${farger.kremMørk}`, borderRadius: '16px', fontSize: '14px', color: farger.tekstLys, cursor: 'pointer', fontFamily: 'var(--font-inter)' }}>
              Send som SMS
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
