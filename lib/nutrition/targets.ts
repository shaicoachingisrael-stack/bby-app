import { useMemo } from 'react';

import type { NutritionTargets } from '@/lib/use-nutrition-targets';
import { useNutritionTargets } from '@/lib/use-nutrition-targets';
import { useProfile } from '@/lib/use-profile';

import { useNutritionPrefs, type Rhythm } from './prefs';

export type DayTargets = { protein: number; fat: number; carb: number; kcal: number; waterMl: number };

// Ajustement selon le rythme du moment : un peu moins d'énergie en perte de gras
// (jamais sous le métabolisme de base), un peu plus en prise de masse. Les
// protéines montent légèrement dans les deux cas, les glucides comblent le reste.
const ENERGY: Record<Rhythm, number> = { perte_de_gras: 0.9, maintien: 1, prise_de_masse: 1.1 };
const PROTEIN: Record<Rhythm, number> = { perte_de_gras: 1.1, maintien: 1, prise_de_masse: 1.05 };

export const kcalOf = (p: number, l: number, g: number) => 4 * p + 9 * l + 4 * g;

export function computeTargets(
  t: NutritionTargets | null,
  fallback: { kcal: number | null; protein: number | null; water: number | null },
  rhythm: Rhythm,
): DayTargets | null {
  const baseKcal = t?.calories ?? fallback.kcal ?? null;
  let p = t?.protein_g ?? fallback.protein ?? null;
  let l = t?.fats_g ?? null;
  let g = t?.carbs_g ?? null;
  if (baseKcal === null && (p === null || l === null || g === null)) return null;
  // Répartition par défaut quand seules les calories sont connues.
  if (p === null) p = Math.round((baseKcal! * 0.25) / 4);
  if (l === null) l = Math.round((baseKcal! * 0.3) / 9);
  if (g === null) g = Math.max(0, Math.round((baseKcal! - 4 * p - 9 * l) / 4));
  // Macros d'abord : l'énergie de départ est celle des macros enregistrées.
  const kcal0 = kcalOf(p, l, g);

  let P = p;
  let L = l;
  let G = g;
  if (rhythm !== 'maintien') {
    let kcal = kcal0 * ENERGY[rhythm];
    if (t?.bmr && kcal < t.bmr) kcal = t.bmr;
    P = Math.round(p * PROTEIN[rhythm]);
    L = Math.round(l * ENERGY[rhythm]);
    // Les glucides absorbent l'écart d'énergie restant.
    G = Math.max(0, Math.round(g + (kcal - kcal0 - 4 * (P - p) - 9 * (L - l)) / 4));
  }
  return {
    protein: P,
    fat: L,
    carb: G,
    kcal: Math.round(kcalOf(P, L, G) / 10) * 10,
    waterMl: t?.water_ml ?? fallback.water ?? 2000,
  };
}

/** Repères du jour affichés (écrans 1 et 2), selon le rythme du moment. */
export function useDayTargets() {
  const { targets, refresh, loading } = useNutritionTargets();
  const { profile } = useProfile();
  const { rhythm } = useNutritionPrefs();
  const day = useMemo(
    () =>
      computeTargets(
        targets,
        {
          kcal: profile?.daily_kcal_target ?? null,
          protein: profile?.protein_target_g ?? null,
          water: profile?.hydration_target_ml ?? null,
        },
        rhythm,
      ),
    [targets, profile?.daily_kcal_target, profile?.protein_target_g, profile?.hydration_target_ml, rhythm],
  );
  return { targets: day, refresh, loading };
}

/**
 * La cliente change elle-même ses repères (« Modifier le profil ») : l'écran Nutrition lit
 * nutrition_targets, on y reporte donc ses chiffres. Calories et protéines viennent d'elle,
 * les lipides sont gardés, les glucides comblent le reste (jamais sous zéro).
 */
export async function applyOwnTargets(
  userId: string,
  t: { kcal: number | null; protein: number | null; water: number | null },
) {
  const { supabase } = await import('@/lib/supabase');
  const { data } = await supabase
    .from('nutrition_targets')
    .select('calories, protein_g, fats_g, carbs_g, water_ml')
    .eq('user_id', userId)
    .maybeSingle();
  const cur = data as { calories: number | null; protein_g: number | null; fats_g: number | null; carbs_g: number | null; water_ml: number | null } | null;
  const kcal = t.kcal ?? cur?.calories ?? null;
  const protein = t.protein ?? cur?.protein_g ?? (kcal ? Math.round((kcal * 0.25) / 4) : null);
  let fats = cur?.fats_g ?? (kcal ? Math.round((kcal * 0.3) / 9) : null);
  let carbs = cur?.carbs_g ?? null;
  if (kcal !== null && protein !== null && fats !== null) {
    // Lipides plafonnés si les calories ne suffisent plus, puis glucides = le reste.
    fats = Math.min(fats, Math.max(0, Math.floor((kcal - 4 * protein) / 9)));
    carbs = Math.max(0, Math.round((kcal - 4 * protein - 9 * fats) / 4));
  }
  const { error } = await supabase.from('nutrition_targets').upsert(
    {
      user_id: userId,
      calories: kcal,
      protein_g: protein,
      fats_g: fats,
      carbs_g: carbs,
      water_ml: t.water ?? cur?.water_ml ?? null,
      computed_at: new Date().toISOString(),
    },
    { onConflict: 'user_id' },
  );
  if (error) throw error;
}
