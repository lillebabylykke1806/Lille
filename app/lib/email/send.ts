import { Resend } from 'resend';
import type { SupabaseClient } from '@supabase/supabase-js';
import { velgEpostSpråk, type EpostSpråk } from './locale';
import { EPOST_REPLY_TO } from './templates';

export async function hentEpostSpråk(admin: SupabaseClient, userId: string): Promise<EpostSpråk> {
  const { data } = await admin.from('profiler').select('locale').eq('id', userId).maybeSingle();
  return velgEpostSpråk(data?.locale);
}

export async function harMarkedsforingSamtykke(admin: SupabaseClient, userId: string): Promise<boolean> {
  const { data } = await admin
    .from('profiler')
    .select('markedsforing_samtykke')
    .eq('id', userId)
    .maybeSingle();
  return data?.markedsforing_samtykke === true;
}

export function parseTestEmailAllowlist(raw: string | undefined | null): Set<string> {
  return new Set(
    (raw || '')
      .split(',')
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean),
  );
}

export function kanSendeTestEpost(email: string, livemode: boolean, allowlistRaw?: string | null): boolean {
  if (livemode) return true;
  return parseTestEmailAllowlist(allowlistRaw).has(email.trim().toLowerCase());
}

export async function sendMarkedsforing(opts: {
  admin: SupabaseClient;
  userId: string;
  email: string;
  emailType: 'cancellation' | 'winback';
  livemode: boolean;
  innhold: { from: string; subject: string; html: string; text: string };
}): Promise<'sent' | 'skipped_consent' | 'skipped_test' | 'already_sent' | 'failed'> {
  if (!kanSendeTestEpost(opts.email, opts.livemode, process.env.TEST_EMAIL_ALLOWLIST)) {
    console.log('email skip: test mode, address not on allowlist', opts.emailType, opts.userId);
    return 'skipped_test';
  }
  if (!(await harMarkedsforingSamtykke(opts.admin, opts.userId))) {
    console.log('email skip: no marketing consent', opts.emailType, opts.userId);
    return 'skipped_consent';
  }

  const { error: lockError } = await opts.admin.from('email_log').insert({
    user_id: opts.userId,
    email_type: opts.emailType,
  });
  if (lockError) {
    if (lockError.code === '23505') return 'already_sent';
    console.error('email_log insert failed', lockError.message);
    return 'failed';
  }

  const key = process.env.RESEND_API_KEY?.trim();
  if (!key) {
    await opts.admin.from('email_log').delete().eq('user_id', opts.userId).eq('email_type', opts.emailType);
    console.error('RESEND_API_KEY missing');
    return 'failed';
  }

  const resend = new Resend(key);
  const { data, error } = await resend.emails.send({
    from: opts.innhold.from,
    to: [opts.email],
    replyTo: EPOST_REPLY_TO,
    subject: opts.innhold.subject,
    html: opts.innhold.html,
    text: opts.innhold.text,
  });

  if (error) {
    console.error('Resend failed', error);
    await opts.admin.from('email_log').delete().eq('user_id', opts.userId).eq('email_type', opts.emailType);
    return 'failed';
  }

  if (data?.id) {
    await opts.admin
      .from('email_log')
      .update({ resend_id: data.id })
      .eq('user_id', opts.userId)
      .eq('email_type', opts.emailType);
  }
  return 'sent';
}
