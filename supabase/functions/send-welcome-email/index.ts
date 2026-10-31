import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const APP_URL = 'https://www.lilleapp.no';
const FROM_NO = 'Isabella fra Lille <post@lilleapp.no>';
const FROM_EN = 'Isabella at Lille <post@lilleapp.no>';
const REPLY_TO = 'post@lilleapp.no';

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function authOk(header: string | null, secret: string): boolean {
  if (!secret) return false;
  const value = (header || '').trim();
  return value === secret || value === `Bearer ${secret}`;
}

function velgSpråk(locale: unknown): 'no' | 'en' {
  return locale === 'no' ? 'no' : 'en';
}

function mal(språk: 'no' | 'en') {
  if (språk === 'no') {
    return {
      from: FROM_NO,
      subject: 'Velkommen til Lille 🤍',
      text: `Hei 🤍

Jeg heter Isabella, og jeg har laget Lille. Jeg ville bare ønske deg personlig velkommen!

Som mamma til tre vet jeg hvor overveldende de første månedene kan være. Det er nettopp derfor jeg lagde Lille.

Mitt beste tips? Start i det små. Registrer babyens søvn, se etter mønstre, og la Lille hjelpe deg å forstå den lille verdenen deres.

Så glad for at du er her!

Klem,
Isabella
Gründer av Lille

Åpne Lille: ${APP_URL}`,
      html: htmlMal({
        hilsen: 'Hei 🤍',
        avsnitt: [
          'Jeg heter Isabella, og jeg har laget Lille. Jeg ville bare ønske deg personlig velkommen!',
          'Som mamma til tre vet jeg hvor overveldende de første månedene kan være. Det er nettopp derfor jeg lagde Lille.',
          'Mitt beste tips? Start i det små. Registrer babyens søvn, se etter mønstre, og la Lille hjelpe deg å forstå den lille verdenen deres.',
          'Så glad for at du er her!',
        ],
        signatur: 'Klem,<br/>Isabella<br/>Gründer av Lille',
        knapp: 'Åpne Lille',
      }),
    };
  }

  return {
    from: FROM_EN,
    subject: 'Welcome to Lille 🤍',
    text: `Hi there 🤍

I'm Isabella, the founder of Lille, and I just wanted to personally welcome you!

As a mum of three, I know how overwhelming those early months can feel. That's exactly why I created Lille.

My biggest tip? Start small. Log your baby's sleep, explore their patterns and let Lille help you understand their little world.

I'm so happy you're here!

Love,
Isabella
Founder of Lille

Open Lille: ${APP_URL}`,
    html: htmlMal({
      hilsen: 'Hi there 🤍',
      avsnitt: [
        "I'm Isabella, the founder of Lille, and I just wanted to personally welcome you!",
        "As a mum of three, I know how overwhelming those early months can feel. That's exactly why I created Lille.",
        "My biggest tip? Start small. Log your baby's sleep, explore their patterns and let Lille help you understand their little world.",
        "I'm so happy you're here!",
      ],
      signatur: 'Love,<br/>Isabella<br/>Founder of Lille',
      knapp: 'Open Lille',
    }),
  };
}

function htmlMal(innhold: {
  hilsen: string;
  avsnitt: string[];
  signatur: string;
  knapp: string;
}) {
  const avsnittHtml = innhold.avsnitt
    .map(
      (p) =>
        `<p style="margin:0 0 16px;font-size:16px;line-height:1.65;color:#3D2B1F;font-family:Georgia,serif;">${p}</p>`,
    )
    .join('');

  return `<!DOCTYPE html>
<html lang="en">
<body style="margin:0;padding:0;background:#F5EFE6;">
  <div style="max-width:520px;margin:0 auto;padding:32px 20px;">
    <div style="background:#FDFAF6;border:1px solid #E0D5C5;border-radius:20px;padding:28px 24px;">
      <p style="margin:0 0 8px;font-size:13px;letter-spacing:0.08em;text-transform:uppercase;color:#2D5C45;font-family:system-ui,sans-serif;font-weight:700;">Lille</p>
      <h1 style="margin:0 0 20px;font-size:24px;line-height:1.3;color:#3D2B1F;font-family:Georgia,serif;">${innhold.hilsen}</h1>
      ${avsnittHtml}
      <p style="margin:8px 0 24px;font-size:16px;line-height:1.65;color:#3D2B1F;font-family:Georgia,serif;">${innhold.signatur}</p>
      <a href="${APP_URL}" style="display:inline-block;background:#2D5C45;color:#FDFAF6;text-decoration:none;padding:14px 24px;border-radius:999px;font-weight:600;font-family:system-ui,sans-serif;font-size:15px;">${innhold.knapp}</a>
    </div>
  </div>
</body>
</html>`;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  const secret = Deno.env.get('WELCOME_EMAIL_WEBHOOK_SECRET') ?? '';
  if (!authOk(req.headers.get('authorization'), secret)) {
    return jsonResponse({ error: 'Unauthorized' }, 401);
  }

  let payload: Record<string, unknown>;
  try {
    payload = await req.json();
  } catch {
    return jsonResponse({ error: 'Invalid JSON' }, 400);
  }

  const record = (payload.record ?? {}) as Record<string, unknown>;
  const userId = typeof record.id === 'string' ? record.id : null;
  if (!userId) {
    console.log('send-welcome-email: skip, missing profiler.id');
    return jsonResponse({ ok: true, skipped: 'no_id' });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const resendKey = Deno.env.get('RESEND_API_KEY') ?? '';
  const admin = createClient(supabaseUrl, serviceKey);

  const { data: userData, error: userError } = await admin.auth.admin.getUserById(userId);
  if (userError || !userData?.user) {
    console.log('send-welcome-email: skip, auth user not found', userId);
    return jsonResponse({ ok: true, skipped: 'no_user' });
  }

  const user = userData.user;
  const source = (user.user_metadata as { source?: string } | null)?.source;
  if (source === 'stripe_checkout_recovery') {
    console.log('send-welcome-email: skip, stripe/orphan recovery', userId);
    return jsonResponse({ ok: true, skipped: 'recovery' });
  }

  const createdAt = user.created_at ? new Date(user.created_at).getTime() : 0;
  const under24t = Date.now() - createdAt < 24 * 60 * 60 * 1000;
  if (!under24t) {
    console.log('send-welcome-email: skip, account older than 24h', userId);
    return jsonResponse({ ok: true, skipped: 'too_old' });
  }

  const email = user.email?.trim();
  if (!email) {
    console.log('send-welcome-email: skip, no email', userId);
    return jsonResponse({ ok: true, skipped: 'no_email' });
  }

  const { data: eksisterende } = await admin
    .from('email_log')
    .select('id')
    .eq('user_id', userId)
    .eq('email_type', 'welcome')
    .maybeSingle();

  if (eksisterende?.id) {
    console.log('send-welcome-email: skip, already sent', userId);
    return jsonResponse({ ok: true, skipped: 'already_sent' });
  }

  if (!resendKey) {
    console.error('send-welcome-email: RESEND_API_KEY missing');
    return jsonResponse({ error: 'Email not configured' }, 500);
  }

  const { error: lockError } = await admin.from('email_log').insert({
    user_id: userId,
    email_type: 'welcome',
  });
  if (lockError) {
    if (lockError.code === '23505') {
      return jsonResponse({ ok: true, skipped: 'already_sent' });
    }
    console.error('send-welcome-email: email_log insert failed', lockError.message);
    return jsonResponse({ error: 'Could not log email' }, 500);
  }

  const språk = velgSpråk(record.locale);
  const innhold = mal(språk);

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${resendKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: innhold.from,
      to: [email],
      reply_to: REPLY_TO,
      subject: innhold.subject,
      html: innhold.html,
      text: innhold.text,
    }),
  });

  if (!res.ok) {
    const detalj = await res.text();
    console.error('send-welcome-email: Resend failed', detalj);
    await admin.from('email_log').delete().eq('user_id', userId).eq('email_type', 'welcome');
    return jsonResponse({ error: 'Send failed' }, 500);
  }

  const sendt = (await res.json()) as { id?: string };
  if (sendt.id) {
    await admin
      .from('email_log')
      .update({ resend_id: sendt.id })
      .eq('user_id', userId)
      .eq('email_type', 'welcome');
  }

  return jsonResponse({ ok: true });
});
