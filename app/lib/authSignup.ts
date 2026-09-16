/** Detect when signUp fails because the email is already registered.
 *
 * Case A (email confirmation OFF): Supabase returns an error.
 * Case B (email confirmation ON): Supabase returns "success" with empty identities
 * to avoid leaking which emails exist — we still treat it as already registered.
 */
export function erAlleredeRegistrert(
  error: { code?: string; message?: string } | null | undefined,
  user: { identities?: unknown[] | null } | null | undefined,
): boolean {
  const alleredeRegistrertA =
    error?.code === 'user_already_exists' ||
    (error?.message?.toLowerCase().includes('already registered') ?? false);

  const alleredeRegistrertB =
    !error && !!user && (user.identities?.length ?? 0) === 0;

  return alleredeRegistrertA || alleredeRegistrertB;
}
