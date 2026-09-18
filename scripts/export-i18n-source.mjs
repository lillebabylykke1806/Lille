import fs from 'fs';

function parseMessages(file) {
  const src = fs.readFileSync(file, 'utf8');
  const out = {};
  const re = /^  "((?:\\.|[^"\\])*)": ("(?:\\.|[^"\\])*"),?$/gm;
  let m;
  while ((m = re.exec(src))) {
    out[JSON.parse(`"${m[1]}"`)] = JSON.parse(m[2]);
  }
  return out;
}

const no = parseMessages('app/lib/i18n/messages/no.ts');
const en = parseMessages('app/lib/i18n/messages/en.ts');
const keys = Object.keys(no);
console.log('parsed', keys.length);
fs.writeFileSync(
  'scripts/_i18n_source.json',
  JSON.stringify({ keys, no, en }, null, 0),
  'utf8',
);
console.log('wrote scripts/_i18n_source.json', fs.statSync('scripts/_i18n_source.json').size);
