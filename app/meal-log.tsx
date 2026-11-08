import { useLocalSearchParams, useRouter } from 'expo-router';
import { Camera, Check, Mic, Plus, ScanBarcode, Search } from 'lucide-react-native';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { ActionBar, BFont, Bby, Card, Editorial, PillButton, PillTabs } from '@/components/bby/kit';
import { FooterScreen, NavHeader, SoonModal } from '@/components/bby/nutrition/ui';
import { useAuth } from '@/lib/auth-provider';
import { addLogItem, fetchRecentItems, type LogItem } from '@/lib/nutrition/day-log';
import { useRecipeFavorites } from '@/lib/nutrition/favorites';
import { fold, searchFoods, useFoods } from '@/lib/nutrition/foods';
import { currentMeal, MEALS, plg, shortDate } from '@/lib/nutrition/format';
import { kcalOf } from '@/lib/nutrition/targets';
import type { MealType, Recipe } from '@/lib/types';
import { useRecipes } from '@/lib/use-content';

type Tab = 'recent' | 'favorites' | 'mine';
type Row = LogItem & { key: string };

// Écran 3 — Noter mon repas (mode suivi). « + » ajoute une portion au repas visé.
export default function MealLogScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const { user } = useAuth();
  const params = useLocalSearchParams<{ type?: string }>();
  const meal: MealType = (MEALS as string[]).includes(params.type ?? '') ? (params.type as MealType) : currentMeal();

  const foods = useFoods();
  const { recipes } = useRecipes('all');
  const { ids: favIds } = useRecipeFavorites();
  const [query, setQuery] = useState('');
  const [tab, setTab] = useState<Tab>('recent');
  const [recent, setRecent] = useState<Row[]>([]);
  const [added, setAdded] = useState<Record<string, number>>({});
  const [soon, setSoon] = useState<null | 'barcode' | 'photo'>(null);
  const input = useRef<TextInput>(null);

  useEffect(() => {
    if (!user) return;
    fetchRecentItems(user.id).then((list) => setRecent(list.map((r, i) => ({ ...r, key: `r${i}` }))));
  }, [user]);

  const recipeRow = (r: Recipe): Row => ({
    key: `rec-${r.id}`,
    title: r.title,
    quantityLabel: t('v2nutrition.log.onePortion'),
    protein: r.protein_g ?? 0,
    fat: r.fat_g ?? 0,
    carb: r.carbs_g ?? 0,
    kcal: r.kcal ?? kcalOf(r.protein_g ?? 0, r.fat_g ?? 0, r.carbs_g ?? 0),
    recipeId: r.id,
  });

  const mine = useMemo(() => recipes.filter((r) => r.owner_id && r.owner_id === user?.id), [recipes, user?.id]);

  const rows: Row[] = useMemo(() => {
    if (query.trim()) {
      const q = fold(query);
      const fromFoods: Row[] = searchFoods(foods, query).map((f) => ({
        key: `f-${f.id}`,
        title: f.label,
        quantityLabel: f.portion,
        protein: f.protein_g,
        fat: f.fat_g,
        carb: f.carb_g,
        kcal: f.kcal,
      }));
      // Recettes de la cliente (les siennes et les BBY) dont le nom contient la recherche.
      const fromRecipes = recipes.filter((r) => fold(r.title).includes(q)).slice(0, 10).map(recipeRow);
      return [...fromRecipes, ...fromFoods];
    }
    if (tab === 'favorites') return recipes.filter((r) => favIds.has(r.id)).map(recipeRow);
    if (tab === 'mine') return mine.map(recipeRow);
    return recent;
  }, [query, foods, recipes, tab, favIds, mine, recent]); // eslint-disable-line react-hooks/exhaustive-deps

  const add = async (row: Row) => {
    if (!user) return;
    setAdded((a) => ({ ...a, [row.key]: (a[row.key] ?? 0) + 1 }));
    try {
      await addLogItem(user.id, meal, row);
    } catch (e: any) {
      setAdded((a) => ({ ...a, [row.key]: Math.max(0, (a[row.key] ?? 1) - 1) }));
      Alert.alert(t('v2nutrition.common.error'), e?.message ?? '');
    }
  };

  const emptyText =
    query.trim()
      ? t('v2nutrition.log.noResult')
      : tab === 'favorites'
        ? t('v2nutrition.log.emptyFavorites')
        : tab === 'mine'
          ? t('v2nutrition.log.emptyMine')
          : t('v2nutrition.log.emptyRecent');

  return (
    <FooterScreen footer={<ActionBar label={t('v2nutrition.common.done')} onPress={() => router.back()} />}>
      <NavHeader right={<Text style={s.date}>{shortDate(new Date(), i18n.language)}</Text>} />
      <Text style={s.title}>{t('v2nutrition.log.title')}</Text>
      <Text style={s.for}>{t(`v2nutrition.log.for.${meal}`)}</Text>

      <View style={s.search}>
        <Search size={18} color={Bby.muted} />
        <TextInput
          ref={input}
          value={query}
          onChangeText={setQuery}
          placeholder={t('v2nutrition.log.searchPlaceholder')}
          placeholderTextColor={Bby.muted}
          style={s.searchInput}
          autoCorrect={false}
          returnKeyType="search"
          accessibilityLabel={t('v2nutrition.log.searchPlaceholder')}
        />
        {/* La dictée passe par le clavier du téléphone : le micro ouvre le champ. */}
        <Pressable onPress={() => input.current?.focus()} style={s.mic} accessibilityRole="button" accessibilityLabel={t('v2nutrition.log.dictation')}>
          <Mic size={18} color={Bby.text} />
        </Pressable>
      </View>

      <View style={s.row8}>
        <PillButton label={t('v2nutrition.log.barcode')} icon={ScanBarcode} variant="outline" style={s.half} onPress={() => setSoon('barcode')} />
        <PillButton label={t('v2nutrition.log.photo')} icon={Camera} variant="outline" style={s.half} onPress={() => setSoon('photo')} />
      </View>

      {!query.trim() ? (
        <PillTabs
          items={[
            { key: 'recent', label: t('v2nutrition.log.tabs.recent') },
            { key: 'favorites', label: t('v2nutrition.log.tabs.favorites') },
            { key: 'mine', label: t('v2nutrition.log.tabs.mine') },
          ]}
          value={tab}
          onChange={setTab}
        />
      ) : null}

      {rows.map((r) => {
        const n = added[r.key] ?? 0;
        return (
          <Card key={r.key} style={s.rowCard}>
            <View style={s.rowBetween}>
              <View style={{ flex: 1 }}>
                <Text style={s.name} numberOfLines={2}>
                  {r.title}
                </Text>
                <Text style={s.meta}>{[r.quantityLabel, plg(t, r.protein, r.fat, r.carb)].filter(Boolean).join(' · ')}</Text>
              </View>
              <Pressable
                onPress={() => add(r)}
                accessibilityRole="button"
                accessibilityLabel={t('v2nutrition.log.addA11y', { name: r.title })}
                style={({ pressed }) => [s.plus, n > 0 && s.plusOn, pressed && { transform: [{ scale: 0.92 }] }]}
              >
                {n > 0 ? (
                  n > 1 ? <Text style={s.count}>{`×${n}`}</Text> : <Check size={18} color={Bby.ink} strokeWidth={2.6} />
                ) : (
                  <Plus size={18} color={Bby.text} />
                )}
              </Pressable>
            </View>
          </Card>
        );
      })}
      {rows.length === 0 ? <Text style={s.empty}>{emptyText}</Text> : null}

      <Editorial style={s.editorial}>{t('v2nutrition.log.editorial')}</Editorial>

      <SoonModal
        visible={soon !== null}
        onClose={() => setSoon(null)}
        body={soon === 'barcode' ? t('v2nutrition.soon.barcode') : t('v2nutrition.soon.photo')}
      />
    </FooterScreen>
  );
}

const s = StyleSheet.create({
  date: { fontFamily: BFont.sans, fontSize: 14, color: Bby.muted },
  title: { fontFamily: BFont.display, fontSize: 36, lineHeight: 41, color: Bby.text, letterSpacing: -0.8, marginTop: 10 },
  for: { fontFamily: BFont.sans, fontSize: 15, color: Bby.muted, marginBottom: 8 },
  search: {
    height: 56,
    borderRadius: 28,
    backgroundColor: Bby.card,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 18,
    paddingRight: 6,
    gap: 10,
  },
  searchInput: { flex: 1, fontFamily: BFont.sans, fontSize: 16, color: Bby.text, height: 56 },
  mic: { width: 44, height: 44, borderRadius: 22, backgroundColor: Bby.cardAlt, alignItems: 'center', justifyContent: 'center' },
  row8: { flexDirection: 'row', gap: 8 },
  half: { flex: 1, height: 48, paddingHorizontal: 10 },
  rowCard: { paddingVertical: 14, paddingHorizontal: 18 },
  rowBetween: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  name: { fontFamily: BFont.sansSemibold, fontSize: 15, color: Bby.text },
  meta: { fontFamily: BFont.sans, fontSize: 12, color: Bby.muted, marginTop: 3 },
  plus: { width: 44, height: 44, borderRadius: 22, borderWidth: 1.5, borderColor: Bby.line, alignItems: 'center', justifyContent: 'center' },
  plusOn: { backgroundColor: Bby.yellow, borderColor: 'transparent' },
  count: { fontFamily: BFont.sansBold, fontSize: 14, color: Bby.ink },
  empty: { fontFamily: BFont.sans, fontSize: 14, color: Bby.muted, textAlign: 'center', paddingVertical: 16 },
  editorial: { fontSize: 16, lineHeight: 22, color: Bby.muted, marginTop: 8 },
});
