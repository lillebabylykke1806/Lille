import { NextResponse } from 'next/server';
import Stripe from 'stripe';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: 'Stripe ikke konfigurert' }, { status: 500 });
  }

  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const { customer_id } = await req.json();

    if (!customer_id) {
      return NextResponse.json({ error: 'Ingen kunde-ID' }, { status: 400 });
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: customer_id,
      return_url: 'https://lilleapp.no',
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Noe gikk galt' }, { status: 500 });
  }
}