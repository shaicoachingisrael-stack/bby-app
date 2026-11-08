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
    // Persist a history row so users can see this in their inbox even if APNs fails or is offline.
    // Envoi à UNE cliente : la ligne lui est réservée (colonne user_id, migration 037) ;
    // à plusieurs clientes choisies : pas d'historique partagé (il serait lu par toutes).
    if (!targetIds) {
      await admin.from('notifications').insert({ title, body: message, data: body.data ?? null });
    } else if (targetIds.length === 1) {
      await admin.from('notifications').insert({ title, body: message, data: body.data ?? null, user_id: targetIds[0] });
    }
  }

  let q = admin
    .from('push_tokens')
    .select('expo_token, platform, user_id')
    .in('platform', ['ios', 'android']);
  if (targetIds) q = q.in('user_id', targetIds);

  const { data: rows, error: rowsErr } = await q;
  if (rowsErr) {
    console.error('push_tokens read error', rowsErr);
    return json({ error: 'Erreur lecture tokens' }, 500);
  }

  const clean = (platform: string) =>
    [
      ...new Set(
        (rows ?? [])
          .filter((r) => r.platform === platform)
          .map((r) => ((r.expo_token as string) ?? '').replace(/\s+/g, ''))
          .filter(Boolean),
      ),
    ];
  const tokens = clean('ios').filter((t) => /^[0-9a-fA-F]+$/.test(t));
  const androidTokens = clean('android');

  if (tokens.length === 0 && androidTokens.length === 0) {
    return json({ sent: 0, errors: 0, total: 0, message: 'Aucun jeton.' });
  }

  let sent = 0;
  let errors = 0;
  const failures: { token: string; status: number; reason?: string }[] = [];
  const dead: string[] = [];

  // Android : Firebase Cloud Messaging (API HTTP v1). Les données vont dans `data`,
  // que expo-notifications remonte à l'app (`url` = écran à ouvrir).
  if (androidTokens.length) {
    let access: string | null = null;
    try {
      access = await getFcmAccessToken();
    } catch (e: any) {
      console.error('FCM auth error', e);
    }
    const projectId = fcmProjectId();
    for (const token of androidTokens) {
      if (!access || !projectId) {
        errors += 1;
        failures.push({ token: token.slice(0, 8) + '…', status: 0, reason: 'FCM non configuré' });
        continue;
      }
      try {
        const res = await fetch(`https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`, {
          method: 'POST',
          headers: { authorization: `Bearer ${access}`, 'content-type': 'application/json' },
          body: JSON.stringify({
            message: {
              token,
              notification: { title, body: message },
              data: Object.fromEntries(Object.entries(data).map(([k, v]) => [k, String(v)])),
              android: { priority: 'HIGH', notification: { channel_id: 'default', sound: 'default' } },
            },
          }),
        });
        if (res.ok) {
          sent += 1;
        } else {
          const reason = await res.text().catch(() => '');
          errors += 1;
          failures.push({ token: token.slice(0, 8) + '…', status: res.status, reason });
          if (res.status === 404 || /UNREGISTERED|INVALID_ARGUMENT/.test(reason)) dead.push(token);
        }
      } catch (e: any) {
        errors += 1;
        failures.push({ token: token.slice(0, 8) + '…', status: 0, reason: e?.message });
      }
    }
  }

  if (tokens.length === 0) {
    if (dead.length) await admin.from('push_tokens').delete().in('expo_token', dead);
    return json({ sent, errors, total: androidTokens.length, failures });
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

  return json({ sent, errors, total: tokens.length + androidTokens.length, failures });
});

// --- Android (FCM) : jeton OAuth signé avec la clé du compte de service ---
let cachedFcm: { value: string; exp: number } | null = null;

function fcmServiceAccount(): { client_email: string; private_key: string; project_id: string } | null {
  const raw = Deno.env.get('FCM_SERVICE_ACCOUNT');
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function fcmProjectId() {
  return fcmServiceAccount()?.project_id ?? null;
}

async function getFcmAccessToken(): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  if (cachedFcm && cachedFcm.exp > now + 60) return cachedFcm.value;
  const sa = fcmServiceAccount();
  if (!sa) throw new Error('Missing FCM_SERVICE_ACCOUNT secret');

  const pemBody = sa.private_key
    .replace('-----BEGIN PRIVATE KEY-----', '')
    .replace('-----END PRIVATE KEY-----', '')
    .replace(/\s+/g, '');
  const key = await crypto.subtle.importKey(
    'pkcs8',
    base64ToBytes(pemBody),
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const enc = new TextEncoder();
  const header = b64url(enc.encode(JSON.stringify({ alg: 'RS256', typ: 'JWT' })));
  const claims = b64url(
    enc.encode(
      JSON.stringify({
        iss: sa.client_email,
        scope: 'https://www.googleapis.com/auth/firebase.messaging',
        aud: 'https://oauth2.googleapis.com/token',
        iat: now,
        exp: now + 3600,
      }),
    ),
  );
  const sig = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, enc.encode(`${header}.${claims}`));
  const assertion = `${header}.${claims}.${b64url(new Uint8Array(sig))}`;

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: `grant_type=${encodeURIComponent('urn:ietf:params:oauth:grant-type:jwt-bearer')}&assertion=${assertion}`,
  });
  const body = await res.json();
  if (!res.ok || !body.access_token) throw new Error('FCM token: ' + JSON.stringify(body));
  cachedFcm = { value: body.access_token, exp: now + (body.expires_in ?? 3600) };
  return cachedFcm.value;
}

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

function base64ToBytes(b64: string): Uint8Array<ArrayBuffer> {
  const bin = atob(b64);
  const out = new Uint8Array(new ArrayBuffer(bin.length));
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
