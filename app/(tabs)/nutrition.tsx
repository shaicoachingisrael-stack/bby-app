import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { BbyScreen, BigTitle, PillTabs, TopBar } from '@/components/bby/kit';
import { MenuSection, RecipesSection, ShoppingSection, type RecipeFilter } from '@/components/bby/nutrition/sections';
import { TodayPlain, TodayTracked, type GoSection } from '@/components/bby/nutrition/today';
import { useNutritionPrefs } from '@/lib/nutrition/prefs';
import { useProfile } from '@/lib/use-profile';

type Section = 'today' | 'recettes' | 'menu' | 'courses';
const SECTIONS: Section[] = ['today', 'recettes', 'menu', 'courses'];

// Onglet Nutrition (spécifications de Shaï, nov. 2026) : des repères, pas des
// objectifs. Quatre sections ; « Aujourd'hui » montre l'écran 1 (sans suivi, par
// défaut) ou l'écran 2 (avec suivi) selon le réglage d'affichage.
export default function NutritionScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { profile } = useProfile();
  const { tracking } = useNutritionPrefs();
  const params = useLocalSearchParams<{ section?: string; filter?: string; at?: string }>();
  const [section, setSection] = useState<Section>('today');
  const [filter, setFilter] = useState<RecipeFilter>('all');

  // Ouverture depuis un autre écran (« /nutrition?section=menu »).
  useEffect(() => {
    if (params.section && (SECTIONS as string[]).includes(params.section)) setSection(params.section as Section);
    if (params.filter) setFilter(params.filter as RecipeFilter);
    // `at` change à chaque ouverture : la même section peut être redemandée.
  }, [params.section, params.filter, params.at]);

  const go: GoSection = (next, f) => {
    if (next === 'recettes') setFilter(f ?? 'all');
    setSection(next);
  };

  const name = profile?.display_name?.split(' ')[0] ?? '';

  return (
    <BbyScreen>
      <TopBar name={name} onSettings={() => router.push('/nutrition/settings' as any)} />
      <BigTitle>{t('v2nutrition.title')}</BigTitle>
      <PillTabs
        items={[
          { key: 'today', label: t('v2nutrition.tabs.today') },
          { key: 'recettes', label: t('v2nutrition.tabs.recipes') },
          { key: 'menu', label: t('v2nutrition.tabs.menu') },
          { key: 'courses', label: t('v2nutrition.tabs.shopping') },
        ]}
        value={section}
        onChange={(k) => go(k)}
      />
      {section === 'today' ? tracking ? <TodayTracked /> : <TodayPlain go={go} /> : null}
      {section === 'recettes' ? <RecipesSection filter={filter} setFilter={setFilter} /> : null}
      {section === 'menu' ? <MenuSection go={go} /> : null}
      {section === 'courses' ? <ShoppingSection go={go} /> : null}
    </BbyScreen>
  );
}
