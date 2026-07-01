import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import BloggInnhold, { type Artikkel } from './BloggInnhold'

export const metadata = {
  title: 'Blogg – Lille',
  description: 'Artikler om babysøvn, signaler og utvikling for nye foreldre.',
}

function getArtikler(): Artikkel[] {
  const dir = path.join(process.cwd(), 'app/blogg/_artikler')
  if (!fs.existsSync(dir)) return []
  const filer = fs.readdirSync(dir).filter(f => f.endsWith('.mdx') || f.endsWith('.md'))
  return filer.map(fil => {
    const innhold = fs.readFileSync(path.join(dir, fil), 'utf8')
    const { data } = matter(innhold)
    return {
      slug: fil.replace(/\.mdx?$/, ''),
      tittel: data.tittel || 'Uten tittel',
      dato: data.dato ? new Date(data.dato).toLocaleDateString('nb-NO') : '',
      datoRaw: data.dato || '',
      ingress: data.ingress || '',
      kategori: data.kategori || 'Søvn',
      bilde: data.bilde || '/baby-ansikt.png',
      lesetid: data.lesetid || '5 min',
      forfatter: data.forfatter || 'Lille-teamet',
    }
  }).sort((a, b) => new Date(b.datoRaw).getTime() - new Date(a.datoRaw).getTime())
    .map(({ datoRaw: _, ...artikkel }) => artikkel)
}

export default function BloggSide() {
  const artikler = getArtikler()
  return <BloggInnhold artikler={artikler} />
}
