import { epostRedirect, lesEpostToken } from '../../../lib/email/hmac';
import { supabaseAdmin } from '../../../lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const form = await req.formData();
  const raw = String(form.get('t') || '');
  const token = lesEpostToken(raw, 'unsub');
  if (!token) return epostRedirect(req, '/e-post/avmelding', raw);

  await supabaseAdmin()
    .from('profiler')
    .update({
      markedsforing_samtykke: false,
      markedsforing_samtykke_at: new Date().toISOString(),
      markedsforing_samtykke_kilde: 'unsubscribe',
    })
    .eq('id', token.u);

  return epostRedirect(req, '/e-post/avmelding', raw, { ok: '1' });
}
