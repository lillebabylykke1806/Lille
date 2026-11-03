import { appleOfferKode } from './appleOffer';

export function rcHendelseFraPayload(payload: unknown): Record<string, unknown> | null {
  if (!payload || typeof payload !== 'object') return null;
  const root = payload as Record<string, unknown>;
  if (root.event && typeof root.event === 'object') return root.event as Record<string, unknown>;
  return root;
}

export function rcErLive(event: Record<string, unknown>): boolean {
  return String(event.environment || '').toUpperCase() === 'PRODUCTION';
}

export function rcErAppStore(event: Record<string, unknown>): boolean {
  return String(event.store || '').toUpperCase() === 'APP_STORE';
}

export function offerKoderFraRc(payload: unknown): string[] {
  const found: string[] = [];
  const seen = new Set<string>();

  const visit = (value: unknown) => {
    if (value == null) return;
    if (Array.isArray(value)) {
      for (const item of value) visit(item);
      return;
    }
    if (typeof value !== 'object') return;
    for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
      if (/offer_code/i.test(key) && typeof nested === 'string' && nested.trim()) {
        const code = nested.trim();
        const keyId = code.toLowerCase();
        if (!seen.has(keyId)) {
          seen.add(keyId);
          found.push(code);
        }
      } else {
        visit(nested);
      }
    }
  };

  visit(payload);
  return found;
}

export function rcEventHarTilbake30(payload: unknown): boolean {
  const forventet = appleOfferKode()?.toLowerCase();
  if (!forventet) return false;
  return offerKoderFraRc(payload).some((code) => code.toLowerCase() === forventet);
}
