// Vue « Aujourd'hui » de l'onglet Nutrition : écran 1 (sans suivi) et écran 2 (avec suivi).
import { useFocusEffect, useRouter } from 'expo-router';
import { Droplet, Plus } from 'lucide-react-native';
import { ArrowRight } from '@/lib/rtl-icons';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Pressable, StyleSheet, View } from 'react-native';
import { Text } from '@/components/ui/text';

import { BFont, Bby, Card, Editorial, MacroTiles, onTone, PillButton, RoundButton, SectionHeader } from '@/components/bby/kit';
import { useDayLog, type LogEntry } from '@/lib/nutrition/day-log';
import { currentMeal, dayIndex, fmtInt, liters, mealLabel, MEALS, plg, recipeMeta, round, shortDate } from '@/lib/nutrition/format';
import { PLATES } from '@/lib/nutrition/plate';
import { useNutritionPrefs } from '@/lib/nutrition/prefs';
import { useDayTargets } from '@/lib/nutrition/targets';
import type { MealType } from '@/lib/types';
import { useMenu } from '@/lib/use-meal-plan';

import { PlateChart, RecipeCard } from './ui';

export type GoSection = (section: 'today' | 'recettes' | 'menu' | 'courses', filter?: MealType) => void;

function useMacroLabels(): [string, string, string] {
  const { t } = useTranslation();
  return [t('v2nutrition.macro.protein'), t('v2nutrition.macro.fat'), t('v2nutrition.macro.carb')];
}

// ---------------------------------------------------------------------------
// Écran 1 — sans suivi

export function TodayPlain({ go }: { go: GoSection }) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const router = useRouter();
  const labels = useMacroLabels();
  const { targets, refresh: refreshTargets } = useDayTargets();
  const { showCalories, rhythm } = useNutritionPrefs();
  const { items, refresh } = useMenu();

  useFocusEffect(
    useCallback(() => {
      refresh();
      refreshTargets();
    }, [refresh, refreshTargets]),
  );

  const today = new Date();
  const di = dayIndex(today);
  const now = currentMeal(today);

  return (
    <>
      <SectionHeader title={t('v2nutrition.today.plainTitle')} right={shortDate(today, lang)} />
      <MacroTiles labels={labels} values={targets ? [targets.protein, targets.fat, targets.carb] : ['—', '—', '—']} />
      {targets && showCalories ? (
        <Text style={s.small}>{t('v2nutrition.today.kcalPlain', { kcal: fmtInt(targets.kcal, lang) })}</Text>
      ) : null}
      {!targets ? (
        <Pressable onPress={() => router.push('/edit-profile' as any)} hitSlop={8}>
          <Text style={[s.small, s.link]}>{t('v2nutrition.today.noTargets')}</Text>
        </Pressable>
      ) : null}

      <PlateSummary rhythm={rhythm} onPress={() => router.push('/nutrition/plate' as any)} />

      <SectionHeader title={t('v2nutrition.today.meals')} right={t('v2nutrition.today.myMenu')} onRight={() => go('menu')} />
      {MEALS.map((m) => {
        const it = items.find((x) => x.day === di && x.meal_type === m && x.recipe);
        if (!it?.recipe) {
          return <ChooseMealCard key={m} label={mealLabel(t, m)} onPress={() => go('recettes', m)} />;
        }
        const light = m === now;
        return (
          <RecipeCard
            key={m}
            tone={light ? 'light' : 'dark'}
            label={mealLabel(t, m)}
            title={it.recipe.title}
            meta={recipeMeta(t, it.recipe)}
            cover={it.recipe.cover_url}
            onPress={() => router.push(`/recipe/${it.recipe_id}` as any)}
            right={light ? <RoundButton icon={ArrowRight} variant="black" size={44} onPress={() => router.push(`/recipe/${it.recipe_id}` as any)} label={it.recipe.title} /> : undefined}
          />
        );
      })}
      {items.length === 0 ? (
        <PillButton label={t('v2nutrition.today.prepareWeek')} variant="outline" onPress={() => go('menu')} />
      ) : null}
      <Text style={s.small}>{t('v2nutrition.common.legend')}</Text>

      <Card>
        <View style={s.row}>
          <View style={s.dropCircle}>
            <Droplet size={20} color={Bby.text} strokeWidth={1.8} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.waterTitle}>
              {t('v2nutrition.today.waterAbout', { l: liters(targets?.waterMl ?? 2000, lang, 0.5) })}
            </Text>
            <Text style={s.waterSub}>{t('v2nutrition.today.waterRhythm')}</Text>
          </View>
        </View>
      </Card>
    </>
  );
}

function ChooseMealCard({ label, onPress }: { label: string; onPress: () => void }) {
  const { t } = useTranslation();
  return (
    <Card dashed onPress={onPress} style={{ padding: 12 }}>
      <View style={s.row}>
        <View style={s.plusFrame}>
          <Plus size={24} color={Bby.text} strokeWidth={1.8} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.label}>{label}</Text>
          <Text style={s.mealTitle}>{t('v2nutrition.today.chooseMeal')}</Text>
        </View>
      </View>
    </Card>
  );
}

/** Carte « Ton assiette » placée entre les repères et les repas. */
export function PlateSummary({ rhythm, onPress }: { rhythm: keyof typeof PLATES; onPress: () => void }) {
  const { t } = useTranslation();
  return (
    <Card onPress={onPress} style={{ padding: 16 }}>
      <View style={s.row}>
        <PlateChart plate={PLATES[rhythm]} size={92} />
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={s.plateTitle} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75}>
            {t('v2nutrition.plate.cardTitle')}
          </Text>
          <Text style={s.label}>{t('v2nutrition.plate.rhythmLine', { rhythm: t(`v2nutrition.rhythm.${rhythm}.title`) })}</Text>
          <Editorial style={s.plateSentence}>{t(`v2nutrition.rhythm.${rhythm}.plate`)}</Editorial>
        </View>
        <RoundButton icon={ArrowRight} variant="outline" size={40} onPress={onPress} label={t('v2nutrition.plate.cardTitle')} />
      </View>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Écran 2 — avec suivi

export function TodayTracked() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const router = useRouter();
  const labels = useMacroLabels();
  const { targets, refresh: refreshTargets } = useDayTargets();
  const { showCalories } = useNutritionPrefs();
  const { entries, waterMl, refresh, addWater, removeEntry } = useDayLog();

  useFocusEffect(
    useCallback(() => {
      refresh();
      refreshTargets();
    }, [refresh, refreshTargets]),
  );

  const today = new Date();
  const now = currentMeal(today);
  const sum = (list: LogEntry[], k: 'protein_g' | 'fat_g' | 'carbs_g' | 'kcal') => list.reduce((a, e) => a + (e[k] ?? 0), 0);
  const P = sum(entries, 'protein_g');
  const L = sum(entries, 'fat_g');
  const G = sum(entries, 'carbs_g');
  const K = sum(entries, 'kcal');
  const g = t('v2nutrition.common.g');

  const water = async (ml: number) => {
    try {
      await addWater(ml);
    } catch (e: any) {
      Alert.alert(t('v2nutrition.common.error'), e?.message ?? '');
    }
  };

  const askRemove = (e: LogEntry) =>
    Alert.alert(t('v2nutrition.journal.removeTitle'), e.title ?? '', [
      { text: t('v2nutrition.common.cancel'), style: 'cancel' },
      {
        text: t('v2nutrition.journal.remove'),
        style: 'destructive',
        onPress: () => removeEntry(e.id).catch((err) => Alert.alert(t('v2nutrition.common.error'), err?.message ?? '')),
      },
    ]);

  return (
    <>
      <View style={s.headRow}>
        <Text style={s.headTitle}>{t('v2nutrition.today.trackedTitle')}</Text>
        <Text style={s.headRight}>{t('v2nutrition.today.trackedSub', { date: shortDate(today, lang) })}</Text>
      </View>
      <MacroTiles
        labels={labels}
        values={[round(P), round(L), round(G)]}
        subs={
          targets
            ? [
                t('v2nutrition.today.landmark', { v: targets.protein, u: g }),
                t('v2nutrition.today.landmark', { v: targets.fat, u: g }),
                t('v2nutrition.today.landmark', { v: targets.carb, u: g }),
              ]
            : undefined
        }
      />
      {showCalories ? (
        <Text style={s.small}>
          {targets
            ? t('v2nutrition.today.kcalTracked', { kcal: fmtInt(K, lang), target: fmtInt(targets.kcal, lang) })
            : t('v2nutrition.common.kcal', { kcal: fmtInt(K, lang) })}
        </Text>
      ) : null}

      <SectionHeader title={t('v2nutrition.journal.title')} right={shortDate(today, lang)} />
      {MEALS.map((m) => {
        const list = entries.filter((e) => e.meal_type === m);
        const open = () => router.push(`/meal-log?type=${m}` as any);
        if (!list.length) {
          return (
            <Card key={m} dashed onPress={open} style={{ paddingVertical: 18 }}>
              <View style={s.rowBetween}>
                <Text style={s.journalMeal}>{mealLabel(t, m)}</Text>
                <View style={s.row6}>
                  <Plus size={16} color={Bby.text} />
                  <Text style={s.noteShort}>{t('v2nutrition.journal.noteShort')}</Text>
                </View>
              </View>
            </Card>
          );
        }
        const tone = m === now ? 'light' : 'dark';
        const c = onTone(tone);
        return (
          <Card key={m} tone={tone} style={{ paddingBottom: 6 }}>
            <View style={s.rowBetween}>
              <Text style={[s.journalMeal, { color: c.text }]}>{mealLabel(t, m)}</Text>
              {showCalories ? (
                <Text style={[s.kcalSmall, { color: c.muted }]}>{t('v2nutrition.common.kcal', { kcal: fmtInt(sum(list, 'kcal'), lang) })}</Text>
              ) : null}
            </View>
            <View style={{ gap: 6, marginTop: 10 }}>
              {list.map((e) => (
                <Pressable key={e.id} onLongPress={() => askRemove(e)} delayLongPress={350} style={s.rowBetween}>
                  <Text style={[s.entry, { color: c.text }]} numberOfLines={2}>
                    {e.title ?? '—'}
                  </Text>
                  {e.quantity_label ? <Text style={[s.qty, { color: c.muted }]}>{e.quantity_label}</Text> : null}
                </Pressable>
              ))}
            </View>
            <Text style={[s.plg, { color: c.muted }]}>{plg(t, sum(list, 'protein_g'), sum(list, 'fat_g'), sum(list, 'carbs_g'))}</Text>
            <Pressable onPress={open} style={s.noteRow} accessibilityRole="button">
              <Plus size={16} color={c.text} />
              <Text style={[s.noteText, { color: c.text }]}>{t('v2nutrition.journal.note')}</Text>
            </Pressable>
          </Card>
        );
      })}

      <Card tone="alt">
        <View style={s.row}>
          <View style={s.dropCircle}>
            <Droplet size={20} color={Bby.text} strokeWidth={1.8} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.waterTitle}>{t('v2nutrition.common.liters', { l: liters(waterMl, lang) })}</Text>
            <Text style={s.waterSub}>
              {t('v2nutrition.today.waterTracked', { l: liters(targets?.waterMl ?? 2000, lang, 0.5) })}
            </Text>
          </View>
        </View>
        <View style={[s.row8, { marginTop: 14 }]}>
          <PillButton label={t('v2nutrition.today.add20')} variant="outline" style={{ flex: 1, height: 46 }} onPress={() => water(200)} />
          <PillButton label={t('v2nutrition.today.add50')} variant="outline" style={{ flex: 1, height: 46 }} onPress={() => water(500)} />
        </View>
      </Card>
    </>
  );
}

const s = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  row6: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  row8: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  small: { fontFamily: BFont.sans, fontSize: 13, color: Bby.muted },
  link: { textDecorationLine: 'underline', color: Bby.text },
  label: { fontFamily: BFont.sans, fontSize: 13, color: Bby.muted },
  mealTitle: { fontFamily: BFont.display, fontSize: 18, color: Bby.text },
  plusFrame: { width: 72, height: 72, borderRadius: 18, borderWidth: 1.5, borderColor: Bby.line, alignItems: 'center', justifyContent: 'center' },
  plateTitle: { fontFamily: BFont.display, fontSize: 20, color: Bby.text },
  plateSentence: { fontSize: 15, lineHeight: 20, marginTop: 4 },
  dropCircle: { width: 44, height: 44, borderRadius: 22, borderWidth: 1.5, borderColor: Bby.line, alignItems: 'center', justifyContent: 'center' },
  waterTitle: { fontFamily: BFont.display, fontSize: 20, color: Bby.text },
  waterSub: { fontFamily: BFont.sans, fontSize: 13, color: Bby.muted, marginTop: 2 },
  headRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'baseline', justifyContent: 'space-between', columnGap: 10, marginTop: 18, marginBottom: 4 },
  headTitle: { fontFamily: BFont.display, fontSize: 24, color: Bby.text, letterSpacing: -0.3 },
  headRight: { fontFamily: BFont.sans, fontSize: 14, color: Bby.muted, flexShrink: 1 },
  journalMeal: { fontFamily: BFont.display, fontSize: 18, color: Bby.text },
  kcalSmall: { fontFamily: BFont.sans, fontSize: 13 },
  entry: { fontFamily: BFont.sansMedium, fontSize: 15, flex: 1 },
  qty: { fontFamily: BFont.sans, fontSize: 13 },
  plg: { fontFamily: BFont.sans, fontSize: 12, marginTop: 10 },
  noteRow: { flexDirection: 'row', alignItems: 'center', gap: 8, height: 44 },
  noteText: { fontFamily: BFont.sansMedium, fontSize: 15 },
  noteShort: { fontFamily: BFont.sansMedium, fontSize: 15, color: Bby.text },
});
