'use client';
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { farger } from '../../lib/farger';

type Props = { bruker: any; aktivtBarn?: any; };

type UroLogg = {
  id: number;
  dato: string;
  tidspunkt: string;
  signaler: string[];
  tiltak: string[];
  varighet: number | null;
  resultat: 'bra' | 'delvis' | 'ikke' | null;
  notat: string | null;
};

const TILTAK = ['Babymassasje', 'Bæresjal', 'Amming', 'Flaske', 'Hud mot hud', 'Mørkt rom', 'Vugging', 'Hvit støy', 'Smokk'];
const SIGNALER_URO = ['Trekker bena opp', 'Bøyer ryggen', 'Vrir seg', 'Klynker', 'Høy gråt', 'Vil bæres', 'Vanskelig å legge ned', 'Mye luft', 'Slår med armer og ben'];

export default function Kolikk({ bruker, aktivtBarn }: Props) {
  const [logg, setLogg] = useState<UroLogg[]>([]);
  const [babyNavn, setBabyNavn] = useState('babyen');
  const [visRegistrer, setVisRegistrer] = useState(false);
  const [aiMønstre, setAiMønstre] = useState<string[]>([]);
  const [lasterAI, setLasterAI] = useState(false);
  const [nesteUro, setNesteUro] = useState<{ om: string; tidspunkt: string } | null>(null);
  const [tiltakStatistikk, setTiltakStatistikk] = useState<{ tiltak: string; fungerte: number; total: number }[]>([]);
  const [signalStatistikk, setSignalStatistikk] = useState<{ signal: string; prosent: number }[]>([]);

  const [nyTidspunkt, setNyTidspunkt] = useState(new Date().toLocaleTimeString('no-NO', { hour: '2-digit', minute: '2-digit' }));
  const [nySignaler, setNySignaler] = useState<string[]>([]);
  const [nyTiltak, setNyTiltak] = useState<string[]>([]);
  const [nyResultat, setNyResultat] = useState<'bra' | 'delvis' | 'ikke' | null>(null);
  const [nyVarighet, setNyVarighet] = useState('');
  const [nyNotat, setNyNotat] = useState('');
  const [lagrer, setLagrer] = useState(false);

  const lastData = useCallback(async () => {
    if (aktivtBarn?.navn) setBabyNavn(aktivtBarn.navn);
    else {
      const { data: barn } = await supabase.from('barn').select('*').eq('bruker_id', bruker?.id).single();
      if (barn?.navn) setBabyNavn(barn.navn);
    }

    const { data } = await supabase
      .from('uro_logg')
      .select('*')
      .eq('profil_id', bruker?.id)
      .order('dato', { ascending: false })
      .order('tidspunkt', { ascending: false });

    if (data) {
      const parsed = data.map((l: any) => ({
        ...l,
        signaler: l.signaler ? l.signaler.split(',').filter(Boolean) : [],
        tiltak: l.tiltak ? l.tiltak.split(',').filter(Boolean) : [],
      }));
      setLogg(parsed);
      beregnStatistikk(parsed);
      beregnNesteUro(parsed);
    }
  }, [bruker?.id, aktivtBarn?.navn]);

  const beregnStatistikk = (data: UroLogg[]) => {
    // Tiltak
    const tiltakTelling: Record<string, { fungerte: number; total: number }> = {};
    data.forEach(l => {
      l.tiltak.forEach(t => {
        if (!tiltakTelling[t]) tiltakTelling[t] = { fungerte: 0, total: 0 };
        tiltakTelling[t].total += 1;
        if (l.resultat === 'bra') tiltakTelling[t].fungerte += 1;
      });
    });
    setTiltakStatistikk(
      Object.entries(tiltakTelling)
        .map(([tiltak, d]) => ({ tiltak, fungerte: d.fungerte, total: d.total }))
        .sort((a, b) => (b.fungerte / b.total) - (a.fungerte / a.total))
    );

    // Signaler
    const signalTelling: Record<string, number> = {};
    data.forEach(l => l.signaler.forEach(s => { signalTelling[s] = (signalTelling[s] || 0) + 1; }));
    setSignalStatistikk(
      Object.entries(signalTelling)
        .map(([signal, antall]) => ({ signal, prosent: Math.round((antall / data.length) * 100) }))
        .sort((a, b) => b.prosent - a.prosent)
        .slice(0, 3)
    );
  };

  const beregnNesteUro = (data: UroLogg[]) => {
    if (data.length < 3) return;
    const tidspunkter = data.slice(0, 7).map(l => {
      const [h, m] = l.tidspunkt.split(':').map(Number);
      return h * 60 + m;
    });
    const gjsnitt = Math.round(tidspunkter.reduce((a, b) => a + b, 0) / tidspunkter.length);
    const nå = new Date();
    const nåMinutter = nå.getHours() * 60 + nå.getMinutes();
    const omMinutter = gjsnitt - nåMinutter;
    const timer = Math.floor(gjsnitt / 60);
    const min = gjsnitt % 60;
    const tidspunkt = `${String(timer).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
    if (omMinutter > 0 && omMinutter < 240) {
      setNesteUro({
        om: omMinutter < 60 ? `Om ca. ${omMinutter} min` : `Om ca. ${Math.floor(omMinutter / 60)}t ${omMinutter % 60}min`,
        tidspunkt,
      });
    }
  };

  const hentAIMønstre = async () => {
    if (logg.length < 3) return;
    setLasterAI(true);
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 400,
          messages: [{
            role: 'user',
            content: `Du er en varm babyekspert i appen Lille. Analyser disse uro-registreringene for ${babyNavn} og gi 3 korte mønstre/observasjoner på norsk. Start hver med ✨. Maks 1 setning per punkt. Vær konkret og handlingsrettet.

Data: ${JSON.stringify(logg.slice(0, 15))}

Svar KUN med de 3 punktene, én per linje.`
          }],
        }),
      });
      const result = await response.json();
      const tekst = result.content?.[0]?.text || '';
      setAiMønstre(tekst.split('\n').filter((l: string) => l.trim().startsWith('✨')));
    } catch {
      setAiMønstre(['✨ Registrer flere episoder for å se mønstre']);
    }
    setLasterAI(false);
  };

  const lagreUro = async () => {
    if (!nyTidspunkt) return;
    setLagrer(true);
    await supabase.from('uro_logg').insert({
      profil_id: bruker?.id,
      dato: new Date().toISOString().split('T')[0],
      tidspunkt: nyTidspunkt,
      signaler: nySignaler.join(','),
      tiltak: nyTiltak.join(','),
      resultat: nyResultat,
      varighet: nyVarighet ? parseInt(nyVarighet) : null,
      notat: nyNotat || null,
    });
    setNySignaler([]); setNyTiltak([]); setNyResultat(null); setNyVarighet(''); setNyNotat('');
    setVisRegistrer(false);
    setLagrer(false);
    lastData();
  };

  useEffect(() => {
    lastData();
  }, [lastData]);

  useEffect(() => {
    if (logg.length >= 3) hentAIMønstre();
  }, [logg]);

  const formatDato = (dato: string) => {
    const d = new Date(dato);
    return { dag: d.getDate(), mnd: d.toLocaleDateString('no-NO', { month: 'short' }).toUpperCase() };
  };

  const medalje = (i: number) => i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉';

  return (
    <div style={{ backgroundColor: farger.bakgrunn, minHeight: '100vh', padding: '0 0 100px' }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } } @keyframes fadeOpp { 0%{opacity:0;transform:translateY(8px)} 100%{opacity:1;transform:translateY(0)} }`}</style>

      {/* Header */}
      <div style={{ padding: '24px 24px 16px', textAlign: 'center' }}>
        <div style={{ fontSize: '26px', fontFamily: 'var(--font-plus-jakarta)', color: farger.tekst, fontWeight: '700', marginBottom: '4px' }}>🌙 Uro & Ro</div>
        <div style={{ fontSize: '13px', fontFamily: 'var(--font-inter)', color: farger.tekstLys }}>Forstå mønstrene bak de vanskelige stundene</div>
      </div>

      <div style={{ padding: '0 16px' }}>

        {/* PÅ VEI INN I UROPERIODE – vises hvis snart uro */}
        {nesteUro && parseInt(nesteUro.om.replace(/\D/g, '')) <= 60 && (
          <div style={{ backgroundColor: '#FFF3EE', border: '1px solid #F4C4A8', borderRadius: '20px', padding: '20px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'radial-gradient(circle, #F4A85340, transparent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', flexShrink: 0 }}>
              😟
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '11px', fontFamily: 'var(--font-inter)', color: '#C48E7B', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px' }}>Nå akkurat</div>
              <div style={{ fontSize: '17px', fontFamily: 'var(--font-plus-jakarta)', color: farger.tekst, fontWeight: '700', marginBottom: '4px' }}>På vei inn i uroperiode</div>
              <div style={{ fontSize: '13px', fontFamily: 'var(--font-inter)', color: farger.tekstLys, lineHeight: 1.5 }}>Vi har registrert signaler som ofte kommer før uro hos {babyNavn}.</div>
            </div>
          </div>
        )}

        {/* To kolonner: Neste uro + Signaler */}
        {logg.length >= 3 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>

            {/* Neste forventede uro */}
            <div style={{ backgroundColor: farger.hvit, border: `1px solid ${farger.kremMørk}`, borderRadius: '20px', padding: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: '#FFF3D6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px' }}>🕒</div>
                <div style={{ fontSize: '11px', fontFamily: 'var(--font-inter)', color: farger.grønn, fontWeight: '600' }}>Neste forventede uro</div>
              </div>
              <div style={{ fontSize: '22px', fontFamily: 'var(--font-plus-jakarta)', color: farger.tekst, fontWeight: '700', lineHeight: 1.1, marginBottom: '4px' }}>{nesteUro?.om || '—'}</div>
              <div style={{ fontSize: '12px', fontFamily: 'var(--font-inter)', color: farger.tekstLys, marginBottom: '12px' }}>Vanlig start: {nesteUro?.tidspunkt}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px', backgroundColor: farger.bakgrunn, borderRadius: '10px' }}>
                <div style={{ fontSize: '11px', fontFamily: 'var(--font-inter)', color: farger.tekstLys, flex: 1 }}>Varsle meg 45 min før</div>
                <div style={{ width: '32px', height: '18px', borderRadius: '9px', backgroundColor: farger.grønn, position: 'relative' }}>
  <div style={{ position: 'absolute', right: '2px', top: '2px', width: '14px', height: '14px', borderRadius: '50%', backgroundColor: '#fff' }} />
</div>
              </div>
            </div>

            {/* Vanlige signaler */}
            <div style={{ backgroundColor: farger.hvit, border: `1px solid ${farger.kremMørk}`, borderRadius: '20px', padding: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
                <div style={{ fontSize: '14px' }}>👀</div>
                <div style={{ fontSize: '11px', fontFamily: 'var(--font-inter)', color: farger.grønn, fontWeight: '600' }}>Vanlige signaler før uro</div>
              </div>
              {signalStatistikk.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {signalStatistikk.map((s, i) => (
                    <div key={s.signal} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: '18px', height: '18px', borderRadius: '50%', backgroundColor: farger.bakgrunn, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: '700', color: farger.tekst, flexShrink: 0 }}>{i + 1}</div>
                      <div style={{ flex: 1, fontSize: '11px', fontFamily: 'var(--font-inter)', color: farger.tekst, lineHeight: 1.2 }}>{s.signal}</div>
                      <div style={{ fontSize: '11px', fontFamily: 'var(--font-inter)', color: farger.grønn, fontWeight: '600' }}>{s.prosent}%</div>
                    </div>
                  ))}
                  <button style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '11px', fontFamily: 'var(--font-inter)', color: farger.grønn, textAlign: 'left', padding: 0, marginTop: '4px' }}>
                    Se signalhistorikk →
                  </button>
                </div>
              ) : (
                <div style={{ fontSize: '12px', fontFamily: 'var(--font-inter)', color: farger.tekstLys }}>Registrer episoder for å se mønstre</div>
              )}
            </div>
          </div>
        )}

        {/* Dette hjelper oftest */}
{tiltakStatistikk.length >= 3 && (
  <div style={{ backgroundColor: farger.hvit, border: `1px solid ${farger.kremMørk}`, borderRadius: '20px', padding: '16px 20px', marginBottom: '12px' }}>
    <div style={{ fontSize: '13px', fontFamily: 'var(--font-inter)', color: farger.tekstLys, marginBottom: '10px' }}>Dette hjelper oftest</div>
    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
      {tiltakStatistikk.slice(0, 3).map((t, i) => (
        <div key={t.tiltak} style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: farger.bakgrunn, borderRadius: '20px', padding: '8px 14px' }}>
          <span style={{ fontSize: '14px' }}>{medalje(i)}</span>
          <span style={{ fontSize: '13px', fontFamily: 'var(--font-inter)', color: farger.tekst, fontWeight: '500' }}>{t.tiltak}</span>
        </div>
      ))}
    </div>
    <div style={{ fontSize: '11px', fontFamily: 'var(--font-inter)', color: farger.tekstLys, marginTop: '8px' }}>
      Basert på egne data 🤍
    </div>
  </div>
)}

        {/* To kolonner: Tiltak + Mønstre */}
        {logg.length >= 3 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>

            {/* Tiltak */}
            <div style={{ backgroundColor: farger.hvit, border: `1px solid ${farger.kremMørk}`, borderRadius: '20px', padding: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
                <div style={{ fontSize: '14px' }}>💆</div>
                <div style={{ fontSize: '11px', fontFamily: 'var(--font-inter)', color: farger.grønn, fontWeight: '600' }}>Tiltak som hjelper</div>
              </div>
              {tiltakStatistikk.slice(0, 3).map((t, i) => (
                <div key={t.tiltak} style={{ marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px' }}>
                    <div style={{ fontSize: '12px' }}>{medalje(i)}</div>
                    <div style={{ fontSize: '11px', fontFamily: 'var(--font-inter)', color: farger.tekst, flex: 1 }}>{t.tiltak}</div>
                    <div style={{ fontSize: '10px', fontFamily: 'var(--font-inter)', color: farger.tekstLys }}>{t.fungerte}/{t.total}</div>
                  </div>
                  <div style={{ height: '4px', backgroundColor: farger.bakgrunn, borderRadius: '2px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${Math.round((t.fungerte / t.total) * 100)}%`, backgroundColor: farger.grønn, borderRadius: '2px' }} />
                  </div>
                </div>
              ))}
              <button style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '11px', fontFamily: 'var(--font-inter)', color: farger.grønn, padding: 0, marginTop: '4px' }}>
                Se alle tiltak →
              </button>
            </div>

            {/* Mønstre */}
            <div style={{ backgroundColor: farger.hvit, border: `1px solid ${farger.kremMørk}`, borderRadius: '20px', padding: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
                <div style={{ fontSize: '14px' }}>✨</div>
                <div style={{ fontSize: '11px', fontFamily: 'var(--font-inter)', color: farger.grønn, fontWeight: '600' }}>Mønstre vi ser</div>
              </div>
              {lasterAI ? (
                <div style={{ width: '18px', height: '18px', border: `2px solid ${farger.grønn}`, borderTop: '2px solid transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
              ) : aiMønstre.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {aiMønstre.map((m, i) => (
                    <div key={i} style={{ fontSize: '11px', fontFamily: 'var(--font-inter)', color: farger.tekst, lineHeight: 1.5 }}>{m}</div>
                  ))}
                  <button style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '11px', fontFamily: 'var(--font-inter)', color: farger.grønn, padding: 0, marginTop: '4px' }}>
                    Se alle innsikter →
                  </button>
                </div>
              ) : (
                <div style={{ fontSize: '11px', fontFamily: 'var(--font-inter)', color: farger.tekstLys }}>Registrer episoder for å se mønstre</div>
              )}
            </div>
          </div>
        )}

        {/* Registrer knapp */}
<button onClick={() => setVisRegistrer(true)} style={{ width: '100%', padding: '16px', backgroundColor: farger.grønn, border: 'none', borderRadius: '16px', fontSize: '15px', fontWeight: '600', color: '#FDFAF6', cursor: 'pointer', fontFamily: 'var(--font-inter)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '16px' }}>
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
    <circle cx="9" cy="9" r="8" stroke="#FDFAF6" strokeWidth="1.5" fill="none"/>
    <line x1="9" y1="5" x2="9" y2="13" stroke="#FDFAF6" strokeWidth="1.5" strokeLinecap="round"/>
    <line x1="5" y1="9" x2="13" y2="9" stroke="#FDFAF6" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
  Registrer uroperiode
</button>
        

        {/* Historikk */}
        {logg.length > 0 && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div style={{ fontSize: '16px', fontFamily: 'var(--font-plus-jakarta)', color: farger.tekst, fontWeight: '700' }}>Historikk</div>
              <div style={{ fontSize: '12px', fontFamily: 'var(--font-inter)', color: farger.grønn }}>Se alle</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {logg.slice(0, 5).map(l => {
                const { dag, mnd } = formatDato(l.dato);
                return (
                  <div key={l.id} style={{ backgroundColor: farger.hvit, border: `1px solid ${farger.kremMørk}`, borderRadius: '16px', padding: '16px', animation: 'fadeOpp 0.4s ease' }}>
                    {/* Topplinje */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px', paddingBottom: '12px', borderBottom: `1px solid ${farger.bakgrunn}` }}>
                      <div style={{ textAlign: 'center', minWidth: '36px' }}>
                        <div style={{ fontSize: '18px', fontFamily: 'var(--font-plus-jakarta)', color: farger.tekst, fontWeight: '700', lineHeight: 1 }}>{dag}</div>
                        <div style={{ fontSize: '10px', fontFamily: 'var(--font-inter)', color: farger.tekstLys }}>{mnd}</div>
                      </div>
                      <div style={{ fontSize: '15px', fontFamily: 'var(--font-plus-jakarta)', color: farger.tekst, fontWeight: '600' }}>🕒 {l.tidspunkt}</div>
                      {l.varighet && (
                        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontFamily: 'var(--font-inter)', color: farger.tekstLys }}>
                          🕐 Varighet: {l.varighet} min
                        </div>
                      )}
                    </div>

                    {/* Signaler, tiltak, resultat */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                      <div>
                        <div style={{ fontSize: '10px', fontFamily: 'var(--font-inter)', color: farger.tekstLys, fontWeight: '600', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Signaler</div>
                        {l.signaler.slice(0, 3).map((s, i) => (
                          <div key={i} style={{ fontSize: '11px', fontFamily: 'var(--font-inter)', color: farger.tekst, marginBottom: '2px' }}>• {s}</div>
                        ))}
                      </div>
                      <div>
                        <div style={{ fontSize: '10px', fontFamily: 'var(--font-inter)', color: farger.tekstLys, fontWeight: '600', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Tiltak</div>
                        {l.tiltak.slice(0, 3).map((t, i) => (
                          <div key={i} style={{ fontSize: '11px', fontFamily: 'var(--font-inter)', color: farger.tekst, marginBottom: '2px' }}>• {t}</div>
                        ))}
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '10px', fontFamily: 'var(--font-inter)', color: farger.tekstLys, fontWeight: '600', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Resultat</div>
                        <div style={{ fontSize: '24px' }}>{l.resultat === 'bra' ? '😊' : l.resultat === 'delvis' ? '😐' : l.resultat === 'ikke' ? '😔' : '—'}</div>
                        {l.resultat === 'bra' && l.varighet && (
                          <div style={{ fontSize: '10px', fontFamily: 'var(--font-inter)', color: farger.grønn, lineHeight: 1.3 }}>Roet seg etter {l.varighet} min</div>
                        )}
                        {l.resultat === 'delvis' && (
                          <div style={{ fontSize: '10px', fontFamily: 'var(--font-inter)', color: farger.tekstLys }}>Delvis effekt</div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

{logg.length === 0 && (
  <div style={{ padding: '0 16px' }}>
    {/* Sky-illustrasjon */}
    <div style={{ backgroundColor: farger.hvit, border: `1px solid ${farger.kremMørk}`, borderRadius: '24px', padding: '32px 24px', textAlign: 'center', marginBottom: '16px' }}>
    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
    <div style={{ position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%', height: '180px' }}>
  <div style={{ position: 'absolute', width: '160px', height: '160px', background: 'radial-gradient(ellipse, #E8B49A 0%, transparent 70%)', borderRadius: '50%', filter: 'blur(24px)', opacity: 0.6 }} />
  <div style={{ position: 'absolute', width: '130px', height: '130px', background: 'radial-gradient(ellipse, #EBC8B4 0%, transparent 70%)', borderRadius: '50%', filter: 'blur(16px)', opacity: 0.5 }} />
  <img src="/sky.png" alt="sky" style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: '400px', height: 'auto', objectFit: 'contain' }} />

  </div>
</div>
      <div style={{ fontSize: '20px', fontFamily: 'var(--font-plus-jakarta)', color: farger.tekst, fontWeight: '700', marginBottom: '8px' }}>
        Velkommen til Uro & Ro
      </div>
      <div style={{ fontSize: '13px', fontFamily: 'var(--font-inter)', color: farger.tekstLys, lineHeight: 1.7, marginBottom: '20px' }}>
        Vi hjelper deg å forstå uroen og hva som kan hjelpe {babyNavn}. Jo mer du registrerer, desto bedre kan vi finne mønstre og gi deg innsikt.
      </div>
      <button onClick={() => setVisRegistrer(true)} style={{ width: '100%', padding: '16px', backgroundColor: farger.grønn, border: 'none', borderRadius: '16px', fontSize: '15px', fontWeight: '600', color: '#FDFAF6', cursor: 'pointer', fontFamily: 'var(--font-inter)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <circle cx="9" cy="9" r="8" stroke="#FDFAF6" strokeWidth="1.5" fill="none"/>
          <line x1="9" y1="5" x2="9" y2="13" stroke="#FDFAF6" strokeWidth="1.5" strokeLinecap="round"/>
          <line x1="5" y1="9" x2="13" y2="9" stroke="#FDFAF6" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
        Registrer første uroperiode
      </button>
    </div>

    {/* Her vil du etter hvert få innsikt om */}
    <div style={{ marginBottom: '16px' }}>
      <div style={{ fontSize: '13px', fontFamily: 'var(--font-inter)', color: farger.tekstLys, textAlign: 'center', marginBottom: '12px' }}>
        ✨ Her vil du etter hvert få innsikt om:
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '8px' }}>
        {[
          {
            icon: (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="9" stroke="#C7BDD8" strokeWidth="1.5" fill="none"/>
                <path d="M12 7V12L15 15" stroke="#C7BDD8" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            ),
            bg: '#F0EBF8',
            label: 'Når uroen pleier å komme'
          },
          {
            icon: (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M12 21C12 21 3 15 3 9C3 6.5 5 4.5 7.5 4.5C9.2 4.5 10.7 5.4 12 7C13.3 5.4 14.8 4.5 16.5 4.5C19 4.5 21 6.5 21 9C21 15 12 21 12 21Z" stroke="#F4A8A8" strokeWidth="1.5" fill="none"/>
              </svg>
            ),
            bg: '#FFF0F0',
            label: 'Tegn før uro'
          },
          {
            icon: (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M12 2C9.2 2 7 4.2 7 7C7 9.2 8.3 11.1 10 11.8V13H14V11.8C15.7 11.1 17 9.2 17 7C17 4.2 14.8 2 12 2Z" stroke="#F4D080" strokeWidth="1.5" fill="none"/>
                <rect x="10" y="13" width="4" height="3" rx="1" stroke="#F4D080" strokeWidth="1.5" fill="none"/>
                <line x1="12" y1="16" x2="12" y2="18" stroke="#F4D080" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            ),
            bg: '#FFFBEC',
            label: 'Tiltak som kan hjelpe'
          },
          {
            icon: (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <rect x="4" y="14" width="3" height="6" rx="1" fill="#A8C4A2"/>
                <rect x="9" y="10" width="3" height="10" rx="1" fill="#A8C4A2"/>
                <rect x="14" y="6" width="3" height="14" rx="1" fill="#A8C4A2"/>
                <rect x="19" y="3" width="3" height="17" rx="1" fill="#A8C4A2"/>
              </svg>
            ),
            bg: '#E8F0E8',
            label: 'Mønstre over tid'
          },
        ].map((item, i) => (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', textAlign: 'center' }}>
            <div style={{ width: '52px', height: '52px', borderRadius: '16px', backgroundColor: item.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {item.icon}
            </div>
            <div style={{ fontSize: '10px', fontFamily: 'var(--font-inter)', color: farger.tekst, lineHeight: 1.3, fontWeight: '500' }}>{item.label}</div>
          </div>
        ))}
      </div>
    </div>

    {/* Kom i gang */}
    <div style={{ backgroundColor: farger.hvit, border: `1px solid ${farger.kremMørk}`, borderRadius: '20px', padding: '20px', marginBottom: '12px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
        <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: farger.grønnLys, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M8 14C8 14 2 10 2 6C2 4 3.5 2.5 5.5 2.5C6.6 2.5 7.5 3.1 8 4C8.5 3.1 9.4 2.5 10.5 2.5C12.5 2.5 14 4 14 6C14 10 8 14 8 14Z" fill={farger.grønn}/>
          </svg>
        </div>
        <div>
          <div style={{ fontSize: '14px', fontFamily: 'var(--font-plus-jakarta)', color: farger.tekst, fontWeight: '600' }}>Kom i gang</div>
          <div style={{ fontSize: '12px', fontFamily: 'var(--font-inter)', color: farger.tekstLys }}>Når du registrerer uroperioder, hjelper du oss å forstå {babyNavn} bedre.</div>
        </div>
      </div>
      {['Registrer når uroen starter', 'Legg til hvilke signaler du ser', 'Noter hva dere prøvde og hvordan det gikk'].map((punkt, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <circle cx="9" cy="9" r="8" fill={farger.grønnLys} stroke={farger.grønn} strokeWidth="1"/>
            <path d="M5.5 9L7.5 11L12.5 6.5" stroke={farger.grønn} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <div style={{ fontSize: '13px', fontFamily: 'var(--font-inter)', color: farger.tekst }}>{punkt}</div>
        </div>
      ))}
    </div>

    {/* Påminnelse */}
    <div style={{ backgroundColor: farger.hvit, border: `1px solid ${farger.kremMørk}`, borderRadius: '20px', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '14px' }}>
      <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#F0EBF8', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <path d="M12 2C8.7 2 6 4.7 6 8V13L4 15V16H20V15L18 13V8C18 4.7 15.3 2 12 2Z" stroke="#C7BDD8" strokeWidth="1.5" fill="none"/>
          <path d="M10 16V17C10 18.1 10.9 19 12 19C13.1 19 14 18.1 14 17V16" stroke="#C7BDD8" strokeWidth="1.5" fill="none"/>
        </svg>
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: '13px', fontFamily: 'var(--font-inter)', color: farger.tekst, lineHeight: 1.5 }}>
          Du kan varsling 45 min før uroen vanligvis starter. Dette kan du slå på senere.
        </div>
      </div>
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M6 4L10 8L6 12" stroke={farger.tekstLys} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </div>
  </div>
)}
      </div>

      {/* Modal: Registrer uro */}
      {visRegistrer && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', zIndex: 200, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }} onClick={() => setVisRegistrer(false)}>
          <div onClick={e => e.stopPropagation()} style={{ backgroundColor: farger.hvit, width: '100%', maxWidth: '430px', borderRadius: '24px 24px 0 0', padding: '24px', paddingBottom: '48px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ width: '36px', height: '4px', backgroundColor: farger.kremMørk, borderRadius: '2px', margin: '0 auto 20px' }} />
            <div style={{ fontSize: '18px', fontFamily: 'var(--font-plus-jakarta)', color: farger.tekst, fontWeight: '600', marginBottom: '20px' }}>Registrer uro-episode</div>

            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'var(--font-inter)', color: farger.tekstLys, marginBottom: '8px' }}>Tidspunkt</div>
              <input type="time" value={nyTidspunkt} onChange={e => setNyTidspunkt(e.target.value)} style={{ width: '100%', padding: '12px 16px', fontSize: '16px', border: `1px solid ${farger.kremMørk}`, borderRadius: '12px', backgroundColor: farger.bakgrunn, color: farger.tekst, outline: 'none', fontFamily: 'var(--font-inter)', boxSizing: 'border-box' }} />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'var(--font-inter)', color: farger.tekstLys, marginBottom: '8px' }}>Hva ser du nå?</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {SIGNALER_URO.map(s => (
                  <button key={s} onClick={() => setNySignaler(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s])}
                    style={{ padding: '8px 14px', borderRadius: '20px', border: `1.5px solid ${nySignaler.includes(s) ? farger.grønn : farger.kremMørk}`, backgroundColor: nySignaler.includes(s) ? farger.grønnLys : farger.bakgrunn, color: nySignaler.includes(s) ? farger.grønn : farger.tekst, fontSize: '13px', fontFamily: 'var(--font-inter)', cursor: 'pointer', fontWeight: nySignaler.includes(s) ? '600' : '400' }}>
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'var(--font-inter)', color: farger.tekstLys, marginBottom: '8px' }}>Hva prøvde dere?</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {TILTAK.map(t => (
                  <button key={t} onClick={() => setNyTiltak(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t])}
                    style={{ padding: '8px 14px', borderRadius: '20px', border: `1.5px solid ${nyTiltak.includes(t) ? farger.grønn : farger.kremMørk}`, backgroundColor: nyTiltak.includes(t) ? farger.grønnLys : farger.bakgrunn, color: nyTiltak.includes(t) ? farger.grønn : farger.tekst, fontSize: '13px', fontFamily: 'var(--font-inter)', cursor: 'pointer', fontWeight: nyTiltak.includes(t) ? '600' : '400' }}>
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'var(--font-inter)', color: farger.tekstLys, marginBottom: '8px' }}>Hvordan gikk det?</div>
              <div style={{ display: 'flex', gap: '8px' }}>
                {[{ id: 'bra', label: '😊 Hjalp godt' }, { id: 'delvis', label: '😐 Hjalp litt' }, { id: 'ikke', label: '😔 Hjalp ikke' }].map(r => (
                  <button key={r.id} onClick={() => setNyResultat(r.id as any)}
                    style={{ flex: 1, padding: '10px 8px', borderRadius: '12px', border: `1.5px solid ${nyResultat === r.id ? farger.grønn : farger.kremMørk}`, backgroundColor: nyResultat === r.id ? farger.grønnLys : farger.bakgrunn, color: nyResultat === r.id ? farger.grønn : farger.tekst, fontSize: '12px', fontFamily: 'var(--font-inter)', cursor: 'pointer', fontWeight: nyResultat === r.id ? '600' : '400' }}>
                    {r.label}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'var(--font-inter)', color: farger.tekstLys, marginBottom: '8px' }}>Varighet (minutter, valgfritt)</div>
              <input type="number" value={nyVarighet} onChange={e => setNyVarighet(e.target.value)} placeholder="F.eks. 25" style={{ width: '100%', padding: '12px 16px', fontSize: '14px', border: `1px solid ${farger.kremMørk}`, borderRadius: '12px', backgroundColor: farger.bakgrunn, color: farger.tekst, outline: 'none', fontFamily: 'var(--font-inter)', boxSizing: 'border-box' }} />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'var(--font-inter)', color: farger.tekstLys, marginBottom: '8px' }}>Notat (valgfritt)</div>
              <textarea value={nyNotat} onChange={e => setNyNotat(e.target.value)} placeholder="Noe du la merke til..." style={{ width: '100%', padding: '12px 16px', fontSize: '14px', border: `1px solid ${farger.kremMørk}`, borderRadius: '12px', backgroundColor: farger.bakgrunn, color: farger.tekst, outline: 'none', fontFamily: 'var(--font-inter)', resize: 'none', minHeight: '70px', boxSizing: 'border-box' }} />
            </div>

            <button onClick={lagreUro} disabled={lagrer} style={{ width: '100%', padding: '16px', backgroundColor: farger.grønnLys, border: `1px solid ${farger.grønn}`, borderRadius: '16px', fontSize: '15px', fontWeight: '600', color: farger.grønn, cursor: 'pointer', fontFamily: 'var(--font-inter)' }}>
              {lagrer ? 'Lagrer...' : 'Lagre episode'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}