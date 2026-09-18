import fs from 'fs';
const files = fs.readdirSync('scripts/partials').filter((f) => /^(es|fr|it|nl|pl|fi|ja)-\d/.test(f) || /^(es|fr|it|nl|pl|fi|ja)\.json$/.test(f) || f === 'es-mt.json');
for (const f of files) {
  const j = JSON.parse(fs.readFileSync('scripts/partials/' + f, 'utf8'));
  console.log(f, Object.keys(j).length);
}
