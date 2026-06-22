'use client';
import { farger } from '../../lib/farger';
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useLanguage } from '../../lib/i18n/LanguageContext';
import { SPRÅK_NAVN, SPRÅK_FLAGG, Locale } from '../../lib/i18n/translations';

const SPRÅK_KODER: Locale[] = ['no', 'en', 'sv', 'da', 'de'];

type Props = {
  bruker: any;
  onLoggUt: () => void;
};

export default function Profil({ bruker, onLoggUt }: Props) {
  const { locale, setLocale, t } = useLanguage();
  const [babyNavn, setBabyNavn] = useState('');
  const [babyFødselsdato, setBabyFødselsdato] = useState('');
  const [babyBilde, setBabyBilde] = useState<string | null>(null);
  const [lagret, setLagret] = useState(false);
  const [lasterBilde, setLasterBilde] = useState(false);
  const [visTilbakemelding, setVisTilbakemelding] = useState(false);
const [tilbakemeldingTekst, setTilbakemeldingTekst] = useState('');
const [sendt, setSendt] = useState(false);
const [sender, setSender] = useState(false);

  useEffect(() => {
    const lastProfil = async () => {
      const { data: barn } = await supabase
        .from('barn')
        .select('*')
        .eq('bruker_id', bruker.id)
        .order('opprettet', { ascending: true })
        .limit(1)
        .single();
      if (barn?.navn) setBabyNavn(barn.navn);
      if (barn?.fødselsdato) setBabyFødselsdato(barn.fødselsdato);

      // Hent bilde fra Supabase Storage
      const { data } = supabase.storage
        .from('babybilde')
        .getPublicUrl(`${bruker.id}/profil.jpg`);
      if (data?.publicUrl) {
        // Sjekk om filen faktisk finnes
        const res = await fetch(data.publicUrl, { method: 'HEAD' });
        if (res.ok) setBabyBilde(data.publicUrl + '?t=' + Date.now());
      }
    };
    lastProfil();
  }, [bruker]);

  const håndterBilde = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fil = e.target.files?.[0];
    if (!fil) return;
    setLasterBilde(true);

    // Komprimer bildet
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

        // Last opp til Supabase Storage
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
          // Behold localStorage som backup
          try { localStorage.setItem(`lille_babybilde_${bruker.id}`, data.publicUrl); } catch {}
        }
        setLasterBilde(false);
      }, 'image/jpeg', 0.8);
    };
    img.src = URL.createObjectURL(fil);
  };

  const lagreProfil = async () => {
    await supabase.from('barn').update({
      navn: babyNavn,
      fødselsdato: babyFødselsdato,
    }).eq('bruker_id', bruker.id);
    setLagret(true);
    setTimeout(() => setLagret(false), 2000);
  };

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ fontSize: '11px', letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: 'var(--font-inter), sans-serif', color: farger.tekstLys, marginBottom: '20px' }}>{t('profil.tittel')}</div>

      {/* Babybilde */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
        <label style={{ cursor: 'pointer' }}>
          <div style={{ position: 'relative' }}>
            <div style={{ width: '110px', height: '110px', borderRadius: '50%', backgroundColor: farger.krem, border: `2px solid ${farger.kremMørk}`, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
              {lasterBilde ? (
                <div style={{ width: '28px', height: '28px', border: `2px solid ${farger.grønn}`, borderTop: '2px solid transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
              ) : babyBilde ? (
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
        <div style={{ fontSize: '10px', letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: 'var(--font-inter), sans-serif', color: farger.tekstLys, marginBottom: '8px' }}>{t('profil.babynsNavn')}</div>
        <input
          type="text"
          value={babyNavn}
          onChange={(e) => setBabyNavn(e.target.value)}
          placeholder={t('profil.skrivNavnHer')}
          style={{ width: '100%', padding: '12px 14px', fontSize: '15px', border: `1px solid ${farger.kremMørk}`, borderRadius: '10px', backgroundColor: farger.bakgrunn, color: farger.tekst, marginBottom: '16px', outline: 'none', fontFamily: 'var(--font-plus-jakarta), sans-serif', boxSizing: 'border-box' }}
        />
        <div style={{ fontSize: '10px', letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: 'var(--font-inter), sans-serif', color: farger.tekstLys, marginBottom: '8px' }}>{t('profil.fødselsdato')}</div>
        <input
          type="date"
          value={babyFødselsdato}
          onChange={(e) => setBabyFødselsdato(e.target.value)}
          style={{ width: '100%', padding: '12px 14px', fontSize: '15px', border: `1px solid ${farger.kremMørk}`, borderRadius: '10px', backgroundColor: farger.bakgrunn, color: farger.tekst, marginBottom: '16px', outline: 'none', fontFamily: 'var(--font-inter), sans-serif', boxSizing: 'border-box' }}
        />
        <button
          onClick={lagreProfil}
          style={{ width: '100%', padding: '14px', backgroundColor: lagret ? farger.grønnLys : farger.grønn, border: 'none', borderRadius: '10px', fontSize: '12px', fontWeight: '600', color: lagret ? farger.grønn : '#FDFAF6', cursor: 'pointer', letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: 'var(--font-inter), sans-serif', transition: 'all 0.3s' }}
        >
          {lagret ? t('profil.lagretBekreftelse') : t('profil.lagreProfil')}
        </button>
        <div style={{ fontSize: '10px', letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: 'var(--font-inter), sans-serif', color: farger.tekstLys, marginBottom: '8px', marginTop: '16px' }}>{t('profil.språk')}</div>
        <div style={{ display: 'flex', gap: '6px' }}>
          {SPRÅK_KODER.map((code) => (
            <button
              key={code}
              type="button"
              onClick={() => setLocale(code)}
              style={{
                flex: 1,
                padding: '10px 4px',
                borderRadius: '10px',
                border: locale === code ? `2px solid ${farger.grønn}` : `1px solid ${farger.kremMørk}`,
                backgroundColor: locale === code ? farger.grønnLys : farger.bakgrunn,
                color: locale === code ? farger.grønn : farger.tekstLys,
                cursor: 'pointer',
                fontFamily: 'var(--font-inter), sans-serif',
                fontSize: '10px',
                fontWeight: locale === code ? '600' : '400',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <span style={{ fontSize: '18px', lineHeight: 1 }}>{SPRÅK_FLAGG[code]}</span>
              <span style={{ lineHeight: 1.2, textAlign: 'center' }}>{SPRÅK_NAVN[code]}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Administrer abonnement */}
<button
  onClick={async () => {
    const res = await fetch('/api/portal-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: bruker.email }),
    });
    const { url } = await res.json();
    if (url) window.location.href = url;
  }}
  style={{ width: '100%', padding: '10px', backgroundColor: 'transparent', border: 'none', fontSize: '12px', color: farger.tekstLys, cursor: 'pointer', fontFamily: 'var(--font-inter), sans-serif', textDecoration: 'underline', marginBottom: '8px' }}
>
  {t('profil.administrerAbonnement')}
</button>

{/* Tilbakemelding */}
<button
  onClick={() => setVisTilbakemelding(true)}
  style={{ width: '100%', padding: '10px', backgroundColor: 'transparent', border: 'none', fontSize: '12px', color: farger.tekstLys, cursor: 'pointer', fontFamily: 'var(--font-inter), sans-serif', textDecoration: 'underline', marginBottom: '8px' }}
>
  {t('profil.sendTilbakemelding')}
</button>

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

      {/* Logg ut */}
      <button
        onClick={onLoggUt}
        style={{ width: '100%', padding: '14px', backgroundColor: 'transparent', border: `1px solid ${farger.kremMørk}`, borderRadius: '10px', fontSize: '12px', color: farger.tekstLys, cursor: 'pointer', fontFamily: 'var(--font-inter), sans-serif' }}
      >
        {t('profil.loggUt')}
      </button>

      {babyFødselsdato && (
        <div style={{ backgroundColor: farger.hvit, border: `1px solid ${farger.kremMørk}`, borderRadius: '16px', padding: '20px', marginTop: '16px' }}>
          <div style={{ fontSize: '10px', letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: 'var(--font-inter), sans-serif', color: farger.tekstLys, marginBottom: '12px' }}>{t('profil.basertPåAlder')}</div>
          {(() => {
            const måneder = Math.floor((new Date().getTime() - new Date(babyFødselsdato).getTime()) / (1000 * 60 * 60 * 24 * 30.5));
            const uker = Math.floor((new Date().getTime() - new Date(babyFødselsdato).getTime()) / (1000 * 60 * 60 * 24 * 7));
            const alder = uker < 12 ? `${uker} ${t('profil.uker')}` : måneder < 24 ? `${måneder} ${t('profil.måneder')}` : `${Math.floor(måneder / 12)} ${t('profil.år')}`;
            const søvn = måneder < 3 ? { min: 14, max: 17, lurer: t('profil.lurer45') } :
              måneder < 6 ? { min: 12, max: 15, lurer: t('profil.lurer34') } :
              måneder < 12 ? { min: 12, max: 14, lurer: t('profil.lurer23') } :
              { min: 11, max: 14, lurer: t('profil.lurer12') };
            return (
              <>
                <div style={{ fontSize: '18px', fontStyle: 'italic', color: farger.terrakotta, fontFamily: 'var(--font-plus-jakarta), sans-serif', marginBottom: '8px' }}>{t('profil.erGammel', { navn: babyNavn || t('profil.babyen'), alder })}</div>
                <div style={{ fontSize: '13px', fontFamily: 'var(--font-inter), sans-serif', color: farger.tekstLys, lineHeight: 1.6 }}>
                  {t('profil.anbefaltSøvn')}: {søvn.min}–{søvn.max} timer {t('profil.perDøgn')}<br />{søvn.lurer}
                </div>
              </>
            );
          })()}
        </div>
      )}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}