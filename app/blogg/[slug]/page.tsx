import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import ArtikkelInnhold from '../ArtikkelInnhold';

export default async function ArtikkelSide({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const filPath = path.join(process.cwd(), 'app/blogg/_artikler', `${slug}.md`);

  if (!fs.existsSync(filPath)) {
    return (
      <main style={{ maxWidth: 780, margin: '0 auto', padding: '4rem 1.5rem', fontFamily: 'var(--font-inter), sans-serif' }}>
        <p>Artikkelen ble ikke funnet.</p>
      </main>
    );
  }

  const innhold = fs.readFileSync(filPath, 'utf8');
  const { data, content } = matter(innhold);

  return (
    <ArtikkelInnhold
      artikkel={{
        tittel: data.tittel || 'Uten tittel',
        dato: data.dato || '',
        ingress: data.ingress || '',
        kategori: data.kategori || 'Søvn',
        bilde: data.bilde || '/baby-ansikt.png',
        lesetid: data.lesetid || '5 min',
        forfatter: data.forfatter || 'Lille-teamet',
        cta_bilde: data.cta_bilde,
        content,
      }}
    />
  );
}
