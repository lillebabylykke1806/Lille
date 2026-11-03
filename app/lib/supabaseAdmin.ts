import { createClient, type SupabaseClient } from '@supabase/supabase-js';

export function supabaseAdmin(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !service) throw new Error('Supabase admin not configured');
  return createClient(url, service, { auth: { persistSession: false } });
}

export async function findUserIdByEmail(admin: SupabaseClient, email: string): Promise<string | null> {
  const needle = email.trim().toLowerCase();
  let page = 1;
  for (;;) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw error;
    const hit = data.users.find((u) => u.email?.trim().toLowerCase() === needle);
    if (hit) return hit.id;
    if (data.users.length < 1000) return null;
    page += 1;
  }
}
