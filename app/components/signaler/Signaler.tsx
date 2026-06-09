'use client';
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { farger } from '../../lib/farger';

type Props = { bruker: any; aktivtBarn?: any; onNavigate?: (side: string, fane?: string) => void; };

type RegistertSignal = {
  navn: string;
  antall: number;
  prosentFørLur: number;
  gjsnittMinFørSøvn: number;
};

type OppslagsSignal = {
  navn: string;
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
  farge: string;
  border: string;
  tekstFarge: string;
  signaler: OppslagsSignal[];
};

const HjerteIkon = ({ farge = '#8B6340', størrelse = 24 }: { farge?: string; størrelse?: number }) => (
  <svg width={størrelse} height={størrelse} viewBox="0 0 24 24" fill="none">
    <path d="M12 21C12 21 3 15 3 9C3 6.5 5 4.5 7.5 4.5C9.2 4.5 10.7 5.4 12 7C13.3 5.4 14.8 4.5 16.5 4.5C19 4.5 21 6.5 21 9C21 15 12 21 12 21Z" stroke={farge} strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const KATEGORIER: Kategori[] = [
  {
    id: 'sovn',
    tittel: 'Søvnsignaler',
    undertittel: 'Signaler som vises når babyen begynner å bli trøtt.',
    farge: '#FFF8EC',
    border: '#F4D9A0',
    tekstFarge: '#8B6340',
    signaler: [
      { navn: 'Stirrer tomt', tidlig: true, sent: false, beskrivelse: 'Babyen ser tomt ut i blikket og virker fjern.', kanBety: ['Tidlig trøtthetssignal', 'Babyen begynner å koble av', 'Tid for å starte nedtrapping'], tips: 'Begynn å roe ned miljøet når du ser dette.' },
      { navn: 'Gjesper', tidlig: true, sent: true, beskrivelse: 'Gjesping er et vanlig tegn på tretthet.', kanBety: ['Tidlig eller sent signal avhengig av kontekst', 'Kombinert med andre signaler = søvn nærmer seg'], tips: 'Ett gjesp er ikke nok – se etter kombinasjoner.' },
      { navn: 'Gnir øynene', tidlig: false, sent: true, beskrivelse: 'Babyen gnir eller klør seg i øynene.', kanBety: ['Sent søvnsignal', 'Babyen er overtrøtt om dette vedvarer', 'Søvn nærmer seg'], tips: 'Er dette første signal du ser, kan babyen allerede være overtrøtt.' },
      { navn: 'Vender hodet bort', tidlig: true, sent: false, beskrivelse: 'Babyen vender hodet bort fra deg eller stimuli.', kanBety: ['Overstimulering', 'Behov for pause', 'Tidlig trøtthetssignal'], tips: 'Respekter signalet – ikke prøv å få kontakt igjen med én gang.' },
      { navn: 'Mister interessen', tidlig: true, sent: false, beskrivelse: 'Babyen mister interessen for det som skjer rundt.', kanBety: ['Tidlig søvnsignal', 'Behov for roligere omgivelser'], tips: 'Reduser stimuli og gå til et roligere rom.' },
      { navn: 'Tunge øyelokk', tidlig: false, sent: true, beskrivelse: 'Øyelokkene blir tunge og halvveis lukkede.', kanBety: ['Sent søvnsignal', 'Søvn er nært forestående'], tips: 'Legg ned nå – babyen er klar.' },
    ],
  },
  {
    id: 'pause',
    tittel: 'Trenger en pause',
    undertittel: 'Tegn på overstimulering eller behov for ro.',
    farge: farger.grønnLys,
    border: '#A8C8A8',
    tekstFarge: farger.grønn,
    signaler: [
      { navn: 'Vender hodet bort', tidlig: true, sent: false, beskrivelse: 'Babyen vender hodet bort fra deg eller fra stimuli.', kanBety: ['Overstimulering', 'Behov for pause'], tips: 'Vent til babyen vender seg tilbake av seg selv.' },
      { navn: 'Urolig i kroppen', tidlig: false, sent: false, beskrivelse: 'Babyen virker rastløs og urolig i kroppen.', kanBety: ['Overstimulering', 'Ubehag', 'Behov for ro og nærhet'], tips: 'Prøv å dempe lys og lyd i rommet.' },
      { navn: 'Knytter nevene', tidlig: false, sent: false, beskrivelse: 'Babyen knytter hendene hardt.', kanBety: ['Stress eller ubehag', 'Kan komme før gråt'], tips: 'Ta babyen opp og gi ro før situasjonen eskalerer.' },
      { navn: 'Buer ryggen bakover', tidlig: false, sent: false, beskrivelse: 'Babyen buer ryggen bakover.', kanBety: ['Ubehag', 'Protest', 'Kan være kolikk'], tips: 'Sjekk om det er luft i magen.' },
      { navn: 'Unngår øyekontakt', tidlig: true, sent: false, beskrivelse: 'Babyen ser bort og unngår å møte blikket ditt.', kanBety: ['Trenger en pause fra stimuli', 'Overstimulering'], tips: 'Gi babyen litt tid uten press om kontakt.' },
    ],
  },
  {
    id: 'mage',
    tittel: 'Mage og ubehag',
    undertittel: 'Signaler knyttet til luft, mage eller uro.',
    farge: farger.terrakottaLys,
    border: '#D4A090',
    tekstFarge: farger.terrakotta,
    signaler: [
      { navn: 'Trekker bena opp', tidlig: false, sent: false, beskrivelse: 'Babyen trekker bena opp mot magen.', kanBety: ['Luft i magen', 'Mageubehag', 'Kolikk'], tips: 'Prøv sykkelbevegelser med bena eller magemassasje.' },
      { navn: 'Krummer ryggen', tidlig: false, sent: false, beskrivelse: 'Babyen krummer ryggen og virker anspent.', kanBety: ['Magesmerter', 'Luft i magen'], tips: 'Hold babyen oppreist etter mating.' },
      { navn: 'Rapper mye', tidlig: false, sent: false, beskrivelse: 'Babyen rapper ofte eller har synlig oppblåst mage.', kanBety: ['Trenger å rape', 'Kolikk', 'Mageubehag'], tips: 'Klapp forsiktig på ryggen og hold oppreist.' },
      { navn: 'Anspent ansikt', tidlig: false, sent: false, beskrivelse: 'Babyen grimaser og ser anspent ut.', kanBety: ['Smerte eller ubehag', 'Magetrøbbel'], tips: 'Kombiner med andre signaler for å tolke.' },
      { navn: 'Gråter ved mating', tidlig: false, sent: false, beskrivelse: 'Babyen begynner å gråte under eller etter mating.', kanBety: ['Refluks', 'Luft', 'Ubehag'], tips: 'Prøv å mate i mer oppreist stilling.' },
    ],
  },
  {
    id: 'sult',
    tittel: 'Sultsignaler',
    undertittel: 'Tegn på at babyen ønsker mat.',
    farge: '#FFF8EC',
    border: '#F4D9A0',
    tekstFarge: '#8B6340',
    signaler: [
      { navn: 'Suger på hendene', tidlig: true, sent: false, beskrivelse: 'Babyen suger på egne hender eller fingre.', kanBety: ['Tidlig sultsignal', 'Vil ha mat snart'], tips: 'Mat nå – ikke vent til babyen gråter.' },
      { navn: 'Smatter med munnen', tidlig: true, sent: false, beskrivelse: 'Babyen smatter med munnen.', kanBety: ['Sultent', 'Søker suging'], tips: 'Tidlig signal – ideelt tidspunkt å mate.' },
      { navn: 'Søker bryst eller flaske', tidlig: true, sent: false, beskrivelse: 'Babyen vrir hodet og søker etter bryst eller flaske.', kanBety: ['Sultent', 'Rooting-refleks aktiv'], tips: 'Typisk tidlig sultsignal hos nyfødte.' },
      { navn: 'Rastløs og urolig', tidlig: false, sent: true, beskrivelse: 'Babyen beveger seg mye og virker rastløs.', kanBety: ['Sent sultsignal', 'Snart gråt om ikke matet'], tips: 'Mat snart – gråt er siste sultsignal.' },
    ],
  },
];

const VISSTE_DU = 'Et signal alene betyr sjelden noe. Det er ofte kombinasjonen av flere signaler som forteller hva babyen trenger.';

export default function Signaler({ bruker, aktivtBarn, onNavigate }: Props) {
  const [registrerteSignaler, setRegistrerteSignaler] = useState<RegistertSignal[]>([]);
  const [babyNavn, setBabyNavn] = useState('babyen');
  const [laster, setLaster] = useState(true);
  const [aktivKategori, setAktivKategori] = useState<Kategori | null>(null);
  const [valgtOppslagsSignal, setValgtOppslagsSignal] = useState<OppslagsSignal | null>(null);
  const [visRegistrerModal, setVisRegistrerModal] = useState(false);
  const [forhåndsvalgtSignal, setForhåndsvalgtSignal] = useState<string>('');
  const [forhåndsvalgtKategori, setForhåndsvalgtKategori] = useState<string>('');

  // Registrering state
  const [valgtSignalNavn, setValgtSignalNavn] = useState('');
  const [valgtKategori, setValgtKategori] = useState('');
  const [dato, setDato] = useState(new Date().toISOString().split('T')[0]);
  const [klokkeslett, setKlokkeslett] = useState(new Date().toTimeString().slice(0, 5));
  const [notat, setNotat] = useState('');
  const [lagrer, setLagrer] = useState(false);
  const [lagringSuksess, setLagringSuksess] = useState(false);

  const lastData = useCallback(async () => {
    setLaster(true);
    if (aktivtBarn?.navn) setBabyNavn(aktivtBarn.navn);
    else {
      const { data: barn } = await supabase.from('barn').select('*').eq('bruker_id', bruker?.id).single();
      if (barn?.navn) setBabyNavn(barn.navn);
    }
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
      navn, antall: d.antall,
      prosentFørLur: Math.round((d.antall / totalLurer) * 100),
      gjsnittMinFørSøvn: d.minutterFørSøvn.length > 0 ? Math.round(d.minutterFørSøvn.reduce((a, b) => a + b, 0) / d.minutterFørSøvn.length) : 0,
    })).sort((a, b) => b.antall - a.antall);
    setRegistrerteSignaler(liste);
    setLaster(false);
  }, [bruker?.id, aktivtBarn?.navn]);

  useEffect(() => { lastData(); }, [lastData]);

  const åpneRegistrer = (signalNavn: string, kategoriId: string) => {
    setValgtSignalNavn(signalNavn);
    setValgtKategori(kategoriId);
    setDato(new Date().toISOString().split('T')[0]);
    setKlokkeslett(new Date().toTimeString().slice(0, 5));
    setNotat('');
    setLagringSuksess(false);
    setVisRegistrerModal(true);
  };

  const lagreSignal = async () => {
    if (!valgtSignalNavn || !valgtKategori) return;
    setLagrer(true);
    await supabase.from('signaler').insert({
      profil_id: bruker?.id,
      dato, klokkeslett,
      signal: valgtSignalNavn,
      kategori: valgtKategori,
      notat: notat.trim() || null,
    });
    setLagrer(false);
    setLagringSuksess(true);
    setTimeout(() => {
      setVisRegistrerModal(false);
      setLagringSuksess(false);
    }, 1500);
  };

  const topp3 = registrerteSignaler.slice(0, 3);

  // Detaljvisning
  if (valgtOppslagsSignal) {
    const kat = KATEGORIER.find(k => k.signaler.some(s => s.navn === valgtOppslagsSignal.navn));
    return (
      <div style={{ backgroundColor: farger.bakgrunn, minHeight: '100vh', padding: '0 0 100px' }}>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <div style={{ padding: '24px 24px 16px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button onClick={() => setValgtOppslagsSignal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M15 18L9 12L15 6" stroke={farger.tekst} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <div style={{ fontSize: '18px', fontFamily: 'var(--font-plus-jakarta)', color: farger.tekst, fontWeight: '700' }}>{kat?.tittel}</div>
        </div>
        <div style={{ padding: '0 24px' }}>
          <div style={{ backgroundColor: farger.hvit, border: `1px solid ${farger.kremMørk}`, borderRadius: '20px', padding: '24px', marginBottom: '16px', display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
            <div style={{ width: '72px', height: '72px', borderRadius: '50%', backgroundColor: kat?.farge || farger.bakgrunn, border: `1.5px solid ${kat?.border || farger.kremMørk}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <HjerteIkon farge={kat?.tekstFarge || farger.grønn} størrelse={36} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '20px', fontFamily: 'var(--font-plus-jakarta)', color: farger.tekst, fontWeight: '700', marginBottom: '8px' }}>{valgtOppslagsSignal.navn}</div>
              <div style={{ display: 'flex', gap: '6px', marginBottom: '10px' }}>
                {valgtOppslagsSignal.tidlig && <div style={{ padding: '3px 10px', backgroundColor: '#FFF8EC', border: '1px solid #F4D9A0', borderRadius: '20px', fontSize: '11px', fontFamily: 'var(--font-inter)', color: '#8B6340', fontWeight: '600' }}>Tidlig signal</div>}
                {valgtOppslagsSignal.sent && <div style={{ padding: '3px 10px', backgroundColor: farger.grønnLys, border: `1px solid ${farger.grønn}`, borderRadius: '20px', fontSize: '11px', fontFamily: 'var(--font-inter)', color: farger.grønn, fontWeight: '600' }}>Sent signal</div>}
              </div>
              <div style={{ fontSize: '14px', fontFamily: 'var(--font-inter)', color: farger.tekstLys, lineHeight: 1.6 }}>{valgtOppslagsSignal.beskrivelse}</div>
            </div>
          </div>

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

          {valgtOppslagsSignal.tips && (
            <div style={{ backgroundColor: farger.grønnLys, border: `1px solid ${farger.grønn}`, borderRadius: '20px', padding: '20px', marginBottom: '16px' }}>
              <div style={{ fontSize: '14px', fontFamily: 'var(--font-plus-jakarta)', color: farger.grønn, fontWeight: '700', marginBottom: '8px' }}>💡 Tips</div>
              <div style={{ fontSize: '13px', fontFamily: 'var(--font-inter)', color: farger.tekst, lineHeight: 1.6 }}>{valgtOppslagsSignal.tips}</div>
            </div>
          )}

          <button
            onClick={() => åpneRegistrer(valgtOppslagsSignal.navn, kat?.id || '')}
            style={{ width: '100%', padding: '16px', backgroundColor: farger.terrakotta, border: 'none', borderRadius: '14px', fontSize: '15px', fontWeight: '600', color: '#fff', cursor: 'pointer', fontFamily: 'var(--font-inter)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
          >
            <HjerteIkon farge="#fff" størrelse={18} />
            Registrer dette signalet nå
          </button>
        </div>

        {/* Registreringsmodal */}
        {visRegistrerModal && (
          <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 200, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }} onClick={() => setVisRegistrerModal(false)}>
            <div onClick={e => e.stopPropagation()} style={{ backgroundColor: farger.hvit, width: '100%', maxWidth: '430px', borderRadius: '24px 24px 0 0', padding: '24px', paddingBottom: '48px' }}>
              <div style={{ width: '36px', height: '4px', backgroundColor: farger.kremMørk, borderRadius: '2px', margin: '0 auto 20px' }} />
              {lagringSuksess ? (
                <div style={{ textAlign: 'center', padding: '20px' }}>
                  <div style={{ fontSize: '40px', marginBottom: '12px' }}>💛</div>
                  <div style={{ fontSize: '16px', fontFamily: 'var(--font-plus-jakarta)', color: farger.tekst, fontWeight: '700' }}>Signalet er registrert!</div>
                </div>
              ) : (
                <>
                  <div style={{ fontSize: '18px', fontFamily: 'var(--font-plus-jakarta)', color: farger.tekst, fontWeight: '700', marginBottom: '6px' }}>Registrer signal</div>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '5px 12px', backgroundColor: kat?.farge || farger.bakgrunn, border: `1px solid ${kat?.border || farger.kremMørk}`, borderRadius: '20px', marginBottom: '20px' }}>
                    <HjerteIkon farge={kat?.tekstFarge || farger.grønn} størrelse={14} />
                    <div style={{ fontSize: '13px', fontFamily: 'var(--font-inter)', color: kat?.tekstFarge || farger.grønn, fontWeight: '600' }}>{valgtSignalNavn}</div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>
                    <div>
                      <div style={{ fontSize: '12px', fontFamily: 'var(--font-inter)', color: farger.tekstLys, fontWeight: '600', marginBottom: '6px' }}>Dato</div>
                      <input type="date" value={dato} onChange={e => setDato(e.target.value)} style={{ width: '100%', padding: '10px 12px', fontSize: '13px', border: `1px solid ${farger.kremMørk}`, borderRadius: '10px', backgroundColor: farger.bakgrunn, color: farger.tekst, outline: 'none', fontFamily: 'var(--font-inter)', boxSizing: 'border-box' }} />
                    </div>
                    <div>
                      <div style={{ fontSize: '12px', fontFamily: 'var(--font-inter)', color: farger.tekstLys, fontWeight: '600', marginBottom: '6px' }}>Tidspunkt</div>
                      <input type="time" value={klokkeslett} onChange={e => setKlokkeslett(e.target.value)} style={{ width: '100%', padding: '10px 12px', fontSize: '13px', border: `1px solid ${farger.kremMørk}`, borderRadius: '10px', backgroundColor: farger.bakgrunn, color: farger.tekst, outline: 'none', fontFamily: 'var(--font-inter)', boxSizing: 'border-box' }} />
                    </div>
                  </div>
                  <div style={{ marginBottom: '20px' }}>
                    <div style={{ fontSize: '12px', fontFamily: 'var(--font-inter)', color: farger.tekstLys, fontWeight: '600', marginBottom: '6px' }}>Notat (valgfritt)</div>
                    <textarea value={notat} onChange={e => setNotat(e.target.value)} placeholder="Noe spesielt du vil huske?" rows={2} style={{ width: '100%', padding: '10px 12px', fontSize: '13px', border: `1px solid ${farger.kremMørk}`, borderRadius: '10px', backgroundColor: farger.bakgrunn, color: farger.tekst, outline: 'none', fontFamily: 'var(--font-inter)', resize: 'none', boxSizing: 'border-box' }} />
                  </div>
                  <button onClick={lagreSignal} disabled={lagrer} style={{ width: '100%', padding: '16px', backgroundColor: farger.terrakotta, border: 'none', borderRadius: '14px', fontSize: '15px', fontWeight: '600', color: '#fff', cursor: 'pointer', fontFamily: 'var(--font-inter)' }}>
                    {lagrer ? 'Lagrer...' : 'Lagre signal'}
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Kategoridetaljside
  if (aktivKategori) {
    return (
      <div style={{ backgroundColor: farger.bakgrunn, minHeight: '100vh', padding: '0 0 100px' }}>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <div style={{ padding: '24px 24px 0', display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '8px' }}>
          <button onClick={() => setAktivKategori(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}>
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
            <div key={i} style={{ backgroundColor: farger.hvit, border: `1px solid ${farger.kremMørk}`, borderRadius: '16px', padding: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '10px' }}>
                <div style={{ width: '52px', height: '52px', borderRadius: '50%', backgroundColor: aktivKategori.farge, border: `1.5px solid ${aktivKategori.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <HjerteIkon farge={aktivKategori.tekstFarge} størrelse={26} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '14px', fontFamily: 'var(--font-plus-jakarta)', color: farger.tekst, fontWeight: '700', marginBottom: '4px' }}>{signal.navn}</div>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    {signal.tidlig && <div style={{ padding: '2px 8px', backgroundColor: '#FFF8EC', border: '1px solid #F4D9A0', borderRadius: '20px', fontSize: '10px', fontFamily: 'var(--font-inter)', color: '#8B6340', fontWeight: '600' }}>Tidlig signal</div>}
                    {signal.sent && <div style={{ padding: '2px 8px', backgroundColor: farger.grønnLys, border: `1px solid ${farger.grønn}`, borderRadius: '20px', fontSize: '10px', fontFamily: 'var(--font-inter)', color: farger.grønn, fontWeight: '600' }}>Sent signal</div>}
                  </div>
                </div>
              </div>
              <div style={{ fontSize: '12px', fontFamily: 'var(--font-inter)', color: farger.tekstLys, lineHeight: 1.5, marginBottom: '12px' }}>{signal.beskrivelse}</div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => setValgtOppslagsSignal(signal)} style={{ flex: 1, padding: '10px', backgroundColor: farger.bakgrunn, border: `1px solid ${farger.kremMørk}`, borderRadius: '10px', fontSize: '12px', fontFamily: 'var(--font-inter)', color: farger.tekst, cursor: 'pointer', fontWeight: '500' }}>
                  Les mer
                </button>
                <button onClick={() => åpneRegistrer(signal.navn, aktivKategori.id)} style={{ flex: 1, padding: '10px', backgroundColor: aktivKategori.farge, border: `1px solid ${aktivKategori.border}`, borderRadius: '10px', fontSize: '12px', fontFamily: 'var(--font-inter)', color: aktivKategori.tekstFarge, cursor: 'pointer', fontWeight: '600', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                  <HjerteIkon farge={aktivKategori.tekstFarge} størrelse={12} />
                  Registrer
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Registreringsmodal */}
        {visRegistrerModal && (
          <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 200, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }} onClick={() => setVisRegistrerModal(false)}>
            <div onClick={e => e.stopPropagation()} style={{ backgroundColor: farger.hvit, width: '100%', maxWidth: '430px', borderRadius: '24px 24px 0 0', padding: '24px', paddingBottom: '48px' }}>
              <div style={{ width: '36px', height: '4px', backgroundColor: farger.kremMørk, borderRadius: '2px', margin: '0 auto 20px' }} />
              {lagringSuksess ? (
                <div style={{ textAlign: 'center', padding: '20px' }}>
                  <div style={{ fontSize: '40px', marginBottom: '12px' }}>💛</div>
                  <div style={{ fontSize: '16px', fontFamily: 'var(--font-plus-jakarta)', color: farger.tekst, fontWeight: '700' }}>Signalet er registrert!</div>
                </div>
              ) : (
                <>
                  <div style={{ fontSize: '18px', fontFamily: 'var(--font-plus-jakarta)', color: farger.tekst, fontWeight: '700', marginBottom: '6px' }}>Registrer signal</div>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '5px 12px', backgroundColor: aktivKategori.farge, border: `1px solid ${aktivKategori.border}`, borderRadius: '20px', marginBottom: '20px' }}>
                    <HjerteIkon farge={aktivKategori.tekstFarge} størrelse={14} />
                    <div style={{ fontSize: '13px', fontFamily: 'var(--font-inter)', color: aktivKategori.tekstFarge, fontWeight: '600' }}>{valgtSignalNavn}</div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>
                    <div>
                      <div style={{ fontSize: '12px', fontFamily: 'var(--font-inter)', color: farger.tekstLys, fontWeight: '600', marginBottom: '6px' }}>Dato</div>
                      <input type="date" value={dato} onChange={e => setDato(e.target.value)} style={{ width: '100%', padding: '10px 12px', fontSize: '13px', border: `1px solid ${farger.kremMørk}`, borderRadius: '10px', backgroundColor: farger.bakgrunn, color: farger.tekst, outline: 'none', fontFamily: 'var(--font-inter)', boxSizing: 'border-box' }} />
                    </div>
                    <div>
                      <div style={{ fontSize: '12px', fontFamily: 'var(--font-inter)', color: farger.tekstLys, fontWeight: '600', marginBottom: '6px' }}>Tidspunkt</div>
                      <input type="time" value={klokkeslett} onChange={e => setKlokkeslett(e.target.value)} style={{ width: '100%', padding: '10px 12px', fontSize: '13px', border: `1px solid ${farger.kremMørk}`, borderRadius: '10px', backgroundColor: farger.bakgrunn, color: farger.tekst, outline: 'none', fontFamily: 'var(--font-inter)', boxSizing: 'border-box' }} />
                    </div>
                  </div>
                  <div style={{ marginBottom: '20px' }}>
                    <div style={{ fontSize: '12px', fontFamily: 'var(--font-inter)', color: farger.tekstLys, fontWeight: '600', marginBottom: '6px' }}>Notat (valgfritt)</div>
                    <textarea value={notat} onChange={e => setNotat(e.target.value)} placeholder="Noe spesielt du vil huske?" rows={2} style={{ width: '100%', padding: '10px 12px', fontSize: '13px', border: `1px solid ${farger.kremMørk}`, borderRadius: '10px', backgroundColor: farger.bakgrunn, color: farger.tekst, outline: 'none', fontFamily: 'var(--font-inter)', resize: 'none', boxSizing: 'border-box' }} />
                  </div>
                  <button onClick={lagreSignal} disabled={lagrer} style={{ width: '100%', padding: '16px', backgroundColor: farger.terrakotta, border: 'none', borderRadius: '14px', fontSize: '15px', fontWeight: '600', color: '#fff', cursor: 'pointer', fontFamily: 'var(--font-inter)' }}>
                    {lagrer ? 'Lagrer...' : 'Lagre signal'}
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  // HOVEDSIDE
  return (
    <div style={{ backgroundColor: farger.bakgrunn, minHeight: '100vh', padding: '24px 24px 100px' }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      <div style={{ marginBottom: '20px' }}>
        <div style={{ fontSize: '26px', fontFamily: 'var(--font-plus-jakarta)', color: farger.tekst, fontWeight: '700', marginBottom: '4px' }}>Signaler</div>
        <div style={{ fontSize: '13px', fontFamily: 'var(--font-inter)', color: farger.terrakotta, fontWeight: '600' }}>Lær babyens språk 💛</div>
        <div style={{ fontSize: '12px', fontFamily: 'var(--font-inter)', color: farger.tekstLys, marginTop: '2px' }}>Forstå hva ulike signaler kan bety.</div>
      </div>

      {laster ? (
        <div style={{ textAlign: 'center', padding: '48px' }}>
          <div style={{ width: '24px', height: '24px', border: `2px solid ${farger.grønn}`, borderTop: '2px solid transparent', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto' }} />
        </div>
      ) : (
        <>
          {/* Babyen viser oftest */}
          {topp3.length > 0 && (
            <div style={{ backgroundColor: farger.terrakottaLys, border: `1px solid ${farger.terrakotta}`, borderRadius: '20px', padding: '20px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                <HjerteIkon farge={farger.terrakotta} størrelse={18} />
                <div style={{ fontSize: '14px', fontFamily: 'var(--font-plus-jakarta)', color: farger.terrakotta, fontWeight: '700' }}>{babyNavn} viser oftest</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px', marginBottom: '12px' }}>
                {topp3.map((signal, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-end', gap: '8px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                      <div style={{ width: '52px', height: '52px', borderRadius: '50%', backgroundColor: farger.hvit, border: `1.5px solid ${farger.terrakotta}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <HjerteIkon farge={farger.terrakotta} størrelse={26} />
                      </div>
                      <div style={{ fontSize: '10px', fontFamily: 'var(--font-inter)', color: farger.terrakotta, textAlign: 'center', maxWidth: '56px', lineHeight: 1.3 }}>{signal.navn}</div>
                    </div>
                    {i < topp3.length - 1 && <div style={{ fontSize: '14px', color: farger.terrakotta, marginBottom: '18px' }}>→</div>}
                    {i === topp3.length - 1 && (
                      <>
                        <div style={{ fontSize: '14px', color: farger.terrakotta, marginBottom: '18px' }}>→</div>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                          <div style={{ width: '52px', height: '52px', borderRadius: '50%', backgroundColor: farger.grønnLys, border: `1.5px solid ${farger.grønn}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <img src="/mane-natt.png" style={{ width: '28px', height: '28px', objectFit: 'contain' }} />
                          </div>
                          <div style={{ fontSize: '10px', fontFamily: 'var(--font-inter)', color: farger.grønn, textAlign: 'center' }}>Søvn</div>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
              <div style={{ fontSize: '12px', fontFamily: 'var(--font-inter)', color: farger.terrakotta, marginBottom: '12px' }}>
                Registrert {topp3[0]?.antall} {topp3[0]?.antall === 1 ? 'gang' : 'ganger'}
              </div>
              <button onClick={() => onNavigate?.('innsikt', 'innsikt')} style={{ width: '100%', padding: '12px', backgroundColor: farger.terrakotta, border: 'none', borderRadius: '50px', fontSize: '13px', fontWeight: '600', color: '#fff', cursor: 'pointer', fontFamily: 'var(--font-inter)' }}>
  Se {babyNavn} sin innsikt ›
</button>
            </div>
          )}

          {/* Kategorikort */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
            {KATEGORIER.map((kat) => (
              <button key={kat.id} onClick={() => setAktivKategori(kat)} style={{ backgroundColor: farger.hvit, border: `1px solid ${farger.kremMørk}`, borderRadius: '20px', padding: '20px', textAlign: 'left', cursor: 'pointer', width: '100%' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: kat.farge, border: `1px solid ${kat.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <HjerteIkon farge={kat.tekstFarge} størrelse={22} />
                  </div>
                  <div>
                    <div style={{ fontSize: '15px', fontFamily: 'var(--font-plus-jakarta)', color: kat.tekstFarge, fontWeight: '700' }}>{kat.tittel}</div>
                    <div style={{ fontSize: '11px', fontFamily: 'var(--font-inter)', color: farger.tekstLys, lineHeight: 1.4 }}>{kat.undertittel}</div>
                  </div>
                </div>

                {/* Signaler med navn under */}
                <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '4px', marginBottom: '12px' }}>
                  {kat.signaler.map((signal, i) => (
                    <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', minWidth: '60px' }}>
                      <div style={{ width: '44px', height: '44px', borderRadius: '50%', backgroundColor: kat.farge, border: `1px solid ${kat.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <HjerteIkon farge={kat.tekstFarge} størrelse={22} />
                      </div>
                      <div style={{ fontSize: '9px', fontFamily: 'var(--font-inter)', color: farger.tekst, textAlign: 'center', lineHeight: 1.3 }}>{signal.navn}</div>
                    </div>
                  ))}
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
          <div style={{ backgroundColor: farger.hvit, border: `1px solid ${farger.kremMørk}`, borderRadius: '20px', padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
              <div style={{ flexShrink: 0, marginTop: '2px' }}>
                <HjerteIkon farge={farger.grønn} størrelse={20} />
              </div>
              <div>
                <div style={{ fontSize: '13px', fontFamily: 'var(--font-plus-jakarta)', color: farger.tekst, fontWeight: '700', marginBottom: '6px' }}>Visste du?</div>
                <div style={{ fontSize: '13px', fontFamily: 'var(--font-inter)', color: farger.tekstLys, lineHeight: 1.6 }}>{VISSTE_DU}</div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Registreringsmodal fra hovedside */}
      {visRegistrerModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 200, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }} onClick={() => setVisRegistrerModal(false)}>
          <div onClick={e => e.stopPropagation()} style={{ backgroundColor: farger.hvit, width: '100%', maxWidth: '430px', borderRadius: '24px 24px 0 0', padding: '24px', paddingBottom: '48px' }}>
            <div style={{ width: '36px', height: '4px', backgroundColor: farger.kremMørk, borderRadius: '2px', margin: '0 auto 20px' }} />
            {lagringSuksess ? (
              <div style={{ textAlign: 'center', padding: '20px' }}>
                <div style={{ fontSize: '40px', marginBottom: '12px' }}>💛</div>
                <div style={{ fontSize: '16px', fontFamily: 'var(--font-plus-jakarta)', color: farger.tekst, fontWeight: '700' }}>Signalet er registrert!</div>
              </div>
            ) : (
              <>
                <div style={{ fontSize: '18px', fontFamily: 'var(--font-plus-jakarta)', color: farger.tekst, fontWeight: '700', marginBottom: '20px' }}>Registrer signal</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>
                  <div>
                    <div style={{ fontSize: '12px', fontFamily: 'var(--font-inter)', color: farger.tekstLys, fontWeight: '600', marginBottom: '6px' }}>Dato</div>
                    <input type="date" value={dato} onChange={e => setDato(e.target.value)} style={{ width: '100%', padding: '10px 12px', fontSize: '13px', border: `1px solid ${farger.kremMørk}`, borderRadius: '10px', backgroundColor: farger.bakgrunn, color: farger.tekst, outline: 'none', fontFamily: 'var(--font-inter)', boxSizing: 'border-box' }} />
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', fontFamily: 'var(--font-inter)', color: farger.tekstLys, fontWeight: '600', marginBottom: '6px' }}>Tidspunkt</div>
                    <input type="time" value={klokkeslett} onChange={e => setKlokkeslett(e.target.value)} style={{ width: '100%', padding: '10px 12px', fontSize: '13px', border: `1px solid ${farger.kremMørk}`, borderRadius: '10px', backgroundColor: farger.bakgrunn, color: farger.tekst, outline: 'none', fontFamily: 'var(--font-inter)', boxSizing: 'border-box' }} />
                  </div>
                </div>
                <div style={{ marginBottom: '20px' }}>
                  <div style={{ fontSize: '12px', fontFamily: 'var(--font-inter)', color: farger.tekstLys, fontWeight: '600', marginBottom: '6px' }}>Notat (valgfritt)</div>
                  <textarea value={notat} onChange={e => setNotat(e.target.value)} placeholder="Noe spesielt du vil huske?" rows={2} style={{ width: '100%', padding: '10px 12px', fontSize: '13px', border: `1px solid ${farger.kremMørk}`, borderRadius: '10px', backgroundColor: farger.bakgrunn, color: farger.tekst, outline: 'none', fontFamily: 'var(--font-inter)', resize: 'none', boxSizing: 'border-box' }} />
                </div>
                <button onClick={lagreSignal} disabled={lagrer} style={{ width: '100%', padding: '16px', backgroundColor: farger.terrakotta, border: 'none', borderRadius: '14px', fontSize: '15px', fontWeight: '600', color: '#fff', cursor: 'pointer', fontFamily: 'var(--font-inter)' }}>
                  {lagrer ? 'Lagrer...' : 'Lagre signal'}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}