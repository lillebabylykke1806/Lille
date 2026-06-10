import { supabase } from './supabase';

/**
 * Auth user UUID for profil_id in activity tables (lurer, mat, pumping, etc.).
 * Always prefers the live Supabase session — not barn.id from aktivtBarn.
 */
export async function hentProfilId(
  aktivtBarn?: { bruker_id?: string } | null,
  bruker?: { id?: string } | null,
) {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.user?.id ?? aktivtBarn?.bruker_id ?? bruker?.id;
}
