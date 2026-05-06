import { useCallback, useEffect, useState } from 'react';

import { useAuth } from './auth-provider';
import { supabase } from './supabase';

export type NutritionTargets = {
  user_id: string;
  bmr: number | null;
  tdee: number | null;
  calories: number | null;
  protein_g: number | null;
  carbs_g: number | null;
  fats_g: number | null;
  water_ml: number | null;
  computed_at: string | null;
};

export function useNutritionTargets() {
  const { user } = useAuth();
  const [targets, setTargets] = useState<NutritionTargets | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) {
      setTargets(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from('nutrition_targets')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();
    if (error) console.warn('nutrition_targets fetch', error);
    setTargets((data as NutritionTargets | null) ?? null);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { targets, loading, refresh };
}
