// deno-lint-ignore-file
// Admin-only push broadcast. Talks directly to APNs (HTTP/2 + JWT ES256).
// No Expo Push dependency.
//
// Required Supabase Edge Function secrets:
//   APNS_KEY_P8        full content of the .p8 file (-----BEGIN... -----END...)
//   APNS_KEY_ID        10-char Key ID from Apple Developer
//   APNS_TEAM_ID       10-char Team ID from Apple Developer
//   APNS_BUNDLE_ID     com.bodybyyou.app
//   APNS_USE_SANDBOX   "true" while building from Xcode (debug), "false" once shipped via App Store

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

let cachedJwt: { value: string; exp: number } | null = null;

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
  if (!title || !message) return json({ error: 'title et body requis' }, 400);

  // Service-role client to read all push_tokens for broadcast and write history
  const admin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  // Persist a history row so users can see this in their inbox even if APNs fails or is offline
  await admin.from('notifications').insert({
    title,
    body: message,
    data: body.data ?? null,
  });

  let q = admin
    .from('push_tokens')
    .select('expo_token, platform, user_id')
    .eq('platform', 'ios');
  if (body.user_ids?.length) q = q.in('user_id', body.user_ids);

  const { data: rows, error: rowsErr } = await q;
  if (rowsErr) {
    console.error('push_tokens read error', rowsErr);
    return json({ error: 'Erreur lecture tokens' }, 500);
  }

  const tokens = (rows ?? [])
    .map((r) => (r.expo_token as string) ?? '')
    .map((t) => t.replace(/\s+/g, ''))
    .filter((t) => t && /^[0-9a-fA-F]+$/.test(t));

  if (tokens.length === 0) {
    return json({ sent: 0, errors: 0, total: 0, message: 'Aucun token APNs.' });
  }

  let jwt: string;
  try {
    jwt = await getApnsJwt();
  } catch (e: any) {
    console.error('JWT error', e);
    return json({ error: 'JWT signing failed: ' + (e?.message ?? '') }, 500);
  }

  const sandbox = (Deno.env.get('APNS_USE_SANDBOX') ?? 'true') === 'true';
  const host = sandbox ? 'api.sandbox.push.apple.com' : 'api.push.apple.com';
  const bundleId = Deno.env.get('APNS_BUNDLE_ID')!;

  const payload = JSON.stringify({
    aps: {
      alert: { title, body: message },
      sound: 'default',
    },
    ...((body.data as object) ?? {}),
  });

  let sent = 0;
  let errors = 0;
  const failures: { token: string; status: number; reason?: string }[] = [];

  for (const token of tokens) {
    try {
      const res = await fetch(`https://${host}/3/device/${token}`, {
        method: 'POST',
        headers: {
          authorization: `bearer ${jwt}`,
          'apns-topic': bundleId,
          'apns-push-type': 'alert',
          'apns-priority': '10',
          'content-type': 'application/json',
        },
        body: payload,
      });
      if (res.ok) {
        sent += 1;
      } else {
        errors += 1;
        const reason = await res.text().catch(() => '');
        failures.push({ token: token.slice(0, 8) + '…', status: res.status, reason });
      }
    } catch (e: any) {
      errors += 1;
      failures.push({ token: token.slice(0, 8) + '…', status: 0, reason: e?.message });
    }
  }

  return json({ sent, errors, total: tokens.length, failures });
});

async function getApnsJwt(): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  if (cachedJwt && cachedJwt.exp > now + 60) return cachedJwt.value;

  const p8 = Deno.env.get('APNS_KEY_P8');
  const keyId = Deno.env.get('APNS_KEY_ID');
  const teamId = Deno.env.get('APNS_TEAM_ID');
  if (!p8 || !keyId || !teamId) {
    throw new Error('Missing APNS_KEY_P8 / APNS_KEY_ID / APNS_TEAM_ID secret');
  }

  const pemBody = p8
    .replace('-----BEGIN PRIVATE KEY-----', '')
    .replace('-----END PRIVATE KEY-----', '')
    .replace(/\s+/g, '');
  const pkcs8 = base64ToBytes(pemBody);

  const cryptoKey = await crypto.subtle.importKey(
    'pkcs8',
    pkcs8,
    { name: 'ECDSA', namedCurve: 'P-256' },
    false,
    ['sign'],
  );

  const header = { alg: 'ES256', kid: keyId };
  const payload = { iss: teamId, iat: now };
  const enc = new TextEncoder();
  const headerB64 = b64url(enc.encode(JSON.stringify(header)));
  const payloadB64 = b64url(enc.encode(JSON.stringify(payload)));
  const signingInput = enc.encode(`${headerB64}.${payloadB64}`);

  const sigRaw = await crypto.subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' },
    cryptoKey,
    signingInput,
  );
  const sigB64 = b64url(new Uint8Array(sigRaw));
  const value = `${headerB64}.${payloadB64}.${sigB64}`;
  cachedJwt = { value, exp: now + 30 * 60 };
  return value;
}

function base64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function b64url(buf: Uint8Array): string {
  let str = '';
  for (const b of buf) str += String.fromCharCode(b);
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });
}
