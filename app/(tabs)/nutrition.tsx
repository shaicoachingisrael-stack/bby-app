import { Image } from 'expo-image';
import { useFocusEffect, useRouter } from 'expo-router';
import { BookOpen, CalendarDays, Coffee, Cookie, ShoppingBasket, UtensilsCrossed } from 'lucide-react-native';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { TabHeader } from '@/components/ui/tab-header';
import { Colors, Fonts, Radius, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/lib/auth-provider';
import { supabase } from '@/lib/supabase';
import { useRecipes } from '@/lib/use-content';
import { useDayData } from '@/lib/use-day-data';
import { useMenu, useShoppingList } from '@/lib/use-meal-plan';
import { useNutritionTargets } from '@/lib/use-nutrition-targets';
import { useProfile } from '@/lib/use-profile';

const WATER_STEPS = [250, 500, 1000];

// Nutrition (maquette Ember v2, brief Nutrition de Shy §1) : les macros en haut,
// le total calorique en petite ligne dessous. Sans suivi (défaut) rien n'est
// compté ; avec suivi, chaque macro montre où on en est.
export default function NutritionScreen() {
  const insets = useSafeAreaInsets();
  const palette = Colors[useColorScheme() ?? 'light'];
  const router = useRouter();
  const { t } = useTranslation();
  const { user } = useAuth();
  const { profile } = useProfile();
  const { data, refresh } = useDayData();
  const { targets } = useNutritionTargets();
  const { recipes, refresh: refreshRecipes } = useRecipes();
  const { items: menuItems, refresh: refreshMenu } = useMenu();
  const { items: shoppingItems, refresh: refreshShopping } = useShoppingList();
  const shoppingRemaining = shoppingItems.filter((i) => !i.checked).length;

  useFocusEffect(
    useCallback(() => {
      refresh();
      refreshRecipes();
      refreshMenu();
      refreshShopping();
    }, [refresh, refreshRecipes, refreshMenu, refreshShopping]),
  );

  const tracking = profile?.nutrition_tracking === true;
  const fmt = (n: number) => `${Math.round(n)}`.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  const waterTarget = targets?.water_ml ?? profile?.hydration_target_ml ?? 2500;

  async function addWater(ml: number) {
    if (!user) return;
    const { error } = await supabase.from('hydration_entries').insert({ user_id: user.id, ml });
    if (error) {
      Alert.alert(t('common.error'), error.message);
      return;
    }
    refresh();
  }

  const macros = [
    { label: t('nutrition.macros.protein'), target: targets?.protein_g ?? 0, eaten: data.meals.total_protein },
    { label: t('nutrition.macros.fats'), target: targets?.fats_g ?? 0, eaten: data.meals.total_fat },
    { label: t('nutrition.macros.carbs'), target: targets?.carbs_g ?? 0, eaten: data.meals.total_carbs },
  ];
  const meals = [
    { key: 'petit_dejeuner', icon: Coffee, label: t('nutrition.breakfast'), slot: data.meals.petit_dejeuner },
    { key: 'dejeuner', icon: UtensilsCrossed, label: t('nutrition.lunch'), slot: data.meals.dejeuner },
    { key: 'diner', icon: Cookie, label: t('nutrition.dinner'), slot: data.meals.diner },
  ];
  const week = [
    {
      icon: CalendarDays,
      title: t('menu.title'),
      sub: menuItems.length > 0 ? t('menu.count', { count: menuItems.length }) : t('menu.emptyHint'),
      to: '/menu',
    },
    {
      icon: ShoppingBasket,
      title: t('shopping.title'),
      sub: shoppingItems.length > 0 ? t('shopping.remaining', { count: shoppingRemaining }) : t('shopping.emptyHint'),
      to: '/shopping-list',
    },
    { icon: BookOpen, title: t('myRecipes.title'), sub: t('myRecipes.hint'), to: '/my-recipes' },
  ];

  return (
    <View style={[styles.container, { backgroundColor: palette.background }]}>
      <ScrollView
        contentContainerStyle={{ paddingTop: insets.top + Spacing.lg, paddingBottom: 140 }}
        showsVerticalScrollIndicator={false}
      >
        <TabHeader
          title={t('nutrition.title')}
          subtitle={t('nutrition.dailyGuide')}
          action={
            <Pressable
              onPress={() => router.push('/macros-help' as any)}
              hitSlop={6}
              style={[styles.pill, { borderColor: palette.accent, backgroundColor: palette.accentSoft }]}
            >
              <Text style={{ color: palette.text, fontFamily: Fonts.sansSemibold, fontSize: 12 }}>
                {t('nutrition.understandShort')}
              </Text>
            </Pressable>
          }
        />

        {targets && targets.calories !== null ? (
          <>
            <View style={styles.macros}>
              {macros.map((m) => (
                <View key={m.label} style={[styles.macro, { backgroundColor: palette.surface, borderColor: palette.border }]}>
                  <Text numberOfLines={1} style={[styles.macroLabel, { color: palette.textSecondary, fontFamily: Fonts.sansBold }]}>
                    {m.label}
                  </Text>
                  <View style={styles.macroRow}>
                    <Text style={[styles.macroValue, { color: palette.text, fontFamily: Fonts.displayBold }]}>
                      {tracking ? m.eaten : m.target}
                    </Text>
                    <Text style={[styles.macroUnit, { color: palette.textSecondary, fontFamily: Fonts.sans }]}>
                      {t('common.g')}
                    </Text>
                  </View>
                  {tracking ? (
                    <Text style={[styles.macroSub, { color: palette.textSecondary, fontFamily: Fonts.sans }]}>
                      {t('nutrition.macros.ofTarget', { target: m.target })}
                    </Text>
                  ) : null}
                </View>
              ))}
            </View>
            <Text style={[styles.kcal, { color: palette.textSecondary, fontFamily: Fonts.sans }]}>
              {tracking
                ? t('nutrition.kcalProgress', { current: fmt(data.meals.total_kcal), target: fmt(targets.calories ?? 0) })
                : t('nutrition.macros.kcalPerDay', { kcal: fmt(targets.calories ?? 0) })}
            </Text>
          </>
        ) : null}

        {/* Hydratation : des boutons, pas un champ à remplir */}
        <View style={[styles.card, { backgroundColor: palette.surface, borderColor: palette.border }]}>
          <View style={styles.cardHead}>
            <Text style={[styles.cardTitle, { color: palette.text, fontFamily: Fonts.display }]}>
              {t('nutrition.hydration')}
            </Text>
            <Text style={[styles.cardMeta, { color: palette.textSecondary, fontFamily: Fonts.sansBold }]}>
              {`${fmt(data.hydration_ml)} / ${fmt(waterTarget)} ${t('common.ml')}`.toUpperCase()}
            </Text>
          </View>
          <View style={styles.chips}>
            {WATER_STEPS.map((ml) => (
              <Pressable
                key={ml}
                onPress={() => addWater(ml)}
                style={({ pressed }) => [styles.chip, { borderColor: palette.border, opacity: pressed ? 0.6 : 1 }]}
              >
                <Text style={{ color: palette.text, fontFamily: Fonts.sansMedium, fontSize: 13 }}>
                  {ml >= 1000 ? `+ ${ml / 1000} ${t('common.L')}` : `+ ${ml} ${t('common.ml')}`}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Mes repas du jour : seulement avec le suivi activé */}
        {tracking ? (
          <>
            <View style={styles.sectionHead}>
              <Text style={[styles.sectionLabel, { color: palette.textSecondary, fontFamily: Fonts.sansBold }]}>
                {t('nutrition.todaysMeals').toUpperCase()}
              </Text>
              <Pressable hitSlop={8} onPress={() => router.push('/meal-log' as any)}>
                <Text style={{ color: palette.text, fontFamily: Fonts.sansSemibold, fontSize: 13 }}>
                  {t('nutrition.addMeal')}
                </Text>
              </Pressable>
            </View>
            <View style={styles.list}>
              {meals.map((m) => {
                const Icon = m.icon;
                return (
                  <Pressable
                    key={m.key}
                    onPress={() => router.push(`/meal-log?type=${m.key}` as any)}
                    style={({ pressed }) => [styles.row, { opacity: pressed ? 0.7 : 1 }]}
                  >
                    <View style={[styles.thumb, { backgroundColor: palette.surface }]}>
                      <Icon size={18} color={palette.text} strokeWidth={1.8} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.rowTitle, { color: palette.text, fontFamily: Fonts.sansSemibold }]}>
                        {m.label}
                      </Text>
                      <Text style={[styles.rowSub, { color: palette.textSecondary, fontFamily: Fonts.sans }]}>
                        {m.slot.logged
                          ? `P ${m.slot.protein} ${t('common.g')} · ${m.slot.kcal} ${t('common.kcal')}`
                          : t('nutrition.notLogged')}
                      </Text>
                    </View>
                    {m.slot.logged ? <View style={[styles.dot, { backgroundColor: palette.done }]} /> : null}
                  </Pressable>
                );
              })}
            </View>
          </>
        ) : null}

        {/* Ma semaine : menu, courses, recettes perso */}
        <View style={styles.sectionHead}>
          <Text style={[styles.sectionLabel, { color: palette.textSecondary, fontFamily: Fonts.sansBold }]}>
            {t('nutrition.planSection').toUpperCase()}
          </Text>
        </View>
        <View style={styles.list}>
          {week.map((w) => {
            const Icon = w.icon;
            return (
              <Pressable
                key={w.to}
                onPress={() => router.push(w.to as any)}
                style={({ pressed }) => [styles.row, { opacity: pressed ? 0.7 : 1 }]}
              >
                <View style={[styles.thumb, { backgroundColor: palette.surface }]}>
                  <Icon size={18} color={palette.text} strokeWidth={1.8} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.rowTitle, { color: palette.text, fontFamily: Fonts.sansSemibold }]}>
                    {w.title}
                  </Text>
                  <Text numberOfLines={1} style={[styles.rowSub, { color: palette.textSecondary, fontFamily: Fonts.sans }]}>
                    {w.sub}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </View>

        {recipes.length > 0 ? (
          <>
            <View style={styles.sectionHead}>
              <Text style={[styles.sectionLabel, { color: palette.textSecondary, fontFamily: Fonts.sansBold }]}>
                {t('nutrition.recipeIdeas').toUpperCase()}
              </Text>
            </View>
            <View style={styles.list}>
              {recipes.slice(0, 6).map((r) => (
                <Pressable
                  key={r.id}
                  onPress={() => router.push(`/recipe/${r.id}` as any)}
                  style={({ pressed }) => [styles.row, { opacity: pressed ? 0.7 : 1 }]}
                >
                  <View style={[styles.thumb, { backgroundColor: palette.surface }]}>
                    {r.cover_url ? (
                      <Image source={{ uri: r.cover_url }} style={StyleSheet.absoluteFillObject} contentFit="cover" />
                    ) : null}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text numberOfLines={1} style={[styles.rowTitle, { color: palette.text, fontFamily: Fonts.sansSemibold }]}>
                      {r.title}
                    </Text>
                    <Text numberOfLines={1} style={[styles.rowSub, { color: palette.textSecondary, fontFamily: Fonts.sans }]}>
                      {[
                        r.protein_g ? `P ${r.protein_g} ${t('common.g')}` : null,
                        r.fat_g ? `L ${r.fat_g} ${t('common.g')}` : null,
                        r.carbs_g ? `G ${r.carbs_g} ${t('common.g')}` : null,
                        r.prep_min ? `${r.prep_min} ${t('common.min')}` : null,
                      ]
                        .filter(Boolean)
                        .join(' · ')}
                    </Text>
                  </View>
                </Pressable>
              ))}
            </View>
          </>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  pill: { borderWidth: 1, borderRadius: Radius.pill, paddingHorizontal: 12, paddingVertical: 7 },
  macros: { flexDirection: 'row', gap: Spacing.sm, paddingHorizontal: Spacing.xl, marginTop: Spacing.lg },
  macro: { flex: 1, borderRadius: 18, borderWidth: StyleSheet.hairlineWidth, padding: Spacing.md },
  macroLabel: { fontSize: 10, letterSpacing: 1.2 },
  macroRow: { flexDirection: 'row', alignItems: 'baseline', gap: 4, marginTop: 6 },
  macroValue: { fontSize: 30, letterSpacing: -0.8 },
  macroUnit: { fontSize: 12 },
  macroSub: { fontSize: 11, marginTop: 2 },
  kcal: { fontSize: 12, paddingHorizontal: Spacing.xl, marginTop: Spacing.sm },
  card: {
    marginHorizontal: Spacing.xl,
    marginTop: Spacing.lg,
    borderRadius: 22,
    borderWidth: StyleSheet.hairlineWidth,
    padding: Spacing.lg,
  },
  cardHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.sm },
  cardTitle: { fontSize: 18, letterSpacing: -0.3 },
  cardMeta: { fontSize: 10, letterSpacing: 1.2 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginTop: Spacing.md },
  chip: { borderWidth: 1, borderRadius: Radius.pill, paddingHorizontal: 16, paddingVertical: 9 },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    marginTop: Spacing.xl,
  },
  sectionLabel: { fontSize: 11, letterSpacing: 1.4 },
  list: { paddingHorizontal: Spacing.xl, marginTop: Spacing.md, gap: Spacing.md },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  thumb: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  rowTitle: { fontSize: 15 },
  rowSub: { fontSize: 12, marginTop: 2 },
  dot: { width: 8, height: 8, borderRadius: 4 },
});
