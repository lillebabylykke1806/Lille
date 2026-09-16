import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

const PROFIL_TABELLER = [
  'lurer',
  'amming',
  'bleie',
  'milepæler',
  'mat',
  'pumping',
  'uro_logg',
  'notater',
  'temperatur',
  'medisin_logg',
  'medisin',
  'vaksiner',
  'melkelager',
  'aktiviteter',
  'signaler',
  'vekt',
] as const;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return jsonResponse({ error: 'You need to be logged in' }, 401);
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await supabaseUser.auth.getUser();
    if (authError || !user) {
      return jsonResponse({ error: 'Invalid login' }, 401);
    }

    const userId = user.id;
    const admin = createClient(supabaseUrl, supabaseServiceKey);

    const { data: barnRader } = await admin
      .from('barn')
      .select('id')
      .eq('bruker_id', userId);

    const barnIds = (barnRader ?? []).map((b: { id: string | number }) => b.id);

    if (barnIds.length > 0) {
      await admin.from('partner_invitasjoner').delete().in('barn_id', barnIds);
      await admin.from('barn_tilgang').delete().in('barn_id', barnIds);
    }

    await admin.from('barn_tilgang').delete().eq('bruker_id', userId);
    await admin.from('redemptions').delete().eq('app_user_id', userId);

    for (const tabell of PROFIL_TABELLER) {
      const { error } = await admin.from(tabell).delete().eq('profil_id', userId);
      if (error) {
        console.warn(`delete-account: ${tabell}:`, error.message);
      }
    }

    await admin.from('barn').delete().eq('bruker_id', userId);
    await admin.from('profiler').delete().eq('id', userId);

    try {
      const { data: files } = await admin.storage.from('babybilde').list(userId);
      if (files && files.length > 0) {
        await admin.storage
          .from('babybilde')
          .remove(files.map((f) => `${userId}/${f.name}`));
      }
    } catch (storageErr) {
      console.warn('delete-account storage:', storageErr);
    }

    const { error: deleteAuthError } = await admin.auth.admin.deleteUser(userId);
    if (deleteAuthError) {
      console.error('delete-account auth:', deleteAuthError.message);
      return jsonResponse({ error: 'Could not delete account' }, 500);
    }

    return jsonResponse({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Something went wrong';
    console.error('delete-account:', message);
    return jsonResponse({ error: message }, 500);
  }
});
