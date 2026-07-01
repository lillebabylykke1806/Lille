'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';

export type Artikkel = {
  slug: string;
  tittel: string;
  dato: string;
  ingress: string;
  kategori: string;
  bilde: string;
  lesetid: string;
  forfatter: string;
};

const KATEGORIER = ['Alle', 'Søvn', 'Signaler', 'Rutiner', 'Amming', 'Uro & ro', 'Nyfødt'] as const;

const GRØNN = '#3D6B4F';
const BAKGRUNN = '#F5F0EA';
const KREM = '#EDE5D8';
const TEKST = '#3D2B1F';
const TEKST_LYS = '#8A7060';

export default function BloggInnhold({ artikler }: { artikler: Artikkel[] }) {
  const [søk, setSøk] = useState('');
  const [aktivKategori, setAktivKategori] = useState<string>('Alle');
  const [epost, setEpost] = useState('');
  const [påmeldt, setPåmeldt] = useState(false);

  const filtrerte = useMemo(() => {
    const q = søk.trim().toLowerCase();
    return artikler.filter((a) => {
      const matchKategori = aktivKategori === 'Alle' || a.kategori === aktivKategori;
      const matchSøk =
        !q ||
        a.tittel.toLowerCase().includes(q) ||
        a.ingress.toLowerCase().includes(q) ||
        a.kategori.toLowerCase().includes(q);
      return matchKategori && matchSøk;
    });
  }, [artikler, søk, aktivKategori]);

  const utvalgt = filtrerte[0] ?? null;
  const siste = filtrerte.slice(1);

  return (
    <div className="blogg-side" style={{ backgroundColor: BAKGRUNN, minHeight: '100vh', fontFamily: 'var(--font-inter), sans-serif', color: TEKST }}>
      <style>{`
        .blogg-hero-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 48px; align-items: center; }
        .blogg-featured-grid { display: grid; grid-template-columns: 1.1fr 1fr 0.75fr; gap: 32px; align-items: stretch; }
        .blogg-artikkel-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 24px; }
        @media (max-width: 1024px) {
          .blogg-featured-grid { grid-template-columns: 1fr; }
          .blogg-artikkel-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 640px) {
          .blogg-hero-grid { grid-template-columns: 1fr; }
          .blogg-artikkel-grid { grid-template-columns: 1fr; }
        }
      `}</style>

      {/* Hero */}
      <section style={{ maxWidth: 1200, margin: '0 auto', padding: '64px 24px 40px' }}>
        <div className="blogg-hero-grid">
          <div>
            <h1 style={{ fontFamily: 'var(--font-plus-jakarta), sans-serif', fontSize: 'clamp(2.25rem, 5vw, 3.25rem)', fontWeight: 700, lineHeight: 1.15, margin: '0 0 12px', color: TEKST }}>
              Rolig og våken 🤍
            </h1>
            <p style={{ fontFamily: 'var(--font-plus-jakarta), sans-serif', fontSize: '1.125rem', fontWeight: 600, color: GRØNN, margin: '0 0 16px' }}>
              Klar for lek og samspill
            </p>
            <p style={{ fontSize: '1rem', lineHeight: 1.7, color: TEKST_LYS, margin: '0 0 28px', maxWidth: 480 }}>
              Tips, råd og kunnskap som hjelper deg å forstå babyen din – hver dag.
            </p>
            <div style={{ position: 'relative', maxWidth: 400 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                <circle cx="11" cy="11" r="7" stroke={TEKST_LYS} strokeWidth="1.5" />
                <path d="M20 20L16.5 16.5" stroke={TEKST_LYS} strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              <input
                type="search"
                value={søk}
                onChange={(e) => setSøk(e.target.value)}
                placeholder="Søk etter artikler..."
                style={{ width: '100%', padding: '14px 16px 14px 44px', fontSize: '15px', border: `1px solid ${KREM}`, borderRadius: 14, backgroundColor: '#FDFAF6', color: TEKST, outline: 'none', boxSizing: 'border-box' }}
              />
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <div style={{ width: '100%', maxWidth: 420, aspectRatio: '4/5', borderRadius: 24, backgroundColor: KREM, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
              <img src="/baby-ansikt.png" alt="Baby" style={{ width: '70%', height: 'auto', objectFit: 'contain', mixBlendMode: 'multiply' }} />
            </div>
          </div>
        </div>
      </section>

      {/* Kategorier */}
      <section style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px 40px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          {KATEGORIER.map((kat) => {
            const aktiv = aktivKategori === kat;
            return (
              <button
                key={kat}
                onClick={() => setAktivKategori(kat)}
                style={{
                  padding: '10px 18px',
                  borderRadius: 50,
                  border: aktiv ? 'none' : `1.5px solid ${GRØNN}`,
                  backgroundColor: aktiv ? GRØNN : 'transparent',
                  color: aktiv ? '#FDFAF6' : GRØNN,
                  fontSize: '14px',
                  fontWeight: aktiv ? 600 : 500,
                  cursor: 'pointer',
                  fontFamily: 'var(--font-inter), sans-serif',
                }}
              >
                {kat}
              </button>
            );
          })}
        </div>
      </section>

      {/* Utvalgt artikkel */}
      {utvalgt && (
        <section style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px 56px' }}>
          <Link href={`/blogg/${utvalgt.slug}`} style={{ textDecoration: 'none', color: 'inherit' }}>
            <div className="blogg-featured-grid">
              <div style={{ borderRadius: 20, overflow: 'hidden', backgroundColor: KREM, minHeight: 320 }}>
                <img src={utvalgt.bilde} alt={utvalgt.tittel} style={{ width: '100%', height: '100%', objectFit: 'cover', minHeight: 320, display: 'block' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '8px 0' }}>
                <span style={{ display: 'inline-block', alignSelf: 'flex-start', padding: '6px 12px', borderRadius: 8, backgroundColor: '#D6E5DF', color: GRØNN, fontSize: '12px', fontWeight: 600, marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  {utvalgt.kategori}
                </span>
                <h2 style={{ fontFamily: 'var(--font-plus-jakarta), sans-serif', fontSize: '1.75rem', fontWeight: 700, lineHeight: 1.3, margin: '0 0 12px', color: TEKST }}>
                  {utvalgt.tittel}
                </h2>
                <p style={{ fontSize: '15px', lineHeight: 1.7, color: TEKST_LYS, margin: '0 0 20px' }}>
                  {utvalgt.ingress}
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: '13px', color: TEKST_LYS }}>
                  <span>{utvalgt.forfatter}</span>
                  <span>·</span>
                  <span>{utvalgt.lesetid} lesetid</span>
                </div>
              </div>
              <div style={{ backgroundColor: '#FDFAF6', border: `1px solid ${KREM}`, borderRadius: 20, padding: 28, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <div style={{ fontSize: '28px', marginBottom: 12 }}>🌿</div>
                <div style={{ fontFamily: 'var(--font-plus-jakarta), sans-serif', fontSize: '1.125rem', fontWeight: 700, marginBottom: 10, color: TEKST }}>
                  Kunnskap du kan stole på
                </div>
                <p style={{ fontSize: '14px', lineHeight: 1.7, color: TEKST_LYS, margin: 0 }}>
                  Alt innhold er skrevet med omsorg for nye foreldre, basert på forskning og erfaring fra hverdagen.
                </p>
              </div>
            </div>
          </Link>
        </section>
      )}

      {/* Siste artikler */}
      <section style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px 64px' }}>
        <h2 style={{ fontFamily: 'var(--font-plus-jakarta), sans-serif', fontSize: '1.5rem', fontWeight: 700, margin: '0 0 28px', color: TEKST }}>
          Siste artikler
        </h2>
        {filtrerte.length === 0 && (
          <p style={{ color: TEKST_LYS, fontSize: '15px' }}>Ingen artikler funnet.</p>
        )}
        {filtrerte.length === 1 && (
          <p style={{ color: TEKST_LYS, fontSize: '15px', marginBottom: 24 }}>Flere artikler kommer snart.</p>
        )}
        {siste.length > 0 && (
          <div className="blogg-artikkel-grid">
            {siste.map((a) => (
              <Link key={a.slug} href={`/blogg/${a.slug}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                <article>
                  <div style={{ borderRadius: 16, overflow: 'hidden', backgroundColor: KREM, aspectRatio: '4/3', marginBottom: 14 }}>
                    <img src={a.bilde} alt={a.tittel} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                  </div>
                  <span style={{ display: 'inline-block', padding: '4px 10px', borderRadius: 6, backgroundColor: '#D6E5DF', color: GRØNN, fontSize: '11px', fontWeight: 600, marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    {a.kategori}
                  </span>
                  <h3 style={{ fontFamily: 'var(--font-plus-jakarta), sans-serif', fontSize: '1rem', fontWeight: 700, lineHeight: 1.4, margin: '0 0 8px', color: TEKST }}>
                    {a.tittel}
                  </h3>
                  <p style={{ fontSize: '13px', lineHeight: 1.6, color: TEKST_LYS, margin: '0 0 10px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {a.ingress}
                  </p>
                  <span style={{ fontSize: '12px', color: TEKST_LYS }}>{a.lesetid} lesetid</span>
                </article>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Nyhetsbrev */}
      <section style={{ backgroundColor: '#E8F0EB', borderTop: `1px solid ${KREM}` }}>
        <div style={{ maxWidth: 720, margin: '0 auto', padding: '56px 24px', textAlign: 'center' }}>
          <h2 style={{ fontFamily: 'var(--font-plus-jakarta), sans-serif', fontSize: '1.5rem', fontWeight: 700, margin: '0 0 10px', color: TEKST }}>
            Få tips rett i innboksen
          </h2>
          <p style={{ fontSize: '15px', color: TEKST_LYS, margin: '0 0 28px', lineHeight: 1.6 }}>
            Meld deg på nyhetsbrevet vårt for ukentlige artikler og råd til nye foreldre.
          </p>
          {påmeldt ? (
            <p style={{ color: GRØNN, fontWeight: 600, fontSize: '15px' }}>Takk for påmeldingen! 🤍</p>
          ) : (
            <form
              onSubmit={(e) => { e.preventDefault(); if (epost.trim()) setPåmeldt(true); }}
              style={{ display: 'flex', gap: 12, maxWidth: 480, margin: '0 auto', flexWrap: 'wrap', justifyContent: 'center' }}
            >
              <input
                type="email"
                value={epost}
                onChange={(e) => setEpost(e.target.value)}
                placeholder="Din e-postadresse"
                required
                style={{ flex: 1, minWidth: 220, padding: '14px 16px', fontSize: '15px', border: `1px solid ${KREM}`, borderRadius: 12, backgroundColor: '#FDFAF6', color: TEKST, outline: 'none' }}
              />
              <button
                type="submit"
                style={{ padding: '14px 28px', backgroundColor: GRØNN, color: '#FDFAF6', border: 'none', borderRadius: 12, fontSize: '15px', fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-inter), sans-serif', whiteSpace: 'nowrap' }}
              >
                Meld meg på
              </button>
            </form>
          )}
        </div>
      </section>
    </div>
  );
}
