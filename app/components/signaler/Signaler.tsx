'use client';
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { farger } from '../../lib/farger';

type Props = { bruker: any; onNavigate?: (side: string) => void; };

type RegistertSignal = {
  navn: string;
  antall: number;
  prosentFørLur: number;
  gjsnittMinFørSøvn: number;
};

type OppslagsSignal = {
  navn: string;
  ikon: string;
  tidlig: boolean;
  sent: boolean;
  beskrivelse: string;
  kanBety: string[];
  tips?: string;
};

type Kategori = {
  id: string;
  tittel: string;
  undertittel: string;
  ikon: string;
  farge: string;
  border: string;
  tekstFarge: string;
  signaler: OppslagsSignal[];
};

const KATEGORIER: Kategori[] = [
  {
    id: 'sovn',
    tittel: 'Søvnsignaler',
    undertittel: 'Signalene som ofte vises når babyen begynner å bli trøtt.',
    ikon: '/signal-oye.png',
    farge: '#FFF8EC',
    border: '#F4D9A0',
    tekstFarge: '#8B6340',
    signaler: [
      { navn: 'Stirrer tomt', ikon: '/signal-oye.png', tidlig: true, sent: false, beskrivelse: 'Babyen ser tomt ut i blikket og virker fjern i blikket.', kanBety: ['Tidlig trøtthetssignal', 'Babyen begynner å koble av', 'Tid for å starte nedtrapping'], tips: 'Begynn å roe ned miljøet når du ser dette.' },
      { navn: 'Gnir øynene', ikon: '/signal-gnir.png', tidlig: false, sent: true, beskrivelse: 'Babyen gnir eller klør seg i øynene.', kanBety: ['Sent søvnsignal', 'Babyen er overtrøtt om dette vedvarer', 'Søvn nærmer seg'], tips: 'Er dette første signal du ser, kan babyen allerede være overtrøtt.' },
      { navn: 'Gjesper', ikon: '/signal-gjespende.png', tidlig: true, sent: true, beskrivelse: 'Gjesping er et vanlig tegn på tretthet.', kanBety: ['Tidlig eller sent signal avhengig av kontekst', 'Kombinert med andre signaler = søvn nærmer seg'], tips: 'Ett gjesp er ikke nok – se etter kombinasjoner.' },
      { navn: 'Mister interesse', ikon: '/signal-hodet.png', tidlig: true, sent: false, beskrivelse: 'Babyen mister interessen for det som skjer rundt.', kanBety: ['Tidlig søvnsignal', 'Behov for roligere omgivelser'], tips: 'Reduser stimuli og gå til et roligere rom.' },
      { navn: 'Vender hodet bort', ikon: '/signal-hodet.png', tidlig: true, sent: false, beskrivelse: 'Babyen vender hodet bort fra deg eller fra stimuli.', kanBety: ['Overstimulering', 'Behov for pause', 'Tidlig trøtthetssignal'], tips: 'Respekter signalet – ikke prøv å få kontakt igjen med én gang.' },
      { navn: 'Tunge øyelokk', ikon: '/signal-oye.png', tidlig: false, sent: true, beskrivelse: 'Øyelokkene blir tunge og halvveis lukkede.', kanBety: ['Sent søvnsignal', 'Søvn er nært forestående'], tips: 'Legg ned nå – babyen er klar.' },
      { navn: 'Små grimaser', ikon: '/signal-urolig.png', tidlig: false, sent: true, beskrivelse: 'Babyen lager små ansiktsuttrykk og virker urolig.', kanBety: ['Sent søvnsignal', 'Kan også være ubehag'], tips: 'Kombiner med andre signaler for å tolke riktig.' },
    ],
  },
  {
    id: 'pause',
    tittel: 'Trenger en pause',
    undertittel: 'Tegn på overstimulering eller behov for ro.',
    ikon: '/blad.png',
    farge: '#F0F7F0',
    border: '#C8DEC8',
    tekstFarge: '#2D5C45',
    signaler: [
      { navn: 'Vender hodet bort', ikon: '/signal-hodet.png', tidlig: true, sent: false, beskrivelse: 'Babyen vender hodet bort fra deg eller fra stimuli.', kanBety: ['Overstimulering', 'Behov for pause'], tips: 'Vent til babyen vender seg tilbake av seg selv.' },
      { navn: 'Urolig kropp', ikon: '/signal-urolig.png', tidlig: false, sent: false, beskrivelse: 'Babyen virker rastløs og urolig i kroppen.', kanBety: ['Overstimulering', 'Ubehag', 'Behov for ro og nærhet'], tips: 'Prøv å dempe lys og lyd i rommet.' },
      { navn: 'Knytter hendene', ikon: '/signal-gnir.png', tidlig: false, sent: false, beskrivelse: 'Babyen knytter hendene hardt.', kanBety: ['Stress eller ubehag', 'Kan komme før gråt'], tips: 'Ta babyen opp og gi ro før situasjonen eskalerer.' },
      { navn: 'Arkebuer ryggen', ikon: '/signal-urolig.png', tidlig: false, sent: false, beskrivelse: 'Babyen buer ryggen bakover.', kanBety: ['Ubehag', 'Protest', 'Kan være kolikk'], tips: 'Sjekk om det er luft i magen.' },
    ],
  },
  {
    id: 'mage',
    tittel: 'Mage og ubehag',
    undertittel: 'Signaler som kan være knyttet til luft, mage eller uro.',
    ikon: '/signal-bena.png',
    farge: '#FFF1F2',
    border: '#FECDD3',
    tekstFarge: '#BE123C',
    signaler: [
      { navn: 'Trekker bena opp', ikon: '/signal-bena.png', tidlig: false, sent: false, beskrivelse: 'Babyen trekker bena opp mot magen.', kanBety: ['Luft i magen', 'Mageubehag', 'Kolikk'], tips: 'Prøv sykkelbevegelser med bena eller magemassasje.' },
      { navn: 'Krummer ryggen', ikon: '/signal-urolig.png', tidlig: false, sent: false, beskrivelse: 'Babyen krummer ryggen og virker anspent.', kanBety: ['Magesmerter', 'Luft i magen'], tips: 'Hold babyen oppreist etter mating.' },
      { navn: 'Luft i magen', ikon: '/signal-bena.png', tidlig: false, sent: false, beskrivelse: 'Babyen har synlig oppblåst mage eller rapper mye.', kanBety: ['Trenger å rape', 'Kolikk', 'Mageubehag'], tips: 'Klapp forsiktig på ryggen og hold oppreist.' },
      { navn: 'Anspent ansikt', ikon: '/signal-urolig.png', tidlig: false, sent: false, beskrivelse: 'Babyen grimaser og ser anspent ut.', kanBety: ['Smerte eller ubehag', 'Magetrøbbel'], tips: 'Kombiner med andre signaler for å tolke.' },
    ],
  },
  {
    id: 'sult',
    tittel: 'Sultsignaler',
    undertittel: 'Tegn på at babyen ønsker mat.',
    ikon: '/tateflaske-mork.png',
    farge: '#EEF2FF',
    border: '#C7D2FE',
    tekstFarge: '#4338CA',
    signaler: [
      { navn: 'Suger på hendene', ikon: '/signal-gnir.png', tidlig: true, sent: false, beskrivelse: 'Babyen suger på egne hender eller fingre.', kanBety: ['Tidlig sultsignal', 'Vil ha mat snart'], tips: 'Mat nå – ikke vent til babyen gråter.' },
      { navn: 'Smatter', ikon: '/signal-gjespende.png', tidlig: true, sent: false, beskrivelse: 'Babyen smatter med munnen.', kanBety: ['Sultent', 'Søker suging'], tips: 'Tidlig signal – ideelt tidspunkt å mate.' },
      { navn: 'Søker bryst', ikon: '/signal-gjespende.png', tidlig: true, sent: false, beskrivelse: 'Babyen vrir hodet og søker etter bryst eller flaske.', kanBety: ['Sultent', 'Rooting-refleks aktiv'], tips: 'Typisk tidlig sultsignal hos nyfødte.' },
      { navn: 'Rastløs og kryper', ikon: '/signal-urolig.png', tidlig: false, sent: true, beskrivelse: 'Babyen beveger seg mye og virker rastløs.', kanBety: ['Sent sultsignal', 'Snart gråt om ikke matet'], tips: 'Mat snart – gråt er siste sultsignal.' },
    ],
  },
];

const VISSTE_DU = 'Et signal alene betyr sjelden noe. Det er ofte kombinasjonen av flere signaler som forteller hva babyen trenger.';

export default function Signaler({ bruker, onNavigate }: Props) {
  const [registrerteSignaler, setRegistrerteSignaler] = useState<RegistertSignal[]>([]);
  const [babyNavn, setBabyNavn] = useState('babyen');
  const [laster, setLaster] = useState(true);
  const [aktivKategori, setAktivKategori] = useState<Kategori | null>(null);
  const [valgtOppslagsSignal, setValgtOppslagsSignal] = useState<OppslagsSignal | null>(null);

  const lastData = useCallback(async () => {
    setLaster(true);
    const { data: barn } = await supabase.from('barn').select('*').eq('bruker_id', bruker?.id).single();
    if (barn?.navn) setBabyNavn(barn.navn);

    const { data: lurer } = await supabase.from('lurer').select('*').eq('profil_id', bruker?.id).eq('type', 'lur').not('signaler', 'is', null);

    if (!lurer || lurer.length === 0) { setLaster(false); return; }

    const signalTelling: Record<string, { antall: number; minutterFørSøvn: number[] }> = {};
    lurer.forEach((l: any) => {
      if (!l.signaler) return;
      const liste = typeof l.signaler === 'string' ? l.signaler.split(',').map((s: string) => s.trim()).filter(Boolean) : l.signaler;
      liste.forEach((signal: string) => {
        if (!signalTelling[signal]) signalTelling[signal] = { antall: 0, minutterFørSøvn: [] };
        signalTelling[signal].antall += 1;
        if (l.varighet) signalTelling[signal].minutterFørSøvn.push(Math.floor(l.varighet / 2));
      });
    });

    const totalLurer = lurer.length;
    const liste: RegistertSignal[] = Object.entries(signalTelling).map(([navn, d]) => ({
      navn,
      antall: d.antall,
      prosentFørLur: Math.round((d.antall / totalLurer) * 100),
      gjsnittMinFørSøvn: d.minutterFørSøvn.length > 0 ? Math.round(d.minutterFørSøvn.reduce((a, b) => a + b, 0) / d.minutterFørSøvn.length) : 0,
    })).sort((a, b) => b.antall - a.antall);

    setRegistrerteSignaler(liste);
    setLaster(false);
  }, [bruker?.id]);

  useEffect(() => { lastData(); }, [lastData]);

  // Finn topp-3 registrerte signaler for "Wilhelm viser oftest"
  const topp3 = registrerteSignaler.slice(0, 3);

  const getSignalIkon = (navn: string): string => {
    const lower = navn.toLowerCase();
    if (lower.includes('stirr') || lower.includes('blikk') || lower.includes('tomt')) return '/signal-oye.png';
    if (lower.includes('gjesp')) return '/signal-gjespende.png';
    if (lower.includes('hodet') || lower.includes('vend') || lower.includes('interesse')) return '/signal-hodet.png';
    if (lower.includes('gnir') || lower.includes('øyne') || lower.includes('hend') || lower.includes('smatt') || lower.includes('sug') || lower.includes('søker')) return '/signal-gnir.png';
    if (lower.includes('urolig') || lower.includes('kropp') || lower.includes('buer') || lower.includes('krumm') || lower.includes('anspent') || lower.includes('rastl') || lower.includes('grimaser')) return '/signal-urolig.png';
    if (lower.includes('ben') || lower.includes('trekk') || lower.includes('luft')) return '/signal-bena.png';
    if (lower.includes('tunge') || lower.includes('øyelokk')) return '/signal-oye.png';
    return '/signal-oye.png';
  };

  // Detaljvisning for oppslagsverksignal
  if (valgtOppslagsSignal) {
    const kat = KATEGORIER.find(k => k.signaler.some(s => s.navn === valgtOppslagsSignal.navn));
    return (
      <div style={{ backgroundColor: farger.bakgrunn, minHeight: '100vh', padding: '0 0 100px' }}>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

        {/* Header */}
        <div style={{ padding: '24px 24px 16px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button onClick={() => setValgtOppslagsSignal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M15 18L9 12L15 6" stroke={farger.tekst} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <div style={{ fontSize: '18px', fontFamily: 'var(--font-plus-jakarta)', color: farger.tekst, fontWeight: '700' }}>
            {kat?.tittel}
          </div>
        </div>

        <div style={{ padding: '0 24px' }}>
          {/* Signal-kort */}
          <div style={{ backgroundColor: farger.hvit, border: `1px solid ${farger.kremMørk}`, borderRadius: '20px', padding: '24px', marginBottom: '16px', display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
            <div style={{ width: '72px', height: '72px', borderRadius: '50%', backgroundColor: kat?.farge || farger.bakgrunn, border: `1.5px solid ${kat?.border || farger.kremMørk}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <img src={valgtOppslagsSignal.ikon} style={{ width: '40px', height: '40px', objectFit: 'contain' }} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '20px', fontFamily: 'var(--font-plus-jakarta)', color: farger.tekst, fontWeight: '700', marginBottom: '8px' }}>{valgtOppslagsSignal.navn}</div>
              {/* Tidlig/sent badge */}
              <div style={{ display: 'flex', gap: '6px', marginBottom: '10px' }}>
                {valgtOppslagsSignal.tidlig && (
                  <div style={{ padding: '3px 10px', backgroundColor: '#FFF8EC', border: '1px solid #F4D9A0', borderRadius: '20px', fontSize: '11px', fontFamily: 'var(--font-inter)', color: '#8B6340', fontWeight: '600' }}>Tidlig signal</div>
                )}
                {valgtOppslagsSignal.sent && (
                  <div style={{ padding: '3px 10px', backgroundColor: '#FDF4FF', border: '1px solid #E9D5FF', borderRadius: '20px', fontSize: '11px', fontFamily: 'var(--font-inter)', color: '#7C3AED', fontWeight: '600' }}>Sent signal</div>
                )}
              </div>
              <div style={{ fontSize: '14px', fontFamily: 'var(--font-inter)', color: farger.tekstLys, lineHeight: 1.6 }}>{valgtOppslagsSignal.beskrivelse}</div>
            </div>
          </div>

          {/* Kan bety */}
          <div style={{ backgroundColor: farger.hvit, border: `1px solid ${farger.kremMørk}`, borderRadius: '20px', padding: '20px', marginBottom: '16px' }}>
            <div style={{ fontSize: '14px', fontFamily: 'var(--font-plus-jakarta)', color: farger.tekst, fontWeight: '700', marginBottom: '12px' }}>Kan bety</div>
            {valgtOppslagsSignal.kanBety.map((punkt, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', marginBottom: '10px' }}>
                <div style={{ width: '20px', height: '20px', borderRadius: '50%', backgroundColor: kat?.farge || farger.bakgrunn, border: `1px solid ${kat?.border || farger.kremMørk}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '1px' }}>
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <path d="M2 5L4 7L8 3" stroke={kat?.tekstFarge || farger.grønn} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div style={{ fontSize: '13px', fontFamily: 'var(--font-inter)', color: farger.tekst, lineHeight: 1.5 }}>{punkt}</div>
              </div>
            ))}
          </div>

          {/* Tips */}
          {valgtOppslagsSignal.tips && (
            <div style={{ backgroundColor: farger.grønnLys, border: `1px solid ${farger.grønn}`, borderRadius: '20px', padding: '20px', marginBottom: '16px' }}>
              <div style={{ fontSize: '14px', fontFamily: 'var(--font-plus-jakarta)', color: farger.grønn, fontWeight: '700', marginBottom: '8px' }}>💡 Tips</div>
              <div style={{ fontSize: '13px', fontFamily: 'var(--font-inter)', color: farger.tekst, lineHeight: 1.6 }}>{valgtOppslagsSignal.tips}</div>
            </div>
          )}

          {/* Ser du dette hos babyen? */}
          <div style={{ background: 'linear-gradient(135deg, #F5F0FF 0%, #EDE8FF 100%)', border: '1px solid #D8D0FF', borderRadius: '20px', padding: '20px', textAlign: 'center' }}>
            <div style={{ fontSize: '14px', fontFamily: 'var(--font-plus-jakarta)', color: '#3B0764', fontWeight: '700', marginBottom: '6px' }}>
              Ser du dette signalet hos {babyNavn}?
            </div>
            <div style={{ fontSize: '12px', fontFamily: 'var(--font-inter)', color: '#7C3AED', marginBottom: '16px' }}>
              Registrer signalet for å få personlig innsikt
            </div>
            <button
              onClick={() => onNavigate?.('innsikt')}
              style={{ padding: '12px 24px', background: 'linear-gradient(135deg, #7C3AED, #6D28D9)', border: 'none', borderRadius: '50px', fontSize: '13px', fontWeight: '600', color: '#fff', cursor: 'pointer', fontFamily: 'var(--font-inter)' }}
            >
              Registrer signal →
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Kategoridetaljside
  if (aktivKategori) {
    return (
      <div style={{ backgroundColor: farger.bakgrunn, minHeight: '100vh', padding: '0 0 100px' }}>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

        {/* Header */}
        <div style={{ padding: '24px 24px 0', display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '8px' }}>
          <button onClick={() => setAktivKategori(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M15 18L9 12L15 6" stroke={farger.tekst} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <div>
            <div style={{ fontSize: '20px', fontFamily: 'var(--font-plus-jakarta)', color: farger.tekst, fontWeight: '700' }}>{aktivKategori.tittel}</div>
            <div style={{ fontSize: '12px', fontFamily: 'var(--font-inter)', color: farger.tekstLys }}>{aktivKategori.undertittel}</div>
          </div>
        </div>

        <div style={{ padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {aktivKategori.signaler.map((signal, i) => (
            <button
              key={i}
              onClick={() => setValgtOppslagsSignal(signal)}
              style={{ backgroundColor: farger.hvit, border: `1px solid ${farger.kremMørk}`, borderRadius: '16px', padding: '16px', display: 'flex', alignItems: 'center', gap: '14px', cursor: 'pointer', textAlign: 'left', width: '100%' }}
            >
              <div style={{ width: '52px', height: '52px', borderRadius: '50%', backgroundColor: aktivKategori.farge, border: `1.5px solid ${aktivKategori.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <img src={signal.ikon} style={{ width: '28px', height: '28px', objectFit: 'contain' }} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '14px', fontFamily: 'var(--font-plus-jakarta)', color: farger.tekst, fontWeight: '700', marginBottom: '4px' }}>{signal.navn}</div>
                <div style={{ display: 'flex', gap: '6px', marginBottom: '4px' }}>
                  {signal.tidlig && <div style={{ padding: '2px 8px', backgroundColor: '#FFF8EC', border: '1px solid #F4D9A0', borderRadius: '20px', fontSize: '10px', fontFamily: 'var(--font-inter)', color: '#8B6340', fontWeight: '600' }}>Tidlig signal</div>}
                  {signal.sent && <div style={{ padding: '2px 8px', backgroundColor: '#FDF4FF', border: '1px solid #E9D5FF', borderRadius: '20px', fontSize: '10px', fontFamily: 'var(--font-inter)', color: '#7C3AED', fontWeight: '600' }}>Sent signal</div>}
                </div>
                <div style={{ fontSize: '12px', fontFamily: 'var(--font-inter)', color: farger.tekstLys, lineHeight: 1.4 }}>{signal.beskrivelse}</div>
              </div>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M6 4L10 8L6 12" stroke={farger.tekstLys} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          ))}

          {/* Ser du dette hos babyen? */}
          <div style={{ background: 'linear-gradient(135deg, #F5F0FF 0%, #EDE8FF 100%)', border: '1px solid #D8D0FF', borderRadius: '20px', padding: '20px', textAlign: 'center', marginTop: '8px' }}>
            <div style={{ fontSize: '14px', fontFamily: 'var(--font-plus-jakarta)', color: '#3B0764', fontWeight: '700', marginBottom: '6px' }}>
              Ser du disse signalene hos {babyNavn}?
            </div>
            <div style={{ fontSize: '12px', fontFamily: 'var(--font-inter)', color: '#7C3AED', marginBottom: '16px' }}>
              Registrer signal for å få personlig innsikt
            </div>
            <button
              onClick={() => onNavigate?.('innsikt')}
              style={{ padding: '12px 24px', background: 'linear-gradient(135deg, #7C3AED, #6D28D9)', border: 'none', borderRadius: '50px', fontSize: '13px', fontWeight: '600', color: '#fff', cursor: 'pointer', fontFamily: 'var(--font-inter)' }}
            >
              Registrer signal →
            </button>
          </div>
        </div>
      </div>
    );
  }

  // HOVEDSIDE
  return (
    <div style={{ backgroundColor: farger.bakgrunn, minHeight: '100vh', padding: '24px 24px 100px' }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* Header */}
      <div style={{ marginBottom: '6px' }}>
        <div style={{ fontSize: '26px', fontFamily: 'var(--font-plus-jakarta)', color: farger.tekst, fontWeight: '700', marginBottom: '4px' }}>Signaler</div>
        <div style={{ fontSize: '13px', fontFamily: 'var(--font-inter)', color: '#8B6340', fontWeight: '600' }}>Lær babyens språk 💛</div>
        <div style={{ fontSize: '12px', fontFamily: 'var(--font-inter)', color: farger.tekstLys, marginTop: '2px' }}>Forstå hva ulike signaler kan bety.</div>
      </div>

      {laster ? (
        <div style={{ textAlign: 'center', padding: '48px' }}>
          <div style={{ width: '24px', height: '24px', border: `2px solid ${farger.grønn}`, borderTop: '2px solid transparent', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto' }} />
        </div>
      ) : (
        <>
          {/* Wilhelm viser oftest – kun om registrert data */}
          {topp3.length > 0 && (
            <div style={{ background: 'linear-gradient(135deg, #F5F0FF 0%, #EDE8FF 100%)', border: '1px solid #D8D0FF', borderRadius: '20px', padding: '20px', marginBottom: '16px', marginTop: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#7C3AED' }} />
                <div style={{ fontSize: '14px', fontFamily: 'var(--font-plus-jakarta)', color: '#3B0764', fontWeight: '700' }}>{babyNavn} viser oftest</div>
              </div>
              {/* Horisontal kjede */}
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px', marginBottom: '12px' }}>
                {topp3.map((signal, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-end', gap: '8px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                      <div style={{ width: '52px', height: '52px', borderRadius: '50%', backgroundColor: '#EEF2FF', border: '1.5px solid #C7D2FE', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <img src={getSignalIkon(signal.navn)} style={{ width: '28px', height: '28px', objectFit: 'contain' }} />
                      </div>
                      <div style={{ fontSize: '10px', fontFamily: 'var(--font-inter)', color: '#5B21B6', textAlign: 'center', maxWidth: '56px', lineHeight: 1.3 }}>{signal.navn}</div>
                    </div>
                    {i < topp3.length - 1 && (
                      <div style={{ fontSize: '14px', color: '#A78BFA', marginBottom: '18px' }}>→</div>
                    )}
                    {i === topp3.length - 1 && (
                      <>
                        <div style={{ fontSize: '14px', color: '#A78BFA', marginBottom: '18px' }}>→</div>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                          <div style={{ width: '52px', height: '52px', borderRadius: '50%', backgroundColor: '#E8F0E8', border: '1.5px solid #A8C8A8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <img src="/mane-natt.png" style={{ width: '28px', height: '28px', objectFit: 'contain' }} />
                          </div>
                          <div style={{ fontSize: '10px', fontFamily: 'var(--font-inter)', color: farger.grønn, textAlign: 'center' }}>Søvn</div>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
              <div style={{ fontSize: '12px', fontFamily: 'var(--font-inter)', color: '#7C3AED', marginBottom: '12px' }}>
                Registrert {topp3[0]?.antall} {topp3[0]?.antall === 1 ? 'gang' : 'ganger'}
              </div>
              <button
                onClick={() => onNavigate?.('innsikt')}
                style={{ width: '100%', padding: '12px', background: 'linear-gradient(135deg, #7C3AED, #6D28D9)', border: 'none', borderRadius: '50px', fontSize: '13px', fontWeight: '600', color: '#fff', cursor: 'pointer', fontFamily: 'var(--font-inter)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
              >
                Se {babyNavn} sin innsikt <span style={{ fontSize: '16px' }}>›</span>
              </button>
            </div>
          )}

          {/* Kategorikort */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
            {KATEGORIER.map((kat) => (
              <button
                key={kat.id}
                onClick={() => setAktivKategori(kat)}
                style={{ backgroundColor: farger.hvit, border: `1px solid ${farger.kremMørk}`, borderRadius: '20px', padding: '20px', textAlign: 'left', cursor: 'pointer', width: '100%' }}
              >
                {/* Tittel */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: kat.farge, border: `1px solid ${kat.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <img src={kat.ikon} style={{ width: '20px', height: '20px', objectFit: 'contain' }} />
                  </div>
                  <div>
                    <div style={{ fontSize: '15px', fontFamily: 'var(--font-plus-jakarta)', color: kat.tekstFarge, fontWeight: '700' }}>{kat.tittel}</div>
                    <div style={{ fontSize: '11px', fontFamily: 'var(--font-inter)', color: farger.tekstLys, lineHeight: 1.4 }}>{kat.undertittel}</div>
                  </div>
                </div>

                {/* Signalvisning: 3 ikoner + antall */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '12px', marginBottom: '8px' }}>
                  {kat.signaler.slice(0, 3).map((signal, i) => (
                    <div key={i} style={{ width: '44px', height: '44px', borderRadius: '50%', backgroundColor: kat.farge, border: `1px solid ${kat.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <img src={signal.ikon} style={{ width: '24px', height: '24px', objectFit: 'contain' }} />
                    </div>
                  ))}
                  {kat.signaler.length > 3 && (
                    <div style={{ width: '44px', height: '44px', borderRadius: '50%', backgroundColor: kat.farge, border: `1px solid ${kat.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <div style={{ fontSize: '13px', fontFamily: 'var(--font-plus-jakarta)', color: kat.tekstFarge, fontWeight: '700' }}>+{kat.signaler.length - 3}</div>
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ fontSize: '13px', fontFamily: 'var(--font-inter)', color: kat.tekstFarge, fontWeight: '600' }}>{kat.signaler.length} signaler</div>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M6 4L10 8L6 12" stroke={kat.tekstFarge} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </button>
            ))}
          </div>

          {/* Visste du */}
          <div style={{ backgroundColor: '#F5F0FF', border: '1px solid #D8D0FF', borderRadius: '20px', padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
              <div style={{ fontSize: '20px', flexShrink: 0 }}>💡</div>
              <div>
                <div style={{ fontSize: '13px', fontFamily: 'var(--font-plus-jakarta)', color: '#3B0764', fontWeight: '700', marginBottom: '6px' }}>Visste du?</div>
                <div style={{ fontSize: '13px', fontFamily: 'var(--font-inter)', color: '#5B21B6', lineHeight: 1.6 }}>{VISSTE_DU}</div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}