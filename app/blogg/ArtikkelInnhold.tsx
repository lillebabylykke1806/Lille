import Link from 'next/link';
import ArtikkelMarkdown from './ArtikkelMarkdown';

const GRØNN = '#3D6B4F';
const BAKGRUNN = '#F5F0EA';
const KREM = '#EDE5D8';
const TEKST = '#3D2B1F';
const TEKST_LYS = '#8A7060';
const APP_STORE_URL = 'https://apps.apple.com/us/app/lille/id6780271912';
const MAX_WIDTH = 780;

export type ArtikkelData = {
  tittel: string;
  dato?: string;
  ingress: string;
  kategori: string;
  bilde: string;
  lesetid: string;
  forfatter: string;
  cta_bilde?: string;
  content: string;
};

export default function ArtikkelInnhold({ artikkel }: { artikkel: ArtikkelData }) {
  const datoFormatert = artikkel.dato
    ? new Date(artikkel.dato).toLocaleDateString('nb-NO', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : '';

  return (
    <div
      className="artikkel-side"
      style={{
        backgroundColor: BAKGRUNN,
        minHeight: '100vh',
        fontFamily: 'var(--font-inter), sans-serif',
        color: TEKST,
      }}
    >
      <div style={{ maxWidth: MAX_WIDTH, margin: '0 auto', padding: '32px 24px 0' }}>
        <Link
          href="/blogg"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            fontSize: '14px',
            color: TEKST_LYS,
            textDecoration: 'none',
            marginBottom: 24,
          }}
        >
          ← Tilbake til bloggen
        </Link>

        <div
          style={{
            borderRadius: 20,
            overflow: 'hidden',
            aspectRatio: '16/9',
            marginBottom: 28,
            backgroundColor: KREM,
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={artikkel.bilde}
            alt={artikkel.tittel}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
        </div>

        <div style={{ marginBottom: 32 }}>
          <span
            style={{
              display: 'inline-block',
              padding: '4px 10px',
              borderRadius: 6,
              backgroundColor: '#D6E5DF',
              color: GRØNN,
              fontSize: '11px',
              fontWeight: 600,
              marginBottom: 16,
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
            }}
          >
            {artikkel.kategori}
          </span>
          <h1
            style={{
              fontFamily: 'var(--font-plus-jakarta), sans-serif',
              fontSize: 'clamp(1.75rem, 4vw, 2.25rem)',
              fontWeight: 700,
              lineHeight: 1.25,
              margin: '0 0 16px',
              color: TEKST,
              letterSpacing: '-0.02em',
            }}
          >
            {artikkel.tittel}
          </h1>
          <p style={{ fontSize: '17px', lineHeight: 1.65, color: TEKST_LYS, margin: '0 0 20px' }}>
            {artikkel.ingress}
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 20px', fontSize: '13px', color: TEKST_LYS }}>
            {datoFormatert && <span>{datoFormatert}</span>}
            {artikkel.lesetid && <span>{artikkel.lesetid}</span>}
            {artikkel.forfatter && <span>Av {artikkel.forfatter}</span>}
          </div>
        </div>
      </div>

      <article style={{ maxWidth: MAX_WIDTH, margin: '0 auto', padding: '0 24px 64px' }}>
        <ArtikkelMarkdown content={artikkel.content} />
      </article>

      <section
        style={{
          backgroundColor: '#E8F0EB',
          borderTop: `1px solid ${KREM}`,
        }}
      >
        <div className="artikkel-cta" style={{ maxWidth: MAX_WIDTH, margin: '0 auto', padding: '56px 24px' }}>
          <style>{`
            .artikkel-cta {
              display: flex;
              flex-direction: column;
              align-items: center;
              gap: 32px;
              text-align: center;
            }
            @media (min-width: 640px) {
              .artikkel-cta {
                flex-direction: row;
                text-align: left;
              }
            }
          `}</style>
          {artikkel.cta_bilde && (
            <div
              style={{
                flexShrink: 0,
                width: 140,
                borderRadius: 16,
                overflow: 'hidden',
                boxShadow: '0 8px 24px rgba(61, 107, 79, 0.12)',
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={artikkel.cta_bilde}
                alt="Lille app"
                style={{ width: '100%', height: 'auto', display: 'block' }}
              />
            </div>
          )}
          <div style={{ flex: 1 }}>
            <p
              style={{
                fontFamily: 'var(--font-plus-jakarta), sans-serif',
                fontSize: '1.25rem',
                fontWeight: 700,
                lineHeight: 1.45,
                color: TEKST,
                margin: '0 0 20px',
              }}
            >
              Start understanding your baby&apos;s unique rhythm with Lille.
            </p>
            <a
              href={APP_STORE_URL}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-block',
                padding: '14px 28px',
                backgroundColor: GRØNN,
                color: '#FDFAF6',
                borderRadius: 12,
                fontSize: '15px',
                fontWeight: 600,
                textDecoration: 'none',
                fontFamily: 'var(--font-inter), sans-serif',
              }}
            >
              Last ned appen
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
