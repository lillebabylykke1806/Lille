/**
 * Assemble scripts/partials/{loc}-*.json into app/lib/i18n/messages/{loc}.ts
 * Also fills any missing keys from en.
 */
import fs from 'fs';
import path from 'path';

const loc = process.argv[2];
if (!loc) {
  console.error('Usage: node scripts/assemble-locale.mjs <loc>');
  process.exit(1);
}

const source = JSON.parse(fs.readFileSync('scripts/_i18n_source.json', 'utf8'));
const { keys, en, no } = source;
const dir = 'scripts/partials';
fs.mkdirSync(dir, { recursive: true });

const merged = {};
const files = fs
  .readdirSync(dir)
  .filter((f) => f.startsWith(`${loc}-`) && f.endsWith('.json'))
  .sort();

for (const f of files) {
  Object.assign(merged, JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')));
}

// Also accept full file
const full = path.join(dir, `${loc}.json`);
if (fs.existsSync(full)) Object.assign(merged, JSON.parse(fs.readFileSync(full, 'utf8')));

let missing = 0;
const out = {};
for (const k of keys) {
  if (merged[k]) out[k] = merged[k];
  else {
    out[k] = en[k] ?? no[k] ?? '';
    missing++;
  }
}

const headers = {
  es: '/** Spanish translations. */',
  fr: '/** French translations. */',
  it: '/** Italian translations. */',
  nl: '/** Dutch translations. */',
  pl: '/** Polish translations. */',
  fi: '/** Finnish translations. */',
  ja: '/** Japanese translations. */',
};

const lines = [headers[loc] || `/** ${loc} translations. */`, 'const messages: Record<string, string> = {'];
for (const k of keys) {
  lines.push(`  ${JSON.stringify(k)}: ${JSON.stringify(out[k])},`);
}
lines.push('};');
lines.push('export default messages;');
const dest = `app/lib/i18n/messages/${loc}.ts`;
fs.writeFileSync(dest, lines.join('\n') + '\n', 'utf8');
console.log({ loc, files: files.length, merged: Object.keys(merged).length, missing, bytes: fs.statSync(dest).size });
