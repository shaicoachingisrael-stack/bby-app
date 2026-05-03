import { useCallback, useEffect, useState } from 'react';

import { supabase } from './supabase';
import { useAuth } from './auth-provider';

export type DaySummary = {
  meals: {
    petit_dejeuner: { kcal: number; protein: number; logged: boolean };
    dejeuner: { kcal: number; protein: number; logged: boolean };
    diner: { kcal: number; protein: number; logged: boolean };
    collation: { kcal: number; protein: number; logged: boolean };
    total_kcal: number;
    total_protein: number;
  };
  hydration_ml: number;
  session_completed_today: boolean;
  mindset_intention: string | null;
};

const EMPTY: DaySummary = {
  meals: {
    petit_dejeuner: { kcal: 0, protein: 0, logged: false },
    dejeuner: { kcal: 0, protein: 0, logged: false },
    diner: { kcal: 0, protein: 0, logged: false },
    collation: { kcal: 0, protein: 0, logged: false },
    total_kcal: 0,
    total_protein: 0,
  },
  hydration_ml: 0,
  session_completed_today: false,
  mindset_intention: null,
};

function startOfDay() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

export function useDayData() {
  const { user } = useAuth();
  const [data, setData] = useState<DaySummary>(EMPTY);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) {
      setData(EMPTY);
      setLoading(false);
      return;
    }
    setLoading(true);
    const since = startOfDay();
    const [mealsRes, hydrationRes, sessionRes, mindsetRes] = await Promise.all([
      supabase
        .from('meal_entries')
        .select('meal_type, kcal, protein_g')
        .eq('user_id', user.id)
        .gte('eaten_at', since),
      supabase
        .from('hydration_entries')
        .select('ml')
        .eq('user_id', user.id)
        .gte('logged_at', since),
      supabase
        .from('session_completions')
        .select('id')
        .eq('user_id', user.id)
        .gte('started_at', since)
        .not('completed_at', 'is', null)
        .limit(1),
      supabase
        .from('mindset_entries')
        .select('body, kind')
        .eq('user_id', user.id)
        .eq('kind', 'intention')
        .gte('created_at', since)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

    const meals = { ...EMPTY.meals };
    for (const m of mealsRes.data ?? []) {
      const slot = meals[m.meal_type as keyof typeof meals];
      if (slot && typeof slot === 'object' && 'kcal' in slot) {
        slot.kcal += m.kcal ?? 0;
        slot.protein += m.protein_g ?? 0;
        slot.logged = true;
      }
      meals.total_kcal += m.kcal ?? 0;
      meals.total_protein += m.protein_g ?? 0;
    }

    const hydration_ml =
      hydrationRes.data?.reduce((acc, h) => acc + (h.ml ?? 0), 0) ?? 0;

    setData({
      meals,
      hydration_ml,
      session_completed_today: (sessionRes.data?.length ?? 0) > 0,
      mindset_intention: mindsetRes.data?.body ?? null,
    });
    setLoading(false);
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { data, loading, refresh };
}
