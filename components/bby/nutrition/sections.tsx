// Vues Recettes (écran 5), Menu (écran 8) et Courses (écran 9) de l'onglet Nutrition.
import { useFocusEffect, useRouter } from 'expo-router';
import { Plus, RefreshCw } from 'lucide-react-native';
import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import {
  BFont,
  Bby,
  Card,
  CheckCircle,
  Editorial,
  onTone,
  PillButton,
  PillTabs,
  RoundButton,
  TiltCard,
  WeekStrip,
  isoDay,
  weekOf,
} from '@/components/bby/kit';
import { useAuth } from '@/lib/auth-provider';
import { AISLES, formatNumber, formatShoppingQuantity } from '@/lib/ingredients';
import { currentMeal, dayIndex, longDate, mealLabel, MEALS, plg, recipeMeta, weekLetters } from '@/lib/nutrition/format';
import { alternativeFor, regenerateWeek, setSlot } from '@/lib/nutrition/menu';
import { useShopping, type ShoppingRow } from '@/lib/nutrition/shopping';
import type { MealType } from '@/lib/types';
import { useRecipes } from '@/lib/use-content';
import { useIngredientNames } from '@/lib/use-ingredient-names';
import { useMenu } from '@/lib/use-meal-plan';

import type { GoSection } from './today';
import { Field, FieldLabel, RecipeCard } from './ui';

// ---------------------------------------------------------------------------
// Écran 5 — Bibliothèque de recettes

export type RecipeFilter = 'all' | MealType | 'mine';

export function RecipesSection({ filter, setFilter }: { filter: RecipeFilter; setFilter: (f: RecipeFilter) => void }) {
  const { t } = useTranslation();
  const router = useRouter();
  const { user } = useAuth();
  const { recipes, refresh, loading } = useRecipes('all');

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  const list = useMemo(() => {
    if (filter === 'all') return recipes;
    if (filter === 'mine') return recipes.filter((r) => r.owner_id && r.owner_id === user?.id);
    return recipes.filter((r) => r.meal_type === filter);
  }, [recipes, filter, user?.id]);

  // Mise en avant : la première recette qui correspond au repas du moment.
  const now = currentMeal();
  const featured = list.find((r) => r.meal_type === now)?.id;

  const filters: { key: RecipeFilter; label: string }[] = [
    { key: 'all', label: t('v2nutrition.recipes.filter.all') },
    { key: 'petit_dejeuner', label: t('v2nutrition.recipes.filter.petit_dejeuner') },
    { key: 'dejeuner', label: t('v2nutrition.recipes.filter.dejeuner') },
    { key: 'diner', label: t('v2nutrition.recipes.filter.diner') },
    { key: 'collation', label: t('v2nutrition.recipes.filter.collation') },
    { key: 'mine', label: t('v2nutrition.recipes.filter.mine') },
  ];

  return (
    <>
      <TiltCard>
        <Text style={s.tiltTitle}>{t('v2nutrition.recipes.tiltTitle')}</Text>
        <Editorial dark style={{ marginTop: 6 }}>
          {t('v2nutrition.recipes.tiltText')}
        </Editorial>
        <PillButton
          label={t('v2nutrition.recipes.create')}
          icon={Plus}
          variant="black"
          style={{ alignSelf: 'flex-start', marginTop: 16 }}
          onPress={() => router.push('/my-recipe-edit' as any)}
        />
      </TiltCard>
      <PillTabs items={filters} value={filter} onChange={setFilter} activeYellow />
      {list.map((r) => {
        const mine = !!r.owner_id && r.owner_id === user?.id;
        const label = [mealLabel(t, r.meal_type), mine ? t('v2nutrition.recipes.mine') : ''].filter(Boolean).join(' · ');
        return (
          <RecipeCard
            key={r.id}
            tone={r.id === featured ? 'light' : 'dark'}
            label={label}
            title={r.title}
            meta={recipeMeta(t, r)}
            cover={r.cover_url}
            onPress={() => router.push(`/recipe/${r.id}` as any)}
          />
        );
      })}
      {!loading && list.length === 0 ? (
        <Card>
          <Text style={s.empty}>{filter === 'mine' ? t('v2nutrition.recipes.emptyMine') : t('v2nutrition.recipes.empty')}</Text>
        </Card>
      ) : null}
    </>
  );
}

// ---------------------------------------------------------------------------
// Écran 8 — Menu de la semaine

export function MenuSection({ go }: { go: GoSection }) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const router = useRouter();
  const { user } = useAuth();
  const { items, refresh, clear } = useMenu();
  const { recipes, refresh: refreshRecipes } = useRecipes('all');
  const [busy, setBusy] = useState(false);

  useFocusEffect(
    useCallback(() => {
      refresh();
      refreshRecipes();
    }, [refresh, refreshRecipes]),
  );

  const today = new Date();
  const days = weekOf(today, weekLetters(lang));
  const [selected, setSelected] = useState(isoDay(today));
  const sel = days.find((d) => d.key === selected) ?? days[dayIndex(today)];
  const di = days.indexOf(sel);
  const isToday = sel.key === isoDay(today);
  const now = currentMeal(today);

  const fail = (e: any) => Alert.alert(t('v2nutrition.common.error'), e?.message ?? '');

  const runRegenerate = async () => {
    if (!user) return;
    setBusy(true);
    try {
      const n = await regenerateWeek(user.id, recipes);
      if (n === 0) Alert.alert(t('v2nutrition.menu.noRecipesTitle'), t('v2nutrition.menu.noRecipesBody'));
      await refresh();
    } catch (e) {
      fail(e);
    } finally {
      setBusy(false);
    }
  };

  const onRegenerate = () => {
    if (busy) return;
    if (!items.length) return runRegenerate();
    Alert.alert(t('v2nutrition.menu.regenTitle'), t('v2nutrition.menu.regenBody'), [
      { text: t('v2nutrition.common.cancel'), style: 'cancel' },
      { text: t('v2nutrition.menu.regenerate'), onPress: runRegenerate },
    ]);
  };

  const onCompose = () => {
    if (!items.length) {
      Alert.alert(t('v2nutrition.menu.composeTitle'), t('v2nutrition.menu.composeEmpty'));
      return;
    }
    Alert.alert(t('v2nutrition.menu.composeTitle'), t('v2nutrition.menu.composeBody'), [
      { text: t('v2nutrition.common.cancel'), style: 'cancel' },
      { text: t('v2nutrition.menu.compose'), onPress: () => clear().catch(fail) },
    ]);
  };

  const pick = (m: MealType) => router.push(`/menu-pick?day=${di}&meal=${m}` as any);

  const swap = (m: MealType, currentId: string) => {
    const other = () => {
      const alt = alternativeFor(recipes, m, currentId);
      if (!alt || !user) {
        Alert.alert(t('v2nutrition.menu.noAltTitle'), t('v2nutrition.menu.noAltBody'));
        return;
      }
      setSlot(user.id, di, m, alt.id, items).then(refresh).catch(fail);
    };
    Alert.alert(t('v2nutrition.menu.swapTitle'), mealLabel(t, m), [
      { text: t('v2nutrition.common.cancel'), style: 'cancel' },
      { text: t('v2nutrition.menu.swapPick'), onPress: () => pick(m) },
      { text: t('v2nutrition.menu.swapOther'), onPress: other },
    ]);
  };

  return (
    <>
      <WeekStrip days={days} selected={sel.key} onSelect={setSelected} boxed />
      <TiltCard>
        <Text style={s.tiltTitle}>{t('v2nutrition.menu.tiltTitle')}</Text>
        <Editorial dark style={{ marginTop: 6 }}>
          {t('v2nutrition.menu.tiltText')}
        </Editorial>
        <View style={[s.row8, { marginTop: 16 }]}>
          <PillButton label={t('v2nutrition.menu.regenerate')} variant="black" style={{ flex: 1 }} onPress={onRegenerate} />
          <PillButton label={t('v2nutrition.menu.compose')} variant="outlineDark" style={{ flex: 1 }} onPress={onCompose} />
        </View>
      </TiltCard>

      <Text style={s.dayTitle}>{longDate(sel.date, lang)}</Text>
      {MEALS.map((m) => {
        const it = items.find((x) => x.day === di && x.meal_type === m && x.recipe);
        if (!it?.recipe) {
          return (
            <Card key={m} dashed onPress={() => pick(m)}>
              <Text style={s.slot}>{mealLabel(t, m)}</Text>
              <View style={s.row6}>
                <Plus size={16} color={Bby.text} />
                <Text style={s.slotName}>{t('v2nutrition.today.chooseMeal')}</Text>
              </View>
            </Card>
          );
        }
        const tone = isToday && m === now ? 'light' : 'dark';
        const c = onTone(tone);
        return (
          <Card key={m} tone={tone} onPress={() => router.push(`/recipe/${it.recipe_id}` as any)} style={{ paddingVertical: 16 }}>
            <View style={s.rowBetween}>
              <View style={{ flex: 1 }}>
                <Text style={[s.slot, { color: c.muted }]}>{mealLabel(t, m)}</Text>
                <Text style={[s.slotName, { color: c.text }]} numberOfLines={2}>
                  {it.recipe.title}
                </Text>
                <Text style={[s.slotMeta, { color: c.muted }]}>{plg(t, it.recipe.protein_g, it.recipe.fat_g, it.recipe.carbs_g)}</Text>
              </View>
              <RoundButton
                icon={RefreshCw}
                variant={tone === 'light' ? 'outlineDark' : 'outline'}
                size={44}
                label={t('v2nutrition.menu.swapTitle')}
                onPress={() => swap(m, it.recipe_id)}
              />
            </View>
          </Card>
        );
      })}
      <PillButton label={t('v2nutrition.menu.seeShopping')} variant="outline" onPress={() => go('courses')} />
    </>
  );
}

// ---------------------------------------------------------------------------
// Écran 9 — Liste de courses

export function ShoppingSection({ go }: { go: GoSection }) {
  const { t } = useTranslation();
  const { tr } = useIngredientNames();
  const { items, refresh, toggle, addManual, clear, loading } = useShopping();
  const [draft, setDraft] = useState('');

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  const done = items.filter((i) => i.checked).length;
  const groups = AISLES.map((a) => ({ aisle: a, rows: items.filter((i) => (i.aisle ?? 'autre') === a) })).filter((g) => g.rows.length);

  const add = async () => {
    const name = draft.trim();
    if (!name) return;
    setDraft('');
    try {
      await addManual(name);
    } catch (e: any) {
      Alert.alert(t('v2nutrition.common.error'), e?.message ?? '');
    }
  };

  const onClear = () =>
    Alert.alert(t('v2nutrition.shopping.clearTitle'), t('v2nutrition.shopping.clearBody'), [
      { text: t('v2nutrition.common.cancel'), style: 'cancel' },
      { text: t('v2nutrition.shopping.clear'), style: 'destructive', onPress: () => clear().catch(() => {}) },
    ]);

  const qty = (r: ShoppingRow) => {
    if (r.quantity === null) return null;
    // À l'unité, on achète des pièces entières : 1,5 avocat → × 2.
    if (!r.unit) return `× ${formatNumber(Math.ceil(Number(r.quantity) - 1e-9))}`;
    return formatShoppingQuantity(r.quantity, r.unit, t);
  };

  return (
    <>
      <TiltCard>
        <View style={s.rowBetween}>
          <Text style={[s.tiltTitle, { flex: 1 }]}>{t('v2nutrition.shopping.tiltTitle')}</Text>
          <Text style={s.counter} accessibilityLabel={t('v2nutrition.shopping.counterA11y', { done, total: items.length })}>
            {`${done} / ${items.length}`}
          </Text>
        </View>
        <Editorial dark style={{ marginTop: 6 }}>
          {t('v2nutrition.shopping.tiltText')}
        </Editorial>
      </TiltCard>

      {!loading && items.length === 0 ? (
        <Card>
          <Text style={s.empty}>{t('v2nutrition.shopping.empty')}</Text>
          <PillButton label={t('v2nutrition.today.myMenu')} variant="outline" style={{ marginTop: 14 }} onPress={() => go('menu')} />
        </Card>
      ) : null}

      {groups.map((g) => (
        <View key={g.aisle} style={{ gap: 10 }}>
          <FieldLabel caps>{t(`v2nutrition.aisle.${g.aisle}`)}</FieldLabel>
          {g.rows.map((r) => {
            const q = qty(r);
            const sub = r.manual
              ? t('v2nutrition.shopping.manual')
              : r.refs && r.refs > 1
                ? t('v2nutrition.shopping.fromRecipes', { count: r.refs })
                : null;
            return (
              <Pressable
                key={r.id}
                onPress={() => toggle(r)}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: r.checked }}
                style={[s.item, { backgroundColor: r.checked ? '#151514' : Bby.cardAlt }]}
              >
                <View style={{ flex: 1 }}>
                  <Text style={[s.itemName, r.checked && s.itemDone]} numberOfLines={2}>
                    {tr(r.name)}
                  </Text>
                  {sub ? <Text style={s.itemSub}>{sub}</Text> : null}
                </View>
                {q ? <Text style={s.itemQty}>{q}</Text> : null}
                <CheckCircle checked={r.checked} onPress={() => toggle(r)} />
              </Pressable>
            );
          })}
        </View>
      ))}

      <View style={[s.row8, { marginTop: 12 }]}>
        <Field
          style={{ flex: 1 }}
          value={draft}
          onChangeText={setDraft}
          placeholder={t('v2nutrition.shopping.addPlaceholder')}
          returnKeyType="done"
          onSubmitEditing={add}
        />
        <RoundButton icon={Plus} variant="yellow" size={52} onPress={add} label={t('v2nutrition.shopping.add')} />
      </View>
      {items.length > 0 ? <PillButton label={t('v2nutrition.shopping.clear')} variant="outline" onPress={onClear} /> : null}
    </>
  );
}

const s = StyleSheet.create({
  row6: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  row8: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  tiltTitle: { fontFamily: BFont.display, fontSize: 22, lineHeight: 27, color: Bby.ink, letterSpacing: -0.3 },
  counter: { fontFamily: BFont.display, fontSize: 30, color: Bby.ink },
  empty: { fontFamily: BFont.sans, fontSize: 15, lineHeight: 21, color: Bby.muted },
  dayTitle: { fontFamily: BFont.display, fontSize: 19, color: Bby.text, marginTop: 14, marginBottom: 2, letterSpacing: -0.3 },
  slot: { fontFamily: BFont.sans, fontSize: 13, color: Bby.muted },
  slotName: { fontFamily: BFont.sansSemibold, fontSize: 17, color: Bby.text, marginTop: 2 },
  slotMeta: { fontFamily: BFont.sans, fontSize: 13, marginTop: 4 },
  item: { minHeight: 56, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', gap: 12 },
  itemName: { fontFamily: BFont.sansMedium, fontSize: 15, color: Bby.text },
  itemDone: { textDecorationLine: 'line-through', color: Bby.muted },
  itemSub: { fontFamily: BFont.sans, fontSize: 12, color: Bby.muted, marginTop: 2 },
  itemQty: { fontFamily: BFont.sans, fontSize: 13, color: Bby.muted },
});
