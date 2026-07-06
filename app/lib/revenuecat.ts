import { Capacitor } from '@capacitor/core';
import { Purchases } from '@revenuecat/purchases-capacitor';
import type { CustomerInfo, PurchasesOfferings, PurchasesPackage } from '@revenuecat/purchases-capacitor';
import { supabase } from './supabase';

export const ENTITLEMENT_ID = 'Lille Pro';
const IOS_API_KEY = 'appl_yJUgTGrXgObVRawZYPSFjYvrASv';
const ANDROID_API_KEY = process.env.NEXT_PUBLIC_REVENUECAT_ANDROID_API_KEY ?? '';

let initialized = false;
let currentUserId: string | null = null;

function isNative(): boolean {
  return Capacitor.isNativePlatform();
}

export function isNativeApp(): boolean {
  return isNative();
}

function getApiKey(): string | null {
  const platform = Capacitor.getPlatform();
  if (platform === 'ios') return IOS_API_KEY;
  if (platform === 'android') return ANDROID_API_KEY || null;
  return null;
}

function hasEntitlement(customerInfo: CustomerInfo): boolean {
  return customerInfo.entitlements.active[ENTITLEMENT_ID] !== undefined;
}

export async function syncSubscriptionStatus(userId: string, active: boolean): Promise<void> {
  if (!active) return;
  await supabase
    .from('profiler')
    .update({ stripe_subscription_status: 'active' })
    .eq('id', userId);
}

export async function checkRevenueCatEntitlement(): Promise<boolean> {
  if (!isNative() || !initialized) return false;

  const { customerInfo } = await Purchases.getCustomerInfo();
  const active = hasEntitlement(customerInfo);
  if (currentUserId && active) {
    await syncSubscriptionStatus(currentUserId, true);
  }
  return active;
}

async function getCurrentPackages(): Promise<PurchasesPackage[]> {
  const offerings: PurchasesOfferings = await Purchases.getOfferings();
  return offerings.current?.availablePackages ?? [];
}

async function getPackage(type: 'monthly' | 'yearly'): Promise<PurchasesPackage> {
  const packages = await getCurrentPackages();
  if (packages.length === 0) {
    throw new Error('Ingen abonnementspakker tilgjengelig');
  }

  const monthlyIds = ['$rc_monthly', 'monthly', 'lille_monthly'];
  const yearlyIds = ['$rc_annual', 'yearly', 'lille_yearly', 'annual'];

  const match = packages.find((pkg) => {
    const id = pkg.identifier.toLowerCase();
    if (type === 'monthly') {
      return monthlyIds.some((m) => id.includes(m.replace('$rc_', ''))) || id.includes('month');
    }
    return yearlyIds.some((y) => id.includes(y.replace('$rc_', ''))) || id.includes('year') || id.includes('annual');
  });

  if (match) return match;

  if (type === 'monthly') return packages[0];
  return packages[packages.length - 1];
}

async function handlePurchaseResult(customerInfo: CustomerInfo): Promise<boolean> {
  const active = hasEntitlement(customerInfo);
  if (currentUserId && active) {
    await syncSubscriptionStatus(currentUserId, true);
  }
  return active;
}

export async function initRevenueCat(appUserId?: string): Promise<void> {
  if (!isNative()) return;

  const apiKey = getApiKey();
  if (!apiKey) {
    console.warn('RevenueCat API key mangler for denne plattformen');
    return;
  }

  if (!initialized) {
    await Purchases.configure({
      apiKey,
      appUserID: appUserId,
    });
    initialized = true;
    currentUserId = appUserId ?? null;
    return;
  }

  if (appUserId && appUserId !== currentUserId) {
    await Purchases.logIn({ appUserID: appUserId });
    currentUserId = appUserId;
  }
}

export async function purchaseMonthly(): Promise<{ success: boolean; error?: string; cancelled?: boolean }> {
  if (!isNative() || !initialized) {
    return { success: false, error: 'Kjøp er kun tilgjengelig i appen' };
  }
  try {
    const pkg = await getPackage('monthly');
    const { customerInfo } = await Purchases.purchasePackage({ aPackage: pkg });
    return { success: await handlePurchaseResult(customerInfo) };
  } catch (err: unknown) {
    const e = err as { userCancelled?: boolean; message?: string };
    if (e.userCancelled) return { success: false, cancelled: true };
    return { success: false, error: e.message || 'Kjøpet feilet' };
  }
}

export async function purchaseYearly(): Promise<{ success: boolean; error?: string; cancelled?: boolean }> {
  if (!isNative() || !initialized) {
    return { success: false, error: 'Kjøp er kun tilgjengelig i appen' };
  }
  try {
    const pkg = await getPackage('yearly');
    const { customerInfo } = await Purchases.purchasePackage({ aPackage: pkg });
    return { success: await handlePurchaseResult(customerInfo) };
  } catch (err: unknown) {
    const e = err as { userCancelled?: boolean; message?: string };
    if (e.userCancelled) return { success: false, cancelled: true };
    return { success: false, error: e.message || 'Kjøpet feilet' };
  }
}

export async function restorePurchases(): Promise<{ success: boolean; error?: string }> {
  if (!isNative() || !initialized) {
    return { success: false, error: 'Gjenoppretting er kun tilgjengelig i appen' };
  }
  try {
    const { customerInfo } = await Purchases.restorePurchases();
    const active = await handlePurchaseResult(customerInfo);
    return { success: active, error: active ? undefined : 'Ingen tidligere kjøp funnet' };
  } catch (err: unknown) {
    const e = err as { message?: string };
    return { success: false, error: e.message || 'Kunne ikke gjenopprette kjøp' };
  }
}

export async function getOfferingPrices(): Promise<{ monthly?: string; yearly?: string }> {
  if (!isNative() || !initialized) return {};
  try {
    const packages = await getCurrentPackages();
    const monthly = packages.find((p) => p.identifier.toLowerCase().includes('month'));
    const yearly = packages.find((p) =>
      p.identifier.toLowerCase().includes('year') ||
      p.identifier.toLowerCase().includes('annual'),
    );
    return {
      monthly: monthly?.product.priceString,
      yearly: yearly?.product.priceString,
    };
  } catch {
    return {};
  }
}
