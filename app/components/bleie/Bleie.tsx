'use client';
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { farger } from '../../lib/farger';
import { useLanguage } from '../../lib/i18n/LanguageContext';
import { OversettelseNøkkel } from '../../lib/i18n/translations';

type Props = { bruker: any; };

type BleieLogg = {
  id: number;
  type: string;
  tidspunkt: string;
  dato: string;
};

const dagensdato = () => new Date().toISOString().split('T')[0];

type TFn = (nøkkel: OversettelseNøkkel, variabler?: Record<string, string | number>) => string;

const getBleieTyper = (t: TFn) => [
  { id: 'våt', label: t('bleie.typeVåt') },
  { id: 'tørr', label: t('bleie.typeTørr') },
  { id: 'avføring', label: t('bleie.typeAvføring') },
];

const BleieIkon = ({ type, aktiv }: { type: string; aktiv: boolean }) => {
  const farge = aktiv ? farger.grønn : farger.tekstLys;
  if (type === 'våt') return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
      <path d="M12 3C12 3 5 10 5 15C5 18.87 8.13 22 12 22C15.87 22 19 18.87 19 15C19 10 12 3 12 3Z" stroke={farge} strokeWidth="1.5" fill={aktiv ? `${farger.grønn}20` : 'none'}/>
      <path d="M9 15C9 15 10 18 12 18" stroke={farge} strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
  if (type === 'tørr') return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
      <path d="M12 3L14.5 8.5L20.5 9.3L16.3 13.4L17.3 19.4L12 16.6L6.7 19.4L7.7 13.4L3.5 9.3L9.5 8.5L12 3Z" stroke={farge} strokeWidth="1.5" fill={aktiv ? `${farger.grønn}20` : 'none'} strokeLinejoin="round"/>
    </svg>
  );
  if (type === 'avføring') return (
    <img src="/bleie.png" style={{ width: 28, height: 28, objectFit: 'contain' }} />
  );
  return <div style={{ width: 28, height: 28 }} />;
};

export default function Bleie({ bruker }: Props) {
  const { t } = useLanguage();
  const BLEIE_TYPER = getBleieTyper(t);
  const [tidspunkt, setTidspunkt] = useState(() =>
    new Date().toLocaleTimeString('no-NO', { hour: '2-digit', minute: '2-digit' })
  );
  const [logg, setLogg] = useState<BleieLogg[]>([]);
  const [valgt, setValgt] = useState<string | null>(null);
  const [notat, setNotat] = useState('');
  const [lagrer, setLagrer] = useState(false);
  const [visBekreftet, setVisBekreftet] = useState(false);

  const lastLogg = useCallback(async () => {
    const { data } = await supabase
      .from('bleie')
      .select('*')
      .eq('profil_id', bruker?.id)
      .eq('dato', dagensdato())
      .order('tidspunkt', { ascending: false });
    if (data) setLogg(data);
  }, [bruker?.id]);

  useEffect(() => {
    lastLogg();
  }, [lastLogg]);

  const registrerBleie = async () => {
    if (!valgt) return;
    setLagrer(true);
    await supabase.from('bleie').insert({
      profil_id: bruker?.id,
      dato: dagensdato(),
      type: valgt,
      tidspunkt,
      notat,
    });
    setLagrer(false);
    setVisBekreftet(true);
    setValgt(null);
    setNotat('');
    setTidspunkt(new Date().toLocaleTimeString('no-NO', { hour: '2-digit', minute: '2-digit' }));
    setTimeout(() => setVisBekreftet(false), 2000);
    lastLogg();
  };

  const antallBleier = logg.length;
  const sisteBytte = logg[0];

  return (
    <div style={{ backgroundColor: farger.bakgrunn, minHeight: '100vh', padding: '24px 24px 100px' }}>

      {/* Header */}
      <div style={{ marginBottom: '24px', textAlign: 'center' }}>
        <div style={{ fontSize: '26px', fontFamily: 'var(--font-plus-jakarta)', color: farger.tekst, fontWeight: '700', marginBottom: '4px' }}>
          {t('bleie.tittel')}
        </div>
        <div style={{ fontSize: '13px', fontFamily: 'var(--font-inter)', color: farger.tekstLys }}>
          {t('bleie.undertittel')}
        </div>
      </div>

      {/* Bekreftelses-animasjon */}
      {visBekreftet && (
        <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', backgroundColor: farger.grønnLys, border: `1px solid ${farger.grønn}`, borderRadius: '20px', padding: '20px 32px', zIndex: 200, textAlign: 'center', boxShadow: '0 8px 32px rgba(0,0,0,0.12)' }}>
          <div style={{ fontSize: '32px', marginBottom: '8px', color: farger.grønn }}>✓</div>
          <div style={{ fontSize: '14px', fontFamily: 'var(--font-inter)', color: farger.grønn, fontWeight: '600' }}>{t('bleie.registrert')}</div>
        </div>
      )}

      {/* Siste bytte */}
      {sisteBytte && (
        <div style={{ backgroundColor: farger.hvit, border: `1px solid ${farger.kremMørk}`, borderRadius: '16px', padding: '16px 20px', marginBottom: '12px' }}>
          <div style={{ fontSize: '12px', fontFamily: 'var(--font-inter)', color: farger.tekstLys, marginBottom: '8px' }}>{t('bleie.sisteBleieskift')}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <BleieIkon type={sisteBytte.type} aktiv={true} />
            <div>
              <div style={{ fontSize: '16px', fontFamily: 'var(--font-plus-jakarta)', color: farger.tekst, fontWeight: '600' }}>
                {BLEIE_TYPER.find(b => b.id === sisteBytte.type)?.label || sisteBytte.type}
              </div>
              <div style={{ fontSize: '12px', fontFamily: 'var(--font-inter)', color: farger.tekstLys }}>
                {sisteBytte.tidspunkt}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Innsikt */}
      {antallBleier > 0 && (
        <div style={{ backgroundColor: '#F5EDE8', borderRadius: '16px', padding: '16px 20px', marginBottom: '16px' }}>
          <div style={{ fontSize: '13px', fontFamily: 'var(--font-plus-jakarta)', color: farger.tekst, fontWeight: '600', marginBottom: '4px' }}>{t('bleie.innsikt')}</div>
          <div style={{ fontSize: '13px', fontFamily: 'var(--font-inter)', color: farger.tekstLys, lineHeight: 1.6 }}>
            {antallBleier >= 6
              ? t('bleie.innsiktFlott', { antall: antallBleier })
              : t('bleie.innsiktAntall', { antall: antallBleier })}
          </div>
        </div>
      )}

      {/* Registrer */}
      <div style={{ backgroundColor: farger.hvit, border: `1px solid ${farger.kremMørk}`, borderRadius: '20px', padding: '20px', marginBottom: '12px' }}>
        
        {/* Type */}
        <div style={{ fontSize: '12px', letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: 'var(--font-inter)', color: farger.tekstLys, marginBottom: '12px' }}>{t('bleie.type')}</div>
        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
          {BLEIE_TYPER.map(type => (
            <button
              key={type.id}
              onClick={() => setValgt(type.id)}
              style={{
                flex: 1,
                padding: '14px 8px',
                backgroundColor: valgt === type.id ? farger.grønnLys : farger.bakgrunn,
                border: `1.5px solid ${valgt === type.id ? farger.grønn : farger.kremMørk}`,
                borderRadius: '14px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              <BleieIkon type={type.id} aktiv={valgt === type.id} />
              <div style={{ fontSize: '12px', fontFamily: 'var(--font-inter)', color: valgt === type.id ? farger.grønn : farger.tekst, fontWeight: valgt === type.id ? '600' : '400' }}>
                {type.label}
              </div>
            </button>
          ))}
        </div>

        {/* Tidspunkt */}
        {/* Tidspunkt */}
<div style={{ fontSize: '12px', letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: 'var(--font-inter)', color: farger.tekstLys, marginBottom: '8px' }}>{t('bleie.tidspunkt')}</div>
<div style={{ marginBottom: '20px' }}>
  <input
    type="time"
    value={tidspunkt}
    onChange={e => setTidspunkt(e.target.value)}
    style={{ width: '100%', padding: '12px 16px', fontSize: '16px', border: `1px solid ${farger.kremMørk}`, borderRadius: '12px', backgroundColor: farger.bakgrunn, color: farger.tekst, outline: 'none', fontFamily: 'var(--font-inter)', boxSizing: 'border-box' }}
  />

        </div>

        {/* Notat */}
        <div style={{ fontSize: '12px', letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: 'var(--font-inter)', color: farger.tekstLys, marginBottom: '8px' }}>{t('bleie.notatValgfritt')}</div>
        <textarea
          value={notat}
          onChange={e => setNotat(e.target.value)}
          placeholder={t('bleie.notatPlaceholder')}
          style={{ width: '100%', padding: '12px 16px', fontSize: '14px', border: `1px solid ${farger.kremMørk}`, borderRadius: '12px', backgroundColor: farger.bakgrunn, color: farger.tekst, outline: 'none', fontFamily: 'var(--font-inter)', resize: 'none', minHeight: '80px', boxSizing: 'border-box' }}
        />

        {/* Lagre */}
        <button
          onClick={registrerBleie}
          disabled={!valgt || lagrer}
          style={{ width: '100%', padding: '16px', marginTop: '16px', backgroundColor: valgt ? farger.grønnLys : farger.kremMørk, border: `1px solid ${valgt ? farger.grønn : 'transparent'}`, borderRadius: '16px', fontSize: '15px', fontWeight: '600', color: valgt ? farger.grønn : farger.tekstLys, cursor: valgt ? 'pointer' : 'not-allowed', fontFamily: 'var(--font-inter)' }}
        >
          {lagrer ? t('bleie.lagrer') : t('bleie.lagre')}
        </button>
      </div>

      {/* Logg */}
      {logg.length > 0 && (
        <div style={{ backgroundColor: farger.hvit, border: `1px solid ${farger.kremMørk}`, borderRadius: '16px', padding: '16px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <div style={{ fontSize: '15px', fontFamily: 'var(--font-plus-jakarta)', color: farger.tekst, fontWeight: '600' }}>{t('bleie.bleieskiftIDag')}</div>
            <div style={{ fontSize: '12px', fontFamily: 'var(--font-inter)', color: farger.tekstLys }}>{t('bleie.totalt', { antall: antallBleier })}</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {logg.map((l, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', backgroundColor: farger.bakgrunn, borderRadius: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <BleieIkon type={l.type} aktiv={false} />
                  <div>
                    <div style={{ fontSize: '13px', fontFamily: 'var(--font-inter)', color: farger.tekst, fontWeight: '500' }}>
                      {BLEIE_TYPER.find(b => b.id === l.type)?.label || l.type}
                    </div>
                    <div style={{ fontSize: '11px', fontFamily: 'var(--font-inter)', color: farger.tekstLys }}>
                      {l.tidspunkt}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}