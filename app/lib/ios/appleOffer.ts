export function appleAppId(): string | null {
  return process.env.APPLE_APP_ID?.trim() || null;
}

export function appleOfferKode(): string | null {
  const code = process.env.APPLE_OFFER_CODE?.trim();
  return code || null;
}

/** App Store redeem URL for the TILBAKE30 offer code. Built from env, never hardcoded. */
export function appleTilbake30Lenke(): string | null {
  const id = appleAppId();
  const code = appleOfferKode();
  if (!id || !code) return null;
  const url = new URL('https://apps.apple.com/redeem');
  url.searchParams.set('ctx', 'offercodes');
  url.searchParams.set('id', id);
  url.searchParams.set('code', code);
  return url.toString();
}
