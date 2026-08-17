import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Stripe from 'https://esm.sh/stripe@14?target=deno';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const ENTITLEMENT_ID = 'Lille Pro';
const STRIPE_PRICE_ID = 'price_1TYWt8CjOZUfHkd4gsvnkpov';
const APP_URL = 'https://www.lilleapp.no';

type DiscountCode = {
  code: string;
  type: 'ambassador_free' | 'customer_discount';
  stripe_promo_code_id: string | null;
  active: boolean;
  max_redemptions: number | null;
};

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function grantAmbassadorAccess(userId: string, email: string): Promise<void> {
  const rcKey = Deno.env.get('REVENUECAT_SECRET_API_KEY');
  if (!rcKey) throw new Error('RevenueCat er ikke konfigurert');

  const encodedEntitlement = encodeURIComponent(ENTITLEMENT_ID);
  const baseUrl = `https://api.revenuecat.com/v1/subscribers/${userId}`;

  const promoRes = await fetch(`${baseUrl}/entitlements/${encodedEntitlement}/promotional`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${rcKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ duration: 'lifetime' }),
  });

  if (!promoRes.ok) {
    const err = await promoRes.text();
    throw new Error(`RevenueCat promotional feilet: ${err}`);
  }

  const attrRes = await fetch(`${baseUrl}/attributes`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${rcKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      attributes: { $email: { value: email } },
    }),
  });

  if (!attrRes.ok) {
    const err = await attrRes.text();
    throw new Error(`RevenueCat attributt feilet: ${err}`);
  }
}

async function createDiscountCheckout(
  email: string,
  userId: string,
  promoCodeId: string,
  code: string,
): Promise<string> {
  const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
  if (!stripeKey) throw new Error('Stripe er ikke konfigurert');

  const stripe = new Stripe(stripeKey, { apiVersion: '2023-10-16' });

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer_email: email,
    line_items: [{ price: STRIPE_PRICE_ID, quantity: 1 }],
    discounts: [{ promotion_code: promoCodeId }],
    subscription_data: {
      metadata: { app_user_id: userId },
    },
    success_url: `${APP_URL}/bekreftelse?kode=${encodeURIComponent(code)}`,
    cancel_url: `${APP_URL}/kode?c=${encodeURIComponent(code)}`,
  });

  if (!session.url) throw new Error('Kunne ikke opprette Stripe Checkout');
  return session.url;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Metode ikke tillatt' }, 405);
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return jsonResponse({ error: 'Du må være logget inn' }, 401);
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await supabaseUser.auth.getUser();
    if (authError || !user) {
      return jsonResponse({ error: 'Ugyldig innlogging' }, 401);
    }

    const { code: rawCode } = await req.json();
    const code = typeof rawCode === 'string' ? rawCode.trim().toUpperCase() : '';
    if (!code) {
      return jsonResponse({ error: 'Mangler kode' }, 400);
    }

    const userId = user.id;
    const email = user.email ?? '';

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: discountCode, error: codeError } = await supabase
      .from('discount_codes')
      .select('code, type, stripe_promo_code_id, active, max_redemptions')
      .eq('code', code)
      .single();

    if (codeError || !discountCode) {
      return jsonResponse({ error: 'Ugyldig kode' });
    }

    const dc = discountCode as DiscountCode;

    if (!dc.active) {
      return jsonResponse({ error: 'Ugyldig kode' });
    }

    if (dc.max_redemptions != null) {
      const { count } = await supabase
        .from('redemptions')
        .select('id', { count: 'exact', head: true })
        .eq('code', code)
        .eq('status', 'fulfilled');

      if (count != null && count >= dc.max_redemptions) {
        return jsonResponse({ error: 'Koden er brukt opp' });
      }
    }

    const { data: existingByEmail } = await supabase
      .from('redemptions')
      .select('id')
      .eq('code', code)
      .eq('email', email)
      .in('status', ['pending', 'fulfilled']);

    const { data: existingByUser } = await supabase
      .from('redemptions')
      .select('id')
      .eq('code', code)
      .eq('app_user_id', userId)
      .in('status', ['pending', 'fulfilled']);

    if ((existingByEmail && existingByEmail.length > 0) || (existingByUser && existingByUser.length > 0)) {
      return jsonResponse({ error: 'Du har allerede brukt denne koden' });
    }

    const { data: redemption, error: insertError } = await supabase
      .from('redemptions')
      .insert({
        code,
        email,
        app_user_id: userId,
        status: 'pending',
      })
      .select('id')
      .single();

    if (insertError || !redemption) {
      return jsonResponse({ error: 'Kunne ikke starte innløsning' }, 500);
    }

    const redemptionId = redemption.id;

    try {
      if (dc.type === 'ambassador_free') {
        await grantAmbassadorAccess(userId, email);

        await supabase
          .from('profiler')
          .update({ stripe_subscription_status: 'active' })
          .eq('id', userId);

        await supabase
          .from('redemptions')
          .update({ status: 'fulfilled' })
          .eq('id', redemptionId);

        return jsonResponse({
          success: true,
          type: 'ambassador_free',
          message: 'Du har nå gratis tilgang for alltid! Åpne appen og logg inn med denne kontoen.',
        });
      }

      if (dc.type === 'customer_discount') {
        if (!dc.stripe_promo_code_id) {
          throw new Error('Rabattkoden mangler Stripe-konfigurasjon');
        }

        const checkoutUrl = await createDiscountCheckout(
          email,
          userId,
          dc.stripe_promo_code_id,
          code,
        );

        await supabase
          .from('redemptions')
          .update({ status: 'fulfilled' })
          .eq('id', redemptionId);

        return jsonResponse({
          success: true,
          type: 'customer_discount',
          checkoutUrl,
        });
      }

      throw new Error('Ukjent kodetype');
    } catch (err) {
      await supabase
        .from('redemptions')
        .update({ status: 'failed' })
        .eq('id', redemptionId);

      const message = err instanceof Error ? err.message : 'Noe gikk galt';
      return jsonResponse({ error: message }, 500);
    }
  } catch (err) {
    console.error('redeem-code error:', err);
    return jsonResponse({ error: 'Noe gikk galt — prøv igjen om litt' }, 500);
  }
});
