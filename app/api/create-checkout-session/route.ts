import { NextResponse } from "next/server"
import Stripe from "stripe"

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: "Stripe ikke konfigurert" }, { status: 500 });
  }
  
  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const { email } = await req.json()
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer_email: email,
      line_items: [{ price: "price_1TYWt8CjOZUfHkd4gsvnkpov", quantity: 1 }],
      allow_promotion_codes: true,
      subscription_data: { trial_period_days: 7 },
      success_url: "https://www.lilleapp.no/bekreftelse",
      cancel_url: "https://www.lilleapp.no/abonnement",
    })
    return NextResponse.json({ url: session.url })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: "Noe gikk galt" }, { status: 500 })
  }
}