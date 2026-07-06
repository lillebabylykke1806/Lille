import { NextResponse } from 'next/server';
import Stripe from 'stripe';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ aktiv: false });
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const { email } = await req.json();

  if (!email) return NextResponse.json({ aktiv: false });

  const customers = await stripe.customers.list({ email, limit: 1 });
  if (!customers.data.length) return NextResponse.json({ aktiv: false });

  const subscriptions = await stripe.subscriptions.list({
    customer: customers.data[0].id,
    status: 'all',
    limit: 10,
  });

  const aktiv = subscriptions.data.some(
    (s) => s.status === 'active' || s.status === 'trialing',
  );

  return NextResponse.json({ aktiv });
}
