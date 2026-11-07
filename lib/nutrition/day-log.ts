import { useCallback, useEffect, useState } from 'react';

import { useAuth } from '@/lib/auth-provider';
import { supabase } from '@/lib/supabase';
import type { MealType } from '@/lib/types';

export type LogEntry = {
  id: string;
  meal_type: MealType;
  title: string | null;
  quantity_label: string | null;
  kcal: number | null;
  protein_g: number | null;
  carbs_g: number | null;
  fat_g: number | null;
  recipe_id: string | null;
  eaten_at: string;
};

export type LogItem = {
  title: string;
  quantityLabel: string;
  protein: number;
  fat: number;
  carb: number;
  kcal: number;
  recipeId?: string | null;
};

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

/** Journal du jour (mode suivi) : repas notés et hydratation. */
export function useDayLog() {
  const { user } = useAuth();
  const [entries, setEntries] = useState<LogEntry[]>([]);
  const [waterMl, setWaterMl] = useState(0);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) {
      setEntries([]);
      setWaterMl(0);
      setLoading(false);
      return;
    }
    const since = startOfToday();
    const [meals, water] = await Promise.all([
      supabase
        .from('meal_entries')
        .select('id, meal_type, title, quantity_label, kcal, protein_g, carbs_g, fat_g, recipe_id, eaten_at')
        .eq('user_id', user.id)
        .gte('eaten_at', since)
        .order('eaten_at'),
      supabase.from('hydration_entries').select('ml').eq('user_id', user.id).gte('logged_at', since),
    ]);
    if (meals.error) console.warn('meal_entries fetch', meals.error);
    if (water.error) console.warn('hydration fetch', water.error);
    setEntries((meals.data as LogEntry[] | null) ?? []);
    setWaterMl((water.data ?? []).reduce((a, h: any) => a + (h.ml ?? 0), 0));
    setLoading(false);
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const addWater = useCallback(
    async (ml: number) => {
      if (!user) return;
      setWaterMl((w) => w + ml);
      const { error } = await supabase.from('hydration_entries').insert({ user_id: user.id, ml });
      if (error) {
        setWaterMl((w) => w - ml);
        throw error;
      }
    },
    [user],
  );

  const removeEntry = useCallback(
    async (id: string) => {
      setEntries((prev) => prev.filter((e) => e.id !== id));
      const { error } = await supabase.from('meal_entries').delete().eq('id', id);
      if (error) {
        await refresh();
        throw error;
      }
    },
    [refresh],
  );

  return { entries, waterMl, loading, refresh, addWater, removeEntry };
}

/** Ajoute une portion au repas visé. Les macros sont stockées en entiers. */
export async function addLogItem(userId: string, meal: MealType, item: LogItem) {
  const { error } = await supabase.from('meal_entries').insert({
    user_id: userId,
    meal_type: meal,
    title: item.title,
    quantity_label: item.quantityLabel,
    kcal: Math.round(item.kcal),
    protein_g: Math.round(item.protein),
    fat_g: Math.round(item.fat),
    carbs_g: Math.round(item.carb),
    recipe_id: item.recipeId ?? null,
  });
  if (error) throw error;
}

/** Derniers aliments notés (sans doublons), pour l'onglet « Récents ». */
export async function fetchRecentItems(userId: string, limit = 20): Promise<LogItem[]> {
  const { data, error } = await supabase
    .from('meal_entries')
    .select('title, quantity_label, kcal, protein_g, carbs_g, fat_g, recipe_id')
    .eq('user_id', userId)
    .not('title', 'is', null)
    .order('eaten_at', { ascending: false })
    .limit(120);
  if (error) console.warn('recent meals', error);
  const seen = new Set<string>();
  const out: LogItem[] = [];
  for (const r of (data as any[] | null) ?? []) {
    const key = `${r.title}|${r.quantity_label ?? ''}`.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({
      title: r.title,
      quantityLabel: r.quantity_label ?? '',
      kcal: r.kcal ?? 0,
      protein: r.protein_g ?? 0,
      fat: r.fat_g ?? 0,
      carb: r.carbs_g ?? 0,
      recipeId: r.recipe_id,
    });
    if (out.length >= limit) break;
  }
  return out;
}
