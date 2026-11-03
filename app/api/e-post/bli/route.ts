import Stripe from 'stripe';
import { epostRedirect, lesEpostToken } from '../../../lib/email/hmac';
import { supabaseAdmin } from '../../../lib/supabaseAdmin';
import { harBruktTilbake30, tilbake30PromoId } from '../../../lib/stripe/tilbake30';
import { customerIdOf } from '../../../lib/stripe/period';

export const dynamic = 'force-dynamic';

function redirectStatus(req: Request, raw: string, status: string) {
  return epostRedirect(req, '/e-post/bli', raw, { status });
}

export async function POST(req: Request) {
  const form = await req.formData();
  const raw = String(form.get('t') || '');
  const token = lesEpostToken(raw, 'stay');
  if (!token?.s) return redirectStatus(req, raw, 'invalid');

  const stripeKey = process.env.STRIPE_SECRET_KEY?.trim();
  const promo = tilbake30PromoId();
  if (!stripeKey || !promo) return redirectStatus(req, raw, 'invalid');

  const stripe = new Stripe(stripeKey);
  const admin = supabaseAdmin();

  let sub: Stripe.Subscription;
  try {
    sub = await stripe.subscriptions.retrieve(token.s, { expand: ['discounts'] });
  } catch {
    return redirectStatus(req, raw, 'invalid');
  }

  if (sub.metadata?.app_user_id && sub.metadata.app_user_id !== token.u) {
    return redirectStatus(req, raw, 'invalid');
  }
  if (sub.status !== 'active' && sub.status !== 'trialing') {
    return redirectStatus(req, raw, 'invalid');
  }
  if (!sub.cancel_at_period_end) {
    return redirectStatus(req, raw, 'invalid');
  }

  const brukt = await harBruktTilbake30({
    admin,
    stripe,
    userId: token.u,
    customerId: customerIdOf(sub),
    subscription: sub,
  });
  if (brukt) return redirectStatus(req, raw, 'used');

  try {
    await stripe.subscriptions.update(token.s, {
      cancel_at_period_end: false,
      discounts: [{ promotion_code: promo }],
    });
  } catch (err) {
    console.error('stay offer failed', err);
    return redirectStatus(req, raw, 'invalid');
  }

  const { error } = await admin.from('retention_offers').insert({
    user_id: token.u,
    offer_type: 'stay',
    stripe_subscription_id: token.s,
  });
  if (error && error.code !== '23505') {
    console.error('retention_offers insert failed', error.message);
  }

  return redirectStatus(req, raw, 'ok');
}
