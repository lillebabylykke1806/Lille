import { NextResponse } from 'next/server';
import { behandleAppStoreHendelse } from '../../lib/ios/retention';
import { supabaseAdmin } from '../../lib/supabaseAdmin';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function authOk(header: string | null): boolean {
  const value = (header || '').trim();
  const secrets = [process.env.CRON_SECRET, process.env.REVENUECAT_WEBHOOK_AUTH]
    .map((s) => s?.trim())
    .filter((s): s is string => Boolean(s));
  return secrets.some((secret) => value === secret || value === `Bearer ${secret}`);
}

export async function POST(req: Request) {
  if (!authOk(req.headers.get('authorization'))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: { payload?: unknown; event?: unknown; userId?: string | null };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const payload = body.payload ?? body.event ?? body;
  const userId = typeof body.userId === 'string' ? body.userId : null;
  const result = await behandleAppStoreHendelse(supabaseAdmin(), { payload, userId });
  return NextResponse.json(result);
}
