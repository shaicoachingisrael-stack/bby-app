import { supabase } from './supabase';

type Table =
  | 'programs'
  | 'sessions'
  | 'recipes'
  | 'ingredient_names'
  | 'mindset_content'
  | 'mindset_ritual_catalog'
  | 'mindset_programs'
  | 'mindset_program_steps';

// Fire-and-forget: invoke the translate-content edge function for the given
// row. Failures are logged but never thrown — translation is best-effort.
export function triggerTranslate(table: Table, id: string) {
  void supabase.functions
    .invoke('translate-content', { body: { table, id } })
    .then((res) => {
      if (res.error) console.warn('translate-content', table, id, res.error);
    })
    .catch((e) => console.warn('translate-content', table, id, e));
}

// Dictionnaire des ingrédients : demande la traduction des entrées qui n'en ont
// pas encore. Appelé par l'admin après l'enregistrement d'une recette BBY — la
// base ne peut pas l'envoyer elle-même de façon fiable (pg_net), donc l'app s'en charge.
export async function translateMissingIngredientNames() {
  const { data, error } = await supabase.from('ingredient_names').select('id, i18n');
  if (error) {
    console.warn('ingredient_names fetch', error);
    return;
  }
  for (const row of (data as { id: string; i18n: Record<string, unknown> | null }[] | null) ?? []) {
    if (!row.i18n || Object.keys(row.i18n).length === 0) triggerTranslate('ingredient_names', row.id);
  }
}
