import { NextResponse } from 'next/server';
import { Resend } from 'resend';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const resend = new Resend(process.env.RESEND_API_KEY);
  const { melding, epost } = await req.json();

  await resend.emails.send({
    from: 'tilbakemelding@lilleapp.no',
    to: 'lillebabylykke@outlook.com',
    subject: 'Ny tilbakemelding fra Lille-appen',
    html: `
      <h2>Ny tilbakemelding</h2>
      <p><strong>Fra:</strong> ${epost || 'Anonym'}</p>
      <p><strong>Melding:</strong></p>
      <p>${melding}</p>
    `,
  });

  return NextResponse.json({ ok: true });
}