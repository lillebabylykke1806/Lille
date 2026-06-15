'use client';
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { farger } from '../../lib/farger';

type Props = { bruker: any; aktivtBarn?: any; };

type Notat = {
    id: number;
    tekst: string;
    kategori: string;
    dato: string;
    tidspunkt: string;
    opprettet: string;
    bilde_url?: string | null;
  };

const KATEGORIER = [
  { id: 'generelt', label: 'Generelt', farge: '#A8B5A2', bgFarge: '#E8F0E8' },
  { id: 'søvn', label: 'Søvn', farge: '#7B9ED9', bgFarge: '#E8EFF8' },
  { id: 'amming', label: 'Amming', farge: '#C48E7B', bgFarge: '#F2E4D8' },
  { id: 'milepæl', label: 'Milepæl ⭐', farge: '#F4A853', bgFarge: '#FFF3D6' },
  { id: 'bekymring', label: 'Bekymring', farge: '#C48E7B', bgFarge: '#FFE8E8' },
];

const KategoriIkon = ({ kategori }: { kategori: string }) => {
  const k = KATEGORIER.find(k => k.id === kategori) || KATEGORIER[0];
  if (kategori === 'søvn') return (
    <div style={{ width: 32, height: 32, borderRadius: '50%', backgroundColor: k.bgFarge, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
        <path d="M21 12.5C20.4 15.8 17.5 18 14 18C10 18 7 15 7 11C7 8 9 5.5 12 4.5C9.5 7 9.5 11 12.5 13.5C15.5 16 19.5 15 21 12.5Z" fill={k.farge}/>
      </svg>
    </div>
  );
  if (kategori === 'amming') return (
    <div style={{ width: 32, height: 32, borderRadius: '50%', backgroundColor: k.bgFarge, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <img src="/tateflaske-mork.png" style={{ width: 18, height: 18, objectFit: 'contain' }} />
    </div>
  );
  if (kategori === 'milepæl') return (
    <div style={{ width: 32, height: 32, borderRadius: '50%', backgroundColor: k.bgFarge, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
        <path d="M12 2L14.5 9H22L16 13.5L18.5 20.5L12 16L5.5 20.5L8 13.5L2 9H9.5L12 2Z" fill={k.farge}/>
      </svg>
    </div>
  );
  if (kategori === 'bekymring') return (
    <div style={{ width: 32, height: 32, borderRadius: '50%', backgroundColor: k.bgFarge, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
        <path d="M12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22Z" stroke={k.farge} strokeWidth="1.5" fill="none"/>
        <line x1="12" y1="8" x2="12" y2="13" stroke={k.farge} strokeWidth="1.5" strokeLinecap="round"/>
        <circle cx="12" cy="16" r="1" fill={k.farge}/>
      </svg>
    </div>
  );
  return (
    <div style={{ width: 32, height: 32, borderRadius: '50%', backgroundColor: k.bgFarge, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
        <rect x="5" y="3" width="14" height="18" rx="2" stroke={k.farge} strokeWidth="1.5" fill="none"/>
        <line x1="8" y1="8" x2="16" y2="8" stroke={k.farge} strokeWidth="1.3" strokeLinecap="round"/>
        <line x1="8" y1="12" x2="16" y2="12" stroke={k.farge} strokeWidth="1.3" strokeLinecap="round"/>
        <line x1="8" y1="16" x2="13" y2="16" stroke={k.farge} strokeWidth="1.3" strokeLinecap="round"/>
      </svg>
    </div>
  );
};

export default function Notat({ bruker, aktivtBarn }: Props) {
  const [notater, setNotater] = useState<Notat[]>([]);
  const [visNytt, setVisNytt] = useState(false);
  const [visNotat, setVisNotat] = useState<Notat | null>(null);
  const [søk, setSøk] = useState('');
  const [aktivKategori, setAktivKategori] = useState<string | null>(null);
  const [lagrer, setLagrer] = useState(false);

  const [nyTekst, setNyTekst] = useState('');
  const [nyKategori, setNyKategori] = useState('generelt');
  const [nyBilde, setNyBilde] = useState<string | null>(null);
const [lasterBilde, setLasterBilde] = useState(false);

const alderIMåneder = () => {
  const fødselsdato = aktivtBarn?.fødselsdato;
  if (!fødselsdato) return 0;
  const nå = new Date();
  const født = new Date(fødselsdato);
  return (nå.getFullYear() - født.getFullYear()) * 12 + (nå.getMonth() - født.getMonth());
};

const håndterBilde = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const fil = e.target.files?.[0];
  if (!fil) return;
  setLasterBilde(true);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  const img = new Image();
  img.onload = async () => {
    const maks = 800;
    let b = img.width, h = img.height;
    if (b > h) { h = Math.round(h * maks / b); b = maks; } else { b = Math.round(b * maks / h); h = maks; }
    canvas.width = b; canvas.height = h;
    ctx?.drawImage(img, 0, 0, b, h);
    canvas.toBlob(async (blob) => {
      if (!blob) { setLasterBilde(false); return; }
      const filnavn = `${bruker.id}/milepæl-${Date.now()}.jpg`;
      const { error } = await supabase.storage.from('babybilde').upload(filnavn, blob, { upsert: true, contentType: 'image/jpeg' });
      if (!error) {
        const { data } = supabase.storage.from('babybilde').getPublicUrl(filnavn);
        setNyBilde(data.publicUrl + '?t=' + Date.now());
      }
      setLasterBilde(false);
    }, 'image/jpeg', 0.8);
  };
  img.src = URL.createObjectURL(fil);
};

  const lastNotater = useCallback(async () => {
    const { data } = await supabase
      .from('notater')
      .select('*')
      .eq('profil_id', bruker?.id)
      .order('opprettet', { ascending: false });
    if (data) setNotater(data);
  }, [bruker?.id]);

  useEffect(() => {
    lastNotater();
  }, [lastNotater]);

  const lagreNotat = async () => {
    if (!nyTekst.trim()) return;
    setLagrer(true);
    const nå = new Date();
    await supabase.from('notater').insert({
        profil_id: bruker?.id,
        tekst: nyTekst,
        kategori: nyKategori,
        dato: nå.toISOString().split('T')[0],
        tidspunkt: nå.toLocaleTimeString('no-NO', { hour: '2-digit', minute: '2-digit' }),
        bilde_url: nyBilde || null,
      });
      setNyBilde(null);
    setNyTekst('');
    setNyKategori('generelt');
    setVisNytt(false);
    setLagrer(false);
    lastNotater();
  };

  const slettNotat = async (id: number) => {
    await supabase.from('notater').delete().eq('id', id);
    setVisNotat(null);
    lastNotater();
  };

  const filtrerte = notater
    .filter(n => aktivKategori ? n.kategori === aktivKategori : true)
    .filter(n => søk ? n.tekst.toLowerCase().includes(søk.toLowerCase()) : true);

  const gruppertPåDato = filtrerte.reduce((acc: Record<string, Notat[]>, n) => {
    const dato = n.dato;
    if (!acc[dato]) acc[dato] = [];
    acc[dato].push(n);
    return acc;
  }, {});

  const formatDato = (dato: string) => {
    const d = new Date(dato);
    const i = new Date();
    if (dato === i.toISOString().split('T')[0]) return 'I dag';
    if (dato === new Date(i.setDate(i.getDate() - 1)).toISOString().split('T')[0]) return 'I går';
    return d.toLocaleDateString('no-NO', { weekday: 'long', day: 'numeric', month: 'long' });
  };

  return (
    <div style={{ backgroundColor: farger.bakgrunn, minHeight: '100vh', padding: '24px 24px 100px' }}>

      {/* Header */}
      <div style={{ marginBottom: '20px', textAlign: 'center' }}>
        <div style={{ fontSize: '26px', fontFamily: 'var(--font-plus-jakarta)', color: farger.tekst, fontWeight: '700', marginBottom: '4px' }}>
          Notater
        </div>
        <div style={{ fontSize: '13px', fontFamily: 'var(--font-inter)', color: farger.tekstLys }}>
          Skriv ned tanker, milepæler og observasjoner
        </div>
      </div>

      {/* Søk */}
      <div style={{ position: 'relative', marginBottom: '12px' }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }}>
          <circle cx="11" cy="11" r="8" stroke={farger.tekstLys} strokeWidth="1.5" fill="none"/>
          <path d="M21 21L16.65 16.65" stroke={farger.tekstLys} strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
        <input
          type="text"
          value={søk}
          onChange={e => setSøk(e.target.value)}
          placeholder="Søk i notater..."
          style={{ width: '100%', padding: '12px 16px 12px 40px', fontSize: '14px', border: `1px solid ${farger.kremMørk}`, borderRadius: '12px', backgroundColor: farger.hvit, color: farger.tekst, outline: 'none', fontFamily: 'var(--font-inter)', boxSizing: 'border-box' }}
        />
      </div>

      {/* Kategorier */}
      <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', marginBottom: '20px', paddingBottom: '4px' }}>
        <button
          onClick={() => setAktivKategori(null)}
          style={{ flexShrink: 0, padding: '6px 14px', borderRadius: '20px', border: `1.5px solid ${aktivKategori === null ? farger.grønn : farger.kremMørk}`, backgroundColor: aktivKategori === null ? farger.grønnLys : 'transparent', color: aktivKategori === null ? farger.grønn : farger.tekstLys, fontSize: '12px', fontFamily: 'var(--font-inter)', cursor: 'pointer', fontWeight: aktivKategori === null ? '600' : '400' }}
        >
          Alle
        </button>
        {KATEGORIER.map(k => (
          <button
            key={k.id}
            onClick={() => setAktivKategori(aktivKategori === k.id ? null : k.id)}
            style={{ flexShrink: 0, padding: '6px 14px', borderRadius: '20px', border: `1.5px solid ${aktivKategori === k.id ? k.farge : farger.kremMørk}`, backgroundColor: aktivKategori === k.id ? k.bgFarge : 'transparent', color: aktivKategori === k.id ? k.farge : farger.tekstLys, fontSize: '12px', fontFamily: 'var(--font-inter)', cursor: 'pointer', fontWeight: aktivKategori === k.id ? '600' : '400' }}
          >
            {k.label}
          </button>
        ))}
      </div>

      {/* Notater gruppert på dato */}
      {Object.keys(gruppertPåDato).length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 24px' }}>
          <div style={{ fontSize: '14px', fontStyle: 'italic', fontFamily: 'var(--font-plus-jakarta)', color: farger.tekstLys, marginBottom: '8px' }}>
            {søk || aktivKategori ? 'Ingen notater funnet' : 'Ingen notater ennå'}
          </div>
          <div style={{ fontSize: '12px', fontFamily: 'var(--font-inter)', color: farger.tekstLys }}>
            Trykk + for å skrive ditt første notat
          </div>
        </div>
      ) : (
        Object.entries(gruppertPåDato).map(([dato, notatListe]) => (
          <div key={dato} style={{ marginBottom: '20px' }}>
            <div style={{ fontSize: '12px', fontFamily: 'var(--font-inter)', color: farger.tekstLys, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>
              {formatDato(dato)}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {notatListe.map(n => {
                const k = KATEGORIER.find(k => k.id === n.kategori) || KATEGORIER[0];
                return (
                  <button
                    key={n.id}
                    onClick={() => setVisNotat(n)}
                    style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '14px 16px', backgroundColor: farger.hvit, border: `1px solid ${farger.kremMørk}`, borderRadius: '16px', cursor: 'pointer', textAlign: 'left', width: '100%', borderLeft: `3px solid ${k.farge}` }}
                  >
                    <KategoriIkon kategori={n.kategori} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '13px', fontFamily: 'var(--font-inter)', color: farger.tekst, lineHeight: 1.5, marginBottom: '4px', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                        {n.tekst}
                      </div>
                      <div style={{ fontSize: '11px', fontFamily: 'var(--font-inter)', color: farger.tekstLys }}>
                        {n.tidspunkt} · {k.label}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ))
      )}

      {/* + Knapp */}
      <button
        onClick={() => setVisNytt(true)}
        style={{ position: 'fixed', bottom: '100px', right: '24px', width: '52px', height: '52px', borderRadius: '50%', backgroundColor: farger.grønn, border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 4px 16px rgba(45,92,69,0.35)', zIndex: 50 }}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M12 5V19M5 12H19" stroke="#FDFAF6" strokeWidth="2.5" strokeLinecap="round"/>
        </svg>
      </button>

      {/* MODAL: Nytt notat */}
      {visNytt && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', zIndex: 200, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }} onClick={() => setVisNytt(false)}>
          <div onClick={e => e.stopPropagation()} style={{ backgroundColor: farger.hvit, width: '100%', maxWidth: '430px', borderRadius: '24px 24px 0 0', padding: '24px', paddingBottom: '48px', maxHeight: '85vh', overflowY: 'auto' }}>
            <div style={{ width: '36px', height: '4px', backgroundColor: farger.kremMørk, borderRadius: '2px', margin: '0 auto 20px' }} />
            <div style={{ fontSize: '18px', fontFamily: 'var(--font-plus-jakarta)', color: farger.tekst, fontWeight: '600', marginBottom: '16px' }}>Nytt notat</div>

            {/* Kategori */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '11px', letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: 'var(--font-inter)', color: farger.tekstLys, marginBottom: '8px' }}>Kategori</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {KATEGORIER.map(k => (
                  <button key={k.id} onClick={() => setNyKategori(k.id)} style={{ padding: '6px 14px', backgroundColor: nyKategori === k.id ? k.bgFarge : farger.bakgrunn, border: `1.5px solid ${nyKategori === k.id ? k.farge : farger.kremMørk}`, borderRadius: '20px', fontSize: '12px', fontFamily: 'var(--font-inter)', color: nyKategori === k.id ? k.farge : farger.tekst, cursor: 'pointer', fontWeight: nyKategori === k.id ? '600' : '400' }}>
                    {k.label}
                  </button>
                ))}
              </div>
            </div>

            {nyKategori === 'milepæl' && (
  <div style={{ marginBottom: '16px' }}>
    <div style={{ fontSize: '11px', letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: 'var(--font-inter)', color: farger.tekstLys, marginBottom: '8px' }}>Alder-milepæler</div>
    <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
      {[1,2,3,4,5,6,7,8,9,10,11,12].map(mnd => (
        <button key={mnd} onClick={() => setNyTekst(`${mnd} måned${mnd > 1 ? 'er' : ''}! 🎉`)}
          style={{ flexShrink: 0, padding: '6px 14px', borderRadius: '20px', border: `1px solid ${farger.kremMørk}`, backgroundColor: farger.bakgrunn, fontSize: '12px', fontFamily: 'var(--font-inter)', color: farger.tekst, cursor: 'pointer' }}>
          {mnd} mnd
        </button>
      ))}
    </div>
  </div>
)}

{nyKategori === 'milepæl' && (
  <div style={{ marginBottom: '16px' }}>
    <div style={{ fontSize: '11px', letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: 'var(--font-inter)', color: farger.tekstLys, marginBottom: '8px' }}>Legg til bilde</div>
    <label style={{ cursor: 'pointer', display: 'block' }}>
      <div style={{ border: `2px dashed ${farger.kremMørk}`, borderRadius: '16px', padding: '20px', textAlign: 'center', backgroundColor: farger.bakgrunn }}>
        {lasterBilde ? (
          <div style={{ fontSize: '13px', fontFamily: 'var(--font-inter)', color: farger.tekstLys }}>Laster opp...</div>
        ) : nyBilde ? (
          <img src={nyBilde} style={{ width: '100%', maxHeight: '200px', objectFit: 'cover', borderRadius: '12px' }} />
        ) : (
          <>
            <div style={{ fontSize: '24px', marginBottom: '8px' }}>📷</div>
            <div style={{ fontSize: '13px', fontFamily: 'var(--font-inter)', color: farger.tekstLys }}>Trykk for å legge til bilde</div>
          </>
        )}
      </div>
      <input type="file" accept="image/*" onChange={håndterBilde} style={{ display: 'none' }} />
    </label>
    {nyBilde && (
      <button onClick={() => setNyBilde(null)} style={{ marginTop: '8px', width: '100%', padding: '8px', backgroundColor: 'transparent', border: `1px solid ${farger.kremMørk}`, borderRadius: '10px', fontSize: '12px', color: farger.tekstLys, cursor: 'pointer', fontFamily: 'var(--font-inter)' }}>
        Fjern bilde
      </button>
    )}
  </div>
)}

            {/* Tekst */}
            <div style={{ marginBottom: '24px' }}>
              <div style={{ fontSize: '11px', letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: 'var(--font-inter)', color: farger.tekstLys, marginBottom: '8px' }}>Notat</div>
              <textarea
                value={nyTekst}
                onChange={e => setNyTekst(e.target.value)}
                placeholder="Skriv her..."
                autoFocus
                style={{ width: '100%', padding: '14px 16px', fontSize: '14px', border: `1px solid ${farger.kremMørk}`, borderRadius: '12px', backgroundColor: farger.bakgrunn, color: farger.tekst, outline: 'none', fontFamily: 'var(--font-inter)', resize: 'none', minHeight: '140px', lineHeight: 1.6, boxSizing: 'border-box' }}
              />
            </div>

            <button onClick={lagreNotat} disabled={!nyTekst.trim() || lagrer} style={{ width: '100%', padding: '16px', backgroundColor: nyTekst.trim() ? farger.grønnLys : farger.kremMørk, border: `1px solid ${nyTekst.trim() ? farger.grønn : 'transparent'}`, borderRadius: '16px', fontSize: '15px', fontWeight: '600', color: nyTekst.trim() ? farger.grønn : farger.tekstLys, cursor: nyTekst.trim() ? 'pointer' : 'not-allowed', fontFamily: 'var(--font-inter)' }}>
              {lagrer ? 'Lagrer...' : 'Lagre notat'}
            </button>
          </div>
        </div>
      )}

      {/* MODAL: Vis notat */}
      {visNotat && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', zIndex: 200, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }} onClick={() => setVisNotat(null)}>
          <div onClick={e => e.stopPropagation()} style={{ backgroundColor: farger.hvit, width: '100%', maxWidth: '430px', borderRadius: '24px 24px 0 0', padding: '24px', paddingBottom: '48px', maxHeight: '85vh', overflowY: 'auto' }}>
            <div style={{ width: '36px', height: '4px', backgroundColor: farger.kremMørk, borderRadius: '2px', margin: '0 auto 20px' }} />

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <KategoriIkon kategori={visNotat.kategori} />
              <div>
                <div style={{ fontSize: '13px', fontFamily: 'var(--font-inter)', color: farger.tekst, fontWeight: '500' }}>
                  {KATEGORIER.find(k => k.id === visNotat.kategori)?.label}
                </div>
                <div style={{ fontSize: '11px', fontFamily: 'var(--font-inter)', color: farger.tekstLys }}>
                  {formatDato(visNotat.dato)} · {visNotat.tidspunkt}
                </div>
              </div>
            </div>

            {visNotat.kategori === 'milepæl' && (visNotat as any).bilde_url && (
  <img src={(visNotat as any).bilde_url} style={{ width: '100%', borderRadius: '16px', marginBottom: '16px', objectFit: 'cover', maxHeight: '300px' }} />
)}
<div style={{ fontSize: '15px', fontFamily: 'var(--font-inter)', color: farger.tekst, lineHeight: 1.7, marginBottom: '32px', whiteSpace: 'pre-wrap' }}>
  {visNotat.tekst}
</div>

            <button onClick={() => slettNotat(visNotat.id)} style={{ width: '100%', padding: '14px', backgroundColor: 'transparent', border: `1px solid #FFB3B3`, borderRadius: '14px', fontSize: '14px', color: '#C0392B', cursor: 'pointer', fontFamily: 'var(--font-inter)' }}>
              Slett notat
            </button>
          </div>
        </div>
      )}
    </div>
  );
}