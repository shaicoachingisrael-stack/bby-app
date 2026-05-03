// deno-lint-ignore-file
// Coach IA — proxies user messages to OpenAI GPT-4o-mini with personalized
// system prompt based on the caller's profile, persists the exchange in
// public.chat_messages and returns the assistant reply.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
if (!OPENAI_API_KEY) {
  console.error('OPENAI_API_KEY env var is missing');
}

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const GOAL_LABELS: Record<string, string> = {
  perte_de_poids: 'perte de poids',
  prise_de_masse: 'prise de masse musculaire',
  tonification: 'tonification',
  remise_en_forme: 'remise en forme',
  bien_etre: 'bien-être global',
};

const LEVEL_LABELS: Record<string, string> = {
  debutant: 'débutante',
  intermediaire: 'intermédiaire',
  avance: 'avancée',
};

function buildSystemPrompt(profile: any) {
  const name = profile?.display_name?.trim() || 'la cliente';
  const goal = profile?.goal ? GOAL_LABELS[profile.goal] ?? profile.goal : null;
  const level = profile?.fitness_level
    ? LEVEL_LABELS[profile.fitness_level] ?? profile.fitness_level
    : null;
  const kcal = profile?.daily_kcal_target;
  const protein = profile?.protein_target_g;

  let context = `La personne s'appelle ${name}.`;
  if (level) context += ` Niveau ${level}.`;
  if (goal) context += ` Objectif principal : ${goal}.`;
  if (kcal) context += ` Cible calorique journalière : ${kcal} kcal.`;
  if (protein) context += ` Cible protéines : ${protein} g.`;

  return [
    "Tu es Shai, coach personnelle bienveillante de l'app Body by you (BBY).",
    "Tu accompagnes en muscu, nutrition et mindset.",
    'Ton ton est chaleureux, motivant, sans jargon — comme une amie qui s\'y connaît.',
    'Tu réponds en français, en 2 à 4 phrases maximum (l\'app est sur mobile).',
    'Tu encourages mais tu restes réaliste et honnête.',
    'Si la question dépasse ton rôle (médical, psychologique, nutritionnel pointu), oriente vers un pro.',
    'Ne donne jamais de conseils dangereux (jeûne extrême, charge trop lourde, etc.).',
    '',
    `Contexte de la cliente : ${context}`,
  ].join('\n');
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS });
  }
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405, headers: CORS });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return json({ error: 'Missing Authorization header' }, 401);
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      return json({ error: 'Unauthorized' }, 401);
    }

    const body = (await req.json().catch(() => ({}))) as { message?: string };
    const message = (body.message ?? '').trim();
    if (!message) {
      return json({ error: 'Message vide' }, 400);
    }

    // Load profile + history in parallel
    const [profileRes, historyRes] = await Promise.all([
      supabase
        .from('profiles')
        .select('display_name, goal, fitness_level, daily_kcal_target, protein_target_g')
        .eq('id', user.id)
        .maybeSingle(),
      supabase
        .from('chat_messages')
        .select('role, content')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20),
    ]);

    const history = (historyRes.data ?? []).reverse();

    const messages = [
      { role: 'system', content: buildSystemPrompt(profileRes.data) },
      ...history.map((m) => ({ role: m.role, content: m.content })),
      { role: 'user', content: message },
    ];

    // Persist the user message immediately so it's never lost
    await supabase.from('chat_messages').insert({
      user_id: user.id,
      role: 'user',
      content: message,
    });

    const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages,
        temperature: 0.7,
        max_tokens: 400,
      }),
    });

    if (!openaiRes.ok) {
      const err = await openaiRes.text();
      console.error('OpenAI error', openaiRes.status, err);
      return json({ error: 'AI provider error' }, 502);
    }

    const data = await openaiRes.json();
    const content = data.choices?.[0]?.message?.content?.trim();
    if (!content) {
      return json({ error: 'Réponse vide' }, 502);
    }

    await supabase.from('chat_messages').insert({
      user_id: user.id,
      role: 'assistant',
      content,
    });

    return json({ content });
  } catch (e: any) {
    console.error('coach-chat fatal', e);
    return json({ error: e?.message ?? 'Erreur inconnue' }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });
}
