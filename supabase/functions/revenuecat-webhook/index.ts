import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const STATUS_TYPER = new Set([
  'INITIAL_PURCHASE',
  'RENEWAL',
  'CANCELLATION',
  'UNCANCELLATION',
  'BILLING_ISSUE',
  'EXPIRATION',
  'PRODUCT_CHANGE',
]);

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

function erAnonym(id: string | null | undefined): boolean {
  if (!id) return true;
  return id.startsWith('$RCAnonymousID');
}

function msTilIso(ms: unknown): string | null {
  if (typeof ms !== 'number' || !Number.isFinite(ms)) return null;
  return new Date(ms).toISOString();
}

function statusFraType(type: string): {
  status: string;
  will_renew: boolean;
} | null {
  switch (type) {
    case 'INITIAL_PURCHASE':
    case 'RENEWAL':
    case 'UNCANCELLATION':
    case 'PRODUCT_CHANGE':
      return { status: 'active', will_renew: true };
    case 'CANCELLATION':
      return { status: 'cancelled', will_renew: false };
    case 'BILLING_ISSUE':
      return { status: 'billing_issue', will_renew: true };
    case 'EXPIRATION':
      return { status: 'expired', will_renew: false };
    default:
      return null;
  }
}

async function finnBrukerId(
  admin: ReturnType<typeof createClient>,
  kandidater: string[],
): Promise<string | null> {
  for (const rå of kandidater) {
    if (erAnonym(rå) || !UUID_RE.test(rå)) continue;
    const { data, error } = await admin.auth.admin.getUserById(rå);
    if (!error && data?.user?.id) return data.user.id;
  }
  return null;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  const secret = Deno.env.get('REVENUECAT_WEBHOOK_AUTH') ?? '';
  if (!authOk(req.headers.get('authorization'), secret)) {
    return jsonResponse({ error: 'Unauthorized' }, 401);
  }

  let payload: Record<string, unknown>;
  try {
    payload = await req.json();
  } catch {
    return jsonResponse({ error: 'Invalid JSON' }, 400);
  }

  const event = (payload.event ?? payload) as Record<string, unknown>;
  const eventId = typeof event.id === 'string' ? event.id : null;
  if (!eventId) {
    return jsonResponse({ error: 'Missing event.id' }, 400);
  }

  const type = typeof event.type === 'string' ? event.type : 'UNKNOWN';
  const appUserId = typeof event.app_user_id === 'string' ? event.app_user_id : null;
  const originalId =
    typeof event.original_app_user_id === 'string' ? event.original_app_user_id : null;
  const aliases = Array.isArray(event.aliases)
    ? event.aliases.filter((a): a is string => typeof a === 'string')
    : [];

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const admin = createClient(supabaseUrl, serviceKey);

  const userId = await finnBrukerId(admin, [appUserId || '', ...aliases, originalId || '']);

  const { error: insertError } = await admin.from('subscription_events').insert({
    event_id: eventId,
    user_id: userId,
    app_user_id: appUserId,
    type,
    store: typeof event.store === 'string' ? event.store : null,
    product_id: typeof event.product_id === 'string' ? event.product_id : null,
    period_type: typeof event.period_type === 'string' ? event.period_type : null,
    event_at: msTilIso(event.event_timestamp_ms),
    expiration_at: msTilIso(event.expiration_at_ms),
    raw: payload,
  });

  if (insertError) {
    if (insertError.code === '23505') {
      return jsonResponse({ ok: true, duplicate: true });
    }
    console.error('subscription_events insert failed', insertError.message);
    return jsonResponse({ error: 'Could not store event' }, 500);
  }

  const store = typeof event.store === 'string' ? event.store : null;
  const stripeFraRevenueCat = store?.toUpperCase() === 'STRIPE';
  const appStore = store?.toUpperCase() === 'APP_STORE';

  const offerCode =
    typeof event.offer_code === 'string' ? event.offer_code.trim() : '';
  const appleOffer = (Deno.env.get('APPLE_OFFER_CODE') ?? '').trim();
  if (userId && appStore && offerCode && appleOffer && offerCode.toLowerCase() === appleOffer.toLowerCase()) {
    const { error: offerError } = await admin.from('retention_offers').insert({
      user_id: userId,
      offer_type: 'apple',
    });
    if (offerError && offerError.code !== '23505') {
      console.error('retention_offers apple insert failed', offerError.message);
    }
  }

  if (appStore && userId) {
    const appUrl = (Deno.env.get('APP_URL') || Deno.env.get('NEXT_PUBLIC_APP_URL') || 'https://www.lilleapp.no').replace(/\/$/, '');
    const mailSecret = Deno.env.get('CRON_SECRET') || secret;
    try {
      await fetch(`${appUrl}/api/ios-retention`, {
        method: 'POST',
        headers: {
          authorization: `Bearer ${mailSecret}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify({ payload, userId }),
      });
    } catch (err) {
      console.error('ios-retention notify failed', err);
    }
  }

  // Stripe-abonnementer eies av stripe-webhook: lagre hendelsen, ikke status/e-post.
  if (!stripeFraRevenueCat && type !== 'TEST' && STATUS_TYPER.has(type) && userId) {
    const mapped = statusFraType(type);
    if (mapped) {
      const period = typeof event.period_type === 'string' ? event.period_type : '';
      const { error: statusError } = await admin.from('subscription_status').upsert(
        {
          user_id: userId,
          status: mapped.status,
          store,
          product_id: typeof event.product_id === 'string' ? event.product_id : null,
          is_trial: period.toUpperCase() === 'TRIAL',
          will_renew: mapped.will_renew,
          expires_at: msTilIso(event.expiration_at_ms),
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' },
      );
      if (statusError) {
        console.error('subscription_status upsert failed', statusError.message);
      }
    }
  }

  return jsonResponse({ ok: true });
});
