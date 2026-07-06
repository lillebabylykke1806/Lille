import { Capacitor } from '@capacitor/core';
import {
  initRevenueCat,
  checkRevenueCatEntitlement,
  isNativeApp,
} from './revenuecat';

export { initRevenueCat, isNativeApp };

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

/** True if user has active Stripe (web) or RevenueCat (app) subscription. */
export async function hasActiveSubscription(email: string, userId?: string): Promise<boolean> {
  if (userId) await initRevenueCat(userId);

  const [stripeAktiv, rcAktiv] = await Promise.all([
    checkStripeSubscription(email),
    isNativeApp() ? checkRevenueCatEntitlement() : Promise.resolve(false),
  ]);

  return stripeAktiv || rcAktiv;
}
