// Backfill DB content translations by calling the deployed
// translate-content edge function for every row in the 4 tables.
//
// Usage:
//   node scripts/backfill-translations.mjs
//
// Reads EXPO_PUBLIC_SUPABASE_URL + EXPO_PUBLIC_SUPABASE_ANON_KEY from .env.local

import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = join(__dirname, '..', '.env.local');
const env = Object.fromEntries(
  readFileSync(envPath, 'utf8')
    .split('\n')
    .filter((l) => l && !l.startsWith('#') && l.includes('='))
    .map((l) => {
      const i = l.indexOf('=');
      return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
    }),
);

const SUPABASE_URL = env.EXPO_PUBLIC_SUPABASE_URL;
const ANON_KEY = env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
const SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !ANON_KEY || !SERVICE_KEY) {
  throw new Error('Missing supabase env vars (need URL, ANON_KEY, SERVICE_ROLE_KEY)');
}

const TABLES = ['programs', 'sessions', 'recipes', 'mindset_content'];

async function fetchIds(table) {
  const url = `${SUPABASE_URL}/rest/v1/${table}?select=id`;
  const r = await fetch(url, {
    headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` },
  });
  if (!r.ok) throw new Error(`fetch ${table}: ${r.status} ${await r.text()}`);
  return r.json();
}

async function translate(table, id) {
  const r = await fetch(`${SUPABASE_URL}/functions/v1/translate-content`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${SERVICE_KEY}`,
    },
    body: JSON.stringify({ table, id }),
  });
  const text = await r.text();
  if (!r.ok) {
    console.error(`  ✗ ${table}/${id}: ${r.status} ${text}`);
    return false;
  }
  console.log(`  ✓ ${table}/${id}: ${text}`);
  return true;
}

let total = 0;
let ok = 0;
for (const table of TABLES) {
  const rows = await fetchIds(table);
  console.log(`\n${table}: ${rows.length} row(s)`);
  for (const row of rows) {
    total++;
    if (await translate(table, row.id)) ok++;
  }
}
console.log(`\nDone: ${ok}/${total} translated`);
