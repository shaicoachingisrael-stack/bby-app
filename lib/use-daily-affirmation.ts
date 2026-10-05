import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AppState } from 'react-native';

import { useAuth } from './auth-provider';
import { localize } from './localize';
import { supabase } from './supabase';
import type { DailyAffirmation } from './types';

// Affirmation du jour (brief Shy « 365 affirmations »). Elle dépend de la date
// LOCALE de l'appareil (mois + jour) : toutes les utilisatrices lisent la même
// phrase le même jour. Rien n'est enregistré par utilisatrice — ni compteur,
// ni historique : si elle n'ouvre pas l'app, rien n'est perdu.
export function useDailyAffirmation() {
  const { user } = useAuth();
  const { i18n } = useTranslation();
  const [affirmation, setAffirmation] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) {
      setAffirmation(null);
      setLoading(false);
      return;
    }
    const now = new Date();
    const { data } = await supabase
      .from('daily_affirmations')
      .select('*')
      .eq('month', now.getMonth() + 1)
      .eq('day', now.getDate())
      .maybeSingle();
    const row = localize(data as DailyAffirmation | null, 'daily_affirmations', i18n.language);
    setAffirmation(row?.text?.trim() || null);
    setLoading(false);
  }, [user, i18n.language]);

  useEffect(() => { refresh(); }, [refresh]);

  // Bascule à minuit, heure locale : minuterie si l'app reste ouverte,
  // et nouvelle lecture quand elle revient au premier plan.
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const armMidnight = () => {
      const now = new Date();
      const nextMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 1);
      timer = setTimeout(() => {
        refresh();
        armMidnight();
      }, nextMidnight.getTime() - now.getTime());
    };
    armMidnight();
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        clearTimeout(timer);
        refresh();
        armMidnight();
      }
    });
    return () => {
      clearTimeout(timer);
      sub.remove();
    };
  }, [refresh]);

  return { affirmation, loading, refresh };
}
