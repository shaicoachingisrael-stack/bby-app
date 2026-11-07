import { useCallback, useEffect, useState } from 'react';

import { useAuth } from '@/lib/auth-provider';
import { guessAisle } from '@/lib/ingredients';
import { supabase } from '@/lib/supabase';
import type { ShoppingItem } from '@/lib/types';

export type ShoppingRow = ShoppingItem & { refs: number | null };

/** Liste de courses : remplie par le menu (déclencheurs en base) + articles à la main. */
export function useShopping() {
  const { user } = useAuth();
  const [items, setItems] = useState<ShoppingRow[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) {
      setItems([]);
      setLoading(false);
      return;
    }
    const { data, error } = await supabase
      .from('shopping_items')
      .select('id, name, unit, quantity, aisle, checked, manual, refs')
      .eq('user_id', user.id)
      .order('name_key');
    if (error) console.warn('shopping fetch', error);
    setItems((data as ShoppingRow[] | null) ?? []);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const toggle = useCallback(
    async (item: ShoppingRow) => {
      const next = !item.checked;
      setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, checked: next } : i)));
      const { error } = await supabase.from('shopping_items').update({ checked: next }).eq('id', item.id);
      if (error) {
        console.warn('shopping toggle', error);
        await refresh();
      }
    },
    [refresh],
  );

  const addManual = useCallback(
    async (name: string) => {
      const { error } = await supabase.rpc('shopping_add_manual', {
        p_name: name,
        p_quantity: null,
        p_unit: null,
        p_aisle: guessAisle(name),
      });
      if (error) throw error;
      await refresh();
    },
    [refresh],
  );

  const clear = useCallback(async () => {
    if (!user) return;
    setItems([]);
    const { error } = await supabase.from('shopping_items').delete().eq('user_id', user.id);
    if (error) {
      await refresh();
      throw error;
    }
  }, [user, refresh]);

  return { items, loading, refresh, toggle, addManual, clear };
}
