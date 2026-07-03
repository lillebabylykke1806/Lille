import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Components } from 'react-markdown';

const GRØNN = '#3D6B4F';
const TEKST = '#3D2B1F';
const TEKST_LYS = '#8A7060';
const KREM = '#EDE5D8';

const components: Components = {
  h2: ({ children }) => (
    <h2
      style={{
        fontFamily: 'var(--font-plus-jakarta), sans-serif',
        fontSize: '1.5rem',
        fontWeight: 700,
        color: TEKST,
        margin: '2.5rem 0 1rem',
        lineHeight: 1.3,
      }}
    >
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3
      style={{
        fontFamily: 'var(--font-plus-jakarta), sans-serif',
        fontSize: '1.2rem',
        fontWeight: 700,
        color: TEKST,
        margin: '2rem 0 0.75rem',
        lineHeight: 1.35,
      }}
    >
      {children}
    </h3>
  ),
  p: ({ children }) => (
    <p style={{ fontSize: '16px', lineHeight: 1.75, color: TEKST, margin: '0 0 1.25rem' }}>
      {children}
    </p>
  ),
  ul: ({ children }) => (
    <ul style={{ paddingLeft: '1.35rem', margin: '0 0 1.25rem', listStyle: 'disc', color: TEKST }}>
      {children}
    </ul>
  ),
  ol: ({ children }) => (
    <ol style={{ paddingLeft: '1.35rem', margin: '0 0 1.25rem', color: TEKST }}>
      {children}
    </ol>
  ),
  li: ({ children }) => (
    <li style={{ fontSize: '16px', lineHeight: 1.75, marginBottom: '0.5rem' }}>{children}</li>
  ),
  strong: ({ children }) => (
    <strong style={{ fontWeight: 600, color: TEKST }}>{children}</strong>
  ),
  a: ({ href, children }) => (
    <a
      href={href}
      style={{ color: GRØNN, textDecoration: 'underline', textUnderlineOffset: '3px' }}
      target="_blank"
      rel="noopener noreferrer"
    >
      {children}
    </a>
  ),
  blockquote: ({ children }) => (
    <blockquote
      style={{
        borderLeft: `4px solid ${GRØNN}`,
        margin: '1.5rem 0',
        padding: '0.5rem 0 0.5rem 1.25rem',
        color: TEKST_LYS,
        fontStyle: 'italic',
      }}
    >
      {children}
    </blockquote>
  ),
  hr: () => (
    <hr style={{ border: 'none', borderTop: `1px solid ${KREM}`, margin: '2.5rem 0' }} />
  ),
  table: ({ children }) => (
    <div className="artikkel-tabell-wrap">
      <table className="artikkel-tabell">{children}</table>
    </div>
  ),
  thead: ({ children }) => <thead>{children}</thead>,
  tbody: ({ children }) => <tbody>{children}</tbody>,
  tr: ({ children }) => <tr>{children}</tr>,
  th: ({ children }) => <th>{children}</th>,
  td: ({ children }) => <td>{children}</td>,
  img: ({ src, alt }) => {
    if (!src) return null;
    return (
      <figure style={{ margin: '2rem 0' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={alt || ''}
          style={{ width: '100%', height: 'auto', display: 'block', borderRadius: 16 }}
        />
      </figure>
    );
  },
};

export default function ArtikkelMarkdown({ content }: { content: string }) {
  return (
    <div className="artikkel-markdown">
      <style>{`
        .artikkel-markdown > *:first-child { margin-top: 0; }
        .artikkel-markdown > *:last-child { margin-bottom: 0; }
        .artikkel-tabell-wrap {
          overflow-x: auto;
          margin: 2rem 0;
          border-radius: 12px;
        }
        .artikkel-tabell {
          width: 100%;
          border-collapse: collapse;
          font-size: 15px;
        }
        .artikkel-tabell thead th {
          background-color: ${GRØNN};
          color: #fdfaf6;
          font-weight: 600;
          text-align: left;
          padding: 14px 18px;
        }
        .artikkel-tabell tbody tr:nth-child(odd) { background-color: #fff; }
        .artikkel-tabell tbody tr:nth-child(even) { background-color: #F5F0EA; }
        .artikkel-tabell td {
          padding: 14px 18px;
          color: ${TEKST};
          vertical-align: top;
        }
      `}</style>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {content}
      </ReactMarkdown>
    </div>
  );
}
