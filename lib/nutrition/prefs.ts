import { useCallback, useState } from 'react';
import { Alert } from 'react-native';
import { useTranslation } from 'react-i18next';

import { useProfile, type Profile } from '@/lib/use-profile';

export type Rhythm = 'perte_de_gras' | 'maintien' | 'prise_de_masse';
export const RHYTHMS: Rhythm[] = ['perte_de_gras', 'maintien', 'prise_de_masse'];

type NutritionProfile = Profile & {
  nutrition_show_calories?: boolean | null;
  nutrition_rhythm?: Rhythm | null;
};

type Prefs = { tracking: boolean; showCalories: boolean; rhythm: Rhythm };

/**
 * Réglages « Affichage nutrition » (écran 4), enregistrés sur le profil.
 * Le changement s'affiche tout de suite (valeur locale), puis la base confirme ;
 * en cas d'échec on revient à l'ancienne valeur.
 */
export function useNutritionPrefs() {
  const { t } = useTranslation();
  const { profile, update } = useProfile();
  const p = profile as NutritionProfile | null;
  const [pending, setPending] = useState<Partial<Prefs>>({});

  const prefs: Prefs = {
    tracking: pending.tracking ?? p?.nutrition_tracking === true,
    showCalories: pending.showCalories ?? p?.nutrition_show_calories !== false,
    rhythm: pending.rhythm ?? (p?.nutrition_rhythm as Rhythm | null) ?? 'maintien',
  };

  const save = useCallback(
    async (patch: Partial<Prefs>) => {
      setPending((prev) => ({ ...prev, ...patch }));
      const row: Record<string, unknown> = {};
      if (patch.tracking !== undefined) row.nutrition_tracking = patch.tracking;
      if (patch.showCalories !== undefined) row.nutrition_show_calories = patch.showCalories;
      if (patch.rhythm !== undefined) row.nutrition_rhythm = patch.rhythm;
      try {
        await update(row as Partial<Omit<Profile, 'id'>>);
      } catch (e: any) {
        Alert.alert(t('v2nutrition.common.error'), e?.message ?? '');
      } finally {
        setPending((prev) => {
          const next = { ...prev };
          for (const k of Object.keys(patch) as (keyof Prefs)[]) delete next[k];
          return next;
        });
      }
    },
    [update, t],
  );

  return {
    ...prefs,
    setTracking: (v: boolean) => save({ tracking: v }),
    setShowCalories: (v: boolean) => save({ showCalories: v }),
    setRhythm: (v: Rhythm) => save({ rhythm: v }),
  };
}
