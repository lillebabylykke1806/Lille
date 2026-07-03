import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email || typeof email !== 'string' || !email.trim()) {
      return NextResponse.json({ error: 'Ugyldig e-post' }, { status: 400 });
    }

    const apiKey = process.env.MAILCHIMP_API_KEY;
    const listId = process.env.MAILCHIMP_LIST_ID;
    const serverPrefix = process.env.MAILCHIMP_SERVER_PREFIX;

    if (!apiKey || !listId || !serverPrefix) {
      return NextResponse.json({ error: 'Mailchimp ikke konfigurert' }, { status: 500 });
    }

    const res = await fetch(
      `https://${serverPrefix}.api.mailchimp.com/3.0/lists/${listId}/members`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Basic ${Buffer.from(`anystring:${apiKey}`).toString('base64')}`,
        },
        body: JSON.stringify({
          email_address: email.trim().toLowerCase(),
          status: 'subscribed',
        }),
      },
    );

    if (res.ok) {
      return NextResponse.json({ success: true });
    }

    const data = await res.json();
    if (data?.title === 'Member Exists') {
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: data?.detail || 'Mailchimp-feil' }, { status: 500 });
  } catch {
    return NextResponse.json({ error: 'Noe gikk galt' }, { status: 500 });
  }
}
