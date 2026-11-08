import { useLocalSearchParams, useRouter } from 'expo-router';
import { Plus } from 'lucide-react-native';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, StyleSheet } from 'react-native';
import { Text } from '@/components/ui/text';

import { ActionBar, BFont, Bby, PillTabs, WeekStrip, isoDay, weekOf } from '@/components/bby/kit';
import { FieldLabel, FooterScreen, NavHeader, ScreenTitle } from '@/components/bby/nutrition/ui';
import { useAuth } from '@/lib/auth-provider';
import { dayIndex, mealLabel, MEALS, weekLetters } from '@/lib/nutrition/format';
import { setSlot } from '@/lib/nutrition/menu';
import type { MealType } from '@/lib/types';
import { useRecipe } from '@/lib/use-content';
import { useMenu } from '@/lib/use-meal-plan';

// « Ajouter à mon menu » depuis une recette : choisir le jour et le repas, puis
// la recette rejoint le menu (et ses ingrédients la liste de courses).
export default function MenuAddScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const { user } = useAuth();
  const params = useLocalSearchParams<{ recipe?: string; meal?: string }>();
  const { recipe } = useRecipe(params.recipe);
  const { items } = useMenu();
  const today = new Date();
  const days = weekOf(today, weekLetters(i18n.language));
  const [day, setDay] = useState(isoDay(today));
  const [meal, setMeal] = useState<MealType>((MEALS as string[]).includes(params.meal ?? '') ? (params.meal as MealType) : 'dejeuner');
  const [saving, setSaving] = useState(false);

  const di = Math.max(0, days.findIndex((d) => d.key === day));
  const taken = items.find((m) => m.day === di && m.meal_type === meal && m.recipe && m.recipe_id !== params.recipe);

  const add = async () => {
    if (!user || !params.recipe || saving) return;
    setSaving(true);
    try {
      await setSlot(user.id, di, meal, params.recipe, items);
      router.dismissTo({ pathname: '/(tabs)/nutrition', params: { section: 'menu', at: `${Date.now()}` } } as any);
    } catch (e: any) {
      Alert.alert(t('v2nutrition.common.error'), e?.message ?? '');
      setSaving(false);
    }
  };

  return (
    <FooterScreen footer={<ActionBar icon={Plus} label={t('v2nutrition.menuAdd.add')} onPress={add} disabled={saving || !recipe} note={t('v2nutrition.recipe.addNote')} />}>
      <NavHeader />
      <ScreenTitle sub={recipe?.title}>{t('v2nutrition.menuAdd.title')}</ScreenTitle>
      <FieldLabel>{t('v2nutrition.menuAdd.day')}</FieldLabel>
      <WeekStrip days={days} selected={day} onSelect={setDay} boxed />
      <FieldLabel>{t('v2nutrition.menuAdd.meal')}</FieldLabel>
      <PillTabs items={MEALS.map((m) => ({ key: m, label: mealLabel(t, m) }))} value={meal} onChange={setMeal} />
      {taken?.recipe ? <Text style={s.note}>{t('v2nutrition.menuAdd.replaces', { name: taken.recipe.title })}</Text> : null}
      {di < dayIndex(today) ? <Text style={s.note}>{t('v2nutrition.menuAdd.pastDay')}</Text> : null}
    </FooterScreen>
  );
}

const s = StyleSheet.create({
  note: { fontFamily: BFont.sans, fontSize: 13, color: Bby.muted, marginTop: 6 },
});
