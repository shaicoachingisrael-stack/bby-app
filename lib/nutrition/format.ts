import type { IngredientUnit, MealType, Recipe } from '@/lib/types';

import type { Rhythm } from './prefs';

type T = (key: string, opts?: Record<string, unknown>) => string;

export const MEALS: MealType[] = ['petit_dejeuner', 'dejeuner', 'diner', 'collation'];

export const mealLabel = (t: T, m: MealType | string | null | undefined) =>
  m ? t(`v2nutrition.meal.${m}`) : '';

/** Le repas « du moment » (mis en avant en carte claire) : selon l'heure. */
export function currentMeal(now = new Date()): MealType {
  const h = now.getHours() + now.getMinutes() / 60;
  if (h < 10.5) return 'petit_dejeuner';
  if (h < 15) return 'dejeuner';
  if (h < 18.5) return 'collation';
  return 'diner';
}

export const round = (n: number | null | undefined) => Math.round(Number(n ?? 0));

/** « P 38 · L 22 · G 45 » */
export const plg = (t: T, p: number | null | undefined, l: number | null | undefined, g: number | null | undefined) =>
  t('v2nutrition.common.plg', { p: round(p), l: round(l), g: round(g) });

export const hasMacros = (r: Pick<Recipe, 'protein_g' | 'fat_g' | 'carbs_g'>) =>
  !!(r.protein_g || r.fat_g || r.carbs_g);

/** « 20 min · P 38 · L 22 · G 45 » (morceaux absents omis). */
export function recipeMeta(t: T, r: Recipe) {
  const parts: string[] = [];
  if (r.prep_min) parts.push(t('v2nutrition.common.minutes', { n: r.prep_min }));
  if (hasMacros(r)) parts.push(plg(t, r.protein_g, r.fat_g, r.carbs_g));
  return parts.join(' · ');
}

/** 1760 → « 1 760 » */
export function fmtInt(n: number, lang: string) {
  try {
    return Math.round(n).toLocaleString(lang).replace(/[  ,]/g, ' ');
  } catch {
    return `${Math.round(n)}`.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  }
}

/** 1200 → « 1,2 » (séparateur décimal de la langue). */
export function liters(ml: number, lang: string, step = 0.1) {
  const v = Math.round(ml / 1000 / step) * step;
  const s = (Math.round(v * 10) / 10).toString();
  return ['en', 'he'].includes(lang.slice(0, 2)) ? s : s.replace('.', ',');
}

function cap(s: string) {
  return s ? s[0].toLocaleUpperCase() + s.slice(1) : s;
}

/** « Jeu. 8 oct. » */
export function shortDate(d: Date, lang: string) {
  try {
    return cap(d.toLocaleDateString(lang, { weekday: 'short', day: 'numeric', month: 'short' }));
  } catch {
    return `${d.getDate()}/${d.getMonth() + 1}`;
  }
}

/** « Jeudi 8 octobre » */
export function longDate(d: Date, lang: string) {
  try {
    return cap(d.toLocaleDateString(lang, { weekday: 'long', day: 'numeric', month: 'long' }));
  } catch {
    return `${d.getDate()}/${d.getMonth() + 1}`;
  }
}

/** Lettres du bandeau de jours (lundi → dimanche) dans la langue. */
export function weekLetters(lang: string) {
  const base = new Date(2024, 0, 1); // un lundi
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(base);
    d.setDate(base.getDate() + i);
    try {
      return cap(d.toLocaleDateString(lang, { weekday: 'narrow' }));
    } catch {
      return ['L', 'M', 'M', 'J', 'V', 'S', 'D'][i];
    }
  });
}

/** Lundi = 0 … dimanche = 6 (convention de menu_items.day). */
export const dayIndex = (d: Date) => (d.getDay() + 6) % 7;

export const rhythmLabel = (t: T, r: Rhythm) => t(`v2nutrition.rhythm.${r}.title`);

/** Unité affichée : « g », « c. à soupe »… (vide = à la pièce). */
export const unitLabel = (t: T, unit: IngredientUnit | null) => (unit ? t(`v2nutrition.unit.${unit}`) : '');
