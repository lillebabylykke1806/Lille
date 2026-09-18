import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { toStripeLocale } from '../../lib/i18n/locales';

export const dynamic = 'force-dynamic';

/**
 * Creates Stripe Checkout for Lille Pro.
 * Sets app_user_id on session + subscription metadata so RevenueCat Stripe
 * notifications can map the purchase to the same App User ID as the SDK
 * (Supabase UUID) — not cus_....
 */
export async function POST(req: Request) {
  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 });
  }

  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const body = await req.json();
    const email = typeof body.email === 'string' ? body.email.trim() : '';
    const userId = typeof body.userId === 'string' ? body.userId.trim() : '';
    const locale = toStripeLocale(body.locale);

    const appUserMeta = userId ? { app_user_id: userId } : undefined;

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      locale,
      ...(email ? { customer_email: email } : {}),
      ...(userId ? { client_reference_id: userId } : {}),
      line_items: [{ price: 'price_1TYWt8CjOZUfHkd4gsvnkpov', quantity: 1 }],
      allow_promotion_codes: true,
      subscription_data: {
        trial_period_days: 7,
        ...(appUserMeta ? { metadata: appUserMeta } : {}),
      },
      ...(appUserMeta ? { metadata: appUserMeta } : {}),
      success_url: 'https://www.lilleapp.no/bekreftelse',
      cancel_url: 'https://www.lilleapp.no/abonnement',
    });
    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}
