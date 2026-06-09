'use client';
import { farger } from '../../lib/farger';
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import BarnVelger from './BarnVelger';

type Props = {
  bruker: any;
  aktivtBarn: any;
  onNavigate: (side: string, fane?: string) => void;
  onByttBarn: (barn: any) => void;
};

/** Auth user id used as profil_id in all activity tables (e.g. pumping, mat). */
const hentProfilId = async (aktivtBarn: any, bruker: any) => {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.user?.id ?? aktivtBarn?.bruker_id ?? bruker?.id;
};

const tidspunkt = () => {
  const h = new Date().getHours();
  if (h < 12) return 'God morgen';
  if (h < 18) return 'God ettermiddag';
  return 'God kveld';
};

const BlomstIllustrasjon = () => (
  <svg width="52" height="52" viewBox="0 0 52 52" fill="none">
    <ellipse cx="26" cy="14" rx="5" ry="9" fill="#EBC8B4" opacity="0.7" transform="rotate(0 26 26)"/>
    <ellipse cx="26" cy="14" rx="5" ry="9" fill="#EBC8B4" opacity="0.6" transform="rotate(45 26 26)"/>
    <ellipse cx="26" cy="14" rx="5" ry="9" fill="#EBC8B4" opacity="0.5" transform="rotate(90 26 26)"/>
    <ellipse cx="26" cy="14" rx="5" ry="9" fill="#EBC8B4" opacity="0.6" transform="rotate(135 26 26)"/>
    <ellipse cx="26" cy="14" rx="5" ry="9" fill="#F7D5C5" opacity="0.5" transform="rotate(180 26 26)"/>
    <ellipse cx="26" cy="14" rx="5" ry="9" fill="#F7D5C5" opacity="0.4" transform="rotate(225 26 26)"/>
    <ellipse cx="26" cy="14" rx="5" ry="9" fill="#EBC8B4" opacity="0.5" transform="rotate(270 26 26)"/>
    <ellipse cx="26" cy="14" rx="5" ry="9" fill="#EBC8B4" opacity="0.6" transform="rotate(315 26 26)"/>
    <circle cx="26" cy="26" r="7" fill="#C48E7B" opacity="0.85"/>
    <circle cx="26" cy="26" r="4" fill="#EBC8B4" opacity="0.9"/>
    <path d="M26 38 Q30 42 28 46 Q24 42 26 38Z" fill="#A8B5A2" opacity="0.7"/>
    <path d="M26 38 Q22 43 24 46 Q28 42 26 38Z" fill="#A8B5A2" opacity="0.5"/>
  </svg>
);

const IkonKomponent = ({ type }: { type: string }) => {
  if (type === 'oppvåkning') return (
    <div style={{ width: 36, height: 36, borderRadius: '50%', backgroundColor: '#F2E8D8', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="5" fill="#F4A853"/>
        <line x1="12" y1="2" x2="12" y2="5" stroke="#F4A853" strokeWidth="2" strokeLinecap="round"/>
        <line x1="12" y1="19" x2="12" y2="22" stroke="#F4A853" strokeWidth="2" strokeLinecap="round"/>
        <line x1="2" y1="12" x2="5" y2="12" stroke="#F4A853" strokeWidth="2" strokeLinecap="round"/>
        <line x1="19" y1="12" x2="22" y2="12" stroke="#F4A853" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    </div>
  );
  if (type === 'natt') return (
    <div style={{ width: 36, height: 36, borderRadius: '50%', backgroundColor: '#D6E5DF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <path d="M21 12.5C20.4 15.8 17.5 18 14 18C10 18 7 15 7 11C7 8 9 5.5 12 4.5C9.5 7 9.5 11 12.5 13.5C15.5 16 19.5 15 21 12.5Z" fill="#2D5C45"/>
      </svg>
    </div>
  );
  if (type === 'lur') return (
    <div style={{ width: 36, height: 36, borderRadius: '50%', backgroundColor: '#E8EFF8', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <path d="M6 15C4.3 15 3 13.7 3 12C3 10.5 4 9.2 5.5 9C5.8 7.3 7.2 6 9 6C10.1 6 11 6.5 11.7 7.3C12.1 7.1 12.5 7 13 7C14.7 7 16 8.3 16 10C16 10.2 16 10.3 15.9 10.5C17.1 10.9 18 12 18 13.3C18 14.8 16.8 16 15.3 16H6V15Z" fill="#A8B5A2" opacity="0.7"/>
      </svg>
    </div>
  );
  if (type === 'amming') return (
    <div style={{ width: 36, height: 36, borderRadius: '50%', backgroundColor: '#F2E4D8', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <img src="/tateflaske.png" style={{ width: 24, height: 24, objectFit: 'contain' }} />
    </div>
  );
  if (type === 'bleie') return (
    <div style={{ width: 36, height: 36, borderRadius: '50%', backgroundColor: '#E8F0E8', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <img src="/bleie.png" style={{ width: 22, height: 22, objectFit: 'contain' }} />
    </div>
  );
  if (type === 'milepæl') return (
    <div style={{ width: 36, height: 36, borderRadius: '50%', backgroundColor: '#FFF3D6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <path d="M12 2L14.4 9.6H22L15.8 14.4L18.2 22L12 17.2L5.8 22L8.2 14.4L2 9.6H9.6L12 2Z" fill="#F4A853"/>
      </svg>
    </div>
  );
  if (type === 'mat') return <img src="/mat.png" style={{ width: 36, height: 36, objectFit: 'contain' }} />;
  if (type === 'pumping') return (
    <div style={{ width: 36, height: 36, borderRadius: '50%', backgroundColor: '#F2E4D8', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <img src="/pumping.png" style={{ width: 22, height: 22, objectFit: 'contain' }} />
    </div>
  );
  if (type === 'pumping') return (
    <div style={{ width: 36, height: 36, borderRadius: '50%', backgroundColor: '#FFE8D6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <img src="/pumping.png" style={{ width: 22, height: 22, objectFit: 'contain' }} />
    </div>
  );
  return (
    <div style={{ width: 36, height: 36, borderRadius: '50%', backgroundColor: '#F0EBE3', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
        <path d="M10 16C10 16 3 11 3 6.5C3 4.5 4.5 3 6.5 3C7.8 3 9 3.7 10 5C11 3.7 12.2 3 13.5 3C15.5 3 17 4.5 17 6.5C17 11 10 16 10 16Z" fill="none" stroke="#8A7060" strokeWidth="1.3"/>
      </svg>
    </div>
  );
  };

const beregnNesteLur = (fødselsdato: string, lurer: any[]) => {
  const alderIMnd = () => {
    if (!fødselsdato) return 3;
    const nå = new Date();
    const født = new Date(fødselsdato);
    return (nå.getFullYear() - født.getFullYear()) * 12 + (nå.getMonth() - født.getMonth());
  };
  const alder = alderIMnd();
  let våkenvindu = 90;
  if (alder < 2) våkenvindu = 45;
  else if (alder < 4) våkenvindu = 75;
  else if (alder < 6) våkenvindu = 120;
  else if (alder < 9) våkenvindu = 150;
  else if (alder < 12) våkenvindu = 180;
  else våkenvindu = 210;

  const sisteOppvåkning = [...(lurer || [])].sort((a: any, b: any) => b.start?.localeCompare(a.start))[0];
  if (!sisteOppvåkning?.start) return null;

  const [timer, minutter] = sisteOppvåkning.start.split(':').map(Number);
  const oppvåkningTid = new Date();
  oppvåkningTid.setHours(timer, minutter, 0, 0);

  const nesteLurTid = new Date(oppvåkningTid.getTime() + våkenvindu * 60000);
  const nå = new Date();
  const omMinutter = Math.round((nesteLurTid.getTime() - nå.getTime()) / 60000);
  if (omMinutter < -30) return null;

  const klokkeslett = nesteLurTid.toLocaleTimeString('no-NO', { hour: '2-digit', minute: '2-digit' });
  const nåTimer = nå.getHours();
  const erLeggetid = nåTimer >= 18 || nesteLurTid.getHours() >= 18;

  const omTekst = omMinutter <= 0 ? 'Nå!'
    : omMinutter < 60 ? `Om ca. ${omMinutter} min`
    : `Om ca. ${Math.floor(omMinutter / 60)}t ${omMinutter % 60 > 0 ? `${omMinutter % 60}min` : ''}`;

  return { tid: klokkeslett, om: omTekst, type: erLeggetid ? 'natt' as const : 'lur' as const };
};

const AIInnsiktKort = ({ bruker, aktivtBarn, babyNavn, onNavigate }: { bruker: any; aktivtBarn: any; babyNavn: string; onNavigate: (side: string) => void }) => {
  const [innsikt, setInnsikt] = useState('');
  const [laster, setLaster] = useState(false);

  useEffect(() => {
    const hentInnsikt = async () => {
      const profilId = await hentProfilId(aktivtBarn, bruker);
      if (!profilId) return;

      setLaster(true);
      const fraDate = new Date();
      fraDate.setDate(fraDate.getDate() - 3);
      const fra = fraDate.toISOString().split('T')[0];

      const [lurer, amming] = await Promise.all([
        supabase.from('lurer').select('*').eq('profil_id', profilId).gte('dato', fra),
        supabase.from('amming').select('*').eq('profil_id', profilId).gte('dato', fra),
      ]);

      if (!lurer.data?.length && !amming.data?.length) {
        setInnsikt(`Begynn å registrere for å få personlige innsikter om ${babyNavn} ✨`);
        setLaster(false);
        return;
      }

      try {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 150,
            messages: [{
              role: 'user',
              content: `Du er en varm babyekspert i appen Lille. Gi ÉN kort og personlig innsikt på norsk basert på disse dataene. Maks 1-2 setninger. Bruk babyens navn ${babyNavn}. Vær varm og konkret.

Søvndata siste 3 dager: ${JSON.stringify(lurer.data?.slice(0, 10))}
Ammingdata siste 3 dager: ${JSON.stringify(amming.data?.slice(0, 10))}

Svar kun med innsikten, ingen introduksjon.`
            }],
          }),
        });
        const result = await response.json();
        setInnsikt(result.content?.[0]?.text || '');
      } catch {
        setInnsikt(`Registrer søvn og amming for å få personlige innsikter om ${babyNavn} ✨`);
      }
      setLaster(false);
    };

    if (babyNavn) hentInnsikt();
  }, [bruker, aktivtBarn, babyNavn]);

  return (
    <div style={{ background: 'rgba(255,255,255,0.75)', backdropFilter: 'blur(12px)', border: '1px solid rgba(235,200,180,0.4)', borderRadius: '20px', padding: '16px', boxShadow: '0 4px 16px rgba(0,0,0,0.04)' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
        <div style={{ fontSize: '20px', flexShrink: 0 }}>✨</div>
        <div style={{ flex: 1 }}>
          {laster ? (
            <div style={{ fontSize: '13px', fontFamily: 'var(--font-inter)', color: '#A8B5A2' }}>Analyserer {babyNavn}s mønstre...</div>
          ) : (
            <div style={{ fontSize: '13px', fontFamily: 'var(--font-inter)', color: '#3F3A37', lineHeight: 1.6 }}>{innsikt}</div>
          )}
          <button onClick={() => onNavigate('innsikt')} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontSize: '12px', fontFamily: 'var(--font-inter)', color: '#A8B5A2', fontWeight: 500, marginTop: '6px', display: 'flex', alignItems: 'center', gap: '3px' }}>
            Se alle innsikter
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M4 2.5L7.5 6L4 9.5" stroke="#A8B5A2" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default function Hjemskjerm({ bruker, aktivtBarn, onNavigate, onByttBarn }: Props) {
  const [babyNavn, setBabyNavn] = useState('');
  const [babyTilstand, setBabyTilstand] = useState('rolig');
  const [babyBilde, setBabyBilde] = useState<string | null>(null);
  const [dagensFlyt, setDagensFlyt] = useState<any[]>([]);
  const [nesteLur, setNesteLur] = useState<{ tid: string; om: string; type: 'lur' | 'natt' } | null>(null);
  const [lurPågår, setLurPågår] = useState(false);
  const [lurStartTid, setLurStartTid] = useState<string | null>(null);
  const [lurType, setLurType] = useState<'lur' | 'natt'>('lur');
  const [visDagbok, setVisDagbok] = useState(false);
  const [alleDagensHendelser, setAlleDagensHendelser] = useState<any[]>([]);
  const [auraObservasjon, setAuraObservasjon] = useState('');

  const hentAuraObservasjon = async () => {
    const profilId = await hentProfilId(aktivtBarn, bruker);
    if (!profilId) return;

    const fraDate = new Date();
    fraDate.setDate(fraDate.getDate() - 7);
    const fra = fraDate.toISOString().split('T')[0];

    const { data: lurer } = await supabase
      .from('lurer')
      .select('*')
      .eq('profil_id', profilId)
      .gte('dato', fra)
      .not('signaler', 'is', null);

    if (!lurer || lurer.length < 3) {
      setAuraObservasjon('');
      return;
    }

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 100,
          messages: [{
            role: 'user',
            content: `Du er en varm babyekspert. Gi ÉN kort observasjon på norsk om ${babyNavn}s overganger basert på søvnsignalene. Maks 1 setning. Bruk babyens navn. Vær konkret og varm.

Data: ${JSON.stringify(lurer.slice(0, 10))}

Svar KUN med observasjonen.`
          }],
        }),
      });
      const result = await response.json();
      setAuraObservasjon(result.content?.[0]?.text || '');
    } catch {
      setAuraObservasjon('');
    }
  };

  useEffect(() => {
    if (aktivtBarn?.navn) {
      setBabyNavn(aktivtBarn.navn);
      hentAuraObservasjon();
    }
    const lagretBilde = localStorage.getItem(`lille_babybilde_${aktivtBarn?.id}`) || localStorage.getItem('lille_babybilde');
    if (lagretBilde) setBabyBilde(lagretBilde);
    else setBabyBilde(null);
  }, [aktivtBarn]);

  useEffect(() => {
    const lastDagensFlyt = async () => {
      const profilId = await hentProfilId(aktivtBarn, bruker);
      if (!profilId) return;

      const dagensdato = new Date().toISOString().split('T')[0];

      const [lurRes, ammingRes, bleieRes, milepælRes, matRes, pumpingRes] = await Promise.all([
        supabase.from('lurer').select('*').eq('profil_id', profilId).eq('dato', dagensdato).order('start', { ascending: false }),
        supabase.from('amming').select('*').eq('profil_id', profilId).eq('dato', dagensdato).order('start', { ascending: false }),
        supabase.from('bleie').select('*').eq('profil_id', profilId).eq('dato', dagensdato).order('tidspunkt', { ascending: false }),
        supabase.from('milepæler').select('*').eq('profil_id', profilId).eq('dato', dagensdato),
        supabase.from('mat').select('*').eq('profil_id', profilId).eq('dato', dagensdato).order('klokkeslett', { ascending: false }),
        supabase.from('pumping').select('*').eq('profil_id', profilId).eq('dato', dagensdato).order('klokkeslett', { ascending: false }),
      ]);

      const lurItems = (lurRes.data || []).map((l: any) => ({
        tid: l.start,
        slutt: l.slutt || null,
        tekst: l.type === 'lur' ? 'Lur' : l.type === 'natt' ? 'Sovnet' : l.type === 'oppvåkning' ? 'Våknet' : l.tekst || l.type,
        type: l.type,
        varighet: l.varighet ? `${l.varighet} min` : null,
      }));

      const ammingItems = (ammingRes.data || []).map((a: any) => ({
        tid: a.start,
        slutt: a.slutt || null,
        tekst: 'Amming',
        type: 'amming',
        varighet: a.varighet ? `${a.varighet} min` : null,
      }));

      const bleieItems = (bleieRes.data || []).map((b: any) => ({
        tid: b.tidspunkt,
        slutt: null,
        tekst: 'Bleie',
        type: 'bleie',
        varighet: null,
      }));

      const milepælItems = (milepælRes.data || []).map((m: any) => ({
        tid: m.opprettet ? new Date(m.opprettet).toLocaleTimeString('no-NO', { hour: '2-digit', minute: '2-digit' }) : '00:00',
        slutt: null,
        tekst: `🏆 ${m.navn}`,
        type: 'milepæl',
        varighet: null,
      }));

      const matItems = (matRes.data || []).map((m: any) => ({
        tid: m.klokkeslett,
        slutt: null,
        tekst: `Mat: ${m.matvare}`,
        type: 'mat',
        varighet: null,
      }));

      const pumpingItems = (pumpingRes.data || []).map((p: any) => ({
        tid: p.klokkeslett,
        slutt: null,
        tekst: `Pumping: ${p.mengde} ml`,
        type: 'pumping',
        varighet: p.varighet ? `${p.varighet} min` : null,
      }));
      
     const alle = [...lurItems, ...ammingItems, ...bleieItems, ...milepælItems, ...matItems, ...pumpingItems].sort((a, b) => {
        if (!a.tid || !b.tid) return 0;
        return b.tid.localeCompare(a.tid);
      });

      

      setDagensFlyt(alle);
      setAlleDagensHendelser(alle);

      const lurResult = beregnNesteLur(aktivtBarn?.fødselsdato || '', lurRes.data || []);
      setNesteLur(lurResult);
    };

    const lagretType = localStorage.getItem('lille_sovtype');
    const lagretStartTid = localStorage.getItem('lille_starttid');
    if (lagretType && lagretStartTid) {
      setLurPågår(true);
      setLurType(lagretType as 'lur' | 'natt');
      const start = new Date(lagretStartTid);
      setLurStartTid(start.toLocaleTimeString('no-NO', { hour: '2-digit', minute: '2-digit' }));
    } else {
      setLurPågår(false);
      setLurStartTid(null);
    }

    lastDagensFlyt();
    hentAuraObservasjon();
    const interval = setInterval(lastDagensFlyt, 60000);
    return () => clearInterval(interval);
  }, [bruker, aktivtBarn, babyNavn]);

  const tilstandConfig: Record<string, { tekst: string; undertekst: string; farge: string }> = {
    rolig: { tekst: 'Rolig og våken', undertekst: 'Klar for lek og samspill', farge: '#A8B5A2' },
    trøtt: { tekst: 'Virker trøtt', undertekst: 'Kanskje tid for en lur snart?', farge: '#C7BDD8' },
    urolig: { tekst: 'Litt urolig', undertekst: 'Trenger ro og regulering', farge: '#C48E7B' },
    sover: { tekst: 'Sover nå', undertekst: 'Hvil deg du også 🌙', farge: '#A8B5A2' },
  };

  const valgtTilstand = tilstandConfig[babyTilstand] || tilstandConfig.rolig;

  const aiInnsikt: Record<string, string> = {
    rolig: 'Baby virker rolig og mottakelig nå ✦',
    trøtt: 'Baby viser trøtthetstegn – kanskje start nedtrapping?',
    urolig: 'Baby virker litt overstimulert i dag',
    sover: 'Baby sover – bruk tiden til å hvile 🌙',
  };

  const tilstandLabels: Record<string, string> = {
    rolig: 'Rolig', trøtt: 'Trøtt', urolig: 'Urolig', sover: 'Sover',
  };

  const snarveier = [
    {
      label: 'Amming', side: 'amming',
      svg: <img src="/tateflaske-mork.png" style={{ width: 48, height: 48, objectFit: 'contain' }} />,
    },
    {
      label: 'Signaler', side: 'signaler',
      svg: (
        <svg width="48" height="48" viewBox="0 0 28 28" fill="none">
          <path d="M14 23C14 23 4 17 4 10.5C4 7.5 6.7 5 10 5C11.8 5 13.2 5.9 14 7.2C14.8 5.9 16.2 5 18 5C21.3 5 24 7.5 24 10.5C24 17 14 23 14 23Z" fill="none" stroke="#A8B5A2" strokeWidth="1.7" strokeLinejoin="round"/>
        </svg>
      ),
    },
    {
      label: 'Uro & ro', side: 'kolikk',
      svg: <img src="/uro.png" style={{ width: 48, height: 48, objectFit: 'contain' }} />,
    },
  ];

  const formatDato = () => {
    const d = new Date();
    return d.toLocaleDateString('no-NO', { weekday: 'long', day: 'numeric', month: 'long' });
  };

  return (
    <div style={{ backgroundColor: '#F7F3EC', minHeight: '100vh', overflowX: 'hidden' }}>

      {/* Header */}
      <div style={{ padding: '20px 24px 0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <BarnVelger bruker={bruker} aktivtBarnId={aktivtBarn?.id} onByttBarn={onByttBarn} />
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '22px', fontFamily: 'var(--font-plus-jakarta), sans-serif', fontWeight: 600, color: '#3F3A37', marginBottom: '2px', letterSpacing: '-0.3px' }}>
              {tidspunkt()}{babyNavn ? `, ${babyNavn}` : ''} ✨
            </div>
            <div style={{ fontSize: '13px', fontFamily: 'var(--font-inter), sans-serif', color: '#7B746D' }}>
              {valgtTilstand.tekst}
            </div>
          </div>
        </div>
      </div>

      {/* AI Innsikt-kort */}
      <div style={{ padding: '16px 24px 0' }}>
        <div style={{ background: 'rgba(255,255,255,0.75)', backdropFilter: 'blur(12px)', border: '1px solid rgba(235,200,180,0.4)', borderRadius: '20px', padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 4px 20px rgba(0,0,0,0.04)' }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '13.5px', fontFamily: 'var(--font-inter), sans-serif', color: '#3F3A37', lineHeight: '1.4', marginBottom: '6px' }}>
              {aiInnsikt[babyTilstand]}
            </div>
            <button onClick={() => onNavigate('innsikt', 'innsikt')} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontSize: '12px', fontFamily: 'var(--font-inter), sans-serif', color: '#A8B5A2', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '3px' }}>
              Se innsikt
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M4 2.5L7.5 6L4 9.5" stroke="#A8B5A2" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
          <div style={{ marginLeft: '12px', flexShrink: 0 }}>
            <BlomstIllustrasjon />
          </div>
        </div>
      </div>

      {/* Stor blob med babybilde */}
      <div style={{ position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '320px' }}>
        {(() => {
          const auraFarger: Record<string, { c1: string; c2: string; c3: string }> = {
            rolig:  { c1: '#A8C4A2', c2: '#C7D8C0', c3: '#A8B5A2' },
            trøtt:  { c1: '#C7BDD8', c2: '#D8D0E8', c3: '#B8A8CC' },
            urolig: { c1: '#E8B49A', c2: '#EBC8B4', c3: '#C48E7B' },
            sover:  { c1: '#8AAEE0', c2: '#6B7FC4', c3: '#3D5A9E' },
          };
          const f = auraFarger[babyTilstand] || auraFarger.rolig;
          return (
            <>
              <div style={{ position: 'absolute', width: '300px', height: '280px', background: `radial-gradient(ellipse, ${f.c1} 0%, transparent 70%)`, borderRadius: '62% 38% 54% 46% / 55% 48% 52% 45%', opacity: 0.35, filter: 'blur(22px)', transform: 'translate(40px, -20px)', transition: 'all 1s ease' }} />
              <div style={{ position: 'absolute', width: '280px', height: '260px', background: `radial-gradient(ellipse, ${f.c2} 0%, transparent 70%)`, borderRadius: '45% 55% 38% 62% / 52% 60% 40% 48%', opacity: 0.25, filter: 'blur(20px)', transform: 'translate(-40px, 10px)', transition: 'all 1s ease' }} />
              <div style={{ position: 'absolute', width: '260px', height: '260px', background: `radial-gradient(ellipse at 50% 50%, ${f.c3} 0%, transparent 70%)`, borderRadius: '55% 45% 62% 38% / 48% 55% 45% 52%', opacity: 0.7, filter: 'blur(16px)', transition: 'all 1s ease' }} />
            </>
          );
        })()}
        <div style={{ position: 'absolute', width: '200px', height: '200px', background: 'radial-gradient(ellipse at 50% 50%, rgba(255,255,255,0.5) 0%, transparent 70%)', borderRadius: '50%', filter: 'blur(6px)' }} />
        <div style={{ position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
          {babyBilde ? (
            <div style={{ width: '120px', height: '120px', borderRadius: '50%', overflow: 'hidden', border: '3px solid rgba(255,255,255,0.9)', boxShadow: '0 8px 30px rgba(0,0,0,0.10)' }}>
              <img src={babyBilde} alt="baby" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
          ) : (
            <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(255,255,255,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid rgba(255,255,255,0.8)' }}>
              <img src="/baby-ansikt.png" alt="baby" style={{ width: '56px', height: '56px', objectFit: 'contain', mixBlendMode: 'multiply' }} />
            </div>
          )}
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '17px', fontFamily: 'var(--font-plus-jakarta), sans-serif', fontWeight: 600, color: '#3F3A37', marginBottom: '4px' }}>{valgtTilstand.tekst}</div>
            <div style={{ fontSize: '12.5px', fontFamily: 'var(--font-inter), sans-serif', color: '#7B746D' }}>{valgtTilstand.undertekst}</div>
          </div>
        </div>
      </div>

      {/* Tilstandsvelger */}
      <div style={{ display: 'flex', gap: '8px', padding: '0 24px 16px', overflowX: 'auto' }}>
        {Object.entries(tilstandConfig).map(([key, val]) => (
          <button key={key} onClick={() => setBabyTilstand(key)} style={{ flexShrink: 0, padding: '9px 18px', borderRadius: '24px', border: babyTilstand === key ? `1.5px solid ${val.farge}` : '1.5px solid rgba(220,207,192,0.6)', backgroundColor: babyTilstand === key ? `${val.farge}22` : 'rgba(255,255,255,0.6)', color: babyTilstand === key ? val.farge : '#7B746D', fontSize: '12.5px', fontFamily: 'var(--font-inter), sans-serif', cursor: 'pointer', fontWeight: babyTilstand === key ? 600 : 400, transition: 'all 0.3s ease' }}>
            {tilstandLabels[key]}
          </button>
        ))}
      </div>

      {/* AI aura-observasjon */}
      {auraObservasjon && (
        <div style={{ padding: '0 24px 16px' }}>
          <div style={{ background: 'rgba(255,255,255,0.75)', backdropFilter: 'blur(12px)', border: '1px solid rgba(220,207,192,0.4)', borderRadius: '16px', padding: '12px 16px', display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
            <span style={{ fontSize: '14px', flexShrink: 0 }}>✨</span>
            <div style={{ fontSize: '12px', fontFamily: 'var(--font-inter)', color: '#3F3A37', lineHeight: 1.6 }}>{auraObservasjon}</div>
          </div>
        </div>
      )}

      {/* Lur pågår / Neste lur */}
      {lurPågår ? (
        <div style={{ padding: '0 24px 16px' }}>
          <button onClick={() => onNavigate('sovn')} style={{ width: '100%', background: 'rgba(255,255,255,0.75)', backdropFilter: 'blur(12px)', border: '1px solid rgba(220,207,192,0.4)', borderRadius: '20px', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', boxShadow: '0 4px 16px rgba(0,0,0,0.04)', textAlign: 'left' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: lurType === 'natt' ? '#D6E5DF' : '#FFF3D6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              {lurType === 'natt' ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M21 12.5C20.4 15.8 17.5 18 14 18C10 18 7 15 7 11C7 8 9 5.5 12 4.5C9.5 7 9.5 11 12.5 13.5C15.5 16 19.5 15 21 12.5Z" fill="#2D5C45"/>
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="5" fill="#F4A853"/>
                  <line x1="12" y1="2" x2="12" y2="5" stroke="#F4A853" strokeWidth="2" strokeLinecap="round"/>
                  <line x1="12" y1="19" x2="12" y2="22" stroke="#F4A853" strokeWidth="2" strokeLinecap="round"/>
                  <line x1="2" y1="12" x2="5" y2="12" stroke="#F4A853" strokeWidth="2" strokeLinecap="round"/>
                  <line x1="19" y1="12" x2="22" y2="12" stroke="#F4A853" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              )}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '12px', fontFamily: 'var(--font-inter)', color: '#7B746D', marginBottom: '2px' }}>
                {lurType === 'natt' ? 'Sover nå 🌙' : 'Lur pågår'}
              </div>
              <div style={{ fontSize: '15px', fontFamily: 'var(--font-plus-jakarta)', color: '#3F3A37', fontWeight: '600', marginBottom: '2px' }}>
                Siden {lurStartTid}
              </div>
              <div style={{ fontSize: '11px', fontFamily: 'var(--font-inter)', color: '#7B746D' }}>
                Trykk for å se søvnskjermen
              </div>
            </div>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M6 4L10 8L6 12" stroke="#A8B5A2" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      ) : nesteLur && (
        <div style={{ padding: '0 24px 16px' }}>
          <button onClick={() => onNavigate('sovn')} style={{ width: '100%', background: 'rgba(255,255,255,0.75)', backdropFilter: 'blur(12px)', border: '1px solid rgba(220,207,192,0.4)', borderRadius: '20px', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', boxShadow: '0 4px 16px rgba(0,0,0,0.04)', textAlign: 'left' }}>
            {nesteLur.type === 'natt' ? (
              <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#D6E5DF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M21 12.5C20.4 15.8 17.5 18 14 18C10 18 7 15 7 11C7 8 9 5.5 12 4.5C9.5 7 9.5 11 12.5 13.5C15.5 16 19.5 15 21 12.5Z" fill="#2D5C45"/>
                </svg>
              </div>
            ) : (
              <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#FFF3D6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="5" fill="#F4A853"/>
                  <line x1="12" y1="2" x2="12" y2="5" stroke="#F4A853" strokeWidth="2" strokeLinecap="round"/>
                  <line x1="12" y1="19" x2="12" y2="22" stroke="#F4A853" strokeWidth="2" strokeLinecap="round"/>
                  <line x1="2" y1="12" x2="5" y2="12" stroke="#F4A853" strokeWidth="2" strokeLinecap="round"/>
                  <line x1="19" y1="12" x2="22" y2="12" stroke="#F4A853" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </div>
            )}
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '12px', fontFamily: 'var(--font-inter)', color: '#7B746D', marginBottom: '2px' }}>
                {nesteLur.type === 'natt' ? 'Nærmer seg leggetid' : 'Neste lur'}
              </div>
              <div style={{ fontSize: '15px', fontFamily: 'var(--font-plus-jakarta)', color: '#3F3A37', fontWeight: '600', marginBottom: '2px' }}>
                {nesteLur.om}
              </div>
              <div style={{ fontSize: '11px', fontFamily: 'var(--font-inter)', color: '#7B746D' }}>
                Vindu ca. {nesteLur.tid}
              </div>
            </div>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M6 4L10 8L6 12" stroke="#A8B5A2" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      )}

      {/* Snarveier */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', padding: '0 24px', marginBottom: '28px' }}>
        {snarveier.map(item => (
          <button key={item.side} onClick={() => onNavigate(item.side)} style={{ padding: '14px 8px', background: 'rgba(255,255,255,0.75)', border: '1px solid rgba(220,207,192,0.4)', borderRadius: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between', gap: '8px', cursor: 'pointer', boxShadow: '0 4px 16px rgba(0,0,0,0.04)', transition: 'all 0.3s ease', height: '90px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1 }}>
              {item.svg}
            </div>
            <span style={{ fontSize: '11px', fontFamily: 'var(--font-inter), sans-serif', color: '#7B746D', textAlign: 'center', lineHeight: 1.2 }}>{item.label}</span>
          </button>
        ))}
      </div>

      {/* AI-innsikt kort */}
      <div style={{ padding: '0 24px 16px' }}>
        <AIInnsiktKort bruker={bruker} aktivtBarn={aktivtBarn} babyNavn={babyNavn} onNavigate={onNavigate} />
      </div>

      {/* Dagens flyt */}
      <div style={{ padding: '0 24px 32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <div style={{ fontSize: '16px', fontFamily: 'var(--font-plus-jakarta), sans-serif', fontWeight: 600, color: '#3F3A37' }}>Dagens flyt</div>
          <button onClick={() => setVisDagbok(true)} style={{ fontSize: '12px', fontFamily: 'var(--font-inter), sans-serif', color: '#A8B5A2', background: 'rgba(168,181,162,0.12)', border: '1px solid rgba(168,181,162,0.3)', padding: '5px 14px', borderRadius: '20px', cursor: 'pointer', fontWeight: 500 }}>Se dagbok</button>
        </div>
        <div style={{ background: 'rgba(255,255,255,0.6)', border: '1px solid rgba(220,207,192,0.35)', borderRadius: '20px', overflow: 'hidden', padding: '8px 0' }}>
          {dagensFlyt.length === 0 ? (
            <div style={{ padding: '28px 24px', textAlign: 'center' }}>
              <div style={{ fontSize: '14px', fontStyle: 'italic', color: '#7B746D', fontFamily: 'var(--font-plus-jakarta), sans-serif', marginBottom: '6px' }}>Ingen registreringer ennå i dag</div>
              <div style={{ fontSize: '12px', fontFamily: 'var(--font-inter), sans-serif', color: '#A8B5A2' }}>Trykk + for å begynne</div>
            </div>
          ) : (
            <>
              {dagensFlyt.slice(0, 5).map((item: any, i) => (
                <div key={i} style={{ position: 'relative' }}>
                  {i < Math.min(dagensFlyt.length, 5) - 1 && (
                    <div style={{ position: 'absolute', left: '36px', top: '54px', width: '1px', height: 'calc(100% - 10px)', backgroundColor: 'rgba(220,207,192,0.5)' }} />
                  )}
                  <div style={{ padding: '12px 18px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <IkonKomponent type={item.type} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '14px', fontFamily: 'var(--font-inter), sans-serif', color: '#3F3A37', fontWeight: i === 0 ? 600 : 400 }}>{item.tekst}</div>
                      <div style={{ fontSize: '11px', fontFamily: 'var(--font-inter), sans-serif', color: '#7B746D', marginTop: '2px' }}>
                        {item.slutt ? `${item.tid}–${item.slutt}` : item.tid}
                      </div>
                    </div>
                    {item.varighet && item.varighet !== '0 min' && (
                      <div style={{ fontSize: '12px', fontFamily: 'var(--font-inter), sans-serif', color: '#A8B5A2', fontWeight: 500 }}>{item.varighet}</div>
                    )}
                  </div>
                </div>
              ))}
              {dagensFlyt.length > 5 && (
                <div style={{ padding: '10px 18px', textAlign: 'center', borderTop: '1px solid rgba(220,207,192,0.35)' }}>
                  <button onClick={() => setVisDagbok(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '12px', fontFamily: 'var(--font-inter)', color: farger.tekstLys, lineHeight: 1.6 }}>
                    +{dagensFlyt.length - 5} hendelse{dagensFlyt.length - 5 > 1 ? 'r' : ''} til i dag – Se dagbok
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* DAGBOK MODAL */}
      {visDagbok && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', zIndex: 200, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }} onClick={() => setVisDagbok(false)}>
          <div onClick={e => e.stopPropagation()} style={{ backgroundColor: farger.hvit, width: '100%', maxWidth: '430px', borderRadius: '24px 24px 0 0', padding: '24px', paddingBottom: '48px', maxHeight: '85vh', overflowY: 'auto' }}>
            <div style={{ width: '36px', height: '4px', backgroundColor: farger.kremMørk, borderRadius: '2px', margin: '0 auto 20px' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <div style={{ fontSize: '20px', fontFamily: 'var(--font-plus-jakarta)', color: farger.tekst, fontWeight: '700' }}>Dagbok</div>
                <div style={{ fontSize: '13px', fontFamily: 'var(--font-inter)', color: farger.tekstLys }}>{formatDato()}</div>
              </div>
              <div style={{ fontSize: '13px', fontFamily: 'var(--font-inter)', color: farger.tekstLys }}>
                {alleDagensHendelser.length} hendelser
              </div>
            </div>
            {alleDagensHendelser.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px', color: farger.tekstLys, fontFamily: 'var(--font-inter)', fontSize: '14px', fontStyle: 'italic' }}>
                Ingen registreringer i dag ennå
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {alleDagensHendelser.map((item: any, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', backgroundColor: farger.bakgrunn, borderRadius: '14px' }}>
                    <IkonKomponent type={item.type} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '14px', fontFamily: 'var(--font-inter)', color: farger.tekst, fontWeight: '500' }}>{item.tekst}</div>
                      <div style={{ fontSize: '11px', fontFamily: 'var(--font-inter)', color: farger.tekstLys }}>
                        {item.slutt ? `${item.tid}–${item.slutt}` : item.tid}
                      </div>
                    </div>
                    {item.varighet && item.varighet !== '0 min' && (
                      <div style={{ fontSize: '13px', fontFamily: 'var(--font-plus-jakarta)', color: farger.grønn, fontWeight: '600' }}>{item.varighet}</div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}