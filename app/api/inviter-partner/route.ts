import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

export async function POST(req: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  const resend = new Resend(process.env.RESEND_API_KEY);
  const { invitert_epost, barn_id, barn_navn, invitert_av_epost } = await req.json();

  // Lag unik kode
  const kode = Math.random().toString(36).substring(2, 10).toUpperCase();

  // Lagre invitasjon
  const { error } = await supabase.from('partner_invitasjoner').insert({
    barn_id,
    invitert_epost,
    kode,
    akseptert: false,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Send e-post via Resend
  await resend.emails.send({
    from: 'Lille <noreply@lilleapp.no>',
    to: invitert_epost,
    subject: `Du er invitert til å følge ${barn_navn} i Lille 🤍`,
    html: `
      <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 32px;">
        <h1 style="color: #2D5C45;">Hei! 🌿</h1>
        <p>${invitert_av_epost} har invitert deg til å følge <strong>${barn_navn}</strong> i appen Lille.</p>
        <p>Lille er en app som hjelper foreldre å forstå babyen sin bedre – registrer søvn, amming, signaler og mye mer.</p>
        <p>Du får tilgang til alle registreringer for ${barn_navn} uten å betale noe.</p>
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/partner?kode=${kode}" 
           style="display: inline-block; background: #2D5C45; color: white; padding: 14px 28px; border-radius: 50px; text-decoration: none; font-weight: 600; margin: 20px 0;">
          Godta invitasjon 🤍
        </a>
        <p style="color: #888; font-size: 13px;">Hvis du ikke kjenner til denne invitasjonen kan du ignorere denne e-posten.</p>
      </div>
    `,
  });

  return NextResponse.json({ success: true, kode });
}
