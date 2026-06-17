import { NextResponse } from 'next/server';
import Stripe from 'stripe';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: 'Stripe ikke konfigurert' }, { status: 500 });
  }

  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: 'Ingen e-post' }, { status: 400 });
    }

    const customers = await stripe.customers.list({ email, limit: 1 });
    
    if (!customers.data.length) {
      return NextResponse.json({ error: 'Ingen kunde funnet' }, { status: 404 });
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: customers.data[0].id,
      return_url: 'https://lilleapp.no',
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Noe gikk galt' }, { status: 500 });
  }
}