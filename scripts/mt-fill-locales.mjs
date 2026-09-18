/**
 * Machine-translate i18n stubs with placeholder/brand protection.
 * MT source: English (better quality); meaning checked against Norwegian keys.
 *
 * Usage: node scripts/mt-fill-locales.mjs [es fr it nl pl fi ja]
 */
import fs from 'fs';
import path from 'path';
import { translate } from '@vitalets/google-translate-api';

function writeMessages(file, header, messages, keys) {
  const lines = [header, 'const messages: Record<string, string> = {'];
  for (const k of keys) {
    lines.push(`  ${JSON.stringify(k)}: ${JSON.stringify(messages[k] ?? '')},`);
  }
  lines.push('};');
  lines.push('export default messages;');
  fs.writeFileSync(file, lines.join('\n') + '\n', 'utf8');
}

function protect(text) {
  const tokens = [];
  let t = text;
  t = t.replace(/Lille Pro/g, () => {
    const i = tokens.length;
    tokens.push('Lille Pro');
    return `⟦${i}⟧`;
  });
  t = t.replace(/Lille/g, () => {
    const i = tokens.length;
    tokens.push('Lille');
    return `⟦${i}⟧`;
  });
  t = t.replace(/\{[^}]+\}/g, (m) => {
    const i = tokens.length;
    tokens.push(m);
    return `⟦${i}⟧`;
  });
  return { t, tokens };
}

function unprotect(text, tokens) {
  let t = text;
  t = t.replace(/⟦\s*(\d+)\s*⟧/g, (_, n) => tokens[Number(n)] ?? '');
  t = t.replace(/\[\[\s*(\d+)\s*\]\]/g, (_, n) => tokens[Number(n)] ?? '');
  // Restore brands if MT dropped markers but left nearby text broken
  return t;
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function translateText(text, to, attempt = 0) {
  if (!text || !/[A-Za-zÀ-ÿ\u00C0-\u024F\u3040-\u30ff\u3400-\u9fff]/.test(text)) {
    // emoji/punctuation only — keep
    return text;
  }
  try {
    const res = await translate(text, { from: 'en', to });
    return res.text;
  } catch (e) {
    if (attempt < 4) {
      await sleep(1500 * (attempt + 1));
      return translateText(text, to, attempt + 1);
    }
    throw e;
  }
}

const source = JSON.parse(fs.readFileSync('scripts/_i18n_source.json', 'utf8'));
const { keys, no, en } = source;

const localeArgs = process.argv.slice(2);
const targets = localeArgs.length
  ? localeArgs
  : ['es', 'fr', 'it', 'nl', 'pl', 'fi', 'ja'];

const headers = {
  es: '/** Spanish translations. */',
  fr: '/** French translations. */',
  it: '/** Italian translations. */',
  nl: '/** Dutch translations. */',
  pl: '/** Polish translations. */',
  fi: '/** Finnish translations. */',
  ja: '/** Japanese translations. */',
};

const CONCURRENCY = 5;

for (const loc of targets) {
  const outPath = path.resolve(`app/lib/i18n/messages/${loc}.ts`);
  const out = {};
  let translated = 0;
  console.log(`\n=== ${loc} ===`);

  for (let i = 0; i < keys.length; i += CONCURRENCY) {
    const batch = keys.slice(i, i + CONCURRENCY);
    await Promise.all(
      batch.map(async (k) => {
        const src = en[k] ?? no[k] ?? '';
        const { t, tokens } = protect(src);
        try {
          const raw = await translateText(t, loc);
          let val = unprotect(raw, tokens);
          // Ensure placeholders restored if MT altered them
          const srcPh = [...(src.matchAll(/\{[^}]+\}/g))].map((m) => m[0]);
          for (const ph of srcPh) {
            if (!val.includes(ph)) {
              // try to put back from tokens
              if (tokens.includes(ph) && !val.includes(ph)) {
                val = `${val} ${ph}`.trim();
              }
            }
          }
          // Force brands
          if (src.includes('Lille Pro') && !val.includes('Lille Pro')) {
            val = val.replace(/Lille\s*Pro/gi, 'Lille Pro');
            if (!val.includes('Lille Pro')) val = val.replace(/\bLille\b/, 'Lille Pro');
          }
          if (/\bLille\b/.test(src) && !/\bLille\b/.test(val)) {
            // leave if fully lost — post-pass will fix
          }
          out[k] = val;
          translated++;
        } catch (e) {
          console.error('FAIL', loc, k, String(e.message || e).slice(0, 80));
          out[k] = src; // English fallback
        }
      }),
    );

    if (i % 50 === 0 || i + CONCURRENCY >= keys.length) {
      writeMessages(outPath, headers[loc], out, keys);
      console.log(`${loc}: ${Math.min(i + CONCURRENCY, keys.length)}/${keys.length}`);
    }
    await sleep(350);
  }

  writeMessages(outPath, headers[loc], out, keys);
  console.log(`${loc} complete size=${fs.statSync(outPath).size} keys=${Object.keys(out).length}`);
}
