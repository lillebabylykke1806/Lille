import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { isBlockingStripeStatus } from '../../../lib/stripe/blockingSubscriptions';
import { klassifiserStripeHendelse, statusFraStripeType } from '../../../lib/stripe/lifecycle';
import { customerIdOf, invoiceSubscriptionId, stripePeriodEndIso, stripePeriodEndUnix } from '../../../lib/stripe/period';
import { harBruktTilbake30 } from '../../../lib/stripe/tilbake30';
import { epostLenke, signerStay, signerUnsub } from '../../../lib/email/hmac';
import { hentEpostSpråk, sendMarkedsforing } from '../../../lib/email/send';
import { kanselleringMal } from '../../../lib/email/templates';
import { findUserIdByEmail, supabaseAdmin } from '../../../lib/supabaseAdmin';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * After Checkout, ensure the paying email has a Supabase auth user and that
 * the subscription is tagged with app_user_id (Supabase UUID).
 * Also records Stripe lifecycle events and sends cancellation mail (live only).
 */
export async function POST(req: Request) {
  const stripeKey = process.env.STRIPE_SECRET_KEY?.trim();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  if (!stripeKey || !webhookSecret) {
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 });
  }

  const stripe = new Stripe(stripeKey, {
    // Match the live webhook snapshot in Stripe Dashboard.
    apiVersion: '2026-03-25.dahlia' as Stripe.LatestApiVersion,
  });
  const signature = req.headers.get('stripe-signature');
  if (!signature) {
    return NextResponse.json({ error: 'Missing stripe-signature' }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    const raw = await req.text();
    event = stripe.webhooks.constructEvent(raw, signature, webhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Invalid signature';
    return NextResponse.json({ error: message }, { status: 400 });
  }

  try {
    if (
      event.type === 'checkout.session.completed' ||
      event.type === 'customer.subscription.created' ||
      event.type === 'customer.subscription.updated'
    ) {
      await ensurePaidUserHasAccount(stripe, event);
    }

    if (event.type === 'checkout.session.completed') {
      await registrerWinbackTilbud(event);
    }

    await lagreStripeLivssyklus(stripe, event);
  } catch (err) {
    console.error('stripe webhook handler failed', err);
    return NextResponse.json({ error: 'handler_failed' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

async function ensurePaidUserHasAccount(stripe: Stripe, event: Stripe.Event): Promise<void> {
  const admin = supabaseAdmin();

  let email: string | null = null;
  let userIdFromMeta: string | null = null;
  let subscriptionId: string | null = null;
  let customerId: string | null = null;
  let status: string | null = null;

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    email = session.customer_details?.email || session.customer_email || null;
    userIdFromMeta =
      (typeof session.metadata?.app_user_id === 'string' && session.metadata.app_user_id) ||
      (typeof session.client_reference_id === 'string' ? session.client_reference_id : null);
    customerId = typeof session.customer === 'string' ? session.customer : session.customer?.id || null;
    subscriptionId =
      typeof session.subscription === 'string'
        ? session.subscription
        : session.subscription?.id || null;
  } else {
    const sub = event.data.object as Stripe.Subscription;
    status = sub.status;
    if (status && !isBlockingStripeStatus(status) && status !== 'incomplete') return;
    userIdFromMeta =
      typeof sub.metadata?.app_user_id === 'string' ? sub.metadata.app_user_id : null;
    customerId = customerIdOf(sub);
    subscriptionId = sub.id;
  }

  if (!email && customerId) {
    const customer = await stripe.customers.retrieve(customerId);
    const retrievedEmail = (customer as { email?: string | null }).email;
    if (retrievedEmail) email = retrievedEmail;
  }
  email = email?.trim().toLowerCase() || null;
  if (!email && !userIdFromMeta) return;

  let userId = userIdFromMeta;
  if (userId) {
    const { data } = await admin.auth.admin.getUserById(userId);
    if (!data.user) userId = null;
  }

  if (!userId && email) {
    userId = await findUserIdByEmail(admin, email);
  }

  let created = false;
  if (!userId && email) {
    const password = `Lille-${crypto.randomUUID()}!aA1`;
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { source: 'stripe_checkout_recovery' },
    });
    if (error || !data.user) {
      userId = await findUserIdByEmail(admin, email);
    } else {
      userId = data.user.id;
      created = true;
    }
  }

  if (!userId) return;

  await admin.from('profiler').upsert({ id: userId }, { onConflict: 'id' });
  if (status === 'trialing' || status === 'active' || status === 'past_due') {
    await admin
      .from('profiler')
      .update({ stripe_subscription_status: status === 'trialing' ? 'active' : status })
      .eq('id', userId);
  } else {
    await admin
      .from('profiler')
      .update({ stripe_subscription_status: 'active' })
      .eq('id', userId);
  }

  if (subscriptionId) {
    await stripe.subscriptions.update(subscriptionId, {
      metadata: { app_user_id: userId },
    });
  }
  if (customerId) {
    await stripe.customers.update(customerId, {
      metadata: { app_user_id: userId },
      ...(email ? { email } : {}),
    });
  }

  if (created && email) {
    const origin = process.env.NEXT_PUBLIC_APP_URL?.trim() || 'https://www.lilleapp.no';
    const { error } = await admin.auth.resetPasswordForEmail(email, {
      redirectTo: `${origin.replace(/\/$/, '')}/tilbakestill-passord`,
    });
    if (error) {
      console.warn('stripe webhook: password reset email failed', error.message);
    }
  }
}

async function registrerWinbackTilbud(event: Stripe.Event): Promise<void> {
  const session = event.data.object as Stripe.Checkout.Session;
  if (session.metadata?.lille_offer !== 'winback') return;
  const userId =
    (typeof session.metadata?.app_user_id === 'string' && session.metadata.app_user_id) ||
    (typeof session.client_reference_id === 'string' ? session.client_reference_id : null);
  if (!userId) return;
  const subscriptionId =
    typeof session.subscription === 'string'
      ? session.subscription
      : session.subscription?.id || null;
  const { error } = await supabaseAdmin().from('retention_offers').insert({
    user_id: userId,
    offer_type: 'winback',
    stripe_subscription_id: subscriptionId,
  });
  if (error && error.code !== '23505') {
    console.error('winback retention_offers insert failed', error.message);
  }
}

async function lagreStripeLivssyklus(stripe: Stripe, event: Stripe.Event): Promise<void> {
  const prev = (event.data.previous_attributes || {}) as {
    cancel_at_period_end?: boolean;
  };

  let sub: Stripe.Subscription | null = null;
  let invoice: Stripe.Invoice | null = null;
  let billingReason: string | null = null;

  if (
    event.type === 'customer.subscription.updated' ||
    event.type === 'customer.subscription.deleted' ||
    event.type === 'customer.subscription.created'
  ) {
    sub = event.data.object as Stripe.Subscription;
  } else if (event.type === 'invoice.paid' || event.type === 'invoice.payment_failed') {
    invoice = event.data.object as Stripe.Invoice;
    billingReason = invoice.billing_reason;
    const subId = invoiceSubscriptionId(invoice);
    if (subId) {
      sub = await stripe.subscriptions.retrieve(subId, { expand: ['discounts'] });
    }
  } else {
    return;
  }

  const type = klassifiserStripeHendelse({
    type: event.type,
    previousCancelAtPeriodEnd: prev.cancel_at_period_end,
    cancelAtPeriodEnd: sub?.cancel_at_period_end,
    billingReason,
  });
  if (!type) return;

  const admin = supabaseAdmin();
  const userId = await finnStripeBruker(admin, stripe, sub, invoice);
  const productId = sub?.items?.data?.[0]?.price?.id ?? null;
  const raw = { livemode: event.livemode, stripe_event_id: event.id, object: event.data.object };

  const { error: insertError } = await admin.from('subscription_events').insert({
    event_id: `stripe_${event.id}`,
    user_id: userId,
    app_user_id: sub?.metadata?.app_user_id ?? null,
    type,
    store: 'STRIPE',
    product_id: productId,
    period_type: sub?.status === 'trialing' ? 'trial' : 'normal',
    event_at: new Date(event.created * 1000).toISOString(),
    expiration_at: sub ? stripePeriodEndIso(sub) : null,
    raw,
  });

  if (insertError) {
    if (insertError.code === '23505') return;
    console.error('subscription_events stripe insert failed', insertError.message);
    return;
  }

  if (userId) {
    const mapped = statusFraStripeType(type);
    const { error: statusError } = await admin.from('subscription_status').upsert(
      {
        user_id: userId,
        status: mapped.status,
        store: 'STRIPE',
        product_id: productId,
        is_trial: sub?.status === 'trialing',
        will_renew: mapped.will_renew,
        expires_at: sub ? stripePeriodEndIso(sub) : null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' },
    );
    if (statusError) console.error('subscription_status stripe upsert failed', statusError.message);
  }

  if (type === 'CANCELLATION' && sub && userId) {
    const details = sub.cancellation_details;
    if (details?.feedback || details?.comment) {
      await admin.from('cancellation_feedback').insert({
        user_id: userId,
        reason: details.feedback,
        comment: details.comment,
        source: 'stripe_portal',
        stripe_subscription_id: sub.id,
      });
    }
    try {
      await sendKanselleringsmail(stripe, admin, {
        userId,
        sub,
        livemode: event.livemode,
      });
    } catch (err) {
      console.error('cancellation email failed', err);
    }
  }
}

async function finnStripeBruker(
  admin: ReturnType<typeof supabaseAdmin>,
  stripe: Stripe,
  sub: Stripe.Subscription | null,
  invoice: Stripe.Invoice | null,
): Promise<string | null> {
  const fromMeta = sub?.metadata?.app_user_id;
  if (fromMeta) {
    const { data } = await admin.auth.admin.getUserById(fromMeta);
    if (data.user) return data.user.id;
  }
  const customerId = sub ? customerIdOf(sub) : customerIdOf(invoice || { customer: null });
  if (!customerId) return null;
  const customer = await stripe.customers.retrieve(customerId);
  if ('deleted' in customer && customer.deleted) return null;
  const metaId = customer.metadata?.app_user_id;
  if (metaId) {
    const { data } = await admin.auth.admin.getUserById(metaId);
    if (data.user) return data.user.id;
  }
  const email = customer.email?.trim().toLowerCase();
  if (!email) return null;
  return findUserIdByEmail(admin, email);
}

async function sendKanselleringsmail(
  stripe: Stripe,
  admin: ReturnType<typeof supabaseAdmin>,
  opts: { userId: string; sub: Stripe.Subscription; livemode: boolean },
): Promise<void> {
  const { data: userData } = await admin.auth.admin.getUserById(opts.userId);
  const email = userData.user?.email;
  if (!email) return;

  const brukt = await harBruktTilbake30({
    admin,
    stripe,
    userId: opts.userId,
    customerId: customerIdOf(opts.sub),
    subscription: opts.sub,
  });

  const språk = await hentEpostSpråk(admin, opts.userId);
  const unsubHref = epostLenke('/e-post/avmelding', signerUnsub(opts.userId));
  let stayHref: string | null = null;
  const periodEnd = stripePeriodEndUnix(opts.sub);
  if (!brukt && periodEnd) {
    stayHref = epostLenke('/e-post/bli', signerStay(opts.userId, opts.sub.id, periodEnd));
  }

  await sendMarkedsforing({
    admin,
    userId: opts.userId,
    email,
    emailType: 'cancellation',
    livemode: opts.livemode,
    innhold: kanselleringMal(språk, { stayHref, unsubHref }),
  });
}
