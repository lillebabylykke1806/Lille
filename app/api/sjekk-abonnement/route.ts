import { NextResponse } from 'next/server';
import Stripe from 'stripe';

export const dynamic = 'force-dynamic';

/**
 * Safety-net for Pro access when RC entitlement is missing/mismatched.
 * Prefers app_user_id on subscription/session metadata over email matching.
 */
export async function POST(req: Request) {
  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ aktiv: false });
  }

  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const body = await req.json();
    const email = typeof body.email === 'string' ? body.email.trim() : '';
    const userId = typeof body.userId === 'string' ? body.userId.trim() : '';

    if (!email && !userId) return NextResponse.json({ aktiv: false });

    // 1) Prefer metadata app_user_id (Supabase UUID) — robust across email changes
    if (userId) {
      try {
        const found = await stripe.subscriptions.search({
          query: `metadata["app_user_id"]:"${userId}"`,
          limit: 10,
        });
        const aktiv = found.data.some(
          (s) => s.status === 'active' || s.status === 'trialing',
        );
        if (aktiv) return NextResponse.json({ aktiv: true });
      } catch (err) {
        console.warn('Stripe subscription search by app_user_id failed', err);
      }
    }

    // 2) Fallback: email → customer → subscriptions
    if (email) {
      const customers = await stripe.customers.list({ email, limit: 5 });
      for (const customer of customers.data) {
        const subscriptions = await stripe.subscriptions.list({
          customer: customer.id,
          status: 'all',
          limit: 10,
        });
        const aktiv = subscriptions.data.some(
          (s) => s.status === 'active' || s.status === 'trialing',
        );
        if (aktiv) return NextResponse.json({ aktiv: true });
      }
    }

    return NextResponse.json({ aktiv: false });
  } catch (err) {
    console.error('sjekk-abonnement error', err);
    return NextResponse.json({ error: 'check_failed' }, { status: 500 });
  }
}
