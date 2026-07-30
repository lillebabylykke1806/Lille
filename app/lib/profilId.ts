import { supabase } from './supabase';

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function erGyldigProfilId(id: unknown): id is string {
  return typeof id === 'string' && UUID_RE.test(id);
}

/**
 * Auth user UUID for profil_id in activity tables (lurer, mat, pumping, etc.).
 * Always prefers the live Supabase session — never barn.id (numeric).
 */
export async function hentProfilId(
  aktivtBarn?: { bruker_id?: string; id?: string | number } | null,
  bruker?: { id?: string } | null,
): Promise<string | null> {
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) {
    console.warn('hentProfilId getSession error:', sessionError.message);
  }

  const sessionId = session?.user?.id;
  if (erGyldigProfilId(sessionId)) return sessionId;

  // getUser() hits the Auth server — use as second source of truth
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError) {
    console.warn('hentProfilId getUser error:', userError.message);
  }
  if (erGyldigProfilId(user?.id)) return user.id;

  if (erGyldigProfilId(bruker?.id)) return bruker.id;

  // Last resort: baby's owner auth id (same as parent). Never use barn.id.
  if (erGyldigProfilId(aktivtBarn?.bruker_id)) return aktivtBarn.bruker_id;

  console.error('hentProfilId: no valid auth UUID', {
    sessionId,
    userId: user?.id,
    brukerId: bruker?.id,
    barnBrukerId: aktivtBarn?.bruker_id,
    barnId: aktivtBarn?.id,
  });
  return null;
}

/**
 * Ensure a row exists in public.profiler for this auth user.
 * Some flows never create one on signup; mat/other FKs or app features may need it.
 */
export async function sikreProfilerRad(profilId: string): Promise<boolean> {
  if (!erGyldigProfilId(profilId)) return false;

  const { data: existing, error: selectError } = await supabase
    .from('profiler')
    .select('id')
    .eq('id', profilId)
    .maybeSingle();

  if (selectError) {
    console.warn('sikreProfilerRad select failed:', selectError.message);
  }
  if (existing?.id) return true;

  const { error: upsertError } = await supabase
    .from('profiler')
    .upsert({ id: profilId }, { onConflict: 'id' });

  if (upsertError) {
    console.error('sikreProfilerRad upsert failed:', upsertError.message, upsertError);
    return false;
  }
  console.log('sikreProfilerRad: created profiler row for', profilId);
  return true;
}
