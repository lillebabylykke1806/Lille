'use client';
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { farger } from '../../lib/farger';
import { useLanguage } from '../../lib/i18n/LanguageContext';
import { OversettelseNøkkel } from '../../lib/i18n/translations';

type Props = { bruker: any; };

type Aktivitet = {
  id: number;
  type: string;
  varighet: number;
  notat: string;
  dato: string;
  tidspunkt: string;
};

type Milepæl = {
  id: number;
  navn: string;
  dato: string;
  notat: string;
  opprettet: string;
};

type TFn = (nøkkel: OversettelseNøkkel, variabler?: Record<string, string | number>) => string;

const getAktivitetTyper = (t: TFn) => [
  { id: 'lek', label: t('aktivitet.typeLek'), ikon: '🌿' },
  { id: 'tur', label: t('aktivitet.typeTur'), ikon: '🚶' },
  { id: 'bad', label: t('aktivitet.typeBad'), ikon: '🛁' },
  { id: 'massasje', label: t('aktivitet.typeMassasje'), ikon: '🤍' },
  { id: 'lesing', label: t('aktivitet.typeLesing'), ikon: '📖' },
  { id: 'sang', label: t('aktivitet.typeSang'), ikon: '🎵' },
  { id: 'annet', label: t('aktivitet.typeAnnet'), ikon: '✨' },
];

const getMilepælerForslag = (t: TFn) => [
  { id: 'Første smil', label: t('aktivitet.milepælFørsteSmil') },
  { id: 'Første latter', label: t('aktivitet.milepælFørsteLatter') },
  { id: 'Første ord', label: t('aktivitet.milepælFørsteOrd') },
  { id: 'Første steg', label: t('aktivitet.milepælFørsteSteg') },
  { id: 'Satt alene', label: t('aktivitet.milepælSattAlene') },
  { id: 'Snudde seg', label: t('aktivitet.milepælSnudde') },
  { id: 'Holdt hodet oppe', label: t('aktivitet.milepælHoldtHodet') },
  { id: 'Første tann', label: t('aktivitet.milepælFørsteTann') },
  { id: 'Spiste fast føde', label: t('aktivitet.milepælSpisteFastFøde') },
  { id: 'Vinket hei/hadet', label: t('aktivitet.milepælVinket') },
];

const AktivitetIkon = ({ type }: { type: string }) => {
  const farge = farger.grønn;
  if (type === 'lek') return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path d="M12 20C12 20 5 14 5 9C5 6 7 4 9.5 4C10.8 4 12 5 12 5C12 5 13.2 4 14.5 4C17 4 19 6 19 9C19 14 12 20 12 20Z" stroke={farge} strokeWidth="1.5" fill={`${farge}20`}/>
    </svg>
  );
  if (type === 'tur') return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="6" r="2" stroke={farge} strokeWidth="1.5" fill="none"/>
      <path d="M8 21L10 14L12 16L14 12L16 21" stroke={farge} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M6 10L8 8L12 10L16 8L18 10" stroke={farge} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
  if (type === 'bad') return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path d="M4 12H20V16C20 18.2 18.2 20 16 20H8C5.8 20 4 18.2 4 16V12Z" stroke={farge} strokeWidth="1.5" fill="none"/>
      <path d="M4 12V6C4 4.9 4.9 4 6 4H8V8" stroke={farge} strokeWidth="1.5" strokeLinecap="round" fill="none"/>
      <line x1="8" y1="17" x2="8" y2="17" stroke={farge} strokeWidth="2" strokeLinecap="round"/>
      <line x1="12" y1="17" x2="12" y2="17" stroke={farge} strokeWidth="2" strokeLinecap="round"/>
      <line x1="16" y1="17" x2="16" y2="17" stroke={farge} strokeWidth="2" strokeLinecap="round"/>
    </svg>
  );
  if (type === 'massasje') return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path d="M12 21C12 21 3 15 3 9C3 6.5 5 4.5 7.5 4.5C9.2 4.5 10.7 5.4 12 7C13.3 5.4 14.8 4.5 16.5 4.5C19 4.5 21 6.5 21 9C21 15 12 21 12 21Z" stroke={farge} strokeWidth="1.5" fill={`${farge}20`}/>
    </svg>
  );
  if (type === 'lesing') return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path d="M4 4H10C11.1 4 12 4.9 12 6V20L4 16V4Z" stroke={farge} strokeWidth="1.5" fill="none" strokeLinejoin="round"/>
      <path d="M20 4H14C12.9 4 12 4.9 12 6V20L20 16V4Z" stroke={farge} strokeWidth="1.5" fill="none" strokeLinejoin="round"/>
    </svg>
  );
  if (type === 'sang') return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <circle cx="8" cy="18" r="3" stroke={farge} strokeWidth="1.5" fill="none"/>
      <path d="M11 18V6L21 4V16" stroke={farge} strokeWidth="1.5" strokeLinecap="round" fill="none"/>
      <circle cx="18" cy="16" r="3" stroke={farge} strokeWidth="1.5" fill="none"/>
    </svg>
  );
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path d="M12 2L14.5 9H22L16 13.5L18.5 20.5L12 16L5.5 20.5L8 13.5L2 9H9.5L12 2Z" stroke={farge} strokeWidth="1.5" fill="none"/>
    </svg>
  );
};

export default function Aktivitet({ bruker }: Props) {
  const { t } = useLanguage();
  const AKTIVITET_TYPER = getAktivitetTyper(t);
  const MILEPÆLER_FORSLAG = getMilepælerForslag(t);
  const [aktivFane, setAktivFane] = useState<'aktivitet' | 'milepæler'>('aktivitet');
  const [aktiviteter, setAktiviteter] = useState<Aktivitet[]>([]);
  const [milepæler, setMilepæler] = useState<Milepæl[]>([]);
  const [visNy, setVisNy] = useState(false);
  const [visNyMilepæl, setVisNyMilepæl] = useState(false);
  const [lagrer, setLagrer] = useState(false);
  const [visBekreftet, setVisBekreftet] = useState(false);

  const [valgtType, setValgtType] = useState('lek');
  const [varighet, setVarighet] = useState(15);
  const [notat, setNotat] = useState('');

  const [milepælNavn, setMilepælNavn] = useState('');
  const [milepælDato, setMilepælDato] = useState(new Date().toISOString().split('T')[0]);
  const [milepælNotat, setMilepælNotat] = useState('');

  const dagensdato = () => new Date().toISOString().split('T')[0];

  const lastData = useCallback(async () => {
    const [akt, mil] = await Promise.all([
      supabase.from('aktiviteter').select('*').eq('profil_id', bruker?.id).eq('dato', dagensdato()).order('tidspunkt', { ascending: false }),
      supabase.from('milepæler').select('*').eq('profil_id', bruker?.id).order('dato', { ascending: false }),
    ]);
    if (akt.data) setAktiviteter(akt.data);
    if (mil.data) setMilepæler(mil.data);
  }, [bruker?.id]);

  useEffect(() => { lastData(); }, [lastData]);

  const lagreAktivitet = async () => {
    setLagrer(true);
    const nå = new Date();
    await supabase.from('aktiviteter').insert({
      profil_id: bruker?.id,
      type: valgtType,
      varighet,
      notat,
      dato: dagensdato(),
      tidspunkt: nå.toLocaleTimeString('no-NO', { hour: '2-digit', minute: '2-digit' }),
    });
    setNotat(''); setVarighet(15);
    setVisNy(false);
    setLagrer(false);
    setVisBekreftet(true);
    setTimeout(() => setVisBekreftet(false), 2000);
    lastData();
  };

  const lagreMilepæl = async () => {
    if (!milepælNavn) return;
    setLagrer(true);
    await supabase.from('milepæler').insert({
      profil_id: bruker?.id,
      navn: milepælNavn,
      dato: milepælDato,
      notat: milepælNotat,
    });
    setMilepælNavn(''); setMilepælNotat('');
    setMilepælDato(new Date().toISOString().split('T')[0]);
    setVisNyMilepæl(false);
    setLagrer(false);
    lastData();
  };

  const totalMinutter = aktiviteter.reduce((sum, a) => sum + (a.varighet || 0), 0);

  return (
    <div style={{ backgroundColor: farger.bakgrunn, minHeight: '100vh', padding: '24px 24px 100px' }}>

      {/* Header */}
      <div style={{ marginBottom: '20px', textAlign: 'center' }}>
        <div style={{ fontSize: '26px', fontFamily: 'var(--font-plus-jakarta)', color: farger.tekst, fontWeight: '700', marginBottom: '4px' }}>
          {t('aktivitet.tittel')}
        </div>
        <div style={{ fontSize: '13px', fontFamily: 'var(--font-inter)', color: farger.tekstLys }}>
          {t('aktivitet.undertittel')}
        </div>
      </div>

      {/* Bekreftet */}
      {visBekreftet && (
        <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', backgroundColor: farger.grønnLys, border: `1px solid ${farger.grønn}`, borderRadius: '20px', padding: '20px 32px', zIndex: 200, textAlign: 'center', boxShadow: '0 8px 32px rgba(0,0,0,0.12)' }}>
          <div style={{ fontSize: '32px', color: farger.grønn, marginBottom: '8px' }}>✓</div>
          <div style={{ fontSize: '14px', fontFamily: 'var(--font-inter)', color: farger.grønn, fontWeight: '600' }}>{t('aktivitet.registrert')}</div>
        </div>
      )}

      {/* Faner */}
      <div style={{ display: 'flex', backgroundColor: farger.kremMørk, borderRadius: '16px', padding: '4px', marginBottom: '20px' }}>
        <button onClick={() => setAktivFane('aktivitet')} style={{ flex: 1, padding: '10px', borderRadius: '12px', border: 'none', backgroundColor: aktivFane === 'aktivitet' ? farger.hvit : 'transparent', color: aktivFane === 'aktivitet' ? farger.tekst : farger.tekstLys, fontSize: '13px', fontFamily: 'var(--font-inter)', fontWeight: aktivFane === 'aktivitet' ? '600' : '400', cursor: 'pointer', transition: 'all 0.2s' }}>
          {t('aktivitet.faneAktivitet')}
        </button>
        <button onClick={() => setAktivFane('milepæler')} style={{ flex: 1, padding: '10px', borderRadius: '12px', border: 'none', backgroundColor: aktivFane === 'milepæler' ? farger.hvit : 'transparent', color: aktivFane === 'milepæler' ? farger.tekst : farger.tekstLys, fontSize: '13px', fontFamily: 'var(--font-inter)', fontWeight: aktivFane === 'milepæler' ? '600' : '400', cursor: 'pointer', transition: 'all 0.2s' }}>
          {t('aktivitet.faneMilepæler')}
        </button>
      </div>

      {/* AKTIVITET-FANE */}
      {aktivFane === 'aktivitet' && (
        <>
          {/* Statistikk */}
          {aktiviteter.length > 0 && (
            <div style={{ backgroundColor: farger.hvit, border: `1px solid ${farger.kremMørk}`, borderRadius: '16px', padding: '16px 20px', marginBottom: '12px', display: 'flex', gap: '16px' }}>
              <div style={{ flex: 1, textAlign: 'center' }}>
                <div style={{ fontSize: '22px', fontFamily: 'var(--font-plus-jakarta)', color: farger.grønn, fontWeight: '700' }}>{aktiviteter.length}</div>
                <div style={{ fontSize: '11px', fontFamily: 'var(--font-inter)', color: farger.tekstLys }}>{t('aktivitet.aktiviteterIDag')}</div>
              </div>
              <div style={{ width: '1px', backgroundColor: farger.kremMørk }} />
              <div style={{ flex: 1, textAlign: 'center' }}>
                <div style={{ fontSize: '22px', fontFamily: 'var(--font-plus-jakarta)', color: farger.grønn, fontWeight: '700' }}>{totalMinutter}</div>
                <div style={{ fontSize: '11px', fontFamily: 'var(--font-inter)', color: farger.tekstLys }}>{t('aktivitet.minutterTotalt')}</div>
              </div>
            </div>
          )}

          {/* Aktivitetslogg */}
          {aktiviteter.length > 0 && (
            <div style={{ backgroundColor: farger.hvit, border: `1px solid ${farger.kremMørk}`, borderRadius: '16px', padding: '16px 20px', marginBottom: '12px' }}>
              <div style={{ fontSize: '15px', fontFamily: 'var(--font-plus-jakarta)', color: farger.tekst, fontWeight: '600', marginBottom: '12px' }}>{t('aktivitet.aktiviteterLoggtittel')}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {aktiviteter.map(a => {
                  const type = AKTIVITET_TYPER.find(aktType => aktType.id === a.type);
                  return (
                    <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', backgroundColor: farger.bakgrunn, borderRadius: '12px' }}>
                      <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: farger.grønnLys, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <AktivitetIkon type={a.type} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '14px', fontFamily: 'var(--font-inter)', color: farger.tekst, fontWeight: '500' }}>
                          {type?.label || a.type}
                        </div>
                        {a.notat && (
                          <div style={{ fontSize: '11px', fontFamily: 'var(--font-inter)', color: farger.tekstLys, fontStyle: 'italic' }}>
                            {a.notat}
                          </div>
                        )}
                        <div style={{ fontSize: '11px', fontFamily: 'var(--font-inter)', color: farger.tekstLys }}>
                          {a.tidspunkt}
                        </div>
                      </div>
                      <div style={{ fontSize: '14px', fontFamily: 'var(--font-plus-jakarta)', color: farger.grønn, fontWeight: '600', flexShrink: 0 }}>
                        {a.varighet} min
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {aktiviteter.length === 0 && (
            <div style={{ textAlign: 'center', padding: '32px 24px', color: farger.tekstLys, fontSize: '14px', fontStyle: 'italic', fontFamily: 'var(--font-plus-jakarta)' }}>
              {t('aktivitet.ingenAktiviteter')}
            </div>
          )}

          <button onClick={() => setVisNy(true)} style={{ width: '100%', padding: '16px', backgroundColor: farger.grønnLys, border: `1px solid ${farger.grønn}`, borderRadius: '16px', fontSize: '15px', fontWeight: '600', color: farger.grønn, cursor: 'pointer', fontFamily: 'var(--font-inter)' }}>
            {t('aktivitet.registrerAktivitetKnapp')}
          </button>
        </>
      )}

      {/* MILEPÆLER-FANE */}
      {aktivFane === 'milepæler' && (
        <>
          {milepæler.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
              {milepæler.map(m => (
                <div key={m.id} style={{ backgroundColor: farger.hvit, border: `1px solid ${farger.kremMørk}`, borderRadius: '16px', padding: '16px 20px', borderLeft: `3px solid #F4A853` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: m.notat ? '8px' : '0' }}>
                    <div style={{ fontSize: '20px' }}>⭐</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '15px', fontFamily: 'var(--font-plus-jakarta)', color: farger.tekst, fontWeight: '600' }}>{m.navn}</div>
                      <div style={{ fontSize: '12px', fontFamily: 'var(--font-inter)', color: farger.tekstLys }}>
                        {new Date(m.dato).toLocaleDateString('no-NO', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </div>
                    </div>
                  </div>
                  {m.notat && (
                    <div style={{ fontSize: '13px', fontFamily: 'var(--font-inter)', color: farger.tekstLys, fontStyle: 'italic', lineHeight: 1.5, paddingLeft: '30px' }}>
                      {m.notat}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '32px 24px', color: farger.tekstLys, fontSize: '14px', fontStyle: 'italic', fontFamily: 'var(--font-plus-jakarta)', marginBottom: '16px' }}>
              {t('aktivitet.ingenMilepæler')}
            </div>
          )}

          <button onClick={() => setVisNyMilepæl(true)} style={{ width: '100%', padding: '16px', backgroundColor: '#FFF8EC', border: `1px solid #F4D9A0`, borderRadius: '16px', fontSize: '15px', fontWeight: '600', color: '#8B6340', cursor: 'pointer', fontFamily: 'var(--font-inter)' }}>
            {t('aktivitet.leggTilMilepæl')}
          </button>
        </>
      )}

      {/* MODAL: Ny aktivitet */}
      {visNy && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', zIndex: 200, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }} onClick={() => setVisNy(false)}>
          <div onClick={e => e.stopPropagation()} style={{ backgroundColor: farger.hvit, width: '100%', maxWidth: '430px', borderRadius: '24px 24px 0 0', padding: '24px', paddingBottom: '48px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ width: '36px', height: '4px', backgroundColor: farger.kremMørk, borderRadius: '2px', margin: '0 auto 20px' }} />
            <div style={{ fontSize: '18px', fontFamily: 'var(--font-plus-jakarta)', color: farger.tekst, fontWeight: '600', marginBottom: '20px' }}>{t('aktivitet.registrerAktivitetTittel')}</div>

            {/* Type */}
            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontSize: '11px', letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: 'var(--font-inter)', color: farger.tekstLys, marginBottom: '10px' }}>{t('aktivitet.typeAktivitet')}</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                {AKTIVITET_TYPER.map(type => (
                  <button key={type.id} onClick={() => setValgtType(type.id)} style={{ padding: '12px 6px', backgroundColor: valgtType === type.id ? farger.grønnLys : farger.bakgrunn, border: `1.5px solid ${valgtType === type.id ? farger.grønn : farger.kremMørk}`, borderRadius: '14px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: valgtType === type.id ? `${farger.grønn}20` : farger.kremMørk, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <AktivitetIkon type={type.id} />
                    </div>
                    <div style={{ fontSize: '10px', fontFamily: 'var(--font-inter)', color: valgtType === type.id ? farger.grønn : farger.tekstLys, fontWeight: valgtType === type.id ? '600' : '400' }}>
                      {type.label}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Varighet */}
            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontSize: '11px', letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: 'var(--font-inter)', color: farger.tekstLys, marginBottom: '10px' }}>{t('aktivitet.varighet')}</div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {[5, 10, 15, 20, 30, 45, 60].map(min => (
                  <button key={min} onClick={() => setVarighet(min)} style={{ padding: '8px 16px', backgroundColor: varighet === min ? farger.grønnLys : farger.bakgrunn, border: `1.5px solid ${varighet === min ? farger.grønn : farger.kremMørk}`, borderRadius: '20px', fontSize: '13px', fontFamily: 'var(--font-inter)', color: varighet === min ? farger.grønn : farger.tekst, cursor: 'pointer', fontWeight: varighet === min ? '600' : '400' }}>
                    {min} min
                  </button>
                ))}
              </div>
            </div>

            {/* Notat */}
            <div style={{ marginBottom: '24px' }}>
              <div style={{ fontSize: '11px', letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: 'var(--font-inter)', color: farger.tekstLys, marginBottom: '8px' }}>{t('aktivitet.notatValgfritt')}</div>
              <textarea value={notat} onChange={e => setNotat(e.target.value)} placeholder={t('aktivitet.notatPlaceholder')} style={{ width: '100%', padding: '12px 16px', fontSize: '14px', border: `1px solid ${farger.kremMørk}`, borderRadius: '12px', backgroundColor: farger.bakgrunn, color: farger.tekst, outline: 'none', fontFamily: 'var(--font-inter)', resize: 'none', minHeight: '80px', boxSizing: 'border-box' }} />
            </div>

            <button onClick={lagreAktivitet} disabled={lagrer} style={{ width: '100%', padding: '16px', backgroundColor: farger.grønnLys, border: `1px solid ${farger.grønn}`, borderRadius: '16px', fontSize: '15px', fontWeight: '600', color: farger.grønn, cursor: 'pointer', fontFamily: 'var(--font-inter)' }}>
              {lagrer ? t('aktivitet.lagrer') : t('aktivitet.lagreAktivitet')}
            </button>
          </div>
        </div>
      )}

      {/* MODAL: Ny milepæl */}
      {visNyMilepæl && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', zIndex: 200, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }} onClick={() => setVisNyMilepæl(false)}>
          <div onClick={e => e.stopPropagation()} style={{ backgroundColor: farger.hvit, width: '100%', maxWidth: '430px', borderRadius: '24px 24px 0 0', padding: '24px', paddingBottom: '48px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ width: '36px', height: '4px', backgroundColor: farger.kremMørk, borderRadius: '2px', margin: '0 auto 20px' }} />
            <div style={{ fontSize: '18px', fontFamily: 'var(--font-plus-jakarta)', color: farger.tekst, fontWeight: '600', marginBottom: '20px' }}>{t('aktivitet.leggTilMilepælTittel')}</div>

            {/* Forslag */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '11px', letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: 'var(--font-inter)', color: farger.tekstLys, marginBottom: '10px' }}>{t('aktivitet.velgEllerSkriv')}</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
                {MILEPÆLER_FORSLAG.filter(m => !milepæler.some(mil => mil.navn === m.id)).slice(0, 6).map(m => (
                  <button key={m.id} onClick={() => setMilepælNavn(m.id)} style={{ padding: '6px 14px', backgroundColor: milepælNavn === m.id ? '#FFF8EC' : farger.bakgrunn, border: `1.5px solid ${milepælNavn === m.id ? '#F4D9A0' : farger.kremMørk}`, borderRadius: '20px', fontSize: '12px', fontFamily: 'var(--font-inter)', color: milepælNavn === m.id ? '#8B6340' : farger.tekst, cursor: 'pointer' }}>
                    {m.label}
                  </button>
                ))}
              </div>
              <input type="text" value={milepælNavn} onChange={e => setMilepælNavn(e.target.value)} placeholder={t('aktivitet.ellerSkrivEgen')} style={{ width: '100%', padding: '12px 16px', fontSize: '14px', border: `1px solid ${farger.kremMørk}`, borderRadius: '12px', backgroundColor: farger.bakgrunn, color: farger.tekst, outline: 'none', fontFamily: 'var(--font-inter)', boxSizing: 'border-box' }} />
            </div>

            {/* Dato */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '11px', letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: 'var(--font-inter)', color: farger.tekstLys, marginBottom: '8px' }}>{t('aktivitet.dato')}</div>
              <input type="date" value={milepælDato} onChange={e => setMilepælDato(e.target.value)} style={{ width: '100%', padding: '12px 16px', fontSize: '14px', border: `1px solid ${farger.kremMørk}`, borderRadius: '12px', backgroundColor: farger.bakgrunn, color: farger.tekst, outline: 'none', fontFamily: 'var(--font-inter)', boxSizing: 'border-box' }} />
            </div>

            {/* Notat */}
            <div style={{ marginBottom: '24px' }}>
              <div style={{ fontSize: '11px', letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: 'var(--font-inter)', color: farger.tekstLys, marginBottom: '8px' }}>{t('aktivitet.notatValgfritt')}</div>
              <textarea value={milepælNotat} onChange={e => setMilepælNotat(e.target.value)} placeholder={t('aktivitet.notatMilepælPlaceholder')} style={{ width: '100%', padding: '12px 16px', fontSize: '14px', border: `1px solid ${farger.kremMørk}`, borderRadius: '12px', backgroundColor: farger.bakgrunn, color: farger.tekst, outline: 'none', fontFamily: 'var(--font-inter)', resize: 'none', minHeight: '80px', boxSizing: 'border-box' }} />
            </div>

            <button onClick={lagreMilepæl} disabled={!milepælNavn || lagrer} style={{ width: '100%', padding: '16px', backgroundColor: milepælNavn ? '#FFF8EC' : farger.kremMørk, border: `1px solid ${milepælNavn ? '#F4D9A0' : 'transparent'}`, borderRadius: '16px', fontSize: '15px', fontWeight: '600', color: milepælNavn ? '#8B6340' : farger.tekstLys, cursor: milepælNavn ? 'pointer' : 'not-allowed', fontFamily: 'var(--font-inter)' }}>
              {lagrer ? t('aktivitet.lagrer') : t('aktivitet.lagreMilepæl')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}