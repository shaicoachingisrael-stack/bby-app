import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useAuth } from './auth-provider';
import { localize } from './localize';
import { supabase } from './supabase';
import type { MindsetContent } from './types';
import { localDateKey } from './use-rituals';

// Carte d'affirmation du jour. L'affirmation vient de mindset_content (kind='affirmation').
// null = pas encore tirée aujourd'hui → l'écran affiche l'état d'invitation.
export function useDailyAffirmation() {
  const { user } = useAuth();
  const { i18n } = useTranslation();
  const [affirmation, setAffirmation] = useState<MindsetContent | null>(null);
  const [pool, setPool] = useState<MindsetContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [drawing, setDrawing] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    // Pool d'affirmations disponibles.
    const poolRes = await supabase
      .from('mindset_content')
      .select('*')
      .eq('kind', 'affirmation');
    const affirmations = (poolRes.data as MindsetContent[] | null) ?? [];
    setPool(affirmations);

    // Tirage du jour de l'utilisateur (le cas échéant).
    if (user) {
      const { data } = await supabase
        .from('mindset_affirmation_draws')
        .select('affirmation:mindset_content(*)')
        .eq('user_id', user.id)
        .eq('draw_date', localDateKey())
        .maybeSingle();
      const raw = (data as { affirmation: MindsetContent | null } | null)?.affirmation ?? null;
      setAffirmation(localize(raw, 'mindset_content', i18n.language));
    } else {
      setAffirmation(null);
    }
    setLoading(false);
  }, [user, i18n.language]);

  useEffect(() => { refresh(); }, [refresh]);

  // Tire une carte (au hasard, en évitant l'actuelle si possible) et l'enregistre
  // comme carte du jour. Rejouable via « tirer une autre carte ».
  const draw = useCallback(async () => {
    if (!user || pool.length === 0 || drawing) return;
    setDrawing(true);
    try {
      const currentId = affirmation?.id;
      const candidates = pool.length > 1 ? pool.filter((a) => a.id !== currentId) : pool;
      const picked = candidates[Math.floor(Math.random() * candidates.length)];
      // Optimiste
      setAffirmation(localize(picked, 'mindset_content', i18n.language));
      const { error } = await supabase
        .from('mindset_affirmation_draws')
        .upsert(
          { user_id: user.id, draw_date: localDateKey(), affirmation_id: picked.id },
          { onConflict: 'user_id,draw_date' },
        );
      if (error) console.warn('affirmation draw', error);
    } finally {
      setDrawing(false);
    }
  }, [user, pool, affirmation?.id, drawing, i18n.language]);

  return { affirmation, hasPool: pool.length > 0, loading, drawing, draw, refresh };
}
