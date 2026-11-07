import { supabase } from '@/lib/supabase';
import type { MealType, MenuItem, Recipe } from '@/lib/types';

import { MEALS } from './format';

// Les ingrédients suivent tout seuls dans la liste de courses : les déclencheurs
// de menu_items réagissent à l'ajout et à la suppression (pas à la modification),
// donc un échange = supprimer puis insérer.

/** Place une recette sur un créneau (remplace ce qui s'y trouvait). */
export async function setSlot(userId: string, day: number, meal: MealType, recipeId: string, current: MenuItem[]) {
  const old = current.filter((m) => m.day === day && m.meal_type === meal).map((m) => m.id);
  if (old.length) {
    const del = await supabase.from('menu_items').delete().in('id', old);
    if (del.error) throw del.error;
  }
  const { error } = await supabase.from('menu_items').insert({ user_id: userId, day, meal_type: meal, recipe_id: recipeId });
  if (error) throw error;
}

export async function clearSlot(ids: string[]) {
  if (!ids.length) return;
  const { error } = await supabase.from('menu_items').delete().in('id', ids);
  if (error) throw error;
}

/** Une autre recette du même créneau (au hasard), différente de l'actuelle. */
export function alternativeFor(recipes: Recipe[], meal: MealType, excludeId?: string | null): Recipe | null {
  const pool = recipes.filter((r) => r.meal_type === meal && r.id !== excludeId);
  if (!pool.length) return null;
  return pool[Math.floor(Math.random() * pool.length)];
}

function shuffle<T>(a: T[]) {
  const out = [...a];
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/**
 * Recompose la semaine : pour chaque jour et chaque créneau (snack compris), une
 * recette du bon type, en tournant pour espacer les répétitions. Un créneau sans
 * recette du bon type reste vide. Renvoie le nombre de repas placés.
 */
export async function regenerateWeek(userId: string, recipes: Recipe[]) {
  const plan: { user_id: string; day: number; meal_type: MealType; recipe_id: string }[] = [];
  for (const meal of MEALS) {
    const pool = shuffle(recipes.filter((r) => r.meal_type === meal));
    if (!pool.length) continue;
    for (let day = 0; day < 7; day += 1) plan.push({ user_id: userId, day, meal_type: meal, recipe_id: pool[day % pool.length].id });
  }
  if (!plan.length) return 0;
  const del = await supabase.from('menu_items').delete().eq('user_id', userId);
  if (del.error) throw del.error;
  const { error } = await supabase.from('menu_items').insert(plan);
  if (error) throw error;
  return plan.length;
}
