import { Capacitor } from '@capacitor/core';
import {
  initRevenueCat,
  checkRevenueCatEntitlement,
  isNativeApp,
} from './revenuecat';

export { initRevenueCat, isNativeApp };

/** Resolves to `fallback` if the promise doesn't settle within `ms`, so a hanging
 * native/network call can never freeze the UI (e.g. the login flow). */
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

export async function checkStripeSubscription(email: string): Promise<boolean> {
  try {
    const res = await fetch('/api/sjekk-abonnement', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    const { aktiv } = await res.json();
    return !!aktiv;
  } catch {
    return false;
  }
}

/** True if user has active Stripe (web) or RevenueCat (app) subscription.
 * Every network/native call is guarded by a timeout so this can never hang. */
export async function hasActiveSubscription(email: string, userId?: string): Promise<boolean> {
  if (userId) await withTimeout(initRevenueCat(userId), 8000, undefined);

  const [stripeAktiv, rcAktiv] = await Promise.all([
    withTimeout(checkStripeSubscription(email), 8000, false),
    isNativeApp() ? withTimeout(checkRevenueCatEntitlement(), 8000, false) : Promise.resolve(false),
  ]);

  return stripeAktiv || rcAktiv;
}
