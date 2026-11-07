import { useCallback, useEffect, useState } from 'react';

import { useAuth } from '@/lib/auth-provider';
import { supabase } from '@/lib/supabase';

/** Recettes mises en favori (signet de la fiche recette, onglet Favoris de l'écran 3). */
export function useRecipeFavorites() {
  const { user } = useAuth();
  const [ids, setIds] = useState<Set<string>>(new Set());

  const refresh = useCallback(async () => {
    if (!user) return setIds(new Set());
    const { data, error } = await supabase.from('recipe_favorites').select('recipe_id').eq('user_id', user.id);
    if (error) console.warn('recipe_favorites fetch', error);
    setIds(new Set(((data as { recipe_id: string }[] | null) ?? []).map((r) => r.recipe_id)));
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const toggle = useCallback(
    async (recipeId: string) => {
      if (!user) return;
      const on = ids.has(recipeId);
      setIds((prev) => {
        const next = new Set(prev);
        if (on) next.delete(recipeId);
        else next.add(recipeId);
        return next;
      });
      const res = on
        ? await supabase.from('recipe_favorites').delete().eq('user_id', user.id).eq('recipe_id', recipeId)
        : await supabase.from('recipe_favorites').insert({ user_id: user.id, recipe_id: recipeId });
      if (res.error) {
        console.warn('recipe_favorites toggle', res.error);
        await refresh();
      }
    },
    [user, ids, refresh],
  );

  return { ids, toggle, refresh };
}
