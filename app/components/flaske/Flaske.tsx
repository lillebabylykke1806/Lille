'use client';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../../lib/supabase';
import { farger } from '../../lib/farger';
import { useLanguage } from '../../lib/i18n/LanguageContext';
import { formatDateShort } from '../../lib/i18n/format';
import { useMåleenhet } from '../../lib/i18n/MåleenhetContext';
import type { OversettelseNøkkel } from '../../lib/i18n/translations';
import { velgFlaskeInnsikt } from '../../lib/flaskeInnsikt';

type Props = { bruker: any };

type FlaskeLogg = {
  id: string;
  dato: string;
  klokkeslett: string;
  mengde_ml: number;
  flasketype: string | null;
  smokkestr: string | null;
  melketype: string | null;
  notater: string | null;
};

type TFn = (nøkkel: OversettelseNøkkel, variabler?: Record<string, string | number>) => string;

const dagensdato = () => new Date().toISOString().split('T')[0];

const getMelketyper = (t: TFn) => [
  { id: 'morsmelk', label: t('flaske.melkMorsmelk') },
  { id: 'morsmelkerstatning', label: t('flaske.melkErstatning') },
  { id: 'blandet', label: t('flaske.melkBlandet') },
];

const MME_RADER: { alder: OversettelseNøkkel }[] = [
  { alder: 'flaske.mmeRad1Alder' },
  { alder: 'flaske.mmeRad2Alder' },
  { alder: 'flaske.mmeRad3Alder' },
  { alder: 'flaske.mmeRad4Alder' },
  { alder: 'flaske.mmeRad5Alder' },
];

function tidKort(klokkeslett: string) {
  return (klokkeslett || '').slice(0, 5);
}

export default function Flaske({ bruker }: Props) {
  const { t, locale } = useLanguage();
  const { formaterVæske } = useMåleenhet();
  const melketyper = getMelketyper(t);

  const [logg, setLogg] = useState<FlaskeLogg[]>([]);
  const [laster, setLaster] = useState(true);
  const [visSkjema, setVisSkjema] = useState(false);
  const [lagrer, setLagrer] = useState(false);
  const [visSlett, setVisSlett] = useState<FlaskeLogg | null>(null);
  const [sletter, setSletter] = useState(false);

  const [dato, setDato] = useState(dagensdato());
  const [klokkeslett, setKlokkeslett] = useState(new Date().toTimeString().slice(0, 5));
  const [mengde, setMengde] = useState('');
  const [melketype, setMelketype] = useState('');
  const [flasketype, setFlasketype] = useState('');
  const [smokkestr, setSmokkestr] = useState('');
  const [notater, setNotater] = useState('');

  const lastData = useCallback(async (silent = false) => {
    if (!silent) setLaster(true);
    const { data } = await supabase
      .from('flaske')
      .select('*')
      .eq('profil_id', bruker?.id)
      .order('dato', { ascending: false })
      .order('klokkeslett', { ascending: false });
    setLogg(data || []);
    if (!silent) setLaster(false);
  }, [bruker?.id]);

  useEffect(() => { lastData(); }, [lastData]);

  const innsikt = useMemo(() => velgFlaskeInnsikt(logg), [logg]);

  const kanLagre = Boolean(mengde.trim() && parseInt(mengde.replace(',', '.'), 10) > 0) && !lagrer;

  const nullstillSkjema = () => {
    setMengde('');
    setMelketype('');
    setFlasketype('');
    setSmokkestr('');
    setNotater('');
    setDato(dagensdato());
    setKlokkeslett(new Date().toTimeString().slice(0, 5));
  };

  const lagre = async () => {
    const ml = parseInt(mengde.replace(',', '.'), 10);
    if (!ml || ml <= 0 || lagrer) return;
    setLagrer(true);
    const { error } = await supabase.from('flaske').insert({
      profil_id: bruker?.id,
      dato,
      klokkeslett,
      mengde_ml: ml,
      flasketype: flasketype.trim() || null,
      smokkestr: smokkestr.trim() || null,
      melketype: melketype || null,
      notater: notater.trim() || null,
    });
    if (error) console.error('Flaske lagre failed:', error);
    nullstillSkjema();
    setVisSkjema(false);
    await lastData(true);
    setLagrer(false);
  };

  const slettFlaske = async () => {
    if (!visSlett || sletter) return;
    setSletter(true);
    const { error } = await supabase
      .from('flaske')
      .delete()
      .eq('id', visSlett.id)
      .eq('profil_id', bruker?.id);
    if (error) console.error('Flaske slett failed:', error);
    setVisSlett(null);
    await lastData(true);
    setSletter(false);
  };

  const melkLabel = (id: string | null) => melketyper.find(m => m.id === id)?.label || '';

  if (laster) {
    return (
      <div style={{ backgroundColor: farger.bakgrunn, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <div style={{ width: '28px', height: '28px', border: `2px solid ${farger.grønn}`, borderTop: '2px solid transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
      </div>
    );
  }

  const felt = {
    width: '100%',
    maxWidth: '100%',
    minWidth: 0,
    padding: '12px 16px',
    fontSize: '16px',
    border: `1px solid ${farger.kremMørk}`,
    borderRadius: '12px',
    backgroundColor: farger.bakgrunn,
    color: farger.tekst,
    outline: 'none',
    fontFamily: 'var(--font-inter)',
    boxSizing: 'border-box' as const,
  };

  return (
    <div style={{ backgroundColor: farger.bakgrunn, minHeight: '100vh', width: '100%', maxWidth: '100%', overflowX: 'hidden', padding: '24px 24px 120px' }}>
      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <div style={{ fontSize: '26px', fontFamily: 'var(--font-plus-jakarta)', color: farger.tekst, fontWeight: '700', marginBottom: '4px' }}>
          {t('flaske.tittel')}
        </div>
        <div style={{ fontSize: '13px', fontFamily: 'var(--font-inter)', color: farger.tekstLys }}>
          {t('flaske.undertittel')}
        </div>
      </div>

      <div style={{ backgroundColor: farger.hvit, border: `1px solid ${farger.kremMørk}`, borderRadius: '20px', padding: '20px', marginBottom: '16px', overflowWrap: 'break-word' }}>
        <div style={{ fontSize: '13px', fontFamily: 'var(--font-plus-jakarta)', color: farger.grønn, fontWeight: '700', marginBottom: '10px' }}>
          {t(innsikt.typeNøkkel)}
        </div>
        <div style={{ fontSize: '15px', fontFamily: 'var(--font-inter)', color: farger.tekst, lineHeight: 1.65, whiteSpace: 'normal' }}>
          {t(innsikt.tekstNøkkel)}
        </div>
      </div>

      {logg.length === 0 ? (
        <div style={{ backgroundColor: farger.hvit, border: `1px solid ${farger.kremMørk}`, borderRadius: '24px', padding: '24px', marginBottom: '16px', display: 'flex', gap: '16px', alignItems: 'center' }}>
          <img src="/tateflaske-mork.png" alt="" style={{ width: 64, height: 64, objectFit: 'contain', flexShrink: 0 }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '18px', fontFamily: 'var(--font-plus-jakarta)', color: farger.tekst, fontWeight: '700', marginBottom: '8px' }}>
              {t('flaske.tomTittel')}
            </div>
            <div style={{ fontSize: '13px', fontFamily: 'var(--font-inter)', color: farger.tekstLys, lineHeight: 1.6 }}>
              {t('flaske.tomTekst')}
            </div>
          </div>
        </div>
      ) : (
        <div style={{ backgroundColor: farger.hvit, border: `1px solid ${farger.kremMørk}`, borderRadius: '16px', padding: '16px 20px', marginBottom: '16px' }}>
          <div style={{ fontSize: '15px', fontFamily: 'var(--font-plus-jakarta)', color: farger.tekst, fontWeight: '600', marginBottom: '12px' }}>
            {t('flaske.historikk')}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {logg.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setVisSlett(f)}
                style={{ padding: '14px', backgroundColor: farger.bakgrunn, borderRadius: '12px', border: 'none', borderLeft: `3px solid ${farger.grønn}`, width: '100%', textAlign: 'left', cursor: 'pointer', minWidth: 0 }}
              >
                <div style={{ fontSize: '12px', fontFamily: 'var(--font-inter)', color: farger.tekstLys, marginBottom: '6px' }}>
                  {f.dato === dagensdato() ? t('flaske.iDag') : formatDateShort(f.dato, locale)} · {tidKort(f.klokkeslett)}
                </div>
                <div style={{ fontSize: '15px', fontFamily: 'var(--font-plus-jakarta)', color: farger.tekst, fontWeight: '600' }}>
                  {formaterVæske(f.mengde_ml)}
                </div>
                {(melkLabel(f.melketype) || f.flasketype || f.smokkestr) && (
                  <div style={{ fontSize: '12px', fontFamily: 'var(--font-inter)', color: farger.tekstLys, marginTop: '4px' }}>
                    {[melkLabel(f.melketype), f.flasketype, f.smokkestr].filter(Boolean).join(' · ')}
                  </div>
                )}
                {f.notater && (
                  <div style={{ fontSize: '12px', fontFamily: 'var(--font-inter)', color: farger.tekstLys, fontStyle: 'italic', marginTop: '6px' }}>
                    {f.notater}
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      <div style={{ backgroundColor: farger.hvit, border: `1px solid ${farger.kremMørk}`, borderRadius: '20px', padding: '20px', marginBottom: '16px', overflowX: 'hidden' }}>
        <div style={{ fontSize: '15px', fontFamily: 'var(--font-plus-jakarta)', color: farger.tekst, fontWeight: '700', marginBottom: '6px' }}>
          {t('flaske.mmeTittel')}
        </div>
        <div style={{ fontSize: '12px', fontFamily: 'var(--font-inter)', color: farger.tekstLys, lineHeight: 1.5, marginBottom: '14px' }}>
          {t('flaske.mmeIngress')}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.2fr) minmax(0,1fr) minmax(0,1fr)', gap: '8px', fontSize: '11px', fontFamily: 'var(--font-inter)' }}>
          <div style={{ fontWeight: 700, color: farger.tekstLys, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{t('flaske.mmeAlder')}</div>
          <div style={{ fontWeight: 700, color: farger.tekstLys, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{t('flaske.mmePerMåltid')}</div>
          <div style={{ fontWeight: 700, color: farger.tekstLys, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{t('flaske.mmePerDøgn')}</div>
          {MME_RADER.map((rad) => (
            <div key={rad.alder} style={{ display: 'contents' }}>
              <div style={{ color: farger.tekst, padding: '8px 0', borderTop: `1px solid ${farger.kremMørk}` }}>{t(rad.alder)}</div>
              <div style={{ color: farger.tekstLys, padding: '8px 0', borderTop: `1px solid ${farger.kremMørk}` }}>{t('flaske.mmeTom')}</div>
              <div style={{ color: farger.tekstLys, padding: '8px 0', borderTop: `1px solid ${farger.kremMørk}` }}>{t('flaske.mmeTom')}</div>
            </div>
          ))}
        </div>
      </div>

      <button
        type="button"
        onClick={() => setVisSkjema(true)}
        style={{ width: '100%', padding: '16px', backgroundColor: farger.grønnLys, border: `1px solid ${farger.grønn}`, borderRadius: '16px', fontSize: '15px', fontWeight: '600', color: farger.grønn, cursor: 'pointer', fontFamily: 'var(--font-inter)' }}
      >
        {t('flaske.registrer')}
      </button>

      {visSkjema && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', zIndex: 200, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }} onClick={() => setVisSkjema(false)}>
          <div onClick={e => e.stopPropagation()} style={{ backgroundColor: farger.hvit, width: '100%', maxWidth: '430px', minWidth: 0, borderRadius: '24px 24px 0 0', padding: '24px', paddingBottom: 'calc(48px + env(safe-area-inset-bottom, 0px))', maxHeight: '90vh', overflowX: 'hidden', overflowY: 'auto', boxSizing: 'border-box' }}>
            <div style={{ width: '36px', height: '4px', backgroundColor: farger.kremMørk, borderRadius: '2px', margin: '0 auto 20px' }} />
            <div style={{ fontSize: '18px', fontFamily: 'var(--font-plus-jakarta)', color: farger.tekst, fontWeight: '600', marginBottom: '20px' }}>
              {t('flaske.nyFlaske')}
            </div>

            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '11px', letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: 'var(--font-inter)', color: farger.tekstLys, marginBottom: '8px' }}>{t('flaske.mengde')}</div>
              <input type="text" inputMode="numeric" value={mengde} onChange={e => setMengde(e.target.value)} placeholder={t('flaske.mengdePlaceholder')} style={felt} />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '11px', letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: 'var(--font-inter)', color: farger.tekstLys, marginBottom: '8px' }}>{t('flaske.melketype')}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {melketyper.map(m => (
                  <button key={m.id} type="button" onClick={() => setMelketype(melketype === m.id ? '' : m.id)} style={{ padding: '12px 16px', backgroundColor: melketype === m.id ? farger.grønnLys : farger.bakgrunn, border: `1.5px solid ${melketype === m.id ? farger.grønn : farger.kremMørk}`, borderRadius: '12px', cursor: 'pointer', fontSize: '13px', fontFamily: 'var(--font-inter)', color: melketype === m.id ? farger.grønn : farger.tekst, fontWeight: melketype === m.id ? '600' : '400', textAlign: 'left' }}>
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)', gap: '10px', marginBottom: '16px' }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: '11px', letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: 'var(--font-inter)', color: farger.tekstLys, marginBottom: '8px' }}>{t('flaske.dato')}</div>
                <input type="date" value={dato} onChange={e => setDato(e.target.value)} style={felt} />
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: '11px', letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: 'var(--font-inter)', color: farger.tekstLys, marginBottom: '8px' }}>{t('flaske.tidspunkt')}</div>
                <input type="time" value={klokkeslett} onChange={e => setKlokkeslett(e.target.value)} style={felt} />
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '11px', letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: 'var(--font-inter)', color: farger.tekstLys, marginBottom: '8px' }}>{t('flaske.flasketype')}</div>
              <input type="text" value={flasketype} onChange={e => setFlasketype(e.target.value)} placeholder={t('flaske.flasketypePlaceholder')} style={felt} />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '11px', letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: 'var(--font-inter)', color: farger.tekstLys, marginBottom: '8px' }}>{t('flaske.smokkestr')}</div>
              <input type="text" value={smokkestr} onChange={e => setSmokkestr(e.target.value)} placeholder={t('flaske.smokkestrPlaceholder')} style={felt} />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <div style={{ fontSize: '11px', letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: 'var(--font-inter)', color: farger.tekstLys, marginBottom: '8px' }}>{t('flaske.notaterValgfritt')}</div>
              <textarea value={notater} onChange={e => setNotater(e.target.value)} placeholder={t('flaske.notaterPlaceholder')} style={{ ...felt, resize: 'none', minHeight: '70px' }} />
            </div>

            <button type="button" onClick={lagre} disabled={!kanLagre} style={{ width: '100%', padding: '16px', backgroundColor: kanLagre ? farger.grønnLys : farger.kremMørk, border: `1px solid ${kanLagre ? farger.grønn : 'transparent'}`, borderRadius: '16px', fontSize: '15px', fontWeight: '600', color: kanLagre ? farger.grønn : farger.tekstLys, cursor: kanLagre ? 'pointer' : 'not-allowed', fontFamily: 'var(--font-inter)' }}>
              {lagrer ? t('flaske.lagrer') : t('flaske.lagre')}
            </button>
          </div>
        </div>
      )}

      {visSlett && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', zIndex: 220, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }} onClick={() => !sletter && setVisSlett(null)}>
          <div onClick={e => e.stopPropagation()} style={{ backgroundColor: farger.hvit, width: '100%', maxWidth: '430px', minWidth: 0, borderRadius: '24px 24px 0 0', padding: '24px', paddingBottom: 'calc(48px + env(safe-area-inset-bottom, 0px))', overflowX: 'hidden', boxSizing: 'border-box' }}>
            <div style={{ width: '36px', height: '4px', backgroundColor: farger.kremMørk, borderRadius: '2px', margin: '0 auto 20px' }} />
            <div style={{ fontSize: '18px', fontFamily: 'var(--font-plus-jakarta)', color: farger.tekst, fontWeight: '700', marginBottom: '8px' }}>
              {t('hendelse.flaske')}
            </div>
            <div style={{ fontSize: '13px', fontFamily: 'var(--font-inter)', color: farger.tekstLys, marginBottom: '24px' }}>
              {tidKort(visSlett.klokkeslett)} · {formaterVæske(visSlett.mengde_ml)}
            </div>
            <button type="button" onClick={slettFlaske} disabled={sletter} style={{ width: '100%', padding: '16px', backgroundColor: 'transparent', border: '1px solid #C48E7B', borderRadius: '16px', fontSize: '15px', fontWeight: '600', color: '#C48E7B', cursor: sletter ? 'wait' : 'pointer', fontFamily: 'var(--font-inter)', marginBottom: '10px' }}>
              {sletter ? t('felles.laster') : t('felles.slettHendelse')}
            </button>
            <button type="button" onClick={() => setVisSlett(null)} disabled={sletter} style={{ width: '100%', padding: '16px', backgroundColor: 'transparent', border: `1px solid ${farger.kremMørk}`, borderRadius: '16px', fontSize: '15px', color: farger.tekstLys, cursor: sletter ? 'default' : 'pointer', fontFamily: 'var(--font-inter)' }}>
              {t('felles.avbryt')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
