import { Purchases } from '@revenuecat/purchases-capacitor';
import { ENTITLEMENT_ID, initRevenueCat, isNativeApp } from './revenuecat';
import {
  checkProfilerSubscription,
  checkRevenueCatEntitlementSafe,
  checkStripeSubscriptionSafe,
} from './subscription';

export type ProPeriod = 'trial' | 'paid' | null;

export type SubscriptionAccess = {
  hasPro: boolean;
  periodType: ProPeriod;
  expiresAt: string | null;
  /** Trial (or prior entitlement) ended without an active sub — candidate for "trial over" UI. */
  hadExpiredTrial: boolean;
  /**
   * True when network/RC/Stripe checks failed.
   * If hasPro is still true → temporary bridge from last-known (TTL).
   * If hasPro is false → show free mode + restore CTA (never unlock unknowns).
   */
  uncertain?: boolean;
  /** Show "Gjenopprett kjøp" — status unknown and no valid last-known Pro. */
  needsRestore?: boolean;
};

const PAYWALL_DAG_KEY = 'lille_paywall_last_shown';
const TRIAL_ENDED_SEEN_KEY = 'lille_trial_ended_seen';
const FIRST_PAYWALL_KEY = 'lille_first_paywall_pending';
const LAST_PRO_KEY_PREFIX = 'lille_last_pro_';
/** Last-known Pro is only a short bridge during outages — never sole source of truth. */
const LAST_PRO_TTL_MS = 72 * 60 * 60 * 1000;

export function markFirstPaywallPending(): void {
  try {
    localStorage.setItem(FIRST_PAYWALL_KEY, '1');
  } catch {}
}

export function consumeFirstPaywallPending(): boolean {
  try {
    if (localStorage.getItem(FIRST_PAYWALL_KEY) === '1') {
      localStorage.removeItem(FIRST_PAYWALL_KEY);
      return true;
    }
  } catch {}
  return false;
}

export function shouldShowDailyPaywall(): boolean {
  try {
    const today = new Date().toISOString().slice(0, 10);
    return localStorage.getItem(PAYWALL_DAG_KEY) !== today;
  } catch {
    return true;
  }
}

export function markPaywallShownToday(): void {
  try {
    localStorage.setItem(PAYWALL_DAG_KEY, new Date().toISOString().slice(0, 10));
  } catch {}
}

export function hasSeenTrialEnded(): boolean {
  try {
    return localStorage.getItem(TRIAL_ENDED_SEEN_KEY) === '1';
  } catch {
    return false;
  }
}

export function markTrialEndedSeen(): void {
  try {
    localStorage.setItem(TRIAL_ENDED_SEEN_KEY, '1');
  } catch {}
}

function lastProKey(userId: string): string {
  return `${LAST_PRO_KEY_PREFIX}${userId}`;
}

type LastKnownRecord = { hasPro: boolean; at: number };

function parseLastKnown(raw: string | null): LastKnownRecord | null {
  if (!raw) return null;
  // Legacy: bare "1" / "0" without timestamp — treat as expired (force re-check).
  if (raw === '1' || raw === '0') return null;
  try {
    const parsed = JSON.parse(raw) as { hasPro?: boolean; at?: number };
    if (typeof parsed.hasPro !== 'boolean' || typeof parsed.at !== 'number') return null;
    return { hasPro: parsed.hasPro, at: parsed.at };
  } catch {
    return null;
  }
}

/** Returns last-known Pro only if still within TTL and was `true`. */
export function readLastKnownPro(userId?: string): boolean | null {
  if (!userId) return null;
  try {
    const rec = parseLastKnown(localStorage.getItem(lastProKey(userId)));
    if (!rec) return null;
    if (Date.now() - rec.at > LAST_PRO_TTL_MS) return null;
    return rec.hasPro ? true : null;
  } catch {
    return null;
  }
}

/** Only persist positive Pro — never cache "free" as a bridge (avoids sticky free on glitch). */
export function writeLastKnownPro(userId: string | undefined, hasPro: boolean): void {
  if (!userId || !hasPro) return;
  try {
    const rec: LastKnownRecord = { hasPro: true, at: Date.now() };
    localStorage.setItem(lastProKey(userId), JSON.stringify(rec));
  } catch {}
}

export function clearLastKnownPro(userId?: string): void {
  if (!userId) return;
  try {
    localStorage.removeItem(lastProKey(userId));
  } catch {}
}

function mapPeriodType(raw: string | undefined | null): ProPeriod {
  const pt = (raw || '').toLowerCase();
  if (pt === 'trial') return 'trial';
  if (pt === 'intro' || pt === 'normal') return 'paid';
  if (pt) return 'paid';
  return null;
}

/**
 * Network/RC failure handling:
 * - Had Pro recently (TTL) → keep Pro briefly
 * - No known Pro → free mode + restore CTA (never unlock unknowns)
 */
function onUncertainAccess(userId?: string): SubscriptionAccess {
  const lastPro = readLastKnownPro(userId);
  if (lastPro === true) {
    return {
      hasPro: true,
      periodType: 'paid',
      expiresAt: null,
      hadExpiredTrial: false,
      uncertain: true,
      needsRestore: false,
    };
  }
  return {
    hasPro: false,
    periodType: null,
    expiresAt: null,
    hadExpiredTrial: false,
    uncertain: true,
    needsRestore: true,
  };
}

/**
 * Pro if ANY source says yes: App Store (RC), Stripe, or ambassador (RC promo / profiler).
 * Expired RC entitlement alone never means "free" — Stripe/profiler are still checked.
 */
export async function getSubscriptionAccess(
  email: string,
  userId?: string,
): Promise<SubscriptionAccess> {
  let periodType: ProPeriod = null;
  let expiresAt: string | null = null;
  let hadExpiredTrial = false;
  let rcDetailOk = false;
  let rcActiveFromDetail = false;

  if (isNativeApp() && userId) {
    try {
      await initRevenueCat(userId);
      const timed = await Promise.race([
        Purchases.getCustomerInfo(),
        new Promise<null>((resolve) => setTimeout(() => resolve(null), 8000)),
      ]);
      if (timed) {
        rcDetailOk = true;
        const { customerInfo } = timed;
        const active = customerInfo.entitlements.active[ENTITLEMENT_ID];
        if (active) {
          rcActiveFromDetail = true;
          periodType = mapPeriodType(active.periodType as string);
          expiresAt = active.expirationDate ?? null;
        } else {
          const all = customerInfo.entitlements.all[ENTITLEMENT_ID];
          if (all) {
            const pt = mapPeriodType(all.periodType as string);
            const expired =
              !!all.expirationDate && new Date(all.expirationDate).getTime() < Date.now();
            hadExpiredTrial = expired && (pt === 'trial' || !!all.unsubscribeDetectedAt);
            expiresAt = all.expirationDate ?? null;
          }
        }
      }
    } catch (err) {
      console.warn('getSubscriptionAccess RC failed', err);
    }
  }

  const [stripe, profiler, rcBool] = await Promise.all([
    checkStripeSubscriptionSafe(email, userId),
    userId ? checkProfilerSubscription(userId) : Promise.resolve(false as boolean | null),
    isNativeApp() && !rcActiveFromDetail
      ? checkRevenueCatEntitlementSafe()
      : Promise.resolve(rcActiveFromDetail ? (true as boolean | null) : (null as boolean | null)),
  ]);

  const rcActive = rcActiveFromDetail || rcBool === true;
  const hasPro = rcActive || stripe === true || profiler === true;

  if (hasPro) {
    writeLastKnownPro(userId, true);
    return {
      hasPro: true,
      periodType: periodType ?? 'paid',
      expiresAt,
      hadExpiredTrial: false,
    };
  }

  const stripeFailed = stripe === null;
  const profilerFailed = !!userId && profiler === null;
  const rcFailed = isNativeApp() && !rcDetailOk && rcBool === null;

  if (!stripeFailed && !profilerFailed && !rcFailed) {
    clearLastKnownPro(userId);
    return {
      hasPro: false,
      periodType: null,
      expiresAt,
      hadExpiredTrial,
    };
  }

  return onUncertainAccess(userId);
}
