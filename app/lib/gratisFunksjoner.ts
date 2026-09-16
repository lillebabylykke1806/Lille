/** Single source of truth for what free users can access. */

export const GRATIS_SIDER = new Set([
  'hjem',
  'sovn',
  'sovn-morgen',
  'profil',
]);

/** Feature ids used for locks outside of full-page navigation. */
export const GRATIS_FUNKSJONER = new Set([
  'sovn.logge',
  'sovn.se_i_dag',
  'sovn.redigere',
]);

export function sideKreverPro(side: string): boolean {
  return !GRATIS_SIDER.has(side);
}

export function funksjonKreverPro(funksjonId: string): boolean {
  return !GRATIS_FUNKSJONER.has(funksjonId);
}

/** Map Viftemeny / shortcut ids to whether they need Pro. */
export function menyKreverPro(menyId: string): boolean {
  if (menyId === 'sovn') return false;
  return true;
}
