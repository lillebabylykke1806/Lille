import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { supabaseAdmin } from '../../lib/supabaseAdmin';
import { hentEpostSpråk, sendMarkedsforing } from '../../lib/email/send';
import { epostLenke, signerUnsub, signerWinback } from '../../lib/email/hmac';
import { winbackMal } from '../../lib/email/templates';
import { harBruktTilbake30 } from '../../lib/stripe/tilbake30';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization');
  const isVercelCron =
    req.headers.get('x-vercel-cron') === '1' || req.headers.get('user-agent')?.includes('vercel-cron');
  if (!isVercelCron && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const stripeKey = process.env.STRIPE_SECRET_KEY?.trim();
  if (!stripeKey) return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 });
  const stripe = new Stripe(stripeKey);
  const admin = supabaseAdmin();

  const now = Date.now();
  const eightDays = new Date(now - 8 * 24 * 60 * 60 * 1000).toISOString();
  const sevenDays = new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString();

  const { data: candidates, error } = await admin
    .from('subscription_events')
    .select('user_id, event_at, raw')
    .eq('store', 'STRIPE')
    .eq('type', 'EXPIRATION')
    .not('user_id', 'is', null)
    .gte('event_at', eightDays)
    .lt('event_at', sevenDays);

  if (error) {
    console.error('winback query failed', error.message);
    return NextResponse.json({ error: 'query_failed' }, { status: 500 });
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
      .select('event_at')
      .eq('user_id', userId)
      .eq('store', 'STRIPE')
      .eq('type', 'EXPIRATION')
      .order('event_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!latest?.event_at) {
      skipped += 1;
      continue;
    }
    if (latest.event_at < eightDays || latest.event_at >= sevenDays) {
      skipped += 1;
      continue;
    }

    const { data: status } = await admin
      .from('subscription_status')
      .select('status')
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

    const brukt = await harBruktTilbake30({ admin, stripe, userId, email });
    if (brukt) {
      skipped += 1;
      continue;
    }

    const livemode = (row.raw as { livemode?: boolean } | null)?.livemode === true;
    const språk = await hentEpostSpråk(admin, userId);
    const result = await sendMarkedsforing({
      admin,
      userId,
      email,
      emailType: 'winback',
      livemode,
      innhold: winbackMal(språk, {
        comebackHref: epostLenke('/e-post/kom-tilbake', signerWinback(userId, språk)),
        unsubHref: epostLenke('/e-post/avmelding', signerUnsub(userId)),
      }),
    });
    if (result === 'sent') sent += 1;
    else skipped += 1;
  }

  return NextResponse.json({ ok: true, sent, skipped });
}
