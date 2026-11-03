import type Stripe from 'stripe';

export function stripePeriodEndUnix(sub: Stripe.Subscription): number | null {
  const ends = (sub.items?.data ?? [])
    .map((item) => item.current_period_end)
    .filter((n): n is number => typeof n === 'number' && n > 0);
  if (ends.length) return Math.max(...ends);
  if (typeof sub.cancel_at === 'number' && sub.cancel_at > 0) return sub.cancel_at;
  if (typeof sub.ended_at === 'number' && sub.ended_at > 0) return sub.ended_at;
  return null;
}

export function stripePeriodEndIso(sub: Stripe.Subscription): string | null {
  const unix = stripePeriodEndUnix(sub);
  return unix ? new Date(unix * 1000).toISOString() : null;
}

export function customerIdOf(obj: { customer?: string | { id?: string } | null }): string | null {
  const c = obj.customer;
  if (typeof c === 'string') return c;
  return c?.id || null;
}

function idFrom(value: unknown): string | null {
  if (typeof value === 'string' && value.startsWith('sub_')) return value;
  if (value && typeof value === 'object' && 'id' in value) {
    const id = (value as { id?: unknown }).id;
    if (typeof id === 'string' && id.startsWith('sub_')) return id;
  }
  return null;
}

/**
 * Stripe API 2026-03-25.dahlia: invoice.subscription is gone.
 * Subscription id is invoice.parent.subscription_details.subscription.
 */
export function invoiceSubscriptionId(invoice: Stripe.Invoice): string | null {
  const fromParent = invoice.parent?.subscription_details?.subscription;
  const parentId = idFrom(fromParent);
  if (parentId) return parentId;

  const lines = invoice.lines?.data ?? [];
  for (const line of lines) {
    const fromItem = idFrom(line.parent?.subscription_item_details?.subscription);
    if (fromItem) return fromItem;
    const fromInvoiceItem = idFrom(line.parent?.invoice_item_details?.subscription);
    if (fromInvoiceItem) return fromInvoiceItem;
    const fromLine = idFrom(line.subscription);
    if (fromLine) return fromLine;
  }

  return idFrom((invoice as { subscription?: unknown }).subscription);
}
