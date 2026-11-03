import type { SupabaseClient } from '@supabase/supabase-js';
import { epostLenke, signerFeedback, signerUnsub } from '../email/hmac';
import { hentEpostSpråk, sendMarkedsforing } from '../email/send';
import { CANCELLATION_REASON_BUTTONS, iosKanselleringMal, iosWinbackMal } from '../email/templates';
import { harRegistrertTilbake30, registrerTilbake30 } from '../retention/tilbake30Brukt';
import { appleTilbake30Lenke } from './appleOffer';
import { erMånedsabonnement } from './plan';
import { rcErAppStore, rcErLive, rcEventHarTilbake30, rcHendelseFraPayload } from './rcEvent';

export function iosÅrsaksknapper(userId: string, språk: 'no' | 'en'): { href: string; label: string }[] {
  return CANCELLATION_REASON_BUTTONS[språk].map((knapp) => ({
    label: knapp.label,
    href: epostLenke('/e-post/tilbakemelding', signerFeedback(userId, knapp.id)),
  }));
}

export async function registrerAppleTilbake30HvisInnløst(
  admin: SupabaseClient,
  opts: { userId: string; payload: unknown },
): Promise<boolean> {
  if (!rcEventHarTilbake30(opts.payload)) return false;
  if (await harRegistrertTilbake30(admin, opts.userId)) return true;
  await registrerTilbake30(admin, { userId: opts.userId, offerType: 'apple' });
  return true;
}

export async function sendIosKanselleringsmail(
  admin: SupabaseClient,
  opts: {
    userId: string;
    email: string;
    livemode: boolean;
    productId?: string | null;
    purchasedAtMs?: number | null;
    expirationAtMs?: number | null;
  },
): Promise<'sent' | 'skipped_consent' | 'skipped_test' | 'already_sent' | 'failed'> {
  const brukt = await harRegistrertTilbake30(admin, opts.userId);
  const månedlig = erMånedsabonnement({
    productId: opts.productId,
    purchasedAtMs: opts.purchasedAtMs,
    expirationAtMs: opts.expirationAtMs,
  });
  const stayHref = !brukt && månedlig ? appleTilbake30Lenke() : null;
  const språk = await hentEpostSpråk(admin, opts.userId);
  return sendMarkedsforing({
    admin,
    userId: opts.userId,
    email: opts.email,
    emailType: 'cancellation',
    livemode: opts.livemode,
    innhold: iosKanselleringMal(språk, {
      stayHref,
      unsubHref: epostLenke('/e-post/avmelding', signerUnsub(opts.userId)),
      årsaksknapper: iosÅrsaksknapper(opts.userId, språk),
    }),
  });
}

export async function sendIosWinbackmail(
  admin: SupabaseClient,
  opts: { userId: string; email: string; livemode: boolean },
): Promise<'sent' | 'skipped_consent' | 'skipped_test' | 'already_sent' | 'failed' | 'skipped_offer'> {
  if (await harRegistrertTilbake30(admin, opts.userId)) return 'skipped_offer';
  const comebackHref = appleTilbake30Lenke();
  if (!comebackHref) return 'failed';
  const språk = await hentEpostSpråk(admin, opts.userId);
  return sendMarkedsforing({
    admin,
    userId: opts.userId,
    email: opts.email,
    emailType: 'winback',
    livemode: opts.livemode,
    innhold: iosWinbackMal(språk, {
      comebackHref,
      unsubHref: epostLenke('/e-post/avmelding', signerUnsub(opts.userId)),
    }),
  });
}

export async function behandleAppStoreHendelse(
  admin: SupabaseClient,
  opts: { payload: unknown; userId: string | null },
): Promise<{ ok: true; action: string }> {
  const event = rcHendelseFraPayload(opts.payload);
  if (!event || !rcErAppStore(event) || !opts.userId) {
    return { ok: true, action: 'ignored' };
  }

  await registrerAppleTilbake30HvisInnløst(admin, { userId: opts.userId, payload: opts.payload });

  const type = typeof event.type === 'string' ? event.type : '';
  if (type !== 'CANCELLATION') {
    return { ok: true, action: 'recorded' };
  }

  const { data: userData } = await admin.auth.admin.getUserById(opts.userId);
  const email = userData.user?.email;
  if (!email) return { ok: true, action: 'no_email' };

  const result = await sendIosKanselleringsmail(admin, {
    userId: opts.userId,
    email,
    livemode: rcErLive(event),
    productId: typeof event.product_id === 'string' ? event.product_id : null,
    purchasedAtMs: typeof event.purchased_at_ms === 'number' ? event.purchased_at_ms : null,
    expirationAtMs: typeof event.expiration_at_ms === 'number' ? event.expiration_at_ms : null,
  });
  return { ok: true, action: result };
}

export async function kjørIosWinbackCron(
  admin: SupabaseClient,
): Promise<{ sent: number; skipped: number }> {
  const now = Date.now();
  const eightDays = new Date(now - 8 * 24 * 60 * 60 * 1000).toISOString();
  const sevenDays = new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString();

  const { data: candidates, error } = await admin
    .from('subscription_events')
    .select('user_id, event_at, raw, product_id')
    .eq('store', 'APP_STORE')
    .eq('type', 'EXPIRATION')
    .not('user_id', 'is', null)
    .gte('event_at', eightDays)
    .lt('event_at', sevenDays);

  if (error) {
    console.error('ios winback query failed', error.message);
    return { sent: 0, skipped: 0 };
  }

  const seen = new Set<string>();
  let sent = 0;
  let skipped = 0;

  for (const row of candidates ?? []) {
    const userId = row.user_id as string;
    if (seen.has(userId)) continue;
    seen.add(userId);

    const { data: latest } = await admin
      .from('subscription_events')
      .select('event_at, product_id, raw')
      .eq('user_id', userId)
      .eq('store', 'APP_STORE')
      .eq('type', 'EXPIRATION')
      .order('event_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!latest?.event_at || latest.event_at < eightDays || latest.event_at >= sevenDays) {
      skipped += 1;
      continue;
    }

    const event = rcHendelseFraPayload(latest.raw) || {};
    const productId =
      (typeof latest.product_id === 'string' && latest.product_id) ||
      (typeof event.product_id === 'string' ? event.product_id : null);
    const månedlig = erMånedsabonnement({
      productId,
      purchasedAtMs: typeof event.purchased_at_ms === 'number' ? event.purchased_at_ms : null,
      expirationAtMs: typeof event.expiration_at_ms === 'number' ? event.expiration_at_ms : null,
    });
    if (!månedlig) {
      skipped += 1;
      continue;
    }

    const { data: status } = await admin
      .from('subscription_status')
      .select('status, store')
      .eq('user_id', userId)
      .maybeSingle();
    if (status?.status === 'active') {
      skipped += 1;
      continue;
    }

    const { data: already } = await admin
      .from('email_log')
      .select('id')
      .eq('user_id', userId)
      .eq('email_type', 'winback')
      .maybeSingle();
    if (already?.id) {
      skipped += 1;
      continue;
    }

    const { data: userData } = await admin.auth.admin.getUserById(userId);
    const email = userData.user?.email;
    if (!email) {
      skipped += 1;
      continue;
    }

    const result = await sendIosWinbackmail(admin, {
      userId,
      email,
      livemode: rcErLive(event),
    });
    if (result === 'sent') sent += 1;
    else skipped += 1;
  }

  return { sent, skipped };
}
