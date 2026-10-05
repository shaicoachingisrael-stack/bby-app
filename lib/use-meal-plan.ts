import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useAuth } from './auth-provider';
import { generateMenu } from './ingredients';
import { localize } from './localize';
import { supabase } from './supabase';
import type { MealType, MenuItem, Recipe, RecipeIngredient, ShoppingItem } from './types';

// Ingrédients structurés d'une recette (nom + quantité + unité).
export function useRecipeIngredients(recipeId: string | undefined) {
  const [ingredients, setIngredients] = useState<RecipeIngredient[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!recipeId) { setIngredients([]); setLoading(false); return; }
    const { data, error } = await supabase
      .from('recipe_ingredients')
      .select('*')
      .eq('recipe_id', recipeId)
      .order('position');
    if (error) console.warn('recipe_ingredients fetch', error);
    setIngredients((data as RecipeIngredient[] | null) ?? []);
    setLoading(false);
  }, [recipeId]);

  useEffect(() => { refresh(); }, [refresh]);
  return { ingredients, loading, refresh };
}

// Remplace d'un coup les ingrédients d'une recette ; les listes de courses des
// menus qui contiennent déjà cette recette suivent (fait côté base).
export async function saveRecipeIngredients(
  recipeId: string,
  items: { name: string; quantity: number | null; unit: string | null; aisle: string | null }[],
) {
  const { error } = await supabase.rpc('replace_recipe_ingredients', {
    p_recipe: recipeId,
    p_items: items,
  });
  if (error) throw error;
}

// Menu de la semaine : 7 jours × créneaux, composé à la main ou généré, toujours modifiable.
export function useMenu() {
  const { user } = useAuth();
  const { i18n } = useTranslation();
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) { setItems([]); setLoading(false); return; }
    const { data, error } = await supabase
      .from('menu_items')
      .select('*, recipe:recipes(*)')
      .eq('user_id', user.id)
      .order('created_at');
    if (error) console.warn('menu fetch', error);
    const rows = ((data as MenuItem[] | null) ?? []).map((m) => ({
      ...m,
      recipe: localize(m.recipe, 'recipes', i18n.language),
    }));
    setItems(rows);
    setLoading(false);
  }, [user, i18n.language]);

  useEffect(() => { refresh(); }, [refresh]);

  const add = useCallback(
    async (day: number, mealType: MealType, recipeId: string) => {
      if (!user) return;
      const { error } = await supabase
        .from('menu_items')
        .insert({ user_id: user.id, day, meal_type: mealType, recipe_id: recipeId });
      if (error) throw error;
      await refresh();
    },
    [user, refresh],
  );

  const remove = useCallback(
    async (id: string) => {
      setItems((prev) => prev.filter((m) => m.id !== id));
      const { error } = await supabase.from('menu_items').delete().eq('id', id);
      if (error) {
        console.warn('menu remove', error);
        await refresh();
      }
    },
    [refresh],
  );

  const clear = useCallback(async () => {
    if (!user) return;
    const { error } = await supabase.from('menu_items').delete().eq('user_id', user.id);
    if (error) throw error;
    await refresh();
  }, [user, refresh]);

  // Remplace le menu en cours par un menu généré à partir des recettes fournies.
  // Renvoie le nombre de repas placés (0 = aucune recette exploitable).
  const generate = useCallback(
    async (recipes: Recipe[]) => {
      if (!user) return 0;
      const plan = generateMenu(recipes);
      if (plan.length === 0) return 0;
      const del = await supabase.from('menu_items').delete().eq('user_id', user.id);
      if (del.error) throw del.error;
      const { error } = await supabase
        .from('menu_items')
        .insert(plan.map((p) => ({ ...p, user_id: user.id })));
      if (error) throw error;
      await refresh();
      return plan.length;
    },
    [user, refresh],
  );

  return { items, loading, refresh, add, remove, clear, generate };
}

// Liste de courses : elle se remplit toute seule depuis le menu (déclencheurs en
// base). Ici : lire, cocher, ajouter à la main, vider.
export function useShoppingList() {
  const { user } = useAuth();
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) { setItems([]); setLoading(false); return; }
    const { data, error } = await supabase
      .from('shopping_items')
      .select('id, name, unit, quantity, aisle, checked, manual')
      .eq('user_id', user.id)
      .order('name_key');
    if (error) console.warn('shopping fetch', error);
    setItems((data as ShoppingItem[] | null) ?? []);
    setLoading(false);
  }, [user]);

  useEffect(() => { refresh(); }, [refresh]);

  const toggle = useCallback(
    async (item: ShoppingItem) => {
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
    async (name: string, quantity: number | null, unit: string | null, aisle: string | null) => {
      const { error } = await supabase.rpc('shopping_add_manual', {
        p_name: name,
        p_quantity: quantity,
        p_unit: unit,
        p_aisle: aisle,
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
