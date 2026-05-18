import { NextResponse } from "next/server"
import Stripe from "stripe"

const stripe = new Stripe("sk_test_51THMSrECtaFxdrAs2bHPBPxIyD0fh77563zABtVNATQOcJmZajbqyH97Pg4saPKWUwWAPiJxTP1nORKYnGYMP9GR00Qfniwf9r")

export async function POST(req: Request) {
  try {
    const { email } = await req.json()
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer_email: email,
      line_items: [{ price: "price_1TXQz9ECtaFxdrAsMOWd1w8m", quantity: 1 }],
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
