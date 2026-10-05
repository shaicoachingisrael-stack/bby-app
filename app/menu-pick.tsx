import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors, Fonts, Radius, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { DAY_KEYS, MEAL_LABEL_KEYS, MEAL_TYPES } from '@/lib/ingredients';
import { useRecipes } from '@/lib/use-content';
import { useMenu } from '@/lib/use-meal-plan';
import type { MealType } from '@/lib/types';

// Choisir une recette pour un créneau du menu (jour + repas). Les recettes du
// bon type de repas viennent en premier ; les recettes perso sont signalées.
export default function MenuPickScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const palette = Colors[useColorScheme() ?? 'light'];
  const params = useLocalSearchParams<{ day?: string; meal?: string }>();
  const day = Math.min(6, Math.max(0, Number.parseInt(params.day ?? '0', 10) || 0));
  const meal = (MEAL_TYPES.includes(params.meal as MealType) ? params.meal : 'dejeuner') as MealType;

  const { recipes, loading } = useRecipes('all');
  const { add } = useMenu();
  const [adding, setAdding] = useState<string | null>(null);

  const sorted = useMemo(
    () => [...recipes].sort((a, b) => Number(b.meal_type === meal) - Number(a.meal_type === meal)),
    [recipes, meal],
  );

  async function pick(recipeId: string) {
    if (adding) return;
    setAdding(recipeId);
    try {
      await add(day, meal, recipeId);
      router.back();
    } catch (e: any) {
      Alert.alert(t('common.error'), e?.message ?? '');
      setAdding(null);
    }
  }

  return (
    <View style={[styles.flex, { backgroundColor: palette.background }]}>
      <View style={[styles.topBar, { paddingTop: insets.top + Spacing.sm }]}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.back}>
          <ChevronLeft size={24} color={palette.text} />
          <Text style={[styles.backText, { color: palette.text, fontFamily: Fonts.sansMedium }]}>
            {t('common.back')}
          </Text>
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: Spacing.xl, paddingBottom: insets.bottom + Spacing.xxl }}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.eyebrow, { color: palette.textSecondary, fontFamily: Fonts.sansMedium }]}>
          {`${t(`menu.day.${DAY_KEYS[day]}`)} · ${t(MEAL_LABEL_KEYS[meal])}`.toUpperCase()}
        </Text>
        <Text style={[styles.title, { color: palette.text, fontFamily: Fonts.displayBold }]}>
          {t('menu.pickTitle')}
        </Text>

        {!loading && sorted.length === 0 ? (
          <Text style={[styles.empty, { color: palette.textSecondary, fontFamily: Fonts.sans }]}>
            {t('menu.pickEmpty')}
          </Text>
        ) : (
          <View style={[styles.card, { backgroundColor: palette.surface }]}>
            {sorted.map((r, i) => (
              <Pressable
                key={r.id}
                onPress={() => pick(r.id)}
                style={({ pressed }) => [
                  styles.row,
                  {
                    borderTopColor: palette.border,
                    borderTopWidth: i === 0 ? 0 : StyleSheet.hairlineWidth,
                    opacity: pressed || adding === r.id ? 0.6 : 1,
                  },
                ]}
              >
                <Text numberOfLines={1} style={[styles.rowTitle, { color: palette.text, fontFamily: Fonts.sansSemibold }]}>
                  {r.title}
                </Text>
                <Text style={[styles.rowSub, { color: palette.textSecondary, fontFamily: Fonts.sans }]}>
                  {[r.meal_type ? t(MEAL_LABEL_KEYS[r.meal_type]) : null, r.owner_id ? t('myRecipes.badge') : null]
                    .filter(Boolean)
                    .join(' · ')}
                </Text>
              </Pressable>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  topBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.lg, paddingBottom: Spacing.sm },
  back: { flexDirection: 'row', alignItems: 'center' },
  backText: { fontSize: 15, marginLeft: 2 },
  eyebrow: { fontSize: 11, letterSpacing: 1.4, marginTop: Spacing.lg },
  title: { fontSize: 28, letterSpacing: -0.5, marginTop: 4 },
  empty: { fontSize: 14, lineHeight: 20, marginTop: Spacing.xl },
  card: { borderRadius: Radius.lg, paddingHorizontal: Spacing.lg, marginTop: Spacing.lg },
  row: { paddingVertical: Spacing.md },
  rowTitle: { fontSize: 15 },
  rowSub: { fontSize: 12, marginTop: 2 },
});
