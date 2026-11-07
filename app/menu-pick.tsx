import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Pressable, StyleSheet, Text } from 'react-native';

import { BFont, Bby, BbyScreen, PillTabs, weekOf } from '@/components/bby/kit';
import { NavHeader, RecipeCard, ScreenTitle } from '@/components/bby/nutrition/ui';
import { useAuth } from '@/lib/auth-provider';
import { longDate, mealLabel, MEALS, recipeMeta } from '@/lib/nutrition/format';
import { clearSlot, setSlot } from '@/lib/nutrition/menu';
import type { MealType } from '@/lib/types';
import { useRecipes } from '@/lib/use-content';
import { useMenu } from '@/lib/use-meal-plan';

// Choisir la recette d'un créneau du menu (saisie manuelle, ou échange depuis la bibliothèque).
export default function MenuPickScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const { user } = useAuth();
  const params = useLocalSearchParams<{ day?: string; meal?: string }>();
  const day = Math.min(6, Math.max(0, Number.parseInt(params.day ?? '0', 10) || 0));
  const meal = ((MEALS as string[]).includes(params.meal ?? '') ? params.meal : 'dejeuner') as MealType;
  const { recipes } = useRecipes('all');
  const { items } = useMenu();
  const [scope, setScope] = useState<'slot' | 'all'>('slot');
  const date = weekOf(new Date())[day].date;
  const current = items.filter((m) => m.day === day && m.meal_type === meal);

  const list = useMemo(() => (scope === 'all' ? recipes : recipes.filter((r) => r.meal_type === meal)), [recipes, scope, meal]);
  const fail = (e: any) => Alert.alert(t('v2nutrition.common.error'), e?.message ?? '');

  const choose = (recipeId: string) => {
    if (!user) return;
    setSlot(user.id, day, meal, recipeId, items).then(() => router.back()).catch(fail);
  };

  return (
    <BbyScreen bottomSpace={40}>
      <NavHeader />
      <ScreenTitle sub={`${mealLabel(t, meal)} · ${longDate(date, i18n.language)}`}>{t('v2nutrition.today.chooseMeal')}</ScreenTitle>
      <PillTabs
        items={[
          { key: 'slot', label: mealLabel(t, meal) },
          { key: 'all', label: t('v2nutrition.recipes.filter.all') },
        ]}
        value={scope}
        onChange={setScope}
        activeYellow
      />
      {list.map((r) => (
        <RecipeCard
          key={r.id}
          tone={current.some((c) => c.recipe_id === r.id) ? 'light' : 'dark'}
          label={mealLabel(t, r.meal_type)}
          title={r.title}
          meta={recipeMeta(t, r)}
          cover={r.cover_url}
          onPress={() => choose(r.id)}
        />
      ))}
      {list.length === 0 ? <Text style={s.empty}>{t('v2nutrition.recipes.empty')}</Text> : null}
      {current.length ? (
        <Pressable
          onPress={() => clearSlot(current.map((c) => c.id)).then(() => router.back()).catch(fail)}
          hitSlop={8}
          style={{ alignSelf: 'center', paddingVertical: 16 }}
        >
          <Text style={s.remove}>{t('v2nutrition.menu.removeSlot')}</Text>
        </Pressable>
      ) : null}
    </BbyScreen>
  );
}

const s = StyleSheet.create({
  empty: { fontFamily: BFont.sans, fontSize: 14, color: Bby.muted, textAlign: 'center', paddingVertical: 16 },
  remove: { fontFamily: BFont.sansMedium, fontSize: 14, color: Bby.muted, textDecorationLine: 'underline' },
});
