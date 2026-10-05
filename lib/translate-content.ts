import { supabase } from './supabase';

type Table =
  | 'programs'
  | 'sessions'
  | 'recipes'
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
