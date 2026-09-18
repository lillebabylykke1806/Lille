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

function placeholders(s) {
  return [...s.matchAll(/\{[^}]+\}/g)].map((x) => x[0]).sort().join(' ');
}

const no = parseMessages('app/lib/i18n/messages/no.ts');
const locales = process.argv.slice(2);
if (!locales.length) {
  console.error('Usage: node scripts/validate-i18n-locale.mjs es fr ...');
  process.exit(1);
}

let failed = false;
for (const loc of locales) {
  const file = `app/lib/i18n/messages/${loc}.ts`;
  if (!fs.existsSync(file)) {
    console.log(loc, 'MISSING FILE');
    failed = true;
    continue;
  }
  const msg = parseMessages(file);
  const noKeys = Object.keys(no);
  const msgKeys = Object.keys(msg);
  const missing = noKeys.filter((k) => !(k in msg));
  const extra = msgKeys.filter((k) => !(k in no));
  const phBad = [];
  const empty = [];
  const sameAsEn = [];
  for (const k of noKeys) {
    if (!(k in msg)) continue;
    if (!msg[k]) empty.push(k);
    if (placeholders(no[k]) !== placeholders(msg[k])) phBad.push(k);
  }
  console.log(
    JSON.stringify({
      loc,
      count: msgKeys.length,
      missing: missing.length,
      extra: extra.length,
      empty: empty.length,
      placeholderMismatch: phBad.length,
      sampleMissing: missing.slice(0, 5),
      samplePh: phBad.slice(0, 5),
    }),
  );
  if (missing.length || phBad.length || empty.length || msgKeys.length < noKeys.length) failed = true;
}
process.exit(failed ? 1 : 0);
