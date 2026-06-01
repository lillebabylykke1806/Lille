'use client';
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { farger } from '../../lib/farger';

type Props = { bruker: any; };

export default function Innsikt({ bruker }: Props) {
  const [aktivFane, setAktivFane] = useState<'innsikt' | 'språk'>('innsikt');
  const [innsikter, setInnsikter] = useState<string[]>([]);
  const [språkInnsikter, setSpråkInnsikter] = useState<string[]>([]);
  const [lasterInnsikt, setLasterInnsikt] = useState(false);
  const [lasterSpråk, setLasterSpråk] = useState(false);
  const [babyNavn, setBabyNavn] = useState('');
  const [fødselsdato, setFødselsdato] = useState('');
  const [data, setData] = useState<any>({});

  const lastData = useCallback(async () => {
    // Hent profil
    const { data: profil } = await supabase
      .from('profiler')
      .select('*')
      .eq('id', bruker?.id)
      .single();
    if (profil?.baby_navn) setBabyNavn(profil.baby_navn);
    if (profil?.fødselsdato) setFødselsdato(profil.fødselsdato);

    // Siste 7 dager
    const syvDagerSiden = new Date();
    syvDagerSiden.setDate(syvDagerSiden.getDate() - 7);
    const fraDate = syvDagerSiden.toISOString().split('T')[0];

    const [lurer, amming, bleie] = await Promise.all([
      supabase.from('lurer').select('*').eq('profil_id', bruker?.id).gte('dato', fraDate),
      supabase.from('amming').select('*').eq('profil_id', bruker?.id).gte('dato', fraDate),
      supabase.from('bleie').select('*').eq('profil_id', bruker?.id).gte('dato', fraDate),
    ]);

    setData({
      lurer: lurer.data || [],
      amming: amming.data || [],
      bleie: bleie.data || [],
    });
  }, [bruker?.id]);

  useEffect(() => {
    lastData();
  }, [lastData]);

  const alderIMåneder = () => {
    if (!fødselsdato) return 0;
    const nå = new Date();
    const født = new Date(fødselsdato);
    return (nå.getFullYear() - født.getFullYear()) * 12 + (nå.getMonth() - født.getMonth());
  };

  const hentInnsikter = async () => {
    setLasterInnsikt(true);
    setInnsikter([]);

    const prompt = `Du er en varm og empatisk babyekspert i en app som heter Lille. Analyser denne babyens data fra de siste 7 dagene og gi 4-6 personlige innsikter på norsk.

Baby: ${babyNavn}, ${alderIMåneder()} måneder gammel.

Søvndata (${data.lurer?.length || 0} registreringer):
${JSON.stringify(data.lurer?.slice(0, 20))}

Ammingdata (${data.amming?.length || 0} registreringer):
${JSON.stringify(data.amming?.slice(0, 20))}

Bleiedata (${data.bleie?.length || 0} registreringer):
${JSON.stringify(data.bleie?.slice(0, 10))}

Skriv 4-6 korte, personlige og varme innsikter om mønstre du ser. Bruk babyens navn. Start hver innsikt med ✨. Fokuser på søvnmønstre, ammingsfrekvens, og daglige rytmer. Svar KUN med innsiktene, én per linje. Ikke skriv noe annet.`;

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          messages: [{ role: 'user', content: prompt }],
        }),
      });
      const result = await response.json();
      const tekst = result.content?.[0]?.text || '';
      const linjer = tekst.split('\n').filter((l: string) => l.trim().startsWith('✨'));
      setInnsikter(linjer);
    } catch (e) {
      setInnsikter(['✨ Kunne ikke laste innsikter akkurat nå. Prøv igjen litt senere.']);
    }
    setLasterInnsikt(false);
  };

  const hentSpråkInnsikter = async () => {
    setLasterSpråk(true);
    setSpråkInnsikter([]);

    const signaler = data.lurer?.flatMap((l: any) => l.signaler || []) || [];
    const signalTekst = signaler.length > 0
      ? `Registrerte signaler: ${JSON.stringify(signaler)}`
      : 'Ingen signaler registrert ennå.';

    const prompt = `Du er en varm babyekspert i appen Lille. Analyser babyens signaler og søvndata og fortell foreldrene om "babyens språk" på norsk.

Baby: ${babyNavn}, ${alderIMåneder()} måneder gammel.

${signalTekst}

Søvndata: ${JSON.stringify(data.lurer?.slice(0, 15))}

Skriv 4-5 korte, varme og personlige observasjoner om:
- Vanligste trøtthetssignaler
- Tegn før søvn
- Mønstre i babyens kommunikasjon
- Hvordan signalene passer for alder

Start hver observasjon med 💛. Bruk babyens navn. Svar KUN med observasjonene, én per linje.`;

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          messages: [{ role: 'user', content: prompt }],
        }),
      });
      const result = await response.json();
      const tekst = result.content?.[0]?.text || '';
      const linjer = tekst.split('\n').filter((l: string) => l.trim().startsWith('💛'));
      setSpråkInnsikter(linjer);
    } catch (e) {
      setSpråkInnsikter(['💛 Kunne ikke laste babyens språk akkurat nå. Prøv igjen litt senere.']);
    }
    setLasterSpråk(false);
  };

  const StatKort = ({ tittel, verdi, undertekst }: { tittel: string; verdi: string; undertekst: string }) => (
    <div style={{ backgroundColor: farger.hvit, border: `1px solid ${farger.kremMørk}`, borderRadius: '16px', padding: '16px', flex: 1 }}>
      <div style={{ fontSize: '11px', fontFamily: 'var(--font-inter)', color: farger.tekstLys, marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{tittel}</div>
      <div style={{ fontSize: '22px', fontFamily: 'var(--font-plus-jakarta)', color: farger.tekst, fontWeight: '700', marginBottom: '4px' }}>{verdi}</div>
      <div style={{ fontSize: '11px', fontFamily: 'var(--font-inter)', color: farger.tekstLys }}>{undertekst}</div>
    </div>
  );

  const totalSøvnMinutter = data.lurer
    ?.filter((l: any) => l.type === 'lur' || l.type === 'natt')
    ?.reduce((sum: number, l: any) => sum + (l.varighet || 0), 0) || 0;

  const antallLurer = data.lurer?.filter((l: any) => l.type === 'lur')?.length || 0;
  const antallAmming = data.amming?.length || 0;
  const antallBleier = data.bleie?.length || 0;

  return (
    <div style={{ backgroundColor: farger.bakgrunn, minHeight: '100vh', padding: '24px 24px 100px' }}>

      {/* Header */}
      <div style={{ marginBottom: '24px', textAlign: 'center' }}>
        <div style={{ fontSize: '26px', fontFamily: 'var(--font-plus-jakarta)', color: farger.tekst, fontWeight: '700', marginBottom: '4px' }}>
          Innsikt
        </div>
        <div style={{ fontSize: '13px', fontFamily: 'var(--font-inter)', color: farger.tekstLys }}>
          Basert på de siste 7 dagene
        </div>
      </div>

      {/* Faner */}
      <div style={{ display: 'flex', backgroundColor: farger.kremMørk, borderRadius: '16px', padding: '4px', marginBottom: '20px' }}>
        <button
          onClick={() => setAktivFane('innsikt')}
          style={{ flex: 1, padding: '10px', borderRadius: '12px', border: 'none', backgroundColor: aktivFane === 'innsikt' ? farger.hvit : 'transparent', color: aktivFane === 'innsikt' ? farger.tekst : farger.tekstLys, fontSize: '13px', fontFamily: 'var(--font-inter)', fontWeight: aktivFane === 'innsikt' ? '600' : '400', cursor: 'pointer', transition: 'all 0.2s ease' }}
        >
          ✨ Innsikt
        </button>
        <button
          onClick={() => setAktivFane('språk')}
          style={{ flex: 1, padding: '10px', borderRadius: '12px', border: 'none', backgroundColor: aktivFane === 'språk' ? farger.hvit : 'transparent', color: aktivFane === 'språk' ? farger.tekst : farger.tekstLys, fontSize: '13px', fontFamily: 'var(--font-inter)', fontWeight: aktivFane === 'språk' ? '600' : '400', cursor: 'pointer', transition: 'all 0.2s ease' }}
        >
          💛 Babyens språk
        </button>
      </div>

      {/* INNSIKT-FANE */}
      {aktivFane === 'innsikt' && (
        <>
          {/* Statistikk-kort */}
          <div style={{ display: 'flex', gap: '10px', marginBottom: '12px' }}>
            <StatKort
              tittel="Søvn siste 7 dager"
              verdi={`${Math.floor(totalSøvnMinutter / 60)}t`}
              undertekst={`${antallLurer} lurer registrert`}
            />
            <StatKort
              tittel="Amminger"
              verdi={`${antallAmming}`}
              undertekst="siste 7 dager"
            />
          </div>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
            <StatKort
              tittel="Bleieskift"
              verdi={`${antallBleier}`}
              undertekst="siste 7 dager"
            />
            <StatKort
              tittel="Alder"
              verdi={`${alderIMåneder()} mnd`}
              undertekst={babyNavn}
            />
          </div>

          {/* AI Innsikter */}
          <div style={{ backgroundColor: farger.hvit, border: `1px solid ${farger.kremMørk}`, borderRadius: '20px', padding: '20px', marginBottom: '12px' }}>
            <div style={{ fontSize: '15px', fontFamily: 'var(--font-plus-jakarta)', color: farger.tekst, fontWeight: '600', marginBottom: '4px' }}>
              Personlige innsikter
            </div>
            <div style={{ fontSize: '12px', fontFamily: 'var(--font-inter)', color: farger.tekstLys, marginBottom: '16px' }}>
              AI analyserer {babyNavn}s mønstre
            </div>

            {innsikter.length === 0 && !lasterInnsikt && (
              <button
                onClick={hentInnsikter}
                style={{ width: '100%', padding: '14px', backgroundColor: farger.grønnLys, border: `1px solid ${farger.grønn}`, borderRadius: '14px', fontSize: '14px', fontWeight: '600', color: farger.grønn, cursor: 'pointer', fontFamily: 'var(--font-inter)' }}
              >
                Analyser {babyNavn}s data ✨
              </button>
            )}

            {lasterInnsikt && (
              <div style={{ textAlign: 'center', padding: '20px' }}>
                <div style={{ fontSize: '13px', fontFamily: 'var(--font-inter)', color: farger.tekstLys, marginBottom: '12px' }}>
                  Analyserer {babyNavn}s mønstre...
                </div>
                <div style={{ width: '24px', height: '24px', border: `2px solid ${farger.grønn}`, borderTop: '2px solid transparent', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto' }} />
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
              </div>
            )}

            {innsikter.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {innsikter.map((innsikt, i) => (
                  <div key={i} style={{ padding: '14px', backgroundColor: farger.bakgrunn, borderRadius: '14px', borderLeft: `3px solid ${farger.grønn}` }}>
                    <div style={{ fontSize: '13px', fontFamily: 'var(--font-inter)', color: farger.tekst, lineHeight: 1.6 }}>
                      {innsikt}
                    </div>
                  </div>
                ))}
                <button
                  onClick={hentInnsikter}
                  style={{ padding: '10px', backgroundColor: 'transparent', border: `1px solid ${farger.kremMørk}`, borderRadius: '12px', fontSize: '12px', color: farger.tekstLys, cursor: 'pointer', fontFamily: 'var(--font-inter)', marginTop: '4px' }}
                >
                  Oppdater innsikter
                </button>
              </div>
            )}
          </div>
        </>
      )}

      {/* BABYENS SPRÅK-FANE */}
      {aktivFane === 'språk' && (
        <>
          <div style={{ backgroundColor: '#FFF8EC', border: `1px solid #F4D9A0`, borderRadius: '16px', padding: '16px 20px', marginBottom: '16px' }}>
            <div style={{ fontSize: '14px', fontFamily: 'var(--font-plus-jakarta)', color: farger.tekst, fontWeight: '600', marginBottom: '6px' }}>
              💛 Hva er Babyens språk?
            </div>
            <div style={{ fontSize: '13px', fontFamily: 'var(--font-inter)', color: farger.tekstLys, lineHeight: 1.7 }}>
              Alle babyer kommuniserer på sin egen unike måte. Jo mer du registrerer, jo bedre lærer appen seg {babyNavn}s personlige språk.
            </div>
          </div>

          <div style={{ backgroundColor: farger.hvit, border: `1px solid ${farger.kremMørk}`, borderRadius: '20px', padding: '20px', marginBottom: '12px' }}>
            <div style={{ fontSize: '15px', fontFamily: 'var(--font-plus-jakarta)', color: farger.tekst, fontWeight: '600', marginBottom: '4px' }}>
              {babyNavn}s signaler
            </div>
            <div style={{ fontSize: '12px', fontFamily: 'var(--font-inter)', color: farger.tekstLys, marginBottom: '16px' }}>
              Basert på registrerte søvnsignaler
            </div>

            {språkInnsikter.length === 0 && !lasterSpråk && (
              <button
                onClick={hentSpråkInnsikter}
                style={{ width: '100%', padding: '14px', backgroundColor: '#FFF8EC', border: `1px solid #F4D9A0`, borderRadius: '14px', fontSize: '14px', fontWeight: '600', color: '#8B6340', cursor: 'pointer', fontFamily: 'var(--font-inter)' }}
              >
                Les {babyNavn}s språk 💛
              </button>
            )}

            {lasterSpråk && (
              <div style={{ textAlign: 'center', padding: '20px' }}>
                <div style={{ fontSize: '13px', fontFamily: 'var(--font-inter)', color: farger.tekstLys, marginBottom: '12px' }}>
                  Leser {babyNavn}s språk...
                </div>
                <div style={{ width: '24px', height: '24px', border: `2px solid #F4D9A0`, borderTop: '2px solid transparent', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto' }} />
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
              </div>
            )}

            {språkInnsikter.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {språkInnsikter.map((innsikt, i) => (
                  <div key={i} style={{ padding: '14px', backgroundColor: '#FFF8EC', borderRadius: '14px', borderLeft: `3px solid #F4D9A0` }}>
                    <div style={{ fontSize: '13px', fontFamily: 'var(--font-inter)', color: farger.tekst, lineHeight: 1.6 }}>
                      {innsikt}
                    </div>
                  </div>
                ))}
                <button
                  onClick={hentSpråkInnsikter}
                  style={{ padding: '10px', backgroundColor: 'transparent', border: `1px solid ${farger.kremMørk}`, borderRadius: '12px', fontSize: '12px', color: farger.tekstLys, cursor: 'pointer', fontFamily: 'var(--font-inter)', marginTop: '4px' }}
                >
                  Oppdater
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}