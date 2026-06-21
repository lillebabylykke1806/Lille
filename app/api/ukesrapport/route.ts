import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';
import { Resend } from 'resend';

export const dynamic = 'force-dynamic';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const resend = new Resend(process.env.RESEND_API_KEY);

export async function GET(req: Request) {
    const authHeader = req.headers.get('authorization');
    const isVercelCron = req.headers.get('x-vercel-cron') === '1' || req.headers.get('user-agent')?.includes('vercel-cron');
    if (!isVercelCron && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

  try {
    const { data: { users }, error: usersError } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
    if (usersError) throw usersError;
    const totaltBrukere = users.length;

    let medCustomerId = 0;
    let aktiveAbonnementer = 0;
    let prøveperioder = 0;
    let kansellerte = 0;

    let hasMore = true;
    let startingAfter: string | undefined = undefined;
    const customerIds = new Set<string>();

    while (hasMore) {
      const customers: Stripe.ApiList<Stripe.Customer> = await stripe.customers.list({
        limit: 100,
        starting_after: startingAfter,
      });
      customers.data.forEach(c => customerIds.add(c.id));
      hasMore = customers.has_more;
      if (customers.data.length > 0) {
        startingAfter = customers.data[customers.data.length - 1].id;
      } else {
        hasMore = false;
      }
    }
    medCustomerId = customerIds.size;

    hasMore = true;
    startingAfter = undefined;
    while (hasMore) {
      const subs: Stripe.ApiList<Stripe.Subscription> = await stripe.subscriptions.list({
        limit: 100,
        status: 'all',
        starting_after: startingAfter,
      });
      subs.data.forEach(s => {
        if (s.status === 'active') aktiveAbonnementer++;
        else if (s.status === 'trialing') prøveperioder++;
        else if (s.status === 'canceled') kansellerte++;
      });
      hasMore = subs.has_more;
      if (subs.data.length > 0) {
        startingAfter = subs.data[subs.data.length - 1].id;
      } else {
        hasMore = false;
      }
    }

    const nå = new Date();
    const siste24t = new Date(nå.getTime() - 24 * 60 * 60 * 1000);
    const siste7dager = new Date(nå.getTime() - 7 * 24 * 60 * 60 * 1000);

    const tabeller = ['lurer', 'amming', 'bleie', 'mat', 'pumping', 'vekt', 'medisin', 'temperatur', 'uro_logg', 'notater'];

    const aktiveProfilIder24t = new Set<string>();
    const aktiveProfilIder7d = new Set<string>();

    for (const tabell of tabeller) {
      const { data } = await supabaseAdmin
        .from(tabell)
        .select('profil_id, opprettet')
        .gte('opprettet', siste7dager.toISOString());

      if (data) {
        data.forEach((rad: any) => {
          if (rad.profil_id) {
            aktiveProfilIder7d.add(rad.profil_id);
            if (new Date(rad.opprettet) >= siste24t) {
              aktiveProfilIder24t.add(rad.profil_id);
            }
          }
        });
      }
    }

    const aktive24t = aktiveProfilIder24t.size;
    const aktive7d = aktiveProfilIder7d.size;
    const minstEnHendelse7d = aktiveProfilIder7d.size;

    const html = `
      <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto;">
        <h2 style="color: #2D5C45;">📊 Lille – Ukesrapport</h2>
        <p style="color: #7B746D; font-size: 13px;">${nå.toLocaleDateString('no-NO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
        
        <h3 style="color: #3F3A37; margin-top: 24px;">Brukere</h3>
        <ul style="line-height: 1.8;">
          <li>Totalt registrerte brukere: <strong>${totaltBrukere}</strong></li>
          <li>Brukere med Stripe customer_id: <strong>${medCustomerId}</strong></li>
        </ul>

        <h3 style="color: #3F3A37; margin-top: 24px;">Abonnement</h3>
        <ul style="line-height: 1.8;">
          <li>Aktive abonnementer: <strong>${aktiveAbonnementer}</strong></li>
          <li>Prøveperioder: <strong>${prøveperioder}</strong></li>
          <li>Kansellerte abonnementer: <strong>${kansellerte}</strong></li>
        </ul>

        <h3 style="color: #3F3A37; margin-top: 24px;">Aktivitet</h3>
        <ul style="line-height: 1.8;">
          <li>Aktive brukere siste 24 timer: <strong>${aktive24t}</strong></li>
          <li>Aktive brukere siste 7 dager: <strong>${aktive7d}</strong></li>
          <li>Brukere med minst én hendelse siste 7 dager: <strong>${minstEnHendelse7d}</strong></li>
        </ul>

        <p style="color: #A8B5A2; font-size: 12px; margin-top: 32px;">Automatisk generert rapport fra Lille 🌿</p>
      </div>
    `;

    await resend.emails.send({
      from: 'rapport@lilleapp.no',
      to: 'lillebabylykke@outlook.com',
      subject: `📊 Lille – Ukesrapport ${nå.toLocaleDateString('no-NO')}`,
      html,
    });

    return NextResponse.json({
      ok: true,
      totaltBrukere,
      medCustomerId,
      aktiveAbonnementer,
      prøveperioder,
      kansellerte,
      aktive24t,
      aktive7d,
      minstEnHendelse7d,
    });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}