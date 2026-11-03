import type Stripe from 'stripe';
import type { SupabaseClient } from '@supabase/supabase-js';
import { isActiveStripeCustomer } from './period';

export function tilbake30PromoId(): string | null {
  return process.env.STRIPE_TILBAKE30_PROMO_ID?.trim() || null;
}

export function stripePriceId(): string {
  return process.env.STRIPE_PRICE_ID?.trim() || 'price_1TYWt8CjOZUfHkd4gsvnkpov';
}

function couponIdOf(coupon: string | Stripe.Coupon | null | undefined): string | null {
  if (!coupon) return null;
  return typeof coupon === 'string' ? coupon : coupon.id;
}

function couponNameOf(coupon: string | Stripe.Coupon | null | undefined): string | null {
  if (!coupon || typeof coupon === 'string') return null;
  return coupon.name;
}

export function rabattMatcherTilbake30(
  discount: Stripe.Discount | string | null | undefined,
  ids: { promoId: string; couponId: string | null; couponName: string | null },
): boolean {
  if (!discount || typeof discount === 'string') return false;
  const promo = discount.promotion_code;
  const promoId = typeof promo === 'string' ? promo : promo?.id;
  if (promoId && promoId === ids.promoId) return true;
  const coupon = discount.source?.coupon;
  const cId = couponIdOf(coupon);
  if (ids.couponId && cId === ids.couponId) return true;
  const cName = couponNameOf(coupon);
  if (ids.couponName && cName && cName.toLowerCase() === ids.couponName.toLowerCase()) return true;
  return false;
}

async function hentTilbake30Ids(stripe: Stripe): Promise<{
  promoId: string;
  couponId: string | null;
  couponName: string | null;
} | null> {
  const promoId = tilbake30PromoId();
  if (!promoId) return null;
  const promo = await stripe.promotionCodes.retrieve(promoId, { expand: ['promotion.coupon'] });
  const coupon = promo.promotion?.coupon;
  return {
    promoId,
    couponId: couponIdOf(coupon),
    couponName: couponNameOf(coupon),
  };
}

async function harStripeTilbake30(
  stripe: Stripe,
  opts: { customerId?: string | null; subscription?: Stripe.Subscription | null },
): Promise<boolean> {
  const ids = await hentTilbake30Ids(stripe);
  if (!ids) return false;

  const sjekkSub = (sub: Stripe.Subscription) =>
    (sub.discounts ?? []).some((d) => rabattMatcherTilbake30(d, ids));

  if (opts.subscription && sjekkSub(opts.subscription)) return true;

  if (!opts.customerId) return false;

  const customer = await stripe.customers.retrieve(opts.customerId, { expand: ['discount'] });
  if (!isActiveStripeCustomer(customer)) return false;
  if (rabattMatcherTilbake30(customer.discount, ids)) return true;

  const subs = await stripe.subscriptions.list({
    customer: opts.customerId,
    status: 'all',
    limit: 100,
    expand: ['data.discounts'],
  });
  return subs.data.some(sjekkSub);
}

export async function finnStripeKundeId(
  stripe: Stripe,
  userId: string,
  email?: string | null,
): Promise<string | null> {
  try {
    const found = await stripe.customers.search({
      query: `metadata["app_user_id"]:"${userId}"`,
      limit: 1,
    });
    if (found.data[0]?.id) return found.data[0].id;
  } catch {
    // search not available in all accounts
  }
  if (!email) return null;
  const listed = await stripe.customers.list({ email, limit: 1 });
  return listed.data[0]?.id ?? null;
}

export async function harBruktTilbake30(opts: {
  admin: SupabaseClient;
  stripe: Stripe;
  userId: string;
  customerId?: string | null;
  subscription?: Stripe.Subscription | null;
  email?: string | null;
}): Promise<boolean> {
  const { data } = await opts.admin
    .from('retention_offers')
    .select('user_id')
    .eq('user_id', opts.userId)
    .maybeSingle();
  if (data?.user_id) return true;
  const customerId =
    opts.customerId || (await finnStripeKundeId(opts.stripe, opts.userId, opts.email));
  return harStripeTilbake30(opts.stripe, {
    customerId,
    subscription: opts.subscription,
  });
}
