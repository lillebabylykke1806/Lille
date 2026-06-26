'use client';
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { farger } from '../../lib/farger';
import { useLanguage } from '../../lib/i18n/LanguageContext';
import { useMåleenhet } from '../../lib/i18n/MåleenhetContext';

type Props = { bruker: any; aktivtBarn?: any; };

type VektLogg = {
  id: number;
  dato: string;
  vekt: number | null;
  lengde: number | null;
  klaer: string | null;
  sko: string | null;
  notat: string | null;
};

const WHO_P50_VEKT: { måned: number; kg: number }[] = [
  { måned: 0, kg: 3.3 },
  { måned: 1, kg: 4.5 },
  { måned: 2, kg: 5.6 },
  { måned: 3, kg: 6.4 },
  { måned: 4, kg: 7.0 },
  { måned: 5, kg: 7.5 },
  { måned: 6, kg: 7.9 },
  { måned: 8, kg: 8.6 },
  { måned: 10, kg: 9.2 },
  { måned: 12, kg: 9.6 },
];

const hentWhoP50Vekt = (måneder: number): number => {
  let nærmest = WHO_P50_VEKT[0];
  let minDiff = Math.abs(måneder - nærmest.måned);
  for (const entry of WHO_P50_VEKT) {
    const diff = Math.abs(måneder - entry.måned);
    if (diff < minDiff) {
      minDiff = diff;
      nærmest = entry;
    }
  }
  return nærmest.kg;
};

const hentAlderMåneder = (fødselsdato?: string): number => {
  if (!fødselsdato) return 0;
  const nå = new Date();
  const født = new Date(fødselsdato);
  return (nå.getFullYear() - født.getFullYear()) * 12 + (nå.getMonth() - født.getMonth());
};

export default function Vekt({ bruker, aktivtBarn }: Props) {
  const { t, locale } = useLanguage();
  const { formaterVekt, formaterLengde, formaterVæske, formaterTemp } = useMåleenhet();

  const [logg, setLogg] = useState<VektLogg[]>([]);
  const [laster, setLaster] = useState(true);
  const [visLeggTil, setVisLeggTil] = useState(false);
  const [lagrer, setLagrer] = useState(false);

  const [dato, setDato] = useState(new Date().toISOString().split('T')[0]);
  const [vekt, setVekt] = useState('');
  const [lengde, setLengde] = useState('');
  const [klaer, setKlaer] = useState('');
  const [sko, setSko] = useState('');
  const [notat, setNotat] = useState('');
  const [aiVekstInnsikt, setAiVekstInnsikt] = useState('');

  const lastData = useCallback(async () => {
    setLaster(true);

    const { data } = await supabase
      .from('vekt')
      .select('*')
      .eq('profil_id', bruker?.id)
      .order('dato', { ascending: false });
    setLogg(data || []);
    setLaster(false);
  }, [bruker?.id, aktivtBarn?.navn]);

  useEffect(() => { lastData(); }, [lastData]);

  useEffect(() => {
    if (logg.length < 2) return;
    const hentAiInnsikt = async () => {
      try {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 150,
            messages: [{
              role: 'user',
              content: `Du er en varm babyekspert i appen Lille. Analyser disse vekt- og lengdemålingene og gi ÉN kort, personlig og varm innsikt på norsk. Maks 1-2 setninger. Bruk babyens navn ${aktivtBarn?.navn || 'babyen'}. Avslutt gjerne med et passende emoji.

Vektlogg (nyeste først): ${JSON.stringify(logg.slice(0, 6))}

Svar KUN med innsikten, ingen introduksjon.`
            }],
          }),
        });
        const result = await response.json();
        setAiVekstInnsikt(result.content?.[0]?.text || '');
      } catch {
        setAiVekstInnsikt('');
      }
    };
    hentAiInnsikt();
  }, [logg, aktivtBarn]);

  const lagre = async () => {
    if (!vekt && !lengde && !klaer && !sko) return;
    setLagrer(true);

    await supabase.from('vekt').insert({
      profil_id: bruker?.id,
      dato,
      vekt: vekt ? parseFloat(vekt) : null,
      lengde: lengde ? parseFloat(lengde) : null,
      klaer: klaer || null,
      sko: sko || null,
      notat: notat || null,
    });
    setVekt(''); setLengde(''); setKlaer(''); setSko(''); setNotat('');
    setDato(new Date().toISOString().split('T')[0]);
    setVisLeggTil(false);
    await lastData();
    setLagrer(false);
  };

  const sisteLogg = logg[0];

  const dateLocale = locale === 'no' ? 'no-NO' : locale === 'sv' ? 'sv-SE' : locale === 'da' ? 'da-DK' : locale === 'de' ? 'de-DE' : 'en-GB';

  const formatDato = (dato: string) => {
    return new Date(dato).toLocaleDateString(dateLocale, { day: 'numeric', month: 'long', year: 'numeric' });
  };

  const formatKortDato = (dato: string) => {
    const d = new Date(dato);
    return `${d.getDate()}. ${d.toLocaleDateString(dateLocale, { month: 'short' })}`;
  };

  if (laster) return (
    <div style={{ backgroundColor: farger.bakgrunn, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <div style={{ width: '28px', height: '28px', border: `2px solid ${farger.grønn}`, borderTop: '2px solid transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
    </div>
  );

  return (
    <div style={{ backgroundColor: farger.bakgrunn, minHeight: '100vh', padding: '24px 24px 100px' }}>

      {/* Header */}
      <div style={{ marginBottom: '24px', textAlign: 'center' }}>
        <div style={{ fontSize: '26px', fontFamily: 'var(--font-plus-jakarta)', color: farger.tekst, fontWeight: '700', marginBottom: '4px' }}>
          {t('vekt.tittel')}
        </div>
        <div style={{ fontSize: '13px', fontFamily: 'var(--font-inter)', color: farger.tekstLys }}>
          {t('vekt.undertittel')}
        </div>
      </div>

      {/* Siste målinger */}
      {sisteLogg && (
        <div style={{ backgroundColor: farger.hvit, border: `1px solid ${farger.kremMørk}`, borderRadius: '20px', padding: '20px', marginBottom: '12px' }}>
          <div style={{ fontSize: '12px', fontFamily: 'var(--font-inter)', color: farger.tekstLys, marginBottom: '12px' }}>
            {t('vekt.sisteRegistrering', { dato: formatDato(sisteLogg.dato) })}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            {sisteLogg.vekt && (
              <div style={{ backgroundColor: farger.bakgrunn, borderRadius: '14px', padding: '14px', textAlign: 'center' }}>
                <div style={{ fontSize: '24px', fontFamily: 'var(--font-plus-jakarta)', color: farger.grønn, fontWeight: '700' }}>
                  {formaterVekt(sisteLogg.vekt)}
                </div>
                <div style={{ fontSize: '11px', fontFamily: 'var(--font-inter)', color: farger.tekstLys }}>{t('vekt.vekt')}</div>
              </div>
            )}
            {sisteLogg.lengde && (
              <div style={{ backgroundColor: farger.bakgrunn, borderRadius: '14px', padding: '14px', textAlign: 'center' }}>
                <div style={{ fontSize: '24px', fontFamily: 'var(--font-plus-jakarta)', color: farger.grønn, fontWeight: '700' }}>
                  {formaterLengde(sisteLogg.lengde)}
                </div>
                <div style={{ fontSize: '11px', fontFamily: 'var(--font-inter)', color: farger.tekstLys }}>{t('vekt.lengde')}</div>
              </div>
            )}
            {sisteLogg.klaer && (
              <div style={{ backgroundColor: farger.bakgrunn, borderRadius: '14px', padding: '14px', textAlign: 'center' }}>
                <div style={{ fontSize: '22px', fontFamily: 'var(--font-plus-jakarta)', color: farger.grønn, fontWeight: '700' }}>
                  {sisteLogg.klaer}
                </div>
                <div style={{ fontSize: '11px', fontFamily: 'var(--font-inter)', color: farger.tekstLys }}>{t('vekt.klærstørrelse')}</div>
              </div>
            )}
            {sisteLogg.sko && (
              <div style={{ backgroundColor: farger.bakgrunn, borderRadius: '14px', padding: '14px', textAlign: 'center' }}>
                <div style={{ fontSize: '22px', fontFamily: 'var(--font-plus-jakarta)', color: farger.grønn, fontWeight: '700' }}>
                  {sisteLogg.sko}
                </div>
                <div style={{ fontSize: '11px', fontFamily: 'var(--font-inter)', color: farger.tekstLys }}>{t('vekt.skostørrelse')}</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Vekstkurve */}
      {logg.length >= 2 && (
        <div style={{ backgroundColor: farger.hvit, border: `1px solid ${farger.kremMørk}`, borderRadius: '20px', padding: '20px', marginBottom: '12px' }}>
          <div style={{ fontSize: '15px', fontFamily: 'var(--font-plus-jakarta)', color: farger.tekst, fontWeight: '700', marginBottom: '4px' }}>{t('vekt.vekstkurve')}</div>
          <div style={{ fontSize: '12px', fontFamily: 'var(--font-inter)', color: farger.tekstLys, marginBottom: '16px' }}>{t('vekt.basertPåRegistreringer')}</div>

          {/* Vekt-graf */}
          {logg.some(l => l.vekt) && (() => {
            const vektData = [...logg].filter(l => l.vekt).reverse();
            const maks = Math.max(...vektData.map(l => l.vekt!));
            const min = Math.min(...vektData.map(l => l.vekt!));
            const range = maks - min || 1;
            const width = 320;
            const height = 120;
            const padding = 20;
            const punkter = vektData.map((l, i) => ({
              x: padding + (i / Math.max(vektData.length - 1, 1)) * (width - padding * 2),
              y: height - padding - ((l.vekt! - min) / range) * (height - padding * 2),
              vekt: l.vekt,
              dato: l.dato,
            }));
            const path = punkter.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
            const whoP50 = aktivtBarn?.fødselsdato ? hentWhoP50Vekt(hentAlderMåneder(aktivtBarn.fødselsdato)) : null;
            const p50Y = whoP50 !== null ? height - padding - ((whoP50 - min) / range) * (height - padding * 2) : null;
            return (
              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '12px', fontFamily: 'var(--font-inter)', color: farger.grønn, fontWeight: '600', marginBottom: '8px' }}>⚖️ {t('vekt.vektKg')}</div>
                <svg width="100%" viewBox={`0 0 ${width} ${height}`} style={{ overflow: 'visible' }}>
                  <defs>
                    <linearGradient id="vektGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={farger.grønn} stopOpacity="0.2"/>
                      <stop offset="100%" stopColor={farger.grønn} stopOpacity="0"/>
                    </linearGradient>
                  </defs>
                  {p50Y !== null && (
                    <>
                      <line x1={padding} y1={p50Y} x2={width - padding} y2={p50Y} stroke="#A8B5A2" strokeWidth="1" strokeDasharray="4,4"/>
                      <text x={width - padding + 2} y={p50Y + 4} fontSize="8" fill="#A8B5A2">P50</text>
                    </>
                  )}
                  <path d={`${path} L ${punkter[punkter.length-1].x} ${height} L ${punkter[0].x} ${height} Z`} fill="url(#vektGrad)"/>
                  <path d={path} fill="none" stroke={farger.grønn} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                  {punkter.map((p, i) => (
                    <g key={i}>
                      <circle cx={p.x} cy={p.y} r="5" fill={farger.hvit} stroke={farger.grønn} strokeWidth="2"/>
                      <text x={p.x} y={p.y - 10} textAnchor="middle" fontSize="9" fill={farger.tekstLys} fontFamily="var(--font-inter)">{formaterVekt(p.vekt!)}</text>
                      {i === 0 || i === punkter.length - 1 ? (
                        <text x={p.x} y={height - 2} textAnchor="middle" fontSize="8" fill={farger.tekstLys} fontFamily="var(--font-inter)">
                          {formatKortDato(p.dato)}
                        </text>
                      ) : null}
                    </g>
                  ))}
                </svg>
              </div>
            );
          })()}

          {/* Lengde-graf */}
          {logg.some(l => l.lengde) && (() => {
            const lengdeData = [...logg].filter(l => l.lengde).reverse();
            const maks = Math.max(...lengdeData.map(l => l.lengde!));
            const min = Math.min(...lengdeData.map(l => l.lengde!));
            const range = maks - min || 1;
            const width = 320;
            const height = 120;
            const padding = 20;
            const punkter = lengdeData.map((l, i) => ({
              x: padding + (i / Math.max(lengdeData.length - 1, 1)) * (width - padding * 2),
              y: height - padding - ((l.lengde! - min) / range) * (height - padding * 2),
              lengde: l.lengde,
              dato: l.dato,
            }));
            const path = punkter.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
            return (
              <div>
                <div style={{ fontSize: '12px', fontFamily: 'var(--font-inter)', color: farger.terrakotta, fontWeight: '600', marginBottom: '8px' }}>📏 {t('vekt.lengdeCm')}</div>
                <svg width="100%" viewBox={`0 0 ${width} ${height}`} style={{ overflow: 'visible' }}>
                  <defs>
                    <linearGradient id="lengdeGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={farger.terrakotta} stopOpacity="0.2"/>
                      <stop offset="100%" stopColor={farger.terrakotta} stopOpacity="0"/>
                    </linearGradient>
                  </defs>
                  <path d={`${path} L ${punkter[punkter.length-1].x} ${height} L ${punkter[0].x} ${height} Z`} fill="url(#lengdeGrad)"/>
                  <path d={path} fill="none" stroke={farger.terrakotta} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                  {punkter.map((p, i) => (
                    <g key={i}>
                      <circle cx={p.x} cy={p.y} r="5" fill={farger.hvit} stroke={farger.terrakotta} strokeWidth="2"/>
                      <text x={p.x} y={p.y - 10} textAnchor="middle" fontSize="9" fill={farger.tekstLys} fontFamily="var(--font-inter)">{formaterLengde(p.lengde!)}</text>
                      {i === 0 || i === punkter.length - 1 ? (
                        <text x={p.x} y={height - 2} textAnchor="middle" fontSize="8" fill={farger.tekstLys} fontFamily="var(--font-inter)">
                          {formatKortDato(p.dato)}
                        </text>
                      ) : null}
                    </g>
                  ))}
                </svg>
              </div>
            );
          })()}
        </div>
      )}

      {aiVekstInnsikt && (
        <div style={{ backgroundColor: farger.grønnLys, border: `1px solid ${farger.grønn}`, borderRadius: '16px', padding: '14px 18px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '20px' }}>✨</span>
          <div style={{ fontSize: '13px', fontFamily: 'var(--font-inter)', color: farger.grønn, fontWeight: '500' }}>{aiVekstInnsikt}</div>
        </div>
      )}

      {/* Legg til knapp */}
      <button onClick={() => setVisLeggTil(true)} style={{ width: '100%', padding: '16px', backgroundColor: farger.grønnLys, border: `1px solid ${farger.grønn}`, borderRadius: '16px', fontSize: '15px', fontWeight: '600', color: farger.grønn, cursor: 'pointer', fontFamily: 'var(--font-inter)', marginBottom: '20px' }}>
        {t('vekt.registrerNyMåling')}
      </button>

      {/* Historikk */}
      {logg.length > 0 && (
        <div style={{ backgroundColor: farger.hvit, border: `1px solid ${farger.kremMørk}`, borderRadius: '16px', padding: '16px 20px' }}>
          <div style={{ fontSize: '15px', fontFamily: 'var(--font-plus-jakarta)', color: farger.tekst, fontWeight: '600', marginBottom: '12px' }}>
            {t('vekt.historikk')}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {logg.map((l, i) => (
              <div key={l.id} style={{ padding: '14px', backgroundColor: farger.bakgrunn, borderRadius: '12px', borderLeft: `3px solid ${farger.grønn}` }}>
                <div style={{ fontSize: '12px', fontFamily: 'var(--font-inter)', color: farger.tekstLys, marginBottom: '8px' }}>
                  {formatDato(l.dato)}
                  {i === 0 && <span style={{ marginLeft: '8px', backgroundColor: farger.grønnLys, color: farger.grønn, fontSize: '10px', padding: '2px 8px', borderRadius: '10px', fontWeight: '600' }}>{t('vekt.siste')}</span>}
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {l.vekt && (
                    <div style={{ fontSize: '13px', fontFamily: 'var(--font-inter)', color: farger.tekst }}>
                      ⚖️ <span style={{ fontWeight: '600' }}>{formaterVekt(l.vekt)}</span>
                    </div>
                  )}
                  {l.lengde && (
                    <div style={{ fontSize: '13px', fontFamily: 'var(--font-inter)', color: farger.tekst }}>
                      📏 <span style={{ fontWeight: '600' }}>{formaterLengde(l.lengde)}</span>
                    </div>
                  )}
                  {l.klaer && (
                    <div style={{ fontSize: '13px', fontFamily: 'var(--font-inter)', color: farger.tekst }}>
                      👕 <span style={{ fontWeight: '600' }}>{l.klaer}</span>
                    </div>
                  )}
                  {l.sko && (
                    <div style={{ fontSize: '13px', fontFamily: 'var(--font-inter)', color: farger.tekst }}>
                      👟 <span style={{ fontWeight: '600' }}>{l.sko}</span>
                    </div>
                  )}
                </div>
                {l.notat && (
                  <div style={{ fontSize: '12px', fontFamily: 'var(--font-inter)', color: farger.tekstLys, fontStyle: 'italic', marginTop: '6px' }}>
                    {l.notat}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL: Legg til måling */}
      {visLeggTil && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', zIndex: 200, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }} onClick={() => setVisLeggTil(false)}>
          <div onClick={e => e.stopPropagation()} style={{ backgroundColor: farger.hvit, width: '100%', maxWidth: '430px', borderRadius: '24px 24px 0 0', padding: '24px', paddingBottom: '48px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ width: '36px', height: '4px', backgroundColor: farger.kremMørk, borderRadius: '2px', margin: '0 auto 20px' }} />
            <div style={{ fontSize: '18px', fontFamily: 'var(--font-plus-jakarta)', color: farger.tekst, fontWeight: '600', marginBottom: '20px' }}>
              {t('vekt.nyMåling')}
            </div>

            {/* Dato */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '11px', letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: 'var(--font-inter)', color: farger.tekstLys, marginBottom: '8px' }}>{t('vekt.dato')}</div>
              <input type="date" value={dato} onChange={e => setDato(e.target.value)} style={{ width: '100%', padding: '12px 16px', fontSize: '14px', border: `1px solid ${farger.kremMørk}`, borderRadius: '12px', backgroundColor: farger.bakgrunn, color: farger.tekst, outline: 'none', fontFamily: 'var(--font-inter)', boxSizing: 'border-box' }} />
            </div>

            {/* Vekt og lengde */}
            <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '11px', letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: 'var(--font-inter)', color: farger.tekstLys, marginBottom: '8px' }}>{t('vekt.vektKg')}</div>
                <input type="number" step="0.1" value={vekt} onChange={e => setVekt(e.target.value)} placeholder={t('vekt.vektPlaceholder')} style={{ width: '100%', padding: '12px 16px', fontSize: '14px', border: `1px solid ${farger.kremMørk}`, borderRadius: '12px', backgroundColor: farger.bakgrunn, color: farger.tekst, outline: 'none', fontFamily: 'var(--font-inter)', boxSizing: 'border-box' }} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '11px', letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: 'var(--font-inter)', color: farger.tekstLys, marginBottom: '8px' }}>{t('vekt.lengdeCm')}</div>
                <input type="number" step="0.1" value={lengde} onChange={e => setLengde(e.target.value)} placeholder={t('vekt.lengdePlaceholder')} style={{ width: '100%', padding: '12px 16px', fontSize: '14px', border: `1px solid ${farger.kremMørk}`, borderRadius: '12px', backgroundColor: farger.bakgrunn, color: farger.tekst, outline: 'none', fontFamily: 'var(--font-inter)', boxSizing: 'border-box' }} />
              </div>
            </div>

            {/* Klær og sko */}
            <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '11px', letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: 'var(--font-inter)', color: farger.tekstLys, marginBottom: '8px' }}>{t('vekt.klærstørrelse')}</div>
                <input type="text" value={klaer} onChange={e => setKlaer(e.target.value)} placeholder={t('vekt.klærstørrelsePlaceholder')} style={{ width: '100%', padding: '12px 16px', fontSize: '14px', border: `1px solid ${farger.kremMørk}`, borderRadius: '12px', backgroundColor: farger.bakgrunn, color: farger.tekst, outline: 'none', fontFamily: 'var(--font-inter)', boxSizing: 'border-box' }} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '11px', letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: 'var(--font-inter)', color: farger.tekstLys, marginBottom: '8px' }}>{t('vekt.skostørrelse')}</div>
                <input type="text" value={sko} onChange={e => setSko(e.target.value)} placeholder={t('vekt.skostørrelsePlaceholder')} style={{ width: '100%', padding: '12px 16px', fontSize: '14px', border: `1px solid ${farger.kremMørk}`, borderRadius: '12px', backgroundColor: farger.bakgrunn, color: farger.tekst, outline: 'none', fontFamily: 'var(--font-inter)', boxSizing: 'border-box' }} />
              </div>
            </div>

            {/* Notat */}
            <div style={{ marginBottom: '24px' }}>
              <div style={{ fontSize: '11px', letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: 'var(--font-inter)', color: farger.tekstLys, marginBottom: '8px' }}>{t('vekt.notatValgfritt')}</div>
              <textarea value={notat} onChange={e => setNotat(e.target.value)} placeholder={t('vekt.notatPlaceholder')} style={{ width: '100%', padding: '12px 16px', fontSize: '14px', border: `1px solid ${farger.kremMørk}`, borderRadius: '12px', backgroundColor: farger.bakgrunn, color: farger.tekst, outline: 'none', fontFamily: 'var(--font-inter)', resize: 'none', minHeight: '70px', boxSizing: 'border-box' }} />
            </div>

            <button onClick={lagre} disabled={(!vekt && !lengde && !klaer && !sko) || lagrer} style={{ width: '100%', padding: '16px', backgroundColor: (vekt || lengde || klaer || sko) ? farger.grønnLys : farger.kremMørk, border: `1px solid ${(vekt || lengde || klaer || sko) ? farger.grønn : 'transparent'}`, borderRadius: '16px', fontSize: '15px', fontWeight: '600', color: (vekt || lengde || klaer || sko) ? farger.grønn : farger.tekstLys, cursor: (vekt || lengde || klaer || sko) ? 'pointer' : 'not-allowed', fontFamily: 'var(--font-inter)' }}>
              {lagrer ? t('vekt.lagrer') : t('vekt.lagreMåling')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
