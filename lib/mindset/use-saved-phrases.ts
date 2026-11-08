import { useCallback, useEffect, useState } from 'react';

import { useAuth } from '@/lib/auth-provider';
import { supabase } from '@/lib/supabase';

export type PhraseSource = 'affirmation' | 'phrase_parcours' | 'page_journal';

// Phrases gardées (« Garder » sur l'affirmation, la phrase à emporter, l'intention).
export function useSavedPhrases() {
  const { user } = useAuth();
  const [texts, setTexts] = useState<Set<string>>(new Set());

  const refresh = useCallback(async () => {
    if (!user) return setTexts(new Set());
    const query = () => supabase.from('saved_phrases').select('text').eq('user_id', user.id);
    let { data, error } = await query();
    // Réseau pas encore prêt (vu au premier lancement sur iPhone) : une seconde tentative,
    // et on ne vide pas la liste déjà connue si elle échoue aussi.
    if (error) {
      await new Promise((r) => setTimeout(r, 1500));
      ({ data, error } = await query());
      if (error) return;
    }
    setTexts(new Set(((data as { text: string }[] | null) ?? []).map((r) => r.text)));
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const has = useCallback((text: string | null | undefined) => !!text && texts.has(text.trim()), [texts]);

  const toggle = useCallback(
    async (text: string | null | undefined, source: PhraseSource) => {
      const t = text?.trim();
      if (!user || !t) return;
      const was = texts.has(t);
      setTexts((prev) => {
        const n = new Set(prev);
        if (was) n.delete(t);
        else n.add(t);
        return n;
      });
      if (was) {
        await supabase.from('saved_phrases').delete().eq('user_id', user.id).eq('text', t);
      } else {
        const { error } = await supabase.from('saved_phrases').insert({ user_id: user.id, text: t, source });
        if (error) console.warn('save phrase', error);
      }
    },
    [user, texts],
  );

  return { has, toggle, refresh };
}
