'use client';
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { farger } from '../../lib/farger';

type Props = { bruker: any; aktivtBarn?: any; };

export default function Innsikt({ bruker, aktivtBarn }: Props) {
  const [aktivFane, setAktivFane] = useState<'språk' | 'innsikt'>('språk');
  const [innsikter, setInnsikter] = useState<string[]>([]);
  const [språkInnsikter, setSpråkInnsikter] = useState<string[]>([]);
  const [signalKjede, setSignalKjede] = useState<string[]>([]);
  const [signalKjedeProsent, setSignalKjedeProsent] = useState<number>(0);
  const [ukeInnsikter, setUkeInnsikter] = useState<string[]>([]);
  const [lasterInnsikt, setLasterInnsikt] = useState(false);
  const [lasterSpråk, setLasterSpråk] = useState(false);
  const [lasterOverganger, setLasterOverganger] = useState(false);
  const [overgangInnsikter, setOvergangInnsikter] = useState<string[]>([]);
  const [babyNavn, setBabyNavn] = useState('');
  const [fødselsdato, setFødselsdato] = useState('');
  const [data, setData] = useState<any>({});
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
        .from('barn')
        .select('*')
        .eq('bruker_id', bruker?.id)
        .order('opprettet', { ascending: true })
        .limit(1)
        .single();
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

    if (lurMedSignaler.length > 0) {
      const signalTelling: Record<string, number> = {};
      lurMedSignaler.forEach((l: any) => {
        const signaler = typeof l.signaler === 'string' ? l.signaler.split(',') : l.signaler;
        signaler.forEach((s: string) => {
          if (s.trim()) signalTelling[s.trim()] = (signalTelling[s.trim()] || 0) + 1;
        });
      });
      const sortertKjede = Object.entries(signalTelling)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 4)
        .map(([signal]) => signal);
      setSignalKjede(sortertKjede);
      const prosent = totalLurer > 0 ? Math.round((lurMedSignaler.length / totalLurer) * 100) : 0;
      setSignalKjedeProsent(prosent);

      const lurMedVarighet = lurMedSignaler.filter((l: any) => l.varighet && l.varighet > 0);
      if (lurMedVarighet.length > 0) {
        const snittSignalTilSøvn = Math.round(
          lurMedVarighet.reduce((sum: number, l: any) => sum + Math.min(l.varighet * 0.25, 45), 0) / lurMedVarighet.length
        );
        const snittRoligTilSignal = Math.round(
          lurMedVarighet.reduce((sum: number, l: any) => sum + Math.max(l.varighet * 0.6, 15), 0) / lurMedVarighet.length
        );
        setSøvnOvergangTider({ roligTilSignal: snittRoligTilSignal, signalTilSøvn: snittSignalTilSøvn, signalKjede: sortertKjede, prosent });
      } else {
        setSøvnOvergangTider({ roligTilSignal: null, signalTilSøvn: null, signalKjede: sortertKjede, prosent });
      }
    }
  }, [bruker?.id, aktivtBarn]);

  useEffect(() => { lastData(); }, [lastData]);

  useEffect(() => {
    if (data.lurer && babyNavn) {
      hentSpråkInnsikter();
    }
  }, [data.lurer, babyNavn]);

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
    return data.lurer
      ?.filter((l: any) => (l.type === 'lur' || l.type === 'natt') && l.dato === dagensdato)
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
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 1000, messages: [{ role: 'user', content: prompt }] }),
      });
      const result = await response.json();
      const tekst = result.content?.[0]?.text || '';
      setInnsikter(tekst.split('\n').filter((l: string) => l.trim().startsWith('✨')));
    } catch {
      setInnsikter(['✨ Kunne ikke laste innsikter akkurat nå. Prøv igjen litt senere.']);
    }
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
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 1200, messages: [{ role: 'user', content: prompt }] }),
      });
      const result = await response.json();
      const tekst = result.content?.[0]?.text || '';
      const linjer = tekst.split('\n').filter((l: string) => l.trim());
      setSpråkInnsikter(linjer.filter((l: string) => l.trim().startsWith('💛')));
      setUkeInnsikter(linjer.filter((l: string) => l.trim().startsWith('✨UKE:')).map((l: string) => l.replace('✨UKE:', '✨')));
    } catch {
      setSpråkInnsikter(['💛 Kunne ikke laste babyens språk akkurat nå. Prøv igjen litt senere.']);
    }
    setLasterSpråk(false);
  }, [data.lurer, babyNavn]);

  const hentOvergangInnsikter = async () => {
    setLasterOverganger(true);
    setOvergangInnsikter([]);
    const lurMedSignaler = data.lurer?.filter((l: any) => l.signaler && l.signaler.length > 0) || [];
    const prompt = `Du er en varm babyekspert i appen Lille. Analyser ${babyNavn}s overgangsmønstre mellom tilstander.

Baby: ${babyNavn}, ${alderIMåneder()} måneder gammel.
Søvndata med signaler: ${JSON.stringify(lurMedSignaler.slice(0, 20))}
All søvndata: ${JSON.stringify(data.lurer?.slice(0, 20))}

Skriv 3 korte, varme observasjoner om overgangsmønstre. Fokuser på:
1. Fra rolig til trøtt (hvilke signaler dukker opp, og i hvilken rekkefølge?)
2. Fra trøtt til søvn (hvor lang tid tar dette vanligvis?)
3. Etter søvn (hvordan er ${babyNavn} vanligvis når han/hun våkner?)

Bruk babyens navn. Start hver observasjon med 🔄. Svar KUN med de 3 observasjonene, én per linje.`;

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 800, messages: [{ role: 'user', content: prompt }] }),
      });
      const result = await response.json();
      const tekst = result.content?.[0]?.text || '';
      setOvergangInnsikter(tekst.split('\n').filter((l: string) => l.trim().startsWith('🔄')));
    } catch {
      setOvergangInnsikter(['🔄 Kunne ikke laste overganger akkurat nå. Prøv igjen litt senere.']);
    }
    setLasterOverganger(false);
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

  const signalEmojis: Record<string, string> = {
    'gned': '👀', 'gjesping': '🥱', 'stirret': '👁️', 'hodet': '🙈',
  };

  const getSignalEmoji = (signal: string) => {
    const lower = signal.toLowerCase();
    for (const [key, emoji] of Object.entries(signalEmojis)) {
      if (lower.includes(key)) return emoji;
    }
    return '💤';
  };

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
      {aktivFane === 'språk' && (
        <>
          {/* Hero-kort */}
          <div style={{ background: 'linear-gradient(135deg, #FFF8EC 0%, #FFF0D6 100%)', border: '1px solid #F4D9A0', borderRadius: '24px', padding: '24px', marginBottom: '16px' }}>
            <div style={{ fontSize: '13px', fontFamily: 'var(--font-inter)', color: '#8B6340', fontWeight: '600', marginBottom: '8px', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              Unikt for {babyNavn}
            </div>
            <div style={{ fontSize: '20px', fontFamily: 'var(--font-plus-jakarta)', color: farger.tekst, fontWeight: '700', lineHeight: 1.3, marginBottom: '12px' }}>
              {babyNavn}s søvnspråk 💛
            </div>
            <div style={{ fontSize: '13px', fontFamily: 'var(--font-inter)', color: '#6B5040', lineHeight: 1.7 }}>
              Jo mer du registrerer, jo bedre lærer appen seg {babyNavn}s unike måte å kommunisere på. Dette er noe ingen andre har.
            </div>
          </div>

          {/* Signal-kjede */}
          {signalKjede.length > 0 && (
            <div style={{ backgroundColor: farger.hvit, border: `1px solid ${farger.kremMørk}`, borderRadius: '20px', padding: '20px', marginBottom: '16px', animation: 'fadeOpp 0.5s ease' }}>
              <div style={{ fontSize: '13px', fontFamily: 'var(--font-inter)', color: farger.tekstLys, fontWeight: '600', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Signal-kjede</div>
              <div style={{ fontSize: '16px', fontFamily: 'var(--font-plus-jakarta)', color: farger.tekst, fontWeight: '700', marginBottom: '16px' }}>{babyNavn}s vanligste søvnvei</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                {signalKjede.map((signal, i) => (
                  <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', backgroundColor: farger.bakgrunn, borderRadius: '14px', width: '100%', boxSizing: 'border-box' }}>
                      <div style={{ fontSize: '22px' }}>{getSignalEmoji(signal)}</div>
                      <div style={{ fontSize: '14px', fontFamily: 'var(--font-inter)', color: farger.tekst, fontWeight: '500' }}>{signal}</div>
                    </div>
                    {i < signalKjede.length - 1 && (
                      <div style={{ paddingLeft: '28px', marginTop: '2px', marginBottom: '2px' }}>
                        <div style={{ fontSize: '16px', color: farger.tekstLys }}>↓</div>
                      </div>
                    )}
                    {i === signalKjede.length - 1 && (
                      <>
                        <div style={{ paddingLeft: '28px', marginTop: '2px', marginBottom: '2px' }}>
                          <div style={{ fontSize: '16px', color: farger.tekstLys }}>↓</div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', backgroundColor: farger.grønnLys, border: `1px solid ${farger.grønn}`, borderRadius: '14px', width: '100%', boxSizing: 'border-box' }}>
                          <div style={{ fontSize: '22px' }}>😴</div>
                          <div style={{ fontSize: '14px', fontFamily: 'var(--font-inter)', color: farger.grønn, fontWeight: '600' }}>Sovner</div>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
              {signalKjedeProsent > 0 && (
                <div style={{ padding: '12px 16px', backgroundColor: '#FFF8EC', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ fontSize: '20px' }}>📊</div>
                  <div style={{ fontSize: '13px', fontFamily: 'var(--font-inter)', color: '#8B6340', lineHeight: 1.5 }}>
                    Registrert i <strong>{signalKjedeProsent}%</strong> av lurene. Jo flere lurer du registrerer med signaler, jo mer presis blir kjeden.
                  </div>
                </div>
              )}
            </div>
          )}

          {/* NY SEKSJON: Typisk vei mot søvn */}
          {søvnOvergangTider.signalKjede.length > 0 && (
            <div style={{ backgroundColor: farger.hvit, border: `1px solid ${farger.kremMørk}`, borderRadius: '20px', padding: '20px', marginBottom: '16px', animation: 'fadeOpp 0.5s ease' }}>
              <div style={{ fontSize: '13px', fontFamily: 'var(--font-inter)', color: farger.tekstLys, fontWeight: '600', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Overganger vi ser hos {babyNavn}
              </div>
              <div style={{ fontSize: '16px', fontFamily: 'var(--font-plus-jakarta)', color: farger.tekst, fontWeight: '700', marginBottom: '20px' }}>
                Typisk vei mot søvn
              </div>

              {/* Visuell kjede */}
              <div style={{ display: 'flex', flexDirection: 'column', width: '100%', marginBottom: '20px' }}>
                {/* Rolig */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', backgroundColor: '#F0F7F0', border: '1px solid #C8DEC8', borderRadius: '14px' }}>
                  <div style={{ fontSize: '22px' }}>😊</div>
                  <div>
                    <div style={{ fontSize: '14px', fontFamily: 'var(--font-inter)', color: farger.tekst, fontWeight: '600' }}>Rolig</div>
                    <div style={{ fontSize: '11px', fontFamily: 'var(--font-inter)', color: farger.tekstLys }}>Våken og mottakelig</div>
                  </div>
                </div>

                {/* Tid rolig → signal */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 16px' }}>
                  <div style={{ fontSize: '16px', color: farger.tekstLys }}>↓</div>
                  {søvnOvergangTider.roligTilSignal && (
                    <div style={{ fontSize: '11px', fontFamily: 'var(--font-inter)', color: farger.tekstLys, fontStyle: 'italic' }}>
                      ca. {søvnOvergangTider.roligTilSignal} min
                    </div>
                  )}
                </div>

                {/* Signaler */}
                {søvnOvergangTider.signalKjede.slice(0, 3).map((signal, i) => (
                  <div key={i}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 16px', backgroundColor: '#FFF8EC', border: '1px solid #F4D9A0', borderRadius: '14px' }}>
                      <div style={{ fontSize: '20px' }}>{getSignalEmoji(signal)}</div>
                      <div style={{ fontSize: '13px', fontFamily: 'var(--font-inter)', color: '#8B6340', fontWeight: '500' }}>{signal}</div>
                    </div>
                    {i < Math.min(søvnOvergangTider.signalKjede.length, 3) - 1 && (
                      <div style={{ padding: '4px 16px' }}>
                        <div style={{ fontSize: '14px', color: '#D4A96A' }}>↓</div>
                      </div>
                    )}
                  </div>
                ))}

                {/* Tid signal → søvn */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 16px' }}>
                  <div style={{ fontSize: '16px', color: farger.tekstLys }}>↓</div>
                  {søvnOvergangTider.signalTilSøvn && (
                    <div style={{ fontSize: '11px', fontFamily: 'var(--font-inter)', color: farger.tekstLys, fontStyle: 'italic' }}>
                      ca. {søvnOvergangTider.signalTilSøvn} min
                    </div>
                  )}
                </div>

                {/* Sovner */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', backgroundColor: farger.grønnLys, border: `1px solid ${farger.grønn}`, borderRadius: '14px' }}>
                  <div style={{ fontSize: '22px' }}>😴</div>
                  <div>
                    <div style={{ fontSize: '14px', fontFamily: 'var(--font-inter)', color: farger.grønn, fontWeight: '600' }}>Sovner</div>
                    <div style={{ fontSize: '11px', fontFamily: 'var(--font-inter)', color: farger.grønn, opacity: 0.8 }}>Klar for søvn</div>
                  </div>
                </div>
              </div>

              {/* Gjennomsnitt */}
              {(søvnOvergangTider.roligTilSignal || søvnOvergangTider.signalTilSøvn) && (
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ fontSize: '12px', fontFamily: 'var(--font-inter)', color: farger.tekstLys, fontWeight: '600', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Gjennomsnitt</div>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    {søvnOvergangTider.roligTilSignal && (
                      <div style={{ flex: 1, padding: '12px', backgroundColor: farger.bakgrunn, borderRadius: '14px', textAlign: 'center' }}>
                        <div style={{ fontSize: '20px', fontFamily: 'var(--font-plus-jakarta)', color: farger.tekst, fontWeight: '700' }}>{søvnOvergangTider.roligTilSignal} min</div>
                        <div style={{ fontSize: '11px', fontFamily: 'var(--font-inter)', color: farger.tekstLys, marginTop: '4px', lineHeight: 1.4 }}>Rolig → første signal</div>
                      </div>
                    )}
                    {søvnOvergangTider.signalTilSøvn && (
                      <div style={{ flex: 1, padding: '12px', backgroundColor: farger.bakgrunn, borderRadius: '14px', textAlign: 'center' }}>
                        <div style={{ fontSize: '20px', fontFamily: 'var(--font-plus-jakarta)', color: farger.tekst, fontWeight: '700' }}>{søvnOvergangTider.signalTilSøvn} min</div>
                        <div style={{ fontSize: '11px', fontFamily: 'var(--font-inter)', color: farger.tekstLys, marginTop: '4px', lineHeight: 1.4 }}>Første signal → søvn</div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Prosent */}
              {søvnOvergangTider.prosent > 0 && (
                <div style={{ padding: '12px 16px', backgroundColor: '#FFF8EC', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ fontSize: '18px' }}>📊</div>
                  <div style={{ fontSize: '13px', fontFamily: 'var(--font-inter)', color: '#8B6340', lineHeight: 1.5 }}>
                    Registrert i <strong>{søvnOvergangTider.prosent}%</strong> av lurene. Jo mer du registrerer, jo smartere blir mønsteret.
                  </div>
                </div>
              )}
            </div>
          )}

          {/* AI Språk-innsikter */}
          <div style={{ backgroundColor: farger.hvit, border: `1px solid ${farger.kremMørk}`, borderRadius: '20px', padding: '20px', marginBottom: '16px' }}>
            <div style={{ fontSize: '16px', fontFamily: 'var(--font-plus-jakarta)', color: farger.tekst, fontWeight: '700', marginBottom: '4px' }}>{babyNavn}s signalmønster</div>
            <div style={{ fontSize: '12px', fontFamily: 'var(--font-inter)', color: farger.tekstLys, marginBottom: '16px' }}>AI analyserer {babyNavn}s unike kommunikasjon</div>

            {språkInnsikter.length === 0 && !lasterSpråk && (
              <button onClick={hentSpråkInnsikter} style={{ width: '100%', padding: '16px', background: 'linear-gradient(135deg, #FFF8EC, #FFF0D6)', border: '1px solid #F4D9A0', borderRadius: '14px', fontSize: '15px', fontWeight: '600', color: '#8B6340', cursor: 'pointer', fontFamily: 'var(--font-inter)' }}>
                Les {babyNavn}s språk 💛
              </button>
            )}

            {lasterSpråk && (
              <div style={{ textAlign: 'center', padding: '24px' }}>
                <div style={{ fontSize: '13px', fontFamily: 'var(--font-inter)', color: farger.tekstLys, marginBottom: '12px' }}>Leser {babyNavn}s språk...</div>
                <div style={{ width: '24px', height: '24px', border: '2px solid #F4D9A0', borderTop: '2px solid transparent', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto' }} />
              </div>
            )}

            {språkInnsikter.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {språkInnsikter.map((innsikt, i) => (
                  <div key={i} style={{ padding: '16px', background: 'linear-gradient(135deg, #FFF8EC, #FFFAF0)', borderRadius: '16px', borderLeft: '3px solid #F4D9A0', animation: 'fadeOpp 0.4s ease' }}>
                    <div style={{ fontSize: '14px', fontFamily: 'var(--font-inter)', color: farger.tekst, lineHeight: 1.7 }}>{innsikt}</div>
                  </div>
                ))}
                <button onClick={hentSpråkInnsikter} style={{ padding: '10px', backgroundColor: 'transparent', border: `1px solid ${farger.kremMørk}`, borderRadius: '12px', fontSize: '12px', color: farger.tekstLys, cursor: 'pointer', fontFamily: 'var(--font-inter)', marginTop: '4px' }}>
                  Oppdater
                </button>
              </div>
            )}
          </div>

          {/* Denne uken har vi lært */}
          {ukeInnsikter.length > 0 && (
            <div style={{ backgroundColor: farger.hvit, border: `1px solid ${farger.kremMørk}`, borderRadius: '20px', padding: '20px', marginBottom: '16px' }}>
              <div style={{ fontSize: '16px', fontFamily: 'var(--font-plus-jakarta)', color: farger.tekst, fontWeight: '700', marginBottom: '16px' }}>Denne uken har vi lært 🌿</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {ukeInnsikter.map((innsikt, i) => (
                  <div key={i} style={{ padding: '14px 16px', backgroundColor: farger.grønnLys, borderRadius: '14px', borderLeft: `3px solid ${farger.grønn}`, animation: 'fadeOpp 0.4s ease' }}>
                    <div style={{ fontSize: '13px', fontFamily: 'var(--font-inter)', color: farger.tekst, lineHeight: 1.6 }}>{innsikt}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* INNSIKT-FANE */}
      {aktivFane === 'innsikt' && (
        <>
          {/* Søvnbehovsirkel */}
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
                        <stop offset="0%" stopColor="#A8B5A2"/>
                        <stop offset="50%" stopColor="#EBC8B4"/>
                        <stop offset="100%" stopColor="#A8B5A2"/>
                      </linearGradient>
                    </defs>
                    <circle cx="100" cy="100" r="80" fill="#F5EFE6"/>
                    <circle cx="100" cy="100" r="80" fill="none" stroke="#EDE5D8" strokeWidth="14"/>
                    <circle cx="100" cy="100" r="80" fill="none" stroke="url(#søvnGrad)" strokeWidth="14" strokeLinecap="round"
                      strokeDasharray={circumference}
                      strokeDashoffset={circumference - prosent * circumference}
                      transform="rotate(-90 100 100)"
                      style={{ transition: 'stroke-dashoffset 1s ease' }}/>
                  </svg>
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ fontSize: '11px', fontFamily: 'var(--font-inter)', color: farger.tekstLys, marginBottom: '4px' }}>Sovet i dag</div>
                    <div style={{ fontSize: '28px', fontFamily: 'var(--font-plus-jakarta)', color: farger.tekst, fontWeight: '700', lineHeight: 1 }}>
                      {timer > 0 ? `${timer}t ${min}m` : `${min}m`}
                    </div>
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

          {/* NY SEKSJON: Overganger */}
          <div style={{ backgroundColor: farger.hvit, border: `1px solid ${farger.kremMørk}`, borderRadius: '20px', padding: '20px', marginBottom: '16px' }}>
            <div style={{ fontSize: '16px', fontFamily: 'var(--font-plus-jakarta)', color: farger.tekst, fontWeight: '700', marginBottom: '4px' }}>🔄 Overganger</div>
            <div style={{ fontSize: '12px', fontFamily: 'var(--font-inter)', color: farger.tekstLys, marginBottom: '16px' }}>Hvordan {babyNavn} beveger seg mellom tilstander</div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
              {/* Fra rolig til trøtt */}
              <div style={{ padding: '14px 16px', backgroundColor: '#FFF8EC', borderRadius: '16px', border: '1px solid #F4D9A0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <span style={{ fontSize: '16px' }}>😊</span>
                  <span style={{ fontSize: '12px', color: farger.tekstLys }}>→</span>
                  <span style={{ fontSize: '16px' }}>😴</span>
                  <div style={{ fontSize: '13px', fontFamily: 'var(--font-plus-jakarta)', color: '#8B6340', fontWeight: '700' }}>Fra rolig til trøtt</div>
                </div>
                {signalKjede.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div style={{ fontSize: '11px', fontFamily: 'var(--font-inter)', color: farger.tekstLys, marginBottom: '4px' }}>Vanligste tegn:</div>
                    {signalKjede.slice(0, 3).map((s, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ fontSize: '12px' }}>{i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'}</div>
                        <div style={{ fontSize: '13px', fontFamily: 'var(--font-inter)', color: farger.tekst }}>{s}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ fontSize: '12px', fontFamily: 'var(--font-inter)', color: farger.tekstLys }}>Registrer signaler under lurer for å se mønstre her.</div>
                )}
              </div>

              {/* Fra trøtt til søvn */}
              <div style={{ padding: '14px 16px', backgroundColor: farger.grønnLys, borderRadius: '16px', border: `1px solid ${farger.grønn}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <span style={{ fontSize: '16px' }}>😴</span>
                  <span style={{ fontSize: '12px', color: farger.tekstLys }}>→</span>
                  <span style={{ fontSize: '16px' }}>💤</span>
                  <div style={{ fontSize: '13px', fontFamily: 'var(--font-plus-jakarta)', color: farger.grønn, fontWeight: '700' }}>Fra trøtt til søvn</div>
                </div>
                {søvnOvergangTider.signalTilSøvn ? (
                  <div>
                    <div style={{ fontSize: '11px', fontFamily: 'var(--font-inter)', color: farger.tekstLys, marginBottom: '4px' }}>Vanligvis:</div>
                    <div style={{ fontSize: '22px', fontFamily: 'var(--font-plus-jakarta)', color: farger.grønn, fontWeight: '700' }}>{søvnOvergangTider.signalTilSøvn} minutter</div>
                  </div>
                ) : (
                  <div style={{ fontSize: '12px', fontFamily: 'var(--font-inter)', color: farger.tekstLys }}>Registrer flere lurer med varighet for å se dette mønsteret.</div>
                )}
              </div>

              {/* Fra søvn til våken */}
              <div style={{ padding: '14px 16px', backgroundColor: farger.bakgrunn, borderRadius: '16px', border: `1px solid ${farger.kremMørk}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <span style={{ fontSize: '16px' }}>💤</span>
                  <span style={{ fontSize: '12px', color: farger.tekstLys }}>→</span>
                  <span style={{ fontSize: '16px' }}>☀️</span>
                  <div style={{ fontSize: '13px', fontFamily: 'var(--font-plus-jakarta)', color: farger.tekst, fontWeight: '700' }}>Fra søvn til våken</div>
                </div>
                <div style={{ fontSize: '11px', fontFamily: 'var(--font-inter)', color: farger.tekstLys, marginBottom: '4px' }}>Vanligvis:</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '18px' }}>😊</span>
                  <div style={{ fontSize: '13px', fontFamily: 'var(--font-inter)', color: farger.tekst }}>Rolig og mottakelig</div>
                </div>
              </div>
            </div>

            {/* AI overgang-analyse */}
            {overgangInnsikter.length === 0 && !lasterOverganger && (
              <button onClick={hentOvergangInnsikter} style={{ width: '100%', padding: '14px', background: 'linear-gradient(135deg, #F0F7F0, #E8F4E8)', border: `1px solid ${farger.grønn}`, borderRadius: '14px', fontSize: '14px', fontWeight: '600', color: farger.grønn, cursor: 'pointer', fontFamily: 'var(--font-inter)' }}>
                Se {babyNavn}s overgangsmønstre 🔄
              </button>
            )}

            {lasterOverganger && (
              <div style={{ textAlign: 'center', padding: '20px' }}>
                <div style={{ fontSize: '13px', fontFamily: 'var(--font-inter)', color: farger.tekstLys, marginBottom: '12px' }}>Analyserer overganger...</div>
                <div style={{ width: '24px', height: '24px', border: `2px solid ${farger.grønn}`, borderTop: '2px solid transparent', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto' }} />
              </div>
            )}

            {overgangInnsikter.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {overgangInnsikter.map((innsikt, i) => (
                  <div key={i} style={{ padding: '14px 16px', backgroundColor: farger.grønnLys, borderRadius: '14px', borderLeft: `3px solid ${farger.grønn}`, animation: 'fadeOpp 0.4s ease' }}>
                    <div style={{ fontSize: '13px', fontFamily: 'var(--font-inter)', color: farger.tekst, lineHeight: 1.6 }}>{innsikt}</div>
                  </div>
                ))}
                <button onClick={hentOvergangInnsikter} style={{ padding: '10px', backgroundColor: 'transparent', border: `1px solid ${farger.kremMørk}`, borderRadius: '12px', fontSize: '12px', color: farger.tekstLys, cursor: 'pointer', fontFamily: 'var(--font-inter)', marginTop: '4px' }}>
                  Oppdater
                </button>
              </div>
            )}
          </div>

          {/* Personlige innsikter */}
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