import type { SupabaseClient } from '@supabase/supabase-js';

export async function harRegistrertTilbake30(
  admin: SupabaseClient,
  userId: string,
): Promise<boolean> {
  const { data } = await admin
    .from('retention_offers')
    .select('user_id')
    .eq('user_id', userId)
    .maybeSingle();
  return Boolean(data?.user_id);
}

export async function registrerTilbake30(
  admin: SupabaseClient,
  opts: { userId: string; offerType: string; stripeSubscriptionId?: string | null },
): Promise<void> {
  const { error } = await admin.from('retention_offers').insert({
    user_id: opts.userId,
    offer_type: opts.offerType,
    stripe_subscription_id: opts.stripeSubscriptionId ?? null,
  });
  if (error && error.code !== '23505') {
    console.error('retention_offers insert failed', error.message);
  }
}
