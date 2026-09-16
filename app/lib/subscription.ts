import { Purchases } from '@revenuecat/purchases-capacitor';
import {
  initRevenueCat,
  isNativeApp,
  ENTITLEMENT_ID,
} from './revenuecat';
import { supabase } from './supabase';

export { initRevenueCat, isNativeApp };

/** Resolves to `fallback` if the promise doesn't settle within `ms`. */
function withTimeout<T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> {
  return new Promise<T>((resolve) => {
    let settled = false;
    const timer = setTimeout(() => {
      if (!settled) {
        settled = true;
        resolve(fallback);
      }
    }, ms);
    promise
      .then((value) => {
        if (!settled) {
          settled = true;
          clearTimeout(timer);
          resolve(value);
        }
      })
      .catch(() => {
        if (!settled) {
          settled = true;
          clearTimeout(timer);
          resolve(fallback);
        }
      });
  });
}

export async function checkStripeSubscription(email: string, userId?: string): Promise<boolean> {
  const result = await checkStripeSubscriptionSafe(email, userId);
  return result === true;
}

/**
 * `true` / `false` when Stripe answered; `null` on network/API failure.
 * Prefers app_user_id (Supabase UUID in subscription metadata) over email.
 */
export async function checkStripeSubscriptionSafe(
  email: string,
  userId?: string,
): Promise<boolean | null> {
  if (!email && !userId) return false;
  return withTimeout(
    (async () => {
      try {
        const res = await fetch('/api/sjekk-abonnement', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: email || undefined, userId: userId || undefined }),
        });
        if (!res.ok) return null;
        const { aktiv } = await res.json();
        return !!aktiv;
      } catch {
        return null;
      }
    })(),
    8000,
    null,
  );
}

/** `true` / `false` when DB answered; `null` on error. Missing column → false. */
export async function checkProfilerSubscription(userId: string): Promise<boolean | null> {
  return withTimeout(
    (async () => {
      try {
        const { data, error } = await supabase
          .from('profiler')
          .select('stripe_subscription_status')
          .eq('id', userId)
          .single();
        if (error) {
          if (error.code === 'PGRST116' || error.message?.includes('does not exist')) return false;
          return null;
        }
        return data?.stripe_subscription_status === 'active';
      } catch {
        return null;
      }
    })(),
    8000,
    null,
  );
}

/** `true` / `false` when RC answered; `null` on failure/not ready/timeout. */
export async function checkRevenueCatEntitlementSafe(): Promise<boolean | null> {
  if (!isNativeApp()) return false;
  try {
    const timed = await withTimeout(Purchases.getCustomerInfo(), 8000, null);
    if (!timed) return null;
    return timed.customerInfo.entitlements.active[ENTITLEMENT_ID] !== undefined;
  } catch {
    return null;
  }
}

/** True if any source says active. Does not fail-open on errors (use getSubscriptionAccess). */
export async function hasActiveSubscription(email: string, userId?: string): Promise<boolean> {
  if (userId) await withTimeout(initRevenueCat(userId), 8000, undefined);

  const checks: Promise<boolean | null>[] = [
    withTimeout(checkStripeSubscriptionSafe(email, userId), 8000, null),
  ];
  if (userId) {
    checks.push(withTimeout(checkProfilerSubscription(userId), 8000, null));
  }
  if (isNativeApp()) {
    checks.push(withTimeout(checkRevenueCatEntitlementSafe(), 8000, null));
  }

  const results = await Promise.all(checks);
  return results.some((r) => r === true);
}
