export function erÅrsprodukt(productId: string | null | undefined): boolean {
  const id = (productId || '').toLowerCase();
  if (!id) return false;
  return /year|annual|årlig|aarlig/.test(id);
}

export function erMånedsprodukt(productId: string | null | undefined): boolean {
  const id = (productId || '').toLowerCase();
  if (!id) return false;
  if (erÅrsprodukt(id)) return false;
  return /month|mnd|måned|maaned/.test(id);
}

export function erMånedsabonnement(opts: {
  productId?: string | null;
  purchasedAtMs?: number | null;
  expirationAtMs?: number | null;
}): boolean {
  if (erÅrsprodukt(opts.productId)) return false;
  if (erMånedsprodukt(opts.productId)) return true;
  const purchased = opts.purchasedAtMs;
  const exp = opts.expirationAtMs;
  if (typeof purchased === 'number' && typeof exp === 'number' && exp > purchased) {
    const days = (exp - purchased) / 86_400_000;
    if (days >= 300) return false;
    if (days >= 25 && days <= 40) return true;
  }
  return false;
}
