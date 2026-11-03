import type { SupabaseClient } from '@supabase/supabase-js';
import { parseTestEmailAllowlist } from './send';

export const ÅRSAK_NAVN: Record<string, string> = {
  unused: 'Brukte den ikke nok',
  too_expensive: 'For dyrt',
  missing_features: 'Savnet funksjoner',
  technical: 'Tekniske problemer',
  other: 'Annet',
  customer_service: 'Kundeservice',
  low_quality: 'Lav kvalitet',
  switched_service: 'Byttet tjeneste',
  too_complex: 'For komplisert',
};

export type OppsigelseUke = {
  stripe: number;
  appStore: number;
  andre: number;
  årsaker: { kode: string; navn: string; antall: number }[];
  kommentarer: string[];
  bliLikevel: number;
  winback: number;
  appleInnløst: number;
  kanselleringsmailer: number;
  winbackMailer: number;
};

export function erTestHendelse(raw: unknown): boolean {
  if (!raw || typeof raw !== 'object') return false;
  const root = raw as Record<string, unknown>;
  if (root.livemode === false) return true;
  const event = root.event && typeof root.event === 'object' ? (root.event as Record<string, unknown>) : root;
  const environment = String(event.environment || root.environment || '');
  return environment.toUpperCase() === 'SANDBOX';
}

export function årsakNavn(kode: string | null | undefined): string {
  const key = (kode || 'other').trim().toLowerCase();
  return ÅRSAK_NAVN[key] || ÅRSAK_NAVN.other;
}

export function tomOppsigelseUke(data: OppsigelseUke): boolean {
  return (
    data.stripe +
      data.appStore +
      data.andre +
      data.årsaker.reduce((sum, a) => sum + a.antall, 0) +
      data.kommentarer.length +
      data.bliLikevel +
      data.winback +
      data.appleInnløst +
      data.kanselleringsmailer +
      data.winbackMailer ===
    0
  );
}

export function oppsigelseRapportHtml(data: OppsigelseUke): string {
  if (tomOppsigelseUke(data)) {
    return `<p style="line-height:1.8;">Ingen oppsigelser denne uken 🤍</p>`;
  }

  const totalt = data.stripe + data.appStore + data.andre;
  const årsakLinjer = data.årsaker
    .map((a) => `<li>${a.navn}: <strong>${a.antall}</strong></li>`)
    .join('');
  const kommentarLinjer = data.kommentarer.length
    ? data.kommentarer.map((k) => `<li>${escapeHtml(k)}</li>`).join('')
    : '<li>Ingen kommentarer</li>';

  const andreLinje =
    data.andre > 0 ? `<li>Andre butikker: <strong>${data.andre}</strong></li>` : '';

  const appleLinje =
    data.appleInnløst > 0
      ? `<li>App Store-innløsning (TILBAKE30): <strong>${data.appleInnløst}</strong></li>`
      : '';

  return `
        <ul style="line-height: 1.8;">
          <li>Oppsigelser totalt: <strong>${totalt}</strong></li>
          <li>Stripe: <strong>${data.stripe}</strong></li>
          <li>App Store: <strong>${data.appStore}</strong></li>
          ${andreLinje}
        </ul>
        <p style="margin: 16px 0 8px; font-weight: 600;">Årsaker</p>
        <ul style="line-height: 1.8;">
          ${årsakLinjer || '<li>Ingen årsaker registrert</li>'}
        </ul>
        <p style="margin: 16px 0 8px; font-weight: 600;">Kommentarer</p>
        <ul style="line-height: 1.8;">
          ${kommentarLinjer}
        </ul>
        <p style="margin: 16px 0 8px; font-weight: 600;">Tilbakevinning</p>
        <ul style="line-height: 1.8;">
          <li>Jeg blir likevel: <strong>${data.bliLikevel}</strong></li>
          <li>Winback: <strong>${data.winback}</strong></li>
          ${appleLinje}
          <li>Kanselleringsmailer sendt: <strong>${data.kanselleringsmailer}</strong></li>
          <li>Winback-mailer sendt: <strong>${data.winbackMailer}</strong></li>
        </ul>
  `;
}

export async function hentOppsigelseUke(
  admin: SupabaseClient,
  opts: { since: Date; allowlistRaw: string | null | undefined; brukere: { id: string; email?: string | null }[] },
): Promise<OppsigelseUke> {
  const allowlist = parseTestEmailAllowlist(opts.allowlistRaw);
  const testBrukere = new Set(
    opts.brukere
      .filter((u) => u.email && allowlist.has(u.email.trim().toLowerCase()))
      .map((u) => u.id),
  );
  const since = opts.since.toISOString();

  const { data: events } = await admin
    .from('subscription_events')
    .select('user_id, store, raw, event_at')
    .eq('type', 'CANCELLATION')
    .gte('event_at', since);

  let stripe = 0;
  let appStore = 0;
  let andre = 0;
  for (const row of events ?? []) {
    if (row.user_id && testBrukere.has(row.user_id)) continue;
    if (erTestHendelse(row.raw)) continue;
    const store = String(row.store || '').toUpperCase();
    if (store === 'STRIPE') stripe += 1;
    else if (store === 'APP_STORE') appStore += 1;
    else andre += 1;
  }

  const { data: feedback } = await admin
    .from('cancellation_feedback')
    .select('user_id, reason, comment, created_at')
    .gte('created_at', since);

  const årsakTell: Record<string, number> = {};
  const kommentarer: string[] = [];
  for (const row of feedback ?? []) {
    if (row.user_id && testBrukere.has(row.user_id)) continue;
    const kode = String(row.reason || 'other').trim().toLowerCase() || 'other';
    årsakTell[kode] = (årsakTell[kode] || 0) + 1;
    const comment = typeof row.comment === 'string' ? row.comment.trim() : '';
    if (comment) kommentarer.push(comment);
  }

  const årsaker = Object.entries(årsakTell)
    .map(([kode, antall]) => ({ kode, navn: årsakNavn(kode), antall }))
    .sort((a, b) => b.antall - a.antall || a.navn.localeCompare(b.navn, 'no'));

  const { data: offers } = await admin
    .from('retention_offers')
    .select('user_id, offer_type, redeemed_at')
    .gte('redeemed_at', since);

  let bliLikevel = 0;
  let winback = 0;
  let appleInnløst = 0;
  for (const row of offers ?? []) {
    if (row.user_id && testBrukere.has(row.user_id)) continue;
    if (row.offer_type === 'stay') bliLikevel += 1;
    else if (row.offer_type === 'winback') winback += 1;
    else if (row.offer_type === 'apple') appleInnløst += 1;
  }

  const { data: mailer } = await admin
    .from('email_log')
    .select('user_id, email_type, sent_at')
    .gte('sent_at', since)
    .in('email_type', ['cancellation', 'winback']);

  let kanselleringsmailer = 0;
  let winbackMailer = 0;
  for (const row of mailer ?? []) {
    if (row.user_id && testBrukere.has(row.user_id)) continue;
    if (row.email_type === 'cancellation') kanselleringsmailer += 1;
    else if (row.email_type === 'winback') winbackMailer += 1;
  }

  return {
    stripe,
    appStore,
    andre,
    årsaker,
    kommentarer,
    bliLikevel,
    winback,
    appleInnløst,
    kanselleringsmailer,
    winbackMailer,
  };
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
