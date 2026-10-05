import { useCallback, useEffect, useState } from 'react';

import { useAuth } from './auth-provider';
import { supabase } from './supabase';

export type FavoriteType = 'content' | 'breathing';

type FavRow = { item_type: FavoriteType; item_id: string };

const key = (type: FavoriteType, id: string) => `${type}:${id}`;

// Favoris de la cliente (contenus + respirations). Set de clés "type:id" pour un
// test O(1) ; `rows` pour l'écran Favoris.
export function useFavorites() {
  const { user } = useAuth();
  const [keys, setKeys] = useState<Set<string>>(new Set());
  const [rows, setRows] = useState<FavRow[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) { setKeys(new Set()); setRows([]); setLoading(false); return; }
    setLoading(true);
    const { data, error } = await supabase
      .from('mindset_favorites')
      .select('item_type, item_id')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    if (error) console.warn('favorites fetch', error);
    const list = (data as FavRow[] | null) ?? [];
    setRows(list);
    setKeys(new Set(list.map((r) => key(r.item_type, r.item_id))));
    setLoading(false);
  }, [user]);

  useEffect(() => { refresh(); }, [refresh]);

  const isFavorite = useCallback((type: FavoriteType, id: string) => keys.has(key(type, id)), [keys]);

  const toggle = useCallback(
    async (type: FavoriteType, id: string) => {
      if (!user) return;
      const k = key(type, id);
      const was = keys.has(k);
      // Optimiste
      setKeys((prev) => {
        const next = new Set(prev);
        if (was) next.delete(k); else next.add(k);
        return next;
      });
      if (was) {
        setRows((prev) => prev.filter((r) => key(r.item_type, r.item_id) !== k));
        const { error } = await supabase
          .from('mindset_favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('item_type', type)
          .eq('item_id', id);
        if (error) console.warn('unfav', error);
      } else {
        setRows((prev) => [{ item_type: type, item_id: id }, ...prev]);
        const { error } = await supabase
          .from('mindset_favorites')
          .insert({ user_id: user.id, item_type: type, item_id: id });
        if (error) console.warn('fav', error);
      }
    },
    [user, keys],
  );

  return { keys, rows, loading, refresh, isFavorite, toggle };
}
