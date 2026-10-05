// deno-lint-ignore-file
// translate-content: takes (table, id), reads the FR source from the row,
// asks GPT-4o-mini to produce { en, he, es, ru } translations of the
// translatable fields, and writes them into the `i18n` jsonb column.
//
// Called by:
//   - DB trigger after insert/update on programs/sessions/recipes/mindset_content
//   - Backfill admin RPC (see migration 018)
//   - Future admin UI "Retraduire" button

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
if (!OPENAI_API_KEY) console.error('OPENAI_API_KEY env var is missing');

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const TARGET_LOCALES = ['en', 'he', 'es', 'ru'] as const;
type Locale = (typeof TARGET_LOCALES)[number];

const LOCALE_NAMES: Record<Locale, string> = {
  en: 'English',
  he: 'Hebrew',
  es: 'Spanish',
  ru: 'Russian',
};

const FIELDS_BY_TABLE: Record<string, string[]> = {
  programs: ['title', 'description'],
  sessions: ['title', 'description'],
  recipes: ['title', 'description', 'ingredients'],
  mindset_content: ['title', 'body'],
  mindset_ritual_catalog: ['label'],
  mindset_programs: ['title', 'subtitle', 'description'],
  mindset_program_steps: ['title', 'prompt_text'],
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405, headers: CORS });
  }

  try {
    const body = (await req.json().catch(() => ({}))) as {
      table?: string;
      id?: string;
    };
    const table = body.table;
    const id = body.id;
    if (!table || !id || !(table in FIELDS_BY_TABLE)) {
      return json({ error: 'Invalid table or id' }, 400);
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const fields = FIELDS_BY_TABLE[table];
    const { data: row, error: fetchErr } = await supabase
      .from(table)
      .select(['id', ...fields].join(', '))
      .eq('id', id)
      .maybeSingle();
    if (fetchErr || !row) {
      console.error('row fetch', fetchErr);
      return json({ error: 'Row not found' }, 404);
    }

    const source: Record<string, string> = {};
    for (const f of fields) {
      const v = (row as any)[f];
      if (typeof v === 'string' && v.trim().length > 0) source[f] = v;
    }
    if (Object.keys(source).length === 0) {
      return json({ ok: true, skipped: 'no source text' });
    }

    const prompt = [
      'You translate fitness/nutrition/mindfulness app content from French to four target languages.',
      'Translate naturally and concisely; keep the same warm, motivating tone; preserve newlines and punctuation.',
      'For Hebrew, write in Hebrew script (no transliteration).',
      'For Russian, write in Cyrillic.',
      'Keep brand names (BBY, Body by you) as-is.',
      'Keep numeric values (e.g., "150 g", "5 min") as-is, but translate units when appropriate.',
      '',
      'Return STRICT JSON in this shape:',
      '{ "en": { ...same keys as source... }, "he": {...}, "es": {...}, "ru": {...} }',
      'No markdown, no commentary — only the JSON object.',
      '',
      'Source (French):',
      JSON.stringify(source, null, 2),
    ].join('\n');

    const aiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        response_format: { type: 'json_object' },
        temperature: 0.3,
        messages: [
          { role: 'system', content: 'You are a precise translator. Output only valid JSON.' },
          { role: 'user', content: prompt },
        ],
      }),
    });

    if (!aiRes.ok) {
      const err = await aiRes.text();
      console.error('OpenAI error', aiRes.status, err);
      return json({ error: 'AI provider error' }, 502);
    }
    const aiData = await aiRes.json();
    const raw = aiData.choices?.[0]?.message?.content;
    if (!raw) return json({ error: 'Empty AI response' }, 502);

    let parsed: Record<Locale, Record<string, string>>;
    try {
      parsed = JSON.parse(raw);
    } catch {
      return json({ error: 'AI returned invalid JSON' }, 502);
    }

    const i18n: Record<string, Record<string, string>> = {};
    for (const loc of TARGET_LOCALES) {
      const block = parsed[loc];
      if (!block || typeof block !== 'object') continue;
      const clean: Record<string, string> = {};
      for (const f of fields) {
        const v = block[f];
        if (typeof v === 'string' && v.trim().length > 0) clean[f] = v;
      }
      if (Object.keys(clean).length > 0) i18n[loc] = clean;
    }

    const { error: updErr } = await supabase
      .from(table)
      .update({ i18n })
      .eq('id', id);
    if (updErr) {
      console.error('update', updErr);
      return json({ error: 'DB update failed' }, 500);
    }

    return json({ ok: true, locales: Object.keys(i18n), source_keys: Object.keys(source) });
  } catch (e: any) {
    console.error('translate-content fatal', e);
    return json({ error: e?.message ?? 'Unknown error' }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });
}
