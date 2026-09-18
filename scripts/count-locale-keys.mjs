import fs from 'fs';
function parse(file) {
  const src = fs.readFileSync(file, 'utf8');
  const out = {};
  const re = /^  "((?:\\.|[^"\\])*)": ("(?:\\.|[^"\\])*"),?$/gm;
  let m;
  while ((m = re.exec(src))) out[JSON.parse(`"${m[1]}"`)] = JSON.parse(m[2]);
  return out;
}
for (const loc of ['es', 'fr', 'it', 'nl', 'pl', 'fi', 'ja']) {
  const f = `app/lib/i18n/messages/${loc}.ts`;
  const m = parse(f);
  const keys = Object.keys(m);
  const nonempty = keys.filter((k) => m[k]);
  console.log(loc, 'keys', keys.length, 'nonempty', nonempty.length, 'bytes', fs.statSync(f).size);
}
