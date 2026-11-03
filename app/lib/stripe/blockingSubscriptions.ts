import Stripe from 'stripe';

/** Statuses that must not start a second Checkout. */
export const STRIPE_BLOCKING_STATUSES = ['trialing', 'active', 'past_due'] as const;

export type StripeBlockingStatus = (typeof STRIPE_BLOCKING_STATUSES)[number];

export function isBlockingStripeStatus(status: string): status is StripeBlockingStatus {
  return (STRIPE_BLOCKING_STATUSES as readonly string[]).includes(status);
}

export type BlockingSubscription = {
  id: string;
  status: StripeBlockingStatus;
  customerId: string;
  email: string | null;
};

function asBlocking(sub: Stripe.Subscription, email: string | null): BlockingSubscription | null {
  if (!isBlockingStripeStatus(sub.status)) return null;
  const customerId = typeof sub.customer === 'string' ? sub.customer : sub.customer?.id;
  if (!customerId) return null;
  return { id: sub.id, status: sub.status, customerId, email };
}

/**
 * Find an existing trialing/active/past_due subscription for this user or email.
 * Prefers metadata app_user_id (Supabase UUID), then customer email.
 */
export async function findBlockingStripeSubscription(
  stripe: Stripe,
  opts: { userId?: string; email?: string },
): Promise<BlockingSubscription | null> {
  const userId = opts.userId?.trim() || '';
  const email = opts.email?.trim().toLowerCase() || '';

  if (userId) {
    try {
      const found = await stripe.subscriptions.search({
        query: `metadata["app_user_id"]:"${userId}"`,
        limit: 20,
      });
      for (const sub of found.data) {
        const hit = asBlocking(sub, email || null);
        if (hit) return hit;
      }
    } catch (err) {
      console.warn('Stripe subscription search by app_user_id failed', err);
    }
  }

  if (!email) return null;

  const customers = await stripe.customers.list({ email, limit: 10 });
  for (const customer of customers.data) {
    const customerEmail = customer.email?.trim().toLowerCase() || email;
    const subscriptions = await stripe.subscriptions.list({
      customer: customer.id,
      status: 'all',
      limit: 20,
    });
    for (const sub of subscriptions.data) {
      const hit = asBlocking(sub, customerEmail);
      if (hit) return hit;
    }
  }

  return null;
}
