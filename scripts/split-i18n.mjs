/**
 * Split app/lib/i18n/translations data into messages/{locale}.ts.
 * Current messages are already split; re-run only if regenerating from a
 * monolithic oversettelser export (see git history of translations.ts).
 *
 * Prefer: keep editing messages/{locale}.ts directly.
 * New locales es/fr/it/nl/pl/fi/ja stay empty stubs until translated
 * (getMessage falls back en → no).
 */
console.log('Messages live in app/lib/i18n/messages/*.ts — edit those files directly.');
console.log('Stubs for es/fr/it/nl/pl/fi/ja intentionally empty until Oppgave 5 translations.');
