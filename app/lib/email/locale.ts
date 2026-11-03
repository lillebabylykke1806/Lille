import { supabaseAdmin } from '../supabaseAdmin';

export type EpostSpråk = 'no' | 'en';

export function velgEpostSpråk(locale: unknown): EpostSpråk {
  return locale === 'no' ? 'no' : 'en';
}

export async function epostSpråkForBruker(userId: string | null | undefined): Promise<EpostSpråk> {
  if (!userId) return 'en';
  const { data } = await supabaseAdmin().from('profiler').select('locale').eq('id', userId).maybeSingle();
  return velgEpostSpråk(data?.locale);
}
