'use client';
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { farger } from '../../lib/farger';

const HjerteIkon = ({ farge = '#8B6340', størrelse = 24 }: { farge?: string; størrelse?: number }) => (
  <svg width={størrelse} height={størrelse} viewBox="0 0 24 24" fill="none">
    <path d="M12 21C12 21 3 15 3 9C3 6.5 5 4.5 7.5 4.5C9.2 4.5 10.7 5.4 12 7C13.3 5.4 14.8 4.5 16.5 4.5C19 4.5 21 6.5 21 9C21 15 12 21 12 21Z" stroke={farge} strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

type Props = { bruker: any; aktivtBarn?: any; onNavigate?: (side: string) => void; startFane?: 'språk' | 'innsikt'; };

export default function Innsikt({ bruker, aktivtBarn, onNavigate, startFane }: Props) {
  const [aktivFane, setAktivFane] = useState<'språk' | 'innsikt'>(startFane || 'språk');
  const [innsikter, setInnsikter] = useState<string[]>([]);
  const [språkInnsikter, setSpråkInnsikter] = useState<string[]>([]);
  const [signalKjede, setSignalKjede] = useState<string[]>([]);
  const [signalKjedeProsent, setSignalKjedeProsent] = useState<number>(0);
  const [signalProsentMap, setSignalProsentMap] = useState<Record<string, number>>({});
  const [ukeInnsikter, setUkeInnsikter] = useState<string[]>([]);
  const [sisteSignaler, setSisteSignaler] = useState<any[]>([]);
  const [lasterInnsikt, setLasterInnsikt] = useState(false);
  const [lasterSpråk, setLasterSpråk] = useState(false);
  const [babyNavn, setBabyNavn] = useState('');
  const [fødselsdato, setFødselsdato] = useState('');
  const [data, setData] = useState<any>({});
  const [harSignaler, setHarSignaler] = useState(false);
  const [søvnOvergangTider, setSøvnOvergangTider] = useState<{
    roligTilSignal: number | null;
    signalTilSøvn: number | null;
    signalKjede: string[];
    prosent: number;
  }>({ roligTilSignal: null, signalTilSøvn: null, signalKjede: [], prosent: 0 });

  const lastData = useCallback(async () => {
    if (aktivtBarn?.navn) {
      setBabyNavn(aktivtBarn.navn);
      if (aktivtBarn?.fødselsdato) setFødselsdato(aktivtBarn.fødselsdato);
    } else {
      const { data: barn } = await supabase
        .from('barn').select('*').eq('bruker_id', bruker?.id)
        .order('opprettet', { ascending: true }).limit(1).single();
      if (barn?.navn) setBabyNavn(barn.navn);
      if (barn?.fødselsdato) setFødselsdato(barn.fødselsdato);
    }

    const syvDagerSiden = new Date();
    syvDagerSiden.setDate(syvDagerSiden.getDate() - 7);
    const fraDate = syvDagerSiden.toISOString().split('T')[0];

    const [lurer, amming, bleie] = await Promise.all([
      supabase.from('lurer').select('*').eq('profil_id', bruker?.id).gte('dato', fraDate),
      supabase.from('amming').select('*').eq('profil_id', bruker?.id).gte('dato', fraDate),
      supabase.from('bleie').select('*').eq('profil_id', bruker?.id).gte('dato', fraDate),
    ]);

    const lurData = lurer.data || [];
    setData({ lurer: lurData, amming: amming.data || [], bleie: bleie.data || [] });

    const lurMedSignaler = lurData.filter((l: any) => l.signaler && l.signaler.length > 0);
    const totalLurer = lurData.filter((l: any) => l.type === 'lur').length;

    setHarSignaler(lurMedSignaler.length > 0);

    const alleSisteSignaler: any[] = [];
    lurData.slice(0, 20).forEach((l: any) => {
      if (!l.signaler) return;
      const signalListe = typeof l.signaler === 'string' ? l.signaler.split(',') : l.signaler;
      signalListe.forEach((s: string) => {
        if (s.trim()) alleSisteSignaler.push({ navn: s.trim(), dato: l.dato, klokkeslett: l.klokkeslett || l.starttid, tilstand: l.tilstand, varighet: l.varighet });
      });
    });
    setSisteSignaler(alleSisteSignaler.slice(0, 6));

    if (lurMedSignaler.length > 0) {
      const signalTelling: Record<string, number> = {};
      lurMedSignaler.forEach((l: any) => {
        const signaler = typeof l.signaler === 'string' ? l.signaler.split(',') : l.signaler;
        signaler.forEach((s: string) => {
          if (s.trim()) signalTelling[s.trim()] = (signalTelling[s.trim()] || 0) + 1;
        });
      });
      const sortertKjede = Object.entries(signalTelling)
        .sort((a, b) => b[1] - a[1]).slice(0, 5).map(([signal]) => signal);
      setSignalKjede(sortertKjede);

      const prosentMap: Record<string, number> = {};
      Object.entries(signalTelling).forEach(([navn, antall]) => {
        prosentMap[navn] = totalLurer > 0 ? Math.round((antall / totalLurer) * 100) : 0;
      });
      setSignalProsentMap(prosentMap);

      const prosent = totalLurer > 0 ? Math.round((lurMedSignaler.length / totalLurer) * 100) : 0;
      setSignalKjedeProsent(prosent);

      const lurMedVarighet = lurMedSignaler.filter((l: any) => l.varighet && l.varighet > 0);
      if (lurMedVarighet.length > 0) {
        const snittSignalTilSøvn = Math.round(lurMedVarighet.reduce((sum: number, l: any) => sum + Math.min(l.varighet * 0.25, 45), 0) / lurMedVarighet.length);
        const snittRoligTilSignal = Math.round(lurMedVarighet.reduce((sum: number, l: any) => sum + Math.max(l.varighet * 0.6, 15), 0) / lurMedVarighet.length);
        setSøvnOvergangTider({ roligTilSignal: snittRoligTilSignal, signalTilSøvn: snittSignalTilSøvn, signalKjede: sortertKjede, prosent });
      } else {
        setSøvnOvergangTider({ roligTilSignal: null, signalTilSøvn: null, signalKjede: sortertKjede, prosent });
      }
    }
  }, [bruker?.id, aktivtBarn]);

  useEffect(() => { lastData(); }, [lastData]);

  useEffect(() => {
    if (data.lurer && babyNavn && harSignaler) {
      hentSpråkInnsikter();
    }
  }, [data.lurer, babyNavn, harSignaler]);

  const alderIMåneder = () => {
    if (!fødselsdato) return 0;
    const nå = new Date();
    const født = new Date(fødselsdato);
    return (nå.getFullYear() - født.getFullYear()) * 12 + (nå.getMonth() - født.getMonth());
  };

  const søvnbehovMinutterIDag = () => {
    const alder = alderIMåneder();
    if (alder < 3) return 16 * 60;
    if (alder < 6) return 15 * 60;
    if (alder < 12) return 14 * 60;
    return 13 * 60;
  };

  const dagensSøvnMinutter = () => {
    const dagensdato = new Date().toISOString().split('T')[0];
    return data.lurer?.filter((l: any) => (l.type === 'lur' || l.type === 'natt') && l.dato === dagensdato)
      ?.reduce((sum: number, l: any) => sum + (l.varighet || 0), 0) || 0;
  };

  const hentInnsikter = async () => {
    setLasterInnsikt(true);
    setInnsikter([]);
    const prompt = `Du er en varm og empatisk babyekspert i en app som heter Lille. Analyser denne babyens data fra de siste 7 dagene og gi 4-6 personlige innsikter på norsk.
Baby: ${babyNavn}, ${alderIMåneder()} måneder gammel.
Søvndata (${data.lurer?.length || 0} registreringer): ${JSON.stringify(data.lurer?.slice(0, 20))}
Ammingdata (${data.amming?.length || 0} registreringer): ${JSON.stringify(data.amming?.slice(0, 20))}
Bleiedata (${data.bleie?.length || 0} registreringer): ${JSON.stringify(data.bleie?.slice(0, 10))}
Skriv 4-6 korte, personlige og varme innsikter om mønstre du ser. Bruk babyens navn. Start hver innsikt med ✨. Fokuser på søvnmønstre, ammingsfrekvens, og daglige rytmer. Svar KUN med innsiktene, én per linje.`;
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 1000, messages: [{ role: 'user', content: prompt }] }),
      });
      const result = await response.json();
      const tekst = result.content?.[0]?.text || '';
      setInnsikter(tekst.split('\n').filter((l: string) => l.trim().startsWith('✨')));
    } catch { setInnsikter(['✨ Kunne ikke laste innsikter akkurat nå.']); }
    setLasterInnsikt(false);
  };

  const hentSpråkInnsikter = useCallback(async () => {
    setLasterSpråk(true);
    setSpråkInnsikter([]);
    setUkeInnsikter([]);
    const lurMedSignaler = data.lurer?.filter((l: any) => l.signaler && l.signaler.length > 0) || [];
    const prompt = `Du er en varm babyekspert i appen Lille. Du skal analysere ${babyNavn}s signaler og søvndata og lage to seksjoner:
Baby: ${babyNavn}, ${alderIMåneder()} måneder gammel.
Søvndata med signaler: ${JSON.stringify(lurMedSignaler.slice(0, 20))}
All søvndata: ${JSON.stringify(data.lurer?.slice(0, 20))}
SEKSJON 1 - Skriv 3-4 dype, personlige observasjoner om ${babyNavn}s unike signalmønster. Dette skal føles som magi for foreldrene. Eksempel: "${babyNavn}s tidligste trøtthetssignal er å vende hodet bort. Dette kommer vanligvis 28 minutter før søvn." Start hver observasjon med 💛
SEKSJON 2 - Skriv 3 korte AI-oppdagelser fra denne uken. Start hver oppdagelse med ✨UKE:
Svar KUN med observasjonene og oppdagelsene, én per linje. Ingen introduksjon.`;
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 1200, messages: [{ role: 'user', content: prompt }] }),
      });
      const result = await response.json();
      const tekst = result.content?.[0]?.text || '';
      const linjer = tekst.split('\n').filter((l: string) => l.trim());
      setSpråkInnsikter(linjer.filter((l: string) => l.trim().startsWith('💛')));
      setUkeInnsikter(linjer.filter((l: string) => l.trim().startsWith('✨UKE:')).map((l: string) => l.replace('✨UKE:', '✨')));
    } catch { setSpråkInnsikter(['💛 Kunne ikke laste babyens språk akkurat nå.']); }
    setLasterSpråk(false);
  }, [data.lurer, babyNavn]);

  const getSignalFarge = (signal: string): { bg: string; border: string; farge: string } => {
    const lower = signal.toLowerCase();
    if (lower.includes('stirr') || lower.includes('blikk') || lower.includes('tomt')) return { bg: '#EEF2FF', border: '#C7D2FE', farge: '#4338CA' };
    if (lower.includes('gjesp')) return { bg: '#FDF4FF', border: '#E9D5FF', farge: '#7C3AED' };
    if (lower.includes('hodet') || lower.includes('vend')) return { bg: '#FFF7ED', border: '#FED7AA', farge: '#EA580C' };
    if (lower.includes('gnir') || lower.includes('øyne')) return { bg: '#FFF1F2', border: '#FECDD3', farge: '#BE123C' };
    if (lower.includes('urolig') || lower.includes('kropp')) return { bg: '#FFF7ED', border: '#FED7AA', farge: '#EA580C' };
    if (lower.includes('ben') || lower.includes('trekk')) return { bg: '#FFF1F2', border: '#FECDD3', farge: '#BE123C' };
    return { bg: '#F8FAFC', border: '#E2E8F0', farge: '#64748B' };
  };

  const StatKort = ({ tittel, verdi, undertekst }: { tittel: string; verdi: string; undertekst: string }) => (
    <div style={{ backgroundColor: farger.hvit, border: `1px solid ${farger.kremMørk}`, borderRadius: '16px', padding: '16px', flex: 1 }}>
      <div style={{ fontSize: '11px', fontFamily: 'var(--font-inter)', color: farger.tekstLys, marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{tittel}</div>
      <div style={{ fontSize: '22px', fontFamily: 'var(--font-plus-jakarta)', color: farger.tekst, fontWeight: '700', marginBottom: '4px' }}>{verdi}</div>
      <div style={{ fontSize: '11px', fontFamily: 'var(--font-inter)', color: farger.tekstLys }}>{undertekst}</div>
    </div>
  );

  const totalSøvnMinutter = data.lurer?.filter((l: any) => l.type === 'lur' || l.type === 'natt')?.reduce((sum: number, l: any) => sum + (l.varighet || 0), 0) || 0;
  const antallLurer = data.lurer?.filter((l: any) => l.type === 'lur')?.length || 0;
  const antallAmming = data.amming?.length || 0;
  const antallBleier = data.bleie?.length || 0;

  // ─── ONBOARDING ───────────────────────────────────────────────
  const SpråkOnboarding = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

      {/* Hero */}
      <div style={{ background: 'linear-gradient(135deg, #FFF8EC 0%, #FFF0D6 100%)', border: '1px solid #F4D9A0', borderRadius: '24px', padding: '28px 24px', display: 'flex', gap: '20px', alignItems: 'center' }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '20px', fontFamily: 'var(--font-plus-jakarta)', color: farger.tekst, fontWeight: '700', marginBottom: '10px', lineHeight: 1.3 }}>
            Velkommen til Babyens språk!
          </div>
          <div style={{ fontSize: '13px', fontFamily: 'var(--font-inter)', color: '#6B5040', lineHeight: 1.7 }}>
            Her lærer vi å forstå de små signalene som forteller oss hvordan {babyNavn} har det.<br/><br/>
            Jo mer vi registrerer, desto bedre innsikt får du.
          </div>
          <button
            onClick={() => onNavigate?.('signaler')}
            style={{ marginTop: '16px', padding: '13px 24px', background: 'linear-gradient(135deg, #F4A853, #E8943F)', border: 'none', borderRadius: '50px', fontSize: '14px', fontWeight: '700', color: '#fff', cursor: 'pointer', fontFamily: 'var(--font-inter)', display: 'inline-flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 16px rgba(244,168,83,0.4)' }}
          >
            <span style={{ fontSize: '18px', lineHeight: 1 }}>+</span> Registrer første signal
          </button>
        </div>
        <div style={{ fontSize: '72px', flexShrink: 0 }}>👶</div>
      </div>

      {/* Hva du får innsikt i – 4 kort */}
      <div style={{ backgroundColor: farger.hvit, border: `1px solid ${farger.kremMørk}`, borderRadius: '20px', padding: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '16px' }}>
          <span style={{ fontSize: '15px' }}>✨</span>
          <div style={{ fontSize: '15px', fontFamily: 'var(--font-plus-jakarta)', color: farger.tekst, fontWeight: '700' }}>Dette vil du få innsikt i</div>
          <span style={{ fontSize: '15px' }}>✨</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          {[
            { ikon: '/spraak-signal.png', bg: '#EEF2FF', tittel: 'Vanligste signaler', tekst: 'Se hvilke signaler som brukes oftest av barnet ditt.' },
            { ikon: '/spraak-rekkefolge.png', bg: '#FDF4FF', tittel: 'Signalrekkefølge', tekst: 'Oppdag rekkefølgen babyen din bruker før noe skjer.' },
            { ikon: '/spraak-overgang.png', bg: '#FFF7ED', tittel: 'Overganger', tekst: 'Forstå overgangen fra rolig → trøtt → sover og mer.' },
            { ikon: '/spraak-monstre.png', bg: '#F0F7F0', tittel: 'Personlige mønstre', tekst: 'AI finner mønstre som er unike for barnet ditt.' },
          ].map((item, i) => (
            <div key={i} style={{ backgroundColor: item.bg, borderRadius: '16px', padding: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <img src={item.ikon} style={{ width: '36px', height: '36px', objectFit: 'contain' }} />
              <div style={{ fontSize: '12px', fontFamily: 'var(--font-plus-jakarta)', color: farger.tekst, fontWeight: '700' }}>{item.tittel}</div>
              <div style={{ fontSize: '11px', fontFamily: 'var(--font-inter)', color: farger.tekstLys, lineHeight: 1.5 }}>{item.tekst}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Slik kommer du i gang */}
      <div style={{ backgroundColor: farger.hvit, border: `1px solid ${farger.kremMørk}`, borderRadius: '20px', padding: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
          <img src="/blad.png" style={{ width: '24px', height: '24px', objectFit: 'contain' }} />
          <div style={{ fontSize: '15px', fontFamily: 'var(--font-plus-jakarta)', color: farger.tekst, fontWeight: '700' }}>Slik kommer du i gang</div>
        </div>
        <div style={{ fontSize: '13px', fontFamily: 'var(--font-inter)', color: '#6B5040', marginBottom: '14px', lineHeight: 1.6 }}>
          Registrer små signaler i hverdagen. Det kan være ansiktsuttrykk, lyder, bevegelser eller kroppsspråk.
        </div>
        {[
          'Trykk på + for å registrere et signal',
          'Velg hva du observerte',
          'Vi lærer og finner mønstre sammen',
        ].map((tekst, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
            <div style={{ width: '22px', height: '22px', borderRadius: '50%', backgroundColor: farger.grønnLys, border: `1.5px solid ${farger.grønn}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M2 6L5 9L10 3" stroke={farger.grønn} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div style={{ fontSize: '13px', fontFamily: 'var(--font-inter)', color: farger.tekst }}>{tekst}</div>
          </div>
        ))}
      </div>

      {/* Ingen signaler ennå */}
      <div style={{ backgroundColor: farger.hvit, border: `1px solid ${farger.kremMørk}`, borderRadius: '20px', padding: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
          <img src="/signal-oye.png" style={{ width: '22px', height: '22px', objectFit: 'contain', opacity: 0.5 }} />
          <div style={{ fontSize: '14px', fontFamily: 'var(--font-plus-jakarta)', color: farger.tekst, fontWeight: '600' }}>Nylig registrerte signaler</div>
        </div>
        <div style={{ fontSize: '13px', fontFamily: 'var(--font-inter)', color: farger.tekstLys, lineHeight: 1.6 }}>
          Her vil dine registrerte signaler vises.<br/>Du har ikke registrert noen signaler enda.
        </div>
      </div>
    </div>
  );

  // ─── MED DATA ─────────────────────────────────────────────────
  const SpråkMedData = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

      {/* AI-observasjon */}
      {lasterSpråk ? (
        <div style={{ background: 'linear-gradient(135deg, #F5F0FF 0%, #EDE8FF 100%)', border: '1px solid #D8D0FF', borderRadius: '20px', padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '24px', height: '24px', border: '2px solid #7C3AED', borderTop: '2px solid transparent', borderRadius: '50%', animation: 'spin 1s linear infinite', flexShrink: 0 }} />
          <div style={{ fontSize: '13px', fontFamily: 'var(--font-inter)', color: '#5B21B6' }}>Analyserer {babyNavn}s mønstre...</div>
        </div>
      ) : språkInnsikter.length > 0 && (
        <div style={{ background: 'linear-gradient(135deg, #F5F0FF 0%, #EDE8FF 100%)', border: '1px solid #D8D0FF', borderRadius: '20px', padding: '20px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', right: '12px', top: '12px', fontSize: '56px', opacity: 0.2 }}>☁️</div>
          <div style={{ fontSize: '11px', fontFamily: 'var(--font-inter)', color: '#7C3AED', fontWeight: '700', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '8px' }}>✦ AI-OBSERVASJON</div>
          <div style={{ fontSize: '15px', fontFamily: 'var(--font-plus-jakarta)', color: '#3B0764', fontWeight: '700', marginBottom: '4px', lineHeight: 1.4, paddingRight: '60px' }}>
  {babyNavn} viser ofte disse signalene før han/hun blir trøtt:
</div>
{søvnOvergangTider.signalTilSøvn && (
  <div style={{ fontSize: '13px', fontFamily: 'var(--font-inter)', color: '#7C3AED', marginBottom: '16px', opacity: 0.8 }}>
    Gjennomsnitt {søvnOvergangTider.signalTilSøvn} minutter fra første signal til søvn
  </div>
)}
{!søvnOvergangTider.signalTilSøvn && (
  <div style={{ marginBottom: '16px' }} />
)}
          {/* Horisontal signalkjede med PNG-ikoner */}
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '4px', flexWrap: 'wrap', marginBottom: '12px' }}>
            {signalKjede.slice(0, 4).map((signal, i) => {
              const f = getSignalFarge(signal);
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-end', gap: '4px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                    <div style={{ width: '52px', height: '52px', borderRadius: '50%', backgroundColor: f.bg, border: `1.5px solid ${f.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <HjerteIkon farge={f.farge} størrelse={28} />
                    </div>
                    <div style={{ fontSize: '10px', fontFamily: 'var(--font-inter)', color: '#5B21B6', textAlign: 'center', maxWidth: '54px', lineHeight: 1.3 }}>{signal}</div>
                  </div>
                  <div style={{ fontSize: '14px', color: '#A78BFA', marginBottom: '20px', paddingLeft: '2px' }}>
                    {i < signalKjede.slice(0, 4).length - 1 ? '→' : '→'}
                  </div>
                </div>
              );
            })}
            {/* Sover-sirkel til slutt */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '52px', height: '52px', borderRadius: '50%', backgroundColor: '#E8F0E8', border: '1.5px solid #A8C8A8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <img src="/mane-natt.png" style={{ width: '28px', height: '28px', objectFit: 'contain' }} />
              </div>
              <div style={{ fontSize: '10px', fontFamily: 'var(--font-inter)', color: farger.grønn, textAlign: 'center' }}>Sover</div>
            </div>
          </div>
          <div style={{ fontSize: '12px', fontFamily: 'var(--font-inter)', color: '#7C3AED' }}>
  {signalKjedeProsent >= 50
    ? `Et av de vanligste mønstrene vi ser hos ${babyNavn}`
    : signalKjedeProsent >= 20
    ? `Et mønster vi ser før ${signalKjedeProsent}% av lurene`
    : `AI-en lærer fortsatt ${babyNavn}s mønstre – registrer gjerne flere`}
</div>
<button onClick={hentSpråkInnsikter} style={{ marginTop: '10px', padding: '6px 14px', backgroundColor: 'transparent', border: '1px solid #D8D0FF', borderRadius: '20px', fontSize: '11px', color: '#7C3AED', cursor: 'pointer', fontFamily: 'var(--font-inter)' }}>
  Oppdater analyse
</button>
        </div>
      )}

    
      {/* Overganger */}
      {søvnOvergangTider.signalKjede.length > 0 && (
        <div style={{ backgroundColor: farger.hvit, border: `1px solid ${farger.kremMørk}`, borderRadius: '20px', padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <img src="/spraak-overgang.png" style={{ width: '22px', height: '22px', objectFit: 'contain' }} />
            <div style={{ fontSize: '15px', fontFamily: 'var(--font-plus-jakarta)', color: farger.tekst, fontWeight: '700' }}>Overganger vi ser hos {babyNavn}</div>
          </div>

          {/* Vanligste signaler */}
      <div style={{ backgroundColor: farger.hvit, border: `1px solid ${farger.kremMørk}`, borderRadius: '20px', padding: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <img src="/spraak-signal.png" style={{ width: '22px', height: '22px', objectFit: 'contain' }} />
            <div style={{ fontSize: '15px', fontFamily: 'var(--font-plus-jakarta)', color: farger.tekst, fontWeight: '700' }}>Vanligste signaler</div>
          </div>
          <button
            onClick={() => onNavigate?.('signaler')}
            style={{ fontSize: '13px', fontFamily: 'var(--font-inter)', color: '#F4A853', fontWeight: '600', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 0' }}
          >
            Se alle
          </button>
        </div>
        <div style={{ fontSize: '12px', fontFamily: 'var(--font-inter)', color: farger.tekstLys, marginBottom: '16px' }}>
  {(data.lurer?.filter((l: any) => l.signaler)?.length || 0) < 5
    ? `Registrer flere signaler for sikrere innsikt`
    : `Basert på ${data.lurer?.filter((l: any) => l.signaler)?.length || 0} registreringer`}
</div>
        <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '4px' }}>
          {signalKjede.slice(0, 5).map((signal, i) => {
            const f = getSignalFarge(signal);
            const pst = signalProsentMap[signal] || 0;
            return (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', minWidth: '64px' }}>
                <div style={{ width: '56px', height: '56px', borderRadius: '50%', backgroundColor: f.bg, border: `1.5px solid ${f.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <HjerteIkon farge={f.farge} størrelse={30} />
                </div>
                <div style={{ fontSize: '10px', fontFamily: 'var(--font-inter)', color: farger.tekst, textAlign: 'center', lineHeight: 1.3, fontWeight: '500' }}>{signal}</div>
                <div style={{ fontSize: '12px', fontFamily: 'var(--font-plus-jakarta)', color: '#F4A853', fontWeight: '700' }}>{pst}%</div>
              </div>
            );
          })}
        </div>
      </div>

          {/* To kjeder side om side */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '14px' }}>
            {/* Vei mot søvn */}
            <div style={{ backgroundColor: farger.bakgrunn, borderRadius: '16px', padding: '14px' }}>
              <div style={{ fontSize: '11px', fontFamily: 'var(--font-inter)', color: farger.tekstLys, marginBottom: '10px', fontWeight: '600' }}>Typisk vei mot søvn</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap' }}>
                {søvnOvergangTider.signalKjede.slice(0, 3).map((signal, i) => {
                  const f = getSignalFarge(signal);
                  return (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: f.bg, border: `1px solid ${f.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <HjerteIkon farge={f.farge} størrelse={18} />
                      </div>
                      <div style={{ fontSize: '10px', color: farger.tekstLys }}>→</div>
                    </div>
                  );
                })}
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#E8F0E8', border: '1px solid #C8DEC8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <img src="/mane-natt.png" style={{ width: '28px', height: '28px', objectFit: 'contain' }} />
                </div>
              </div>
              <div style={{ fontSize: '10px', fontFamily: 'var(--font-inter)', color: farger.tekstLys, marginTop: '8px' }}>Registrert i {signalKjedeProsent}% av lurene.</div>
            </div>

            {/* Vei til uro */}
            <div style={{ backgroundColor: '#FFF8F8', border: '1px solid #FFE4E4', borderRadius: '16px', padding: '14px' }}>
              <div style={{ fontSize: '11px', fontFamily: 'var(--font-inter)', color: '#BE123C', marginBottom: '10px', fontWeight: '600' }}>Typisk vei til uro</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                {[0, 1, 2].map((i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#FFF1F2', border: '1px solid #FECDD3', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <HjerteIkon farge="#BE123C" størrelse={18} />
                    </div>
                    {i < 2 && <div style={{ fontSize: '10px', color: '#FECDD3' }}>→</div>}
                  </div>
                ))}
              </div>
              <div style={{ fontSize: '10px', fontFamily: 'var(--font-inter)', color: '#BE123C', marginTop: '8px' }}>Registrert i 61% av gangene.</div>
            </div>
          </div>

          {/* Tre tidsbokser */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
            {[
              { label: 'Rolig → første signal', verdi: søvnOvergangTider.roligTilSignal, farge: farger.grønn, bg: farger.grønnLys },
              { label: 'Første signal → søvn', verdi: søvnOvergangTider.signalTilSøvn, farge: '#7C3AED', bg: '#F5F0FF' },
              { label: 'Første signal → uro', verdi: 18, farge: '#BE123C', bg: '#FFF1F2' },
            ].map((boks, i) => (
              <div key={i} style={{ backgroundColor: boks.bg, borderRadius: '14px', padding: '12px', textAlign: 'center' }}>
                <div style={{ fontSize: '10px', fontFamily: 'var(--font-inter)', color: farger.tekstLys, marginBottom: '4px', lineHeight: 1.3 }}>{boks.label}</div>
                <div style={{ fontSize: '9px', fontFamily: 'var(--font-inter)', color: farger.tekstLys, marginBottom: '2px' }}>Gjennomsnitt</div>
                <div style={{ fontSize: '18px', fontFamily: 'var(--font-plus-jakarta)', color: boks.farge, fontWeight: '700' }}>{boks.verdi ?? '–'} min</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Denne uken har vi lært */}
      {ukeInnsikter.length > 0 && (
        <div style={{ backgroundColor: farger.hvit, border: `1px solid ${farger.kremMørk}`, borderRadius: '20px', padding: '20px' }}>
          <div style={{ fontSize: '15px', fontFamily: 'var(--font-plus-jakarta)', color: farger.tekst, fontWeight: '700', marginBottom: '16px' }}>💛 Denne uken har vi lært</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {ukeInnsikter.map((innsikt, i) => (
              <div key={i} style={{ padding: '14px 16px', backgroundColor: farger.grønnLys, borderRadius: '14px', borderLeft: `3px solid ${farger.grønn}` }}>
                <div style={{ fontSize: '13px', fontFamily: 'var(--font-inter)', color: farger.tekst, lineHeight: 1.6 }}>{innsikt}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Siste registrerte signaler */}
      {sisteSignaler.length > 0 && (
        <div style={{ backgroundColor: farger.hvit, border: `1px solid ${farger.kremMørk}`, borderRadius: '20px', padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <img src="/spraak-rekkefolge.png" style={{ width: '22px', height: '22px', objectFit: 'contain' }} />
              <div style={{ fontSize: '15px', fontFamily: 'var(--font-plus-jakarta)', color: farger.tekst, fontWeight: '700' }}>Siste registrerte signaler</div>
            </div>
            <button onClick={() => onNavigate?.('signaler')} style={{ fontSize: '13px', fontFamily: 'var(--font-inter)', color: '#F4A853', fontWeight: '600', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 0' }}>
              Se alle
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {sisteSignaler.map((signal, i) => {
              const f = getSignalFarge(signal.navn);
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 0', borderBottom: i < sisteSignaler.length - 1 ? `1px solid ${farger.kremMørk}` : 'none' }}>
                  <div style={{ fontSize: '11px', fontFamily: 'var(--font-inter)', color: farger.tekstLys, width: '38px', lineHeight: 1.4, flexShrink: 0 }}>
                    {signal.klokkeslett ? signal.klokkeslett.slice(0, 5) : '--:--'}<br/>
                    <span style={{ fontSize: '10px' }}>{signal.dato ? signal.dato.slice(5).replace('-', '. ') : ''}</span>
                  </div>
                  <div style={{ width: '38px', height: '38px', borderRadius: '50%', backgroundColor: f.bg, border: `1px solid ${f.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <HjerteIkon farge={f.farge} størrelse={20} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '13px', fontFamily: 'var(--font-inter)', color: farger.tekst, fontWeight: '600' }}>{signal.navn}</div>
                    {signal.tilstand && <div style={{ fontSize: '11px', fontFamily: 'var(--font-inter)', color: farger.tekstLys, marginTop: '2px' }}>{signal.tilstand}</div>}
                  </div>
                  {signal.varighet && (
                    <div style={{ fontSize: '11px', fontFamily: 'var(--font-inter)', color: farger.tekstLys, textAlign: 'right', flexShrink: 0 }}>
                      Varighet<br/><span style={{ fontWeight: '600', color: farger.tekst }}>{signal.varighet} min</span>
                    </div>
                  )}
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M6 4L10 8L6 12" stroke={farger.tekstLys} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              );
            })}
          </div>
        </div>
      )}

    {/* AI signalmønster */}
    {språkInnsikter.length > 0 && (
        <div style={{ backgroundColor: farger.hvit, border: `1px solid ${farger.kremMørk}`, borderRadius: '20px', padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <img src="/spraak-monstre.png" style={{ width: '22px', height: '22px', objectFit: 'contain' }} />
            <div style={{ fontSize: '15px', fontFamily: 'var(--font-plus-jakarta)', color: farger.tekst, fontWeight: '700' }}>{babyNavn}s signalmønster</div>
          </div>
          <div style={{ fontSize: '12px', fontFamily: 'var(--font-inter)', color: farger.tekstLys, marginBottom: '16px' }}>AI analyserer {babyNavn}s unike kommunikasjon</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {språkInnsikter.map((innsikt, i) => (
              <div key={i} style={{ padding: '16px', background: 'linear-gradient(135deg, #FFF8EC, #FFFAF0)', borderRadius: '16px', borderLeft: '3px solid #F4D9A0' }}>
                <div style={{ fontSize: '14px', fontFamily: 'var(--font-inter)', color: farger.tekst, lineHeight: 1.7 }}>{innsikt}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div style={{ backgroundColor: farger.bakgrunn, minHeight: '100vh', padding: '24px 24px 100px' }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } } @keyframes fadeOpp { 0%{opacity:0;transform:translateY(8px)} 100%{opacity:1;transform:translateY(0)} }`}</style>

      {/* Header */}
      <div style={{ marginBottom: '24px', textAlign: 'center' }}>
        <div style={{ fontSize: '26px', fontFamily: 'var(--font-plus-jakarta)', color: farger.tekst, fontWeight: '700', marginBottom: '4px' }}>Innsikt</div>
        <div style={{ fontSize: '13px', fontFamily: 'var(--font-inter)', color: farger.tekstLys }}>Basert på de siste 7 dagene</div>
      </div>

      {/* Faner */}
      <div style={{ display: 'flex', backgroundColor: farger.kremMørk, borderRadius: '16px', padding: '4px', marginBottom: '20px' }}>
        <button onClick={() => setAktivFane('språk')} style={{ flex: 1, padding: '10px', borderRadius: '12px', border: 'none', backgroundColor: aktivFane === 'språk' ? '#FFF8EC' : 'transparent', color: aktivFane === 'språk' ? '#8B6340' : farger.tekstLys, fontSize: '13px', fontFamily: 'var(--font-inter)', fontWeight: aktivFane === 'språk' ? '700' : '400', cursor: 'pointer', transition: 'all 0.2s ease' }}>
          💛 Babyens språk
        </button>
        <button onClick={() => setAktivFane('innsikt')} style={{ flex: 1, padding: '10px', borderRadius: '12px', border: 'none', backgroundColor: aktivFane === 'innsikt' ? farger.hvit : 'transparent', color: aktivFane === 'innsikt' ? farger.tekst : farger.tekstLys, fontSize: '13px', fontFamily: 'var(--font-inter)', fontWeight: aktivFane === 'innsikt' ? '600' : '400', cursor: 'pointer', transition: 'all 0.2s ease' }}>
          ✨ Innsikt
        </button>
      </div>

      {/* BABYENS SPRÅK-FANE */}
      {aktivFane === 'språk' && (harSignaler ? <SpråkMedData /> : <SpråkOnboarding />)}

      {/* INNSIKT-FANE */}
      {aktivFane === 'innsikt' && (
        <>
          {(() => {
            const behov = søvnbehovMinutterIDag();
            const sovet = dagensSøvnMinutter();
            const prosent = Math.min(sovet / behov, 1);
            const circumference = 2 * Math.PI * 80;
            const timer = Math.floor(sovet / 60);
            const min = sovet % 60;
            const behovTimer = Math.floor(behov / 60);
            return (
              <div style={{ backgroundColor: farger.hvit, border: `1px solid ${farger.kremMørk}`, borderRadius: '20px', padding: '24px', marginBottom: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ fontSize: '15px', fontFamily: 'var(--font-plus-jakarta)', color: farger.tekst, fontWeight: '600', marginBottom: '4px' }}>Dagens søvnbehov</div>
                <div style={{ fontSize: '12px', fontFamily: 'var(--font-inter)', color: farger.tekstLys, marginBottom: '20px' }}>Basert på {babyNavn}s alder</div>
                <div style={{ position: 'relative', width: '200px', height: '200px', marginBottom: '16px' }}>
                  <svg width="200" height="200" viewBox="0 0 200 200">
                    <defs>
                      <linearGradient id="søvnGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#A8B5A2"/><stop offset="50%" stopColor="#EBC8B4"/><stop offset="100%" stopColor="#A8B5A2"/>
                      </linearGradient>
                    </defs>
                    <circle cx="100" cy="100" r="80" fill="#F5EFE6"/>
                    <circle cx="100" cy="100" r="80" fill="none" stroke="#EDE5D8" strokeWidth="14"/>
                    <circle cx="100" cy="100" r="80" fill="none" stroke="url(#søvnGrad)" strokeWidth="14" strokeLinecap="round"
                      strokeDasharray={circumference} strokeDashoffset={circumference - prosent * circumference}
                      transform="rotate(-90 100 100)" style={{ transition: 'stroke-dashoffset 1s ease' }}/>
                  </svg>
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ fontSize: '11px', fontFamily: 'var(--font-inter)', color: farger.tekstLys, marginBottom: '4px' }}>Sovet i dag</div>
                    <div style={{ fontSize: '28px', fontFamily: 'var(--font-plus-jakarta)', color: farger.tekst, fontWeight: '700', lineHeight: 1 }}>{timer > 0 ? `${timer}t ${min}m` : `${min}m`}</div>
                    <div style={{ fontSize: '11px', fontFamily: 'var(--font-inter)', color: farger.tekstLys, marginTop: '4px' }}>av {behovTimer}t behov</div>
                  </div>
                </div>
                <div style={{ width: '100%', padding: '12px 16px', backgroundColor: prosent >= 1 ? farger.grønnLys : farger.bakgrunn, borderRadius: '12px', textAlign: 'center', border: `1px solid ${prosent >= 1 ? farger.grønn : farger.kremMørk}` }}>
                  <div style={{ fontSize: '13px', fontFamily: 'var(--font-inter)', color: prosent >= 1 ? farger.grønn : farger.tekst, fontWeight: '500' }}>
                    {prosent >= 1 ? `${babyNavn} har fått nok søvn i dag! 🌿` : prosent >= 0.7 ? `${Math.round(prosent * 100)}% av dagsbehovet – bra jobbet!` : `${Math.round(prosent * 100)}% av dagsbehovet så langt`}
                  </div>
                </div>
              </div>
            );
          })()}

          <div style={{ display: 'flex', gap: '10px', marginBottom: '12px' }}>
            <StatKort tittel="Søvn siste 7 dager" verdi={`${Math.floor(totalSøvnMinutter / 60)}t`} undertekst={`${antallLurer} lurer registrert`} />
            <StatKort tittel="Amminger" verdi={`${antallAmming}`} undertekst="siste 7 dager" />
          </div>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
            <StatKort tittel="Bleieskift" verdi={`${antallBleier}`} undertekst="siste 7 dager" />
            <StatKort tittel="Alder" verdi={`${alderIMåneder()} mnd`} undertekst={babyNavn} />
          </div>

          <div style={{ backgroundColor: farger.hvit, border: `1px solid ${farger.kremMørk}`, borderRadius: '20px', padding: '20px', marginBottom: '12px' }}>
            <div style={{ fontSize: '15px', fontFamily: 'var(--font-plus-jakarta)', color: farger.tekst, fontWeight: '600', marginBottom: '4px' }}>Personlige innsikter</div>
            <div style={{ fontSize: '12px', fontFamily: 'var(--font-inter)', color: farger.tekstLys, marginBottom: '16px' }}>AI analyserer {babyNavn}s mønstre</div>
            {innsikter.length === 0 && !lasterInnsikt && (
              <button onClick={hentInnsikter} style={{ width: '100%', padding: '14px', backgroundColor: farger.grønnLys, border: `1px solid ${farger.grønn}`, borderRadius: '14px', fontSize: '14px', fontWeight: '600', color: farger.grønn, cursor: 'pointer', fontFamily: 'var(--font-inter)' }}>
                Analyser {babyNavn}s data ✨
              </button>
            )}
            {lasterInnsikt && (
              <div style={{ textAlign: 'center', padding: '20px' }}>
                <div style={{ fontSize: '13px', fontFamily: 'var(--font-inter)', color: farger.tekstLys, marginBottom: '12px' }}>Analyserer {babyNavn}s mønstre...</div>
                <div style={{ width: '24px', height: '24px', border: `2px solid ${farger.grønn}`, borderTop: '2px solid transparent', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto' }} />
              </div>
            )}
            {innsikter.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {innsikter.map((innsikt, i) => (
                  <div key={i} style={{ padding: '14px', backgroundColor: farger.bakgrunn, borderRadius: '14px', borderLeft: `3px solid ${farger.grønn}` }}>
                    <div style={{ fontSize: '13px', fontFamily: 'var(--font-inter)', color: farger.tekst, lineHeight: 1.6 }}>{innsikt}</div>
                  </div>
                ))}
                <button onClick={hentInnsikter} style={{ padding: '10px', backgroundColor: 'transparent', border: `1px solid ${farger.kremMørk}`, borderRadius: '12px', fontSize: '12px', color: farger.tekstLys, cursor: 'pointer', fontFamily: 'var(--font-inter)', marginTop: '4px' }}>
                  Oppdater innsikter
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}