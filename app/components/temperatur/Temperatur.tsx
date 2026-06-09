'use client';
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { farger } from '../../lib/farger';

type Props = { bruker: any; aktivtBarn?: any; onNavigate?: (side: string) => void; };

type TemperaturRegistrering = {
  id: number;
  dato: string;
  klokkeslett: string;
  temperatur: number;
  type: string;
  notat?: string;
};

const SYMPTOMER = ['Feber', 'Tett nese', 'Hoste', 'Oppkast', 'Diaré', 'Slapp', 'Utslett'];

const getFeberstatus = (temp: number) => {
  if (temp >= 40) return { label: 'Høy feber', farge: '#BE123C', bg: '#FFF1F2', border: '#FECDD3' };
  if (temp >= 38.5) return { label: 'Feber', farge: '#BE123C', bg: '#FFF1F2', border: '#FECDD3' };
  if (temp >= 37.5) return { label: 'Lett forhøyet', farge: '#C2410C', bg: '#FFF7ED', border: '#FED7AA' };
  if (temp >= 36) return { label: 'Normal', farge: farger.grønn, bg: farger.grønnLys, border: '#A8C8A8' };
  return { label: 'Lavt', farge: '#4338CA', bg: '#EEF2FF', border: '#C7D2FE' };
};

export default function Temperatur({ bruker, aktivtBarn, onNavigate }: Props) {
  const [målinger, setMålinger] = useState<TemperaturRegistrering[]>([]);
  const [babyNavn, setBabyNavn] = useState('babyen');
  const [laster, setLaster] = useState(true);
  const [visSkjema, setVisSkjema] = useState(false);
  const [aktivSymptomer, setAktivSymptomer] = useState<string[]>([]);
  const [egentSymptom, setEgentSymptom] = useState('');

  // Skjema-state
  const [temperaturInput, setTemperaturInput] = useState('');
  const [dato, setDato] = useState(new Date().toISOString().split('T')[0]);
  const [klokkeslett, setKlokkeslett] = useState(new Date().toTimeString().slice(0, 5));
  const [notat, setNotat] = useState('');
  const [lagrer, setLagrer] = useState(false);

  const lastData = useCallback(async () => {
    setLaster(true);
    if (aktivtBarn?.navn) setBabyNavn(aktivtBarn.navn);
    else {
      const { data: barn } = await supabase.from('barn').select('*').eq('bruker_id', bruker?.id).single();
      if (barn?.navn) setBabyNavn(barn.navn);
    }
    const { data } = await supabase.from('temperatur').select('*').eq('profil_id', bruker?.id).order('dato', { ascending: false }).order('klokkeslett', { ascending: false });
    setMålinger(data || []);
    setLaster(false);
  }, [bruker?.id, aktivtBarn]);

  useEffect(() => { lastData(); }, [lastData]);

  const lagreTemperatur = async () => {
    if (!temperaturInput) return;
    setLagrer(true);
    const temp = parseFloat(temperaturInput.replace(',', '.'));
    if (isNaN(temp)) { setLagrer(false); return; }
    const symptomTekst = aktivSymptomer.length > 0 ? aktivSymptomer.join(', ') : null;
    await supabase.from('temperatur').insert({
      profil_id: bruker?.id,
      dato, klokkeslett,
      temperatur: temp,
      type: 'temperatur',
      notat: symptomTekst || notat.trim() || null,
    });
    setTemperaturInput(''); setNotat(''); setAktivSymptomer([]);
    setVisSkjema(false);
    await lastData();
    setLagrer(false);
  };

  const toggleSymptom = (s: string) => {
    setAktivSymptomer(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);
  };

  const sisteMåling = målinger[0];
  const dagensdato = new Date().toISOString().split('T')[0];
  const dagensMålinger = målinger.filter(m => m.dato === dagensdato);

  // Enkel linjegraf med SVG
  const GrafKomponent = () => {
    const siste10 = [...målinger].reverse().slice(-10);
    if (siste10.length < 2) return (
      <div style={{ height: '100px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontSize: '12px', fontFamily: 'var(--font-inter)', color: farger.tekstLys }}>Trenger minst 2 målinger</div>
      </div>
    );
    const min = 36;
    const max = 41;
    const w = 280;
    const h = 100;
    const points = siste10.map((m, i) => {
      const x = (i / (siste10.length - 1)) * w;
      const y = h - ((m.temperatur - min) / (max - min)) * h;
      return `${x},${y}`;
    }).join(' ');
    return (
      <svg width="100%" viewBox={`0 0 ${w} ${h}`} style={{ overflow: 'visible' }}>
        {[36, 37, 38, 39, 40].map(t => {
          const y = h - ((t - min) / (max - min)) * h;
          return (
            <g key={t}>
              <line x1="0" y1={y} x2={w} y2={y} stroke={farger.kremMørk} strokeWidth="0.5" strokeDasharray="4,4"/>
              <text x="-4" y={y + 4} fontSize="9" fill={farger.tekstLys} textAnchor="end">{t}°</text>
            </g>
          );
        })}
        <polyline points={points} fill="none" stroke={farger.grønn} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        {siste10.map((m, i) => {
          const x = (i / (siste10.length - 1)) * w;
          const y = h - ((m.temperatur - min) / (max - min)) * h;
          const status = getFeberstatus(m.temperatur);
          return <circle key={i} cx={x} cy={y} r="4" fill={status.farge} stroke={farger.hvit} strokeWidth="1.5"/>;
        })}
      </svg>
    );
  };

  if (laster) return (
    <div style={{ backgroundColor: farger.bakgrunn, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <div style={{ width: '28px', height: '28px', border: `2px solid ${farger.grønn}`, borderTop: '2px solid transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
    </div>
  );

  return (
    <div style={{ backgroundColor: farger.bakgrunn, minHeight: '100vh', padding: '24px 24px 120px' }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } } @keyframes fadeOpp { 0%{opacity:0;transform:translateY(8px)} 100%{opacity:1;transform:translateY(0)} }`}</style>

      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <div style={{ fontSize: '26px', fontFamily: 'var(--font-plus-jakarta)', color: farger.tekst, fontWeight: '700', marginBottom: '4px' }}>
          🌡️ Temperatur
        </div>
        <div style={{ fontSize: '13px', fontFamily: 'var(--font-inter)', color: farger.tekstLys, lineHeight: 1.5 }}>
          Følg temperatur, sykdomsforløp<br/>og medisiner på ett sted.
        </div>
      </div>

      {målinger.length === 0 ? (
        // ─── INGEN MÅLINGER ───
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ backgroundColor: farger.hvit, border: `1px solid ${farger.kremMørk}`, borderRadius: '24px', padding: '24px', textAlign: 'center' }}>
            <div style={{ fontSize: '56px', marginBottom: '16px' }}>🌡️</div>
            <div style={{ fontSize: '18px', fontFamily: 'var(--font-plus-jakarta)', color: farger.tekst, fontWeight: '700', marginBottom: '8px' }}>
              Ingen målinger ennå
            </div>
            <div style={{ fontSize: '13px', fontFamily: 'var(--font-inter)', color: farger.tekstLys, lineHeight: 1.7, marginBottom: '20px' }}>
              Registrer {babyNavn}s temperatur for å følge utviklingen og få varsler om feber.
            </div>
            <button
              onClick={() => setVisSkjema(true)}
              style={{ padding: '14px 28px', background: `linear-gradient(135deg, ${farger.grønn}, #1E4030)`, border: 'none', borderRadius: '50px', fontSize: '15px', fontWeight: '700', color: '#fff', cursor: 'pointer', fontFamily: 'var(--font-inter)', display: 'inline-flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 16px rgba(45,92,69,0.4)' }}
            >
              <span style={{ fontSize: '18px' }}>+</span> Registrer første måling
            </button>
          </div>
          <div style={{ backgroundColor: farger.hvit, border: `1px solid ${farger.kremMørk}`, borderRadius: '20px', padding: '20px' }}>
            <div style={{ fontSize: '14px', fontFamily: 'var(--font-plus-jakarta)', color: farger.tekst, fontWeight: '700', marginBottom: '14px' }}>💡 Visste du?</div>
            {[
              { temp: '< 37.5°C', label: 'Normal temperatur', farge: farger.grønn, bg: farger.grønnLys },
              { temp: '37.5–38.4°C', label: 'Lett forhøyet', farge: '#C2410C', bg: '#FFF7ED' },
              { temp: '38.5–39.9°C', label: 'Feber', farge: '#BE123C', bg: '#FFF1F2' },
              { temp: '≥ 40°C', label: 'Høy feber', farge: '#BE123C', bg: '#FFF1F2' },
            ].map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
                <div style={{ padding: '4px 10px', backgroundColor: item.bg, borderRadius: '20px', fontSize: '12px', fontFamily: 'var(--font-inter)', color: item.farge, fontWeight: '600', minWidth: '90px', textAlign: 'center' }}>{item.temp}</div>
                <div style={{ fontSize: '13px', fontFamily: 'var(--font-inter)', color: farger.tekst }}>{item.label}</div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        // ─── MED DATA ───
        <>
          {/* Siste måling */}
          {sisteMåling && (() => {
            const status = getFeberstatus(sisteMåling.temperatur);
            return (
              <div style={{ backgroundColor: farger.hvit, border: `1px solid ${farger.kremMørk}`, borderRadius: '20px', padding: '20px', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontSize: '13px', fontFamily: 'var(--font-inter)', color: farger.tekstLys, marginBottom: '6px' }}>Siste måling</div>
                    <div style={{ fontSize: '42px', fontFamily: 'var(--font-plus-jakarta)', color: status.farge, fontWeight: '700', lineHeight: 1, marginBottom: '6px' }}>
                      {sisteMåling.temperatur}°C
                    </div>
                    <div style={{ fontSize: '12px', fontFamily: 'var(--font-inter)', color: farger.tekstLys, marginBottom: '10px' }}>
                      Registrert {sisteMåling.klokkeslett.slice(0, 5)}
                    </div>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '5px 12px', backgroundColor: status.bg, border: `1px solid ${status.border}`, borderRadius: '20px' }}>
                      <span style={{ fontSize: '14px' }}>{status.farge === farger.grønn ? '😊' : '🤒'}</span>
                      <span style={{ fontSize: '12px', fontFamily: 'var(--font-inter)', color: status.farge, fontWeight: '600' }}>{status.label}</span>
                    </div>
                  </div>
                  <div style={{ fontSize: '64px', opacity: 0.8 }}>🤒</div>
                </div>
              </div>
            );
          })()}

          {/* Innsikt */}
          <div style={{ backgroundColor: farger.grønnLys, border: `1px solid ${farger.grønn}`, borderRadius: '20px', padding: '16px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ fontSize: '22px', flexShrink: 0 }}>✦</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '13px', fontFamily: 'var(--font-inter)', color: farger.grønn, lineHeight: 1.5 }}>
                {dagensMålinger.length > 1
                  ? `${babyNavn} har hatt ${dagensMålinger.length} målinger i dag. Siste: ${dagensMålinger[0]?.temperatur}°C.`
                  : dagensMålinger.length === 1
                  ? `Første måling i dag registrert kl. ${dagensMålinger[0]?.klokkeslett.slice(0, 5)}.`
                  : `Ingen målinger i dag ennå.`}
              </div>
            </div>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M6 4L10 8L6 12" stroke={farger.grønn} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>

          {/* Graf og siste medisin */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>
            {/* Graf */}
            <div style={{ backgroundColor: farger.hvit, border: `1px solid ${farger.kremMørk}`, borderRadius: '16px', padding: '14px' }}>
              <div style={{ fontSize: '12px', fontFamily: 'var(--font-inter)', color: farger.tekst, fontWeight: '600', marginBottom: '10px' }}>Temperaturutvikling</div>
              <GrafKomponent />
            </div>
           {/* Siste medisin */}
<button
  onClick={() => onNavigate?.('medisin')}
  style={{ backgroundColor: farger.hvit, border: `1px solid ${farger.kremMørk}`, borderRadius: '16px', padding: '14px', textAlign: 'left', cursor: 'pointer', width: '100%' }}
>
  <div style={{ fontSize: '12px', fontFamily: 'var(--font-inter)', color: farger.tekst, fontWeight: '600', marginBottom: '6px' }}>Siste medisin</div>
  <div style={{ fontSize: '12px', fontFamily: 'var(--font-inter)', color: farger.tekstLys, lineHeight: 1.5, marginBottom: '8px' }}>
    Se medisin-siden for oversikt over medisiner og doser.
  </div>
  <div style={{ fontSize: '11px', fontFamily: 'var(--font-inter)', color: farger.grønn, fontWeight: '600' }}>
    Gå til medisin →
  </div>
</button>
</div>

          {/* Symptomer */}
          <div style={{ backgroundColor: farger.hvit, border: `1px solid ${farger.kremMørk}`, borderRadius: '20px', padding: '20px', marginBottom: '16px' }}>
            <div style={{ fontSize: '15px', fontFamily: 'var(--font-plus-jakarta)', color: farger.tekst, fontWeight: '700', marginBottom: '14px' }}>Symptomer</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {SYMPTOMER.map(s => {
                const aktiv = aktivSymptomer.includes(s);
                return (
                  <button key={s} onClick={() => toggleSymptom(s)} style={{ padding: '7px 14px', backgroundColor: aktiv ? farger.grønnLys : farger.bakgrunn, border: `1.5px solid ${aktiv ? farger.grønn : farger.kremMørk}`, borderRadius: '20px', fontSize: '13px', fontFamily: 'var(--font-inter)', color: aktiv ? farger.grønn : farger.tekst, fontWeight: aktiv ? '600' : '400', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    {aktiv && <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 6L5 9L10 3" stroke={farger.grønn} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                    {s}
                  </button>
                );
              })}
              <button style={{ padding: '7px 14px', backgroundColor: farger.bakgrunn, border: `1.5px solid ${farger.kremMørk}`, borderRadius: '20px', fontSize: '13px', fontFamily: 'var(--font-inter)', color: farger.tekstLys, cursor: 'pointer' }}>
                + Legg til
              </button>
            </div>
          </div>

          {/* Sykdomsdagbok */}
          <div style={{ backgroundColor: farger.hvit, border: `1px solid ${farger.kremMørk}`, borderRadius: '20px', padding: '20px', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{ fontSize: '15px', fontFamily: 'var(--font-plus-jakarta)', color: farger.tekst, fontWeight: '700' }}>Sykdomsdagbok</div>
              <div style={{ fontSize: '12px', fontFamily: 'var(--font-inter)', color: farger.tekstLys }}>I dag</div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.6)', border: '1px solid rgba(220,207,192,0.35)', borderRadius: '16px', overflow: 'hidden', padding: '8px 0' }}>
              {målinger.slice(0, 6).map((m, i) => {
                const status = getFeberstatus(m.temperatur);
                return (
                  <div key={i} style={{ position: 'relative' }}>
                    {i < Math.min(målinger.length, 6) - 1 && (
                      <div style={{ position: 'absolute', left: '28px', top: '44px', width: '1px', height: 'calc(100% - 10px)', backgroundColor: 'rgba(220,207,192,0.5)' }} />
                    )}
                    <div style={{ padding: '10px 16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ fontSize: '11px', fontFamily: 'var(--font-inter)', color: farger.tekstLys, width: '36px', flexShrink: 0 }}>{m.klokkeslett.slice(0, 5)}</div>
                      <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: status.bg, border: `1px solid ${status.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', flexShrink: 0, zIndex: 1 }}>
                        🌡️
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '13px', fontFamily: 'var(--font-inter)', color: status.farge, fontWeight: '600' }}>{m.temperatur}°C</div>
                        {m.notat && <div style={{ fontSize: '11px', fontFamily: 'var(--font-inter)', color: farger.tekstLys }}>{m.notat}</div>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Registrer-knapp */}
          <button
            onClick={() => setVisSkjema(true)}
            style={{ position: 'fixed', bottom: '100px', left: '50%', transform: 'translateX(-50%)', padding: '16px 32px', background: `linear-gradient(135deg, ${farger.grønn}, #1E4030)`, border: 'none', borderRadius: '50px', fontSize: '15px', fontWeight: '700', color: '#fff', cursor: 'pointer', fontFamily: 'var(--font-inter)', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 20px rgba(45,92,69,0.5)', zIndex: 50 }}
          >
            <span style={{ fontSize: '18px' }}>+</span> Registrer temperatur
          </button>
        </>
      )}

      {/* ─── REGISTRERINGSSKJEMA ─── */}
      {visSkjema && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 200, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }} onClick={() => setVisSkjema(false)}>
          <div onClick={e => e.stopPropagation()} style={{ backgroundColor: farger.hvit, width: '100%', maxWidth: '430px', borderRadius: '24px 24px 0 0', padding: '24px', paddingBottom: '48px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ width: '36px', height: '4px', backgroundColor: farger.kremMørk, borderRadius: '2px', margin: '0 auto 20px' }} />
            <div style={{ fontSize: '20px', fontFamily: 'var(--font-plus-jakarta)', color: farger.tekst, fontWeight: '700', marginBottom: '20px' }}>Registrer temperatur 🌡️</div>

            {/* Temperatur input */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '13px', fontFamily: 'var(--font-inter)', color: farger.tekst, fontWeight: '600', marginBottom: '8px' }}>Temperatur (°C)</div>
              <input
                type="number"
                step="0.1"
                value={temperaturInput}
                onChange={e => setTemperaturInput(e.target.value)}
                placeholder="f.eks. 38.5"
                style={{ width: '100%', padding: '16px', fontSize: '24px', fontFamily: 'var(--font-plus-jakarta)', border: `1px solid ${farger.kremMørk}`, borderRadius: '12px', backgroundColor: farger.bakgrunn, color: farger.tekst, outline: 'none', boxSizing: 'border-box', textAlign: 'center', fontWeight: '700' }}
              />
              {temperaturInput && !isNaN(parseFloat(temperaturInput.replace(',', '.'))) && (() => {
                const status = getFeberstatus(parseFloat(temperaturInput.replace(',', '.')));
                return (
                  <div style={{ marginTop: '8px', padding: '8px 14px', backgroundColor: status.bg, border: `1px solid ${status.border}`, borderRadius: '10px', textAlign: 'center' }}>
                    <div style={{ fontSize: '13px', fontFamily: 'var(--font-inter)', color: status.farge, fontWeight: '600' }}>{status.label}</div>
                  </div>
                );
              })()}
            </div>

            {/* Symptomer */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '13px', fontFamily: 'var(--font-inter)', color: farger.tekst, fontWeight: '600', marginBottom: '8px' }}>Symptomer (valgfritt)</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {SYMPTOMER.map(s => {
                  const aktiv = aktivSymptomer.includes(s);
                  return (
                    <button key={s} onClick={() => toggleSymptom(s)} style={{ padding: '7px 14px', backgroundColor: aktiv ? farger.grønnLys : farger.bakgrunn, border: `1.5px solid ${aktiv ? farger.grønn : farger.kremMørk}`, borderRadius: '20px', fontSize: '13px', fontFamily: 'var(--font-inter)', color: aktiv ? farger.grønn : farger.tekst, fontWeight: aktiv ? '600' : '400', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      {aktiv && <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 6L5 9L10 3" stroke={farger.grønn} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                      {s}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Dato og tid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>
              <div>
                <div style={{ fontSize: '13px', fontFamily: 'var(--font-inter)', color: farger.tekst, fontWeight: '600', marginBottom: '8px' }}>Dato</div>
                <input type="date" value={dato} onChange={e => setDato(e.target.value)} style={{ width: '100%', padding: '10px 12px', fontSize: '13px', border: `1px solid ${farger.kremMørk}`, borderRadius: '12px', backgroundColor: farger.bakgrunn, color: farger.tekst, outline: 'none', fontFamily: 'var(--font-inter)', boxSizing: 'border-box' }} />
              </div>
              <div>
                <div style={{ fontSize: '13px', fontFamily: 'var(--font-inter)', color: farger.tekst, fontWeight: '600', marginBottom: '8px' }}>Tidspunkt</div>
                <input type="time" value={klokkeslett} onChange={e => setKlokkeslett(e.target.value)} style={{ width: '100%', padding: '10px 12px', fontSize: '13px', border: `1px solid ${farger.kremMørk}`, borderRadius: '12px', backgroundColor: farger.bakgrunn, color: farger.tekst, outline: 'none', fontFamily: 'var(--font-inter)', boxSizing: 'border-box' }} />
              </div>
            </div>

            {/* Notat */}
            <div style={{ marginBottom: '24px' }}>
              <div style={{ fontSize: '13px', fontFamily: 'var(--font-inter)', color: farger.tekst, fontWeight: '600', marginBottom: '8px' }}>Notat (valgfritt)</div>
              <textarea value={notat} onChange={e => setNotat(e.target.value)} placeholder="Hvordan ser babyen ut? Andre observasjoner?" rows={2} style={{ width: '100%', padding: '12px 14px', fontSize: '13px', border: `1px solid ${farger.kremMørk}`, borderRadius: '12px', backgroundColor: farger.bakgrunn, color: farger.tekst, outline: 'none', fontFamily: 'var(--font-inter)', resize: 'none', boxSizing: 'border-box' }} />
            </div>

            <button
              onClick={lagreTemperatur}
              disabled={!temperaturInput || lagrer}
              style={{ width: '100%', padding: '16px', backgroundColor: !temperaturInput ? farger.kremMørk : farger.grønn, border: 'none', borderRadius: '14px', fontSize: '15px', fontWeight: '600', color: !temperaturInput ? farger.tekstLys : '#FDFAF6', cursor: !temperaturInput ? 'not-allowed' : 'pointer', fontFamily: 'var(--font-inter)' }}
            >
              {lagrer ? 'Lagrer...' : 'Lagre temperatur'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}