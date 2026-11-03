import { epostRedirect, lesEpostToken } from '../../../lib/email/hmac';
import { supabaseAdmin } from '../../../lib/supabaseAdmin';
import { isReason } from '../../../lib/email/templates';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const form = await req.formData();
  const raw = String(form.get('t') || '');
  const comment = String(form.get('comment') || '').slice(0, 2000);
  const token = lesEpostToken(raw, 'feedback');
  if (!token) return epostRedirect(req, '/e-post/tilbakemelding', raw);

  const reason = token.r && isReason(token.r) ? token.r : 'other';
  await supabaseAdmin().from('cancellation_feedback').insert({
    user_id: token.u,
    reason,
    comment: comment || null,
    source: 'email',
  });

  return epostRedirect(req, '/e-post/tilbakemelding', raw, { ok: '1' });
}
