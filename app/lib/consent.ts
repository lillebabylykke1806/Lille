import { supabase } from './supabase';
import { sikreProfilerRad } from './profilId';

export const CONSENT_VERSION = '2026-01';
export const VILKAR_URL = 'https://lilleapp.no/vilkar';
export const PERSONVERN_URL = 'https://lilleapp.no/personvern';

export async function lagreSamtykkeVedRegistrering(
  userId: string,
  markedsforing: boolean,
  email?: string | null,
  locale?: string | null,
): Promise<void> {
  await sikreProfilerRad(userId, locale);
  const now = new Date().toISOString();

  const { error } = await supabase
    .from('profiler')
    .update({
      vilkaar_godtatt_tid: now,
      vilkaar_versjon: CONSENT_VERSION,
      personvern_godtatt_tid: now,
      personvern_versjon: CONSENT_VERSION,
      markedsforing_samtykke: markedsforing,
      markedsforing_samtykke_at: now,
      markedsforing_samtykke_kilde: 'registration',
    })
    .eq('id', userId);

  if (error) {
    console.error('lagreSamtykkeVedRegistrering failed:', error.message);
  }

  if (markedsforing && email) {
    void fetch('/api/nyhetsbrev', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    }).catch(() => {});
  }
}
