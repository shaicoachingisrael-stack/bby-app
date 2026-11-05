// deno-lint-ignore-file
// Admin push broadcast, plus `to: 'coach'` (any signed-in client notifies the admins). Talks directly to APNs (HTTP/2 + JWT ES256).
// No Expo Push dependency.
//
// Required Supabase Edge Function secrets:
//   APNS_KEY_P8        full content of the .p8 file (-----BEGIN... -----END...)
//   APNS_KEY_ID        10-char Key ID from Apple Developer
//   APNS_TEAM_ID       10-char Team ID from Apple Developer
//   APNS_BUNDLE_ID     com.bodybyyou.app
//   APNS_USE_SANDBOX   "true" = try the sandbox first (Xcode builds); both servers are tried anyway

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
    .select('is_admin, display_name')
    .eq('id', user.id)
    .maybeSingle();

  const body = (await req.json().catch(() => ({}))) as {
    title?: string;
    body?: string;
    user_ids?: string[];
    data?: Record<string, unknown>;
    to?: 'coach';
  };

  // Service-role client to read push_tokens and write history
  const admin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  let title: string;
  let message: string;
  let data: Record<string, unknown> = body.data ?? {};
  let targetIds: string[] | null = body.user_ids?.length ? body.user_ids : null;

  if (body.to === 'coach') {
    // Une cliente prévient la coach : nouveau message ou « Je suis intéressée ».
    // Texte et lien fixés ici (la cliente ne choisit rien), seulement vers les admins,
    // et sans ligne dans `notifications` (la boîte que lisent toutes les clientes).
    const name = (profile?.display_name ?? '').trim() || 'Une cliente';
    title = 'Nouveau message';
    message = `${name} t’a écrit dans BBY.`;
    data = { url: `/(admin)/client-chat/${user.id}` };
    const { data: admins } = await admin.from('profiles').select('id').eq('is_admin', true);
    targetIds = (admins ?? []).map((a) => a.id as string);
    if (targetIds.length === 0) return json({ sent: 0, errors: 0, total: 0 });
  } else {
    if (!profile?.is_admin) return json({ error: 'Forbidden' }, 403);
    title = (body.title ?? '').trim();
    message = (body.body ?? '').trim();
    if (!title || !message) return json({ error: 'title et body requis' }, 400);
    // Persist a history row so users can see this in their inbox even if APNs fails or is offline
    await admin.from('notifications').insert({ title, body: message, data: body.data ?? null });
  }

  let q = admin
    .from('push_tokens')
    .select('expo_token, platform, user_id')
    .eq('platform', 'ios');
  if (targetIds) q = q.in('user_id', targetIds);

  const { data: rows, error: rowsErr } = await q;
  if (rowsErr) {
    console.error('push_tokens read error', rowsErr);
    return json({ error: 'Erreur lecture tokens' }, 500);
  }

  const tokens = [
    ...new Set(
      (rows ?? [])
        .map((r) => ((r.expo_token as string) ?? '').replace(/\s+/g, ''))
        .filter((t) => t && /^[0-9a-fA-F]+$/.test(t)),
    ),
  ];

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

  const bundleId = Deno.env.get('APNS_BUNDLE_ID')!;
  // expo-notifications ne remonte à l'app que la clé `body` du message : les données
  // (dont `url`, l'écran à ouvrir) y vont, et restent aussi à la racine.
  const payload = JSON.stringify({
    aps: {
      alert: { title, body: message },
      sound: 'default',
    },
    ...data,
    body: data,
  });

  // Un même compte peut avoir un jeton de test (build Xcode) et un jeton de
  // production (TestFlight / App Store) : on tente la production, puis le bac à
  // sable si Apple ne reconnaît pas le jeton. Un jeton refusé des deux côtés est effacé.
  const sandboxFirst = (Deno.env.get('APNS_USE_SANDBOX') ?? 'false') === 'true';
  const hosts = sandboxFirst
    ? ['api.sandbox.push.apple.com', 'api.push.apple.com']
    : ['api.push.apple.com', 'api.sandbox.push.apple.com'];

  let sent = 0;
  let errors = 0;
  const failures: { token: string; status: number; reason?: string }[] = [];
  const dead: string[] = [];

  for (const token of tokens) {
    let delivered = false;
    let last: { status: number; reason?: string } = { status: 0 };
    for (const host of hosts) {
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
          delivered = true;
          break;
        }
        last = { status: res.status, reason: await res.text().catch(() => '') };
        // seul un jeton inconnu de ce serveur mérite l'essai sur l'autre
        if (!/BadDeviceToken|Unregistered/.test(last.reason ?? '')) break;
      } catch (e: any) {
        last = { status: 0, reason: e?.message };
        break;
      }
    }
    if (delivered) {
      sent += 1;
    } else {
      errors += 1;
      failures.push({ token: token.slice(0, 8) + '…', ...last });
      if (/BadDeviceToken|Unregistered/.test(last.reason ?? '')) dead.push(token);
    }
  }

  if (dead.length) await admin.from('push_tokens').delete().in('expo_token', dead);

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
