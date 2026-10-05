import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { supabase } from './supabase';

// Même clé que shopping_name_key() côté base : minuscules, espaces resserrés.
export function ingredientNameKey(name: string): string {
  return name.toLowerCase().trim().replace(/\s+/g, ' ');
}

type Row = { name_key: string; i18n: Record<string, { name?: string }> | null };

// Dictionnaire des noms d'ingrédients. Le français est la langue source : rien à
// charger. Dans une autre langue, `tr(nom)` rend la traduction quand elle existe,
// sinon le nom d'origine (recette perso, article ajouté à la main, pas encore traduit).
export function useIngredientNames() {
  const { i18n } = useTranslation();
  const lang = i18n.language.slice(0, 2);
  const [dict, setDict] = useState<Record<string, string>>({});

  useEffect(() => {
    if (lang === 'fr') {
      setDict({});
      return;
    }
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase.from('ingredient_names').select('name_key, i18n');
      if (error) console.warn('ingredient_names fetch', error);
      if (cancelled) return;
      const next: Record<string, string> = {};
      for (const row of (data as Row[] | null) ?? []) {
        const v = row.i18n?.[lang]?.name;
        if (typeof v === 'string' && v.trim()) next[row.name_key] = v;
      }
      setDict(next);
    })();
    return () => {
      cancelled = true;
    };
  }, [lang]);

  const tr = useCallback((name: string) => dict[ingredientNameKey(name)] ?? name, [dict]);
  return { tr };
}
