/**
 * Send iOS cancellation + winback test mails to post@lilleapp.no.
 * Run: npx tsx scripts/ios/send-test-mails.ts
 */
import fs from 'fs';
import path from 'path';
import { supabaseAdmin } from '../../app/lib/supabaseAdmin';
import { behandleAppStoreHendelse, registrerAppleTilbake30HvisInnløst, sendIosWinbackmail } from '../../app/lib/ios/retention';
import { appleTilbake30Lenke } from '../../app/lib/ios/appleOffer';

function loadEnv() {
  const text = fs.readFileSync(path.join(process.cwd(), '.env.local'), 'utf8');
  for (const line of text.split(/\r?\n/)) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (!m) continue;
    if (!process.env[m[1]]) process.env[m[1]] = m[2];
  }
}

loadEnv();

if (!process.env.APPLE_APP_ID) process.env.APPLE_APP_ID = '6780271912';
if (!process.env.APPLE_OFFER_CODE) process.env.APPLE_OFFER_CODE = 'TILBAKE30';

const USER_ID = 'ebc7a7cb-3777-4074-b0eb-ddfb027447e5';
const EMAIL = 'post@lilleapp.no';

function payload(opts: {
  type: string;
  productId: string;
  offerCode?: string | null;
  environment?: string;
}): Record<string, unknown> {
  const now = Date.now();
  const monthMs = 30 * 24 * 60 * 60 * 1000;
  const yearMs = 365 * 24 * 60 * 60 * 1000;
  const span = opts.productId.includes('year') ? yearMs : monthMs;
  return {
    api_version: '1.0',
    event: {
      id: `test_ios_${opts.type}_${opts.productId}_${now}`,
      type: opts.type,
      store: 'APP_STORE',
      environment: opts.environment ?? 'SANDBOX',
      app_user_id: USER_ID,
      original_app_user_id: USER_ID,
      product_id: opts.productId,
      period_type: 'NORMAL',
      purchased_at_ms: now - span,
      expiration_at_ms: now,
      event_timestamp_ms: now,
      offer_code: opts.offerCode ?? null,
    },
  };
}

async function main() {
  const apple = appleTilbake30Lenke();
  if (!apple) throw new Error('APPLE_APP_ID / APPLE_OFFER_CODE missing');
  console.log(JSON.stringify({ appleRedeem: apple, allowlist: process.env.TEST_EMAIL_ALLOWLIST }));

  const admin = supabaseAdmin();
  await admin.from('profiler').upsert(
    { id: USER_ID, locale: 'no', markedsforing_samtykke: true },
    { onConflict: 'id' },
  );
  await admin.from('email_log').delete().eq('user_id', USER_ID).in('email_type', ['cancellation', 'winback']);
  await admin.from('retention_offers').delete().eq('user_id', USER_ID);

  const monthlyCancel = payload({ type: 'CANCELLATION', productId: 'lille_monthly' });
  const monthlyCancelResult = await behandleAppStoreHendelse(admin, { payload: monthlyCancel, userId: USER_ID });
  console.log(JSON.stringify({ step: 'cancellation_monthly', ...monthlyCancelResult }));

  await admin.from('email_log').delete().eq('user_id', USER_ID).eq('email_type', 'cancellation');

  const yearlyCancel = payload({ type: 'CANCELLATION', productId: 'lille_yearly' });
  const yearlyCancelResult = await behandleAppStoreHendelse(admin, { payload: yearlyCancel, userId: USER_ID });
  console.log(JSON.stringify({ step: 'cancellation_yearly', ...yearlyCancelResult }));

  const yearlyExp = payload({ type: 'EXPIRATION', productId: 'lille_yearly' });
  const yearlyExpResult = await behandleAppStoreHendelse(admin, { payload: yearlyExp, userId: USER_ID });
  console.log(JSON.stringify({ step: 'expiration_yearly_no_mail', ...yearlyExpResult }));

  const monthlyExp = payload({ type: 'EXPIRATION', productId: 'lille_monthly' });
  const monthlyExpResult = await behandleAppStoreHendelse(admin, { payload: monthlyExp, userId: USER_ID });
  console.log(JSON.stringify({ step: 'expiration_monthly_stored', ...monthlyExpResult }));

  await admin.from('email_log').delete().eq('user_id', USER_ID).eq('email_type', 'winback');
  const winback = await sendIosWinbackmail(admin, {
    userId: USER_ID,
    email: EMAIL,
    livemode: false,
  });
  console.log(JSON.stringify({ step: 'winback_monthly', action: winback }));

  const redeemed = payload({ type: 'RENEWAL', productId: 'lille_monthly', offerCode: 'TILBAKE30' });
  const redeemedFlag = await registrerAppleTilbake30HvisInnløst(admin, { userId: USER_ID, payload: redeemed });
  await admin.from('email_log').delete().eq('user_id', USER_ID).eq('email_type', 'winback');
  const winbackAfter = await sendIosWinbackmail(admin, {
    userId: USER_ID,
    email: EMAIL,
    livemode: false,
  });
  console.log(JSON.stringify({ step: 'winback_after_redeem', recorded: redeemedFlag, action: winbackAfter }));

  const play = {
    event: { type: 'CANCELLATION', store: 'PLAY_STORE', environment: 'SANDBOX', product_id: 'lille_monthly' },
  };
  const playResult = await behandleAppStoreHendelse(admin, { payload: play, userId: USER_ID });
  console.log(JSON.stringify({ step: 'play_store_ignored', ...playResult }));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
