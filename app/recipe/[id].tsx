import { Image } from 'expo-image';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { Bookmark, Camera, Pencil, Plus } from 'lucide-react-native';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { Text } from '@/components/ui/text';

import { ActionBar, BFont, Bby, Card, Chip, MacroTiles, RoundButton } from '@/components/bby/kit';
import { FooterScreen, NavHeader, Stepper } from '@/components/bby/nutrition/ui';
import { AttachmentCarousel } from '@/components/ui/attachment-carousel';
import { useAuth } from '@/lib/auth-provider';
import { formatNumber } from '@/lib/ingredients';
import { useRecipeFavorites } from '@/lib/nutrition/favorites';
import { fmtInt, hasMacros, mealLabel, unitLabel } from '@/lib/nutrition/format';
import { useNutritionPrefs } from '@/lib/nutrition/prefs';
import { kcalOf } from '@/lib/nutrition/targets';
import type { Recipe } from '@/lib/types';
import { useAttachments } from '@/lib/use-attachments';
import { useRecipe } from '@/lib/use-content';
import { useIngredientNames } from '@/lib/use-ingredient-names';
import { useRecipeIngredients } from '@/lib/use-meal-plan';

// Écran 6 — Une recette : photo, portions, macros par portion, ingrédients,
// préparation, et « Ajouter à mon menu » fixé en bas.
export default function RecipeScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const { user } = useAuth();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { recipe, loading, refresh } = useRecipe(id);
  const { ingredients, refresh: refreshIngredients } = useRecipeIngredients(id);
  const { items: attachments, refresh: refreshAttachments } = useAttachments('recipe', id);
  const { tr } = useIngredientNames();
  const { ids: favs, toggle } = useRecipeFavorites();
  const { showCalories } = useNutritionPrefs();

  const r = recipe as (Recipe & { servings?: number | null }) | null;
  const base = Math.max(1, r?.servings ?? 1);
  const [people, setPeople] = useState(base);
  useEffect(() => setPeople(base), [base]);

  useFocusEffect(
    useCallback(() => {
      refresh();
      refreshIngredients();
      refreshAttachments();
    }, [refresh, refreshIngredients, refreshAttachments]),
  );

  if (loading && !r) {
    return (
      <View style={[s.flex, s.center]}>
        <ActivityIndicator color={Bby.text} />
      </View>
    );
  }
  if (!r) {
    return (
      <View style={[s.flex, s.center, { padding: 22 }]}>
        <Text style={s.muted}>{t('v2nutrition.recipe.notFound')}</Text>
      </View>
    );
  }

  const mine = !!r.owner_id && r.owner_id === user?.id;
  const fav = favs.has(r.id);
  const factor = people / base;
  const steps = (r.steps ?? '')
    .split(/\n+/)
    .map((x) => x.replace(/^\s*\d+[.)-]?\s*/, '').trim())
    .filter(Boolean);
  const kcal = r.kcal ?? kcalOf(r.protein_g ?? 0, r.fat_g ?? 0, r.carbs_g ?? 0);

  return (
    <FooterScreen
      footer={
        <ActionBar
          icon={Plus}
          label={t('v2nutrition.recipe.addToMenu')}
          note={t('v2nutrition.recipe.addNote')}
          onPress={() => router.push(`/menu-add?recipe=${r.id}&meal=${r.meal_type ?? 'dejeuner'}` as any)}
        />
      }
    >
      <NavHeader
        right={
          <View style={s.row8}>
            {mine ? (
              <RoundButton icon={Pencil} variant="outline" size={48} label={t('v2nutrition.recipe.edit')} onPress={() => router.push(`/my-recipe-edit?id=${r.id}` as any)} />
            ) : null}
            <Pressable
              onPress={() => toggle(r.id)}
              accessibilityRole="button"
              accessibilityLabel={fav ? t('v2nutrition.recipe.unfavorite') : t('v2nutrition.recipe.favorite')}
              accessibilityState={{ selected: fav }}
              style={[s.fav, fav && { backgroundColor: Bby.yellow, borderColor: 'transparent' }]}
            >
              <Bookmark size={18} color={fav ? Bby.ink : Bby.text} fill={fav ? Bby.ink : 'transparent'} />
            </Pressable>
          </View>
        }
      />

      <View style={[s.photo, !r.cover_url && s.photoEmpty]}>
        {r.cover_url ? (
          <Image source={{ uri: r.cover_url }} style={StyleSheet.absoluteFill} contentFit="cover" />
        ) : (
          <View style={[s.center, { gap: 8 }]}>
            <Camera size={22} color={Bby.muted} />
            <Text style={s.photoHint}>{t('v2nutrition.recipe.photo')}</Text>
          </View>
        )}
      </View>

      <View style={[s.row8, { marginTop: 4 }]}>
        {r.meal_type ? <Chip label={mealLabel(t, r.meal_type)} /> : null}
        {r.prep_min ? <Chip label={t('v2nutrition.common.minutes', { n: r.prep_min })} /> : null}
        {mine ? <Chip label={t('v2nutrition.recipes.mine')} yellow /> : null}
      </View>
      <Text style={s.title}>{r.title}</Text>
      {r.description ? <Text style={s.desc}>{r.description}</Text> : null}

      <Stepper
        label={t('v2nutrition.common.people', { count: people })}
        onMinus={() => setPeople((p) => Math.max(1, p - 1))}
        onPlus={() => setPeople((p) => Math.min(20, p + 1))}
        minusDisabled={people <= 1}
      />

      {hasMacros(r) ? (
        <>
          <Text style={s.small}>{t('v2nutrition.recipe.perPortion')}</Text>
          <MacroTiles
            labels={[t('v2nutrition.macro.protein'), t('v2nutrition.macro.fat'), t('v2nutrition.macro.carb')]}
            values={[r.protein_g ?? 0, r.fat_g ?? 0, r.carbs_g ?? 0]}
          />
          {showCalories ? <Text style={s.small}>{t('v2nutrition.common.kcalAbout', { kcal: fmtInt(kcal, i18n.language) })}</Text> : null}
        </>
      ) : null}

      {ingredients.length > 0 || r.ingredients ? (
        <Card tone="light">
          <Text style={s.cardTitleDark}>{t('v2nutrition.recipe.ingredients')}</Text>
          {ingredients.length > 0 ? (
            ingredients.map((ing, i) => (
              <View key={ing.id} style={[s.ingRow, i > 0 && s.ingSep]}>
                <Text style={s.ingName}>{tr(ing.name)}</Text>
                <Text style={s.ingQty}>
                  {ing.quantity === null
                    ? ''
                    : `${formatNumber(Math.round(Number(ing.quantity) * factor * 100) / 100)}${ing.unit ? ` ${unitLabel(t, ing.unit)}` : ''}`}
                </Text>
              </View>
            ))
          ) : (
            <Text style={s.ingText}>{r.ingredients}</Text>
          )}
        </Card>
      ) : null}

      {steps.length > 0 ? (
        <Card>
          <Text style={s.cardTitle}>{t('v2nutrition.recipe.steps')}</Text>
          {steps.map((step, i) => (
            <View key={i} style={s.step}>
              <View style={s.stepNum}>
                <Text style={s.stepNumText}>{i + 1}</Text>
              </View>
              <Text style={s.stepText}>{step}</Text>
            </View>
          ))}
        </Card>
      ) : null}

      {attachments.length > 0 ? <AttachmentCarousel attachments={attachments} title={t('v2nutrition.recipe.videos')} /> : null}
    </FooterScreen>
  );
}

const s = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Bby.bg },
  center: { alignItems: 'center', justifyContent: 'center' },
  muted: { fontFamily: BFont.sans, fontSize: 15, color: Bby.muted },
  row8: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  fav: { width: 48, height: 48, borderRadius: 24, borderWidth: 1.5, borderColor: Bby.text, alignItems: 'center', justifyContent: 'center' },
  photo: { height: 200, borderRadius: 28, overflow: 'hidden', backgroundColor: Bby.card, alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  photoEmpty: { borderWidth: 1.5, borderStyle: 'dashed', borderColor: Bby.line },
  photoHint: { fontFamily: BFont.sans, fontSize: 13, color: Bby.muted },
  title: { fontFamily: BFont.display, fontSize: 30, lineHeight: 34, color: Bby.text, letterSpacing: -0.5, marginVertical: 4 },
  desc: { fontFamily: BFont.sans, fontSize: 15, lineHeight: 21, color: Bby.muted },
  small: { fontFamily: BFont.sans, fontSize: 13, color: Bby.muted, marginTop: 4 },
  cardTitleDark: { fontFamily: BFont.display, fontSize: 22, color: Bby.ink, marginBottom: 8 },
  cardTitle: { fontFamily: BFont.display, fontSize: 22, color: Bby.text, marginBottom: 8 },
  ingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 11, gap: 12 },
  ingSep: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: Bby.lineOnLight },
  ingName: { fontFamily: BFont.sans, fontSize: 15, color: Bby.ink, flex: 1 },
  ingQty: { fontFamily: BFont.sans, fontSize: 14, color: Bby.mutedOnLight },
  ingText: { fontFamily: BFont.sans, fontSize: 15, lineHeight: 24, color: Bby.ink },
  step: { flexDirection: 'row', gap: 12, alignItems: 'flex-start', paddingVertical: 8 },
  stepNum: { width: 28, height: 28, borderRadius: 14, backgroundColor: Bby.cardAlt, alignItems: 'center', justifyContent: 'center' },
  stepNumText: { fontFamily: BFont.sansBold, fontSize: 13, color: Bby.text },
  stepText: { fontFamily: BFont.sans, fontSize: 15, lineHeight: 22, color: Bby.text, flex: 1 },
});
