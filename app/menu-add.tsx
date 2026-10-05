import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Segmented } from '@/components/ui/segmented';
import { Colors, Fonts, Radius, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/lib/auth-provider';
import { DAY_KEYS, MEAL_LABEL_KEYS, MEAL_TYPES } from '@/lib/ingredients';
import { supabase } from '@/lib/supabase';
import type { MealType } from '@/lib/types';

// Depuis une fiche recette : « Ajouter à mon menu ». On choisit le ou les jours
// et le repas ; les ingrédients rejoignent la liste de courses tout seuls.
export default function MenuAddScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const palette = Colors[useColorScheme() ?? 'light'];
  const { user } = useAuth();
  const params = useLocalSearchParams<{ recipe?: string; meal?: string }>();
  const recipeId = params.recipe;

  const [meal, setMeal] = useState<MealType>(
    MEAL_TYPES.includes(params.meal as MealType) ? (params.meal as MealType) : 'dejeuner',
  );
  const [days, setDays] = useState<number[]>([]);
  const [saving, setSaving] = useState(false);

  const mealOptions = MEAL_TYPES.map((m) => ({ value: m, label: t(MEAL_LABEL_KEYS[m]) }));
  const toggleDay = (d: number) =>
    setDays((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]));

  async function handleAdd() {
    if (!user || !recipeId || days.length === 0) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('menu_items')
        .insert(days.map((day) => ({ user_id: user.id, day, meal_type: meal, recipe_id: recipeId })));
      if (error) throw error;
      router.back();
    } catch (e: any) {
      Alert.alert(t('common.error'), e?.message ?? '');
      setSaving(false);
    }
  }

  return (
    <View style={[styles.flex, { backgroundColor: palette.background, paddingTop: Spacing.xl, paddingBottom: insets.bottom + Spacing.lg }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: palette.text, fontFamily: Fonts.displayBold }]}>
          {t('menu.addToMenu')}
        </Text>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Text style={{ color: palette.textSecondary, fontFamily: Fonts.sansMedium, fontSize: 15 }}>
            {t('common.close')}
          </Text>
        </Pressable>
      </View>

      <Text style={[styles.label, { color: palette.textSecondary, fontFamily: Fonts.sansMedium }]}>
        {t('menu.whichDays').toUpperCase()}
      </Text>
      <View style={styles.days}>
        {DAY_KEYS.map((key, d) => {
          const selected = days.includes(d);
          return (
            <Pressable
              key={key}
              onPress={() => toggleDay(d)}
              accessibilityState={{ selected }}
              style={[
                styles.day,
                { backgroundColor: selected ? palette.text : palette.surface },
              ]}
            >
              <Text
                style={{
                  color: selected ? palette.background : palette.text,
                  fontFamily: selected ? Fonts.sansSemibold : Fonts.sansMedium,
                  fontSize: 13,
                }}
              >
                {t(`dateStrip.${key}`)}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Text style={[styles.label, { color: palette.textSecondary, fontFamily: Fonts.sansMedium }]}>
        {t('menu.whichMeal').toUpperCase()}
      </Text>
      <View style={{ gap: Spacing.sm }}>
        <Segmented value={meal} options={mealOptions.slice(0, 2)} onChange={setMeal} />
        <Segmented value={meal} options={mealOptions.slice(2)} onChange={setMeal} />
      </View>

      <View style={{ flex: 1 }} />
      <Pressable
        onPress={handleAdd}
        disabled={saving || days.length === 0}
        style={({ pressed }) => [
          styles.cta,
          { backgroundColor: palette.text, opacity: days.length === 0 ? 0.35 : pressed || saving ? 0.85 : 1 },
        ]}
      >
        {saving ? (
          <ActivityIndicator color={palette.background} />
        ) : (
          <Text style={{ color: palette.background, fontFamily: Fonts.sansSemibold, fontSize: 15 }}>
            {t('menu.addToMenu')}
          </Text>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, paddingHorizontal: Spacing.xl },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontSize: 24, letterSpacing: -0.4 },
  label: { fontSize: 11, letterSpacing: 1.4, marginTop: Spacing.xl, marginBottom: Spacing.sm },
  days: { flexDirection: 'row', gap: 6 },
  day: { flex: 1, height: 44, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center' },
  cta: { height: 52, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center' },
});
