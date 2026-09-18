import fs from 'fs';

function parse(file) {
  const src = fs.readFileSync(file, 'utf8');
  const out = {};
  const re = /^  "((?:\\.|[^"\\])*)": ("(?:\\.|[^"\\])*"),?$/gm;
  let m;
  while ((m = re.exec(src))) out[JSON.parse(`"${m[1]}"`)] = JSON.parse(m[2]);
  return out;
}

const es = parse('app/lib/i18n/messages/es.ts');
const keep = {};
for (const [k, v] of Object.entries(es)) {
  if (v && v.trim()) keep[k] = v;
}
fs.writeFileSync('scripts/partials/es-mt.json', JSON.stringify(keep), 'utf8');
console.log('saved', Object.keys(keep).length);
