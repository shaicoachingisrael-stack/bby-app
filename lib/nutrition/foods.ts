import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { supabase } from '@/lib/supabase';
import type { IngredientUnit } from '@/lib/types';

export type FoodItem = {
  id: string;
  name: string;
  name_key: string;
  category: string;
  portion_label: string;
  portion_type: string;
  portion_g: number;
  piece_g: number | null;
  protein_g: number;
  fat_g: number;
  carb_g: number;
  kcal: number;
  barcode: string | null;
  i18n: Record<string, { name?: string; portion?: string }> | null;
};

/** Minuscules, sans accents, œ → oe, espaces resserrés (même règle que name_key). */
export function fold(s: string) {
  return s
    .toLowerCase()
    .replace(/œ/g, 'oe')
    .replace(/æ/g, 'ae')
    .replace(/’/g, "'")
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

let cache: FoodItem[] | null = null;
let inflight: Promise<FoodItem[]> | null = null;

async function loadFoods(): Promise<FoodItem[]> {
  if (cache) return cache;
  if (!inflight) {
    inflight = (async () => {
      const { data, error } = await supabase.from('food_items').select('*').order('name');
      if (error) {
        console.warn('food_items fetch', error);
        inflight = null;
        return [];
      }
      cache = ((data as any[]) ?? []).map((r) => ({
        ...r,
        portion_g: Number(r.portion_g),
        piece_g: r.piece_g === null ? null : Number(r.piece_g),
        protein_g: Number(r.protein_g),
        fat_g: Number(r.fat_g),
        carb_g: Number(r.carb_g),
      }));
      return cache!;
    })();
  }
  return inflight;
}

export type LocalFood = FoodItem & { label: string; portion: string; keys: string[] };

/** Base d'aliments, avec le nom et la portion dans la langue de l'utilisatrice. */
export function useFoods() {
  const { i18n } = useTranslation();
  const lang = i18n.language.slice(0, 2);
  const [foods, setFoods] = useState<FoodItem[]>(cache ?? []);

  useEffect(() => {
    let alive = true;
    loadFoods().then((f) => alive && setFoods(f));
    return () => {
      alive = false;
    };
  }, []);

  const local = useMemo<LocalFood[]>(
    () =>
      foods.map((f) => {
        const tr = lang === 'fr' ? undefined : f.i18n?.[lang];
        const label = tr?.name || f.name;
        return { ...f, label, portion: tr?.portion || f.portion_label, keys: [f.name_key, fold(label)] };
      }),
    [foods, lang],
  );
  return local;
}

/** Filtrage au fil de la frappe : début de mot d'abord, puis contenu. */
export function searchFoods(foods: LocalFood[], query: string, limit = 30) {
  const q = fold(query);
  if (!q) return [];
  const starts: LocalFood[] = [];
  const contains: LocalFood[] = [];
  for (const f of foods) {
    if (f.keys.some((k) => k.startsWith(q) || k.includes(` ${q}`))) starts.push(f);
    else if (f.keys.some((k) => k.includes(q))) contains.push(f);
  }
  return [...starts, ...contains].slice(0, limit);
}

// ---------------------------------------------------------------------------
// Macros d'une recette perso à partir de ses ingrédients.

const SPOON_G: Record<string, number> = { cas: 15, cac: 5 };

/** L'aliment de la base qui correspond le mieux à un nom d'ingrédient (ou null). */
export function matchFood(foods: LocalFood[], name: string): LocalFood | null {
  // Apostrophes en espaces, et chaque mot au singulier (« pommes de terre » = « pomme de terre »).
  const norm = (s: string) =>
    s
      .replace(/'/g, ' ')
      .split(/\s+/)
      .filter(Boolean)
      .map((w) => (w.length > 3 ? w.replace(/[sx]$/, '') : w))
      .join(' ');
  const n = ` ${norm(fold(name))} `;
  if (n.trim().length < 2) return null;
  // 1) Un aliment dont le nom est contenu dans l'ingrédient : le plus long gagne
  //    (« riz complet » → « Riz complet cuit », « 2 citrons » → « Citron »).
  let best: LocalFood | null = null;
  let bestLen = 0;
  for (const f of foods) {
    for (const k of f.keys) {
      const short = norm(k).replace(/ (cuit|cuite|nature|cooked)$/, '');
      if (n.includes(` ${short} `) && short.length > bestLen) {
        best = f;
        bestLen = short.length;
      }
    }
  }
  if (best) return best;
  // 2) Sinon un aliment simple qui contient l'ingrédient : le nom le plus court,
  //    qui commence par l'ingrédient, jamais un plat composé, condiments et boissons en
  //    dernier (« lait » → lait demi-écrémé, pas lait de coco ni café au lait).
  let bestScore = Infinity;
  for (const f of foods) {
    if (f.category === 'plat') continue;
    for (const k of f.keys) {
      const kk = ` ${norm(k)} `;
      const score =
        kk.length + (kk.startsWith(n) ? 0 : 50) + (f.category === 'autre' || f.category === 'boisson' ? 100 : 0);
      if (kk.includes(n) && score < bestScore) {
        best = f;
        bestScore = score;
      }
    }
  }
  return best;
}

/** Poids en grammes d'une ligne d'ingrédient (null = impossible à estimer). */
export function gramsOf(food: FoodItem, quantity: number | null, unit: IngredientUnit | null): number | null {
  if (quantity === null) return null;
  switch (unit) {
    case 'g':
    case 'ml':
      return quantity;
    case 'kg':
    case 'l':
      return quantity * 1000;
    case 'cl':
      return quantity * 10;
    case 'cas':
    case 'cac':
      return quantity * (food.portion_type === unit ? food.portion_g : SPOON_G[unit]);
    default:
      return quantity * (food.piece_g ?? food.portion_g);
  }
}

export type Estimate = { protein: number; fat: number; carb: number; unknown: number; known: number };

/** Total des macros par portion ; `unknown` = ingrédients non reconnus. */
export function estimateMacros(
  foods: LocalFood[],
  lines: { name: string; quantity: number | null; unit: IngredientUnit | null }[],
  servings: number,
): Estimate {
  const out: Estimate = { protein: 0, fat: 0, carb: 0, unknown: 0, known: 0 };
  for (const l of lines) {
    if (!l.name.trim()) continue;
    const f = matchFood(foods, l.name);
    const g = f ? gramsOf(f, l.quantity, l.unit) : null;
    if (!f || g === null) {
      out.unknown += 1;
      continue;
    }
    const k = g / f.portion_g;
    out.protein += f.protein_g * k;
    out.fat += f.fat_g * k;
    out.carb += f.carb_g * k;
    out.known += 1;
  }
  const s = Math.max(1, servings);
  out.protein = Math.round(out.protein / s);
  out.fat = Math.round(out.fat / s);
  out.carb = Math.round(out.carb / s);
  return out;
}
