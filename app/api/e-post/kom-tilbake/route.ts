import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { epostRedirect, lesEpostToken } from '../../../lib/email/hmac';
import { velgEpostSpråk } from '../../../lib/email/locale';
import { supabaseAdmin } from '../../../lib/supabaseAdmin';
import { finnStripeKundeId, harBruktTilbake30, stripePriceId, tilbake30PromoId } from '../../../lib/stripe/tilbake30';
import { findBlockingStripeSubscription } from '../../../lib/stripe/blockingSubscriptions';
import { toStripeLocale } from '../../../lib/i18n/locales';

export const dynamic = 'force-dynamic';

function redirectStatus(req: Request, raw: string, status: string) {
  return epostRedirect(req, '/e-post/kom-tilbake', raw, { status });
}

export async function POST(req: Request) {
  const form = await req.formData();
  const raw = String(form.get('t') || '');
  const token = lesEpostToken(raw, 'winback');
  if (!token) return redirectStatus(req, raw, 'invalid');

  const stripeKey = process.env.STRIPE_SECRET_KEY?.trim();
  const promo = tilbake30PromoId();
  if (!stripeKey || !promo) return redirectStatus(req, raw, 'invalid');

  const stripe = new Stripe(stripeKey);
  const admin = supabaseAdmin();
  const { data: userData } = await admin.auth.admin.getUserById(token.u);
  const email = userData.user?.email?.trim();
  if (!email) return redirectStatus(req, raw, 'invalid');

  const { data: profil } = await admin.from('profiler').select('locale').eq('id', token.u).maybeSingle();
  const locale = toStripeLocale(profil?.locale ?? velgEpostSpråk(null));

  const existing = await findBlockingStripeSubscription(stripe, { userId: token.u, email });
  if (existing) return redirectStatus(req, raw, 'active');

  const customerId = (await finnStripeKundeId(stripe, token.u, email)) || undefined;
  const brukt = await harBruktTilbake30({
    admin,
    stripe,
    userId: token.u,
    customerId,
    email,
  });
  if (brukt) return redirectStatus(req, raw, 'used');

  const appUserMeta = { app_user_id: token.u, lille_offer: 'winback' };
  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      locale,
      ...(customerId ? { customer: customerId } : { customer_email: email }),
      client_reference_id: token.u,
      line_items: [{ price: stripePriceId(), quantity: 1 }],
      discounts: [{ promotion_code: promo }],
      subscription_data: {
        metadata: appUserMeta,
      },
      metadata: appUserMeta,
      success_url: 'https://www.lilleapp.no/bekreftelse',
      cancel_url: 'https://www.lilleapp.no/abonnement',
    });
    if (!session.url) return redirectStatus(req, raw, 'invalid');
    return NextResponse.redirect(session.url, 303);
  } catch (err) {
    console.error('winback checkout failed', err);
    return redirectStatus(req, raw, 'invalid');
  }
}
