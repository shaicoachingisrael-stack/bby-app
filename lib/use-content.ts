import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { localize, localizeAll } from './localize';
import { supabase } from './supabase';
import type { MindsetContent, Program, Recipe, Session } from './types';

// Fetch all programs (catalog read is open to authenticated users)
export function usePrograms() {
  const { i18n } = useTranslation();
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('programs')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) console.warn('programs fetch', error);
    setPrograms(localizeAll(data as Program[] | null, 'programs', i18n.language));
    setLoading(false);
  }, [i18n.language]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { programs, loading, refresh };
}

// Fetch all sessions (optionally filter by program)
export function useSessions(programId?: string | null) {
  const { i18n } = useTranslation();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from('sessions')
      .select('*')
      .order('order_index', { ascending: true })
      .order('created_at', { ascending: false });
    if (programId) query = query.eq('program_id', programId);
    const { data, error } = await query;
    if (error) console.warn('sessions fetch', error);
    setSessions(localizeAll(data as Session[] | null, 'sessions', i18n.language));
    setLoading(false);
  }, [programId, i18n.language]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { sessions, loading, refresh };
}

// "Today's session" — first session in the most recent program for now.
// Later we can plug a smarter rule (current week, last completed, etc.).
export function useTodaySession() {
  const { i18n } = useTranslation();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('sessions')
      .select('*')
      .order('order_index', { ascending: true })
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) console.warn("today's session fetch", error);
    setSession(localize(data as Session | null, 'sessions', i18n.language));
    setLoading(false);
  }, [i18n.language]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { session, loading, refresh };
}

// Fetch a single program by id
export function useProgram(id: string | undefined) {
  const { i18n } = useTranslation();
  const [program, setProgram] = useState<Program | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!id) {
      setProgram(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from('programs')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (error) console.warn('program fetch', error);
    setProgram(localize(data as Program | null, 'programs', i18n.language));
    setLoading(false);
  }, [id, i18n.language]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { program, loading, refresh };
}

// Set of session_ids the current user has completed
export function useCompletedSessions() {
  const [completed, setCompleted] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('session_completions')
      .select('session_id')
      .not('session_id', 'is', null)
      .not('completed_at', 'is', null);
    if (error) console.warn('completions fetch', error);
    setCompleted(new Set((data ?? []).map((r) => r.session_id as string)));
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { completed, loading, refresh };
}

// Fetch a single session by id
export function useSession(id: string | undefined) {
  const { i18n } = useTranslation();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!id) {
      setSession(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from('sessions')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (error) console.warn('session fetch', error);
    setSession(localize(data as Session | null, 'sessions', i18n.language));
    setLoading(false);
  }, [id, i18n.language]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { session, loading, refresh };
}

// Recipes catalog
// 'bby' (défaut) = catalogue de la marque ; 'mine' = recettes personnelles ;
// 'all' = les deux (pour composer un menu).
export function useRecipes(scope: 'bby' | 'mine' | 'all' = 'bby') {
  const { i18n } = useTranslation();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('recipes')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) console.warn('recipes fetch', error);
    const all = localizeAll(data as Recipe[] | null, 'recipes', i18n.language);
    setRecipes(
      scope === 'all' ? all : all.filter((r) => (scope === 'mine' ? !!r.owner_id : !r.owner_id)),
    );
    setLoading(false);
  }, [i18n.language, scope]);

  useEffect(() => { refresh(); }, [refresh]);
  return { recipes, loading, refresh };
}

export function useRecipe(id: string | undefined) {
  const { i18n } = useTranslation();
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!id) { setRecipe(null); setLoading(false); return; }
    setLoading(true);
    const { data, error } = await supabase
      .from('recipes')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (error) console.warn('recipe fetch', error);
    setRecipe(localize(data as Recipe | null, 'recipes', i18n.language));
    setLoading(false);
  }, [id, i18n.language]);

  useEffect(() => { refresh(); }, [refresh]);
  return { recipe, loading, refresh };
}

// Mindset content catalog
export function useMindsetContent() {
  const { i18n } = useTranslation();
  const [items, setItems] = useState<MindsetContent[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('mindset_content')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) console.warn('mindset_content fetch', error);
    setItems(localizeAll(data as MindsetContent[] | null, 'mindset_content', i18n.language));
    setLoading(false);
  }, [i18n.language]);

  useEffect(() => { refresh(); }, [refresh]);
  return { items, loading, refresh };
}

export function useMindsetItem(id: string | undefined) {
  const { i18n } = useTranslation();
  const [item, setItem] = useState<MindsetContent | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!id) { setItem(null); setLoading(false); return; }
    setLoading(true);
    const { data, error } = await supabase
      .from('mindset_content')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (error) console.warn('mindset_content fetch', error);
    setItem(localize(data as MindsetContent | null, 'mindset_content', i18n.language));
    setLoading(false);
  }, [id, i18n.language]);

  useEffect(() => { refresh(); }, [refresh]);
  return { item, loading, refresh };
}
