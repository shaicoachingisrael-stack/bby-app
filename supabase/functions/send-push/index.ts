// deno-lint-ignore-file
// Admin-only push broadcast via Expo Push API.
// Body: { title: string, body: string, user_ids?: string[], data?: any }
// Response: { sent: number, errors: number, receipts?: any[] }

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST') return json({ error: 'Method Not Allowed' }, 405);

  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return json({ error: 'Missing Authorization' }, 401);

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } },
  );

  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();
  if (userErr || !user) return json({ error: 'Unauthorized' }, 401);

  // Caller must be admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .maybeSingle();
  if (!profile?.is_admin) return json({ error: 'Forbidden' }, 403);

  const body = (await req.json().catch(() => ({}))) as {
    title?: string;
    body?: string;
    user_ids?: string[];
    data?: Record<string, unknown>;
  };

  const title = (body.title ?? '').trim();
  const message = (body.body ?? '').trim();
  if (!title || !message) {
    return json({ error: 'title et body requis' }, 400);
  }

  // Service-role client to read all push_tokens (bypass RLS for admin broadcast)
  const admin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  let q = admin.from('push_tokens').select('expo_token, user_id');
  if (body.user_ids?.length) {
    q = q.in('user_id', body.user_ids);
  }
  const { data: rows, error: rowsErr } = await q;
  if (rowsErr) {
    console.error('push_tokens read error', rowsErr);
    return json({ error: 'Erreur lecture tokens' }, 500);
  }

  const tokens = (rows ?? [])
    .map((r) => r.expo_token)
    .filter((t) => typeof t === 'string' && t.startsWith('ExponentPushToken'));

  if (tokens.length === 0) {
    return json({ sent: 0, errors: 0, message: 'Aucun token push enregistré.' });
  }

  // Expo accepts up to 100 messages per request
  const chunks: string[][] = [];
  for (let i = 0; i < tokens.length; i += 100) {
    chunks.push(tokens.slice(i, i + 100));
  }

  let sent = 0;
  let errors = 0;
  const receipts: unknown[] = [];

  for (const chunk of chunks) {
    const messages = chunk.map((to) => ({
      to,
      title,
      body: message,
      sound: 'default',
      data: body.data ?? {},
    }));

    const res = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(messages),
    });

    if (!res.ok) {
      errors += chunk.length;
      const text = await res.text();
      console.error('expo push HTTP error', res.status, text);
      continue;
    }
    const j = await res.json();
    if (Array.isArray(j?.data)) {
      for (const r of j.data) {
        if (r?.status === 'ok') sent += 1;
        else errors += 1;
      }
      receipts.push(...j.data);
    } else {
      errors += chunk.length;
    }
  }

  return json({ sent, errors, total: tokens.length, receipts });
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });
}
