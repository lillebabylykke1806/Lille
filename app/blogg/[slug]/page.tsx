import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'

export default async function ArtikkelSide({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const filPath = path.join(process.cwd(), 'app/blogg/_artikler', `${slug}.md`)

  if (!fs.existsSync(filPath)) {
    return (
      <main style={{ maxWidth: 720, margin: '0 auto', padding: '4rem 1.5rem' }}>
        <p>Artikkelen ble ikke funnet.</p>
      </main>
    )
  }

  const innhold = fs.readFileSync(filPath, 'utf8')
  const { data, content } = matter(innhold)

  return (
    <main style={{ maxWidth: 720, margin: '0 auto', padding: '4rem 1.5rem' }}>
      <p style={{ fontSize: '0.85rem', color: '#999', marginBottom: '0.5rem' }}>
        {data.dato ? new Date(data.dato).toLocaleDateString('nb-NO') : ''}
      </p>
      <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>{data.tittel}</h1>
      <p style={{ color: '#666', fontSize: '1.1rem', marginBottom: '2rem' }}>{data.ingress}</p>
      <div style={{ lineHeight: 1.8, color: '#333', whiteSpace: 'pre-wrap', fontFamily: 'inherit' }}>
        {content}
      </div>
    </main>
  )
}