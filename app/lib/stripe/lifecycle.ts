export type StripeLifecycleType =
  | 'CANCELLATION'
  | 'UNCANCELLATION'
  | 'EXPIRATION'
  | 'BILLING_ISSUE'
  | 'INITIAL_PURCHASE'
  | 'RENEWAL';

export function klassifiserStripeHendelse(input: {
  type: string;
  previousCancelAtPeriodEnd?: boolean | null;
  cancelAtPeriodEnd?: boolean | null;
  billingReason?: string | null;
}): StripeLifecycleType | null {
  if (input.type === 'customer.subscription.deleted') return 'EXPIRATION';
  if (input.type === 'invoice.payment_failed') return 'BILLING_ISSUE';
  if (input.type === 'invoice.paid') {
    if (input.billingReason === 'subscription_create') return 'INITIAL_PURCHASE';
    if (
      input.billingReason === 'subscription_cycle' ||
      input.billingReason === 'subscription_update' ||
      input.billingReason === 'subscription_threshold' ||
      input.billingReason === 'subscription'
    ) {
      return 'RENEWAL';
    }
    return null;
  }
  if (input.type === 'customer.subscription.updated') {
    if (input.previousCancelAtPeriodEnd === false && input.cancelAtPeriodEnd === true) {
      return 'CANCELLATION';
    }
    if (input.previousCancelAtPeriodEnd === true && input.cancelAtPeriodEnd === false) {
      return 'UNCANCELLATION';
    }
  }
  return null;
}

export function statusFraStripeType(type: StripeLifecycleType): {
  status: string;
  will_renew: boolean;
} {
  switch (type) {
    case 'INITIAL_PURCHASE':
    case 'RENEWAL':
    case 'UNCANCELLATION':
      return { status: 'active', will_renew: true };
    case 'CANCELLATION':
      return { status: 'cancelled', will_renew: false };
    case 'BILLING_ISSUE':
      return { status: 'billing_issue', will_renew: true };
    case 'EXPIRATION':
      return { status: 'expired', will_renew: false };
  }
}
