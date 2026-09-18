const fs = require('fs');
const path = require('path');

const src = require('./_i18n_source.json');
const fi = {};
const dupes = [];
for (const n of [1, 2, 3, 4, 5]) {
  const part = JSON.parse(fs.readFileSync(path.join(__dirname, `_fi${n}.json`), 'utf8'));
  for (const [k, v] of Object.entries(part)) {
    if (k in fi) dupes.push(k);
    fi[k] = v;
  }
}

const ph = (s) => (s.match(/\{[^}]*\}/g) || []).sort();
const missing = src.keys.filter((k) => !(k in fi));
const extra = Object.keys(fi).filter((k) => !src.keys.includes(k));
const phMismatch = [];
const untranslated = [];
for (const k of src.keys) {
  if (!(k in fi)) continue;
  const a = ph(src.no[k]).join('|');
  const b = ph(fi[k]).join('|');
  if (a !== b) phMismatch.push({ key: k, no: a, fi: b });
  if (fi[k] === src.no[k] && !/^(Lille|Lille Pro|min|t|Infacol|0\.5 ml|White noise|Womb sounds|Ok)$/.test(fi[k])) {
    untranslated.push(k);
  }
}

console.log('parts total keys :', Object.keys(fi).length);
console.log('source keys      :', src.keys.length);
console.log('duplicates       :', dupes.length, dupes.slice(0, 20));
console.log('missing          :', missing.length, missing.slice(0, 40));
console.log('extra            :', extra.length, extra.slice(0, 40));
console.log('placeholder diffs:', phMismatch.length);
phMismatch.slice(0, 40).forEach((m) => console.log('   ', m.key, '| no:', m.no, '| fi:', m.fi));
console.log('identical to NO  :', untranslated.length, untranslated.slice(0, 40));

if (missing.length === 0 && extra.length === 0 && phMismatch.length === 0) {
  const lines = src.keys.map((k) => `  ${JSON.stringify(k)}: ${JSON.stringify(fi[k])},`);
  const out = `/** Finnish translations. */\nconst messages: Record<string, string> = {\n${lines.join('\n')}\n};\nexport default messages;\n`;
  const target = path.join(__dirname, '..', 'app', 'lib', 'i18n', 'messages', 'fi.ts');
  fs.writeFileSync(target, out, 'utf8');
  console.log('WROTE', target, 'entries:', lines.length);
} else {
  console.log('NOT WRITTEN — fix issues above');
}
