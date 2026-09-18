/**
 * Flag UI strings that grew a lot vs Norwegian (button overflow risk).
 * Focus: short labels (no/en length < 28 chars).
 */
import fs from 'fs';

function parse(file) {
  const src = fs.readFileSync(file, 'utf8');
  const out = {};
  const re = /^  "((?:\\.|[^"\\])*)": ("(?:\\.|[^"\\])*"),?$/gm;
  let m;
  while ((m = re.exec(src))) out[JSON.parse(`"${m[1]}"`)] = JSON.parse(m[2]);
  return out;
}

const no = parse('app/lib/i18n/messages/no.ts');
const locales = ['de', 'fi', 'ja'];
const report = {};

for (const loc of locales) {
  const msg = parse(`app/lib/i18n/messages/${loc}.ts`);
  const long = [];
  for (const [k, nv] of Object.entries(no)) {
    if (nv.length > 32) continue; // only short UI chrome
    if (/Beskrivelse|Tekst|Info|faq|deling|Placeholder|undertekst/i.test(k)) continue;
    const tv = msg[k] || '';
    if (tv.length > nv.length + 8 || tv.length > 28) {
      long.push({ k, no: nv, [loc]: tv, delta: tv.length - nv.length });
    }
  }
  long.sort((a, b) => b.delta - a.delta);
  report[loc] = long.slice(0, 40);
}

fs.writeFileSync('scripts/layout-length-report.json', JSON.stringify(report, null, 2));
for (const loc of locales) {
  console.log('\n===', loc, 'top growth vs short NO ===');
  for (const row of report[loc].slice(0, 15)) {
    console.log(`${row.delta > 0 ? '+' : ''}${row.delta}  ${row.k}`);
    console.log(`   no: ${row.no}`);
    console.log(`   ${loc}: ${row[loc]}`);
  }
}
