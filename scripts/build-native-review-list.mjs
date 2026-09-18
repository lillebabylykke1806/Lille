/**
 * Curated keys for native-speaker review before launch.
 * Focus: health advice tone, AI insight copy, paywall persuasion, legal/consent.
 * Excludes plain UI labels (Save/Cancel) even if under related namespaces.
 */
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
const keys = Object.keys(no);

/** Skip short button/label keys */
function isLikelyAdvice(k, v) {
  if (v.length < 40 && !/lege|legevakt|akut|feber|allerg|vaksin|risiko|advar|ikke erstatte|medical|doctor/i.test(v)) {
    // short UI — still include if key signals advice
    if (!/(Tips|Tekst|Info|Beskriv|Advar|Råd|Advice|Disclaimer|undertekst|ingress)/i.test(k)) return false;
  }
  return true;
}

const groups = {
  'Helseråd / medisinsk tone': keys.filter((k) => {
    const v = no[k];
    const ns =
      k.startsWith('medisin.') ||
      k.startsWith('temp.') ||
      k.startsWith('kolikk.') ||
      k.startsWith('signaler.') ||
      /vaksin|feber|allergi|bivirk|lege/i.test(k);
    return ns && isLikelyAdvice(k, v);
  }),
  'AI-innsikter': keys.filter(
    (k) =>
      k.startsWith('innsikt.') ||
      /aiInnsikt|aiTom|aiMønster|analyserer/i.test(k) ||
      (k.includes('.ai') && no[k].length > 25),
  ),
  Paywall: keys.filter(
    (k) =>
      k.startsWith('paywall.') ||
      k.startsWith('trialEnded.') ||
      k.startsWith('pro.') ||
      k.startsWith('rc.') ||
      k.startsWith('kode.'),
  ),
  'Juridisk / samtykke': keys.filter(
    (k) =>
      k.startsWith('consent.') ||
      /vilkår|vilkaar|personvern|samtykke|markedsfør/i.test(k) ||
      /privacy|terms|gdpr/i.test(k),
  ),
};

const lines = [
  '# Native-speaker review list (Lille i18n)',
  '',
  'Review these keys in **es, fr, it, nl, pl, fi, ja** before marketing launch.',
  'Source of truth for meaning: Norwegian (`no`). English (`en`) is a reference.',
  '',
  'Product names **Lille** / **Lille Pro** must stay unchanged.',
  '',
];

for (const [label, list] of Object.entries(groups)) {
  const sorted = [...new Set(list)].sort();
  lines.push(`## ${label} (${sorted.length})`);
  lines.push('');
  for (const k of sorted) {
    lines.push(`- \`${k}\``);
    lines.push(`  - no: ${JSON.stringify(no[k])}`);
  }
  lines.push('');
}

fs.writeFileSync('app/lib/i18n/NATIVE_REVIEW.md', lines.join('\n'), 'utf8');
console.log(
  Object.fromEntries(
    Object.entries(groups).map(([k, v]) => [k, new Set(v).size]),
  ),
);
