import { Image } from 'expo-image';
import { useFocusEffect, useRouter } from 'expo-router';
import {
  Apple,
  CalendarDays,
  Check,
  Coffee,
  Droplet,
  HelpCircle,
  Moon,
  PenLine,
  ShoppingBasket,
  Sun,
  Utensils,
} from 'lucide-react-native';
import { useCallback, useId } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';

import { IconBadge, IconTile, SectionLabel, TileCard, TileColors, TileText, type TileColor } from '@/components/ui/tiles';
import { Colors, Fonts } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/lib/auth-provider';
import { supabase } from '@/lib/supabase';
import { useRecipes } from '@/lib/use-content';
import { useDayData } from '@/lib/use-day-data';
import { useMenu, useShoppingList } from '@/lib/use-meal-plan';
import { useNutritionTargets } from '@/lib/use-nutrition-targets';
import { useProfile } from '@/lib/use-profile';

// Un verre = une goutte à toucher.
const GLASS_ML = 250;
const MAX_DROPS = 12;
const RECIPE_COLORS: TileColor[] = ['orange', 'rose', 'mint', 'violet', 'blue'];

// Nutrition (maquette « en tuiles », brief Nutrition de Shy §1) : les macros en
// anneaux en haut, le total calorique en petite ligne dessous. Sans suivi (défaut)
// rien n'est compté : l'anneau montre la cible ; avec suivi, où on en est.
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
  const drops = Math.min(MAX_DROPS, Math.max(1, Math.ceil(waterTarget / GLASS_ML)));
  const glassesDone = Math.min(drops, Math.floor(data.hydration_ml / GLASS_ML));

  async function addWater(ml: number) {
    if (!user) return;
    const { error } = await supabase.from('hydration_entries').insert({ user_id: user.id, ml });
    if (error) {
      Alert.alert(t('common.error'), error.message);
      return;
    }
    refresh();
  }

  const macros: { label: string; target: number; eaten: number; color: TileColor }[] = [
    { label: t('nutrition.macros.protein'), target: targets?.protein_g ?? 0, eaten: data.meals.total_protein, color: 'rose' },
    { label: t('nutrition.macros.carbs'), target: targets?.carbs_g ?? 0, eaten: data.meals.total_carbs, color: 'orange' },
    { label: t('nutrition.macros.fats'), target: targets?.fats_g ?? 0, eaten: data.meals.total_fat, color: 'blue' },
  ];

  const meals = [
    { key: 'petit_dejeuner', icon: Coffee, color: 'orange' as const, label: t('tiles.morning'), slot: data.meals.petit_dejeuner },
    { key: 'dejeuner', icon: Sun, color: 'rose' as const, label: t('tiles.noon'), slot: data.meals.dejeuner },
    { key: 'collation', icon: Apple, color: 'mint' as const, label: t('tiles.snack'), slot: data.meals.collation },
    { key: 'diner', icon: Moon, color: 'violet' as const, label: t('tiles.evening'), slot: data.meals.diner },
  ];

  return (
    <View style={[styles.container, { backgroundColor: palette.background }]}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 16 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.eyebrow}>{t('tiles.today').toUpperCase()}</Text>
            <Text style={[styles.title, { fontFamily: Fonts.displayBold }]}>{t('nutrition.title')}</Text>
          </View>
          <TileCard
            radius={15}
            onPress={() => router.push('/macros-help' as any)}
            accessibilityLabel={t('nutrition.understandShort')}
            style={styles.help}
          >
            <HelpCircle size={18} color={TileText.primary} strokeWidth={1.9} />
            <Text style={styles.helpText}>{t('nutrition.understandShort')}</Text>
          </TileCard>
        </View>

        {/* Les macros en anneaux, les calories en petit dessous */}
        {targets && targets.calories !== null ? (
          <TileCard radius={26} style={styles.macroCard}>
            <View style={styles.macroRow}>
              {macros.map((m) => (
                <MacroRing
                  key={m.label}
                  label={m.label}
                  value={tracking ? m.eaten : m.target}
                  ratio={tracking ? (m.target > 0 ? m.eaten / m.target : 0) : 1}
                  color={m.color}
                  unit={t('common.g')}
                />
              ))}
            </View>
            <Text style={styles.kcal}>
              {tracking
                ? t('nutrition.kcalProgress', { current: fmt(data.meals.total_kcal), target: fmt(targets.calories ?? 0) })
                : t('nutrition.macros.kcalPerDay', { kcal: fmt(targets.calories ?? 0) })}
            </Text>
          </TileCard>
        ) : (
          <TileCard
            radius={22}
            style={styles.setTargets}
            onPress={() => router.push('/edit-profile' as any)}
            accessibilityLabel={t('tiles.setTargets')}
          >
            <IconBadge icon={HelpCircle} color="rose" size={40} />
            <Text style={styles.setTargetsText}>{t('tiles.setTargets')}</Text>
          </TileCard>
        )}

        {/* Mon eau : une goutte = un verre ; toucher une goutte vide ajoute un verre */}
        <SectionLabel right={t('tiles.glasses', { done: glassesDone, total: drops })}>{t('tiles.myWater')}</SectionLabel>
        <TileCard radius={22} style={styles.waterCard}>
          {Array.from({ length: drops }, (_, i) => {
            const full = i < glassesDone;
            return (
              <Pressable
                key={i}
                hitSlop={4}
                disabled={full}
                onPress={() => addWater(GLASS_ML)}
                accessibilityRole="button"
                accessibilityLabel={`${t('tiles.water')} ${i + 1}`}
                accessibilityState={{ checked: full }}
                style={({ pressed }) => [styles.drop, pressed && { transform: [{ scale: 0.85 }] }]}
              >
                <Droplet
                  size={26}
                  color={full ? TileColors.blue.from : 'rgba(151,213,255,0.35)'}
                  fill={full ? '#4FA6EE' : 'transparent'}
                  strokeWidth={1.6}
                />
              </Pressable>
            );
          })}
        </TileCard>
        <Text style={styles.waterSub}>{`${fmt(data.hydration_ml)} / ${fmt(waterTarget)} ${t('common.ml')}`}</Text>

        {/* Mes repas : seulement avec le suivi activé */}
        {tracking ? (
          <>
            <SectionLabel>{t('tiles.myMeals')}</SectionLabel>
            <View style={styles.row4}>
              {meals.map((m) => (
                <IconTile
                  key={m.key}
                  icon={m.icon}
                  color={m.color}
                  label={m.label}
                  onPress={() => router.push(`/meal-log?type=${m.key}` as any)}
                  badge={
                    m.slot.logged ? <IconBadge icon={Check} color="mint" size={18} round strokeWidth={3.5} iconSize={11} /> : undefined
                  }
                />
              ))}
            </View>
          </>
        ) : null}

        {/* Ma cuisine : menu de la semaine, courses, recettes perso */}
        <SectionLabel>{t('tiles.myKitchen')}</SectionLabel>
        <View style={styles.row3}>
          <IconTile
            icon={CalendarDays}
            color="orange"
            label={t('tiles.weekMenu')}
            onPress={() => router.push('/menu' as any)}
            badge={menuItems.length > 0 ? <Count n={menuItems.length} /> : undefined}
          />
          <IconTile
            icon={ShoppingBasket}
            color="mint"
            label={t('tiles.shopping')}
            onPress={() => router.push('/shopping-list' as any)}
            badge={shoppingRemaining > 0 ? <Count n={shoppingRemaining} /> : undefined}
          />
          <IconTile icon={PenLine} color="violet" label={t('tiles.mine')} onPress={() => router.push('/my-recipes' as any)} />
        </View>

        {/* Idées recettes */}
        {recipes.length > 0 ? (
          <>
            <SectionLabel>{t('nutrition.recipeIdeas')}</SectionLabel>
            <View style={styles.grid}>
              {recipes.slice(0, 6).map((r, i) => (
                <TileCard
                  key={r.id}
                  radius={22}
                  style={styles.recipe}
                  onPress={() => router.push(`/recipe/${r.id}` as any)}
                  accessibilityLabel={r.title}
                >
                  {r.cover_url ? (
                    <Image source={{ uri: r.cover_url }} style={styles.cover} contentFit="cover" />
                  ) : (
                    <IconBadge icon={Utensils} color={RECIPE_COLORS[i % RECIPE_COLORS.length]} size={40} />
                  )}
                  <Text numberOfLines={2} style={styles.recipeTitle}>
                    {r.title}
                  </Text>
                </TileCard>
              ))}
            </View>
          </>
        ) : null}
      </ScrollView>
    </View>
  );
}

function MacroRing({
  label,
  value,
  ratio,
  color,
  unit,
}: {
  label: string;
  value: number;
  ratio: number;
  color: TileColor;
  unit: string;
}) {
  const id = useId().replace(/:/g, '');
  const c = TileColors[color];
  const r = 29;
  const circ = 2 * Math.PI * r;
  const len = Math.max(0, Math.min(1, ratio)) * circ;
  return (
    <View style={styles.macro} accessible accessibilityLabel={`${label} ${Math.round(value)} ${unit}`}>
      <View style={styles.ring}>
        <Svg width={70} height={70} viewBox="0 0 70 70">
          <Defs>
            <LinearGradient id={id} x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor={c.from} />
              <Stop offset="1" stopColor={c.to} />
            </LinearGradient>
          </Defs>
          <Circle cx={35} cy={35} r={r} stroke="rgba(255,255,255,0.07)" strokeWidth={7} fill="none" />
          {len > 0 ? (
            <Circle
              cx={35}
              cy={35}
              r={r}
              stroke={`url(#${id})`}
              strokeWidth={7}
              fill="none"
              strokeLinecap="round"
              strokeDasharray={`${len} ${circ}`}
              transform="rotate(-90 35 35)"
            />
          ) : null}
        </Svg>
        <View style={styles.ringCenter}>
          <Text style={[styles.ringValue, { fontFamily: Fonts.displayBold }]}>
            {Math.round(value)}
            <Text style={styles.ringUnit}>{unit}</Text>
          </Text>
        </View>
      </View>
      <Text numberOfLines={1} style={styles.macroLabel}>
        {label}
      </Text>
    </View>
  );
}

function Count({ n }: { n: number }) {
  return (
    <View style={styles.count}>
      <Text style={styles.countText}>{n}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 20, paddingBottom: 140, maxWidth: 640, width: '100%', alignSelf: 'center' },
  header: { flexDirection: 'row', alignItems: 'flex-end', gap: 10 },
  eyebrow: { fontSize: 11, letterSpacing: 1.6, color: TileText.muted, fontFamily: Fonts.sansSemibold },
  title: { fontSize: 30, letterSpacing: -0.5, color: TileText.primary, marginTop: 4 },
  help: { flexDirection: 'row', alignItems: 'center', gap: 6, height: 40, paddingHorizontal: 12 },
  helpText: { fontSize: 12, color: TileText.primary, fontFamily: Fonts.sansSemibold },
  macroCard: { marginTop: 20, paddingTop: 16, paddingBottom: 12, paddingHorizontal: 10 },
  macroRow: { flexDirection: 'row' },
  macro: { flex: 1, alignItems: 'center', gap: 4 },
  ring: { width: 70, height: 70 },
  ringCenter: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  ringValue: { fontSize: 17, color: TileText.primary },
  ringUnit: { fontSize: 11, color: TileText.secondary },
  macroLabel: { fontSize: 12, color: TileText.secondary, fontFamily: Fonts.sansMedium },
  setTargets: { marginTop: 20, flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
  setTargetsText: { flex: 1, fontSize: 14, lineHeight: 19, color: TileText.primary, fontFamily: Fonts.sansSemibold },
  kcal: { marginTop: 10, textAlign: 'center', fontSize: 12, color: TileText.muted, fontFamily: Fonts.sans },
  waterCard: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, paddingHorizontal: 8 },
  drop: { width: 24, height: 34, alignItems: 'center', justifyContent: 'center' },
  waterSub: { marginTop: 8, fontSize: 12, color: TileText.muted, fontFamily: Fonts.sans, textAlign: 'right' },
  row4: { flexDirection: 'row', gap: 10 },
  row3: { flexDirection: 'row', gap: 10 },
  count: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    paddingHorizontal: 5,
    backgroundColor: 'rgba(255,255,255,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  countText: { fontSize: 11, color: TileText.primary, fontFamily: Fonts.sansBold },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  recipe: { width: '48.5%', minHeight: 92, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 10 },
  cover: { width: 40, height: 40, borderRadius: 13 },
  recipeTitle: { flex: 1, fontSize: 13, lineHeight: 17, color: TileText.primary, fontFamily: Fonts.sansSemibold },
});
